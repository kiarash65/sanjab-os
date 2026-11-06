#!/usr/bin/env bash
# ============================================================================
#  🐧 SanjabOS Linux Edition — Universal Installer
#  سان‌جاب‌او‌اس — نصب روی لینوکس واقعی (Debian/Ubuntu/Arch/Fedora/openSUSE)
#
#  Usage:
#    ./install.sh                 # نصب کاربری (systemd --user)
#    sudo ./install.sh --system   # نصب سراسری در /opt + سرویس سیستمی
#    ./install.sh --kiosk         # نصب + حالت کیوسک (فول‌اسکرین خودکار)
#    SANJABOS_PORT=8080 ./install.sh
#    SANJABOS_DRY_RUN=1 ./install.sh   # فقط نمایش اقدامات (بدون اجرا)
#
#  Release policy (docs/RELEASES.md):
#    - بیلد هرگز به‌عنوان root اجرا نمی‌شود — در --system با کاربر سرویس بیلد می‌شود
#    - آپدیت فقط با git pull --ff-only — هرگز git reset --hard برای کاربر زده نمی‌شود
#    - قبل از هر migration از دادهٔ قبلی بکاپ گرفته می‌شود
#
#  Repo: https://github.com/kiarash65/sanjab-os
#  با اسپانسری سان‌جاب — sunjob.ir
# ============================================================================
set -euo pipefail

REPO_URL="${SANJABOS_REPO:-https://github.com/kiarash65/sanjab-os.git}"
BRANCH="${SANJABOS_BRANCH:-main}"
PORT="${SANJABOS_PORT:-4310}"
DRY_RUN="${SANJABOS_DRY_RUN:-0}"
SYSTEM_MODE=0
KIOSK=0

for arg in "$@"; do
  case "$arg" in
    --system) SYSTEM_MODE=1 ;;
    --kiosk)  KIOSK=1 ;;
    --help|-h)
      sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "❓ آرگومان ناشناخته: $arg (--help را ببین)"; exit 1 ;;
  esac
done

# ----------------------------------------------------------------------------
# رنگ‌ها و ابزارهای چاپ
# ----------------------------------------------------------------------------
if [ -t 1 ]; then
  C_ORANGE='\033[38;5;208m'; C_TEAL='\033[38;5;37m'
  C_OK='\033[38;5;46m';  C_WARN='\033[38;5;214m'
  C_ERR='\033[38;5;196m'; C_DIM='\033[2m'; C_OFF='\033[0m'
else
  C_ORANGE=''; C_TEAL=''; C_OK=''; C_WARN=''; C_ERR=''; C_DIM=''; C_OFF=''
fi
step() { printf '\n%s▸ %s%s\n' "$C_ORANGE" "$*" "$C_OFF"; }
info() { printf '  %s%s%s\n' "$C_TEAL" "$*" "$C_OFF"; }
ok()   { printf '  %s[ ✓ ]%s %s\n' "$C_OK" "$C_OFF" "$*"; }
warn() { printf '  %s[ ! ]%s %s\n' "$C_WARN" "$C_OFF" "$*"; }
fail() { printf '  %s[ ✗ ]%s %s\n' "$C_ERR" "$C_OFF" "$*" >&2; exit 1; }
run() {
  if [ "$DRY_RUN" = "1" ]; then info "(dry-run) $*"; else "$@"; fi
}

cat <<'BANNER'

   ┌─────────────────────────────────────────────┐
   │   🐿️  SanjabOS — Linux Edition  🐧           │
   │   سیستم‌عامل وب فارسی روی هستهٔ واقعی لینوکس │
   │        با اسپانسری سان‌جاب — sunjob.ir       │
   └─────────────────────────────────────────────┘

BANNER

[ "$(id -u)" -eq 0 ] && [ "$SYSTEM_MODE" -eq 0 ] && \
  warn "با root اجرا شده ولی --system ندادی — به‌جای /opt در خانهٔ فعلی نصب می‌شود."

