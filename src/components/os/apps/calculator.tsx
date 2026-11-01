'use client'

import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Delete } from 'lucide-react'
import { useOS } from '@/lib/os/store'

type Op = '+' | '-' | '*' | '/'

const OP_SYMBOL: Record<Op, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
}

type ButtonVariant = 'num' | 'op' | 'eq' | 'clear' | 'muted'

const BUTTON_CLASSES: Record<ButtonVariant, string> = {
  num: 'bg-zinc-800 font-bold text-zinc-100 hover:bg-zinc-700',
  op: 'bg-zinc-800/70 font-bold text-[var(--pengo-accent)] hover:bg-zinc-700/70',
  eq: 'bg-[var(--pengo-accent)] font-black text-zinc-950 hover:opacity-90',
  clear: 'bg-rose-500/15 font-bold text-rose-300 hover:bg-rose-500/25',
  muted: 'bg-zinc-800/70 font-bold text-zinc-300 hover:bg-zinc-700/70',
}

function trimTrailingZeros(input: string): string {
  const eIndex = input.search(/[eE]/)
  if (eIndex >= 0) {
    const mantissa = input.slice(0, eIndex)
    const exponent = input.slice(eIndex + 1)
    const trimmed = mantissa.includes('.') ? mantissa.replace(/0+$/, '').replace(/\.$/, '') : mantissa
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
  }
}

function CalcButton({
  children,
  onClick,
  variant = 'num',
  label,
}: {
  children: ReactNode
  onClick: () => void
  variant?: ButtonVariant
  label?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-12 items-center justify-center rounded-xl text-lg transition-all duration-150 active:scale-95 ${BUTTON_CLASSES[variant]}`}
    >
      {children}
    </button>
  )
}

export default function CalculatorApp() {
  const [current, setCurrent] = useState('0')
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<Op | null>(null)
  const [history, setHistory] = useState('')
  const [status, setStatus] = useState('')
  const [freshEntry, setFreshEntry] = useState(false)
  const equalsStreak = useRef(0)
  const nagShown = useRef(false)

  const clearAll = () => {
    equalsStreak.current = 0
    setCurrent('0')
    setPrev(null)
    setOp(null)
    setHistory('')
    setStatus('')
    setFreshEntry(false)
  }

  const inputDigit = (digit: string) => {
    equalsStreak.current = 0
    setStatus('')
    if (current === '♾' || freshEntry) {
      if (current === '♾') setHistory('')
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
      if (current === '♾') setHistory('')
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
      setHistory(`0 ${OP_SYMBOL[next]}`)
      setFreshEntry(true)
      return
    }
    if (op !== null && prev !== null && !freshEntry) {
      const result = compute(prev, Number(current), op)
      if (result === null) {
        setHistory(`${prev} ${OP_SYMBOL[op]} ${current} =`)
        setCurrent('♾')
        setPrev(null)
        setOp(null)
        setFreshEntry(true)
        setStatus('تقسیم بر صفر؟ جسور بودی!')
        return
      }
      const formatted = formatNumber(result)
      setPrev(Number(formatted))
      setCurrent(formatted)
      setHistory(`${formatted} ${OP_SYMBOL[next]}`)
    } else {
      setPrev(Number(current))
      setHistory(`${current} ${OP_SYMBOL[next]}`)
    }
    setOp(next)
    setFreshEntry(true)
  }

  const equals = () => {
    if (current === '♾') {
      clearAll()
      return
    }
    if (op !== null && prev !== null) {
      equalsStreak.current = 0
      const result = compute(prev, Number(current), op)
      setHistory(`${prev} ${OP_SYMBOL[op]} ${current} =`)
      if (result === null) {
        setCurrent('♾')
        setPrev(null)
        setOp(null)
        setFreshEntry(true)
        setStatus('تقسیم بر صفر؟ جسور بودی!')
        return
      }
      setCurrent(formatNumber(result))
      setPrev(null)
      setOp(null)
      setFreshEntry(true)
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
      setHistory('')
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

  return (
    <div className="flex h-full w-full select-none flex-col bg-zinc-950/60">
      <div className="m-3 rounded-xl border border-white/10 bg-zinc-900 p-4">
        <div dir="ltr" className="h-4 truncate text-left font-mono text-xs text-zinc-500">
          {status ? '' : history}
        </div>
        <div dir="ltr" className="mt-1 truncate text-left text-4xl font-black text-zinc-100">
          {current}
        </div>
        <div className="mt-1 h-4 text-[11px]">
          {status ? <span className="text-rose-300">{status}</span> : null}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 p-3 pt-0">
        <CalcButton variant="clear" onClick={clearAll} label="پاک کردن همه">C</CalcButton>
        <CalcButton variant="muted" onClick={backspace} label="حذف رقم آخر">
          <Delete className="h-4 w-4" />
        </CalcButton>
        <CalcButton variant="op" onClick={percent} label="درصد">٪</CalcButton>
        <CalcButton variant="op" onClick={() => chooseOp('/')} label="تقسیم">÷</CalcButton>

        <CalcButton onClick={() => inputDigit('7')}>۷</CalcButton>
        <CalcButton onClick={() => inputDigit('8')}>۸</CalcButton>
        <CalcButton onClick={() => inputDigit('9')}>۹</CalcButton>
        <CalcButton variant="op" onClick={() => chooseOp('*')} label="ضرب">×</CalcButton>

        <CalcButton onClick={() => inputDigit('4')}>۴</CalcButton>
        <CalcButton onClick={() => inputDigit('5')}>۵</CalcButton>
        <CalcButton onClick={() => inputDigit('6')}>۶</CalcButton>
        <CalcButton variant="op" onClick={() => chooseOp('-')} label="تفریق">−</CalcButton>

        <CalcButton onClick={() => inputDigit('1')}>۱</CalcButton>
        <CalcButton onClick={() => inputDigit('2')}>۲</CalcButton>
        <CalcButton onClick={() => inputDigit('3')}>۳</CalcButton>
        <CalcButton variant="op" onClick={() => chooseOp('+')} label="جمع">+</CalcButton>

        <CalcButton variant="muted" onClick={toggleSign} label="تغییر علامت">±</CalcButton>
        <CalcButton onClick={() => inputDigit('0')}>۰</CalcButton>
        <CalcButton onClick={inputDot} label="ممیز">.</CalcButton>
        <CalcButton variant="eq" onClick={equals} label="مساوی">=</CalcButton>
      </div>
    </div>
  )
}
