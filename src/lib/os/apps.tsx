'use client'

import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  AlarmClock,
  AudioLines,
  Bird,
  Bot,
  Bomb,
  Brain,
  BrickWall,
  Calculator,
  CalendarDays,
  Cat,
  CircleDot,
  CloudSun,
  Cog,
  Copy,
  Dices,
  FileCode2,
  FilePenLine,
  FileText,
  FolderOpen,
  Github,
  Globe,
  GraduationCap,
  Grid3x3,
  Hammer,
  Hash,
  Hourglass,
  Images,
  Info,
  KeyRound,
  Layers,
  Lightbulb,
  NotebookPen,
  Palette,
  PersonStanding,
  Presentation,
  Regex,
  Ruler,
  Settings,
  Sheet,
  SquareKanban,
  SpellCheck,
  SquareTerminal,
  SwatchBook,
  Timer,
  Worm,
  Code2,
  ScanFace,
  Cpu,
} from 'lucide-react'
import { useOS } from '@/lib/os/store'

import TerminalApp from '@/components/os/apps/terminal'
import FileManagerApp from '@/components/os/apps/file-manager'
import NotesApp from '@/components/os/apps/notes'
import ClockApp from '@/components/os/apps/clock-app'
import PaintApp from '@/components/os/apps/paint'
import CalculatorApp from '@/components/os/apps/calculator'
import WeatherApp from '@/components/os/apps/weather'
import SystemMonitorApp from '@/components/os/apps/system-monitor'
import MusicApp from '@/components/os/apps/music'
import SettingsApp from '@/components/os/apps/settings'
import IdeaGeneratorApp from '@/components/os/apps/idea-generator'
import CatTranslatorApp from '@/components/os/apps/cat-translator'
import PhotosApp from '@/components/os/apps/photos'
import WriterApp from '@/components/os/apps/writer'
import CodeStudioApp from '@/components/os/apps/code-studio'
import SpreadsheetApp from '@/components/os/apps/spreadsheet'
import SlidesApp from '@/components/os/apps/slides'
import AIChatApp from '@/components/os/apps/ai-chat'
import GitHubApp from '@/components/os/apps/github'
import UnitConverterApp from '@/components/os/apps/unit-converter'
import PassgenApp from '@/components/os/apps/passgen'
import WheelApp from '@/components/os/apps/wheel'
import AboutApp from '@/components/os/apps/about'
import LinuxAcademyApp from '@/components/os/apps/linux-academy'
import CalendarApp from '@/components/os/apps/calendar'
import KanbanApp from '@/components/os/apps/kanban'
import PomodoroApp from '@/components/os/apps/pomodoro'
import MarkdownApp from '@/components/os/apps/markdown'
import RegexLabApp from '@/components/os/apps/regex-lab'
import ColorStudioApp from '@/components/os/apps/color-studio'
import FlashcardsApp from '@/components/os/apps/flashcards'
import FaceDetectApp from '@/components/os/apps/face-detect'
import LinuxEditionApp from '@/components/os/apps/linux-edition'
import RealLinuxApp from '@/components/os/apps/real-linux'
import BodyMetricsApp from '@/components/os/apps/body-metrics'
import AgeMachineApp from '@/components/os/apps/age-machine'
import BrowserApp from '@/components/os/apps/browser'
import PdfEditorApp from '@/components/os/apps/pdf-editor'
import RustAcademyApp from '@/components/os/apps/rust-academy'
import AIAcademyApp from '@/components/os/apps/ai-academy'

import SnakeGame from '@/components/os/games/snake'
import Game2048 from '@/components/os/games/g2048'
import TicTacToeGame from '@/components/os/games/tictactoe'
import MemoryGame from '@/components/os/games/memory'
import MinesweeperGame from '@/components/os/games/minesweeper'
import PongGame from '@/components/os/games/pong'
import FlappyGame from '@/components/os/games/flappy'
import WhackamoleGame from '@/components/os/games/whackamole'
import BreakoutGame from '@/components/os/games/breakout'
import WordleGame from '@/components/os/games/wordle-fa'

export type AppCategory = 'app' | 'game' | 'system'

export interface AppMeta {
  id: string
  name: string
  icon: LucideIcon
  category: AppCategory
  component: ComponentType
  w: number
  h: number
  desktop?: boolean
  keywords?: string[]
  /** کلاس گرادیان تیلویند برای آیکن رنگی هر اپ */
  tint?: string
}