# ----------------------------------------------------------------------------
# ۱) تشخیص توزیع
# ----------------------------------------------------------------------------
step "۱/۷ تشخیص توزیع لینوکس"
PKG=""
if command -v apt-get >/dev/null 2>&1; then
  PKG="apt";    DISTRO="Debian/Ubuntu"
elif command -v dnf >/dev/null 2>&1; then
  PKG="dnf";    DISTRO="Fedora/RHEL"
elif command -v pacman >/dev/null 2>&1; then
  PKG="pacman"; DISTRO="Arch"
elif command -v zypper >/dev/null 2>&1; then
  PKG="zypper"; DISTRO="openSUSE"
else
  DISTRO="ناشناخته"
fi
info "توزیع: $DISTRO (مدیر بسته: ${PKG:-ندارد})"
[ -z "$PKG" ] && warn "مدیر بسته پیدا نشد — وابستگی‌ها را دستی نصب کن (git, curl, bun)"

# ----------------------------------------------------------------------------
# ۲) مسیرها
# ----------------------------------------------------------------------------
step "۲/۷ تعیین مسیر نصب"
if [ "$SYSTEM_MODE" -eq 1 ]; then
  [ "$(id -u)" -eq 0 ] || fail "--system را با sudo اجرا کن"
  INSTALL_DIR="/opt/sanjabos"
  BIN_DIR="/usr/local/bin"
  SERVICE_DIR="/etc/systemd/system"
  DESKTOP_DIR="/usr/share/applications"
  SVC_NAME="sanjabos.service"
  SYSTEMCTL_ARGS=()
  SVC_CMD="systemctl"
else
  INSTALL_DIR="${HOME}/.sanjabos"
  BIN_DIR="${HOME}/.local/bin"
  SERVICE_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
  DESKTOP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
  SVC_NAME="sanjabos.service"
  SYSTEMCTL_ARGS="--user"
  SVC_CMD="systemctl --user"
fi
mkdir -p "$BIN_DIR" "$SERVICE_DIR" "$DESKTOP_DIR"
info "مسیر پروژه:   $INSTALL_DIR"
info "فایل اجرایی:  $BIN_DIR/sanjabos"
info "سرویس:        $SERVICE_DIR/$SVC_NAME"

# ----------------------------------------------------------------------------
# ۳) وابستگی‌ها
# ----------------------------------------------------------------------------
step "۳/۷ نصب وابستگی‌ها (git, curl, ca-certificates)"
case "$PKG" in
  apt)    run sudo apt-get update -y; run sudo apt-get install -y git curl ca-certificates ;;
  dnf)    run sudo dnf install -y git curl ca-certificates ;;
  pacman) run sudo pacman -Sy --noconfirm git curl ca-certificates ;;
  zypper) run sudo zypper install -y git curl ca-certificates ;;
  *)      warn "نصب خودکار وابستگی‌ها رد شد" ;;
esac

# ----------------------------------------------------------------------------
# ۳ب) کاربر سرویس (فقط حالت سراسری) — قبل از بیلد ساخته می‌شود تا بیلد با او اجرا شود
# ----------------------------------------------------------------------------
SVC_USER=""
if [ "$SYSTEM_MODE" -eq 1 ]; then
  step "۳ب ساخت کاربر اختصاصی sanjabos (--system)"
  SVC_USER="sanjabos"
  if id "$SVC_USER" >/dev/null 2>&1; then
    ok "کاربر از قبل وجود دارد: $SVC_USER"
  else
    run useradd --system --home-dir "$INSTALL_DIR" --shell /usr/sbin/nologin "$SVC_USER"
    ok "کاربر سیستم ساخته شد: $SVC_USER"
  fi
fi

