"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { startAudio } from "@/lib/audio";
import Hud from "@/components/Hud";
import SceneBackground from "@/components/SceneBackground";
import LayerShell from "@/components/LayerShell";
import Win from "@/components/screens/Win";
import Lose from "@/components/screens/Lose";
import Layer1Tokenize from "@/components/puzzles/Layer1Tokenize";
import Layer2Embedding from "@/components/puzzles/Layer2Embedding";
import Layer3Attention from "@/components/puzzles/Layer3Attention";
import Layer4Generation from "@/components/puzzles/Layer4Generation";
import Layer5Retrieval from "@/components/puzzles/Layer5Retrieval";
import Layer6Prompt from "@/components/puzzles/Layer6Prompt";

export default function GamePage() {
  const router = useRouter();
  const phase = useGame((s) => s.phase);
  const currentLayer = useGame((s) => s.currentLayer);
  const [mounted, setMounted] = useState(false);

  // جلوگیری از hydration mismatch با state ذخیره‌شده
  useEffect(() => {
    setMounted(true);
    // اگر کاربر مستقیم وارد /game شد بدون شروع بازی، به خانه برگرد
    const state = useGame.getState();
    if (state.phase === "intro" || !state.startTimestamp) {
      router.replace("/");
    }
    startAudio();
  }, [router]);

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-cyanGlow animate-pulseGlow">در حال بارگذاری...</div>
      </main>
    );
  }

  if (phase === "win") return <Win />;
  if (phase === "lose") return <Lose />;

  return (
    <main className="relative min-h-screen">
      <SceneBackground name={`layer-${currentLayer}`} />
      <Hud />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentLayer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {currentLayer === 1 && (
            <LayerShell layerId={1}>
              {(onSolved) => <Layer1Tokenize onSolved={onSolved} />}
            </LayerShell>
          )}
          {currentLayer === 2 && (
            <LayerShell layerId={2}>
              {(onSolved) => <Layer2Embedding onSolved={onSolved} />}
            </LayerShell>
          )}
          {currentLayer === 3 && (
            <LayerShell layerId={3}>
              {(onSolved) => <Layer3Attention onSolved={onSolved} />}
            </LayerShell>
          )}
          {currentLayer === 4 && (
            <LayerShell layerId={4}>
              {(onSolved) => <Layer4Generation onSolved={onSolved} />}
            </LayerShell>
          )}
          {currentLayer === 5 && (
            <LayerShell layerId={5}>
              {(onSolved) => <Layer5Retrieval onSolved={onSolved} />}
            </LayerShell>
          )}
          {currentLayer === 6 && (
            <LayerShell layerId={6}>
              {(onSolved) => <Layer6Prompt onSolved={onSolved} />}
            </LayerShell>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
