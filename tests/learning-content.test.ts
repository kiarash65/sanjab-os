import { readFileSync } from 'node:fs'
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
    name: 'رجیستری مرکز یادگیری با شناسه‌های واقعی آکادمی‌ها همگام است',
    run: () => {
      const registry = readFileSync('src/lib/learning/lessons.ts', 'utf8')
      const psSource = readFileSync('src/components/os/apps/powershell-academy.tsx', 'utf8')
      const rustSource = readFileSync('src/components/os/apps/rust-academy.tsx', 'utf8')
      const deepSource = readFileSync('src/components/os/academy/deep.tsx', 'utf8')
      const aiSource = readFileSync('src/components/os/apps/ai-academy.tsx', 'utf8')

      const between = (source: string, start: string, end: string): string => {
        const from = source.indexOf(start)
        const to = source.indexOf(end, from + start.length)
        assert(from >= 0 && to > from, 'بازهٔ کد پیدا نشد: ' + start)
        return source.slice(from, to)
      }
      const mapKeys = (name: string, next: string): string[] =>
        Array.from(between(registry, 'const ' + name + ':', 'const ' + next + ':').matchAll(/^\s*'([^']+)'\s*:/gm), (m) => m[1]!)
      const ids = (source: string, expression: RegExp): string[] =>
        Array.from(source.matchAll(expression), (m) => m[1]!)
      const sameSet = (label: string, actual: string[], expected: string[]) => {
        const a = [...new Set(actual)].sort()
        const e = [...new Set(expected)].sort()
        assert(JSON.stringify(a) === JSON.stringify(e), label + ': رجیستری=' + e.join(', ') + '؛ آکادمی=' + a.join(', '))
      }

      const powershell = mapKeys('POWERSHELL_TITLES', 'AI_TITLES')
      sameSet('PowerShell', powershell, ids(psSource, /\bid:\s*'(ps-[^']+)'/g))
      assert(powershell.length === 15, 'تعداد درس‌های PowerShell باید ۱۵ باشد؛ فعلی: ' + powershell.length)

      const rust = mapKeys('RUST_TITLES', 'POWERSHELL_TITLES')
      sameSet('Rust', rust, ids(rustSource, /\bid:\s*'((?:rust-|own-|st-|conc-)[^']+)'/g))
      assert(rust.length === 23, 'تعداد درس‌های Rust باید ۲۳ باشد؛ فعلی: ' + rust.length)

      const ai = mapKeys('AI_TITLES', 'LINUX_TITLES')
      const aiSections = between(aiSource, 'const SECTIONS: SectionDef[] = [', '/* ================================================================\n   داده‌های ثابت')
      sameSet('هوش مصنوعی', ai, ids(aiSections, /\bid:\s*'([^']+)'/g))
      assert(ai.length === 13, 'تعداد بخش‌های AI باید ۱۳ باشد؛ فعلی: ' + ai.length)

      const linux = mapKeys('LINUX_TITLES', 'PY_TITLES')
      const linuxCore = ['what', 'where', 'distros', 'install', 'terminal', 'permissions', 'procs', 'quiz']
      const deepChapters = ids(
        between(deepSource, 'export const DEEP_CHAPTERS: DeepChapterDef[] = [', 'export const DEEP_IDS'),
        /\bid:\s*'([^']+)'/g,
      )
      sameSet('Linux', linux, [...linuxCore, ...deepChapters])
      assert(linux.length === 14, 'تعداد فصل‌ها و آزمون Linux باید ۱۴ باشد؛ فعلی: ' + linux.length)
    },
  },
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
