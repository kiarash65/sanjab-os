import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/scores?game=snake → ۲۰ رکورد برتر آن بازی
export async function GET(req: NextRequest) {
  try {
    const game = req.nextUrl.searchParams.get('game')?.trim() ?? ''
    if (!game || game.length > 32) {
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
  try {
    const body = (await req.json()) as {
      game?: string
      name?: string
      score?: number
    }
    const game = (body.game ?? '').trim().slice(0, 32)
    const name = ((body.name ?? '').trim() || 'پنگوئن بی‌نام').slice(0, 24)
    const score = Math.floor(Number(body.score))
    if (!game || !Number.isFinite(score) || score < 0 || score > 1_000_000_000) {
      return NextResponse.json(
        { error: 'داده نامعتبر است' },
        { status: 400 }
      )
    }
    const created = await db.score.create({
      data: { game, name, score },
    })
    const better = await db.score.count({
      where: { game, score: { gt: score } },
    })
    return NextResponse.json({
      ok: true,
      id: created.id,
      rank: better + 1,
    })
  } catch {
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
