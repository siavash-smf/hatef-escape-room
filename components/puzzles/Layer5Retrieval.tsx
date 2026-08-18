"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  layer5Answers,
  layer5Docs,
  layer5Question,
  type RetrievalDoc,
} from "@/lib/puzzles";
import { toFa } from "@/lib/scoring";
import { playSfx } from "@/lib/audio";

type Stage = "retrieve" | "answer" | "done";

export default function Layer5Retrieval({ onSolved }: { onSolved: () => void }) {
  // اسناد بر پایه‌ی شباهت مرتب می‌شوند — همان‌طور که موتور بازیابی نشان می‌دهد
  const docs = useMemo(
    () => [...layer5Docs].sort((a, b) => b.similarity - a.similarity),
    []
  );
  const correctIds = useMemo(
    () => layer5Docs.filter((d) => d.relevant).map((d) => d.id),
    []
  );

  const [stage, setStage] = useState<Stage>("retrieve");
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [wrongAnswer, setWrongAnswer] = useState<string | null>(null);

  const toggle = (id: string) => {
    setError(null);
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const retrieve = () => {
    const extra = picked.filter((id) => !correctIds.includes(id));
    const missing = correctIds.filter((id) => !picked.includes(id));

    if (extra.length === 0 && missing.length === 0) {
      playSfx("unlock");
      setStage("answer");
      return;
    }

    playSfx("error");
    if (extra.length > 0) {
      const bad = layer5Docs.find((d) => d.id === extra[0]) as RetrievalDoc;
      setError(`«${bad.source}» به زمینه راه ندارد — ${bad.note}`);
    } else {
      setError(
        "زمینه ناقص است؛ پاسخ در یک سند جمع نشده. سندی را بیاب که تکه‌ی گمشده را کامل می‌کند."
      );
    }
  };

  const answer = (id: string) => {
    const opt = layer5Answers.find((a) => a.id === id)!;
    if (opt.correct) {
      playSfx("unlock");
      setStage("done");
      setWrongAnswer(null);
    } else {
      playSfx("error");
      setWrongAnswer(opt.verdict);
      setTimeout(() => setWrongAnswer(null), 2600);
    }
  };

  const retrieved = layer5Docs.filter((d) => correctIds.includes(d.id));
  const correctAnswer = layer5Answers.find((a) => a.correct)!;

  return (
    <div className="panel mx-auto max-w-3xl p-5 sm:p-7">
      {/* پرسش */}
      <div className="mb-5 rounded-xl border border-amberGlow/25 bg-amberGlow/5 px-4 py-3 text-center">
        <div className="mb-1 text-xs tracking-widest text-amberGlow/80">
          پرسشِ بی‌پاسخ در وزن‌های من
        </div>
        <p className="text-base leading-8 text-white/85">{layer5Question}</p>
      </div>

      {stage === "retrieve" && (
        <>
          <p className="mb-4 text-center text-sm leading-7 text-white/65">
            بایگانی را جست‌وجو کردم و این قطعه‌ها را بر پایه‌ی شباهت برداری
            برگرداندم. تنها اسنادی را به زمینه‌ی من بفرست که واقعاً پاسخ را
            می‌سازند — نه پرشباهت‌ترین‌ها.
          </p>

          <div className="space-y-2.5">
            {docs.map((doc) => {
              const on = picked.includes(doc.id);
              return (
                <motion.button
                  key={doc.id}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => toggle(doc.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-right transition ${
                    on
                      ? "border-cyanGlow bg-cyanGlow/10 shadow-glow"
                      : "border-white/12 bg-ink-800/60 hover:border-amberGlow/60"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px] ${
                      on
                        ? "border-cyanGlow bg-cyanGlow/25 text-cyanGlow"
                        : "border-white/25 text-transparent"
                    }`}
                    aria-hidden
                  >
                    ✓
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-amberGlow/85">
                        {doc.source}
                      </span>
                      <span className="font-mono text-[11px] text-white/45">
                        شباهت {toFa(doc.similarity)}٪
                      </span>
                      <span className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                        <span
                          className="block h-full rounded-full bg-gradient-to-l from-cyanGlow to-amberGlow"
                          style={{ width: `${doc.similarity}%` }}
                        />
                      </span>
                    </span>
                    <span className="block text-sm leading-7 text-white/80">
                      {doc.text}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-lg border border-dangerGlow/40 bg-dangerGlow/10 px-4 py-3 text-center text-sm leading-7 text-dangerGlow"
              >
                ⚠ {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 flex flex-col items-center gap-2">
            <span className="text-xs text-white/40">
              {toFa(picked.length)} سند برگزیده شده
            </span>
            <button
              onClick={retrieve}
              disabled={picked.length === 0}
              className="btn-glow rounded-lg px-8 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              فرستادن به زمینه
            </button>
          </div>
        </>
      )}

      {(stage === "answer" || stage === "done") && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* زمینه‌ی بازیابی‌شده */}
          <div className="mb-5 rounded-xl border border-cyanGlow/30 bg-cyanGlow/5 p-4">
            <div className="mb-2 text-xs tracking-widest text-cyanGlow/85">
              زمینه‌ی بازیابی‌شده
            </div>
            <ul className="space-y-2">
              {retrieved.map((d) => (
                <li key={d.id} className="text-sm leading-7 text-white/80">
                  <span className="ml-1 text-amberGlow/80">▪ {d.source}:</span>
                  {d.text}
                </li>
              ))}
            </ul>
          </div>

          {stage === "answer" ? (
            <>
              <p className="mb-4 text-center text-sm leading-7 text-white/65">
                حالا پاسخی را برگزین که تک‌تک اجزایش در همین دو سند ریشه دارد.
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {layer5Answers.map((a) => (
                  <motion.button
                    key={a.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => answer(a.id)}
                    className="rounded-xl border border-white/15 bg-ink-800/70 px-4 py-3 text-sm text-white/85 transition hover:border-cyanGlow"
                  >
                    {a.text}
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {wrongAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 rounded-lg border border-dangerGlow/40 bg-dangerGlow/10 px-4 py-3 text-center text-sm leading-7 text-dangerGlow"
                  >
                    ⚠ {wrongAnswer}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <p className="mb-2 text-center text-lg text-cyanGlow text-glow">
                {correctAnswer.text}
              </p>
              <p className="mb-4 max-w-lg text-center text-sm leading-7 text-white/55">
                {correctAnswer.verdict}
              </p>
              <button onClick={onSolved} className="btn-glow rounded-lg px-8 py-2">
                تثبیت پاسخِ مستند
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
