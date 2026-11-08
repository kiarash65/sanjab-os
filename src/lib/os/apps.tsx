'use client'

import dynamic from 'next/dynamic'
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
  Loader2,
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
  Trophy,
  Worm,
  Code2,
  ScanFace,
  Cpu,
  Braces,
  Feather,
  Boxes,
  Download,
  Compass,
  Squirrel,
  Zap,
} from 'lucide-react'
import { useOS } from '@/lib/os/store'

/* ------------------------------------------------------------------ */
/* بارگذاری تنبل اپ‌ها — هر اپ/بازی یک chunk جدا (code splitting)      */
/* با next/dynamic؛ آیکن‌ها و فراداده سبک می‌مانند در bundle اصلی.     */
/* ------------------------------------------------------------------ */

function AppLoading() {
  return (
    <div className="grid h-full w-full place-items-center bg-zinc-950/60" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-2 text-zinc-500">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        <span className="text-xs font-bold">در حال باز شدن…</span>
      </div>
    </div>
  )
}

const d = (loader: () => Promise<{ default: ComponentType }>) =>
  dynamic(loader, { ssr: false, loading: () => <AppLoading /> })

const TerminalApp = d(() => import('@/components/os/apps/terminal'))
const FileManagerApp = d(() => import('@/components/os/apps/file-manager'))
const NotesApp = d(() => import('@/components/os/apps/notes'))
const ClockApp = d(() => import('@/components/os/apps/clock-app'))
const PaintApp = d(() => import('@/components/os/apps/paint'))
const CalculatorApp = d(() => import('@/components/os/apps/calculator'))
const WeatherApp = d(() => import('@/components/os/apps/weather'))
const SystemMonitorApp = d(() => import('@/components/os/apps/system-monitor'))
const MusicApp = d(() => import('@/components/os/apps/music'))
const SettingsApp = d(() => import('@/components/os/apps/settings'))
const IdeaGeneratorApp = d(() => import('@/components/os/apps/idea-generator'))
const CatTranslatorApp = d(() => import('@/components/os/apps/cat-translator'))
const PhotosApp = d(() => import('@/components/os/apps/photos'))
const WriterApp = d(() => import('@/components/os/apps/writer'))
const CodeStudioApp = d(() => import('@/components/os/apps/code-studio'))
const SpreadsheetApp = d(() => import('@/components/os/apps/spreadsheet'))
const SlidesApp = d(() => import('@/components/os/apps/slides'))
const AIChatApp = d(() => import('@/components/os/apps/ai-chat'))
const GitHubApp = d(() => import('@/components/os/apps/github'))
const UnitConverterApp = d(() => import('@/components/os/apps/unit-converter'))
const PassgenApp = d(() => import('@/components/os/apps/passgen'))
const WheelApp = d(() => import('@/components/os/apps/wheel'))
const AboutApp = d(() => import('@/components/os/apps/about'))
const LinuxAcademyApp = d(() => import('@/components/os/apps/linux-academy'))
const CalendarApp = d(() => import('@/components/os/apps/calendar'))
const KanbanApp = d(() => import('@/components/os/apps/kanban'))
const PomodoroApp = d(() => import('@/components/os/apps/pomodoro'))
const MarkdownApp = d(() => import('@/components/os/apps/markdown'))
const RegexLabApp = d(() => import('@/components/os/apps/regex-lab'))
const ColorStudioApp = d(() => import('@/components/os/apps/color-studio'))
const FlashcardsApp = d(() => import('@/components/os/apps/flashcards'))
const FaceDetectApp = d(() => import('@/components/os/apps/face-detect'))
const LinuxEditionApp = d(() => import('@/components/os/apps/linux-edition'))
const RealLinuxApp = d(() => import('@/components/os/apps/real-linux'))
const BodyMetricsApp = d(() => import('@/components/os/apps/body-metrics'))
const BrowserApp = d(() => import('@/components/os/apps/browser'))
const PdfEditorApp = d(() => import('@/components/os/apps/pdf-editor'))
const RustAcademyApp = d(() => import('@/components/os/apps/rust-academy'))
const AIAcademyApp = d(() => import('@/components/os/apps/ai-academy'))
const LearningHubApp = d(() => import('@/components/os/apps/learning-hub'))
const AlgorithmAcademyApp = d(() => import('@/components/os/apps/algorithm-academy'))
const CoachApp = d(() => import('@/components/os/apps/coach'))
const ProjectLabApp = d(() => import('@/components/os/apps/project-lab'))
const SanjabakStudioApp = d(() => import('@/components/os/apps/sanjabak-studio'))
const PythonAcademyApp = d(() => import('@/components/os/apps/python-academy'))
const PowerShellAcademyApp = d(() => import('@/components/os/apps/powershell-academy'))
const NeveshtYarApp = d(() => import('@/components/os/apps/neveshtyar'))
const RuntimeManagerApp = d(() => import('@/components/os/apps/runtime-manager'))
const DownloadsApp = d(() => import('@/components/os/apps/downloads'))

