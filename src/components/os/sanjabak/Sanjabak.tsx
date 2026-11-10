'use client'

/**
 * Sanjabak، ماسکوت لایه‌ای سنجاب‌اواس
 *
 * SanjabakAvatar: رندر SVG لایه‌ای (بدن/چشم/عینک/کلاه/لباس/وسیله/پس‌زمینه)
 * Sanjabak: همدم میزکار، راه می‌رود، نکته می‌دهد و به رویدادهای یادگیری
 * واکنش ظریف نشان می‌دهد. با funMode و reducedMotion و تنظیم واکنش‌ها
 * کاملاً قابل کنترل است و هیچ‌وقت مزاحم تمرکز نمی‌شود.
 */

import { useEffect, useRef, useState } from 'react'
import { FUR_COLORS, BG_COLORS, useMascot } from '@/lib/os/mascot-store'
import { useOS } from '@/lib/os/store'
import { useLearning } from '@/lib/learning/store'

export type SanjabakMood = 'idle' | 'happy' | 'cheer' | 'think'

export const SANJABAK_TIPS = [
  'درس امروز را با ۱۰ دقیقه شروع کن، پیوستگی مهم‌تر از حجم است!',
  'مرور فاصله‌دار در مرکز یادگیری، دشمن فراموشی است.',
  'قبل از کدنویسی، شبه‌کد بنویس، در آکادمی الگوریتم امتحانش کن.',
  'آزمون کوچک = تمرین بازیابی حافظه. خودت را بسنج!',
  'یک پروژهٔ کوچک کامل کن تا مهارت واقعی شود.',
  'ترمینال را باز کن و help بزن، درس‌های مخفی اینجاست.',
]

interface AvatarProps {
  size?: number
  mood?: SanjabakMood
  className?: string
}

