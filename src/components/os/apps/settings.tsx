'use client'

import { Trash2, RotateCcw } from 'lucide-react'
import { useOS } from '@/lib/os/store'
import { WALLPAPERS, ACCENTS } from '@/lib/os/wallpapers'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

export default function SettingsApp() {
  const settings = useOS((s) => s.settings)
  const setSetting = useOS((s) => s.setSetting)
  const pushToast = useOS((s) => s.pushToast)

  const handleClearRecords = () => {
    try {
      const doomed: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('pengo-best-') || key === 'pengo-best-memory')) {
          doomed.push(key)
        }
      }
      doomed.forEach((key) => localStorage.removeItem(key))
      pushToast({ icon: '🧹', title: 'رکوردها پاک شدند', body: 'تاریخ از نو نوشته می‌شود!' })
    } catch {
      pushToast({ icon: '😬', title: 'پاک نشد', body: 'مرورگرت جلوی جاروی ما را گرفت' })
    }
  }

  const handleResetSettings = () => {
    setSetting('wallpaper', 'grad:aurora')
    setSetting('accent', '#22c55e')
    setSetting('funMode', true)
    setSetting('sound', true)
    setSetting('wallpaperRotate', false)
    pushToast({ icon: '♻️', title: 'تنظیمات برگشت', body: 'همه‌چیز مثل روز اول شد، حتی سس' })
  }

  return (
    <div className="h-full w-full">
      <div className="os-scroll h-full space-y-5 overflow-y-auto p-4">
        <section>
          <h3 className="mb-2 text-xs font-bold text-zinc-500">کاغذدیواری</h3>
          <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-100">چرخش خودکار</p>
              <p className="text-[11px] leading-5 text-zinc-500">
                هر ۳۰ ثانیه کاغذدیواری عوض می‌شود
              </p>
            </div>
            <Switch
              checked={settings.wallpaperRotate}
              onCheckedChange={(v) => setSetting('wallpaperRotate', v)}
              aria-label="چرخش خودکار کاغذدیواری"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {WALLPAPERS.map((w) => {
              const active = settings.wallpaper === w.key
              return (
                <div key={w.key}>
                  <button
                    type="button"
                    aria-label={w.name}
                    title={w.name}
                    onClick={() => {
                      setSetting('wallpaper', w.key)
                      pushToast({
                        icon: '🖼️',
                        title: 'کاغذدیواری عوض شد',
                        body: `حالا روی «${w.name}» هستی`,
                      })
                    }}
                    className={`h-16 w-full rounded-lg border border-white/10 transition-all hover:brightness-110 ${
                      active ? 'ring-2 ring-[var(--pengo-accent)]' : ''
                    }`}
                    style={{
                      background: w.css,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <p className="mt-1 truncate text-center text-[10px] text-zinc-400">{w.name}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold text-zinc-500">رنگ اصلی</h3>
          <div className="flex flex-wrap items-center gap-3">
            {ACCENTS.map((a) => {
              const active = settings.accent === a.value
              return (
                <button
                  key={a.key}
                  type="button"
                  title={a.name}
                  aria-label={a.name}
                  onClick={() => setSetting('accent', a.value)}
                  className={`h-9 w-9 rounded-full border border-white/20 transition-transform hover:scale-110 ${
                    active ? 'scale-110 ring-2 ring-white' : ''
                  }`}
                  style={{ background: a.value }}
                />
              )
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold text-zinc-500">رفتار سیستم</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-100">حالت سرگرم‌کننده</p>
                <p className="text-[11px] leading-5 text-zinc-500">
                  اعلان‌های بامزه تصادفی از سرویس‌های سیستم
                </p>
              </div>
              <Switch
                checked={settings.funMode}
                onCheckedChange={(v) => setSetting('funMode', v)}
                aria-label="حالت سرگرم‌کننده"
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-100">صدا</p>
                <p className="text-[11px] leading-5 text-zinc-500">برای بازی‌ها و اپ‌های صوتی</p>
              </div>
              <Switch
                checked={settings.sound}
                onCheckedChange={(v) => setSetting('sound', v)}
                aria-label="صدا"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
          <h3 className="mb-2 text-xs font-bold text-zinc-500">منطقه خطر</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearRecords}
              className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="size-4" />
              پاک کردن همه رکوردها
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSettings}
              className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
            >
              <RotateCcw className="size-4" />
              بازنشانی تنظیمات
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-zinc-600">
            دست بزن، رکوردهای بازی‌ها با آغوش باز می‌روند. برگشتی در کار نیست 🙃
          </p>
        </section>
      </div>
    </div>
  )
}
