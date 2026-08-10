import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} ساعة`);
  if (minutes > 0) parts.push(`${minutes} دقيقة`);
  if (hours === 0 && remainingSeconds > 0) parts.push(`${remainingSeconds} ثانية`);

  return parts.length > 0 ? parts.join(" و") : "أقل من ثانية";
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} كيلوبايت`;
  return `${bytes} بايت`;
}
