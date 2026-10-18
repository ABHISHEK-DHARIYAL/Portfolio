/**
 * Shared between the admin form (live preview) and the public "Coding
 * Profiles" section — one small abbreviation + color per platform, so the
 * two stay visually identical without duplicating logic.
 */

/**
 * The 1–3 letters shown inside a profile's icon badge.
 * Admin-set `shortLabel` always wins; otherwise it's derived from the
 * platform name — initials for multi-word names ("Code Chef" -> "CC"),
 * else the first two letters ("LeetCode" -> "LE").
 */
export function platformAbbr(platform: string, shortLabel?: string): string {
  const custom = shortLabel?.trim();
  if (custom) return custom.toUpperCase().slice(0, 3);
  const words = platform.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (platform.trim().slice(0, 2) || "?").toUpperCase();
}

/** A stable color per platform name, so the same platform always looks the same. */
const PALETTE = ["#7C3AED", "#3B82F6", "#22D3EE", "#F472B6", "#FACC15", "#34D399", "#FB923C"];

export function platformColor(platform: string): string {
  let hash = 0;
  for (let i = 0; i < platform.length; i++) hash = (hash * 31 + platform.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
