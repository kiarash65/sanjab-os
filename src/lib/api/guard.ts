import { NextRequest, NextResponse } from 'next/server'

/* ------------------------------------------------------------------ */
/* گارد مشترک API سان‌جاب‌اواس، محدودسازی نرخ، اندازه و ورودی‌ها       */
/* ------------------------------------------------------------------ */

/**
 * محدودکننده نرخ درون‌حافظه‌ای (پنجره لغزان).
 * نکته صادقانه: برای استقرار تک‌نمونه طراحی شده؛ در استقرار چندنمونه‌ای
 * باید به لایه کش مشترک منتقل شود.
 */
const buckets = new Map<string, number[]>()

export function rateLimit(
  req: NextRequest,
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number } {
  const fwd = req.headers.get('x-forwarded-for') ?? ''
  const ip = fwd.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local'
  const id = `${key}:${ip}`
  const now = Date.now()
  const arr = (buckets.get(id) ?? []).filter((t) => now - t < windowMs)
  if (arr.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - arr[0])) / 1000)
    buckets.set(id, arr)
    return { ok: false, retryAfter: Math.max(1, retryAfter) }
  }
  arr.push(now)
  buckets.set(id, arr)
  // جاروی دوره‌ای برای جلوگیری از رشد حافظه
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k)
    }
  }
  return { ok: true, retryAfter: 0 }
}

export function tooMany(retryAfter: number) {
  return NextResponse.json(
    { error: 'درخواست‌ها زیاد است، چند لحظه صبر کن' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  )
}

/** اندازهٔ واقعی متن UTF-8 بر حسب بایت، نه تعداد واحدهای UTF-16 جاوااسکریپت */
export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength
}

/** حداکثر حجم بدنه مجاز (بایت)، حتی اگر Content-Length ارسال نشده یا نادرست باشد */
export async function readJsonLimited(
  req: NextRequest,
  maxBytes: number
): Promise<{ ok: true; data: unknown } | { ok: false; resp: NextResponse }> {
  const tooLarge = () =>
    NextResponse.json({ error: 'بدنه درخواست بزرگ‌تر از حد مجاز است' }, { status: 413 })

  const declaredLength = Number(req.headers.get('content-length') ?? '0')
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, resp: tooLarge() }
  }

  const chunks: Uint8Array[] = []
  let totalBytes = 0
  const reader = req.body?.getReader()

  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!value) continue
        totalBytes += value.byteLength
        if (totalBytes > maxBytes) {
          await reader.cancel().catch(() => undefined)
          return { ok: false, resp: tooLarge() }
        }
        chunks.push(value)
      }
    } catch {
      return {
        ok: false,
        resp: NextResponse.json({ error: 'خواندن بدنهٔ درخواست ناموفق بود' }, { status: 400 }),
      }
    } finally {
      reader.releaseLock()
    }
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return {
      ok: false,
      resp: NextResponse.json({ error: 'بدنهٔ درخواست باید UTF-8 معتبر باشد' }, { status: 400 }),
    }
  }

  try {
    return { ok: true, data: JSON.parse(text) }
  } catch {
    return {
      ok: false,
      resp: NextResponse.json({ error: 'JSON نامعتبر است' }, { status: 400 }),
    }
  }
}

/** فهرست رسمی بازی‌ها، امتیاز فقط برای این‌ها و در بازه معتبر پذیرفته می‌شود */
export const GAME_REGISTRY: Record<string, { min: number; max: number }> = {
  snake: { min: 0, max: 5000 },
  g2048: { min: 0, max: 200000 },
  tictactoe: { min: 0, max: 100000 },
  memory: { min: 0, max: 5000 },
  minesweeper: { min: 0, max: 100000 },
  pong: { min: 0, max: 50000 },
  flappy: { min: 0, max: 10000 },
  whackamole: { min: 0, max: 10000 },
  breakout: { min: 0, max: 50000 },
  wordle: { min: 0, max: 10000 },
}
