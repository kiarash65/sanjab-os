#!/usr/bin/env bash
# ============================================================================
#  🗑️ SanjabOS Uninstaller — حذف نسخهٔ لینوکس
#
#  پیش‌فرض: برنامه و سرویس حذف می‌شوند، ولی «دادهٔ کاربر حفظ می‌شود».
#  حذف کامل داده‌ها فقط با فلگ صریح:
#     ./uninstall.sh --purge
#
#  دادهٔ کاربر شامل: پوشهٔ نصب (فایل‌سیستم مجازی/تنظیمات داخل مرورگر کاربر
#  در مرورگر می‌ماند و این اسکریپت کاری با آن ندارد) + db/ و .env داخل INSTALL_DIR.
# ============================================================================
set -euo pipefail
INSTALL_DIR="${SANJABOS_DIR:-$HOME/.sanjabos}"
PURGE=0
for arg in "$@"; do
  case "$arg" in
    --purge) PURGE=1 ;;
    --help|-h)
      sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "❓ آرگومان ناشناخته: $arg (--help را ببین)"; exit 1 ;;
  esac
done

echo "🗑️  حذف سان‌جاب‌او‌اس…"

# توقف سرویس
systemctl --user stop sanjabos.service 2>/dev/null || sudo systemctl stop sanjabos.service 2>/dev/null || true
systemctl --user disable sanjabos.service 2>/dev/null || sudo systemctl disable sanjabos.service 2>/dev/null || true

# حذف سرویس و میان‌برها
rm -f "${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user/sanjabos.service"
sudo rm -f /etc/systemd/system/sanjabos.service 2>/dev/null || true
rm -f "${XDG_DATA_HOME:-$HOME/.local/share}/applications/sanjabos.desktop"
sudo rm -f /usr/share/applications/sanjabos.desktop 2>/dev/null || true
rm -f "${XDG_CONFIG_HOME:-$HOME/.config}/autostart/sanjabos-kiosk.desktop"
rm -f "$HOME/.local/bin/sanjabos"
sudo rm -f /usr/local/bin/sanjabos 2>/dev/null || true

systemctl --user daemon-reload 2>/dev/null || sudo systemctl daemon-reload 2>/dev/null || true

# ----------------------------------------------------------------------------
# داده‌ها: به‌صورت پیش‌فرض حفظ می‌شوند
# ----------------------------------------------------------------------------
if [ "$PURGE" -eq 1 ]; then
  echo "⚠️  --purge داده‌ها را برای همیشه حذف می‌کند (db/ و .env داخل پوشهٔ نصب)."
  if [ -d "$INSTALL_DIR" ]; then
    BACKUP_DIR="${INSTALL_DIR}-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    [ -f "$INSTALL_DIR/.env" ] && { cp -a "$INSTALL_DIR/.env" "$BACKUP_DIR/" || true; } || true
    [ -d "$INSTALL_DIR/db" ]   && { cp -a "$INSTALL_DIR/db"  "$BACKUP_DIR/" || true; } || true
    echo "   (بکاپ آخرین داده‌ها: $BACKUP_DIR)"
  fi
  rm -rf "$INSTALL_DIR"
  sudo rm -rf /opt/sanjabos 2>/dev/null || true
  echo "✅ حذف کامل انجام شد. خداحافظ سنجابک! 🐿️"
else
  echo "✅ برنامه حذف شد؛ داده‌ها حفظ شدند:"
  [ -d "$INSTALL_DIR" ] && echo "   - $INSTALL_DIR" || true
  [ -d /opt/sanjabos ]  && echo "   - /opt/sanjabos" || true
  echo "   برای حذف کامل: $0 --purge"
fi
