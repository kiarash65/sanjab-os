# 🐧 SanjabOS — Linux Edition (نسخهٔ لینوکس واقعی)

> سان‌جاب‌او‌اس به‌عنوان یک **سرویس بومی systemd** روی هستهٔ واقعی لینوکس.
> این دقیقاً همان WebOS است — ولی نه داخل تب مرورگرِ یک سایت، بلکه نصب‌شده روی توزیع خودت!

**پایهٔ اصلی: Debian** (سازگار با Ubuntu و Mint و…) — **آرچ** با PKGBUILD — **همهٔ توزیع‌ها** با Docker.

---

## ⚡ نصب سریع (یک فرمان)

```bash
curl -fsSL https://raw.githubusercontent.com/kiarash65/sanjab-os/main/linux-edition/install.sh | bash
```

بعد از نصب: **http://localhost:4310** 🎉

نصب‌کننده خودکار:
- توزیع را تشخیص می‌دهد (apt / dnf / pacman / zypper)
- Bun را نصب می‌کند
- کد را clone و build می‌کند (خروجی standalone)
- سرویس `sanjabos.service` را می‌سازد و فعال می‌کند
- فرمان `sanjabos` و میان‌بر دسکتاپ را اضافه می‌کند

---

## 📦 روش‌های نصب

| روش | توزیع | فرمان |
|-----|-------|-------|
| اسکریپت جهانی | همه | `./install.sh` |
| نصب سراسری | همه | `sudo ./install.sh --system` → `/opt/sanjabos` |
| بستهٔ deb | Debian/Ubuntu/Mint | `./packaging/build-deb.sh && sudo apt install ./sanjabos_1.0.0_all.deb` |
| PKGBUILD | Arch/Manjaro | `cd arch && makepkg -si` |
| Docker | همه | `docker compose -f docker-compose.yml up -d` |
| کیوسک | همه | `./install.sh --kiosk` |

---

## 🕹️ فرمان `sanjabos`

```text
sanjabos start     # روشن کردن سرویس
sanjabos stop      # خاموش کردن
sanjabos restart   # ری‌استارت
sanjabos status    # وضعیت
sanjabos logs      # لاگ زنده
sanjabos open      # باز کردن در مرورگر
sanjabos kiosk     # حالت فول‌اسکرین کیوسک
sanjabos update    # git pull + بیلد + ری‌استارت
```

---

## 🐳 Docker (هستهٔ واقعی میزبان + ایمیج اوبونتو)

```bash
docker build -t sanjabos -f linux-edition/Dockerfile .
docker run -d --name sanjabos -p 4310:4310 --restart unless-stopped sanjabos
```

یا:

```bash
docker compose -f linux-edition/docker-compose.yml up -d
```

---

## 🖥️ حالت کیوسک (Sanjab Box)

برای تبدیل یک لپ‌تاپ قدیمی به «جعبهٔ سان‌جاب»:

```bash
sudo ./install.sh --system --kiosk
sudo reboot
```

بعد از ورود، Chromium در حالت kiosk فول‌اسکرین باز می‌شود — یک تجربهٔ سیستم‌عامل واقعی با هستهٔ واقعی!

---

## 🔍 ساختار

```text
linux-edition/
├── install.sh          ← نصب‌کنندهٔ جهانی (Debian/Ubuntu/Arch/Fedora/openSUSE)
├── uninstall.sh        ← حذف کامل
├── sanjabos.service    ← یونیت systemd (نمونهٔ سیستمی)
├── sanjabos.desktop    ← میان‌بر freedesktop
├── kiosk.sh            ← حالت کیوسک + autostart
├── Dockerfile          ← ایمیج چندمرحله‌ای Bun + standalone
├── docker-compose.yml
├── packaging/
│   ├── build-deb.sh    ← ساخت .deb با dpkg-deb
│   └── debian/         ← control / postinst / prerm …
└── arch/
    └── PKGBUILD        ← پکیج آرچ
```

---

## ❓ چرا Debian؟

- این پروژه خودش روی **Debian 13 (trixie)** توسعه داده و تست می‌شود 🐧
- اوبونتو، مین و صدها توزیع دیگر مستقیماً روی دبین سوارند → همان بستهٔ `.deb` همه‌جا کار می‌کند
- آرچ‌یوزرها هم از `PKGBUILD` استفاده کنند (یا بعداً AUR)
- برای توسعهٔ بیشتر: ساختار استاندارد systemd + freedesktop + OCI یعنی همه‌جا قابل توسعه است

**با اسپانسری سان‌جاب — sunjob.ir 🐿️**
