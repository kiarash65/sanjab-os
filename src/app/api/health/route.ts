/* Endpoint سلامت سیستم — توسط راه‌انداز دسکتاپ (Tauri) و حالت توسعه‌دهنده استفاده می‌شود.
   عمداً هیچ اطلاعات حساسی برنمی‌گرداند؛ فقط آمادگی سرویس و وضعیت دیتابیس. */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { OS_VERSION } from '@/lib/os/version'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startedAt = Date.now()
  let database: 'ok' | 'unavailable' = 'unavailable'
  try {
    // کوئری سبک و بدون داده — فقط بررسی اتصال
    await db.$queryRaw`SELECT 1`
    database = 'ok'
  } catch {
    database = 'unavailable'
  }

  return NextResponse.json(
    {
      ok: true,
      service: 'sanjabos-web',
      version: OS_VERSION,
      database,
      latencyMs: Date.now() - startedAt,
      uptimeSec: Math.round(process.uptime()),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
