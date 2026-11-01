'use client'

import { useEffect, useRef, useState } from 'react'
import type { FocusEvent, ReactNode } from 'react'
import { Delete, History, Trash2 } from 'lucide-react'
import { useOS } from '@/lib/os/store'

type Op = '+' | '-' | '*' | '/' | '^' | 'mod' | 'exp'
type UnaryFn =
  | 'sin'
  | 'cos'
  | 'tan'
  | 'ln'
  | 'log'
  | 'sqrt'
  | 'sqr'
  | 'inv'
  | 'fact'
  | 'abs'
type Mode = 'sci' | 'basic'
type AngleMode = 'DEG' | 'RAD'
type ButtonVariant = 'num' | 'op' | 'sci' | 'eq' | 'clear' | 'mem'

interface HistoryEntry {
  expr: string
  result: string
}

const OP_SYMBOL: Record<Op, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
  '^': '^',
  mod: 'mod',
  exp: '×10^',
}

const MSG_DIV_ZERO = 'تقسیم بر صفر؟ کهکشان سان‌جاب منفجر شد!'
const MSG_OVERFLOW = 'نتیجه آن‌قدر بزرگ شد که تلسکوپ هم ندیدش!'
const MSG_LN = 'لگاریتم صفر و منفی؟ ریاضی‌دان‌ها غش کردند!'
const MSG_SQRT = 'جذر عدد منفی؟ خوش آمدی به بُعد موهومی!'
const MSG_FACT = 'فکتوریل فقط به اعداد صحیح نامنفی می‌رسد!'
const MSG_FACT_BIG = 'فکتوریل بالای ۱۷۰؟ سرور سان‌جاب دود شد!'
const MSG_TAN = 'تانژانت ۹۰ درجه؟ مستقیم به بی‌نهایت شلیک شد!'
const MSG_INF_INPUT = 'اول باید از بی‌نهایت بیرون بیایی!'
const MSG_MEMORY = 'بی‌نهایت در حافظه جا نمی‌شود!'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  num: 'bg-zinc-800 font-bold text-zinc-100 hover:bg-zinc-700',
  op: 'bg-[#0ea5a0]/15 font-bold text-[#2dd4bf] hover:bg-[#0ea5a0]/25',
  sci: 'bg-[#8b5cf6]/15 font-bold text-[#c4b5fd] hover:bg-[#8b5cf6]/25',
  eq: 'bg-[#f7931e] font-black text-zinc-950 hover:brightness-110',
  clear: 'bg-rose-500/15 font-bold text-rose-300 hover:bg-rose-500/25',
  mem: 'bg-zinc-800/60 font-bold text-zinc-300 hover:bg-zinc-700/60',
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

function toLatinDigit(ch: string): string {
  const index = FA_DIGITS.indexOf(ch)
  return index >= 0 ? String(index) : ch
}

function trimTrailingZeros(input: string): string {
  const eIndex = input.search(/[eE]/)
  if (eIndex >= 0) {
    const mantissa = input.slice(0, eIndex)
    const exponent = input.slice(eIndex + 1)
    const trimmed = mantissa.includes('.')
      ? mantissa.replace(/0+$/, '').replace(/\.$/, '')
      : mantissa
    return `${trimmed}e${exponent}`
  }
  if (input.includes('.')) {
    return input.replace(/0+$/, '').replace(/\.$/, '')
  }
  return input
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '♾'
  if (value === 0) return '0'
  let out = trimTrailingZeros(value.toPrecision(12))
  if (out.length > 14) out = trimTrailingZeros(value.toExponential(5))
  if (out.length > 14) out = out.slice(0, 14)
  return out
}

function compute(a: number, b: number, op: Op): number | null {
  switch (op) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '*':
      return a * b
    case '/':
      return b === 0 ? null : a / b
    case '^':
      return Math.pow(a, b)
    case 'mod':
      return b === 0 ? null : a % b
    case 'exp':
      return a * Math.pow(10, b)
  }
}

function factorial(x: number): number {
  let result = 1
  for (let i = 2; i <= x; i++) result *= i
  return result
}

