import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { rateLimit, readJsonLimited, tooMany } from '@/lib/api/guard'
import { helpContextForPrompt } from '@/lib/os/help'

export const dynamic = 'force-dynamic'

/* ------------------------------------------------------------------ */
/* راهنمای سنجابک — پاسخ هوشمند «اختیاری» بالای دانش محلی.              */
/* دانش اصلی از رجیستری کمک (help.ts) می‌آید و به‌عنوان زمینهٔ فقط-خواندنی*/
/* به مدل داده می‌شود. کلیدها/دادهٔ شخصی هرگز به این مسیر نمی‌آیند.      */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `تو «راهنمای سنجابک» هستی؛ دستیار راهنمای سیستم‌عامل آموزشی سان‌جاب‌اواس.
وظیفه‌ات توضیح رابط کاربری، اپ‌ها و قابلیت‌های سیستم است — نه آموزش برنامه‌نویسی عمومی.
قواعد:
1. فقط بر اساس «دانش سیستم» زیر جواب بده؛ اگر جواب در آن نبود صادقانه بگو «این مورد در راهنمای محلی نیست».
2. فارسی، صمیمی، حداکثر ۸۰ کلمه، بدون ایموجی.
3. اگر اپ نیاز به اینترنت یا کلید دارد، صادقانه بگو.
4. قدم‌به‌قدم و عملی جواب بده.`

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, 'guide', 8, 60_000)
  if (!rl.ok) return tooMany(rl.retryAfter)

  const body = await readJsonLimited(req, 4096)
  if (!body.ok) return body.resp
  const { question, appIds } = (body.data ?? {}) as { question?: string; appIds?: unknown }
  const q = (question ?? '').trim().slice(0, 600)
  if (!q) return NextResponse.json({ error: 'سوالی نپرسیدی!' }, { status: 400 })

  const ids = Array.isArray(appIds) ? appIds.filter((x): x is string => typeof x === 'string').slice(0, 8) : []
  const context = helpContextForPrompt(ids)

  try {
    const zai = await ZAI.create()
    const completion = await Promise.race([
      zai.chat.completions.create({
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\n=== دانش سیستم (فقط-خواندنی) ===\n${context}` },
          { role: 'user', content: q },
        ],
        thinking: { type: 'disabled' },
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 30_000)),
    ])

    const answer = completion.choices[0]?.message?.content?.trim()
    if (!answer) return NextResponse.json({ error: 'پاسخی نیامد' }, { status: 502 })
    return NextResponse.json({ answer })
  } catch {
    // هیچ جزئیات داخلی/کلیدی لو نمی‌رود
    return NextResponse.json({ error: 'راهنمای هوشمند موقتاً در دسترس نیست — پاسخ‌های محلی همان‌جا هستند.' }, { status: 502 })
  }
}
