import HexMark from "@/components/layout/HexMark";

// Shown by Next.js while a page / route is loading (navigation, buffering).
export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-base"
      role="status"
      aria-label="Loading"
    >
      <HexMark size={90} mode="pulse" />
    </div>
  );
}
