'use client'

import { Fragment, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FsNode {
  name: string
  type: 'dir' | 'txt' | 'img' | 'audio' | 'pdf'
  content?: string
  emoji?: string
  children?: FsNode[]
}

const TYPE_EMOJI: Record<FsNode['type'], string> = {
  dir: '📁',
  txt: '📄',
  img: '🖼️',
  audio: '🎵',
  pdf: '📕',
}

const TYPE_LABEL: Record<FsNode['type'], string> = {
  dir: 'پوشه',
  txt: 'سند متنی',
  img: 'تصویر',
  audio: 'فایل صوتی',
  pdf: 'سند PDF',
}

const HOME: FsNode = {
  name: 'خانه',
  type: 'dir',
  emoji: '🏠',
  children: [
    {
      name: 'سندها',
      type: 'dir',
      children: [
        {
          name: 'قرارداد_با_گربه.pdf',
          type: 'pdf',
          content:
            '«قرارداد همکاری صلح‌آمیز انسان و گربه»\n\n' +
            'ماده ۱: گربه حق دارد هر ساعتی از شبانه‌روز بخوابد؛ حتی روی کیبورد.\n' +
            'ماده ۲: کیبوردِ گرم، به‌طور خودکار متعلق به گربه تلقی می‌شود.\n' +
            'ماده ۳: در ازای هر «میاو» صبحگاهی، دو وعده غذا پرداخت می‌گردد.\n' +
            'ماده ۴: این قرارداد قابل فسخ نیست. اصلاً. جدی می‌گیم.\n' +
            'ماده ۵: امضای گربه با جای پنجه روی کیبورد ثبت شده است: ttttttttt\n\n' +
            'مشاور حقوقی: خودِ گربه 🐾',
        },
        {
          name: 'دفتر_دخل_و_خرج.txt',
          type: 'txt',
          content:
            'دخل: صفر\nخرج: خیلی\nمانده: منفی-ولی-خوشحال 😌\n\n' +
            'یادداشت حسابدار: باز کردن این فایل مسئولیت روحی خودت هست.',
        },
      ],
    },
    {
      name: 'عکس‌ها',
      type: 'dir',
      children: [
        {
          name: 'گربه.png',
          type: 'img',
          emoji: '🐱',
          content:
            '🐱 گربه در حالت خواب عمیق روی لپ‌تاپ.\nکیفیت: فوق‌العاده. گرمای کیبورد: عالی.\nعکاس: خودش (سلفی‌گیر حرفه‌ای است).',
        },
        {
          name: 'تعطیلات.jpg',
          type: 'img',
          emoji: '🏖',
          content:
            '🏖 ساحل یخی قطب جنوب.\nآب‌وهوا: ۴۰ درجه زیر صفر (استاندارد تعطیلات پنگوئنی).\nبرنامه: شنا. مدت شنا: دو ثانیه.',
        },
        {
          name: 'سلفی.png',
          type: 'img',
          emoji: '🤳',
          content:
            '🤳 سلفی با نور طبیعی مانیتور.\nفیلتر: هیچی، این چهره واقعیه!\nهشدار: سطح بامزگی بسیار بالاست.',
        },
      ],
    },
    {
      name: 'موسیقی',
      type: 'dir',
      children: [
        {
          name: 'پنگوئن_راک.mp3',
          type: 'audio',
          emoji: '🎸',
          content:
            'این فایل رو با پخش‌کننده چیپ‌تیون باز کن!\n\nبیت: ۸ بیتی\nحجم: خیلی کم\nبامزگی: خیلی زیاد',
        },
        {
          name: 'میو_ریمیکس.wav',
          type: 'audio',
          emoji: '🎤',
          content:
            'ریمیکس دی‌جی گربه از یک میو کلاسیک.\nمدت: ۱۲ ثانیه از عظمت خالص.',
        },
      ],
    },
    {
      name: 'پروژه‌ها',
      type: 'dir',
      children: [
        {
          name: 'secret_plan.md',
          type: 'txt',
          emoji: '🤫',
          content:
            '🤫 نقشه تسخیر دنیا:\n۱- صبحانه نخودفرنگی (مرحله حیاتی)\n۲- جلب اعتماد انسان‌ها با بامزگی\n۳- ماهی رایگان برای همه\n۴- حکومت پنگوئنی مطلقه (ولی مهربون)\n۵- خواب\n\nوضعیت: مرحله ۲ داره عالی پیش میره 😎',
        },
        {
          name: 'ایده‌های_باز.txt',
          type: 'txt',
          content:
            '💡 ایده‌های باز:\n• اپ شمارش ماهی\n• کیبورد ضدگربه (در حال بررسی حقوقی)\n• والپیپر جدید (سبز. همیشه سبز.)',
        },
      ],
    },
    {
      name: 'دانلودها',
      type: 'dir',
      children: [
        {
          name: 'فایل_خیلی_مهم_final_final2.pdf',
          type: 'pdf',
          content:
            'این فایل خراب است. قول می‌دهم. از کسی هم پرسیدم.\n\n' +
            '(اگر یکی پرسید، بگو خودم بررسی کردم و تأیید شد.)',
        },
      ],
    },
  ],
}

const faNum = (n: number): string => n.toLocaleString('fa-IR')

const emojiOf = (n: FsNode): string => n.emoji ?? TYPE_EMOJI[n.type]

export default function FileManagerApp() {
  const [path, setPath] = useState<FsNode[]>([])
  const [selected, setSelected] = useState<FsNode | null>(null)

  const current = path.length > 0 ? path[path.length - 1] : HOME
  const items = current.children ?? []
  const atRoot = path.length === 0 && !selected

  const openNode = (node: FsNode) => {
    if (node.type === 'dir') {
      setSelected(null)
      setPath((p) => [...p, node])
    } else {
      setSelected(node)
    }
  }

  const goUp = () => {
    if (selected) {
      setSelected(null)
      return
    }
    if (path.length > 0) {
      setSelected(null)
      setPath((p) => p.slice(0, -1))
    }
  }

  const goHome = () => {
    setSelected(null)
    setPath([])
  }

  const jumpTo = (index: number) => {
    setSelected(null)
    setPath(path.slice(0, index + 1))
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* نوار ابزار: برگشت + مسیر جاری */}
      <header className="flex shrink-0 items-center gap-1 border-b border-white/10 bg-zinc-900/60 p-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="برگشت به عقب"
          disabled={atRoot}
          onClick={goUp}
          className="size-8 shrink-0 text-zinc-300 hover:bg-white/10 hover:text-zinc-100"
        >
          <ArrowRight className="size-4" />
        </Button>
        <nav
          aria-label="مسیر فعلی"
          className="os-scroll flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-xs"
        >
          <button
            type="button"
            onClick={goHome}
            className="shrink-0 whitespace-nowrap rounded-md px-2 py-1 font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95"
          >
            🏠 خانه
          </button>
          {path.map((node, i) => {
            const isLast = i === path.length - 1
            return (
              <Fragment key={`${node.name}-${i}`}>
                <span className="shrink-0 text-zinc-600" aria-hidden>
                  /
                </span>
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  className={`shrink-0 whitespace-nowrap rounded-md px-2 py-1 transition hover:bg-white/10 active:scale-95 ${
                    isLast
                      ? 'font-bold text-[var(--pengo-accent)]'
                      : 'text-zinc-300'
                  }`}
                >
                  {emojiOf(node)} {node.name}
                </button>
              </Fragment>
            )
          })}
          {selected && (
            <Fragment>
              <span className="shrink-0 text-zinc-600" aria-hidden>
                /
              </span>
              <span className="shrink-0 truncate px-2 py-1 font-bold text-[var(--pengo-accent)]">
                {emojiOf(selected)} {selected.name}
              </span>
            </Fragment>
          )}
        </nav>
      </header>

      {/* محتوای پوشه یا پیش‌نمایش فایل */}
      <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {selected ? (
          <div className="pengo-pop flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span
                className="grid size-16 shrink-0 place-items-center rounded-2xl bg-zinc-800/60 text-4xl"
                aria-hidden
              >
                {emojiOf(selected)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-zinc-100">
                  {selected.name}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {TYPE_LABEL[selected.type]} • کلیک راست نداریم، ولی کاش داشتیم 😅
                </p>
              </div>
            </div>
            <div className="whitespace-pre-wrap rounded-xl bg-zinc-900 p-4 text-sm leading-7 text-zinc-200">
              {selected.content ?? 'این فایل محتوایی نداره. شاید جا گذاشتیمش؟ 🤔'}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="text-4xl" aria-hidden>
              🕸️
            </span>
            <p className="text-xs text-zinc-500">
              این پوشه خالیه. حتی گربه هم اینجا سر نمی‌زنه!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {items.map((node) => (
              <button
                key={node.name}
                type="button"
                title={TYPE_LABEL[node.type]}
                onClick={() => openNode(node)}
                className="group flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
              >
                <span
                  className="grid h-14 w-full place-items-center rounded-xl bg-zinc-800/60 text-3xl transition group-hover:scale-[1.04] group-hover:bg-zinc-800"
                  aria-hidden
                >
                  {emojiOf(node)}
                </span>
                <span className="w-full truncate text-center text-[11px] text-zinc-300">
                  {node.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* نوار وضعیت */}
      <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 px-3 py-1.5 text-[11px] text-zinc-500">
        <span className="truncate">
          {selected
            ? `پیش‌نمایش: ${selected.name} • `
            : `${faNum(items.length)} آیتم • `}
          فضای خالی: بستگی به حس‌وحال سرور دارد
        </span>
        <span className="hidden shrink-0 sm:inline">
          🐧 سیستم فایل پنگوئنی نسخه ۹۹.۹
        </span>
      </footer>
    </div>
  )
}
