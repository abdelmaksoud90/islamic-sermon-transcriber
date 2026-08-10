export type QuoteType = "quran" | "hadith";

export interface DetectedQuote {
  type: QuoteType;
  text: string;
  reference: string;
}

export interface SermonAnalysis {
  sermon_title: string;
  summary: string;
  diacritized_text: string;
  detected_quotes: DetectedQuote[];
}

export interface TranscribeMeta {
  chunkCount: number;
  durationSeconds: number;
}

export interface TranscribeApiResponse {
  sermon_title: string;
  summary: string;
  raw_text: string;
  diacritized_text: string;
  detected_quotes: DetectedQuote[];
  meta: TranscribeMeta;
}

export interface TranscribeApiError {
  error: string;
}

export type PipelineStage =
  | "idle"
  | "uploading"
  | "transcribing"
  | "diacritizing"
  | "finalizing"
  | "done"
  | "error";
