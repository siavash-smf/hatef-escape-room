"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { toFa } from "@/lib/scoring";
import { endings } from "@/lib/puzzles";
import SceneBackground from "@/components/SceneBackground";

export default function Lose() {
  const router = useRouter();
  const solvedLayers = useGame((s) => s.solvedLayers);
  const reset = useGame((s) => s.reset);

  const tryAgain = () => {
    reset();
    router.push("/");
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <SceneBackground name="lose" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="flex w-full max-w-lg flex-col items-center text-center"
      >
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="mb-4 text-6xl"
        >
          🔒
        </motion.div>

        <h1 className="text-4xl font-black text-dangerGlow sm:text-5xl"
          style={{ textShadow: "0 0 18px rgba(255,77,94,0.6)" }}
        >
          زمان به پایان رسید
        </h1>

        <p className="mt-4 max-w-md text-base leading-8 text-dangerGlow/80">
          «{endings.lose}»
        </p>

        <div className="panel mt-8 px-6 py-4 text-sm text-white/60">
          پیش از قفل شدن اتاق، {toFa(solvedLayers.length)} لایه از ۶ لایه را گشوده
          بودی.
        </div>

        <motion.button
          onClick={tryAgain}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="mt-8 rounded-xl border border-dangerGlow/60 bg-dangerGlow/10 px-10 py-3 text-lg font-bold text-dangerGlow transition hover:bg-dangerGlow/20"
        >
          تلاش دوباره
        </motion.button>
      </motion.div>
    </main>
  );
}