const SnakeGame = d(() => import('@/components/os/games/snake'))
const Game2048 = d(() => import('@/components/os/games/g2048'))
const TicTacToeGame = d(() => import('@/components/os/games/tictactoe'))
const MemoryGame = d(() => import('@/components/os/games/memory'))
const MinesweeperGame = d(() => import('@/components/os/games/minesweeper'))
const PongGame = d(() => import('@/components/os/games/pong'))
const FlappyGame = d(() => import('@/components/os/games/flappy'))
const WhackamoleGame = d(() => import('@/components/os/games/whackamole'))
const BreakoutGame = d(() => import('@/components/os/games/breakout'))
const WordleGame = d(() => import('@/components/os/games/wordle-fa'))

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
    id: 'python-academy',
    name: 'آکادمی پایتون',
    icon: Braces,
    category: 'app',
    component: PythonAcademyApp,
    w: 880,
    h: 620,
    desktop: true,
    tint: G.orange,
    keywords: ['python', 'pyodide', 'cpython', 'programming', 'پایتون', 'برنامه‌نویسی', 'آکادمی', 'تمرین'],
  },
  {
    id: 'powershell-academy',
    name: 'آکادمی پاورشل',
    icon: SquareTerminal,
    category: 'app',
    component: PowerShellAcademyApp,
    w: 840,
    h: 600,
    desktop: true,
    tint: 'from-[#5391FE] to-[#2f6fce]',
    keywords: ['powershell', 'windows', 'cmdlet', 'پاورشل', 'ویندوز', 'اسکریپت', 'آکادمی'],
  },
  {
    id: 'neveshtyar',
    name: 'نوشت‌یار',
    icon: Feather,
    category: 'app',
    component: NeveshtYarApp,
    w: 860,
    h: 580,
    desktop: true,
    tint: 'from-emerald-400 to-teal-500',
    keywords: ['fa', 'writing', 'persian', 'normalizer', 'فارسی', 'نوشتن', 'ویرایش', 'نیم‌فاصله', 'املا', 'چیدمان'],
  },
  {
    id: 'runtime-manager',
    name: 'مدیر اجراکننده‌ها',
    icon: Boxes,
    category: 'app',
    component: RuntimeManagerApp,
    w: 780,
    h: 600,
    desktop: true,
    tint: G.sun,
    keywords: ['runtime', 'pyodide', 'v86', 'webgpu', 'اجراکننده', 'موتور', 'وضعیت'],
  },
  {
    id: 'downloads',
    name: 'دانلود و به‌روزرسانی',
    icon: Download,
    category: 'app',
    component: DownloadsApp,
    w: 760,
    h: 600,
    desktop: true,
    tint: G.teal,
    keywords: ['download', 'release', 'update', 'installer', 'دانلود', 'نسخه', 'به‌روزرسانی', 'نصب', 'ویندوز'],
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
    id: 'progress',
    name: 'مرکز یادگیری',
    icon: Compass,
    category: 'app',
    component: LearningHubApp,
    w: 900,
    h: 640,
    desktop: true,
    tint: G.sun,
    keywords: ['learning', 'progress', 'xp', 'review', 'mastery', 'skill', 'یادگیری', 'پیشرفت', 'مرور', 'مهارت', 'تسلط', 'برنامه روزانه', 'داشبورد', 'مرکز یادگیری'],
  },
  {
    id: 'algorithm-academy',
    name: 'آکادمی الگوریتم',
    icon: Zap,
    category: 'app',
    component: AlgorithmAcademyApp,
    w: 900,
    h: 640,
    desktop: true,
    tint: '#ec4899',
    keywords: ['algorithm', 'sorting', 'big o', 'visualizer', 'الگوریتم', 'مرتب‌سازی', 'پیچیدگی', 'شبیه‌ساز', 'دیتا استراکچر'],
  },
  {
    id: 'project-lab',
    name: 'کارگاه پروژه',
    icon: Hammer,
    category: 'app',
    component: ProjectLabApp,
    w: 900,
    h: 640,
    desktop: true,
    tint: G.forest,
    keywords: ['project', 'build', 'portfolio', 'پروژه', 'ساخت', 'پورتفولیو', 'کارگاه'],
  },
  {
    id: 'coach',
    name: 'مربی سنجاب',
    icon: GraduationCap,
    category: 'app',
    component: CoachApp,
    w: 560,
    h: 620,
    desktop: true,
    tint: G.teal,
    keywords: ['ai', 'tutor', 'coach', 'socratic', 'مربی', 'توتور', 'سقراطی', 'راهنما', 'یادگیری با AI'],
  },
  {
    id: 'sanjabak-studio',
    name: 'استودیو سنجابک',
    icon: Squirrel,
    category: 'app',
    component: SanjabakStudioApp,
    w: 720,
    h: 560,
    desktop: true,
    tint: G.sun,
    keywords: ['mascot', 'sanjabak', 'avatar', 'customize', 'سنجابک', 'ماسکوت', 'شخصی‌سازی', 'ظاهر'],
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