function CalcButton({
  children,
  onClick,
  variant = 'num',
  label,
  className = '',
  size = 'md',
}: {
  children: ReactNode
  onClick: () => void
  variant?: ButtonVariant
  label?: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const sizeClasses = size === 'sm' ? 'h-11 text-sm' : 'h-12 text-base'
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95 ${sizeClasses} ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export default function CalculatorApp() {
  const [mode, setMode] = useState<Mode>('sci')
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG')
  const [current, setCurrent] = useState('0')
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<Op | null>(null)
  const [exprLine, setExprLine] = useState('')
  const [status, setStatus] = useState('')
  const [freshEntry, setFreshEntry] = useState(false)
  const [memory, setMemory] = useState(0)
  const [ans, setAns] = useState('0')
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [keyActive, setKeyActive] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const focusRef = useRef(false)
  const equalsStreak = useRef(0)
  const nagShown = useRef(false)
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => undefined)

  const clearAll = () => {
    equalsStreak.current = 0
    setCurrent('0')
    setPrev(null)
    setOp(null)
    setExprLine('')
    setStatus('')
    setFreshEntry(false)
  }

  const inputDigit = (digit: string) => {
    equalsStreak.current = 0
    setStatus('')
    if (current === '♾' || freshEntry) {
      if (current === '♾') setExprLine('')
      setCurrent(digit)
      setFreshEntry(false)
      return
    }
    if (current === '0') {
      setCurrent(digit)
      return
    }
    if (current.length >= 14) return
    setCurrent(current + digit)
  }

  const inputDot = () => {
    equalsStreak.current = 0
    setStatus('')
    if (current === '♾' || freshEntry) {
      if (current === '♾') setExprLine('')
      setCurrent('0.')
      setFreshEntry(false)
      return
    }
    if (!current.includes('.')) setCurrent(`${current}.`)
  }

  const chooseOp = (next: Op) => {
    equalsStreak.current = 0
    setStatus('')
    if (current === '♾') {
      setCurrent('0')
      setPrev(null)
      setOp(next)
      setExprLine(`0 ${OP_SYMBOL[next]}`)
      setFreshEntry(true)
      return
    }
    if (op !== null && prev !== null && !freshEntry) {
      const result = compute(prev, Number(current), op)
      const chainText = `${prev} ${OP_SYMBOL[op]} ${current} =`
      setExprLine(chainText)
      if (result === null) {
        showInfinity(MSG_DIV_ZERO)
        return
      }
      if (!Number.isFinite(result)) {
        showInfinity(MSG_OVERFLOW)
        return
      }
      const formatted = formatNumber(result)
      setPrev(Number(formatted))
      setCurrent(formatted)
      setExprLine(`${formatted} ${OP_SYMBOL[next]}`)
    } else {
      setPrev(Number(current))
      setExprLine(`${current} ${OP_SYMBOL[next]}`)
    }
    setOp(next)
    setFreshEntry(true)
  }

  function showInfinity(msg: string, keepExpr = false) {
    setCurrent('♾')
    setPrev(null)
    setOp(null)
    setFreshEntry(true)
    setStatus(msg)
    equalsStreak.current = 0
    if (!keepExpr) setExprLine('')
  }

  const equals = () => {
    setStatus('')
    if (current === '♾') {
      clearAll()
      return
    }
    if (op !== null && prev !== null) {
      const a = prev
      const b = Number(current)
      const result = compute(a, b, op)
      const exprText = `${a} ${OP_SYMBOL[op]} ${b}`
      setExprLine(`${exprText} =`)
      if (result === null) {
        showInfinity(MSG_DIV_ZERO, true)
        return
      }
      if (!Number.isFinite(result)) {
        showInfinity(MSG_OVERFLOW, true)
        return
      }
      const formatted = formatNumber(result)
      setCurrent(formatted)
      setAns(formatted)
      setPrev(null)
      setOp(null)
      setFreshEntry(true)
      equalsStreak.current = 0
      setEntries((old) => [{ expr: exprText, result: formatted }, ...old].slice(0, 10))
      return
    }
    equalsStreak.current += 1
    if (equalsStreak.current >= 5 && !nagShown.current) {
      nagShown.current = true
      useOS.getState().pushToast({
        icon: '🤨',
        title: 'ماشین‌حساب',
        body: 'داری = می‌زنی دیگه؟ جواب همون‌ه!',
      })
    }
  }

  const commitValue = (formatted: string) => {
    setCurrent(formatted)
    setAns(formatted)
    setFreshEntry(false)
    setStatus(formatted === '♾' ? MSG_OVERFLOW : '')
  }

  const applyUnary = (fn: UnaryFn) => {
    equalsStreak.current = 0
    if (current === '♾') {
      setStatus(MSG_INF_INPUT)
      return
    }
    const x = Number(current)
    if (fn === 'sin' || fn === 'cos' || fn === 'tan') {
      const rad = angleMode === 'DEG' ? (x * Math.PI) / 180 : x
      if (fn === 'tan') {
        const degSymptom = angleMode === 'DEG' && Math.abs(Math.abs(x % 180) - 90) < 1e-9
        const radSymptom = angleMode === 'RAD' && Math.abs(Math.cos(rad)) < 1e-12
        if (degSymptom || radSymptom) {
          showInfinity(MSG_TAN, true)
          return
        }
      }
      const r = fn === 'sin' ? Math.sin(rad) : fn === 'cos' ? Math.cos(rad) : Math.tan(rad)
      commitValue(formatNumber(r))
      return
    }
    if (fn === 'ln' || fn === 'log') {
      if (x <= 0) {
        setStatus(MSG_LN)
        return
      }
      commitValue(formatNumber(fn === 'ln' ? Math.log(x) : Math.log10(x)))
      return
    }
    if (fn === 'sqrt') {
      if (x < 0) {
        setStatus(MSG_SQRT)
        return
      }
      commitValue(formatNumber(Math.sqrt(x)))
      return
    }
    if (fn === 'sqr') {
      commitValue(formatNumber(x * x))
      return
    }
    if (fn === 'abs') {
      commitValue(formatNumber(Math.abs(x)))
      return
    }
    if (fn === 'inv') {
      if (x === 0) {
        showInfinity(MSG_DIV_ZERO, true)
        return
      }
      commitValue(formatNumber(1 / x))
      return
    }
    if (x < 0 || !Number.isInteger(x)) {
      setStatus(MSG_FACT)
      return
    }
    if (x > 170) {
      setStatus(MSG_FACT_BIG)
      return
    }
    commitValue(formatNumber(factorial(x)))
  }

  const insertConstant = (value: number) => {
    equalsStreak.current = 0
    setStatus('')
    setCurrent(formatNumber(value))
    setFreshEntry(true)
  }

  const toggleSign = () => {
    equalsStreak.current = 0
    setStatus('')
    if (current === '♾' || current === '0') return
    setCurrent(current.startsWith('-') ? current.slice(1) : `-${current}`)
  }

  const percent = () => {
    equalsStreak.current = 0
    setStatus('')
    if (current === '♾') return
    setCurrent(formatNumber(Number(current) / 100))
    setFreshEntry(false)
  }

  const backspace = () => {
    equalsStreak.current = 0
    setStatus('')
    if (current === '♾') {
      setCurrent('0')
      setExprLine('')
      return
    }
    if (freshEntry) {
      setFreshEntry(false)
      setCurrent(current.slice(0, -1) || '0')
      return
    }
    const next = current.slice(0, -1)
    setCurrent(next === '' || next === '-' ? '0' : next)
  }

  const memoryAdd = () => {
    equalsStreak.current = 0
    if (current === '♾') {
      setStatus(MSG_MEMORY)
      return
    }
    setMemory((m) => m + Number(current))
    setStatus('')
  }

  const memoryRecall = () => {
    equalsStreak.current = 0
    setStatus('')
    setCurrent(formatNumber(memory))
    setFreshEntry(true)
  }

  const memoryClear = () => {
    setMemory(0)
    setStatus('')
  }

  const recallAns = () => {
    equalsStreak.current = 0
    setStatus('')
    setCurrent(ans)
    setFreshEntry(true)
  }

  const insertFromHistory = (result: string) => {
    equalsStreak.current = 0
    setStatus('')
    setCurrent(result)
    setFreshEntry(true)
  }

  const toggleAngle = () => {
    setAngleMode((m) => (m === 'DEG' ? 'RAD' : 'DEG'))
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const k = e.key
    const digit = toLatinDigit(k)
    if (digit.length === 1 && digit >= '0' && digit <= '9') {
      inputDigit(digit)
      e.preventDefault()
      return
    }
    if (k === '.' || k === ',') {
      inputDot()
      e.preventDefault()
      return
    }
    if (k === '+') {
      chooseOp('+')
      e.preventDefault()
      return
    }
    if (k === '-') {
      chooseOp('-')
      e.preventDefault()
      return
    }
    if (k === '*') {
      chooseOp('*')
      e.preventDefault()
      return
    }
    if (k === '/') {
      chooseOp('/')
      e.preventDefault()
      return
    }
    if (k === 'Enter' || k === '=') {
      equals()
      e.preventDefault()
      return
    }
    if (k === 'Backspace') {
      backspace()
      e.preventDefault()
      return
    }
    if (k === 'Escape') {
      clearAll()
      e.preventDefault()
    }
  }

  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      if (!focusRef.current) return
      handleKeyDown(e)
    }
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleFocus = () => {
    focusRef.current = true
    setKeyActive(true)
  }

  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (rootRef.current && e.relatedTarget && rootRef.current.contains(e.relatedTarget as Node)) {
      return
    }
    focusRef.current = false
    setKeyActive(false)
  }

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="flex h-full w-full select-none flex-col bg-zinc-950/60"
    >
      <div className="flex items-center justify-between px-3 pt-2">
        <div className="flex rounded-lg border border-white/10 bg-zinc-900/60 p-0.5">
          <button
            type="button"
            onClick={() => setMode('sci')}
            className={`rounded-md px-3 py-0.5 text-xs font-bold transition-colors ${
              mode === 'sci'
                ? 'bg-[#f7931e]/20 text-[#fdb56b]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            علمی
          </button>
          <button
            type="button"
            onClick={() => setMode('basic')}
            className={`rounded-md px-3 py-0.5 text-xs font-bold transition-colors ${
              mode === 'basic'
                ? 'bg-[#0ea5a0]/20 text-[#2dd4bf]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            ساده
          </button>
        </div>
        <span className="text-[10px] text-zinc-600">ماشین‌حساب فول</span>
      </div>

      <div className="m-2.5 rounded-xl border border-white/10 bg-zinc-900 p-2.5">
        <div className="flex items-center gap-1.5">
          {memory !== 0 && (
            <span className="rounded bg-[#f7931e]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#fdb56b]">
              M
            </span>
          )}
          {mode === 'sci' && (
            <span className="rounded bg-[#8b5cf6]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#c4b5fd]">
              {angleMode}
            </span>
          )}
          <span className="flex-1" />
          <button
            type="button"
            aria-label="تاریخچه"
            title="تاریخچه محاسبات"
            onClick={() => setShowHistory((v) => !v)}
            className={`rounded-lg p-0.5 transition-colors hover:bg-white/10 ${
              showHistory ? 'text-[#fdb56b]' : 'text-zinc-500'
            }`}
          >
            <History className="size-4" />
          </button>
        </div>
        <div dir="ltr" className="mt-1.5 h-4 truncate text-left font-mono text-xs text-zinc-500">
          {status ? '' : exprLine}
        </div>
        <div dir="ltr" className="mt-1 truncate text-left text-4xl font-black text-zinc-100">
          {current}
        </div>
        <div className="mt-1 h-4 truncate text-[11px]">
          {status ? (
            <span className="text-rose-300">{status}</span>
          ) : !keyActive ? (
            <span className="text-zinc-600">برای کیبورد، اول همین‌جا کلیک کن</span>
          ) : null}
        </div>
      </div>

      {showHistory && (
        <div className="mx-2.5 mb-2 shrink-0 rounded-xl border border-white/10 bg-zinc-900/60">
          <div className="flex items-center justify-between px-3 pt-2">
            <span className="text-[11px] font-bold text-zinc-500">۱۰ محاسبهٔ آخر</span>
            <button
              type="button"
              aria-label="پاک کردن تاریخچه"
              title="پاک کردن تاریخچه"
              onClick={() => setEntries([])}
              className="rounded p-0.5 text-zinc-600 transition-colors hover:bg-white/10 hover:text-rose-300"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
          <div className="os-scroll max-h-36 overflow-y-auto p-2">
            {entries.length === 0 ? (
              <p className="py-2 text-center text-[11px] text-zinc-600">هنوز محاسبه‌ای ثبت نشده</p>
            ) : (
              <div className="space-y-1">
                {entries.map((entry, i) => (
                  <button
                    key={`${i}-${entry.expr}-${entry.result}`}
                    type="button"
                    dir="ltr"
                    onClick={() => insertFromHistory(entry.result)}
                    title="درج نتیجه"
                    className="block w-full rounded-lg px-2 py-1.5 text-left font-mono text-[11px] text-zinc-400 transition-colors hover:bg-white/5"
                  >
                    {entry.expr} = <span className="font-bold text-zinc-100">{entry.result}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="os-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-2.5">
        {mode === 'sci' ? (
          <div className="grid grid-cols-5 gap-1">
            <CalcButton size="sm" variant="sci" onClick={toggleAngle} label="تغییر درجه/رادیان">
              {angleMode}
            </CalcButton>
            <CalcButton size="sm" variant="sci" onClick={() => insertConstant(Math.PI)} label="عدد پی">
              π
            </CalcButton>
            <CalcButton size="sm" variant="sci" onClick={() => insertConstant(Math.E)} label="عدد نپر">
              e
            </CalcButton>
            <CalcButton size="sm" variant="sci" onClick={() => applyUnary('inv')} label="معکوس عدد">
              1/x
            </CalcButton>
            <CalcButton size="sm" variant="sci" onClick={() => applyUnary('fact')} label="فکتوریل">
              n!
            </CalcButton>

            <CalcButton size="sm" variant="sci" onClick={() => applyUnary('sin')} label="سینوس">
              sin
            </CalcButton>
            <CalcButton size="sm" variant="sci" onClick={() => applyUnary('cos')} label="کسینوس">
              cos
            </CalcButton>
            <CalcButton size="sm" variant="sci" onClick={() => applyUnary('tan')} label="تانژانت">
              tan
            </CalcButton>
            <CalcButton size="sm" variant="sci" onClick={() => applyUnary('ln')} label="لگاریتم طبیعی">
              ln
            </CalcButton>
            <CalcButton size="sm" variant="sci" onClick={() => applyUnary('log')} label="لگاریتم ده‌گانی">
              log
            </CalcButton>

            <CalcButton size="sm" variant="sci" onClick={() => applyUnary('sqrt')} label="جذر">
              √
            </CalcButton>
            <CalcButton size="sm" variant="sci" onClick={() => applyUnary('sqr')} label="مربع">
              x²
            </CalcButton>
            <CalcButton size="sm" variant="op" onClick={() => chooseOp('^')} label="توان">
              xʸ
            </CalcButton>
            <CalcButton size="sm" variant="op" onClick={() => chooseOp('mod')} label="باقیمانده">
              mod
            </CalcButton>
            <CalcButton size="sm" variant="op" onClick={() => chooseOp('exp')} label="ضربدر ده به توان">
              exp
            </CalcButton>

            <CalcButton size="sm" variant="mem" onClick={memoryAdd} label="اضافه به حافظه">
              M+
            </CalcButton>
            <CalcButton size="sm" variant="mem" onClick={memoryRecall} label="فراخوانی حافظه">
              MR
            </CalcButton>
            <CalcButton size="sm" variant="mem" onClick={memoryClear} label="پاک کردن حافظه">
              MC
            </CalcButton>
            <CalcButton size="sm" variant="mem" onClick={recallAns} label="آخرین پاسخ">
              ANS
            </CalcButton>
            <CalcButton size="sm" variant="sci" onClick={() => applyUnary('abs')} label="قدرمطلق">
              |x|
            </CalcButton>

            <CalcButton size="sm" variant="clear" onClick={clearAll} label="پاک کردن همه">
              C
            </CalcButton>
            <CalcButton size="sm" className="text-base" onClick={() => inputDigit('7')}>7</CalcButton>
            <CalcButton size="sm" className="text-base" onClick={() => inputDigit('8')}>8</CalcButton>
            <CalcButton size="sm" className="text-base" onClick={() => inputDigit('9')}>9</CalcButton>
            <CalcButton size="sm" variant="op" onClick={() => chooseOp('/')} label="تقسیم">
              ÷
            </CalcButton>

            <CalcButton size="sm" variant="mem" onClick={backspace} label="حذف رقم آخر">
              <Delete className="size-4" />
            </CalcButton>
            <CalcButton size="sm" className="text-base" onClick={() => inputDigit('4')}>4</CalcButton>
            <CalcButton size="sm" className="text-base" onClick={() => inputDigit('5')}>5</CalcButton>
            <CalcButton size="sm" className="text-base" onClick={() => inputDigit('6')}>6</CalcButton>
            <CalcButton size="sm" variant="op" onClick={() => chooseOp('*')} label="ضرب">
              ×
            </CalcButton>

            <CalcButton size="sm" variant="op" onClick={percent} label="درصد">
              %
            </CalcButton>
            <CalcButton size="sm" className="text-base" onClick={() => inputDigit('1')}>1</CalcButton>
            <CalcButton size="sm" className="text-base" onClick={() => inputDigit('2')}>2</CalcButton>
            <CalcButton size="sm" className="text-base" onClick={() => inputDigit('3')}>3</CalcButton>
            <CalcButton size="sm" variant="op" onClick={() => chooseOp('-')} label="تفریق">
              −
            </CalcButton>

            <CalcButton size="sm" variant="op" onClick={toggleSign} label="تغییر علامت">
              ±
            </CalcButton>
            <CalcButton size="sm" className="text-base" onClick={() => inputDigit('0')}>0</CalcButton>
            <CalcButton size="sm" onClick={inputDot} label="ممیز">
              .
            </CalcButton>
            <CalcButton size="sm" variant="eq" className="col-span-2" onClick={equals} label="مساوی">
              =
            </CalcButton>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <CalcButton variant="mem" onClick={memoryAdd} label="اضافه به حافظه">
              M+
            </CalcButton>
            <CalcButton variant="mem" onClick={memoryRecall} label="فراخوانی حافظه">
              MR
            </CalcButton>
            <CalcButton variant="mem" onClick={memoryClear} label="پاک کردن حافظه">
              MC
            </CalcButton>
            <CalcButton variant="mem" onClick={recallAns} label="آخرین پاسخ">
              ANS
            </CalcButton>

            <CalcButton variant="clear" onClick={clearAll} label="پاک کردن همه">
              C
            </CalcButton>
            <CalcButton variant="mem" onClick={backspace} label="حذف رقم آخر">
              <Delete className="size-4" />
            </CalcButton>
            <CalcButton variant="op" onClick={percent} label="درصد">
              %
            </CalcButton>
            <CalcButton variant="op" onClick={() => chooseOp('/')} label="تقسیم">
              ÷
            </CalcButton>

            <CalcButton className="text-lg" onClick={() => inputDigit('7')}>7</CalcButton>
            <CalcButton className="text-lg" onClick={() => inputDigit('8')}>8</CalcButton>
            <CalcButton className="text-lg" onClick={() => inputDigit('9')}>9</CalcButton>
            <CalcButton variant="op" onClick={() => chooseOp('*')} label="ضرب">
              ×
            </CalcButton>

            <CalcButton className="text-lg" onClick={() => inputDigit('4')}>4</CalcButton>
            <CalcButton className="text-lg" onClick={() => inputDigit('5')}>5</CalcButton>
            <CalcButton className="text-lg" onClick={() => inputDigit('6')}>6</CalcButton>
            <CalcButton variant="op" onClick={() => chooseOp('-')} label="تفریق">
              −
            </CalcButton>

            <CalcButton className="text-lg" onClick={() => inputDigit('1')}>1</CalcButton>
            <CalcButton className="text-lg" onClick={() => inputDigit('2')}>2</CalcButton>
            <CalcButton className="text-lg" onClick={() => inputDigit('3')}>3</CalcButton>
            <CalcButton variant="op" onClick={() => chooseOp('+')} label="جمع">
              +
            </CalcButton>

            <CalcButton variant="op" onClick={toggleSign} label="تغییر علامت">
              ±
            </CalcButton>
            <CalcButton className="text-lg" onClick={() => inputDigit('0')}>0</CalcButton>
            <CalcButton onClick={inputDot} label="ممیز">
              .
            </CalcButton>
            <CalcButton variant="eq" className="col-span-2 text-lg" onClick={equals} label="مساوی">
              =
            </CalcButton>
          </div>
        )}
      </div>
    </div>
  )
}
