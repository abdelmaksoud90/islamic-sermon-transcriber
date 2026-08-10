import { NextRequest, NextResponse } from "next/server";
import { promises as fsp } from "fs";
import os from "os";
import path from "path";
import { transcribeAudioFile } from "@/lib/transcribe-audio";
import { generateDiacritizedAnalysis } from "@/lib/tashkeel";
import type { TranscribeApiResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["mp3", "wav", "m4a", "mp4", "mpeg", "mpga", "webm", "ogg", "aac", "flac"]);

export async function POST(request: NextRequest): Promise<NextResponse> {
  let tempDir: string | null = null;

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "مفتاح OPENAI_API_KEY غير مُعرَّف على الخادم. الرجاء إضافته إلى متغيرات البيئة." },
        { status: 500 },
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "مفتاح ANTHROPIC_API_KEY غير مُعرَّف على الخادم. الرجاء إضافته إلى متغيرات البيئة." },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const uploadedFile = formData.get("audio");

    if (!uploadedFile || !(uploadedFile instanceof File)) {
      return NextResponse.json({ error: "لم يتم إرفاق أي ملف صوتي صالح مع الطلب." }, { status: 400 });
    }

    if (uploadedFile.size === 0) {
      return NextResponse.json({ error: "الملف الصوتي المُرفق فارغ." }, { status: 400 });
    }

    if (uploadedFile.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "حجم الملف يتجاوز الحد الأقصى المسموح به وهو 100 ميجابايت." },
        { status: 413 },
      );
    }

    const originalName = uploadedFile.name || "audio.mp3";
    const rawExtension = path.extname(originalName).replace(".", "").toLowerCase();
    const extension = ALLOWED_EXTENSIONS.has(rawExtension) ? rawExtension : "mp3";

    tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "sermon-pipeline-"));
    const inputPath = path.join(tempDir, `input.${extension}`);

    const arrayBuffer = await uploadedFile.arrayBuffer();
    await fsp.writeFile(inputPath, Buffer.from(arrayBuffer));

    const { rawText, chunkCount, durationSeconds } = await transcribeAudioFile(inputPath, tempDir, extension);

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        { error: "تعذّر استخراج أي نص مفهوم من الملف الصوتي المرفوع. تأكد من جودة التسجيل وحاول مجددًا." },
        { status: 422 },
      );
    }

    const analysis = await generateDiacritizedAnalysis(rawText);

    const responsePayload: TranscribeApiResponse = {
      sermon_title: analysis.sermon_title,
      summary: analysis.summary,
      raw_text: rawText,
      diacritized_text: analysis.diacritized_text,
      detected_quotes: analysis.detected_quotes,
      meta: {
        chunkCount,
        durationSeconds,
      },
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error("Sermon transcription pipeline failed:", error);
    const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء معالجة الملف الصوتي.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tempDir) {
      await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
