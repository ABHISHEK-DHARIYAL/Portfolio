"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import HexMark from "./HexMark";

/**
 * Opening loader: a hexagon draws itself with "AD" inside, holds for a
 * moment, then scales and fades away to reveal the site.
 * Same contract as before — calls onDone() when it has finished.
 */
export default function Loader({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const hold = reduce ? 500 : 1700; // draw (0.9s) + letters + short hold
    const t1 = setTimeout(() => setHidden(true), hold);
    const t2 = setTimeout(onDone, hold + 450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone, reduce]);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-base"
          role="status"
          aria-live="polite"
          aria-label="Loading"
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
        >
          <motion.div
            exit={{ scale: 0.8, transition: { duration: 0.4 } }}
          >
            <HexMark size={110} mode="draw" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
