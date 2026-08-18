"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { introNarration } from "@/lib/puzzles";
import HatefSpeech from "@/components/HatefSpeech";
import SceneBackground from "@/components/SceneBackground";
import { startAudio } from "@/lib/audio";

export default function Intro() {
  const router = useRouter();
  const startGame = useGame((s) => s.startGame);
  const [phase, setPhase] = useState<"title" | "story">("title");

  const enter = async () => {
    await startAudio(); // صدا فقط پس از تعامل کاربر
    setPhase("story");
  };

  const begin = () => {
    startGame();
    router.push("/game");
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <SceneBackground name="room" />

      {phase === "title" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center"
        >
          <motion.h1
            className="mb-3 text-5xl font-black text-cyanGlow text-glow sm:text-7xl"
            animate={{ textShadow: [
              "0 0 18px rgba(56,240,230,0.6)",
              "0 0 30px rgba(56,240,230,0.9)",
              "0 0 18px rgba(56,240,230,0.6)",
            ] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            اتاق فرار هاتف
          </motion.h1>
          <p className="mb-2 max-w-xl text-lg text-white/70 sm:text-xl">
            از ذهن نخستین ابرهوش‌مصنوعی جهان فرار کن.
          </p>
          <p className="mb-8 max-w-lg text-sm leading-7 text-white/45">
            شش لایه. شش کلید. دوازده دقیقه برای آنکه ثابت کنی هوش مصنوعی را می‌فهمی.
            <br />
            هر لایه، یکی از رازهای واقعیِ کارِ مدل‌های زبانی را آشکار می‌کند.
          </p>
          <motion.button
            onClick={enter}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="btn-glow rounded-xl px-10 py-3 text-lg font-bold"
          >
            ورود به اتاق هسته
          </motion.button>
          <p className="mt-4 text-xs text-white/30">
            با ورود، صدای محیطی فعال می‌شود (قابل قطع).
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-3xl"
        >
          <HatefSpeech lines={introNarration} onDone={begin} orbSize={140} />
        </motion.div>
      )}
    </main>
  );
}
