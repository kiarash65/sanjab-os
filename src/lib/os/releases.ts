/* ================================================================
   منطق خالص «مرکز انتشار» — دسته‌بندی دارایی‌ها و مقایسهٔ نسخه
   خالص و بدون وابستگی به React/DOM تا با bun:test قابل آزمودن باشد.
   ================================================================ */

/** نوع واقعی هر دارایی انتشار — تشخیص از روی «نام کامل»، نه صرفاً پسوند */
export type AssetKind =
  | 'windows-nsis' // نصاب گرافیکی ویندوز (SanjabOS_*_x64-setup.exe)
  | 'windows-msi' // نصاب MSI ویندوز
  | 'windows-portable' // نسخهٔ پرتابل zip (اگر منتشر شود)
  | 'web-standalone' // بستهٔ tar.gz نسخهٔ وب (server.js + public)
  | 'cli' // بستهٔ ابزار خط فرمان sanjab-cli
  | 'sbom' // فهرست مواد نرم‌افزاری SPDX
  | 'checksums' // SHA256SUMS
  | 'notices' // THIRD-PARTY-NOTICES
  | 'version-file' // فایل VERSION
  | 'unknown'

export interface AssetInfo {
  kind: AssetKind
  /** برچسب فارسی کوتاه برای رابط کاربری */
  label: string
  /** پلتفرم مقصد یا «همه‌جانبه» */
  platform: 'windows' | 'linux' | 'web' | 'cli' | 'meta'
  /** توضیح یک‌خطی کاربرد فایل */
  purpose: string
}

/**
 * دسته‌بندی دارایی از روی نام کامل — قانون طلایی:
 * پسوند به‌تنهایی کافی نیست؛ sanjab-cli-*.tar.gz «CLI» است نه بستهٔ لینوکس.
 * ترتیب قواعد مهم است: نام‌های خاص (sanjab-cli، sanjabos-web، SBOM، …)
 * قبل از قواعد عمومی پسوندی بررسی می‌شوند.
 */
export function classifyAsset(name: string): AssetInfo {
  const n = name.toLowerCase()

  // --- متادیتا ---
  if (/^sha256sums(\.txt)?$/.test(n) || /sha256|checksum/.test(n))
    return {
      kind: 'checksums',
      label: 'چک‌سام',
      platform: 'meta',
      purpose: 'امضای SHA-256 همهٔ فایل‌ها برای تأیید سلامت پس از دانلود',
    }
  if (/sbom.*\.spdx\.json$|\.spdx\.json$/.test(n))
    return {
      kind: 'sbom',
      label: 'SBOM',
      platform: 'meta',
      purpose: 'فهرست مواد نرم‌افزاری (SPDX) — همهٔ وابستگی‌های این نسخه',
    }
  if (/third-party-notices/.test(n))
    return {
      kind: 'notices',
      label: 'مجوزها',
      platform: 'meta',
      purpose: 'اعلان مجوز نرم‌افزارهای شخص ثالث',
    }
  if (/^version$/.test(n))
    return {
      kind: 'version-file',
      label: 'VERSION',
      platform: 'meta',
      purpose: 'شمارهٔ نسخهٔ این انتشار به‌صورت متن ساده',
    }

  // --- ویندوز ---
  if (/\.msi$/.test(n))
    return {
      kind: 'windows-msi',
      label: 'ویندوز (MSI)',
      platform: 'windows',
      purpose: 'نصاب MSI — مناسب استقرار سازمانی و سیاست گروهی',
    }
  if (/_setup\.exe$|install|setup/.test(n) || /\.exe$/.test(n))
    return {
      kind: 'windows-nsis',
      label: 'ویندوز (exe)',
      platform: 'windows',
      purpose: 'نصاب گرافیکی پیشنهادی ویندوز — شامل Node و سرور داخلی',
    }
  if (/portable.*\.zip$|\.zip$/.test(n))
    return {
      kind: 'windows-portable',
      label: 'پرتابل (zip)',
      platform: 'windows',
      purpose: 'نسخهٔ بدون نصب — استخراج کن و اجرا کن',
    }

  // --- tar.gz های نام‌دار (قبل از قاعدهٔ عمومی!) ---
  if (/^sanjab-cli[-_.]|sanjab-cli/.test(n))
    return {
      kind: 'cli',
      label: 'ابزار CLI',
      platform: 'cli',
      purpose: 'ابزار خط‌فرمان سان‌جاب برای یادگیری در ترمینال واقعی — روی ویندوز/لینوکس/مک با Python',
    }
  if (/^sanjabos-web[-_.]|standalone/.test(n))
    return {
      kind: 'web-standalone',
      label: 'وب standalone',
      platform: 'web',
      purpose: 'سرور Next.js آمادهٔ اجرا (node server.js) — برای اجرای خودمیزبان روی هر سیستم با Node',
    }

  // --- قاعدهٔ عمومی tar.gz بدون نام شناخته‌شده: وب standalone تلقی نمی‌شود ---
  if (/\.tar\.gz$|\.tgz$/.test(n))
    return {
      kind: 'web-standalone',
      label: 'آرشیو tar.gz',
      platform: 'web',
      purpose: 'آرشیو سرور وب — بعد از دانلود، محتوا را بررسی کن',
    }

  return { kind: 'unknown', label: 'فایل', platform: 'meta', purpose: 'نوع فایل به‌طور خودکار تشخیص داده نشد' }
}

/* --------------------------- مقایسهٔ نسخه --------------------------- */

