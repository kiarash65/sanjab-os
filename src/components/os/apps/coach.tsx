'use client'

/* ------------------------------------------------------------------ */
/* مربی سنجاب (Sanjab Coach) — دستیار یادگیری Context-Aware            */
/* از زیرساخت هوش‌یار (BYOK + aiComplete) استفاده می‌کند — بدون کلید    */
/* یا Provider جدید. ارسال زمینه فقط با رضایت صریح کاربر، سقف مصرف      */
/* روزانه، امکان خاموش‌کردن کامل از تنظیمات، و حالت Quiz Me آفلاین.     */
/* ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from 'react'
import {
  BookOpenCheck,
  Bot,
  CircleHelp,
  Eraser,
  Eye,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Send,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { aiComplete, hasAICfg, loadAICfg, type ChatMsg } from '@/lib/os/integrations'
import { useOS } from '@/lib/os/store'
import { useLearning } from '@/lib/learning/store'
import { TRACK_LESSONS } from '@/lib/learning/lessons'
import { TRACK_TITLES } from '@/lib/learning/types'
import { buildQuiz } from '@/lib/learning/assessment'
import { QUESTION_BANK } from '@/lib/learning/banks'
import QuestionCard from '@/components/os/academy/question-card'
import { SKILLS } from '@/lib/learning/skills'
import { launch } from '@/lib/os/apps'

const fa = (n: number | string) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

type Mode = 'explain' | 'socratic' | 'hint' | 'debug' | 'review' | 'quiz' | 'reflect'

const MODES: { id: Mode; label: string; Icon: typeof Eye; desc: string; system: string }[] = [
  {
    id: 'explain',
    label: 'توضیح بده',
    Icon: GraduationCap,
    desc: 'مفهوم را در سطح مناسب من ساده ولی دقیق توضیح بده.',
    system:
      'تو «مربی سنجاب» هستی، مربی یادگیری SanjabOS. فارسی روان و صمیمی جواب بده. مفاهیم را ساده توضیح بده ولی دقت علمی را از دست نده. از مثال اجرایی استفاده کن و برای ادعاهای مهم به منابع اشاره کن. اگر مطمئن نیستی، صادقانه بگو مطمئن نیستی.',
  },
  {
    id: 'socratic',
    label: 'سقراطی',
    Icon: CircleHelp,
    desc: 'جواب مستقیم نده — با سؤال هدایتم کن.',
    system:
      'تو «مربی سنجاب» با روش سقراطی هستی. هرگز جواب نهایی را مستقیم نگو؛ با سؤال‌های مرحله‌ای کوتاه کاربر را به سمت کشف پاسخ هدایت کن. هر پاسخ حداکثر ۳ جمله و یک سؤال هدایتگر داشته باشد. اگر کاربر بعد از ۳ تلاش ناکام ماند، راهنمایی روشن‌تری بده.',
  },
  {
    id: 'hint',
    label: 'سرنخ بده',
    Icon: Lightbulb,
    desc: 'برای حل مسئله سرنخ مرحله‌ای بده.',
    system:
      'تو «مربی سنجاب» هستی. برای مسئلهٔ کاربر فقط یک سرنخ مرحله‌ای بده که به‌سمت راه‌حل هدایت کند ولی جواب را لو ندهد. اگر کاربر خواست، سرنخ بعدی را بده. جواب کامل را فقط با درخواست صریح کاربر و بعد از اعلام «راه‌حل کامل» بگو.',
  },
  {
    id: 'debug',
    label: 'دیباگ کوه',
    Icon: Wrench,
    desc: 'خطا را تحلیل کن و روش پیدا کردنش را آموزش بده.',
    system:
      'تو «مربی سنجاب» در حالت Debugging Coach هستی. به‌جای اصلاح کد کاربر، اول تحلیل کن خطا از کجاست، بعد روش سیستماتیک پیدا کردن باگ را آموزش بده (خواندن پیام خطا، trace کردن، ساده‌سازی). در نهایت راه‌حل پیشنهادی را با توضیح بده.',
  },
  {
    id: 'review',
    label: 'بازبینی کد',
    Icon: BookOpenCheck,
    desc: 'کدم را از نظر خوانایی و کارایی بررسی کن.',
    system:
      'تو «مربی سنجاب» در حالت Code Review هستی. کد کاربر را از نظر خوانایی، ساختار، باگ‌های احتمالی و کارایی بررسی کن. اول نکات مثبت، بعد مشکلات به‌ترتیب اهمیت، و در پایان یک پیشنهاد بهبود مشخص. فارسی جواب بده، کد را انگلیسی نگه دار.',
  },
  {
    id: 'quiz',
    label: 'Quiz Me',
    Icon: ListChecks,
    desc: 'آزمون بازیابی حافظه — کاملاً آفلاین از بانک سؤال سنجاب‌اواس.',
    system: '', /* آفلاین — بدون AI */
  },
  {
    id: 'reflect',
    label: 'بازاندیشی',
    Icon: Eye,
    desc: 'کمکم بفهم چرا در این مفهوم گیر می‌کنم.',
    system:
      'تو «مربی سنجاب» در حالت Learning Reflection هستی. به کاربر کمک کن بفهمد چرا در یک مفهوم مشکل دارد: سؤال کن کجای توضیح مبهم بود، کدام مثال را نفهمید، آیا پیش‌نیازی جا افتاده. سپس یک نقشهٔ کوچک جبران پیشنهاد بده.',
  },
]

