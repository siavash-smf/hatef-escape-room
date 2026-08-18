"use client";

import { useState } from "react";

// پس‌زمینه‌ی صحنه با fallback گرادیان زیبا اگر تصویر موجود نباشد.
const GRADIENTS: Record<string, string> = {
  room: "radial-gradient(circle at 30% 20%, #0c1640 0%, #060a1c 45%, #04060f 100%)",
  "layer-1":
    "linear-gradient(135deg, #04060f 0%, #0a1430 50%, #0d2030 100%)",
  "layer-2":
    "radial-gradient(circle at 60% 40%, #11183f 0%, #070b22 55%, #04060f 100%)",
  "layer-3":
    "linear-gradient(120deg, #060a1c 0%, #0a1230 55%, #1a1238 100%)",
  "layer-4":
    "radial-gradient(circle at 50% 100%, #0d2436 0%, #070d22 55%, #04060f 100%)",
  "layer-5":
    "linear-gradient(160deg, #04060f 0%, #0a1a34 45%, #16243f 100%)",
  "layer-6":
    "radial-gradient(circle at 50% 50%, #143042 0%, #0a1228 50%, #04060f 100%)",
  win: "radial-gradient(circle at 50% 40%, #0e3a44 0%, #0a2030 50%, #04060f 100%)",
  lose: "radial-gradient(circle at 50% 40%, #3a0e16 0%, #1a0810 50%, #04060f 100%)",
};

export default function SceneBackground({ name }: { name: string }) {
  const [hasImage, setHasImage] = useState(true);
  const gradient = GRADIENTS[name] ?? GRADIENTS.room;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: gradient }}>
      {hasImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/${name}.png`}
          alt=""
          aria-hidden
          className="h-full w-full object-cover opacity-95"
          onError={() => setHasImage(false)}
        />
      )}
      {/* وینیِت ملایم برای خوانایی متن — مرکز روشن می‌ماند */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink-900/70 via-ink-900/25 to-ink-900/75" />
      <div className="absolute inset-0 bg-ink-900/20" />
      {/* درخشش‌های محیطی */}
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-cyanGlow/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-amberGlow/10 blur-3xl" />
    </div>
  );
}
