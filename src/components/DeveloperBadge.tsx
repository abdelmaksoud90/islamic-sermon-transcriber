import { Code2, PhoneCall, ShieldCheck } from "lucide-react";

interface DeveloperBadgeProps {
  variant: "header" | "footer";
}

export function DeveloperBadge({ variant }: DeveloperBadgeProps) {
  if (variant === "header") {
    return (
      <div className="flex items-center gap-2 rounded-full border border-emerald-700/40 bg-emerald-950/40 px-3 py-1.5 text-[11px] text-emerald-200 shadow-inner shadow-emerald-900/30 sm:text-xs">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-300">
          <Code2 className="h-3.5 w-3.5" />
        </span>
        <span className="hidden font-semibold sm:inline">Eng. Ahmed AbdelMaksoud</span>
        <span className="mx-1 hidden h-3 w-px bg-emerald-700/50 sm:inline-block" />
        <span className="flex items-center gap-1 font-semibold text-amber-300">
          <PhoneCall className="h-3.5 w-3.5" />
          01202224118
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 text-center">
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-emerald-700/30 bg-emerald-950/30 px-5 py-3 shadow-lg shadow-black/30">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-amber-500/20 text-emerald-300">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <p className="text-sm font-bold text-emerald-100">Designed and Developed by Eng. Ahmed AbdelMaksoud</p>
        <span className="hidden h-4 w-px bg-emerald-700/40 sm:inline-block" />
        <p className="flex items-center gap-1 text-sm font-semibold text-amber-300">
          <PhoneCall className="h-4 w-4" />
          Phone: 01202224118
        </p>
      </div>
      <p className="text-[11px] text-emerald-500/60">جميع الحقوق محفوظة لمنصة توثيق الخطب الدينية</p>
    </div>
  );
}
