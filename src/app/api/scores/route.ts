import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { GAME_REGISTRY, rateLimit, readJsonLimited, tooMany } from '@/lib/api/guard'

export const dynamic = 'force-dynamic'

/* ------------------------------------------------------------------ */
/* جدول امتیازات، با دفتر رسمی بازی‌ها و محدودسازی نرخ                */
/* نکته صادقانه: امتیاز از سمت کلاینت ارسال می‌شود و رمزنگاشتی تأیید   */
/* نمی‌شود؛ دفتر بازی‌ها فقط جلوی داده‌های آشکارا نامعتبر را می‌گیرد.  */
/* ------------------------------------------------------------------ */

const NAME_RE = /^[\p{L}\p{N} _.-]{1,24}$/u

// GET /api/scores?game=snake → ۲۰ رکورد برتر آن بازی
export async function GET(req: NextRequest) {
  const rl = rateLimit(req, 'scores-get', 60, 60_000)
  if (!rl.ok) return tooMany(rl.retryAfter)
  try {
    const game = req.nextUrl.searchParams.get('game')?.trim() ?? ''
    if (!game || game.length > 32 || !(game in GAME_REGISTRY)) {
      return NextResponse.json({ scores: [] })
    }
    const scores = await db.score.findMany({
      where: { game },
      orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
      take: 20,
      select: { id: true, name: true, score: true, createdAt: true },
    })
    return NextResponse.json({ scores })
  } catch {
    return NextResponse.json({ scores: [] }, { status: 200 })
  }
}

// POST /api/scores { game, name, score }
export async function POST(req: NextRequest) {
  const rl = rateLimit(req, 'scores-post', 10, 60_000)
  if (!rl.ok) return tooMany(rl.retryAfter)

  const body = await readJsonLimited(req, 512)
  if (!body.ok) return body.resp
  const { game, name, score } = (body.data ?? {}) as {
    game?: string
    name?: string
    score?: number
  }

  const g = (game ?? '').trim().slice(0, 32)
  if (!g || !(g in GAME_REGISTRY)) {
    return NextResponse.json({ error: 'بازی ناشناخته است' }, { status: 400 })
  }
  const n = ((name ?? '').trim() || 'پنگوئن بی‌نام').slice(0, 24)
  if (!NAME_RE.test(n)) {
    return NextResponse.json({ error: 'نام شامل کاراکترهای مجاز نیست' }, { status: 400 })
  }
  const s = Math.floor(Number(score))
  const limits = GAME_REGISTRY[g]
  if (!Number.isFinite(s) || s < limits.min || s > limits.max) {
    return NextResponse.json(
      { error: 'امتیاز خارج از بازه مجاز این بازی است' },
      { status: 400 }
    )
  }

  try {
    const created = await db.score.create({
      data: { game: g, name: n, score: s },
    })
    const better = await db.score.count({
      where: { game: g, score: { gt: s } },
    })
    return NextResponse.json({
      ok: true,
      id: created.id,
      rank: better + 1,
    })
  } catch {
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
