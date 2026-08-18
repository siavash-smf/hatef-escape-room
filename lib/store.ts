"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  HINT_PENALTY_SECONDS,
  TOTAL_TIME_SECONDS,
  type LayerId,
} from "./puzzles";

export type Phase = "intro" | "playing" | "win" | "lose";

interface GameState {
  phase: Phase;
  currentLayer: LayerId;
  solvedLayers: LayerId[];
  // تایمر: زمان شروع + جریمه‌ها ذخیره می‌شود تا با رفرش ادامه یابد
  startTimestamp: number | null;
  penaltySeconds: number;
  hintsUsed: number; // کل راهنماهای استفاده‌شده
  hintsUsedThisLayer: number;
  soundOn: boolean;
  finalRemaining: number; // زمان باقی‌مانده هنگام پایان

  // actions
  startGame: () => void;
  solveLayer: (id: LayerId) => void;
  useHint: () => void;
  resetHintsForLayer: () => void;
  toggleSound: () => void;
  setPhase: (p: Phase) => void;
  loseGame: () => void;
  reset: () => void;
  remainingSeconds: () => number;
}

const initial = {
  phase: "intro" as Phase,
  currentLayer: 1 as LayerId,
  solvedLayers: [] as LayerId[],
  startTimestamp: null as number | null,
  penaltySeconds: 0,
  hintsUsed: 0,
  hintsUsedThisLayer: 0,
  soundOn: true,
  finalRemaining: 0,
};

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initial,

      remainingSeconds: () => {
        const { startTimestamp, penaltySeconds } = get();
        if (!startTimestamp) return TOTAL_TIME_SECONDS;
        const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
        return Math.max(0, TOTAL_TIME_SECONDS - elapsed - penaltySeconds);
      },

      startGame: () =>
        set({
          phase: "playing",
          startTimestamp: Date.now(),
          currentLayer: 1,
          solvedLayers: [],
          penaltySeconds: 0,
          hintsUsed: 0,
          hintsUsedThisLayer: 0,
        }),

      solveLayer: (id) => {
        const { solvedLayers } = get();
        const nextSolved = solvedLayers.includes(id)
          ? solvedLayers
          : [...solvedLayers, id];
        if (id >= 6) {
          set({
            solvedLayers: nextSolved,
            phase: "win",
            finalRemaining: get().remainingSeconds(),
          });
        } else {
          set({
            solvedLayers: nextSolved,
            currentLayer: (id + 1) as LayerId,
            hintsUsedThisLayer: 0,
          });
        }
      },

      useHint: () =>
        set((s) => ({
          hintsUsed: s.hintsUsed + 1,
          hintsUsedThisLayer: s.hintsUsedThisLayer + 1,
          penaltySeconds: s.penaltySeconds + HINT_PENALTY_SECONDS,
        })),

      resetHintsForLayer: () => set({ hintsUsedThisLayer: 0 }),

      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),

      setPhase: (p) => set({ phase: p }),

      loseGame: () =>
        set({ phase: "lose", finalRemaining: 0 }),

      reset: () => set({ ...initial }),
    }),
    {
      name: "hatef-escape-room",
      // نسخه ۲: افزوده‌شدن لایه‌ی ششم — وضعیتِ ذخیره‌شده‌ی نسخه‌ی قبلی معتبر نیست
      version: 2,
      migrate: () => ({ ...initial }) as GameState,
      partialize: (s) => ({
        phase: s.phase,
        currentLayer: s.currentLayer,
        solvedLayers: s.solvedLayers,
        startTimestamp: s.startTimestamp,
        penaltySeconds: s.penaltySeconds,
        hintsUsed: s.hintsUsed,
        hintsUsedThisLayer: s.hintsUsedThisLayer,
        soundOn: s.soundOn,
        finalRemaining: s.finalRemaining,
      }),
    }
  )
);
