# پشتیبانی پلتفرم — Platform Support (v2.0.0)

## ۱. مرورگرها (WebOS)

| مرورگر | حداقل نسخه | وضعیت | ملاحظات |
|--------|-------------|--------|----------|
| Chrome / Chromium | نسخه‌های مدرن (100+) | پشتیبانی کامل — مرجع اصلی | بهترین تجربه برای v86 و کیوسک |
| Edge | نسخه‌های مدرن (Chromium) | پشتیبانی کامل | — |
| Firefox | نسخه‌های مدرن (ESR) | پشتیبانی کامل | — |
| Safari | **16.4+** | پشتیبانی کامل با ملاحظات | `getUserMedia` و WASM موجود است؛ تست چهره‌محور توصیه می‌شود |

## ۲. API های موردنیاز مرورگر

| API | برای چه چیزی | شرط |
|-----|---------------|------|
| `getUserMedia` | اپ‌های دوربین (تشخیص چهره، قدسنج/وزن‌یاب، ماشین زمان چهره) | **فقط HTTPS یا localhost** — روی HTTP ناامن دوربین مرورگرها در دسترس نیست |
| WASM | شبیه‌ساز v86 (کرنل واقعی Alpine) | همیشه فعال در مرورگرهای مدرن؛ ~85MB فایل بوت از `public/v86/` |
| Web Worker | اجرای JS کاربر در کداستودیو | — |
| localStorage | fs مجازی، تنظیمات، یادداشت‌ها، رکوردها | حالت ناشناس (private) داده‌ها را ذخیره نمی‌کند |
| IndexedDB | وضعیت VM/بکاپ — `[planned]` | هنوز پیاده‌سازی نشده |
| WebGL/GPU | **لازم نیست** — هیچ اپی GPU اجباری ندارد | Face AI روی CPU با TinyFaceDetector اجرا می‌شود |

## ۳. پروفایل منابع پایین (Low-resource)

- بدون نیاز به GPU — همهٔ مدل‌ها CPU/WASM.
- مدل‌های Face AI و AI اضافه فقط با اقدام صریح کاربر دانلود می‌شوند (opt-in) — بازدید معمولی دانلود سنگین ندارد.
- سنگین‌ترین تجربه: «بوت کرنل واقعی» (v86 + ISO ~85MB)؛ روی دستگاه‌های ضعیف اپ‌های سبک‌تر پیشنهاد می‌شود.
- روی موبایل: چیدمان واکنش‌گرا برای دسکتاپ/تسک‌بار فراهم است؛ اما تجربهٔ کامل (پنجره‌های drag/resizable) برای صفحهٔ بزرگ طراحی شده — روی صفحهٔ لمسی کوچک بهترین تجربه با مرورگر دسکتاپ‌محور است.

## ۴. نسخهٔ لینوکس واقعی (linux-edition)

| روش | پلتفرم | وضعیت |
|-----|---------|--------|
| `install.sh` (کاربری) | هر توزیع با systemd | پشتیبانی‌شده (Debian 13 مرجع توسعه) |
| `install.sh --system` | هر توزیع + sudo | پشتیبانی‌شده — سرویس با کاربر اختصاصی `sanjabos` |
| بستهٔ `.deb` | Debian/Ubuntu/Mint | ساخته‌شده با `packaging/build-deb.sh` |
| `PKGBUILD` | Arch/Manjaro | `linux-edition/arch && makepkg -si` |
| Docker / Compose | هر سیستم با Docker | پورت فقط روی `127.0.0.1:4310` مپ می‌شود |
| حالت کیوسک | هر توزیع + Chromium/Firefox | `install.sh --kiosk` |

### WSL2 (راهنما)

```bash
# داخل توزیع WSL2 (مثلاً Ubuntu):
sudo apt update && sudo apt install -y curl git ca-certificates
curl -fsSL https://raw.githubusercontent.com/kiarash65/sanjab-os/main/linux-edition/install.sh | bash
# سپس در ویندوز: http://localhost:4310
# systemd در WSL2: در /etc/wsl.conf مقدار [boot] systemd=true لازم است (Windows 11+)
```

### Termux / Android (راهنما)

```bash
# در Termux:
pkg install git curl
# Bun در Termux رسمی نیست؛ Node 18+ را از packages نصب کنید:
pkg install nodejs-lts
git clone https://github.com/kiarash65/sanjab-os && cd sanjab-os
npm install --no-audit --no-fund
npm run build && npx next start -p 4310
# مسیر جایگزین مستندشده: proot-distro با Debian داخل Termux
```

> وضعیت صادقانه: مسیرهای WSL2/Termux **مستند** هستند ولی هنوز روی سخت‌افزار واقعی boot-test نشده‌اند (ROADMAP فاز 7).

## ۵. سرویس systemd نیتیو

- فایل یونیت: `linux-edition/sanjabos.service` — کاربر/گروه اختصاصی `sanjabos`، hardening کامل (`NoNewPrivileges`, `ProtectSystem=strict`, `ProtectHome`, `PrivateTmp`, `RestrictSUIDSGID`, `LockPersonality`, `RestrictAddressFamilies`, `ReadWritePaths` محدود، `MemoryMax=1G`, `CPUQuota=80%`)، پیش‌فرض گوش‌دادن روی loopback (`HOSTNAME=127.0.0.1`).
- فرمان‌ها: `sanjabos start|stop|restart|status|logs|open|kiosk|update`.
