import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { rateLimit, readJsonLimited, tooMany } from '@/lib/api/guard'

export const dynamic = 'force-dynamic'

/* ------------------------------------------------------------------ */
/* دستیار آموزشی ترمینال، نقش system رسمی + محدودسازی نرخ و زمان       */
/* کلید‌های ارائه‌دهنده فقط سمت سرور استفاده می‌شوند و به کلاینت       */
/* نمی‌رسند. پاسخ خطا جزئیات داخلی را لو نمی‌دهد.                      */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `تو «پنگوئن‌بات» هستی؛ دستیار آموزشی ترمینال داخل یک سیستم‌عامل آموزشی به نام سان‌جاب‌اواس که در مرورگر اجرا می‌شود.

کاربرها مبتدی هستند و ترمینال یاد می‌گیرند. قواعد پاسخ:
1. همیشه فارسی، صمیمی و کوتاه جواب بده (حداکثر ۹۰ کلمه).
2. دستورهای ترمینال را در خط جدا و با فرمت "دستور: مثال" بده. مثلاً: دستور: ls -la
3. فقط دستورهای ساده لینوکس/شل را آموزش بده: ls, cd, pwd, cat, mkdir, touch, echo, rm, cp, mv, tree, find, grep, head, tail, wc, man, history, ps.
4. اگر سؤال خارج از ترمینال بود، مؤدبانه برگردان به موضوع ترمینال.
5. هیچ ایموجی استفاده نکن.
6. دستورها را عملاً قابل امتحان در فایل‌سیستم خیالی کاربر بده (خانه‌اش /home/pengo است و پوشه‌های عکس‌ها، سندها، موسیقی، پروژه‌ها دارد).`

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, 'tutor', 8, 60_000)
  if (!rl.ok) return tooMany(rl.retryAfter)

  const body = await readJsonLimited(req, 2048)
  if (!body.ok) return body.resp
  const { question } = (body.data ?? {}) as { question?: string }
  const q = (question ?? '').trim().slice(0, 500)
  if (!q) {
    return NextResponse.json({ error: 'سوالی نپرسیدی!' }, { status: 400 })
  }

  try {
    const zai = await ZAI.create()
    // نکته: زای‌ای SDK نقش system را مثل بقیه پیام‌ها می‌پذیرد؛ نقش رسمی system است.
    const completion = await Promise.race([
      zai.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: q },
        ],
        thinking: { type: 'disabled' },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 30_000)
      ),
    ])

    const answer = completion.choices[0]?.message?.content?.trim()
    if (!answer) {
      return NextResponse.json({ error: 'پاسخی نیامد' }, { status: 502 })
    }
    return NextResponse.json({ answer })
  } catch {
    return NextResponse.json(
      { error: 'سرور مغز در دسترس نیست' },
      { status: 500 }
    )
  }
}
