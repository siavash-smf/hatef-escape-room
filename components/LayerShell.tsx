"use client";

import { ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { layers, type LayerId } from "@/lib/puzzles";
import { toFa } from "@/lib/scoring";
import { playSfx } from "@/lib/audio";
import HatefSpeech from "./HatefSpeech";
import HatefOrb from "./HatefOrb";

type Stage = "intro" | "puzzle" | "outro";

interface Props {
  layerId: LayerId;
  // پازل، تابع onSolved را صدا می‌زند وقتی حل شد
  children: (onSolved: () => void) => ReactNode;
}

export default function LayerShell({ layerId, children }: Props) {
  const layer = layers[layerId];
  const solveLayer = useGame((s) => s.solveLayer);
  const [stage, setStage] = useState<Stage>("intro");

  const handleSolved = () => {
    playSfx("unlock");
    setStage("outro");
  };

  return (
    <div className="relative mx-auto w-full max-w-4xl px-4 pb-16 pt-24 sm:pt-28">
      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <div className="mb-2 text-center text-sm tracking-widest text-amberGlow/80">
              {layer.title} · {layer.concept}
            </div>
            <HatefSpeech
              lines={layer.intro}
              onDone={() => setStage("puzzle")}
              orbSize={120}
            />
          </motion.div>
        )}

        {stage === "puzzle" && (
          <motion.div
            key="puzzle"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <div className="mb-5 flex items-center justify-center gap-3">
              <HatefOrb size={56} />
              <div className="text-center">
                <h2 className="text-lg font-bold text-cyanGlow text-glow sm:text-xl">
                  {layer.title}
                </h2>
                <p className="text-xs text-white/50">
                  لایه {toFa(layerId)} از ۶ · {layer.concept}
                </p>
              </div>
            </div>
            {children(handleSolved)}
          </motion.div>
        )}

        {stage === "outro" && (
          <motion.div
            key="outro"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <KeyPieceReveal layerId={layerId} />
            <HatefSpeech
              lines={[layer.outro]}
              onDone={() => solveLayer(layerId)}
              orbSize={110}
            />
            <p className="mt-3 text-center text-sm text-white/40">
              {layerId < 6 ? "آماده‌ی فرورفتن به لایه‌ی بعد..." : "آخرین فرمان..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KeyPieceReveal({ layerId }: { layerId: LayerId }) {
  return (
    <div className="mb-4 flex flex-col items-center">
      <motion.div
        initial={{ scale: 0, rotate: -45, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="mb-2 flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyanGlow bg-cyanGlow/15 text-3xl shadow-glow"
      >
        🔑
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-sm font-bold text-cyanGlow text-glow"
      >
        قطعه‌ی کلید {toFa(layerId)} به دست آمد!
      </motion.p>
    </div>
  );
}
