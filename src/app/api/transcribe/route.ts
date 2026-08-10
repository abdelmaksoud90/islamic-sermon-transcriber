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
        { error: "Ù…ÙØªØ§Ø­ OPENAI_API_KEY ØºÙŠØ± Ù…ÙØ¹Ø±ÙŽÙ‘Ù Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø§Ø¯Ù…. Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¶Ø§ÙØªÙ‡ Ø¥Ù„Ù‰ Ù…ØªØºÙŠØ±Ø§Øª Ø§Ù„Ø¨ÙŠØ¦Ø©." },
        { status: 500 },
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Ù…ÙØªØ§Ø­ ANTHROPIC_API_KEY ØºÙŠØ± Ù…ÙØ¹Ø±ÙŽÙ‘Ù Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø§Ø¯Ù…. Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¶Ø§ÙØªÙ‡ Ø¥Ù„Ù‰ Ù…ØªØºÙŠØ±Ø§Øª Ø§Ù„Ø¨ÙŠØ¦Ø©." },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const uploadedFile = formData.get("audio");

    if (!uploadedFile || !(uploadedFile instanceof File)) {
      return NextResponse.json({ error: "Ù„Ù… ÙŠØªÙ… Ø¥Ø±ÙØ§Ù‚ Ø£ÙŠ Ù…Ù„Ù ØµÙˆØªÙŠ ØµØ§Ù„Ø­ Ù…Ø¹ Ø§Ù„Ø·Ù„Ø¨." }, { status: 400 });
    }

    if (uploadedFile.size === 0) {
      return NextResponse.json({ error: "Ø§Ù„Ù…Ù„Ù Ø§Ù„ØµÙˆØªÙŠ Ø§Ù„Ù…ÙØ±ÙÙ‚ ÙØ§Ø±Øº." }, { status: 400 });
    }

    if (uploadedFile.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Ø­Ø¬Ù… Ø§Ù„Ù…Ù„Ù ÙŠØªØ¬Ø§ÙˆØ² Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ø§Ù„Ù…Ø³Ù…ÙˆØ­ Ø¨Ù‡ ÙˆÙ‡Ùˆ 100 Ù…ÙŠØ¬Ø§Ø¨Ø§ÙŠØª." },
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
        { error: "ØªØ¹Ø°Ù‘Ø± Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø£ÙŠ Ù†Øµ Ù…ÙÙ‡ÙˆÙ… Ù…Ù† Ø§Ù„Ù…Ù„Ù Ø§Ù„ØµÙˆØªÙŠ Ø§Ù„Ù…Ø±ÙÙˆØ¹. ØªØ£ÙƒØ¯ Ù…Ù† Ø¬ÙˆØ¯Ø© Ø§Ù„ØªØ³Ø¬ÙŠÙ„ ÙˆØ­Ø§ÙˆÙ„ Ù…Ø¬Ø¯Ø¯Ù‹Ø§." },
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
    const message = error instanceof Error ? error.message : "Ø­Ø¯Ø« Ø®Ø·Ø£ ØºÙŠØ± Ù…ØªÙˆÙ‚Ø¹ Ø£Ø«Ù†Ø§Ø¡ Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ù…Ù„Ù Ø§Ù„ØµÙˆØªÙŠ.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tempDir) {
      await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}

