"use client";

import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { toFa } from "@/lib/scoring";
import type { LayerId } from "@/lib/puzzles";

// نمایش پیشرفت: شش قفل که با حل هر لایه باز می‌شوند.
export default function ProgressLocks() {
  const solved = useGame((s) => s.solvedLayers);
  const current = useGame((s) => s.currentLayer);

  return (
    <div className="flex items-center gap-1.5" aria-label="پیشرفت کلیدها">
      {([1, 2, 3, 4, 5, 6] as LayerId[]).map((id) => {
        const isSolved = solved.includes(id);
        const isCurrent = id === current && !isSolved;
        return (
          <motion.div
            key={id}
            initial={false}
            animate={{
              scale: isCurrent ? [1, 1.12, 1] : 1,
            }}
            transition={{ duration: 1.6, repeat: isCurrent ? Infinity : 0 }}
            className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold sm:h-8 sm:w-8 ${
              isSolved
                ? "border-cyanGlow bg-cyanGlow/20 text-cyanGlow shadow-glow"
                : isCurrent
                  ? "border-amberGlow text-amberGlow"
                  : "border-white/15 text-white/30"
            }`}
            title={`لایه ${toFa(id)}`}
          >
            {isSolved ? "🔓" : toFa(id)}
          </motion.div>
        );
      })}
    </div>
  );
}
