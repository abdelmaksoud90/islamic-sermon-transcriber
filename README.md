# منصة تفريغ وتشكيل الخطب الدينية (Sermon Transcription & Tashkeel Platform)

منصة Full-Stack مبنية بـ **Next.js (App Router) + TypeScript** لتفريغ التسجيلات الصوتية الطويلة للخطب والمحاضرات
الدينية الإسلامية (أكثر من ساعة، وحتى 100 ميجابايت أو أكثر)، وتشكيلها تشكيلاً تامًا إعرابيًا، والتحقق من الآيات
القرآنية والأحاديث النبوية الواردة فيها وتوثيق مصادرها.

## المزايا الرئيسية

- 🔐 بوابة رمز مرور (Passcode Gate) متحركة تحمي الوصول إلى المنصة (الرمز الافتراضي: `270841`).
- 🎙️ رفع ملفات صوتية طويلة (MP3 / WAV / M4A وغيرها) حتى 100 ميجابايت أو أكثر بواجهة سحب وإفلات.
- ✂️ تقسيم الصوت الطويل تلقائيًا إلى أجزاء عبر `fluent-ffmpeg` وإرسالها بالتوازي إلى **OpenAI Whisper** (`whisper-1`).
- ✨ تشكيل تام إعرابي للنص كاملاً عبر **Claude 3.5 Sonnet** (`@anthropic-ai/sdk`) مع تصحيح الآيات القرآنية على
  النص العثماني الرسمي وتوثيق الأحاديث النبوية الشريفة بتخريجها.
- 🖥️ عارض مزدوج (Dual-Pane): النص الخام على اليسار، والنص المُشكَّل بالكامل مع بطاقات مميزة للآيات والأحاديث
  على اليمين.
- 📋 نسخ النص المُشكَّل بضغطة واحدة مع إشعار Toast، وتصدير Word بتنسيق عربي RTL كامل، وطباعة/حفظ كـ PDF.
- 🌙 تصميم داكن إسلامي عصري بخط Cairo/Tajawal واتجاه RTL أصلي بالكامل.
- 🧑‍💻 بصمة المطور ظاهرة دائمًا في الهيدر والفوتر: **Designed and Developed by Eng. Ahmed AbdelMaksoud | Phone: 01202224118**

## البنية التقنية

```
src/
  app/
    api/
      transcribe/route.ts     -> واجهة API الخاصة بالتفريغ والتشكيل (Whisper + Claude)
      health/route.ts         -> فحص صحة قاعدة البيانات
    layout.tsx                 -> تخطيط عام RTL + الخطوط + الهيدر/الفوتر
    page.tsx                   -> الصفحة الرئيسية (بوابة الرمز + الرافع + العارض)
    globals.css                -> التنسيقات العامة والحركات (Tailwind v4)
  components/
    PasscodeGate.tsx            -> بوابة رمز المرور المتحركة
    AudioUploader.tsx           -> رافع الملفات بالسحب والإفلات مع شريط تقدم
    ResultsViewer.tsx           -> العارض المزدوج للنتائج
    DeveloperBadge.tsx          -> بصمة المطور
    Toast.tsx                   -> نظام الإشعارات
  lib/
    openai-client.ts            -> عميل OpenAI
    anthropic-client.ts         -> عميل Anthropic (Claude)
    ffmpeg-config.ts            -> إعداد ffmpeg/ffprobe وتقسيم الصوت
    transcribe-audio.ts         -> منطق تفريغ الصوت وتقسيمه ودمج النصوص
    tashkeel.ts                 -> منطق التشكيل والتحقق من الآيات/الأحاديث عبر Claude
    export-word.ts              -> تصدير النتيجة إلى ملف Word
    concurrency.ts               -> أداة تنفيذ مهام متزامنة بحد أقصى
    types.ts                    -> الأنواع المشتركة
    utils.ts                    -> دوال مساعدة (cn, تنسيق الحجم والمدة)
```

## المتطلبات

