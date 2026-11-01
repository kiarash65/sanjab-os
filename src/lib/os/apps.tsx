'use client'

import type { ComponentType } from 'react'
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

export type AppCategory = 'app' | 'game' | 'system'

export interface AppMeta {
  id: string
  name: string
  emoji: string
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
    name: 'ترمینال',
    emoji: '🖥️',
    category: 'app',
    component: TerminalApp,
    w: 640,
    h: 430,
    desktop: true,
    keywords: ['terminal', 'shell', 'command'],
  },
  {
    id: 'file-manager',
    name: 'پرونده‌ها',
    emoji: '🗂️',
    category: 'app',
    component: FileManagerApp,
    w: 640,
    h: 440,
    keywords: ['files', 'folder'],
  },
  {
    id: 'notes',
    name: 'دفترچه یادداشت',
    emoji: '📝',
    category: 'app',
    component: NotesApp,
    w: 560,
    h: 420,
    keywords: ['notes', 'note'],
  },
  {
    id: 'clock',
    name: 'ساعت و تایمر',
    emoji: '⏰',
    category: 'app',
    component: ClockApp,
    w: 460,
    h: 460,
    keywords: ['clock', 'timer', 'stopwatch'],
  },
  {
    id: 'paint',
    name: 'نقاشی',
    emoji: '🎨',
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
    emoji: '🧮',
    category: 'app',
    component: CalculatorApp,
    w: 340,
    h: 500,
    keywords: ['calc', 'calculator'],
  },
  {
    id: 'weather',
    name: 'آب‌وهوای خیالی',
    emoji: '⛅',
    category: 'app',
    component: WeatherApp,
    w: 520,
    h: 460,
    keywords: ['weather'],
  },
  {
    id: 'system-monitor',
    name: 'مانیتور سیستم',
    emoji: '📊',
    category: 'app',
    component: SystemMonitorApp,
    w: 640,
    h: 450,
    keywords: ['monitor', 'htop', 'cpu'],
  },
  {
    id: 'music',
    name: 'پخش‌کننده چیپ‌تیون',
    emoji: '🎵',
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
    emoji: '⚙️',
    category: 'app',
    component: SettingsApp,
    w: 560,
    h: 470,
    keywords: ['settings', 'config'],
  },
  {
    id: 'ideas',
    name: 'مولد ایده عجیب',
    emoji: '💡',
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
    emoji: '🐱',
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
    emoji: '🐍',
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
    emoji: '🔢',
    category: 'game',
    component: Game2048,
    w: 460,
    h: 600,
    keywords: ['2048'],
  },
  {
    id: 'tictactoe',
    name: 'دوز',
    emoji: '⭕',
    category: 'game',
    component: TicTacToeGame,
    w: 460,
    h: 560,
    keywords: ['tic tac toe', 'ttt'],
  },
  {
    id: 'memory',
    name: 'حافظه خفن',
    emoji: '🃏',
    category: 'game',
    component: MemoryGame,
    w: 480,
    h: 600,
    keywords: ['memory', 'cards'],
  },
  {
    id: 'minesweeper',
    name: 'مین‌یاب',
    emoji: '💣',
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
    emoji: '🏓',
    category: 'game',
    component: PongGame,
    w: 580,
    h: 480,
    keywords: ['pong'],
  },
  {
    id: 'flappy',
    name: 'پنگوئن پرنده',
    emoji: '🐤',
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
    emoji: '🔨',
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
    emoji: '🧱',
    category: 'game',
    component: BreakoutGame,
    w: 580,
    h: 520,
    keywords: ['breakout', 'arkanoid'],
  },
  // ---------- سیستم ----------
  {
    id: 'about',
    name: 'درباره سیستم',
    emoji: 'ℹ️',
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