/** تجزیهٔ نسخهٔ معنایی با پیشوند اختیاری v و نام کدونت: «v4.1.0» و «4.1.0-beta.1» */
export function parseSemVer(
  s: string
): { major: number; minor: number; patch: number; pre: string[] } | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(s.trim())
  if (!m) return null
  return {
    major: parseInt(m[1], 10),
    minor: parseInt(m[2], 10),
    patch: parseInt(m[3], 10),
    pre: m[4] ? m[4].split('.') : [],
  }
}

/**
 * مقایسهٔ کامل SemVer شامل پیش‌انتشار (قاعدهٔ استاندارد ۲.۱۱ SemVer):
 * 4.0.9 < 4.0.10 ✓ و 4.1.0-beta.1 < 4.1.0 ✓
 */
export function compareSemVer(a: string, b: string): number {
  const va = parseSemVer(a)
  const vb = parseSemVer(b)
  if (!va && !vb) return 0
  if (!va) return -1
  if (!vb) return 1
  if (va.major !== vb.major) return va.major - vb.major
  if (va.minor !== vb.minor) return va.minor - vb.minor
  if (va.patch !== vb.patch) return va.patch - vb.patch
  // نسخهٔ بدون pre از نسخهٔ pre دار «بزرگ‌تر» است
  if (va.pre.length === 0 && vb.pre.length === 0) return 0
  if (va.pre.length === 0) return 1
  if (vb.pre.length === 0) return -1
  const len = Math.max(va.pre.length, vb.pre.length)
  for (let i = 0; i < len; i++) {
    const x = va.pre[i]
    const y = vb.pre[i]
    if (x === undefined) return -1 // نظیر shorter-set اول است
    if (y === undefined) return 1
    const xn = /^\d+$/.test(x)
    const yn = /^\d+$/.test(y)
    if (xn && yn) {
      const d = parseInt(x, 10) - parseInt(y, 10)
      if (d !== 0) return d
    } else if (xn !== yn) {
      return xn ? -1 : 1 // شناسهٔ عددی همیشه از رشته‌ای کوچک‌تر است
    } else if (x !== y) {
      return x < y ? -1 : 1
    }
  }
  return 0
}

export type UpdateState = 'up-to-date' | 'update-available' | 'prerelease-available' | 'newer-than-stable' | 'unknown'

/**
 * وضعیت به‌روزرسانی کاربر — نسخهٔ نصب‌شده فقط با آخرین «Stable» مقایسه می‌شود؛
 * پیش‌انتشارها هرگز به‌عنوان «نسخهٔ پیشنهادی» کاربر عادی معرفی نمی‌شوند.
 */
export function updateState(installed: string, latestStable: string | null, latestAny: string | null): UpdateState {
  const ci = parseSemVer(installed)
  if (!ci) return 'unknown'
  if (latestStable) {
    const c = compareSemVer(installed, latestStable)
    if (c === 0) return 'up-to-date'
    if (c < 0) return 'update-available'
    // نصب‌شده از آخرین Stable جلوتر است (مثلاً روی نسخهٔ آزمایشی است)
    return 'newer-than-stable'
  }
  // هیچ Stable ای نیست؛ فقط پیش‌انتشار داریم
  if (latestAny && parseSemVer(latestAny)) {
    const c = compareSemVer(installed, latestAny)
    if (c < 0) return 'prerelease-available'
    if (c === 0) return 'up-to-date'
    return 'newer-than-stable'
  }
  return 'unknown'
}

/** نرمال‌سازی نام تگ: «v4.1.0» → «4.1.0» */
export function tagVersion(tag: string): string {
  return tag.trim().replace(/^v/i, '')
}

/* ------------------------ اعتبارسنجی آدرس ------------------------ */

export type AddressKind = 'url' | 'search'

/** تشخیص URL در برابر عبارت جستجو — خالص و مشترک بین مرورگر و آزمون‌ها */
export function classifyAddress(raw: string): { kind: AddressKind; url?: string; query?: string } {
  const t = raw.trim()
  if (!t) return { kind: 'search', query: '' }
  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t)
      if (u.hostname.includes('.') || u.hostname === 'localhost') return { kind: 'url', url: u.toString() }
    } catch {
      /* افتادن به جستجو */
    }
    return { kind: 'search', query: t }
  }
  // «example.com» یا «fa.wikipedia.org/wiki» — نقطه در دامنه و بدون فاصله
  if (!/\s/.test(t) && /^[a-zA-Z0-9\u0600-\u06FF-]+(\.[a-zA-Z0-9-]+)+(:\d+)?(\/.*)?$/.test(t)) {
    try {
      return { kind: 'url', url: new URL(`https://${t}`).toString() }
    } catch {
      /* ignore */
    }
  }
  return { kind: 'search', query: t }
}

/** نام میزبان تمیز برای نمایش */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/* ---------------------- مدیریت بوکمارک (خالص) ---------------------- */

export interface Bookmark {
  label: string
  url: string
  addedAt?: number
}

/**
 * حذف بوکمارک «بر اساس URL خودِ بوکمارک» — رفع باگ شناخته‌شده:
 * دکمهٔ حذف قبلاً toggleBookmark تپ فعال را صدا می‌زد و بوکمارک اشتباهی عوض می‌شد.
 */
export function removeBookmark(bookmarks: Bookmark[], url: string): Bookmark[] {
  return bookmarks.filter((b) => b.url !== url)
}

/** افزودن یا حذف بوکمارک برای URL مشخص (تاگل واقعی) — سقف اختیاری */
export function toggleBookmarkFor(bookmarks: Bookmark[], url: string, label: string, cap = 200): { list: Bookmark[]; added: boolean } {
  const exists = bookmarks.some((b) => b.url === url)
  if (exists) return { list: removeBookmark(bookmarks, url), added: false }
  const next = [...bookmarks, { label: label || hostOf(url), url, addedAt: Date.now() }]
  return { list: next.slice(-cap), added: true }
}
