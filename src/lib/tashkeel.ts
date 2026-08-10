import { getOpenAIClient } from "./openai-client";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "@/lib/anthropic-client";
import { mapWithConcurrency } from "@/lib/concurrency";
import type { DetectedQuote, SermonAnalysis } from "@/lib/types";

const CLAUDE_MODEL = "claude-3-5-sonnet-20241022";
const MAX_SEGMENT_CHARACTERS = 6000;
const SEGMENT_CONCURRENCY = 3;
const OVERVIEW_EXCERPT_LIMIT = 12000;

interface RawQuote {
  type?: string;
  text?: string;
  reference?: string;
}

interface SegmentResult {
  diacritized_text: string;
  detected_quotes: DetectedQuote[];
}

const DIACRITIZATION_SYSTEM_PROMPT = `أنت عالم شرعي أزهري ومدقق لغوي متخصص في اللغة العربية الفصحى والنحو والصرف وعلوم القرآن الكريم والحديث النبوي الشريف. تُعالج أجزاءً متتالية من نص خطبة أو محاضرة دينية إسلامية واحدة مفرغة آليًا من تسجيل صوتي. يجب عليك تطبيق القواعد التالية بدقة متناهية ودون أي استثناء على كل جزء يصلك:

1. التشكيل التام الإعرابي: ضع التشكيل الكامل (فتحة، ضمة، كسرة، سكون، شدة، تنوين) على كل حرف من حروف كل كلمة في النص بالكامل دون أي استثناء، مع مراعاة القواعد النحوية والصرفية الدقيقة حسب الموقع الإعرابي لكل كلمة في الجملة. لا تترك أي كلمة، ولو كانت أداة أو حرف جر أو ضمير، دون تشكيل كامل.
2. الآيات القرآنية: إذا ورد في النص استشهاد بآية قرآنية كريمة أو إشارة إليها ولو بتصرف يسير، استخرجها وصحّح لفظها بالكامل ليطابق النص العثماني الرسمي للمصحف الشريف تمامًا مع تشكيله الكامل الصحيح، ثم ضع بعدها مباشرة اسم السورة ورقم الآية بين قوسين معقوفين هكذا: [سورة البقرة: 183]. أضف الآية المصححة إلى قائمة الاستشهادات المكتشفة بنوع "quran".
3. الأحاديث النبوية الشريفة: إذا ورد في النص استشهاد بحديث نبوي شريف، صحّح متنه ليطابق الرواية الصحيحة المعروفة قدر استطاعتك، ثم ضع بعده مباشرة تخريجًا موثوقًا بين قوسين معقوفين هكذا: [رواه البخاري] أو [رواه مسلم] أو [رواه الترمذي وحسّنه الألباني]، وإن لم تكن متأكدًا تمامًا من الرواية الدقيقة أو التخريج الصحيح فاكتب [حديث يحتاج إلى تخريج] ولا تختلق مصدرًا. أضف الحديث إلى قائمة الاستشهادات المكتشفة بنوع "hadith".
4. تصحيح الأخطاء: صحّح أي خطأ لغوي أو نحوي أو سبق لسان واضح ورد أثناء الإلقاء الصوتي دون أي تغيير في المعنى أو الأسلوب المقصود من كلام المتحدث الأصلي.
5. التنسيق: نظّم نص هذا الجزء إلى فقرات منطقية متماسكة مفصولة بأسطر فارغة، وإذا شعرت ببداية محور جديد واضح داخل هذا الجزء أضف عنوانًا فرعيًا مناسبًا بصيغة Markdown يبدأ بـ "## "، وإلا فاستمر في تنسيق فقرات عادية متصلة دون افتعال عناوين غير ضرورية.
6. لا تحذف أي معلومة أو جملة وردت في النص الأصلي، ولا تضف شرحًا أو تعليقًا من عندك خارج النص المُشكَّل نفسه.
7. تذكّر أن هذا الجزء هو استكمال لأجزاء أخرى من نفس الخطبة، فحافظ على الاتساق في الأسلوب والسياق دون تكرار مقدمات أو خواتيم لا داعي لها.

أخرج النتيجة حصريًا عبر استدعاء الأداة submit_segment_analysis، ولا تكتب أي نص خارج نطاق الأداة إطلاقًا.`;

const OVERVIEW_SYSTEM_PROMPT = `أنت محرر شرعي متخصص في تحرير عناوين وملخصات الخطب والمحاضرات الدينية الإسلامية باللغة العربية الفصحى. مهمتك قراءة النص الخام لخطبة أو محاضرة دينية (قد يكون مقتطفًا من نص أطول) ثم:

1. اقترح عنوانًا جذابًا ومناسبًا وموجزًا يعكس الموضوع الرئيسي للخطبة أو المحاضرة دون تشكيل.
2. اكتب ملخصًا موجزًا لا يتجاوز خمسة أسطر يلخّص أهم محاور الخطبة أو المحاضرة بأسلوب فصيح واضح دون تشكيل.

أخرج النتيجة حصريًا عبر استدعاء الأداة submit_overview، ولا تكتب أي نص خارج نطاق الأداة إطلاقًا.`;

const segmentTool: Anthropic.Tool = {
  name: "submit_segment_analysis",
  description:
    "تسليم النص الكامل لهذا الجزء بعد التشكيل التام وتصحيح الآيات والأحاديث، مع قائمة الاستشهادات القرآنية والحديثية المكتشفة فيه.",
  input_schema: {
    type: "object",
    properties: {
      diacritized_text: {
        type: "string",
        description: "نص هذا الجزء بعد التشكيل التام الإعرابي وتصحيح الآيات والأحاديث وإضافة العناوين الفرعية عند اللزوم",
      },
      detected_quotes: {
        type: "array",
        description: "قائمة بكل الآيات القرآنية والأحاديث النبوية المكتشفة في هذا الجزء فقط",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["quran", "hadith"] },
            text: { type: "string", description: "النص الكامل المشكّل للآية أو الحديث" },
            reference: { type: "string", description: "المرجع مثل اسم السورة ورقم الآية أو من رواه" },
          },
          required: ["type", "text", "reference"],
        },
      },
    },
    required: ["diacritized_text", "detected_quotes"],
  },
};

