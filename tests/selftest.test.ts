/* ================================================================
   آزمون‌های واحد منطق حساس — با دوندهٔ داخلی bun (بدون وابستگی جدید)
   اجرا: bun run test
   پوشش: مقایسهٔ نسخه، دسته‌بندی دارایی انتشار، اعتبارسنجی آدرس،
   مدیریت بوکمارک (رفع باگ حذف بوکمارک اشتباه)
   ================================================================ */

import { describe, expect, test } from 'bun:test'

import {
  classifyAddress,
  classifyAsset,
  compareSemVer,
  hostOf,
  parseSemVer,
  removeBookmark,
  tagVersion,
  toggleBookmarkFor,
  updateState,
  type Bookmark,
} from '../src/lib/os/releases'

import { Sha256, parseSums, sha256Hex } from '../src/lib/os/sha256'
import { faNormalize } from '../src/lib/os/fa'

/* --------------------------- نرمال‌سازی فارسی --------------------------- */

describe('faNormalize — جستجوی بی‌حساس به اعراب', () => {
  test('سفربُر با اعراب ≈ سفربر بدون اعراب', () => {
    expect(faNormalize('سفربُر (مرورگر)')).toContain(faNormalize('سفربر'))
    expect(faNormalize('سفربُر')).toBe('سفربر (مرورگر)'.replace(' (مرورگر)', ''))
  })
  test('ی/ک عربی و آ', () => {
    expect(faNormalize('کد')).toBe(faNormalize('كد'))
    expect(faNormalize('آکادمی')).toBe(faNormalize('اكادمی'))
  })
  test('لاتین کوچک می‌شود', () => {
    expect(faNormalize('GitHub')).toBe('github')
  })
})

/* --------------------------- SHA-256 --------------------------- */

