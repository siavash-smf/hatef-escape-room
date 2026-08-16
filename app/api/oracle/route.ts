import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  checkAcrostic,
  fallbackPoem,
  promptCoversRequirements,
} from "@/lib/acrostic";
import { layer5Goal } from "@/lib/puzzles";

export const runtime = "nodejs";

// زنجیره‌ی مدل‌های رایگانِ OpenRouter.
// مدل اول از OPENROUTER_MODEL خوانده می‌شود؛ اگر شلوغ (۴۲۹) یا خطا بود،
// خودکار سراغ مدل بعدی می‌رود تا بار کلاس پخش شود.
const OPENROUTER_MODELS: string[] = [
  process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "google/gemma-4-26b-a4b-it:free",
  "dots-studio/dots-3-note-preview:free",
].filter((m, i, a) => Boolean(m) && a.indexOf(m) === i);

const SYSTEM_PROMPT =
  "تو «هاتف» هستی، یک هوش مصنوعی شاعر. تنها بر اساس دستور کاربر شعری فارسی تولید کن. " +
  "فقط متن شعر را بازگردان، بدون توضیح یا مقدمه. هر مصرع را در یک خط جدا بنویس.";

interface OracleResponse {
  success: boolean;
  output: string;
  message: string;
  mode: "live" | "offline";
}

interface ORCall {
  status: number; // 200 موفق، 429 شلوغ، 0 خطای شبکه/زمان
  output: string;
  error: string;
}

// یک فراخوانیِ تکیِ OpenRouter برای یک مدل مشخص
async function callOpenRouter(
  model: string,
  key: string,
  prompt: string
): Promise<ORCall> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/siavash-smf/hatef-escape-room",
        "X-Title": "Hatef Escape Room",
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { status: res.status, output: "", error: text.slice(0, 160) };
    }
    const data = await res.json();
    const output: string = (data?.choices?.[0]?.message?.content ?? "")
      .toString()
      .trim();
    return { status: 200, output, error: "" };
  } catch (e) {
    return {
      status: 0,
      output: "",
      error: e instanceof Error ? e.message : "خطای ناشناخته",
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ساخت پاسخ پس از دریافت خروجی مدل و بررسی آکروستیک
function judge(output: string): OracleResponse {
  const check = checkAcrostic(output);
  return {
    success: check.ok,
    output,
    message: check.ok
      ? "هاتف دقیقاً همان چیزی را که خواستی تولید کرد. درها باز می‌شوند..."
      : check.reason ??
        `خروجی شرط آکروستیک «${layer5Goal.acrostic}» را برآورده نکرد. پرامپتت را دقیق‌تر کن.`,
    mode: "live",
  };
}

export async function POST(req: NextRequest) {
  let prompt = "";
  try {
    const body = await req.json();
    prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  } catch {
    return NextResponse.json(
      { success: false, output: "", message: "درخواست نامعتبر است.", mode: "offline" },
      { status: 400 }
    );
  }

  if (!prompt) {
    return NextResponse.json(
      { success: false, output: "", message: "پرامپت خالی است.", mode: "offline" } satisfies OracleResponse,
      { status: 400 }
    );
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // ۱) حالت زنده با OpenRouter (مدل رایگان) — اولویت اول، با جایگزینِ خودکار
  if (openrouterKey) {
    let sawRateLimit = false;
    let lastError = "";
    for (const model of OPENROUTER_MODELS) {
      const r = await callOpenRouter(model, openrouterKey, prompt);
      if (r.output) {
        return NextResponse.json(judge(r.output) satisfies OracleResponse);
      }
      if (r.status === 429) {
        sawRateLimit = true; // این مدل شلوغ است؛ سراغ مدل بعدی برو
        continue;
      }
      // خطای دیگر یا خروجی خالی — مدل بعدی را امتحان کن
      lastError = r.error || `وضعیت ${r.status}`;
    }
    // هیچ مدلی جواب نداد
    return NextResponse.json(
      {
        success: false,
        output: "",
        message: sawRateLimit
          ? "مدل‌های رایگان همین حالا شلوغ‌اند. چند ثانیه صبر کن و دوباره «ارسال فرمان» را بزن."
          : "خطا در ارتباط با هاتف: " + lastError,
        mode: "live",
      } satisfies OracleResponse,
      { status: sawRateLimit ? 503 : 502 }
    );
  }

  // ۲) حالت زنده با Claude — اگر کلید OpenRouter نبود ولی کلید Anthropic بود
  if (anthropicKey) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey });
      const message = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });
      const output = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return NextResponse.json(judge(output) satisfies OracleResponse);
    } catch (err) {
      const detail =
        err instanceof Anthropic.APIError
          ? `${err.status ?? ""} ${err.message}`.trim()
          : "خطای ناشناخته";
      return NextResponse.json(
        {
          success: false,
          output: "",
          message: "خطا در ارتباط با هاتف: " + detail,
          mode: "live",
        } satisfies OracleResponse,
        { status: 502 }
      );
    }
  }

  // ۳) حالت آفلاین: بدون هیچ کلیدی
  const cover = promptCoversRequirements(prompt);
  if (cover.ok) {
    return NextResponse.json({
      success: true,
      output: fallbackPoem,
      message: "(حالت آفلاین) پرامپت تو شرط‌های لازم را داشت؛ هاتف شعر را تولید کرد.",
      mode: "offline",
    } satisfies OracleResponse);
  }
  return NextResponse.json({
    success: false,
    output: "",
    message:
      "(حالت آفلاین) پرامپت تو این موارد را پوشش نداده: " +
      cover.missing.join("؛ ") +
      ".",
    mode: "offline",
  } satisfies OracleResponse);
}
