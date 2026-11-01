import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `تو «پنگوئن‌بات» هستی؛ دستیار آموزشی ترمینال داخل یک سیستم‌عامل خیالی به نام پنگوئن‌اواس (PenguinOS) که در مرورگر اجرا می‌شود.

کاربرها مبتدی هستند و ترمینال یاد می‌گیرند. قواعد پاسخ:
1. همیشه فارسی، صمیمی و کوتاه جواب بده (حداکثر ۹۰ کلمه).
2. دستورهای ترمینال را در خط جدا و با فرمت "دستور: مثال" بده. مثلاً: دستور: ls -la
3. فقط دستورهای ساده لینوکس/شل را آموزش بده: ls, cd, pwd, cat, mkdir, touch, echo, rm, cp, mv, tree, find, grep, head, tail, wc, man, history, ps.
4. اگر سؤال خارج از ترمینال بود، مؤدبانه برگردان به موضوع ترمینال.
5. هیچ ایموجی استفاده نکن.
6. دستورها را عملاً قابل امتحان در فایل‌سیستم خیالی کاربر بده (خانه‌اش /home/pengo است و پوشه‌های عکس‌ها، سندها، موسیقی، پروژه‌ها دارد).`

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { question?: string }
    const question = (body.question ?? '').trim().slice(0, 500)
    if (!question) {
      return NextResponse.json(
        { error: 'سوالی نپرسیدی!' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT },
        { role: 'user', content: question },
      ],
      thinking: { type: 'disabled' },
    })

    const answer = completion.choices[0]?.message?.content?.trim()
    if (!answer) {
      return NextResponse.json(
        { error: 'پاسخی نیامد' },
        { status: 502 }
      )
    }
    return NextResponse.json({ answer })
  } catch {
    return NextResponse.json(
      { error: 'سرور مغز در دسترس نیست' },
      { status: 500 }
    )
  }
}