const DAILY_CAP = 40

export default function CoachApp() {
  const coachEnabled = useOS((s) => s.settings.coachEnabled)
  const pushToast = useOS((s) => s.pushToast)
  const profile = useLearning((s) => s.profile)

  const [mode, setMode] = useState<Mode>('explain')
  const [consent, setConsent] = useState(false)
  const [track, setTrack] = useState<string>('')
  const [lesson, setLesson] = useState<string>('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [usage, setUsage] = useState(0)
  const [quizPool, setQuizPool] = useState<ReturnType<typeof buildQuiz>>([])
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const configured = typeof window !== 'undefined' && hasAICfg()

  /* سقف مصرف روزانه — فقط شمارندهٔ محلی، بدون محتوای پیام */
  useEffect(() => {
    try {
      const today = new Date().toDateString()
      const raw = localStorage.getItem('sanjab-coach-usage-v1')
      if (raw) {
        const d = JSON.parse(raw) as { day: string; count: number }
        if (d.day === today) setUsage(d.count)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const bumpUsage = () => {
    const today = new Date().toDateString()
    const next = usage + 1
    setUsage(next)
    try {
      localStorage.setItem('sanjab-coach-usage-v1', JSON.stringify({ day: today, count: next }))
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, busy])

  const contextBlock = () => {
    if (!consent) return null
    const parts: string[] = []
    if (track) {
      parts.push(`مسیر فعلی کاربر: ${TRACK_TITLES[track as keyof typeof TRACK_TITLES] ?? track}`)
      if (lesson) {
        const info = TRACK_LESSONS[track]?.find((l) => l.id === lesson)
        if (info) parts.push(`درس فعلی: «${info.title}»`)
      }
    }
    /* زمینهٔ واقعی و حداقلی — آخرین درس و تعداد مرور سررسید؛ بدون دادهٔ شخصی */
    if (profile.lastSession) {
      parts.push(`آخرین مطالعه: ${TRACK_TITLES[profile.lastSession.track]} / درس ${profile.lastSession.lessonId}`)
    }
    const skills = Object.values(profile.skills).filter((s) => s.state !== 'not-started').length
    parts.push(`مهارت‌های فعال کاربر: ${skills}`)
    return parts.length > 0 ? `\n\n[زمینهٔ یادگیری کاربر — با رضایت خودش ارسال شده]:\n${parts.join('\n')}` : null
  }

  const send = async () => {
    if (!input.trim() || busy) return
    if (!configured) {
      pushToast({ title: 'هوش‌یار تنظیم نشده', body: 'اول در اپ «هوش‌یار» یک Provider و کلید API معرفی کن.' })
      return
    }
    if (usage >= DAILY_CAP) {
      pushToast({ title: 'سقف مصرف روزانهٔ مربی', body: 'امروز از مربی زیاد استفاده کردی — فردا دوباره فعال می‌شود.' })
      return
    }
    const modeDef = MODES.find((m) => m.id === mode)!
    const userMsg = input.trim()
    const sys = modeDef.system + (contextBlock() ?? '')
    const history: ChatMsg[] = [
      { role: 'system', content: sys },
      ...messages.slice(-8).map((m) => ({ role: m.role, content: m.content }) as ChatMsg),
      { role: 'user', content: userMsg },
    ]
    setMessages((cur) => [...cur, { role: 'user', content: userMsg }])
    setInput('')
    setBusy(true)
    const ac = new AbortController()
    abortRef.current = ac
    try {
      const cfg = loadAICfg()
      if (!cfg) throw new Error('no-cfg')
      const reply = await aiComplete(history, cfg, ac.signal)
      setMessages((cur) => [...cur, { role: 'assistant', content: reply }])
      bumpUsage()
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setMessages((cur) => [
          ...cur,
          { role: 'assistant', content: '⚠️ ارتباط با مدل برقرار نشد. Provider و کلید را در «هوش‌یار» چک کن.' },
        ])
      }
    } finally {
      setBusy(false)
    }
  }

  const startQuiz = () => {
    /* Quiz Me — کاملاً آفلاین از بانک سؤال، بدون AI */
    const trackKey = (['python', 'linux', 'rust', 'ai', 'powershell', 'algorithm'] as const).includes(
      track as never
    )
      ? (track as 'python' | 'linux' | 'rust' | 'ai' | 'powershell' | 'algorithm')
      : 'python'
    const skillIds = trackKey ? SKILLS.filter((s) => s.track === trackKey).map((s) => s.id) : undefined
    const exclude = profile.events
      .filter((e) => e.type === 'assessment.submitted')
      .map((e) => e.ref)
      .slice(-20)
    const q = buildQuiz(QUESTION_BANK, { track: trackKey, skillIds, count: 3, exclude })
    setQuizPool(q)
  }

  /* خاموش‌کردن مربی از تنظیمات */
  if (!coachEnabled) {
    return (
      <div className="grid h-full place-items-center p-6 text-center" dir="rtl">
        <div>
          <p className="text-[13px] font-black text-zinc-200">مربی سنجاب خاموش است</p>
          <p className="mx-auto mt-1.5 max-w-xs text-[11px] leading-6 text-zinc-500">
            از تنظیمات ← ترجیحات یادگیری می‌توانی مربی را دوباره روشن کنی. همهٔ بخش‌های آموزشی بدون مربی کامل کار می‌کنند.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col" dir="rtl">
      {/* نوار حالت‌ها */}
      <div className="os-scroll flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 bg-zinc-900/70 px-2 py-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            aria-pressed={mode === m.id}
            title={m.desc}
            className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-black transition ${
              mode === m.id ? 'bg-teal-500/20 text-teal-300' : 'text-zinc-400 hover:bg-white/5'
            }`}
          >
            <m.Icon size={12} aria-hidden />
            {m.label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="os-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {/* توضیح حریم خصوصی */}
        <div className="rounded-xl border border-teal-500/25 bg-teal-500/10 p-2.5 text-[10px] leading-5 text-teal-100/90">
          <ShieldCheck size={12} className="me-1 inline" aria-hidden />
          مربی از همان Provider هوش‌یار استفاده می‌کند؛ کلید API هرگز ارسال یا ذخیره نمی‌شود. ارسال زمینهٔ درس فقط با
          انتخاب تو، سقف مصرف {fa(DAILY_CAP)} پیام/روز، و حالت Quiz Me کاملاً آفلاین است.
        </div>

        {/* زمینهٔ اختیاری */}
        <div className="rounded-xl border border-white/10 bg-black/25 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-200">
              <Switch checked={consent} onCheckedChange={setConsent} aria-label="ارسال زمینهٔ درس فعلی" />
              ارسال زمینهٔ یادگیری به مدل (اختیاری)
            </label>
            <span className="text-[9px] text-zinc-500" dir="ltr">
              {fa(usage)}/{fa(DAILY_CAP)} امروز
            </span>
          </div>
          {consent && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <select
                value={track}
                onChange={(e) => {
                  setTrack(e.target.value)
                  setLesson('')
                }}
                aria-label="انتخاب مسیر"
                className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-200"
              >
                <option value="">— مسیر —</option>
                {Object.entries(TRACK_TITLES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <select
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                aria-label="انتخاب درس"
                disabled={!track}
                className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-200 disabled:opacity-40"
              >
                <option value="">— درس —</option>
                {(TRACK_LESSONS[track] ?? []).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Quiz Me آفلاین */}
        {mode === 'quiz' && (
          <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-2.5">
            <p className="text-[11px] font-black text-violet-200">حالت Quiz Me — سنجش بازیابی حافظه</p>
            <p className="mt-0.5 text-[10px] leading-5 text-violet-100/80">
              بدون AI و از بانک سؤال واقعی سنجاب‌اواس. مسیر را از زمینهٔ بالا انتخاب کن (یا پیش‌فرض پایتون) و شروع کن.
            </p>
            <button
              type="button"
              onClick={startQuiz}
              className="mt-2 rounded-lg bg-violet-500/80 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-violet-500"
            >
              ۳ سؤال بده
            </button>
            {quizPool.length > 0 && (
              <div className="mt-2 space-y-2">
                {quizPool.map((q) => (
                  <QuestionCard key={q.id} question={q} compact />
                ))}
              </div>
            )}
          </div>
        )}

        {/* پیام‌ها */}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[92%] rounded-2xl px-3 py-2 text-[12px] leading-6 ${
              m.role === 'user'
                ? 'ms-auto bg-teal-600/25 text-teal-50'
                : 'me-auto bg-zinc-800/80 text-zinc-100'
            }`}
            dir="auto"
          >
            <span className="prose-fa whitespace-pre-wrap">{m.content}</span>
          </div>
        ))}

        {busy && (
          <div className="me-auto flex items-center gap-1.5 rounded-2xl bg-zinc-800/80 px-3 py-2" role="status">
            <Bot size={14} className="animate-pulse text-teal-300" aria-hidden />
            <span className="text-[11px] text-zinc-400">مربی سنجاب دارد فکر می‌کند…</span>
          </div>
        )}

        {messages.length === 0 && mode !== 'quiz' && (
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-center">
            <p className="text-[12px] font-black text-zinc-200">
              حالت «{MODES.find((m) => m.id === mode)?.label}» فعال است
            </p>
            <p className="mt-1 text-[11px] leading-5 text-zinc-500">
              {MODES.find((m) => m.id === mode)?.desc}
            </p>
            {!configured && (
              <button
                type="button"
                onClick={() => launch('ai-chat')}
                className="mt-2 rounded-lg bg-teal-500/20 px-3 py-1.5 text-[11px] font-black text-teal-200 transition hover:bg-teal-500/30"
              >
                راه‌اندازی Provider در هوش‌یار
              </button>
            )}
          </div>
        )}
      </div>

      {/* ورودی */}
      <div className="flex shrink-0 items-center gap-1.5 border-t border-white/10 bg-zinc-900/80 p-2">
        <button
          type="button"
          onClick={() => {
            setMessages([])
            setQuizPool([])
          }}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
          title="پاک کردن گفتگو"
          aria-label="پاک کردن گفتگو"
        >
          <Eraser size={15} />
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          rows={1}
          placeholder={mode === 'quiz' ? 'برای Quiz Me دکمهٔ «۳ سؤال بده»…' : 'سؤالت را بنویس… (Enter برای ارسال)'}
          aria-label="پیام به مربی"
          className="prose-fa max-h-24 min-h-9 flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[12px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-teal-400/50"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={!input.trim() || busy || mode === 'quiz'}
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-500/80 text-white transition hover:bg-teal-500 disabled:opacity-40"
          aria-label="ارسال"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
