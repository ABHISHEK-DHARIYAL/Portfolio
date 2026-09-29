import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getBackendEnv } from "./env";

/**
 * Resume storage, via Cloudinary instead of Firebase Storage.
 *
 * Uploads are SIGNED and happen entirely server-side: the browser sends
 * the PDF bytes to our own /api/admin/resumes route (protected by
 * middleware.ts), which uploads to Cloudinary using the API secret. The
 * secret is read from getBackendEnv() and never leaves this file.
 *
 * PDFs are uploaded as `resource_type: "raw"` — Cloudinary's category
 * for arbitrary non-image/video files stored and served as-is.
 *
 * ---------------------------------------------------------------------
 * FIX 1: delivery URLs are SIGNED (show_original_customer_untrusted)
 * ---------------------------------------------------------------------
 * Cloudinary blocks the plain, unsigned delivery URL for raw files
 * (PDF/ZIP) on accounts it flags "untrusted" — the default for new
 * accounts, to prevent them being used to host arbitrary files. Signed
 * URLs (`sign_url: true`) bypass that regardless of account trust
 * status. See buildSignedDeliveryUrl() below.
 *
 * ---------------------------------------------------------------------
 * FIX 2: the extension is never manually appended, split, or re-applied
 * ---------------------------------------------------------------------
 * For a `resource_type: "raw"` upload with `format: "pdf"` specified,
 * Cloudinary returns a `public_id` that ALREADY includes the extension
 * — e.g. `result.public_id === "resumes/Abhishek-1699999999.pdf"`. That
 * is the asset's real, complete identifier for a raw resource; it is
 * not a base name with the format stored separately the way image
 * resources work.
 *
 * A previous version of this file didn't treat it that way: it stripped
 * the extension back off before storing it (assuming a "base name +
 * separate format" model), then passed `format: "pdf"` again when
 * building the delivery URL to reattach it. That was the actual bug —
 * confirmed against Cloudinary's own SDK behavior and support docs:
 * `cloudinary.url(publicId, { format })` ALWAYS APPENDS `.<format>`, it
 * never replaces an existing extension already present in `publicId`.
 * So a publicId that (after stripping) still needed `.pdf` reattached
 * via `format` worked — but the moment any inconsistency crept in
 * between what was stripped and what was reappended, or the stripped
 * value was reused somewhere `format` was also applied, the result was
 * `resumes/Abhishek.pdf.pdf` and a 404. Manually managing the extension
 * at all was the root problem, not a particular bug in how it was done.
 *
 * The fix: don't manipulate the extension AT ALL. `publicId` is stored
 * and used EXACTLY as Cloudinary's upload response returns it — already
 * complete, already correct. Building a delivery URL or deleting the
 * asset both just pass that exact string straight through, with no
 * `format` option and no string splitting/concatenation anywhere in
 * this file.
 */

let configured = false;

/** Configures the Cloudinary SDK on first use. Idempotent — cheap to call before every operation. */
function ensureConfigured() {
  if (configured) return;
  const env = getBackendEnv();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
    // The Node SDK appends an SDK-usage tracking query parameter
    // (?_a=...) to every generated URL by default (documented Cloudinary
    // behavior, not something this codebase added). It's supposed to be
    // harmless, but disabling it removes a variable and keeps delivery
    // URLs minimal — one less thing to rule out if delivery ever
    // misbehaves again.
    urlAnalytics: false,
  });
  configured = true;
}

const RAW_PDF_RESOURCE_OPTIONS = {
  resource_type: "raw" as const,
  type: "upload" as const,
};

export type CloudinaryUploadResult = {
  publicId: string;
  secureUrl: string;
};

/** Uploads a PDF's raw bytes to Cloudinary via a signed, server-side stream upload. */
export function uploadPdfToCloudinary(
  bytes: Buffer,
  fileName: string
): Promise<CloudinaryUploadResult> {
  ensureConfigured();

  const baseName = fileName.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  // A timestamp suffix guarantees every upload is a genuinely distinct
  // Cloudinary asset, even if two resumes share the same original
  // filename — required so resume history stays intact (each upload
  // must never overwrite a previous one).
  const explicitPublicId = `${baseName}-${Date.now()}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        ...RAW_PDF_RESOURCE_OPTIONS,
        folder: "resumes",
        public_id: explicitPublicId,
        format: "pdf",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result."));
          return;
        }
        // result.public_id is the asset's real, complete identifier for
        // this raw resource (extension included) — store and use it
        // exactly as returned. See FIX 2 above.
        resolve({
          publicId: result.public_id,
          secureUrl: buildSignedDeliveryUrl(result.public_id),
        });
      }
    );
    stream.end(bytes);
  });
}

/**
 * Builds a SIGNED delivery URL for a given public_id. Passes it straight
 * through with no modification and no `format` option — publicId is
 * already the complete identifier (see FIX 2 above), so adding `format`
 * here would append a second, duplicate extension.
 *
 * Exported (not just used internally by uploadPdfToCloudinary) so
 * firestore-resumes.ts can regenerate a fresh signed URL for any resume
 * by its stored publicId on every read.
 */
export function buildSignedDeliveryUrl(publicId: string): string {
  ensureConfigured();
  return cloudinary.url(publicId, {
    ...RAW_PDF_RESOURCE_OPTIONS,
    sign_url: true,
    secure: true,
  });
}

/** Deletes a previously uploaded PDF from Cloudinary by its exact public_id. */
export async function deletePdfFromCloudinary(publicId: string): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}
