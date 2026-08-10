"use client";

import { useEffect, useState } from "react";
import { BookOpenCheck, Mic2, ShieldCheck, Sparkles } from "lucide-react";
import { PasscodeGate } from "@/components/PasscodeGate";
import { AudioUploader } from "@/components/AudioUploader";
import { ResultsViewer } from "@/components/ResultsViewer";
import { ToastStack, useToasts } from "@/components/Toast";
import { exportSermonToWord } from "@/lib/export-word";
import type { PipelineStage, TranscribeApiResponse } from "@/lib/types";

const UNLOCK_STORAGE_KEY = "sermon-platform-unlocked";

const FEATURES = [
  {
    icon: <Mic2 className="h-5 w-5" />,
    title: "ØªÙØ±ÙŠØº Ø¯Ù‚ÙŠÙ‚ Ù„Ù„ØªØ³Ø¬ÙŠÙ„Ø§Øª Ø§Ù„Ø·ÙˆÙŠÙ„Ø©",
    description: "Ø¯Ø¹Ù… ÙƒØ§Ù…Ù„ Ù„Ù„ØªØ³Ø¬ÙŠÙ„Ø§Øª Ø§Ù„ØªÙŠ ØªØªØ¬Ø§ÙˆØ² Ø§Ù„Ø³Ø§Ø¹Ø© Ø¹Ø¨Ø± ØªÙ‚Ø³ÙŠÙ… Ø§Ù„ØµÙˆØª Ø¢Ù„ÙŠÙ‹Ø§ ÙˆÙ…Ø¹Ø§Ù„Ø¬ØªÙ‡ Ø¨ÙˆØ§Ø³Ø·Ø© Whisper.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "ØªØ´ÙƒÙŠÙ„ ØªØ§Ù… Ø¥Ø¹Ø±Ø§Ø¨ÙŠ",
    description: "ØªØ´ÙƒÙŠÙ„ Ø´Ø§Ù…Ù„ Ù„ÙƒÙ„ ÙƒÙ„Ù…Ø© Ø¹Ø¨Ø± Claude 3.5 Sonnet Ù…Ø¹ Ø§Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ Ø§Ù„Ø³ÙŠØ§Ù‚ ÙˆØ§Ù„Ù…Ø¹Ù†Ù‰ Ø§Ù„Ø£ØµÙ„ÙŠ Ù„Ù„Ø®Ø·Ø¨Ø©.",
  },
  {
    icon: <BookOpenCheck className="h-5 w-5" />,
    title: "ØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ø¢ÙŠØ§Øª ÙˆØ§Ù„Ø£Ø­Ø§Ø¯ÙŠØ«",
    description: "Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø§Ù„Ø¢ÙŠØ§Øª Ø§Ù„Ù‚Ø±Ø¢Ù†ÙŠØ© ÙˆØ§Ù„Ø£Ø­Ø§Ø¯ÙŠØ« Ø§Ù„Ù†Ø¨ÙˆÙŠØ© ÙˆØªØµØ­ÙŠØ­Ù‡Ø§ ÙˆØ¥Ø¶Ø§ÙØ© Ù…Ø±Ø§Ø¬Ø¹Ù‡Ø§ ÙˆØªØ®Ø±ÙŠØ¬Ù‡Ø§ ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "ÙˆØµÙˆÙ„ Ø¢Ù…Ù† ÙˆÙ…Ø­Ù…ÙŠ",
    description: "Ø¨ÙˆØ§Ø¨Ø© Ø±Ù…Ø² Ù…Ø±ÙˆØ± ØªØ­Ù…ÙŠ Ø§Ù„Ù…Ù†ØµØ© Ù…Ù† Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… ØºÙŠØ± Ø§Ù„Ù…ØµØ±Ø­ Ø¨Ù‡ Ù‚Ø¨Ù„ Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ø£Ø¯ÙˆØ§Øª Ø§Ù„Ø±ÙØ¹ ÙˆØ§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø©.",
  },
];

