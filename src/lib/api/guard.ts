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

/** حداکثر حجم بدنه مجاز (بایت)، درخواست‌های بزرگ‌تر رد می‌شوند */
export async function readJsonLimited(
  req: NextRequest,
  maxBytes: number
): Promise<{ ok: true; data: unknown } | { ok: false; resp: NextResponse }> {
  const len = Number(req.headers.get('content-length') ?? '0')
  if (Number.isFinite(len) && len > maxBytes) {
    return {
      ok: false,
      resp: NextResponse.json({ error: 'بدنه درخواست بزرگ‌تر از حد مجاز است' }, { status: 413 }),
    }
  }
  const text = await req.text()
  if (text.length > maxBytes) {
    return {
      ok: false,
      resp: NextResponse.json({ error: 'بدنه درخواست بزرگ‌تر از حد مجاز است' }, { status: 413 }),
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