describe('Sha256 — بردارهای آزمون استاندارد FIPS 180-4', () => {
  test('رشتهٔ خالی', () => {
    expect(sha256Hex(new TextEncoder().encode(''))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    )
  })
  test('abc', () => {
    expect(sha256Hex(new TextEncoder().encode('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
  })
  test('پیام ۴۴۸ بیتی مرزی (بدون کش شدن)', () => {
    // «abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq» — نمونهٔ استاندارد
    const msg = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'
    expect(sha256Hex(new TextEncoder().encode(msg))).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'
    )
  })
  test('a میلیون بار — با updateهای چندتکه (تطبیق با یک‌باره)', () => {
    const chunk = new TextEncoder().encode('a'.repeat(1000))
    const inc = new Sha256()
    for (let i = 0; i < 1000; i++) inc.update(chunk)
    const incHex = inc.hex() // hex فقط یک‌بار!
    const oneShot = sha256Hex(new TextEncoder().encode('a'.repeat(1_000_000)))
    expect(incHex).toBe(oneShot)
    // مقدار مرجع NIST برای «a»×۱٬۰۰۰٬۰۰۰
    expect(incHex).toBe('cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0')
  })
  test('مرز بلوک ۵۵/۵۶/۶۳/۶۴/۶۵ بایت', () => {
    for (const n of [55, 56, 63, 64, 65, 127, 128, 129]) {
      const data = new TextEncoder().encode('x'.repeat(n))
      // مقایسه با هش مرجع node:crypto
      const ref = new Bun.CryptoHasher('sha256').update(data).digest('hex')
      expect(sha256Hex(data)).toBe(ref)
      // و با ورود تکه‌تکهٔ ۷ بایتی
      const inc = new Sha256()
      for (let i = 0; i < data.length; i += 7) inc.update(data.subarray(i, i + 7))
      expect(inc.hex()).toBe(ref)
    }
  })
})

describe('parseSums — قالب sha256sum گنو', () => {
  test('خط معمولی و پرچم باینری و حروف بزرگ هش', () => {
    const sums = parseSums(
      'ABCDEF0123ABCDEF0123ABCDEF0123ABCDEF0123ABCDEF0123ABCDEF0123ABCD  SanjabOS_4.1.0_x64-setup.exe\n' +
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef *sanjab-cli-4.1.0.tar.gz\n'
    )
    expect(sums.get('sanjabos_4.1.0_x64-setup.exe')).toBe('abcdef0123abcdef0123abcdef0123abcdef0123abcdef0123abcdef0123abcd')
    expect(sums.get('sanjab-cli-4.1.0.tar.gz')).toBe('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')
  })
  test('خط خراب نادیده گرفته می‌شود', () => {
    expect(parseSums('this is garbage\n').size).toBe(0)
  })
})

/* --------------------------- مقایسهٔ نسخه --------------------------- */

describe('parseSemVer', () => {
  test('نسخهٔ ساده و با پیشوند v', () => {
    expect(parseSemVer('4.1.0')).toEqual({ major: 4, minor: 1, patch: 0, pre: [] })
    expect(parseSemVer('v4.1.0')?.major).toBe(4)
  })
  test('پیش‌انتشار', () => {
    expect(parseSemVer('4.2.0-beta.1')?.pre).toEqual(['beta', '1'])
  })
  test('ورودی نامعتبر → null', () => {
    expect(parseSemVer('نسخهٔ چهار')).toBeNull()
    expect(parseSemVer('4.1')).toBeNull()
    expect(parseSemVer('')).toBeNull()
  })
})

describe('compareSemVer — قواعد SemVer', () => {
  test('۴.۰.۹ < ۴.۰.۱۰ (مقایسهٔ عددی نه رشته‌ای)', () => {
    expect(compareSemVer('4.0.9', '4.0.10')).toBeLessThan(0)
    expect(compareSemVer('4.0.10', '4.0.9')).toBeGreaterThan(0)
  })
  test('برابری با و بدون v', () => {
    expect(compareSemVer('v4.1.0', '4.1.0')).toBe(0)
  })
  test('پیش‌انتشار از نسخهٔ نهایی کوچک‌تر است', () => {
    expect(compareSemVer('4.2.0-beta.1', '4.2.0')).toBeLessThan(0)
    expect(compareSemVer('4.2.0-beta.1', '4.2.0-beta.2')).toBeLessThan(0)
    expect(compareSemVer('4.2.0-rc.1', '4.2.0-beta.2')).toBeGreaterThan(0)
  })
  test('ماینور و میجر', () => {
    expect(compareSemVer('4.1.0', '4.0.99')).toBeGreaterThan(0)
    expect(compareSemVer('5.0.0', '4.99.99')).toBeGreaterThan(0)
  })
})

describe('updateState — فقط Stable ملاک پیشنهاد است', () => {
  test('به‌روز', () => {
    expect(updateState('4.1.0', '4.1.0', '4.1.0')).toBe('up-to-date')
  })
  test('به‌روزرسانی در دسترس', () => {
    expect(updateState('4.0.0', '4.1.0', '4.2.0-beta.1')).toBe('update-available')
  })
  test('نصب‌شده جلوتر از Stable (شاخهٔ آزمایشی)', () => {
    expect(updateState('4.2.0', '4.1.0', '4.2.0')).toBe('newer-than-stable')
  })
  test('فقط پیش‌انتشار موجود است', () => {
    expect(updateState('4.1.0', null, '4.2.0-beta.1')).toBe('prerelease-available')
  })
  test('ورودی خراب', () => {
    expect(updateState('نامعتبر', '4.1.0', '4.1.0')).toBe('unknown')
  })
})

test('tagVersion پیشوند v را می‌برد', () => {
  expect(tagVersion('v4.1.0')).toBe('4.1.0')
  expect(tagVersion('V4.1.0')).toBe('4.1.0')
})

/* ----------------------- دسته‌بندی دارایی انتشار ----------------------- */

describe('classifyAsset — باگ تاریخی: همهٔ tar.gz لینوکس نیستند', () => {
  test('sanjab-cli-*.tar.gz = ابزار CLI (نه بستهٔ لینوکس!)', () => {
    const a = classifyAsset('sanjab-cli-4.1.0.tar.gz')
    expect(a.kind).toBe('cli')
    expect(a.platform).toBe('cli')
  })
  test('sanjabos-web-*-standalone.tar.gz = وب', () => {
    const a = classifyAsset('sanjabos-web-4.1.0-standalone.tar.gz')
    expect(a.kind).toBe('web-standalone')
    expect(a.platform).toBe('web')
  })
  test('نصاب NSIS و MSI ویندوز', () => {
    expect(classifyAsset('SanjabOS_4.1.0_x64-setup.exe').kind).toBe('windows-nsis')
    expect(classifyAsset('SanjabOS_4.1.0_x64_en-US.msi').kind).toBe('windows-msi')
  })
  test('SBOM و چک‌سام و VERSION', () => {
    expect(classifyAsset('SBOM.spdx.json').kind).toBe('sbom')
    expect(classifyAsset('SHA256SUMS.txt').kind).toBe('checksums')
    expect(classifyAsset('VERSION').kind).toBe('version-file')
    expect(classifyAsset('THIRD-PARTY-NOTICES.md').kind).toBe('notices')
  })
  test('فایل ناشناخته گوشه‌نشان نمی‌شود — برچسب صادقانه', () => {
    expect(classifyAsset('mystery-file.bin').kind).toBe('unknown')
  })
})

/* --------------------------- اعتبارسنجی آدرس --------------------------- */

describe('classifyAddress — نوار آدرس مرورگر', () => {
  test('URL کامل', () => {
    expect(classifyAddress('https://example.com/x').kind).toBe('url')
  })
  test('دامنهٔ بدون پروتکل', () => {
    const r = classifyAddress('example.com')
    expect(r.kind).toBe('url')
    expect(r.url).toBe('https://example.com/')
  })
  test('جستجوی فارسی و انگلیسی', () => {
    expect(classifyAddress('توروالدز لینوکس').kind).toBe('search')
    expect(classifyAddress('torvalds linux').kind).toBe('search')
  })
  test('ورودی خالی', () => {
    expect(classifyAddress('   ').kind).toBe('search')
  })
})

test('hostOf www را می‌برد و ورودی خراب را می‌پذیرد', () => {
  expect(hostOf('https://www.example.com/a')).toBe('example.com')
  expect(hostOf('چیز-معتبر-نیست')).toBe('چیز-معتبر-نیست')
})

/* ------------------------ مدیریت بوکمارک ------------------------ */

const BM: Bookmark[] = [
  { label: 'ویکی', url: 'https://fa.m.wikipedia.org/' },
  { label: 'نقشه', url: 'https://www.openstreetmap.org/' },
]

describe('بوکمارک — رفع باگ حذف اشتباه', () => {
  test('حذف فقط همان URL را برمی‌دارد', () => {
    const next = removeBookmark(BM, 'https://www.openstreetmap.org/')
    expect(next).toHaveLength(1)
    expect(next[0].url).toBe('https://fa.m.wikipedia.org/')
  })
  test('حذف URL ناموجود → بدون تغییر', () => {
    expect(removeBookmark(BM, 'https://x.ir/')).toHaveLength(2)
  })
  test('تاگل: افزودن و سپس حذف همان آدرس', () => {
    const added = toggleBookmarkFor(BM, 'https://example.com/', 'مثال')
    expect(added.added).toBe(true)
    expect(added.list.some((b) => b.url === 'https://example.com/')).toBe(true)
    const removed = toggleBookmarkFor(added.list, 'https://example.com/', 'مثال')
    expect(removed.added).toBe(false)
    expect(removed.list.some((b) => b.url === 'https://example.com/')).toBe(false)
  })
  test('برچسب خالی از نام میزبان ساخته می‌شود', () => {
    const r = toggleBookmarkFor([], 'https://www.example.com/', '')
    expect(r.list[0].label).toBe('example.com')
  })
})
