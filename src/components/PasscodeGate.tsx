"use client";

import { useRef, useState, type ChangeEvent, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";

const MASTER_PASSCODE = "270841";
const CODE_LENGTH = MASTER_PASSCODE.length;

interface PasscodeGateProps {
  onUnlock: () => void;
}

export function PasscodeGate({ onUnlock }: PasscodeGateProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [shake, setShake] = useState(false);
  const [errorText, setErrorText] = useState("");
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  function updateDigit(index: number, value: string) {
    const cleaned = value.replace(/[^0-9]/g, "").slice(-1);
    setDigits((previous) => {
      const next = [...previous];
      next[index] = cleaned;
      return next;
    });
    if (cleaned && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    updateDigit(index, event.target.value);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
    if (!pasted) {
      return;
    }
    event.preventDefault();
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    setDigits(next);
    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputsRef.current[focusIndex]?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = digits.join("");

    if (code === MASTER_PASSCODE) {
      setErrorText("");
      onUnlock();
      return;
    }

    setErrorText("الرمز السري غير صحيح، يُرجى المحاولة مرة أخرى.");
    setShake(true);
    setDigits(Array(CODE_LENGTH).fill(""));
    inputsRef.current[0]?.focus();
    setTimeout(() => setShake(false), 500);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden bg-[#02100c]/95 p-4 backdrop-blur-xl">
      <div className="islamic-pattern-bg absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -top-40 right-1/3 h-96 w-96 rounded-full bg-emerald-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />

      <form
        onSubmit={handleSubmit}
        className={`relative z-10 w-full max-w-md rounded-3xl border border-emerald-700/40 bg-[#04120d]/90 p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.6)] ${
          shake ? "animate-shake" : "animate-fade-in-up"
        }`}
      >
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-800 shadow-lg shadow-emerald-900/50">
          <Lock className="h-8 w-8 text-emerald-50" />
        </div>

        <h2 className="text-xl font-extrabold text-emerald-50">بوابة الدخول الآمنة</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-300/80">
          أدخل رمز المرور السري للوصول إلى منصة تفريغ وتشكيل الخطب الدينية
        </p>

        <div dir="ltr" className="mt-6 flex items-center justify-center gap-2 sm:gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputsRef.current[index] = element;
              }}
              value={digit}
              onChange={(event) => handleChange(index, event)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              inputMode="numeric"
              autoComplete="off"
              maxLength={1}
              aria-label={`رقم ${index + 1} من رمز المرور`}
              className="h-12 w-10 rounded-xl border border-emerald-700/50 bg-black/40 text-center text-xl font-bold text-emerald-50 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 sm:h-14 sm:w-12"
            />
          ))}
        </div>

        {errorText ? <p className="mt-4 text-xs font-semibold text-red-400">{errorText}</p> : null}

        <button
          type="submit"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-emerald-500 to-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition hover:brightness-110 active:scale-[0.98]"
        >
          <KeyRound className="h-4 w-4" />
          دخول إلى المنصة
        </button>

        <p className="mt-5 flex items-center justify-center gap-1 text-[11px] text-emerald-500/60">
          <ShieldCheck className="h-3.5 w-3.5" />
          محمي بواسطة نظام تحقق آمن من الوصول غير المصرح به
        </p>
      </form>
    </div>
  );
}
