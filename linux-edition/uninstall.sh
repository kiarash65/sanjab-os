#!/usr/bin/env bash
# ============================================================================
#  🗑️ SanjabOS Uninstaller — حذف کامل نسخهٔ لینوکس
# ============================================================================
set -euo pipefail
INSTALL_DIR="${SANJABOS_DIR:-$HOME/.sanjabos}"
echo "🗑️  حذف سان‌جاب‌او‌اس…"

# توقف سرویس
systemctl --user stop sanjabos.service 2>/dev/null || sudo systemctl stop sanjabos.service 2>/dev/null || true
systemctl --user disable sanjabos.service 2>/dev/null || sudo systemctl disable sanjabos.service 2>/dev/null || true

# حذف فایل‌ها
rm -f "${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user/sanjabos.service"
sudo rm -f /etc/systemd/system/sanjabos.service 2>/dev/null || true
rm -f "${XDG_DATA_HOME:-$HOME/.local/share}/applications/sanjabos.desktop"
sudo rm -f /usr/share/applications/sanjabos.desktop 2>/dev/null || true
rm -f "$HOME/.local/bin/sanjabos" /usr/local/bin/sanjabos 2>/dev/null || true
rm -rf "$INSTALL_DIR" /opt/sanjabos 2>/dev/null || true
rm -f "${XDG_CONFIG_HOME:-$HOME/.config}/autostart/sanjabos-kiosk.desktop"

systemctl --user daemon-reload 2>/dev/null || sudo systemctl daemon-reload 2>/dev/null || true
echo "✅ همه‌چیز پاک شد. خداحافظ سنجابک! 🐿️"
