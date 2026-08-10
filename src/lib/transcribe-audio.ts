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
  "نص خطبة أو محاضرة دينية إسلامية باللغة العربية الفصحى، قد تتضمن آيات قرآنية كريمة وأحاديث نبوية شريفة ومصطلحات شرعية.";

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
      "تعذر تقسيم الملف الصوتي إلى أجزاء أصغر من الحد المسموح به لخدمة Whisper (25 ميجابايت لكل جزء).",
    );
  }

  const transcriptionText = await openai.audio.transcriptions.create({
    file: createReadStream(chunkPath),
    model: "whisper-1",
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
          "تعذّر تقسيم الملف الصوتي الكبير آليًا، وحجمه يتجاوز الحد المسموح به لخدمة Whisper. الرجاء تحويل الملف إلى صيغة MP3 وإعادة رفعه.",
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