# ----------------------------------------------------------------------------
# ۳ت) نصب Bun — در حالت سراسری داخل INSTALL_DIR (مالک کاربر سرویس)، نه root home
# ----------------------------------------------------------------------------
step "۳ت نصب Bun (runtime فوق‌سریع جاوااسکریپت)"
if [ "$SYSTEM_MODE" -eq 1 ]; then
  BUN_INSTALL_DIR="$INSTALL_DIR/.bun"
  if [ -x "$BUN_INSTALL_DIR/bin/bun" ]; then
    ok "Bun از قبل نصب است: $("$BUN_INSTALL_DIR/bin/bun" --version)"
  elif [ "$DRY_RUN" = "1" ]; then
    info "(dry-run) BUN_INSTALL=$BUN_INSTALL_DIR curl -fsSL https://bun.sh/install | bash"
  else
    BUN_INSTALL="$BUN_INSTALL_DIR" curl -fsSL https://bun.sh/install | bash
    ok "Bun نصب شد (مسیر سرویس): $BUN_INSTALL_DIR/bin/bun ($("$BUN_INSTALL_DIR/bin/bun" --version))"
  fi
  BUN_BIN="$BUN_INSTALL_DIR/bin/bun"
else
  if command -v bun >/dev/null 2>&1; then
    ok "Bun از قبل نصب است: $(bun --version)"
    BUN_BIN="$(command -v bun)"
  else
    if [ "$DRY_RUN" = "1" ]; then
      info "(dry-run) curl -fsSL https://bun.sh/install | bash"
    else
      curl -fsSL https://bun.sh/install | bash
      export BUN_INSTALL="$HOME/.bun"
      export PATH="$BUN_INSTALL/bin:$PATH"
      ok "Bun نصب شد: $(bun --version)"
    fi
    BUN_BIN="$(command -v bun || echo "$HOME/.bun/bin/bun")"
  fi
  command -v bun >/dev/null 2>&1 || [ "$DRY_RUN" = "1" ] || \
    warn "Bun در PATH نیست — بعد از بازکردن دوباره ترمینال دوباره اجرا کن"
fi

# ----------------------------------------------------------------------------
# ۴) بکاپ دادهٔ قبلی + دریافت کد
#    سیاست: قبل از هر migration بکاپ؛ حذف دادهٔ کاربر هرگز بدون فلگ صریح انجام نمی‌شود
# ----------------------------------------------------------------------------
step "۴/۷ بکاپ دادهٔ قبلی و دریافت سان‌جاب‌او‌اس"
if [ -d "$INSTALL_DIR" ]; then
  BACKUP_DIR="${INSTALL_DIR}-backup-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  [ -f "$INSTALL_DIR/.env" ]  && { cp -a "$INSTALL_DIR/.env" "$BACKUP_DIR/" && info "بکاپ: .env"; } || true
  [ -d "$INSTALL_DIR/db" ]    && { cp -a "$INSTALL_DIR/db"  "$BACKUP_DIR/" && info "بکاپ: db/"; } || true
  [ -d "$INSTALL_DIR/.next" ] && { cp -a "$INSTALL_DIR/.next" "$BACKUP_DIR/" 2>/dev/null; } || true
  ok "بکاپ دادهٔ قبلی: $BACKUP_DIR (چیزی حذف نمی‌شود)"
fi

if [ -d "$INSTALL_DIR/.git" ]; then
  info "نسخهٔ قبلی پیدا شد — آپدیت می‌کنم…"
  run git -C "$INSTALL_DIR" fetch --all --prune
  # سیاست انتشار (docs/RELEASES.md): هرگز git reset --hard برای کاربر زده نمی‌شود
  if [ "$DRY_RUN" = "1" ]; then
    info "(dry-run) git -C '$INSTALL_DIR' pull --ff-only origin '$BRANCH'"
  else
    if git -C "$INSTALL_DIR" pull --ff-only "origin" "$BRANCH"; then
      ok "کد با ff-only آپدیت شد"
    else
      warn "git pull --ff-only نشد — احتمالاً تغییرات محلی داری."
      info "دستی حل کن: cd '$INSTALL_DIR' && git stash && git pull --ff-only"
      fail "آپدیت بدون از بین بردن تغییرات محلی ممکن نشد (reset --hard اجرا نمی‌شود)"
    fi
  fi
