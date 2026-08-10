import { createReadStream, promises as fsp } from "fs";
import { getOpenAIClient } from "@/lib/openai-client";
import { probeAudio, splitAudioIntoChunks } from "@/lib/ffmpeg-config";
import { mapWithConcurrency } from "@/lib/concurrency";

const WHISPER_MAX_CHUNK_BYTES = 25 * 1024 * 1024;
const CHUNK_DURATION_TRIGGER_SECONDS = 15 * 60;
const TARGET_CHUNK_BYTES = 20 * 1024 * 1024;
const MIN_SEGMENT_SECONDS = 60;
const MAX_SEGMENT_SECONDS = 10 * 60;
const WHISPER_CONCURRENCY = 3;

const WHISPER_PROMPT =
  "Ù†Øµ Ø®Ø·Ø¨Ø© Ø£Ùˆ Ù…Ø­Ø§Ø¶Ø±Ø© Ø¯ÙŠÙ†ÙŠØ© Ø¥Ø³Ù„Ø§Ù…ÙŠØ© Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„ÙØµØ­Ù‰ØŒ Ù‚Ø¯ ØªØªØ¶Ù…Ù† Ø¢ÙŠØ§Øª Ù‚Ø±Ø¢Ù†ÙŠØ© ÙƒØ±ÙŠÙ…Ø© ÙˆØ£Ø­Ø§Ø¯ÙŠØ« Ù†Ø¨ÙˆÙŠØ© Ø´Ø±ÙŠÙØ© ÙˆÙ…ØµØ·Ù„Ø­Ø§Øª Ø´Ø±Ø¹ÙŠØ©.";

export interface TranscribeResult {
  rawText: string;
  chunkCount: number;
  durationSeconds: number;
}

async function transcribeChunk(chunkPath: string): Promise<string> {
  const openai = getOpenAIClient();
  const stat = await fsp.stat(chunkPath);

  if (stat.size === 0) {
    return "";
  }

  if (stat.size > WHISPER_MAX_CHUNK_BYTES) {
    throw new Error(
      "ØªØ¹Ø°Ø± ØªÙ‚Ø³ÙŠÙ… Ø§Ù„Ù…Ù„Ù Ø§Ù„ØµÙˆØªÙŠ Ø¥Ù„Ù‰ Ø£Ø¬Ø²Ø§Ø¡ Ø£ØµØºØ± Ù…Ù† Ø§Ù„Ø­Ø¯ Ø§Ù„Ù…Ø³Ù…ÙˆØ­ Ø¨Ù‡ Ù„Ø®Ø¯Ù…Ø© Whisper (25 Ù…ÙŠØ¬Ø§Ø¨Ø§ÙŠØª Ù„ÙƒÙ„ Ø¬Ø²Ø¡).",
    );
  }

  const transcriptionText = await openai.audio.transcriptions.create({
    file: createReadStream(chunkPath),
    model: "whisper-large-v3",
    language: "ar",
    response_format: "text",
    prompt: WHISPER_PROMPT,
    temperature: 0,
  });

  return typeof transcriptionText === "string" ? transcriptionText : String(transcriptionText ?? "");
}

export async function transcribeAudioFile(
  inputPath: string,
  workDir: string,
  extension: string,
): Promise<TranscribeResult> {
  const { durationSeconds, sizeBytes } = await probeAudio(inputPath);

  const needsSplitting = sizeBytes > WHISPER_MAX_CHUNK_BYTES || durationSeconds > CHUNK_DURATION_TRIGGER_SECONDS;

  let chunkPaths: string[] = [inputPath];

  if (needsSplitting) {
    try {
      const bytesPerSecond = durationSeconds > 0 ? sizeBytes / durationSeconds : sizeBytes;
      const estimatedSegmentSeconds = Math.floor(TARGET_CHUNK_BYTES / Math.max(bytesPerSecond, 1));
      const segmentSeconds = Math.min(Math.max(estimatedSegmentSeconds, MIN_SEGMENT_SECONDS), MAX_SEGMENT_SECONDS);

      const generatedChunks = await splitAudioIntoChunks(inputPath, workDir, segmentSeconds, extension);
      if (generatedChunks.length > 0) {
        chunkPaths = generatedChunks;
      }
    } catch (error) {
      console.error("Audio chunking with ffmpeg failed, falling back to single file", error);
      if (sizeBytes > WHISPER_MAX_CHUNK_BYTES) {
        throw new Error(
          "ØªØ¹Ø°Ù‘Ø± ØªÙ‚Ø³ÙŠÙ… Ø§Ù„Ù…Ù„Ù Ø§Ù„ØµÙˆØªÙŠ Ø§Ù„ÙƒØ¨ÙŠØ± Ø¢Ù„ÙŠÙ‹Ø§ØŒ ÙˆØ­Ø¬Ù…Ù‡ ÙŠØªØ¬Ø§ÙˆØ² Ø§Ù„Ø­Ø¯ Ø§Ù„Ù…Ø³Ù…ÙˆØ­ Ø¨Ù‡ Ù„Ø®Ø¯Ù…Ø© Whisper. Ø§Ù„Ø±Ø¬Ø§Ø¡ ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ù…Ù„Ù Ø¥Ù„Ù‰ ØµÙŠØºØ© MP3 ÙˆØ¥Ø¹Ø§Ø¯Ø© Ø±ÙØ¹Ù‡.",
        );
      }
    }
  }

  const transcripts = await mapWithConcurrency(chunkPaths, WHISPER_CONCURRENCY, async (chunkPath) => {
    return transcribeChunk(chunkPath);
  });

  const rawText = transcripts
    .map((text) => text.trim())
    .filter((text) => text.length > 0)
    .join("\n\n");

  return {
    rawText,
    chunkCount: chunkPaths.length,
    durationSeconds,
  };
}