const overviewTool: Anthropic.Tool = {
  name: "submit_overview",
  description: "تسليم عنوان جذاب وملخص موجز للخطبة أو المحاضرة الدينية.",
  input_schema: {
    type: "object",
    properties: {
      sermon_title: { type: "string", description: "عنوان مقترح ومناسب للخطبة أو المحاضرة" },
      summary: { type: "string", description: "ملخص موجز لا يتجاوز خمسة أسطر" },
    },
    required: ["sermon_title", "summary"],
  },
};

function splitTranscriptIntoSegments(rawText: string, maxChars: number): string[] {
  const paragraphs = rawText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const segments: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length > maxChars && current) {
      segments.push(current);
      current = paragraph;
    } else {
      current = candidate;
    }

    while (current.length > maxChars * 1.5) {
      segments.push(current.slice(0, maxChars));
      current = current.slice(maxChars);
    }
  }

  if (current.trim().length > 0) {
    segments.push(current);
  }

  return segments.length > 0 ? segments : [rawText];
}

function normalizeQuotes(quotes: RawQuote[] | undefined): DetectedQuote[] {
  if (!Array.isArray(quotes)) {
    return [];
  }

  return quotes
    .filter((quote) => quote && typeof quote.text === "string" && quote.text.trim().length > 0)
    .map((quote) => ({
      type: quote.type === "hadith" ? "hadith" : ("quran" as const),
      text: (quote.text ?? "").trim(),
      reference: (quote.reference ?? "").trim(),
    }));
}

function extractToolInput<T>(response: Anthropic.Message, toolName: string): T {
  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use" && block.name === toolName,
  );

  if (!toolBlock) {
    throw new Error("تعذّر الحصول على استجابة منظمة من محرك التشكيل والتحقق (Claude 3.5 Sonnet).");
  }

  return toolBlock.input as T;
}

async function diacritizeSegment(
  segment: string,
  segmentIndex: number,
  totalSegments: number,
): Promise<SegmentResult> {
  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    system: DIACRITIZATION_SYSTEM_PROMPT,
    tool_choice: { type: "tool", name: "submit_segment_analysis" },
    tools: [segmentTool],
    messages: [
      {
        role: "user",
        content: `هذا الجزء رقم ${segmentIndex + 1} من إجمالي ${totalSegments} جزءًا لنص خطبة أو محاضرة دينية واحدة متصلة. طبّق التشكيل التام الإعرابي والتحقق من الآيات والأحاديث على هذا الجزء فقط، مع الحفاظ على تسلسل المعنى والسياق العام للخطبة:\n\n---\n${segment}\n---`,
      },
    ],
  });

  const input = extractToolInput<{ diacritized_text?: string; detected_quotes?: RawQuote[] }>(
    response,
    "submit_segment_analysis",
  );

  return {
    diacritized_text: input.diacritized_text?.trim() ?? "",
    detected_quotes: normalizeQuotes(input.detected_quotes),
  };
}

async function generateOverview(rawText: string): Promise<{ sermon_title: string; summary: string }> {
  const anthropic = getAnthropicClient();

  const excerpt =
    rawText.length > OVERVIEW_EXCERPT_LIMIT
      ? `${rawText.slice(0, OVERVIEW_EXCERPT_LIMIT)}\n...\n[تم اقتطاع باقي النص لأغراض التلخيص فقط]`
      : rawText;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: OVERVIEW_SYSTEM_PROMPT,
    tool_choice: { type: "tool", name: "submit_overview" },
    tools: [overviewTool],
    messages: [
      {
        role: "user",
        content: `فيما يلي النص الخام لخطبة أو محاضرة دينية إسلامية (قد يكون مقتطفًا من نص أطول). ضع لها عنوانًا مناسبًا وملخصًا موجزًا لا يتجاوز خمسة أسطر:\n\n---\n${excerpt}\n---`,
      },
    ],
  });

  const input = extractToolInput<{ sermon_title?: string; summary?: string }>(response, "submit_overview");

  return {
    sermon_title: input.sermon_title?.trim() || "خطبة دينية بدون عنوان",
    summary: input.summary?.trim() || "",
  };
}

export async function generateDiacritizedAnalysis(rawText: string): Promise<SermonAnalysis> {
  const segments = splitTranscriptIntoSegments(rawText, MAX_SEGMENT_CHARACTERS);
  const totalSegments = segments.length;

  const [segmentResults, overview] = await Promise.all([
    mapWithConcurrency(segments, SEGMENT_CONCURRENCY, (segment, index) =>
      diacritizeSegment(segment, index, totalSegments),
    ),
    generateOverview(rawText),
  ]);

  const diacritizedText = segmentResults
    .map((result) => result.diacritized_text)
    .filter((text) => text.length > 0)
    .join("\n\n");

  const detectedQuotesMap = new Map<string, DetectedQuote>();
  for (const segmentResult of segmentResults) {
    for (const quote of segmentResult.detected_quotes) {
      const key = `${quote.type}::${quote.text}`;
      if (!detectedQuotesMap.has(key)) {
        detectedQuotesMap.set(key, quote);
      }
    }
  }

  return {
    sermon_title: overview.sermon_title,
    summary: overview.summary,
    diacritized_text: diacritizedText,
    detected_quotes: Array.from(detectedQuotesMap.values()),
  };
}
