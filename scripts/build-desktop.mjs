// آماده‌سازی باندل دسکتاپ سان‌جاب‌اواس (Tauri sidecar architecture)
//
//   bun run build            ← اول بیلد Next (standalone) + کپی static/public
//   bun run build:desktop    ← بعد این اسکریپت:
//
// کارهای این اسکریپت:
//   ۱) کپی .next/standalone → src-tauri/server-dist   (منبع resources در tauri.conf.json)
//   ۲) دانلود و قرار دادن باینری Node به‌عنوان sidecar در src-tauri/binaries/
//      (externalBin در tauri.conf.json — نام فایل باید شامل target-triple باشد)
//
// فقط loopback، بدون هیچ پورت عمومی.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { execSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcTauri = join(root, 'src-tauri')
const standalone = join(root, '.next', 'standalone')
const serverDist = join(srcTauri, 'server-dist')
const binariesDir = join(srcTauri, 'binaries')

const NODE_VERSION = process.env.SANJAB_NODE_VERSION ?? 'v22.11.0'

/** نگاشت پلتفرم فعلی به target-triple تائوری و نام باینری نود */
function targets() {
  const platform = process.platform
  const arch = process.arch
  if (platform === 'win32' && arch === 'x64') {
    return { triple: 'x86_64-pc-windows-msvc', ext: '.exe', nodeDist: 'win-x64', archive: 'zip' }
  }
  if (platform === 'linux' && arch === 'x64') {
    return { triple: 'x86_64-unknown-linux-gnu', ext: '', nodeDist: 'linux-x64', archive: 'tar.gz' }
  }
  if (platform === 'linux' && arch === 'arm64') {
    return { triple: 'aarch64-unknown-linux-gnu', ext: '', nodeDist: 'linux-arm64', archive: 'tar.gz' }
  }
  if (platform === 'darwin' && arch === 'arm64') {
    return { triple: 'aarch64-apple-darwin', ext: '', nodeDist: 'darwin-arm64', archive: 'tar.gz' }
  }
  if (platform === 'darwin' && arch === 'x64') {
    return { triple: 'x86_64-apple-darwin', ext: '', nodeDist: 'darwin-x64', archive: 'tar.gz' }
  }
  console.error(`پلتفرم ${platform}/${arch} پشتیبانی نمی‌شود`)
  process.exit(1)
}

/* ---------- ۱) server-dist ---------- */
if (!existsSync(join(standalone, 'server.js'))) {
  console.error('‼️  .next/standalone/server.js نبود — اول `bun run build` را اجرا کن')
  process.exit(1)
}
rmSync(serverDist, { recursive: true, force: true })
mkdirSync(serverDist, { recursive: true })
cpSync(standalone, serverDist, { recursive: true })
console.log('✓ server-dist آماده شد:', serverDist)

/* ---------- ۲) node sidecar ---------- */
const t = targets()
const sidecarName = `node-${t.triple}${t.ext}`
mkdirSync(binariesDir, { recursive: true })
const sidecarPath = join(binariesDir, sidecarName)

const base = `https://nodejs.org/dist/${NODE_VERSION}/`
const archiveName =
  t.archive === 'zip'
    ? `node-${NODE_VERSION}-${t.nodeDist}.zip`
    : `node-${NODE_VERSION}-${t.nodeDist}.tar.gz`
const url = base + archiveName

console.log('⬇️  دانلود Node sidecar:', url)
const tmpZip = join(binariesDir, archiveName)
const res = await fetch(url)
if (!res.ok) {
  console.error(`‼️  دانلود ناموفق: ${res.status} — یا SANJAB_NODE_VERSION را چک کن`)
  process.exit(1)
}
await pipeline(Readable.fromWeb(res.body), createWriteStream(tmpZip))

if (t.archive === 'zip') {
  // ویندوز: unzip (در PowerShell با tar هم باز می‌شود)
  execSync(`tar -xf "${tmpZip}" -C "${binariesDir}"`)
  const inner = join(binariesDir, `node-${NODE_VERSION}-${t.nodeDist}`, 'node.exe')
  cpSync(inner, sidecarPath)
  rmSync(join(binariesDir, `node-${NODE_VERSION}-${t.nodeDist}`), { recursive: true, force: true })
} else {
  execSync(`tar -xzf "${tmpZip}" -C "${binariesDir}"`)
  const inner = join(binariesDir, `node-${NODE_VERSION}-${t.nodeDist}`, 'bin', 'node')
  cpSync(inner, sidecarPath)
  rmSync(join(binariesDir, `node-${NODE_VERSION}-${t.nodeDist}`), { recursive: true, force: true })
}
rmSync(tmpZip, { force: true })
// برای build.rs/گردانندهٔ یونیکس بیت اجرا لازم است
try {
  execSync(`chmod +x "${sidecarPath}"`)
} catch {
  /* ویندوز ندارد */
}
console.log('✓ node sidecar آماده شد:', sidecarPath)

/* ---------- یادداشت برای گام بعدی ---------- */
writeFileSync(
  join(srcTauri, 'NEXT-STEPS.txt'),
  [
    'باندل دسکتاپ آماده است. حالا روی ویندوز (با Rust + cargo-tauri نصب‌شده):',
    '  cargo tauri build            ← خروجی NSIS/MSI',
    'یا برای تست سریع:',
    '  cargo tauri dev',
    '',
    'نکته: externalBin = binaries/node و resources = server-dist است؛',
    'این دو پوشه توسط scripts/build-desktop.mjs ساخته شده‌اند.',
    '',
  ].join('\n'),
)
console.log('اکنون می‌توانی در src-tauri دستور `cargo tauri build` را اجرا کنی')
