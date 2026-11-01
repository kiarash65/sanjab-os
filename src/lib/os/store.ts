import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface OSWindow {
  id: string
  appId: string
  title: string
  x: number
  y: number
  w: number
  h: number
  minimized: boolean
  maximized: boolean
  z: number
}

export interface OSSettings {
  wallpaper: string
  accent: string
  funMode: boolean
  sound: boolean
}

export interface OSToast {
  id: string
  title: string
  body: string
  icon?: string
}

interface OpenAppArgs {
  appId: string
  title: string
  w?: number
  h?: number
}

interface OSStore {
  booted: boolean
  poweredOff: boolean
  bootAt: number
  windows: OSWindow[]
  focusedId: string | null
  zCounter: number
  cascade: number
  iconNonce: number
  startOpen: boolean
  settings: OSSettings
  toasts: OSToast[]
  setBooted: (v: boolean) => void
  restartOS: () => void
  shutdownOS: () => void
  openApp: (args: OpenAppArgs) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  toggleWindow: (id: string) => void
  toggleMaximize: (id: string) => void
  moveWindow: (id: string, x: number, y: number) => void
  resizeWindow: (id: string, w: number, h: number) => void
  minimizeAll: () => void
  toggleStart: (open?: boolean) => void
  shuffleIcons: () => void
  setSetting: <K extends keyof OSSettings>(key: K, value: OSSettings[K]) => void
  pushToast: (t: { title: string; body: string; icon?: string }) => void
  dismissToast: (id: string) => void
}

const uid = () => Math.random().toString(36).slice(2, 10)

export const useOS = create<OSStore>()(
  persist(
    (set, get) => ({
      booted: false,
      poweredOff: false,
      bootAt: 0,
      windows: [],
      focusedId: null,
      zCounter: 10,
      cascade: 0,
      iconNonce: 0,
      startOpen: false,
      settings: {
        wallpaper: 'grad:aurora',
        accent: '#22c55e',
        funMode: true,
        sound: true,
      },
      toasts: [],
      setBooted: (v) => set({ booted: v, bootAt: v ? Date.now() : 0 }),
      restartOS: () =>
        set({
          booted: false,
          poweredOff: false,
          windows: [],
          focusedId: null,
          startOpen: false,
          toasts: [],
        }),
      shutdownOS: () =>
        set({
          poweredOff: true,
          booted: false,
          windows: [],
          focusedId: null,
          startOpen: false,
          toasts: [],
        }),
      openApp: ({ appId, title, w = 560, h = 420 }) => {
        const st = get()
        const existing = st.windows.find((win) => win.appId === appId)
        if (existing) {
          const z = st.zCounter >= 7000 ? 10 : st.zCounter + 1
          set({
            windows: st.windows.map((win) =>
              win.id === existing.id ? { ...win, minimized: false, z } : win
            ),
            focusedId: existing.id,
            zCounter: z,
            startOpen: false,
          })
          return
        }
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
        const vh = typeof window !== 'undefined' ? window.innerHeight : 768
        const mobile = vw < 640
        const width = Math.min(w, vw - 16)
        const height = Math.min(h, vh - 48 - 16)
        const i = st.cascade
        const x = mobile
          ? 0
          : Math.max(8, Math.min(vw - width - 8, 60 + (i % 6) * 34))
        const y = mobile
          ? 0
          : Math.max(8, Math.min(vh - height - 56, 36 + (i % 6) * 30))
        const z = st.zCounter >= 7000 ? 10 : st.zCounter + 1
        const win: OSWindow = {
          id: uid(),
          appId,
          title,
          x,
          y,
          w: width,
          h: height,
          minimized: false,
          maximized: mobile,
          z,
        }
        set({
          windows: [...st.windows, win],
          focusedId: win.id,
          zCounter: z,
          cascade: i + 1,
          startOpen: false,
        })
      },
      closeWindow: (id) =>
        set((s) => {
          const windows = s.windows.filter((win) => win.id !== id)
          const top = windows
            .filter((w) => !w.minimized)
            .sort((a, b) => b.z - a.z)[0]
          return {
            windows,
            focusedId: s.focusedId === id ? (top?.id ?? null) : s.focusedId,
          }
        }),
      focusWindow: (id) =>
        set((s) => {
          const target = s.windows.find((w) => w.id === id)
          if (!target) return {}
          if (s.focusedId === id && !target.minimized) return {}
          const z = s.zCounter >= 7000 ? 10 : s.zCounter + 1
          return {
            windows: s.windows.map((w) =>
              w.id === id ? { ...w, z, minimized: false } : w
            ),
            focusedId: id,
            zCounter: z,
          }
        }),
      minimizeWindow: (id) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, minimized: true } : w
          ),
          focusedId: s.focusedId === id ? null : s.focusedId,
        })),
      toggleWindow: (id) => {
        const w = get().windows.find((win) => win.id === id)
        if (!w) return
        if (w.minimized) {
          get().focusWindow(id)
        } else if (get().focusedId === id) {
          get().minimizeWindow(id)
        } else {
          get().focusWindow(id)
        }
      },
      toggleMaximize: (id) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id
              ? { ...w, maximized: !w.maximized, minimized: false }
              : w
          ),
          focusedId: id,
        })),
      moveWindow: (id, x, y) =>
        set((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
        })),
      resizeWindow: (id, w, h) =>
        set((s) => ({
          windows: s.windows.map((win) =>
            win.id === id ? { ...win, w, h } : win
          ),
        })),
      minimizeAll: () =>
        set((s) => ({
          windows: s.windows.map((w) => ({ ...w, minimized: true })),
          focusedId: null,
        })),
      toggleStart: (open) =>
        set((s) => ({ startOpen: open ?? !s.startOpen })),
      shuffleIcons: () => set((s) => ({ iconNonce: s.iconNonce + 1 })),
      setSetting: (key, value) =>
        set((s) => ({ settings: { ...s.settings, [key]: value } })),
      pushToast: (t) =>
        set((s) => ({
          toasts: [...s.toasts.slice(-4), { id: uid(), ...t }],
        })),
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'pengo-os-v1',
      partialize: (s) => ({ settings: s.settings }),
    }
  )
)
