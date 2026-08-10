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
    title: "تفريغ دقيق للتسجيلات الطويلة",
    description: "دعم كامل للتسجيلات التي تتجاوز الساعة عبر تقسيم الصوت آليًا ومعالجته بواسطة Whisper.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "تشكيل تام إعرابي",
    description: "تشكيل شامل لكل كلمة عبر Claude 3.5 Sonnet مع الحفاظ على السياق والمعنى الأصلي للخطبة.",
  },
  {
    icon: <BookOpenCheck className="h-5 w-5" />,
    title: "توثيق الآيات والأحاديث",
    description: "استخراج الآيات القرآنية والأحاديث النبوية وتصحيحها وإضافة مراجعها وتخريجها تلقائيًا.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "وصول آمن ومحمي",
    description: "بوابة رمز مرور تحمي المنصة من الاستخدام غير المصرح به قبل الوصول إلى أدوات الرفع والمعالجة.",
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
    pushToast("تم التحقق من الرمز السري بنجاح، أهلًا بك في المنصة.", "success");
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
        const message = typeof payload?.error === "string" ? payload.error : "حدث خطأ أثناء معالجة الملف الصوتي.";
        throw new Error(message);
      }

      setResult(payload as TranscribeApiResponse);
      setProgress(100);
      setStage("done");
      pushToast("تم تفريغ التسجيل وتشكيله والتحقق منه بنجاح.", "success");
    } catch (error) {
      clearTimeout(transcribingTimer);
      clearTimeout(diacritizingTimer);
      const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء المعالجة.";
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
      pushToast("تم نسخ النص المُشكَّل إلى الحافظة بنجاح.", "success");
    } catch {
      pushToast("تعذّر نسخ النص تلقائيًا، الرجاء تحديد النص ونسخه يدويًا.", "error");
    }
  }

  function handleExportWord() {
    if (!result) {
      return;
    }
    try {
      exportSermonToWord(result);
      pushToast("جارٍ تنزيل ملف Word الخاص بالخطبة...", "success");
    } catch {
      pushToast("تعذّر إنشاء ملف Word، الرجاء المحاولة مرة أخرى.", "error");
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
          📖
        </span>
        <h1 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight text-emerald-50 sm:text-4xl">
          منصة تفريغ وتشكيل الخطب والمحاضرات الدينية بدقة عالية
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-emerald-200/80 sm:text-base">
          ارفع تسجيلك الصوتي الطويل، وسيقوم النظام بتفريغه بدقة، وتشكيله تشكيلاً تامًا إعرابيًا، والتحقق من كل آية
          قرآنية وحديث نبوي شريف ورد فيه مع توثيق مصدره.
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
