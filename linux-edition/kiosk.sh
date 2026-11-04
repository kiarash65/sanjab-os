#!/usr/bin/env bash
# ============================================================================
#  🖥️ SanjabOS Kiosk Mode — فول‌اسکرین خودکار بعد از بوت
#  استفاده:  ./kiosk.sh            ← اجرای مستقیم
#            ./kiosk.sh --install-autostart   ← نصب autostart
# ============================================================================
set -euo pipefail
PORT="${SANJABOS_PORT:-4310}"
URL="http://localhost:$PORT"

# پیدا کردن مرورگر
BROWSER=""
for b in chromium chromium-browser google-chrome google-chrome-stable microsoft-edge firefox; do
  command -v "$b" >/dev/null 2>&1 && { BROWSER="$b"; break; }
done
[ -z "$BROWSER" ] && { echo "❌ مرورگری پیدا نشد — chromium را نصب کن"; exit 1; }

if [ "${1:-}" = "--install-autostart" ]; then
  AUTOSTART_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/autostart"
  mkdir -p "$AUTOSTART_DIR"
  cat > "$AUTOSTART_DIR/sanjabos-kiosk.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=SanjabOS Kiosk
Name[fa]=کیوسک سان‌جاب‌او‌اس
Exec=$PWD/kiosk.sh
X-GNOME-Autostart-enabled=true
EOF
  echo "✅ autostart نصب شد → $AUTOSTART_DIR/sanjabos-kiosk.desktop"
  exit 0
fi

echo "🖥️  SanjabOS Kiosk → $URL ($(echo "$BROWSER" | xargs basename))"
if [ "$BROWSER" = "firefox" ]; then
  exec "$BROWSER" --kiosk "$URL"
fi
exec "$BROWSER" \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  --check-for-update-interval=31536000 \
  --start-fullscreen \
  "$URL"