export default function HomePage() {
  const [unlocked, setUnlocked] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TranscribeApiResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toasts, pushToast } = useToasts();

  useEffect(() => {
    const storedFlag = window.sessionStorage.getItem(UNLOCK_STORAGE_KEY);
    if (storedFlag === "true") {
      setUnlocked(true);
    }
    setCheckedStorage(true);
  }, []);

  useEffect(() => {
    if (stage === "idle" || stage === "done" || stage === "error") {
      return;
    }

    const intervalId = setInterval(() => {
      setProgress((previous) => {
        const ceiling = stage === "uploading" ? 22 : stage === "transcribing" ? 62 : stage === "diacritizing" ? 92 : 98;
        if (previous >= ceiling) {
          return previous;
        }
        const increment = Math.max(0.35, (ceiling - previous) * 0.045);
        return Math.min(ceiling, previous + increment);
      });
    }, 220);

    return () => clearInterval(intervalId);
  }, [stage]);

  function handleUnlock() {
    window.sessionStorage.setItem(UNLOCK_STORAGE_KEY, "true");
    setUnlocked(true);
    pushToast("ØªÙ… Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø±Ù…Ø² Ø§Ù„Ø³Ø±ÙŠ Ø¨Ù†Ø¬Ø§Ø­ØŒ Ø£Ù‡Ù„Ù‹Ø§ Ø¨Ùƒ ÙÙŠ Ø§Ù„Ù…Ù†ØµØ©.", "success");
  }

  function resetPipeline() {
    setResult(null);
    setErrorMessage(null);
    setStage("idle");
    setProgress(0);
  }

  async function handleFileSubmit(file: File) {
    setResult(null);
    setErrorMessage(null);
    setProgress(3);
    setStage("uploading");

    const transcribingTimer = setTimeout(() => setStage("transcribing"), 1100);
    const diacritizingTimer = setTimeout(() => setStage("diacritizing"), 9500);

    try {
      const formData = new FormData();
      formData.append("audio", file);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      clearTimeout(transcribingTimer);
      clearTimeout(diacritizingTimer);
      setStage("finalizing");
      setProgress((previous) => Math.max(previous, 96));

      const payload = await response.json();

      if (!response.ok) {
        const message = typeof payload?.error === "string" ? payload.error : "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ù…Ù„Ù Ø§Ù„ØµÙˆØªÙŠ.";
        throw new Error(message);
      }

      setResult(payload as TranscribeApiResponse);
      setProgress(100);
      setStage("done");
      pushToast("ØªÙ… ØªÙØ±ÙŠØº Ø§Ù„ØªØ³Ø¬ÙŠÙ„ ÙˆØªØ´ÙƒÙŠÙ„Ù‡ ÙˆØ§Ù„ØªØ­Ù‚Ù‚ Ù…Ù†Ù‡ Ø¨Ù†Ø¬Ø§Ø­.", "success");
    } catch (error) {
      clearTimeout(transcribingTimer);
      clearTimeout(diacritizingTimer);
      const message = error instanceof Error ? error.message : "Ø­Ø¯Ø« Ø®Ø·Ø£ ØºÙŠØ± Ù…ØªÙˆÙ‚Ø¹ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø©.";
      setErrorMessage(message);
      setStage("error");
      pushToast(message, "error");
    }
  }

  async function handleCopy() {
    if (!result) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.diacritized_text);
      pushToast("ØªÙ… Ù†Ø³Ø® Ø§Ù„Ù†Øµ Ø§Ù„Ù…ÙØ´ÙƒÙŽÙ‘Ù„ Ø¥Ù„Ù‰ Ø§Ù„Ø­Ø§ÙØ¸Ø© Ø¨Ù†Ø¬Ø§Ø­.", "success");
    } catch {
      pushToast("ØªØ¹Ø°Ù‘Ø± Ù†Ø³Ø® Ø§Ù„Ù†Øµ ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§ØŒ Ø§Ù„Ø±Ø¬Ø§Ø¡ ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù†Øµ ÙˆÙ†Ø³Ø®Ù‡ ÙŠØ¯ÙˆÙŠÙ‹Ø§.", "error");
    }
  }

  function handleExportWord() {
    if (!result) {
      return;
    }
    try {
      exportSermonToWord(result);
      pushToast("Ø¬Ø§Ø±Ù ØªÙ†Ø²ÙŠÙ„ Ù…Ù„Ù Word Ø§Ù„Ø®Ø§Øµ Ø¨Ø§Ù„Ø®Ø·Ø¨Ø©...", "success");
    } catch {
      pushToast("ØªØ¹Ø°Ù‘Ø± Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù„Ù WordØŒ Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.", "error");
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      {checkedStorage && !unlocked ? <PasscodeGate onUnlock={handleUnlock} /> : null}
      <ToastStack toasts={toasts} />

      <section className="rounded-3xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/50 via-emerald-950/20 to-black/20 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-12">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-500 text-2xl shadow-lg shadow-emerald-900/50 animate-glow-pulse">
          ðŸ“–
        </span>
        <h1 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight text-emerald-50 sm:text-4xl">
          Ù…Ù†ØµØ© ØªÙØ±ÙŠØº ÙˆØªØ´ÙƒÙŠÙ„ Ø§Ù„Ø®Ø·Ø¨ ÙˆØ§Ù„Ù…Ø­Ø§Ø¶Ø±Ø§Øª Ø§Ù„Ø¯ÙŠÙ†ÙŠØ© Ø¨Ø¯Ù‚Ø© Ø¹Ø§Ù„ÙŠØ©
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-emerald-200/80 sm:text-base">
          Ø§Ø±ÙØ¹ ØªØ³Ø¬ÙŠÙ„Ùƒ Ø§Ù„ØµÙˆØªÙŠ Ø§Ù„Ø·ÙˆÙŠÙ„ØŒ ÙˆØ³ÙŠÙ‚ÙˆÙ… Ø§Ù„Ù†Ø¸Ø§Ù… Ø¨ØªÙØ±ÙŠØºÙ‡ Ø¨Ø¯Ù‚Ø©ØŒ ÙˆØªØ´ÙƒÙŠÙ„Ù‡ ØªØ´ÙƒÙŠÙ„Ø§Ù‹ ØªØ§Ù…Ù‹Ø§ Ø¥Ø¹Ø±Ø§Ø¨ÙŠÙ‹Ø§ØŒ ÙˆØ§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† ÙƒÙ„ Ø¢ÙŠØ©
          Ù‚Ø±Ø¢Ù†ÙŠØ© ÙˆØ­Ø¯ÙŠØ« Ù†Ø¨ÙˆÙŠ Ø´Ø±ÙŠÙ ÙˆØ±Ø¯ ÙÙŠÙ‡ Ù…Ø¹ ØªÙˆØ«ÙŠÙ‚ Ù…ØµØ¯Ø±Ù‡.
        </p>

        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-800/40 bg-black/20 p-4 text-center"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-300">
                {feature.icon}
              </span>
              <p className="text-xs font-bold text-emerald-100">{feature.title}</p>
              <p className="text-[11px] leading-5 text-emerald-400/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <AudioUploader
        stage={stage}
        progress={progress}
        disabled={!unlocked}
        errorMessage={errorMessage}
        onSubmit={handleFileSubmit}
        onReset={resetPipeline}
      />

      {result ? (
        <ResultsViewer result={result} onCopy={handleCopy} onExportWord={handleExportWord} onPrint={handlePrint} />
      ) : null}
    </main>
  );
}

