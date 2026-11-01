'use client'

import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  AlarmClock,
  AudioLines,
  Bird,
  Bomb,
  BrickWall,
  Calculator,
  Cat,
  CircleDot,
  CloudSun,
  Copy,
  FolderOpen,
  Grid3x3,
  Hammer,
  Hash,
  Images,
  Info,
  Lightbulb,
  NotebookPen,
  Palette,
  Settings,
  SpellCheck,
  SquareTerminal,
  Worm,
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
import AboutApp from '@/components/os/apps/about'

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
}

export const APPS: AppMeta[] = [
  // ---------- اپ‌ها ----------
  {
    id: 'terminal',
    name: 'ترمینال آموزشی',
    icon: SquareTerminal,
    category: 'app',
    component: TerminalApp,
    w: 720,
    h: 480,
    desktop: true,
    keywords: ['terminal', 'shell', 'command', 'learn'],
  },
  {
    id: 'file-manager',
    name: 'پرونده‌ها',
    icon: FolderOpen,
    category: 'app',
    component: FileManagerApp,
    w: 640,
    h: 440,
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
    keywords: ['paint', 'draw'],
  },
  {
    id: 'calculator',
    name: 'ماشین‌حساب',
    icon: Calculator,
    category: 'app',
    component: CalculatorApp,
    w: 340,
    h: 500,
    keywords: ['calc', 'calculator'],
  },
  {
    id: 'weather',
    name: 'آب‌وهوای خیالی',
    icon: CloudSun,
    category: 'app',
    component: WeatherApp,
    w: 520,
    h: 460,
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
    keywords: ['cat', 'meow'],
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
    keywords: ['wordle', 'word', 'لغت'],
  },
  // ---------- سیستم ----------
  {
    id: 'about',
    name: 'درباره سیستم',
    icon: Info,
    category: 'system',
    component: AboutApp,
    w: 430,
    h: 440,
    keywords: ['about', 'info'],
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
