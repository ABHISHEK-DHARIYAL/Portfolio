"use client";

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="fixed left-4 top-4 z-[110] -translate-y-24 rounded-full bg-white px-4 py-2 font-body text-sm font-medium text-base transition-transform focus:translate-y-0"
    >
      Skip to content
    </a>
  );
}