else
  run git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
fi
ok "کد آماده است: $INSTALL_DIR"

# ----------------------------------------------------------------------------
# ۵) بیلد — هرگز به‌عنوان root
#    - کاربری: با کاربر فراخوان
#    - سراسری: با کاربر سرویس (sanjabos) از داخل INSTALL_DIR
# ----------------------------------------------------------------------------
step "۵/۷ نصب وابستگی‌های پروژه و بیلد (۱ تا ۳ دقیقه)"
if [ "$SYSTEM_MODE" -eq 1 ]; then
  run chown -R "$SVC_USER:$SVC_USER" "$INSTALL_DIR"
  if [ "$DRY_RUN" = "1" ]; then
    info "(dry-run) sudo -u $SVC_USER env HOME=$INSTALL_DIR PATH=$INSTALL_DIR/.bun/bin:\$PATH bash -c 'bun install && bun run build'"
  else
    sudo -u "$SVC_USER" env \
      HOME="$INSTALL_DIR" \
      BUN_INSTALL="$INSTALL_DIR/.bun" \
      PATH="$INSTALL_DIR/.bun/bin:/usr/local/bin:/usr/bin:/bin" \
      bash -c "cd '$INSTALL_DIR' && bun install --frozen-lockfile && bun run build"
  fi
  info "بیلد با کاربر سرویس انجام شد (نه root)"
else
  run bash -c "cd '$INSTALL_DIR' && bun install --frozen-lockfile && bun run build"
fi
ok "بیلد کامل شد → .next/standalone"

# ----------------------------------------------------------------------------
# ۶) فایل اجرایی CLI
# ----------------------------------------------------------------------------
step "۶/۷ ساخت فرمان sanjabos"
LAUNCHER="$BIN_DIR/sanjabos"
write_launcher() {
  cat > "$LAUNCHER" <<EOF
#!/usr/bin/env bash
# SanjabOS CLI — با اسپانسری سان‌جاب
INSTALL_DIR="$INSTALL_DIR"
PORT="$PORT"
SVC="$SVC_CMD"
case "\${1:-open}" in
  start)   \$SVC start sanjabos.service ;;
  stop)    \$SVC stop sanjabos.service ;;
  restart) \$SVC restart sanjabos.service ;;
  status)  \$SVC status sanjabos.service ;;
  logs)    journalctl \$( [ "${SYSTEM_MODE}" -eq 1 ] || echo "--user" ) -u sanjabos.service -f ;;
  open)    xdg-open "http://localhost:\$PORT" 2>/dev/null || echo "مرورگر را باز کن: http://localhost:\$PORT" ;;
  kiosk)   exec "$INSTALL_DIR/linux-edition/kiosk.sh" ;;
  update)  cd "\$INSTALL_DIR" && git pull --ff-only && bun install --frozen-lockfile && bun run build && \$SVC restart sanjabos.service ;;
  *)       echo "sanjabos <start|stop|restart|status|logs|open|kiosk|update>" ;;
esac
EOF
  chmod +x "$LAUNCHER"
}
if [ "$DRY_RUN" = "1" ]; then info "(dry-run) نوشتن $LAUNCHER"; else write_launcher; fi
ok "فرمان sanjabos نصب شد (start/stop/logs/kiosk/update)"

