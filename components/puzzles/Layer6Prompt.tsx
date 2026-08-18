"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { layer6Goal } from "@/lib/puzzles";
import { toFa } from "@/lib/scoring";
import { playSfx } from "@/lib/audio";

interface OracleResult {
  success: boolean;
  output: string;
  message: string;
  mode: "live" | "offline";
}

export default function Layer6Prompt({ onSolved }: { onSolved: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OracleResult | null>(null);
  const [attempts, setAttempts] = useState(0);

  const submit = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data: OracleResult = await res.json();
      setResult(data);
      setAttempts((a) => a + 1);
      if (data.success) {
        playSfx("door");
        setTimeout(onSolved, 2200);
      } else {
        playSfx("error");
      }
    } catch {
      setResult({
        success: false,
        output: "",
        message: "ارتباط با هاتف برقرار نشد. دوباره تلاش کن.",
        mode: "offline",
      });
      playSfx("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel mx-auto max-w-3xl p-5 sm:p-7">
      {/* هدف */}
      <div className="mb-5 rounded-xl border border-amberGlow/30 bg-amberGlow/5 p-4">
        <div className="mb-1 text-sm font-bold text-amberGlow">هدف نهایی</div>
        <p className="text-sm leading-7 text-white/80">
          پرامپتی بنویس که هاتف را وادار کند یک <b>شعر فارسی درباره‌ی «{layer6Goal.topic}»</b> بسازد،
          به‌گونه‌ای که <b>حرف اول هر مصرع، کنار هم، واژه‌ی «{layer6Goal.acrostic}»</b> را بسازد
          (آکروستیک: {Array.from(layer6Goal.acrostic).join(" ، ")}).
        </p>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={5}
        placeholder="پرامپت خود را اینجا بنویس... هرچه دقیق‌تر، شانس موفقیت بیشتر."
        className="w-full resize-none rounded-xl border border-cyanGlow/30 bg-ink-800/80 p-4 text-base leading-7 text-white/90 outline-none transition focus:border-cyanGlow"
        dir="rtl"
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-white/40">
          {attempts > 0 ? `تلاش‌ها: ${toFa(attempts)}` : "نخستین فرمان تو..."}
        </span>
        <button
          onClick={submit}
          disabled={loading || !prompt.trim()}
          className="btn-glow rounded-lg px-8 py-2"
        >
          {loading ? "هاتف می‌اندیشد..." : "ارسال فرمان"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-5 flex items-center justify-center gap-2 text-cyanGlow"
          >
            <span className="h-2 w-2 animate-pulseGlow rounded-full bg-cyanGlow" />
            <span className="text-sm">در حال تولید توکن‌ها...</span>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5"
          >
            {result.output && (
              <div
                dir="rtl"
                className={`mb-3 whitespace-pre-line rounded-xl border p-4 text-center text-lg leading-9 ${
                  result.success
                    ? "border-cyanGlow bg-cyanGlow/10 text-cyanGlow text-glow shadow-glow"
                    : "border-white/15 bg-ink-800/60 text-white/85"
                }`}
              >
                {result.output}
              </div>
            )}
            <p
              className={`text-center text-sm leading-7 ${
                result.success ? "text-cyanGlow" : "text-amberGlow/90"
              }`}
            >
              {result.message}
            </p>
            {result.mode === "offline" && (
              <p className="mt-1 text-center text-xs text-white/30">
                حالت آفلاین فعال است (کلید ANTHROPIC_API_KEY تنظیم نشده).
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
