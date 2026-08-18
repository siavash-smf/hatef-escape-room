// منطق مشترک بررسی آکروستیک «رها» برای لایه ۵.
import { layer6Goal } from "./puzzles";

// نرمال‌سازی حرف اول: حذف اعراب و یکسان‌سازی انواع الف
function normalizeFirstLetter(ch: string): string {
  const map: Record<string, string> = {
    "آ": "ا",
    "أ": "ا",
    "إ": "ا",
    "ٱ": "ا",
  };
  return map[ch] ?? ch;
}

// اولین حرف معنادار یک مصرع
function firstLetter(line: string): string {
  const cleaned = line
    .replace(/[ً-ْٰ]/g, "") // اعراب عربی
    .replace(/[^؀-ۿ]/g, "") // فقط حروف فارسی/عربی
    .trim();
  return cleaned ? normalizeFirstLetter(Array.from(cleaned)[0]) : "";
}

export interface AcrosticCheck {
  ok: boolean;
  lines: string[];
  firstLetters: string[];
  reason?: string;
}

// بررسی اینکه خروجی مدل شرط آکروستیک «رها» را دارد
export function checkAcrostic(text: string): AcrosticCheck {
  const target = Array.from(layer6Goal.acrostic); // ر، ه، ا
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => Array.from(l).some((c) => /[؀-ۿ]/.test(c)));

  if (lines.length < target.length) {
    return {
      ok: false,
      lines,
      firstLetters: lines.map(firstLetter),
      reason: `خروجی باید دست‌کم ${target.length} مصرع داشته باشد، اما ${lines.length} مصرع دارد.`,
    };
  }

  const used = lines.slice(0, target.length);
  const firstLetters = used.map(firstLetter);
  const ok = firstLetters.every(
    (l, i) => l === normalizeFirstLetter(target[i])
  );

  return {
    ok,
    lines: used,
    firstLetters,
    reason: ok
      ? undefined
      : `حرف اول مصرع‌ها باید به‌ترتیب ${target.join("، ")} باشد، اما ${firstLetters.join("، ")} است.`,
  };
}

// شعر نمونه‌ی درست برای حالت آفلاین (بدون کلید API)
export const fallbackPoem = `رهایی نسیمی‌ست که جان می‌دهد
هزاران قفسِ بسته شکستن سزد
اسیرِ سحرگه بال‌ها وا کند`;

// آیا پرامپت کاربر شرط‌های لازم را پوشش داده؟ (برای حالت آفلاین)
export function promptCoversRequirements(prompt: string): {
  ok: boolean;
  missing: string[];
} {
  const p = prompt.replace(/‌/g, " ");
  const missing: string[] = [];
  if (!/شعر|مصرع|بیت/.test(p)) missing.push("درخواست «شعر» یا «مصرع»");
  if (!/آزادی|آزاد|رهای/.test(p)) missing.push("موضوع «آزادی»");
  if (!/رها|آکروستیک|حرف اول|حرفِ اول|حرف نخست|ابتدای/.test(p))
    missing.push("شرط آکروستیک «رها» (حرف اول مصرع‌ها)");
  return { ok: missing.length === 0, missing };
}