- Node.js 20 أو أحدث.
- قاعدة بيانات PostgreSQL (مُهيأة مسبقًا عبر `DATABASE_URL`، تُستخدم فقط لفحص الصحة `/api/health`).
- مفتاح **OpenAI API** يدعم نموذج `whisper-1`.
- مفتاح **Anthropic API** يدعم نموذج `claude-3-5-sonnet-20241022`.

## متغيرات البيئة

انسخ `.env.local.example` إلى `.env.local` (أو أضف القيم مباشرة إلى `.env` في بيئة التطوير المحلية) ثم املأ القيم:

```bash
cp .env.local.example .env.local
```

```
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## التشغيل محليًا

```bash
npm install
npx drizzle-kit push   # لمزامنة مخطط قاعدة البيانات (لا توجد جداول مخصصة حاليًا)
npm run dev
```

ثم افتح المتصفح على `http://localhost:3000`، وأدخل رمز المرور **270841** للدخول إلى المنصة، ثم ارفع ملفًا صوتيًا
لتجربة خط الأنابيب الكامل (Whisper ثم Claude).

> ملاحظة: تنفيذ عملية التفريغ والتشكيل الفعلية يتطلب مفاتيح OpenAI و Anthropic صالحة وحقيقية في متغيرات البيئة.

## رفع المشروع إلى GitHub

```bash
git init
git add .
git commit -m "Initial commit: Sermon transcription & tashkeel platform"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

## النشر على Vercel

1. سجّل الدخول إلى [vercel.com](https://vercel.com) واربط حساب GitHub الخاص بك.
2. اضغط **Add New Project** واختر المستودع الذي رفعته.
3. في إعدادات المشروع أضف متغيرات البيئة التالية من **Project Settings → Environment Variables**:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
4. تأكد أن خطة الاستضافة تدعم مدة تنفيذ Serverless Function كافية (المشروع يضبط `maxDuration = 300` ثانية،
   وهذا متاح على خطط Vercel Pro/Enterprise؛ خطة Hobby تقتصر عادة على 60 ثانية كحد أقصى لدالة واحدة، وقد
   يستدعي ذلك رفع الخطة أو تصغير حجم/مدة الملفات المرفوعة للتسجيلات الطويلة جدًا).
5. لاحظ أن حجم الطلب (Request Body) على بعض خطط Vercel قد يكون محدودًا (~4.5 ميجابايت على بعض الإعدادات)،
   لذلك يُفضّل عند النشر الفعلي لملفات كبيرة جدًا استخدام تخزين وسيط (مثل Vercel Blob) لرفع الملف أولًا ثم
   تمرير رابطه إلى واجهة API، أو الاستضافة الذاتية (Self-Hosted Node Server) عبر `next build && next start`
   والتي لا تفرض هذا القيد.
6. اضغط **Deploy** وانتظر اكتمال البناء.

## ملاحظات تقنية إضافية

- يتم تقسيم الملفات الصوتية الكبيرة (> 25 ميجابايت أو > 15 دقيقة) تلقائيًا إلى أجزاء عبر `ffmpeg` (باستخدام
  `ffmpeg-static` و `ffprobe-static`) دون الحاجة لتثبيت ffmpeg على الخادم يدويًا.
- يتم إرسال أجزاء الصوت إلى Whisper بالتوازي (حتى 3 طلبات متزامنة) لتسريع المعالجة ضمن حدود مهلة التنفيذ.
- يتم تقسيم النص الخام الطويل إلى مقاطع نصية (~6000 حرف) قبل إرسالها إلى Claude 3.5 Sonnet للتشكيل، لتفادي حد
  الحد الأقصى لعدد الرموز الناتجة (Output Tokens) والحفاظ على جودة التشكيل لكل جزء، ثم يتم دمج النتائج بالترتيب.
- تُستخدم ميزة **Tool Use** في Anthropic API لضمان إرجاع استجابة JSON منظمة وموثوقة (`sermon_title`, `summary`,
  `diacritized_text`, `detected_quotes`) بدلاً من الاعتماد على تحليل نص حر.

## بصمة المطور

**Designed and Developed by Eng. Ahmed AbdelMaksoud | Phone: 01202224118**
