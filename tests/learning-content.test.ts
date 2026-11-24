import { NextRequest } from 'next/server'
import { PYTHON_LESSONS, PY_PASS } from '../src/lib/academy/python-curriculum'
import { TERMINAL_MISSIONS } from '../src/lib/os/academy-data'
import { readJsonLimited, utf8ByteLength } from '../src/lib/api/guard'

type Check = { name: string; run: () => void | Promise<void> }

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const checks: Check[] = [
  {
    name: 'شناسه‌های ۲۶ گام پایتون یکتا و پایدارند',
    run: () => {
      const ids = PYTHON_LESSONS.map((lesson) => lesson.id)
      assert(ids.length === 26, `تعداد گام‌ها ${ids.length} است، انتظار ۲۶ بود`)
      assert(new Set(ids).size === ids.length, 'شناسهٔ تکراری در برنامهٔ درسی پایتون پیدا شد')
      assert(ids.includes('l0-what') && ids.includes('l8-csv'), 'شناسه‌های ابتدا یا انتهای مسیر تغییر کرده‌اند')
    },
  },
  {
    name: 'تمرین‌های پایتون سرنخ مرحله‌ای و تست واقعی دارند',
    run: () => {
      const weak = PYTHON_LESSONS
        .filter((lesson) => lesson.exercise.hints.length < 2 || !lesson.exercise.tests.includes(PY_PASS))
        .map((lesson) => lesson.id)
      assert(weak.length === 0, `تمرین‌های نیازمند اصلاح: ${weak.join(', ')}`)
    },
  },
  {
    name: 'پاسخ‌های آزمونک داخل محدودهٔ گزینه‌ها هستند',
    run: () => {
      for (const lesson of PYTHON_LESSONS) {
        for (const question of lesson.quiz) {
          assert(question.options.length >= 2, `آزمونک بدون گزینهٔ کافی: ${lesson.id}`)
          assert(question.answer >= 0 && question.answer < question.options.length, `اندیس پاسخ نامعتبر: ${lesson.id}`)
        }
      }
    },
  },
  {
    name: 'مأموریت‌های لینوکس شناسهٔ یکتا و سرنخ‌های چندمرحله‌ای دارند',
    run: () => {
      const ids = TERMINAL_MISSIONS.map((mission) => mission.id)
      assert(ids.length === 10, `تعداد مأموریت‌ها ${ids.length} است، انتظار ۱۰ بود`)
      assert(new Set(ids).size === ids.length, 'شناسهٔ مأموریت تکراری است')
      assert(TERMINAL_MISSIONS.every((mission) => mission.hints.length >= 2), 'مأموریتی با کمتر از دو سرنخ پیدا شد')
    },
  },
  {
    name: 'محدودیت اندازه بر اساس بایت UTF-8 محاسبه می‌شود',
    run: () => {
      const body = JSON.stringify({ name: 'سنجاب‌اواس 🐿️' })
      assert(utf8ByteLength(body) > body.length, 'تست باید متن چندبایتی داشته باشد')
    },
  },
  {
    name: 'بدنهٔ JSON فارسی با عبور از سقف بایت رد می‌شود',
    run: async () => {
      const body = JSON.stringify({ name: 'سنجاب‌اواس 🐿️' })
      const req = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      })
      const result = await readJsonLimited(req, body.length)
      assert(!result.ok, 'بدنه‌ای که از سقف بایت عبور کرد پذیرفته شد')
      if (!result.ok) assert(result.resp.status === 413, 'کد پاسخ برای بدنهٔ بزرگ باید ۴۱۳ باشد')
    },
  },
  {
    name: 'JSON معتبر در سقف دقیق بایت پذیرفته می‌شود',
    run: async () => {
      const body = JSON.stringify({ name: 'سلام' })
      const req = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      })
      const result = await readJsonLimited(req, utf8ByteLength(body))
      assert(result.ok, 'JSON معتبر در سقف مجاز رد شد')
      if (result.ok) assert(JSON.stringify(result.data) === JSON.stringify({ name: 'سلام' }), 'بدنهٔ JSON درست decode نشد')
    },
  },
]

const failures: string[] = []
for (const check of checks) {
  try {
    await check.run()
    console.log(`✓ ${check.name}`)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    failures.push(`${check.name}: ${detail}`)
    console.error(`✗ ${check.name}: ${detail}`)
  }
}
if (failures.length > 0) {
  throw new Error(`${failures.length} آزمون از ${checks.length} آزمون شکست خورد`)
}
console.log(`تمام ${checks.length} آزمون کیفیت محتوا و API با موفقیت گذشتند.`)
