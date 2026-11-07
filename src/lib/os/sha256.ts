/* ================================================================
   SHA-256 جریانی و تجزیهٔ فایل SHA256SUMS — خالص و بدون وابستگی
   برای تأیید سلامت فایل‌های دانلودشده در «مرکز انتشار».
   پیاده‌سازی استاندارد FIPS 180-4 با ورودِ تکه‌تکه (حافظه‌بهینه).
   ================================================================ */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

/** SHA-256 افزایشی: update() هرچندبار، سپس hex() یک‌بار */
export class Sha256 {
  private h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ])
  private buf = new Uint8Array(64)
  private bufLen = 0
  private len = 0

  /** افزودن تکهٔ جدید — هر اندازه‌ای */
  update(chunk: Uint8Array): this {
    this.len += chunk.length
    let i = 0
    if (this.bufLen > 0) {
      const take = Math.min(64 - this.bufLen, chunk.length)
      this.buf.set(chunk.subarray(0, take), this.bufLen)
      this.bufLen += take
      i = take
      if (this.bufLen === 64) {
        this.compress(this.buf)
        this.bufLen = 0
      }
    }
    while (i + 64 <= chunk.length) {
      this.compress(chunk.subarray(i, i + 64))
      i += 64
    }
    if (i < chunk.length) {
      this.buf.set(chunk.subarray(i), 0)
      this.bufLen = chunk.length - i
    }
    return this
  }

  /** خروجی نهایی به‌صورت ۶۴ کاراکتر hex */
  hex(): string {
    // طول کل پیام بر حسب بیت (۶۴ بیتی بزرگ‌اندین در انتهای بلوک آخر)
    const totalBits = this.len * 8
    const bitLenLo = totalBits % 0x100000000
    const bitLenHi = Math.floor(totalBits / 0x100000000)
    // فقط دُمِ هنوز جذب‌نشده (bufLen) در data است؛ پدینگ بر اساس همان:
    // bufLen + 0x80 + ۸ بایت طول باید مضرب ۶۴ شود (یک یا دو بلوک)
    const paddedLen = this.bufLen < 56 ? 64 : 128
    const data = new Uint8Array(paddedLen)
    data.set(this.buf.subarray(0, this.bufLen), 0)
    data[this.bufLen] = 0x80
    data[paddedLen - 8] = (bitLenHi >>> 24) & 0xff
    data[paddedLen - 7] = (bitLenHi >>> 16) & 0xff
    data[paddedLen - 6] = (bitLenHi >>> 8) & 0xff
    data[paddedLen - 5] = bitLenHi & 0xff
    data[paddedLen - 4] = (bitLenLo >>> 24) & 0xff
    data[paddedLen - 3] = (bitLenLo >>> 16) & 0xff
    data[paddedLen - 2] = (bitLenLo >>> 8) & 0xff
    data[paddedLen - 1] = bitLenLo & 0xff
    for (let off = 0; off < paddedLen; off += 64) this.compress(data.subarray(off, off + 64))
    return Array.from(this.h)
      .map((x) => x.toString(16).padStart(8, '0'))
      .join('')
  }

  private compress(p: Uint8Array): void {
    const w = new Uint32Array(64)
    for (let i = 0; i < 16; i++)
      w[i] = (p[i * 4] << 24) | (p[i * 4 + 1] << 16) | (p[i * 4 + 2] << 8) | p[i * 4 + 3]
    for (let i = 16; i < 64; i++) {
      const s0 = ((w[i - 15] >>> 7) | (w[i - 15] << 25)) ^ ((w[i - 15] >>> 18) | (w[i - 15] << 14)) ^ (w[i - 15] >>> 3)
      const s1 = ((w[i - 2] >>> 17) | (w[i - 2] << 15)) ^ ((w[i - 2] >>> 19) | (w[i - 2] << 13)) ^ (w[i - 2] >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0
    }
    let a = this.h[0]
    let b = this.h[1]
    let c = this.h[2]
    let d = this.h[3]
    let e = this.h[4]
    let f = this.h[5]
    let g = this.h[6]
    let hh = this.h[7]
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))
      const ch = (e & f) ^ (~e & g)
      const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (S0 + maj) >>> 0
      hh = g
      g = f
      f = e
      e = (d + t1) >>> 0
      d = c
      c = b
      b = a
      a = (t1 + t2) >>> 0
    }
    this.h[0] = (this.h[0] + a) >>> 0
    this.h[1] = (this.h[1] + b) >>> 0
    this.h[2] = (this.h[2] + c) >>> 0
    this.h[3] = (this.h[3] + d) >>> 0
    this.h[4] = (this.h[4] + e) >>> 0
    this.h[5] = (this.h[5] + f) >>> 0
    this.h[6] = (this.h[6] + g) >>> 0
    this.h[7] = (this.h[7] + hh) >>> 0
  }
}

/** یک‌باره (برای آزمون و فایل‌های کوچک) */
export function sha256Hex(data: Uint8Array): string {
  return new Sha256().update(data).hex()
}

/**
 * تجزیهٔ فایل SHA256SUMS (قالب sha256sum گنو): «hash␣␣filename»
 * پرچم باینری «*» اختیاری است. کلیدها نام‌فایل‌های کوچک‌شده‌اند.
 */
export function parseSums(text: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const line of text.split(/\r?\n/)) {
    const m = /^([0-9a-fA-F]{64})\s+\*?(.+)$/.exec(line.trim())
    if (m) map.set(m[2].trim().toLowerCase(), m[1].toLowerCase())
  }
  return map
}
