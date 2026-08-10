import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { DeveloperBadge } from "@/components/DeveloperBadge";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  variable: "--font-tajawal",
  weight: ["300", "400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "منصة تفريغ وتشكيل الخطب الدينية | تقنية الذكاء الاصطناعي",
  description:
    "منصة ذكية لتفريغ وتشكيل وتوثيق الخطب والمحاضرات الدينية الإسلامية بدقة عالية باستخدام الذكاء الاصطناعي، مع التحقق من الآيات القرآنية والأحاديث النبوية.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body className="min-h-screen font-[family-name:var(--font-cairo)] text-slate-100 antialiased">
        <div className="islamic-pattern-bg pointer-events-none fixed inset-0 -z-10" />
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-emerald-900/40 bg-black/30 backdrop-blur-sm">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-lg shadow-lg shadow-emerald-900/40">
                  🕌
                </span>
                <div>
                  <p className="text-sm font-bold text-emerald-50">منصة توثيق الخطب الدينية</p>
                  <p className="text-[11px] text-emerald-400/80">تفريغ • تشكيل • توثيق آلي بالذكاء الاصطناعي</p>
                </div>
              </div>
              <DeveloperBadge variant="header" />
            </div>
          </header>

          <div className="flex-1">{children}</div>

          <footer className="border-t border-emerald-900/40 bg-black/40 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
              <DeveloperBadge variant="footer" />
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
