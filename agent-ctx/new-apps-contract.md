# قرارداد ساخت اپ جدید برای سان‌جاب‌او‌اس (SunJob OS)

هر زیرعامل باید دقیقاً این قرارداد را رعایت کند. **هیچ فایل موجود را ویرایش نکنید** — فقط فایل‌های جدیدی که به شما داده شده را بسازید. رجیستری اپ‌ها را خودِ اصلی بعداً ویرایش می‌کند.

## قالب فایل

- مسیر: `src/components/os/apps/<name>.tsx`
- `'use client'` در خط اول
- `export default function AppName()` — **بدون هیچ prop** (پنجره OS مستقیم `<Comp />` رندر می‌کند)
- ارتفاع کامل پنجره: ریشه با `flex h-full flex-col` و محتوای اسکرول‌شونده با کلاس `os-scroll overflow-y-auto`

## ایمپورت‌های مجاز

```tsx
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { /* آیکن‌ها */ } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { SUNJOB_PALETTE, BRAND } from '@/lib/os/brand'
import { useOS } from '@/lib/os/store'   // فقط برای pushToast
```

- کامپوننت‌های shadcn دیگر فقط اگر واقعاً لازم است (Select, Dialog, Checkbox مجاز است).
- **ممنوع**: ایمپورت از `@/lib/os/apps`، `@/lib/os/fs`، یا هر فایل دیگری از پروژه؛ نصب پکیج جدید؛ کتابخانه خارجی جدید.
- پوشه `src/components/ui` همه کامپوننت‌های shadcn را دارد — قبل از ساختن دکمه/اینپوت دستی، از همان‌ها استفاده کن.

## سبک بصری (خیلی مهم)

- دارک گلس هماهنگ با OS: پس‌زمینه‌ها `bg-zinc-900/60`، حاشیه `border border-white/10`، گِرد `rounded-xl/2xl`
- رنگ‌های برند از `SUNJOB_PALETTE` (orange #f7931e، violet #8b5cf6، teal #0ea5a0، rose #e11d48، navy #1a2744، cream #fffbf5) — **آبی/ایندیگو پیش‌فرض ممنوع**
- کلاس‌های کمکی موجود در globals.css: `os-scroll` (اسکرول‌بار قشنگ)، `pengo-pop` (پاپ انیمیشن)، `pengo-fadein`، `pengo-float`، `pengo-breathe`
- UI کاملاً فارسی و RTL. اعداد/کد لاتین داخل `dir="ltr"` بنویس.
- تم ظریف بامزگی: یک جمله شوخی کوچک در جای مناسب؛ ولی اپ باید واقعاً کاربردی باشد.
- جای مناسب یک امضای کوچک اسپانسری: `<span className="text-[10px] text-zinc-500">با اسپانسری سان‌جاب</span>`

## ذخیره‌سازی

- از `localStorage` با کلید یکتا (مثلاً `sunjob-calendar-v1`) استفاده کن؛ JSON.stringify/parse با try/catch.
- هنگام mount اولیه، با `useEffect` از localStorage بخوان تا مشکل SSR پیش نیاید (مقدار اولیه state را خالی/پیش‌فرض بگذار).

## مثال اسکلت

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SUNJOB_PALETTE } from '@/lib/os/brand'

interface Item { id: string; text: string; done: boolean }

const KEY = 'sunjob-demo-v1'

export default function DemoApp() {
  const [items, setItems] = useState<Item[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) ?? '[]')) } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(items))
  }, [items, loaded])

  return (
    <div className="flex h-full flex-col bg-zinc-950/60">
      <header className="border-b border-white/10 p-3">
        <h2 className="text-sm font-black text-zinc-100">عنوان اپ</h2>
      </header>
      <div className="os-scroll flex-1 overflow-y-auto p-3">…</div>
    </div>
  )
}
```