# ----------------------------------------------------------------------------
# ۷) سرویس systemd + میان‌بر دسکتاپ
#    سرویس: کاربر اختصاصی، hardening، گوش‌دادن loopback (LAN باید صریح باشد)
# ----------------------------------------------------------------------------
step "۷/۷ سرویس systemd"
SERVICE_FILE="$SERVICE_DIR/$SVC_NAME"
write_service() {
  cat > "$SERVICE_FILE" <<EOF
# SanjabOS — سیستم‌عامل وب فارسی — با اسپانسری سان‌جاب
[Unit]
Description=SanjabOS — Persian RTL WebOS (sunjob.ir)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
$( [ "$SYSTEM_MODE" -eq 1 ] && echo "User=$SVC_USER" && echo "Group=$SVC_USER" )
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
Environment=PORT=$PORT
# پیش‌فرض loopback — expose کردن روی LAN تصمیم صریح اپراتور است
Environment=HOSTNAME=127.0.0.1
Environment=PATH=/usr/local/bin:/usr/bin:/bin:$INSTALL_DIR/.bun/bin
ExecStartPre=/usr/bin/test -f $INSTALL_DIR/.next/standalone/server.js
ExecStart=$BUN_BIN .next/standalone/server.js
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
RestrictSUIDSGID=true
LockPersonality=true
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
ReadWritePaths=$INSTALL_DIR/.next $INSTALL_DIR/db
MemoryMax=1G
CPUQuota=80%

[Install]
WantedBy=$( [ "$SYSTEM_MODE" -eq 1 ] && echo "multi-user.target" || echo "default.target" )
EOF
}
if [ "$DRY_RUN" = "1" ]; then
  info "(dry-run) نوشتن $SERVICE_FILE"
else
  write_service
  if command -v systemctl >/dev/null 2>&1 && systemctl is-system-running >/dev/null 2>&1; then
    if [ "$SYSTEM_MODE" -eq 1 ]; then
      systemctl daemon-reload
      systemctl enable --now sanjabos.service
    else
      systemctl --user daemon-reload
      systemctl --user enable --now sanjabos.service
      loginctl enable-linger "$USER" 2>/dev/null || \
        warn "برای اجرای سرویس بدون لاگین: sudo loginctl enable-linger $USER"
    fi
    ok "سرویس فعال شد → http://localhost:$PORT"
  else
    warn "systemd در دسترس نیست — اجرای دستی:"
    info "  cd $INSTALL_DIR && PORT=$PORT HOSTNAME=127.0.0.1 bun .next/standalone/server.js"
  fi
fi

step "میان‌بر دسکتاپ"
DESKTOP_FILE="$DESKTOP_DIR/sanjabos.desktop"
write_desktop() {
  cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=SanjabOS
Name[fa]=سان‌جاب‌او‌اس
Comment=سیستم‌عامل وب بامزهٔ فارسی — با اسپانسری سان‌جاب
Exec=$LAUNCHER open
Icon=$INSTALL_DIR/public/logo.svg
Terminal=false
Categories=Network;Utility;
Keywords=sanjabos;webos;linux;sanjab;
EOF
}
if [ "$DRY_RUN" = "1" ]; then info "(dry-run) نوشتن $DESKTOP_FILE"; else write_desktop; fi
ok "میان‌بر «سان‌جاب‌او‌اس» به منوی اپلیکیشن‌ها اضافه شد"

if [ "$KIOSK" -eq 1 ]; then
  step "حالت کیوسک"
  run bash "$INSTALL_DIR/linux-edition/kiosk.sh" --install-autostart
  ok "کیوسک نصب شد — بعد از ورود، خودکار فول‌اسکرین باز می‌شود"
fi

cat <<DONE

  ${C_OK}🎉 نصب کامل شد!${C_OFF}

     آدرس:    ${C_ORANGE}http://localhost:$PORT${C_OFF}
     فرمان:   ${C_TEAL}sanjabos${C_OFF}  ← start / stop / logs / kiosk / update
     حذف:     ${C_DIM}./uninstall.sh${C_OFF}   (داده‌ها حفظ می‌شوند؛ حذف کامل: --purge)

     ${C_DIM}با اسپانسری سان‌جاب — sunjob.ir 🐿️${C_OFF}

DONE
