"use client";

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileAudio,
  Loader2,
  Mic,
  RotateCcw,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import type { PipelineStage } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

const ACCEPTED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".mp4", ".ogg", ".webm", ".mpeg", ".mpga", ".aac", ".flac"];
const MAX_FILE_SIZE_BYTES = 105 * 1024 * 1024;

interface AudioUploaderProps {
  stage: PipelineStage;
  progress: number;
  disabled: boolean;
  errorMessage: string | null;
  onSubmit: (file: File) => void;
  onReset: () => void;
}

interface StageStep {
  key: PipelineStage;
  label: string;
  icon: ReactNode;
}

const STAGE_STEPS: StageStep[] = [
  { key: "uploading", label: "رفع الملف الصوتي", icon: <UploadCloud className="h-3.5 w-3.5" /> },
  { key: "transcribing", label: "تفريغ الصوت (Whisper)", icon: <Mic className="h-3.5 w-3.5" /> },
  { key: "diacritizing", label: "التشكيل والتحقق (Claude)", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { key: "finalizing", label: "إنهاء المعالجة", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
];

const STAGE_ORDER: PipelineStage[] = ["idle", "uploading", "transcribing", "diacritizing", "finalizing", "done", "error"];

export function AudioUploader({ stage, progress, disabled, errorMessage, onSubmit, onReset }: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isBusy = stage !== "idle" && stage !== "done" && stage !== "error";
  const currentStageIndex = STAGE_ORDER.indexOf(stage);

  const validateAndSetFile = useCallback((file: File) => {
    const lowerName = file.name.toLowerCase();
    const hasValidExtension = ACCEPTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));

    if (!hasValidExtension) {
      setValidationError("صيغة الملف غير مدعومة، الرجاء استخدام MP3 أو WAV أو M4A أو صيغة صوتية مشابهة.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError("حجم الملف يتجاوز 100 ميجابايت، الرجاء ضغط الملف أو تقسيمه قبل الرفع.");
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
  }, []);

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!disabled && !isBusy) {
      setIsDragging(true);
    }
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled || isBusy) {
      return;
    }
    const file = event.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  }

  function handleZoneClick() {
    if (!disabled && !isBusy) {
      inputRef.current?.click();
    }
  }

  function handleStart() {
    if (!selectedFile || disabled || isBusy) {
      return;
    }
    onSubmit(selectedFile);
  }

  function handleReset() {
    setSelectedFile(null);
    setValidationError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onReset();
  }

  return (
    <section className="rounded-3xl border border-emerald-800/40 bg-emerald-950/20 p-6 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-emerald-50 sm:text-xl">رفع التسجيل الصوتي</h2>
          <p className="mt-1 text-sm text-emerald-300/70">
            يدعم النظام الملفات الطويلة التي تتجاوز الساعة الواحدة، وحتى 100 ميجابايت أو أكثر
          </p>
        </div>
        {selectedFile || stage !== "idle" ? (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-700/50 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-900/40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            بدء من جديد
          </button>
        ) : null}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleZoneClick}
        role="button"
        tabIndex={0}
        className={`group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300 ${
          isDragging ? "scale-[1.01] border-amber-400 bg-amber-500/5" : "border-emerald-700/40 bg-black/20 hover:border-emerald-500/60"
        } ${disabled || isBusy ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.mp4,.ogg,.webm,.mpeg,.mpga,.aac,.flac"
          className="hidden"
          disabled={disabled || isBusy}
          onChange={handleFileChange}
        />

        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600/30 to-amber-500/20 text-emerald-200 shadow-inner">
          {selectedFile ? <FileAudio className="h-8 w-8" /> : <UploadCloud className="animate-bounce-slow h-8 w-8" />}
        </div>

        {selectedFile ? (
          <div>
            <p className="break-all font-bold text-emerald-50">{selectedFile.name}</p>
            <p className="mt-1 text-xs text-emerald-400/80">{formatBytes(selectedFile.size)}</p>
          </div>
        ) : (
          <div>
            <p className="font-bold text-emerald-50">اسحب وأفلت الملف الصوتي هنا، أو اضغط للاختيار</p>
            <p className="mt-1 text-xs text-emerald-400/70">MP3 · WAV · M4A — حتى 100 ميجابايت وأكثر من ساعة تسجيل</p>
          </div>
        )}
      </div>

      {validationError ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-400">
          <AlertTriangle className="h-4 w-4" />
          {validationError}
        </p>
      ) : null}

      {selectedFile && !isBusy && stage !== "done" ? (
        <button
          type="button"
          onClick={handleStart}
          disabled={disabled}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-emerald-500 via-emerald-600 to-emerald-700 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/40 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          بدء التفريغ والتشكيل التام
        </button>
      ) : null}

      {isBusy || stage === "done" ? (
        <div className="mt-6">
          <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-gradient-to-l from-emerald-400 via-emerald-500 to-amber-400 shadow-[0_0_16px_rgba(16,185,129,0.7)] transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STAGE_STEPS.map((step) => {
              const stepIndex = STAGE_ORDER.indexOf(step.key);
              const isActive = stage === step.key;
              const isCompleted = currentStageIndex > stepIndex || stage === "done";

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-semibold transition sm:text-xs ${
                    isCompleted
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                      : isActive
                        ? "border-amber-400/60 bg-amber-500/10 text-amber-200"
                        : "border-emerald-900/40 bg-black/20 text-emerald-500/40"
                  }`}
                >
                  <span
                    className={`relative flex h-2.5 w-2.5 shrink-0 rounded-full ${
                      isActive ? "bg-amber-400 shadow-[0_0_10px_3px_rgba(251,191,36,0.6)]" : isCompleted ? "bg-emerald-400" : "bg-emerald-900"
                    }`}
                  >
                    {isActive ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/70" /> : null}
                  </span>
                  {isActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : step.icon}
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm font-semibold text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
