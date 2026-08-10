import type { TranscribeApiResponse } from "@/lib/types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildBodyHtml(diacritizedText: string): string {
  return diacritizedText
    .split(/\n{1,}/)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
        return `<h2 style="color:#0f5132; font-size:20px; margin-top:26px; margin-bottom:10px; font-weight:800;">${escapeHtml(
          trimmed.replace(/^#+\s*/, ""),
        )}</h2>`;
      }
      return `<p style="font-size:16px; line-height:2.4; margin:10px 0; text-align:justify;">${escapeHtml(trimmed)}</p>`;
    })
    .join("\n");
}

function buildQuotesTableHtml(result: TranscribeApiResponse): string {
  if (result.detected_quotes.length === 0) {
    return "";
  }

  const rows = result.detected_quotes
    .map((quote) => {
      const label = quote.type === "hadith" ? "حديث شريف" : "آية قرآنية";
      return `<tr>
        <td style="border:1px solid #0f5132; padding:8px; font-weight:bold; background:#eaf7ef; white-space:nowrap;">${escapeHtml(
          label,
        )}</td>
        <td style="border:1px solid #0f5132; padding:8px;">${escapeHtml(quote.text)}</td>
        <td style="border:1px solid #0f5132; padding:8px; color:#8a6d3b; font-weight:bold; white-space:nowrap;">${escapeHtml(
          quote.reference,
        )}</td>
      </tr>`;
    })
    .join("\n");

  return `<h3 style="margin-top:30px; color:#0f5132;">الآيات القرآنية والأحاديث النبوية المستخرجة</h3>
  <table style="border-collapse:collapse; width:100%; margin-top:14px;">
    <thead>
      <tr>
        <th style="border:1px solid #0f5132; padding:8px; background:#0f5132; color:#ffffff;">النوع</th>
        <th style="border:1px solid #0f5132; padding:8px; background:#0f5132; color:#ffffff;">النص</th>
        <th style="border:1px solid #0f5132; padding:8px; background:#0f5132; color:#ffffff;">المرجع</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function exportSermonToWord(result: TranscribeApiResponse): void {
  const safeTitle = result.sermon_title.replace(/[\\/:*?"<>|]+/g, "").trim() || "خطبة-دينية";
  const bodyHtml = buildBodyHtml(result.diacritized_text);
  const quotesHtml = buildQuotesTableHtml(result);

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(result.sermon_title)}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page { margin: 2.2cm; }
  body { font-family: 'Cairo', 'Tajawal', 'Traditional Arabic', Arial, sans-serif; direction: rtl; text-align: right; color:#111827; }
  h1 { color:#0f5132; font-size:28px; border-bottom: 3px solid #0f5132; padding-bottom: 10px; }
  h3 { color:#8a6d3b; }
</style>
</head>
<body dir="rtl">
<h1>${escapeHtml(result.sermon_title)}</h1>
<h3>ملخص المحتوى</h3>
<p style="font-size:15px; line-height:2; color:#374151;">${escapeHtml(result.summary)}</p>
<hr style="border:none; border-top:1px solid #0f5132; margin:20px 0;" />
<h3>النص الكامل مُشكَّلاً تشكيلاً تامًا</h3>
${bodyHtml}
${quotesHtml}
<p style="margin-top:40px; font-size:12px; color:#6b7280; border-top:1px solid #d1d5db; padding-top:14px;">
تم إعداد هذا المستند آليًا عبر منصة توثيق الخطب الدينية — Designed and Developed by Eng. Ahmed AbdelMaksoud | Phone: 01202224118
</p>
</body>
</html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeTitle}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
