'use client'

/**
 * QuestionCard، کارت سؤال استاندارد آزمون سنجاب‌اواس
 * همهٔ انواع سؤال بانک را رندر می‌کند: تک‌انتخابی، چندانتخابی، درست/غلط،
 * جای‌خالی، مرتب‌سازی، پیش‌بینی خروجی، یافتن باگ و تکمیل کد.
 * بازخورد چندلایه + سیستم راهنمای مرحله‌ای را پوشش می‌دهد.
 */

import { useState } from 'react'
import { CheckCircle2, ChevronLeft, Lightbulb, XCircle } from 'lucide-react'
import {
  buildFeedback,
  gradeAnswer,
  nextHint,
  type Feedback,
  type Question,
} from '@/lib/learning/assessment'

interface Props {
  question: Question
  /** نام مهارت برای بازخورد */
  skillTitle?: string
  /** بعد از پاسخ، برای ثبت نتیجه */
  onAnswered?: (correct: boolean, hintsUsed: number) => void
  /** سؤال بعدی */
  onNext?: () => void
  compact?: boolean
}

export default function QuestionCard({ question, skillTitle, onAnswered, onNext, compact }: Props) {
  const [selected, setSelected] = useState<number[]>([])
  const [text, setText] = useState('')
  const [graded, setGraded] = useState<Feedback | null>(null)
  const [ratio, setRatio] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hint, setHint] = useState<string | null>(null)

  const q = question
  const isChoice = q.type === 'single-choice' || q.type === 'predict-output' || q.type === 'find-bug'
  const isMulti = q.type === 'multi-select'
  const isTF = q.type === 'true-false'
  const isOrder = q.type === 'ordering'
  const isText = q.type === 'fill-blank' || q.type === 'code-completion'
  const hasCode = Boolean(q.code)

  const grade = (given: unknown) => {
    const g = gradeAnswer(q, given)
    setRatio(g.ratio)
    const fb = buildFeedback(q, given, g, skillTitle)
    setGraded(fb)
    onAnswered?.(g.correct, hintsUsed)
  }

  const showHint = () => {
    const h = nextHint(q, hintsUsed)
    if (h) {
      setHint(h.text)
      setHintsUsed((c) => c + 1)
    }
  }

  const toggle = (i: number) => {
    if (graded) return
    setSelected((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]))
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-zinc-900/60 ${compact ? 'p-3' : 'p-4'}`}>
      {/* سربرگ سؤال */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px] font-black">
        <span className="rounded-md bg-violet-500/15 px-1.5 py-0.5 text-violet-300">
          {q.difficulty === 'beginner' ? 'مقدماتی' : q.difficulty === 'intermediate' ? 'متوسط' : q.difficulty === 'advanced' ? 'پیشرفته' : 'خبره'}
        </span>
        <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-zinc-400">~{q.estimatedMin} دقیقه</span>
        {skillTitle && (
          <span className="rounded-md bg-teal-500/15 px-1.5 py-0.5 text-teal-300">{skillTitle}</span>
        )}
      </div>

      <p className="prose-fa text-[13px] font-bold leading-7 text-zinc-100">{q.prompt}</p>

      {hasCode && (
        <pre dir="ltr" className="prose-pre mt-2 max-h-56 overflow-auto">
          <code>{q.code}</code>
        </pre>
      )}

      {/* گزینه‌ها */}
      {(isChoice || isMulti) && (
        <div className="mt-3 space-y-1.5">
          {q.options?.map((opt, i) => {
            const chosen = selected.includes(i)
            const isRight = graded && (q.answer === i || (Array.isArray(q.answer) && (q.answer as number[]).includes(i)))
            const isWrongPick = graded && chosen && !isRight
            return (
              <button
                key={i}
                type="button"
                disabled={Boolean(graded)}
                onClick={() => (isMulti ? toggle(i) : (setSelected([i]), grade(i)))}
                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-start text-[12px] transition ${
                  isRight
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                    : isWrongPick
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-200'
                      : chosen
                        ? 'border-violet-400/50 bg-violet-500/10 text-violet-100'
                        : 'border-white/10 bg-black/25 text-zinc-300 hover:border-white/25 hover:bg-white/5'
                } ${graded ? 'cursor-default' : ''}`}
              >
                <span className="grid size-5 shrink-0 place-items-center rounded-md border border-white/15 text-[10px] font-black tabular-nums" dir="ltr">
                  {String.fromCharCode(65 + i)}
                </span>
                <span dir="auto" className="min-w-0 flex-1">{opt}</span>
                {isRight && <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />}
                {isWrongPick && <XCircle size={14} className="shrink-0 text-rose-400" />}
              </button>
            )
          })}
          {isMulti && !graded && (
            <button
              type="button"
              onClick={() => grade(selected)}
              disabled={selected.length === 0}
              className="mt-1 w-full rounded-xl bg-violet-500/80 py-2 text-[12px] font-black text-white transition hover:bg-violet-500 disabled:opacity-40"
            >
              ثبت پاسخ
            </button>
          )}
        </div>
      )}

      {/* درست/غلط */}
      {isTF && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[true, false].map((v, i) => {
            const chosen = selected[0] === i
            const isRight = graded && q.answer === v
            const isWrongPick = graded && chosen && !isRight
            return (
              <button
                key={i}
                type="button"
                disabled={Boolean(graded)}
                onClick={() => (setSelected([i]), grade(v))}
                className={`rounded-xl border px-3 py-2.5 text-[12px] font-black transition ${
                  isRight
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                    : isWrongPick
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-200'
                      : chosen
                        ? 'border-violet-400/50 bg-violet-500/10 text-violet-100'
                        : 'border-white/10 bg-black/25 text-zinc-300 hover:bg-white/5'
                } ${graded ? 'cursor-default' : ''}`}
              >
                {v ? '✓ درست' : '✗ غلط'}
              </button>
            )
          })}
        </div>
      )}

      {/* مرتب‌سازی */}
      {isOrder && !graded && (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] text-zinc-400">به‌ترتیب روی گزینه‌ها کلیک کن:</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {q.options?.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                disabled={selected.includes(i)}
                className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 text-[11px] text-zinc-300 transition hover:bg-white/10 disabled:opacity-25"
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="min-h-9 rounded-xl border border-dashed border-white/15 bg-black/20 p-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {selected.map((idx, pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setSelected((cur) => cur.filter((_, p) => p !== pos))}
                  className="flex items-center gap-1 rounded-lg bg-violet-500/20 px-2 py-1 text-[11px] text-violet-100"
                  title="حذف از ترتیب"
                >
                  <span className="grid size-4 place-items-center rounded bg-violet-400/40 text-[9px] font-black" dir="ltr">
                    {pos + 1}
                  </span>
                  {q.options?.[idx]}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => grade(selected)}
            disabled={selected.length !== q.options?.length}
            className="mt-2 w-full rounded-xl bg-violet-500/80 py-2 text-[12px] font-black text-white transition hover:bg-violet-500 disabled:opacity-40"
          >
            ثبت ترتیب
          </button>
        </div>
      )}

      {/* متن آزاد */}
      {isText && !graded && (
        <div className="mt-3">
          <input
            dir="auto"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && text.trim()) grade(text)
            }}
            placeholder="پاسخت را بنویس…"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-[13px] text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-violet-400/50"
          />
          <button
            type="button"
            onClick={() => grade(text)}
            disabled={!text.trim()}
            className="mt-2 w-full rounded-xl bg-violet-500/80 py-2 text-[12px] font-black text-white transition hover:bg-violet-500 disabled:opacity-40"
          >
            ثبت پاسخ
          </button>
        </div>
      )}

      {/* سیستم راهنما */}
      {!graded && q.hints.length > 0 && (
        <div className="mt-2.5">
          {hint && (
            <div className="mb-1.5 flex items-start gap-1.5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-2.5 py-2 text-[11px] leading-5 text-amber-200">
              <Lightbulb size={13} className="mt-0.5 shrink-0" />
              <span>{hint}</span>
            </div>
          )}
          <button
            type="button"
            onClick={showHint}
            className="text-[11px] font-bold text-amber-300/80 transition hover:text-amber-200"
          >
            {hintsUsed === 0 ? '💡 راهنما می‌خواهی؟' : `راهنمای بعدی (${hintsUsed}/${q.hints.length})`}
          </button>
        </div>
      )}

      {/* بازخورد چندلایه */}
      {graded && (
        <div
          className={`mt-3 rounded-xl border p-3 text-[12px] leading-6 ${
            graded.correct
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : 'border-rose-500/40 bg-rose-500/10'
          }`}
          role="status"
        >
          <p className={`font-black ${graded.correct ? 'text-emerald-300' : 'text-rose-300'}`}>
            {graded.headline}
          </p>
          {graded.correctText && (
            <p className="mt-1 text-zinc-200">
              پاسخ صحیح: <b dir="auto">{graded.correctText}</b>
            </p>
          )}
          <p className="mt-1 text-zinc-300">{graded.explanation}</p>
          {graded.distractorWhy && (
            <p className="mt-1 text-amber-200/90">⚠️ {graded.distractorWhy}</p>
          )}
          {graded.skillHint && (
            <p className="mt-1 text-[11px] text-zinc-400">
              مهارت مرتبط: «{graded.skillHint}»، برای تثبیت، مرور همین مهارت را در تب «مرور» انجام بده.
            </p>
          )}
          {!graded.correct && ratio > 0 && ratio < 1 && (
            <p className="mt-1 text-[11px] text-zinc-400" dir="ltr">
              تطابق: {Math.round(ratio * 100)}%
            </p>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="mt-2 flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-white/20"
            >
              سؤال بعدی
              <ChevronLeft size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
