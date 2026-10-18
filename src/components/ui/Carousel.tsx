"use client";

import {
  Children,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useAnimation, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ResponsiveCount = { base: number; md?: number; lg?: number };

/** Tracks how many items should be visible per "page" at the current viewport width. */
function useItemsPerView(counts: ResponsiveCount) {
  const [perView, setPerView] = useState(counts.base);

  useEffect(() => {
    const mdQuery = window.matchMedia("(min-width: 768px)");
    const lgQuery = window.matchMedia("(min-width: 1024px)");

    const update = () => {
      if (lgQuery.matches && counts.lg) setPerView(counts.lg);
      else if (mdQuery.matches && counts.md) setPerView(counts.md);
      else setPerView(counts.base);
    };

    update();
    mdQuery.addEventListener("change", update);
    lgQuery.addEventListener("change", update);
    return () => {
      mdQuery.removeEventListener("change", update);
      lgQuery.removeEventListener("change", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts.base, counts.md, counts.lg]);

  return perView;
}

export default function Carousel({
  children,
  itemsPerView = { base: 1, md: 2, lg: 3 },
  autoPlay = true,
  autoPlayInterval = 5000,
  gap = 24,
  className,
}: {
  children: ReactNode;
  itemsPerView?: ResponsiveCount;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  gap?: number;
  className?: string;
}) {
  const items = Children.toArray(children);
  const perView = useItemsPerView(itemsPerView);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const pages = useMemo(() => {
    const grouped: ReactNode[][] = [];
    for (let i = 0; i < items.length; i += perView) {
      grouped.push(items.slice(i, i + perView));
    }
    return grouped.length > 0 ? grouped : [[]];
  }, [items, perView]);

  const pageCount = pages.length;

  // Clamp page when perView (and therefore pageCount) changes on resize.
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  useEffect(() => {
    controls.start({
      x: `-${page * 100}%`,
      transition: { type: "spring", stiffness: 300, damping: 32 },
    });
  }, [page, controls]);

  const goTo = useCallback(
    (index: number) => {
      const next = ((index % pageCount) + pageCount) % pageCount;
      setPage(next);
    },
    [pageCount]
  );

  const next = useCallback(() => goTo(page + 1), [goTo, page]);
  const prev = useCallback(() => goTo(page - 1), [goTo, page]);

  // Autoplay
  useEffect(() => {
    if (!autoPlay || pageCount <= 1 || isHovering || isDragging) return;
    const id = setInterval(() => {
      setPage((p) => (p + 1) % pageCount);
    }, autoPlayInterval);
    return () => clearInterval(id);
  }, [autoPlay, autoPlayInterval, pageCount, isHovering, isDragging]);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false);
    const threshold = 60;
    if (info.offset.x < -threshold) next();
    else if (info.offset.x > threshold) prev();
    else {
      // snap back to current page
      controls.start({
        x: `-${page * 100}%`,
        transition: { type: "spring", stiffness: 300, damping: 32 },
      });
    }
  };

  if (items.length === 0) return null;

  const showControls = pageCount > 1;

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div ref={containerRef} className="overflow-hidden">
        <motion.div
          className="flex"
          animate={controls}
          drag={showControls ? "x" : false}
          dragElastic={0.12}
          dragConstraints={{ left: 0, right: 0 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
        >
          {pages.map((pageItems, i) => (
            <div
              key={i}
              className="flex w-full shrink-0"
              style={{ gap }}
              aria-hidden={i !== page}
            >
              {pageItems.map((item, j) => (
                <div
                  key={j}
                  className="min-w-0"
                  style={{
                    flex: `0 0 calc(${100 / perView}% - ${
                      (gap * (perView - 1)) / perView
                    }px)`,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      </div>

      {showControls && (
        <>
          <button
            type="button"
            onClick={prev}
            data-cursor="pointer"
            aria-label="Previous"
            className="group absolute left-0 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] p-2.5 text-white/70 backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.12] hover:text-white sm:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={next}
            data-cursor="pointer"
            aria-label="Next"
            className="group absolute right-0 top-1/2 z-20 hidden translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] p-2.5 text-white/70 backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.12] hover:text-white sm:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* mobile-friendly inline arrows, shown under the track on small screens */}
          <p className="mt-4 text-center font-mono text-[10px] text-white/30 sm:hidden">
            Swipe, or use the arrows, to see more
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 sm:hidden">
            <button
              type="button"
              onClick={prev}
              data-cursor="pointer"
              aria-label="Previous"
              className="flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] p-2.5 text-white/70 backdrop-blur-md transition hover:border-white/25 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              data-cursor="pointer"
              aria-label="Next"
              className="flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] p-2.5 text-white/70 backdrop-blur-md transition hover:border-white/25 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                data-cursor="pointer"
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === page ? "w-6 bg-white/80" : "w-1.5 bg-white/20 hover:bg-white/40"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
