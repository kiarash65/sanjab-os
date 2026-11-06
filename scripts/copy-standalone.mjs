// کپی کراس‌پلتفرم خروجی standalone (به‌جای cp -r که در ویندوز نیست)
import { cpSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const staticSrc = join(root, '.next', 'static')
const staticDst = join(root, '.next', 'standalone', '.next', 'static')
const publicSrc = join(root, 'public')
const publicDst = join(root, '.next', 'standalone', 'public')

if (!existsSync(staticSrc)) {
  console.error('static source missing — run `next build` first')
  process.exit(1)
}
cpSync(staticSrc, staticDst, { recursive: true })
if (existsSync(publicSrc)) cpSync(publicSrc, publicDst, { recursive: true })
console.log('standalone copy done:', staticDst, '+', publicDst)