/** رندر خالص سنجابک، در استودیو و میزکار استفاده می‌شود */
export function SanjabakAvatar({ size = 96, mood = 'idle', className = '' }: AvatarProps) {
  const look = useMascot((s) => s.look)
  const fur = FUR_COLORS[look.fur] ?? FUR_COLORS.classic
  const bg = BG_COLORS[look.bg] ?? BG_COLORS.none

  const wave = look.pose === 'wave' || mood === 'cheer'
  const cheer = look.pose === 'cheer' || mood === 'cheer'
  const reading = look.pose === 'read'
  const happyEyes = look.eye === 'happy' || mood === 'happy' || mood === 'cheer'
  const starEyes = look.eye === 'star'

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="سنجابک، همراه یادگیری سان‌جاب‌اواس"
    >
      {/* پس‌زمینه */}
      {look.bg !== 'none' && (
        <>
          {bg.glow && <circle cx="50" cy="50" r="40" fill={bg.glow} opacity="0.35" />}
          <circle cx="50" cy="50" r="36" fill={bg.fill} />
          {look.bg === 'space' && (
            <>
              <circle cx="30" cy="26" r="1.6" fill="#fff" opacity="0.9" />
              <circle cx="68" cy="20" r="1.2" fill="#fff" opacity="0.8" />
              <circle cx="74" cy="44" r="1.4" fill="#fff" opacity="0.7" />
            </>
          )}
        </>
      )}

      {/* دم، امضای سنجاب */}
      <path
        d="M 30 62 C 12 60, 8 40, 20 30 C 26 25, 34 27, 32 34 C 27 42, 30 52, 36 56 Z"
        fill={fur.tail}
      />
      <path
        d="M 29 58 C 18 55, 15 42, 23 34"
        fill="none"
        stroke={fur.belly}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* گوش‌ها */}
      <path d="M 37 24 L 33 12 L 44 20 Z" fill={fur.body} />
      <path d="M 63 24 L 67 12 L 56 20 Z" fill={fur.body} />
      <path d="M 38 22 L 36 15.5 L 42 19.5 Z" fill={fur.belly} opacity="0.85" />
      <path d="M 62 22 L 64 15.5 L 58 19.5 Z" fill={fur.belly} opacity="0.85" />

      {/* بدن */}
      <ellipse cx="50" cy="64" rx="21" ry="23" fill={fur.body} />
      <ellipse cx="50" cy="69" rx="13" ry="15" fill={fur.belly} />

      {/* سر */}
      <circle cx="50" cy="37" r="17" fill={fur.body} />

      {/* لپ‌ها */}
      <circle cx="38.5" cy="42" r="3.4" fill="#ff9d9d" opacity="0.5" />
      <circle cx="61.5" cy="42" r="3.4" fill="#ff9d9d" opacity="0.5" />

      {/* چشم‌ها */}
      {happyEyes ? (
        <>
          <path d="M 40 34 Q 43.5 30.5 47 34" fill="none" stroke="#2b2018" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 53 34 Q 56.5 30.5 60 34" fill="none" stroke="#2b2018" strokeWidth="2.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="43.5" cy="34" r="3.1" fill="#2b2018" />
          <circle cx="56.5" cy="34" r="3.1" fill="#2b2018" />
          <circle cx="44.6" cy="32.9" r="1.05" fill="#fff" />
          <circle cx="57.6" cy="32.9" r="1.05" fill="#fff" />
          {starEyes && (
            <>
              <path d="M 43.5 27.5 l 1 2 2.2.2-1.7 1.5.5 2.2-2-1.2-2 1.2.5-2.2-1.7-1.5 2.2-.2 Z" fill="#ffd54a" />
              <path d="M 56.5 27.5 l 1 2 2.2.2-1.7 1.5.5 2.2-2-1.2-2 1.2.5-2.2-1.7-1.5 2.2-.2 Z" fill="#ffd54a" />
            </>
          )}
        </>
      )}

      {/* دماغ و دهان */}
      <ellipse cx="50" cy="40.5" rx="2.4" ry="1.8" fill="#5a3213" />
      {mood === 'cheer' ? (
        <path d="M 46 44 Q 50 49 54 44 Q 50 46.5 46 44 Z" fill="#7c3a12" />
      ) : mood === 'think' ? (
        <path d="M 47.5 45 L 52.5 45" stroke="#5a3213" strokeWidth="1.6" strokeLinecap="round" />
      ) : (
        <path d="M 46.5 43.5 Q 50 46.5 53.5 43.5" fill="none" stroke="#5a3213" strokeWidth="1.6" strokeLinecap="round" />
      )}

      {/* عینک */}
      {look.glasses === 'round' && (
        <g stroke="#3f3f46" strokeWidth="1.6" fill="none">
          <circle cx="43.5" cy="34" r="6.4" fill="rgba(255,255,255,0.18)" />
          <circle cx="56.5" cy="34" r="6.4" fill="rgba(255,255,255,0.18)" />
          <path d="M 49.9 34 L 50.1 34" />
          <path d="M 37.1 33 L 33 31" />
          <path d="M 62.9 33 L 67 31" />
        </g>
      )}
      {look.glasses === 'star' && (
        <g fill="rgba(255,213,74,0.3)" stroke="#e0a900" strokeWidth="1.4">
          <circle cx="43.5" cy="34" r="6.6" />
          <circle cx="56.5" cy="34" r="6.6" />
          <path d="M 50 33.5 L 50 34.5" />
        </g>
      )}

      {/* کلاه */}
      {look.hat === 'cap' && (
        <g>
          <path d="M 35 24 A 15 15 0 0 1 65 24 L 65 26 L 35 26 Z" fill="#e05b3a" />
          <rect x="30" y="24" width="24" height="4.4" rx="2.2" fill="#c24325" />
          <circle cx="50" cy="13" r="2.4" fill="#c24325" />
        </g>
      )}
      {look.hat === 'grad' && (
        <g>
          <rect x="34" y="19" width="32" height="4.5" rx="1.4" fill="#232338" transform="skewX(-4)" />
          <path d="M 50 11 L 72 20 L 50 27 L 28 20 Z" fill="#2c2c46" />
          <circle cx="50" cy="20.5" r="2.2" fill="#ffd54a" />
          <path d="M 66 22 L 66 31" stroke="#ffd54a" strokeWidth="1.6" />
          <circle cx="66" cy="32.5" r="1.8" fill="#ffd54a" />
        </g>
      )}
      {look.hat === 'band' && (
        <g>
          <path d="M 34 22 Q 50 14 66 22 L 66 26 Q 50 18.5 34 26 Z" fill="#2e9e6b" />
          <circle cx="50" cy="20.5" r="2" fill="#ffd54a" />
        </g>
      )}

      {/* لباس */}
      {look.outfit === 'scarf' && (
        <g>
          <path d="M 38 52 Q 50 58 62 52 L 62 57 Q 50 63 38 57 Z" fill="#d94f4f" />
          <path d="M 56 55 L 59 68 L 53 68 L 52 57 Z" fill="#b83c3c" />
        </g>
      )}
      {look.outfit === 'vest' && (
        <g fill="#3d6ea5">
          <path d="M 36 55 Q 33 68 37 76 L 45 74 L 45 54 Z" />
          <path d="M 64 55 Q 67 68 63 76 L 55 74 L 55 54 Z" />
        </g>
      )}
      {look.outfit === 'hoodie' && (
        <g fill="#7a4fb0">
          <path d="M 34 54 Q 31 70 36 80 L 64 80 Q 69 70 66 54 Q 58 60 50 60 Q 42 60 34 54 Z" />
          <path d="M 42 52 Q 50 58 58 52 Q 50 64 42 52 Z" fill="#9a71d1" />
          <path d="M 47 66 L 53 66" stroke="#4b2f73" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* دست‌ها */}
      {cheer ? (
        <>
          <ellipse cx="29" cy="46" rx="5" ry="8" fill={fur.body} transform="rotate(-35 29 46)" />
          <ellipse cx="71" cy="46" rx="5" ry="8" fill={fur.body} transform="rotate(35 71 46)" />
        </>
      ) : wave ? (
        <>
          <ellipse cx="70" cy="42" rx="5" ry="9" fill={fur.body} transform="rotate(30 70 42)" />
          <ellipse cx="33" cy="63" rx="4.6" ry="7" fill={fur.body} />
        </>
      ) : reading ? (
        <>
          <ellipse cx="38" cy="63" rx="4.6" ry="6" fill={fur.body} />
          <ellipse cx="62" cy="63" rx="4.6" ry="6" fill={fur.body} />
        </>
      ) : (
        <>
          <ellipse cx="33" cy="63" rx="4.6" ry="7" fill={fur.body} />
          <ellipse cx="67" cy="63" rx="4.6" ry="7" fill={fur.body} />
        </>
      )}

      {/* وسیله */}
      {look.held === 'acorn' && (
        <g>
          <ellipse cx="76" cy="58" rx="4.6" ry="5.4" fill="#b07a3e" />
          <path d="M 71.5 55 Q 76 50.5 80.5 55 Z" fill="#6d4423" />
          <rect x="75.4" y="49.4" width="1.4" height="3.4" rx="0.7" fill="#6d4423" />
        </g>
      )}
      {look.held === 'book' && (
        <g>
          <path d="M 36 66 L 50 63 L 50 76 L 36 79 Z" fill="#4a90d9" />
          <path d="M 64 66 L 50 63 L 50 76 L 64 79 Z" fill="#3a76b5" />
          <path d="M 50 63 L 50 76" stroke="#e8f1fa" strokeWidth="1.2" />
        </g>
      )}
      {look.held === 'laptop' && (
        <g>
          <path d="M 38 68 L 62 68 L 60 62 L 40 62 Z" fill="#565668" />
          <rect x="41" y="57.5" width="18" height="6" rx="1" fill="#7b7b92" />
          <rect x="42.4" y="58.6" width="15.2" height="3.8" rx="0.6" fill="#9fe8d8" />
        </g>
      )}

      {/* حالت فکر، حباب ذهنی کوچک */}
      {mood === 'think' && (
        <g opacity="0.85">
          <circle cx="76" cy="20" r="5.5" fill="#fff" opacity="0.35" />
          <circle cx="83" cy="13" r="3.4" fill="#fff" opacity="0.45" />
        </g>
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* همدم میزکار                                                         */
/* ------------------------------------------------------------------ */

export default function Sanjabak() {
  const funMode = useOS((s) => s.settings.funMode)
  const reducedMotion = useOS((s) => s.settings.reducedMotion)
  const animations = useOS((s) => s.settings.animations)
  const reactionsEnabled = useMascot((s) => s.reactions)
  const name = useMascot((s) => s.name)

  const [x, setX] = useState(24)
  const [dir, setDir] = useState<1 | -1>(1)
  const [bubble, setBubble] = useState<string | null>(null)
  const [mood, setMood] = useState<SanjabakMood>('idle')
  const moodTimer = useRef<number>(0)
  const lastEventId = useRef<string | null>(null)
  const lastEvents = useLearning((s) => s.profile.events)

  /* راه رفتن آرام، بدون setState تو در تو */
  useEffect(() => {
    if (!funMode || reducedMotion || !animations) return
    const t = window.setInterval(() => {
      const vw = window.innerWidth
      let next = x + dir * 0.9
      let nd: 1 | -1 = dir
      if (next > vw - 90) {
        nd = -1
        next = x - 0.9
      }
      if (next < 16) {
        nd = 1
        next = x + 0.9
      }
      setX(next)
      if (nd !== dir) setDir(nd)
    }, 40)
    return () => window.clearInterval(t)
  }, [funMode, reducedMotion, animations, x, dir])

  const say = (text: string, m: SanjabakMood = 'happy') => {
    setBubble(text)
    setMood(m)
    window.clearTimeout(moodTimer.current)
    moodTimer.current = window.setTimeout(() => {
      setBubble(null)
      setMood('idle')
    }, 5200)
  }

  /* خوشامد ورود */
  useEffect(() => {
    if (!funMode) return
    const t = window.setTimeout(() => say(`${name} خوش‌اومد! امروز چند دقیقه یاد می‌گیری؟`), 2600)
    return () => window.clearTimeout(t)
  }, [funMode])

  /* واکنش به رویدادهای یادگیری */
  useEffect(() => {
    if (!funMode || !reactionsEnabled) return
    const last = lastEvents[lastEvents.length - 1]
    if (!last || last.id === lastEventId.current) return
    const isFirst = lastEventId.current === null
    lastEventId.current = last.id
    if (isFirst) return
    /* با تاخیر صفر، setState در callback، نه هم‌زمان در بدنهٔ effect */
    const t = window.setTimeout(() => {
      if (last.type === 'lesson.completed') {
        say('آفرین! یه درس دیگه تموم شد 🎉', 'cheer')
      } else if (last.type === 'project.completed') {
        say('پروژه کامل شد! تو یه چیزی ساختی!', 'cheer')
      } else if (last.type === 'skill.mastery_changed') {
        say('مهارتت ارتقا گرفت، دمت گرم!', 'cheer')
      } else if (last.type === 'review.completed') {
        say('مرور باحال! مغزت ممنونت هست.', 'happy')
      }
    }, 0)
    return () => window.clearTimeout(t)
  }, [lastEvents, funMode, reactionsEnabled])

  if (!funMode) return null

  return (
    <button
      type="button"
      onClick={() => say(SANJABAK_TIPS[Math.floor(Math.random() * SANJABAK_TIPS.length)])}
      className="fixed bottom-11 z-[4] block cursor-pointer transition-[left] duration-100 ease-linear"
      style={{ left: x }}
      aria-label={`${name}، همراه یادگیری. برای یک نکته کلیک کن`}
      title={name}
    >
      {bubble && (
        <span
          dir="rtl"
          className="absolute bottom-full mb-2 block w-max max-w-56 rounded-2xl rounded-br-md border border-white/15 bg-zinc-900/95 px-3 py-2 text-[11px] leading-5 text-zinc-100 shadow-xl shadow-black/50"
          role="status"
        >
          {bubble}
        </span>
      )}
      <span className="block" style={{ transform: dir === -1 ? 'scaleX(-1)' : undefined }}>
        <SanjabakAvatar size={46} mood={mood} />
      </span>
    </button>
  )
}