/* گرادیان‌های رنگی — پالت سان‌جاب */
const G = {
  orange: 'from-[#f7931e] to-[#e07b00]',
  violet: 'from-[#8b5cf6] to-[#7c3aed]',
  teal: 'from-[#0ea5a0] to-[#0c9488]',
  rose: 'from-[#f43f5e] to-[#e11d48]',
  amber: 'from-amber-400 to-orange-500',
  lime: 'from-lime-400 to-emerald-500',
  pink: 'from-pink-400 to-fuchsia-500',
  sand: 'from-[#fdb56b] to-[#f7931e]',
  grape: 'from-violet-500 to-fuchsia-600',
  forest: 'from-emerald-400 to-teal-500',
  berry: 'from-rose-400 to-pink-600',
  sun: 'from-yellow-300 to-amber-500',
}

export const APPS: AppMeta[] = [
  // ---------- اپ‌ها ----------
  {
    id: 'linux-academy',
    name: 'آکادمی لینوکس',
    icon: GraduationCap,
    category: 'app',
    component: LinuxAcademyApp,
    w: 880,
    h: 620,
    desktop: true,
    tint: G.orange,
    keywords: ['linux', 'learn', 'آموزش', 'لینوکس', 'آکادمی', 'توزیع', 'نصب', 'آزمون', 'گواهی'],
  },
  {
    id: 'terminal',
    name: 'ترمینال آموزشی',
    icon: SquareTerminal,
    category: 'app',
    component: TerminalApp,
    w: 720,
    h: 480,
    desktop: true,
    tint: G.teal,
    keywords: ['terminal', 'shell', 'command', 'learn'],
  },
  {
    id: 'writer',
    name: 'نویسا (ورد)',
    icon: FileText,
    category: 'app',
    component: WriterApp,
    w: 780,
    h: 560,
    desktop: true,
    tint: G.violet,
    keywords: ['word', 'docx', 'pdf', 'writer', 'نویسا', 'تایپ', 'متن'],
  },
  {
    id: 'code',
    name: 'کداستودیو (پایتون)',
    icon: Code2,
    category: 'app',
    component: CodeStudioApp,
    w: 820,
    h: 580,
    desktop: true,
    tint: G.forest,
    keywords: ['python', 'code', 'js', 'سنجابی', 'برنامه‌نویسی', 'پایتون'],
  },
  {
    id: 'ai-chat',
    name: 'هوش‌یار (AI)',
    icon: Bot,
    category: 'app',
    component: AIChatApp,
    w: 740,
    h: 540,
    desktop: true,
    tint: G.grape,
    keywords: ['ai', 'chat', 'gpt', 'claude', 'llm', 'هوش', 'چت', 'ربات', 'مصنوعی'],
  },
  {
    id: 'github',
    name: 'گیت‌هاب',
    icon: Github,
    category: 'app',
    component: GitHubApp,
    w: 780,
    h: 560,
    tint: 'from-zinc-400 to-zinc-600',
    keywords: ['github', 'git', 'repo', 'token', 'ریپو', 'توکن'],
  },
  {
    id: 'spreadsheet',
    name: 'صفحه‌گسترده',
    icon: Sheet,
    category: 'app',
    component: SpreadsheetApp,
    w: 800,
    h: 560,
    tint: G.lime,
    keywords: ['excel', 'xlsx', 'csv', 'اکسل', 'جدول', 'فرمول'],
  },
  {
    id: 'slides',
    name: 'اسلایدساز',
    icon: Presentation,
    category: 'app',
    component: SlidesApp,
    w: 800,
    h: 560,
    tint: G.rose,
    keywords: ['powerpoint', 'ppt', 'اسلاید', 'ارائه', 'سمینار'],
  },
  {
    id: 'file-manager',
    name: 'پرونده‌ها',
    icon: FolderOpen,
    category: 'app',
    component: FileManagerApp,
    w: 640,
    h: 440,
    tint: G.amber,
    keywords: ['files', 'folder'],
  },
  {
    id: 'photos',
    name: 'گالری عکس',
    icon: Images,
    category: 'app',
    component: PhotosApp,
    w: 620,
    h: 460,
    desktop: true,
    tint: G.pink,
    keywords: ['photos', 'gallery', 'image'],
  },
  {
    id: 'notes',
    name: 'دفترچه یادداشت',
    icon: NotebookPen,
    category: 'app',
    component: NotesApp,
    w: 560,
    h: 420,
    tint: G.sun,
    keywords: ['notes', 'note'],
  },
  {
    id: 'clock',
    name: 'ساعت و تایمر',
    icon: AlarmClock,
    category: 'app',
    component: ClockApp,
    w: 460,
    h: 460,
    tint: G.rose,
    keywords: ['clock', 'timer', 'stopwatch'],
  },
  {
    id: 'paint',
    name: 'نقاشی',
    icon: Palette,
    category: 'app',
    component: PaintApp,
    w: 640,
    h: 470,
    desktop: true,
    tint: G.grape,
    keywords: ['paint', 'draw'],
  },
  {
    id: 'calculator',
    name: 'ماشین‌حساب فول',
    icon: Calculator,
    category: 'app',
    component: CalculatorApp,
    w: 360,
    h: 560,
    tint: G.orange,
    keywords: ['calc', 'calculator', 'علمی'],
  },
  {
    id: 'unit',
    name: 'مبدل یکاها',
    icon: Ruler,
    category: 'app',
    component: UnitConverterApp,
    w: 520,
    h: 500,
    tint: G.teal,
    keywords: ['unit', 'convert', 'مبدل', 'واحد', 'دما'],
  },
  {
    id: 'passgen',
    name: 'رمزساز قوی',
    icon: KeyRound,
    category: 'app',
    component: PassgenApp,
    w: 480,
    h: 500,
    tint: G.berry,
    keywords: ['password', 'رمز', 'pass'],
  },
  {
    id: 'wheel',
    name: 'چرخ شانس',
    icon: Dices,
    category: 'app',
    component: WheelApp,
    w: 480,
    h: 560,
    tint: G.pink,
    keywords: ['wheel', 'شانس', 'قرعه', 'dice'],
  },
  {
    id: 'weather',
    name: 'آب‌وهوای خیالی',
    icon: CloudSun,
    category: 'app',
    component: WeatherApp,
    w: 520,
    h: 460,
    tint: G.forest,
    keywords: ['weather'],
  },
  {
    id: 'system-monitor',
    name: 'مانیتور سیستم',
    icon: Activity,
    category: 'app',
    component: SystemMonitorApp,
    w: 640,
    h: 450,
    tint: G.lime,
    keywords: ['monitor', 'htop', 'cpu'],
  },
  {
    id: 'music',
    name: 'پخش‌کننده چیپ‌تیون',
    icon: AudioLines,
    category: 'app',
    component: MusicApp,
    w: 500,
    h: 470,
    desktop: true,
    tint: G.grape,
    keywords: ['music', 'player', 'audio'],
  },
  {
    id: 'settings',
    name: 'تنظیمات',
    icon: Settings,
    category: 'app',
    component: SettingsApp,
    w: 560,
    h: 470,
    tint: G.sand,
    keywords: ['settings', 'config'],
  },
  {
    id: 'ideas',
    name: 'مولد ایده عجیب',
    icon: Lightbulb,
    category: 'app',
    component: IdeaGeneratorApp,
    w: 500,
    h: 460,
    desktop: true,
    tint: G.sun,
    keywords: ['idea', 'startup'],
  },
  {
    id: 'cat-translator',
    name: 'مترجم گربه‌ای',
    icon: Cat,
    category: 'app',
    component: CatTranslatorApp,
    w: 500,
    h: 470,
    tint: G.amber,
    keywords: ['cat', 'meow'],
  },
  {
    id: 'calendar',
    name: 'تقویم جلالی',
    icon: CalendarDays,
    category: 'app',
    component: CalendarApp,
    w: 680,
    h: 540,
    tint: G.teal,
    keywords: ['calendar', 'تقویم', 'جلالی', 'شمسی', 'رویداد', 'نوروز'],
  },
  {
    id: 'kanban',
    name: 'برد کارها',
    icon: SquareKanban,
    category: 'app',
    component: KanbanApp,
    w: 680,
    h: 500,
    tint: G.violet,
    keywords: ['kanban', 'task', 'کار', 'تسک', 'برنامه‌ریزی'],
  },
  {
    id: 'pomodoro',
    name: 'گوشهٔ تمرکز',
    icon: Timer,
    category: 'app',
    component: PomodoroApp,
    w: 500,
    h: 560,
    tint: G.rose,
    keywords: ['pomodoro', 'focus', 'timer', 'تمرکز', 'پومودورو', 'مطالعه'],
  },
  {
    id: 'markdown',
    name: 'استودیو مارک‌داون',
    icon: FileCode2,
    category: 'app',
    component: MarkdownApp,
    w: 800,
    h: 560,
    tint: G.forest,
    keywords: ['markdown', 'md', 'مارک‌داون', 'مستند'],
  },
  {
    id: 'regex-lab',
    name: 'آزمایشگاه Regex',
    icon: Regex,
    category: 'app',
    component: RegexLabApp,
    w: 660,
    h: 540,
    tint: G.berry,
    keywords: ['regex', 'pattern', 'الگو', 'عبارت باقاعده'],
  },
  {
    id: 'color-studio',
    name: 'کارگاه رنگ',
    icon: SwatchBook,
    category: 'app',
    component: ColorStudioApp,
    w: 580,
    h: 540,
    tint: G.pink,
    keywords: ['color', 'palette', 'رنگ', 'پالت', 'کنتراست'],
  },
  {
    id: 'flashcards',
    name: 'فلش‌کارت لایتنر',
    icon: Layers,
    category: 'app',
    component: FlashcardsApp,
    w: 580,
    h: 580,
    tint: G.sun,
    keywords: ['flashcard', 'leitner', 'مرور', 'حافظه', 'یادگیری', 'لینوکس'],
  },
  {
    id: 'face-detect',
    name: 'تشخیص چهره',
    icon: ScanFace,
    category: 'app',
    component: FaceDetectApp,
    w: 620,
    h: 580,
    desktop: true,
    tint: G.grape,
    keywords: ['face', 'camera', 'gender', 'age', 'دوربین', 'چهره', 'سن', 'جنسیت', 'تشخیص'],
  },
  {
    id: 'linux-edition',
    name: 'نسخه لینوکس واقعی',
    icon: Cpu,
    category: 'app',
    component: LinuxEditionApp,
    w: 760,
    h: 600,
    desktop: true,
    tint: 'from-[#f7931e] to-[#0ea5a0]',
    keywords: ['linux', 'kernel', 'debian', 'ubuntu', 'arch', 'docker', 'install', 'هسته', 'نصب', 'لینوکس', 'دبین', 'آرچ', 'اوبونتو', 'کیوسک', 'واقعی'],
  },
  {
    id: 'real-linux',
    name: 'بوت کرنل واقعی',
    icon: Cpu,
    category: 'app',
    component: RealLinuxApp,
    w: 820,
    h: 640,
    desktop: true,
    tint: G.forest,
    keywords: ['linux', 'kernel', 'real', 'v86', 'alpine', 'vm', 'emulator', 'bzimage', 'کرنل', 'هسته', 'بوت', 'شبیه‌ساز', 'واقعی', 'مجازی'],
  },
  {
    id: 'rust-academy',
    name: 'آکادمی Rust',
    icon: Cog,
    category: 'app',
    component: RustAcademyApp,
    w: 840,
    h: 620,
    desktop: true,
    tint: 'from-[#b7410e] to-[#f7931e]',
    keywords: ['rust', 'ownership', 'cargo', 'rustacean', 'راست', 'رست', 'مالکیت', 'برنامه‌نویسی', 'آکادمی'],
  },
  {
    id: 'ai-academy',
    name: 'آکادمی هوش مصنوعی',
    icon: Brain,
    category: 'app',
    component: AIAcademyApp,
    w: 820,
    h: 620,
    desktop: true,
    tint: G.grape,
    keywords: ['ai', 'ml', 'perceptron', 'neural', 'llm', 'gradient', 'هوش مصنوعی', 'یادگیری ماشین', 'شبکه عصبی', 'مفاهیم'],
  },
  {
    id: 'browser',
    name: 'سفربُر (مرورگر)',
    icon: Globe,
    category: 'app',
    component: BrowserApp,
    w: 900,
    h: 640,
    desktop: true,
    tint: G.amber,
    keywords: ['browser', 'web', 'internet', 'wikipedia', 'مرورگر', 'اینترنت', 'سایت', 'وب'],
  },
  {
    id: 'pdf-editor',
    name: 'PDF ساز',
    icon: FilePenLine,
    category: 'app',
    component: PdfEditorApp,
    w: 880,
    h: 620,
    desktop: true,
    tint: G.rose,
    keywords: ['pdf', 'editor', 'annotate', 'merge', 'پی‌دی‌اف', 'ویرایش', 'هایلایت', 'ادغام'],
  },
  {
    id: 'body-metrics',
    name: 'قدسنج و وزن‌یاب',
    icon: PersonStanding,
    category: 'app',
    component: BodyMetricsApp,
    w: 600,
    h: 660,
    desktop: true,
    tint: G.forest,
    keywords: ['height', 'weight', 'bmi', 'camera', 'قد', 'وزن', 'سلامت', 'دوربین'],
  },
  {
    id: 'age-machine',
    name: 'ماشین زمان چهره',
    icon: Hourglass,
    category: 'app',
    component: AgeMachineApp,
    w: 640,
    h: 660,
    desktop: true,
    tint: G.grape,
    keywords: ['age', 'face', 'old', 'young', 'camera', 'سن', 'پیر', 'جوان', 'چهره', 'دوربین'],
  },
  // ---------- بازی‌ها ----------
  {
    id: 'snake',
    name: 'مار',
    icon: Worm,
    category: 'game',
    component: SnakeGame,
    w: 480,
    h: 620,
    desktop: true,
    tint: G.forest,
    keywords: ['snake'],
  },
  {
    id: 'g2048',
    name: '۲۰۴۸',
    icon: Hash,
    category: 'game',
    component: Game2048,
    w: 460,
    h: 600,
    tint: G.orange,
    keywords: ['2048'],
  },
  {
    id: 'tictactoe',
    name: 'دوز',
    icon: Grid3x3,
    category: 'game',
    component: TicTacToeGame,
    w: 460,
    h: 560,
    tint: G.teal,
    keywords: ['tic tac toe', 'ttt'],
  },
  {
    id: 'memory',
    name: 'حافظه خفن',
    icon: Copy,
    category: 'game',
    component: MemoryGame,
    w: 480,
    h: 600,
    tint: G.violet,
    keywords: ['memory', 'cards'],
  },
  {
    id: 'minesweeper',
    name: 'مین‌یاب',
    icon: Bomb,
    category: 'game',
    component: MinesweeperGame,
    w: 500,
    h: 600,
    desktop: true,
    tint: G.sand,
    keywords: ['mines', 'minesweeper'],
  },
  {
    id: 'pong',
    name: 'پینگ‌پنگ',
    icon: CircleDot,
    category: 'game',
    component: PongGame,
    w: 580,
    h: 480,
    tint: G.berry,
    keywords: ['pong'],
  },
  {
    id: 'flappy',
    name: 'پنگوئن پرنده',
    icon: Bird,
    category: 'game',
    component: FlappyGame,
    w: 460,
    h: 640,
    desktop: true,
    tint: G.amber,
    keywords: ['flappy', 'bird'],
  },
  {
    id: 'whackamole',
    name: 'موش‌کوبی',
    icon: Hammer,
    category: 'game',
    component: WhackamoleGame,
    w: 480,
    h: 600,
    desktop: true,
    tint: G.berry,
    keywords: ['whack', 'mole'],
  },
  {
    id: 'breakout',
    name: 'آجرشکن',
    icon: BrickWall,
    category: 'game',
    component: BreakoutGame,
    w: 580,
    h: 520,
    tint: G.lime,
    keywords: ['breakout', 'arkanoid'],
  },
  {
    id: 'wordle',
    name: 'حدس‌لغت',
    icon: SpellCheck,
    category: 'game',
    component: WordleGame,
    w: 460,
    h: 640,
    desktop: true,
    tint: G.forest,
    keywords: ['wordle', 'word', 'لغت'],
  },
  // ---------- سیستم ----------
  {
    id: 'about',
    name: 'درباره سیستم',
    icon: Info,
    category: 'system',
    component: AboutApp,
    w: 460,
    h: 520,
    tint: G.orange,
    keywords: ['about', 'info', 'سان‌جاب'],
  },
]

export function getApp(id: string): AppMeta | undefined {
  return APPS.find((a) => a.id === id)
}

export function launch(id: string) {
  const app = getApp(id)
  if (!app) return
  useOS.getState().openApp({
    appId: app.id,
    title: app.name,
    w: app.w,
    h: app.h,
  })
}
