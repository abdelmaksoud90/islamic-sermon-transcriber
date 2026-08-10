"use client";

import { BookOpenText, Clock3, Copy, FileDown, Layers, Printer, Quote, ScrollText } from "lucide-react";
import type { ReactNode } from "react";
import type { TranscribeApiResponse } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

interface ResultsViewerProps {
  result: TranscribeApiResponse;
  onCopy: () => void;
  onExportWord: () => void;
  onPrint: () => void;
}

function renderRawText(text: string): ReactNode[] {
  return text
    .split(/\n{1,}/)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => (
      <p key={index} className="mb-4 text-[15px] leading-8 text-emerald-100/90">
        {line}
      </p>
    ));
}

function renderDiacritizedText(text: string): ReactNode[] {
  const lines = text.split(/\n{1,}/).filter((line) => line.trim().length > 0);

  return lines.map((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
      return (
        <h3 key={index} className="first:mt-0 mt-6 mb-3 text-lg font-extrabold text-amber-300">
          {trimmed.replace(/^#+\s*/, "")}
        </h3>
      );
    }

    const isQuran = /\[[^\]]*سورة[^\]]*\]/.test(trimmed);
    const isHadith = /\[[^\]]*(رواه|حديث)[^\]]*\]/.test(trimmed);
    const segments = trimmed.split(/(\[[^\]]+\])/g);

    const content = segments.map((segment, segmentIndex) => {
      if (/^\[.+\]$/.test(segment)) {
        const isHadithTag = /رواه|حديث/.test(segment);
        return (
          <span
            key={segmentIndex}
            className={`mx-1 inline-block rounded-md px-2 py-0.5 text-[13px] font-bold ${
              isHadithTag ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
            }`}
          >
            {segment}
          </span>
        );
      }
      return <span key={segmentIndex}>{segment}</span>;
    });

    if (isQuran || isHadith) {
      return (
        <div
          key={index}
          className={`mb-4 rounded-xl border-r-4 px-4 py-3 text-[16px] leading-9 ${
            isHadith ? "border-amber-400 bg-amber-500/5 text-amber-50" : "border-emerald-400 bg-emerald-500/5 text-emerald-50"
          }`}
        >
          {content}
        </div>
      );
    }

    return (
      <p key={index} className="mb-4 text-[16px] leading-9 text-emerald-50/95">
        {content}
      </p>
    );
  });
}

export function ResultsViewer({ result, onCopy, onExportWord, onPrint }: ResultsViewerProps) {
  return (
    <section id="results-viewer" className="flex flex-col gap-6">
      <div className="rounded-3xl border border-emerald-800/40 bg-emerald-950/20 p-6 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-8 print:border-none print:bg-white print:p-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-400 print:text-gray-500">
              عنوان الخطبة أو المحاضرة
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-emerald-50 sm:text-3xl print:text-black">
              {result.sermon_title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-200/80 print:text-gray-700">{result.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-emerald-400/70 print:hidden">
              <span className="flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                مدة التسجيل: {formatDuration(result.meta.durationSeconds)}
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                عدد أجزاء المعالجة: {result.meta.chunkCount}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              onClick={onCopy}
              type="button"
              className="flex items-center gap-1.5 rounded-xl border border-emerald-600/50 bg-emerald-600/10 px-4 py-2.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-600/20"
            >
              <Copy className="h-4 w-4" />
              نسخ النص المُشكَّل
            </button>
            <button
              onClick={onExportWord}
              type="button"
              className="flex items-center gap-1.5 rounded-xl border border-sky-600/50 bg-sky-600/10 px-4 py-2.5 text-xs font-bold text-sky-200 transition hover:bg-sky-600/20"
            >
              <FileDown className="h-4 w-4" />
              تصدير Word
            </button>
            <button
              onClick={onPrint}
              type="button"
              className="flex items-center gap-1.5 rounded-xl border border-amber-600/50 bg-amber-600/10 px-4 py-2.5 text-xs font-bold text-amber-200 transition hover:bg-amber-600/20"
            >
              <Printer className="h-4 w-4" />
              طباعة / حفظ PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-emerald-800/40 bg-emerald-950/20 p-6 shadow-2xl shadow-black/30 backdrop-blur-sm print:col-span-2 print:border-none print:bg-white print:p-0 print:shadow-none">
          <div className="mb-4 flex items-center gap-2 text-emerald-200 print:text-black">
            <ScrollText className="h-5 w-5" />
            <h3 className="text-base font-extrabold">النص المُشكَّل تشكيلاً تامًا</h3>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pl-2 print:max-h-none print:overflow-visible print:pl-0 print:text-black">
            {renderDiacritizedText(result.diacritized_text)}
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-900/30 bg-black/20 p-6 shadow-2xl shadow-black/20 backdrop-blur-sm print:hidden">
          <div className="mb-4 flex items-center gap-2 text-emerald-300/80">
            <BookOpenText className="h-5 w-5" />
            <h3 className="text-base font-extrabold">النص الخام (التفريغ الصوتي الأولي)</h3>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pl-2 opacity-90">{renderRawText(result.raw_text)}</div>
        </div>
      </div>

      {result.detected_quotes.length > 0 ? (
        <div className="rounded-3xl border border-emerald-800/40 bg-emerald-950/20 p-6 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-8 print:hidden">
          <div className="mb-4 flex items-center gap-2 text-emerald-200">
            <Quote className="h-5 w-5" />
            <h3 className="text-base font-extrabold">الآيات القرآنية والأحاديث النبوية المستخرجة</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {result.detected_quotes.map((quote, index) => (
              <div
                key={index}
                className={`rounded-2xl border-r-4 p-4 text-sm leading-8 ${
                  quote.type === "hadith" ? "border-amber-400 bg-amber-500/5 text-amber-50" : "border-emerald-400 bg-emerald-500/5 text-emerald-50"
                }`}
              >
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400/70">
                  {quote.type === "hadith" ? "حديث شريف" : "آية قرآنية"}
                </p>
                <p className="font-semibold">{quote.text}</p>
                <p className="mt-2 text-xs font-bold text-amber-300">{quote.reference}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="hidden text-center text-xs text-gray-500 print:mt-10 print:block">
        Designed and Developed by Eng. Ahmed AbdelMaksoud | Phone: 01202224118
      </p>
    </section>
  );
}
