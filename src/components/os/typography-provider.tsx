'use client'

/* ================================================================
   TypographyProvider — اعمال تنظیمات ظاهری/تایپوگرافی روی <html>
   یک‌بار در OSRoot مانت می‌شود؛ با هر تغییر تنظیمات، بدون Reload
   همه CSS Variables و کلاس‌های دسترس‌پذیری به‌روز می‌شوند.
   همچنین DevLog سراسری را نصب می‌کند.
   ================================================================ */

import { useEffect } from 'react'
import { useOS } from '@/lib/os/store'
import { applyTypography } from '@/lib/os/typography'
import { installDevLog } from '@/lib/os/devlog'

export default function TypographyProvider() {
  const settings = useOS((s) => s.settings)

  useEffect(() => {
    installDevLog()
  }, [])

  useEffect(() => {
    applyTypography(settings)
  }, [settings])

  return null
}
