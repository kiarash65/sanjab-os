#!/usr/bin/env bash
# ============================================================================
#  📦 ساخت بستهٔ .deb سان‌جاب‌او‌اس
#  اجرا:  ./build-deb.sh   ← خروجی: sanjabos_1.0.0_all.deb
#  نصب:   sudo dpkg -i sanjabos_1.0.0_all.deb  (یا apt install ./…)
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/../../.."   # ریشهٔ ریپو

VERSION="2.0.0"
STAGE="$(mktemp -d)/sanjabos-$VERSION"
PKG_DIR="linux-edition/packaging/debian"

echo "▸ آماده‌سازی درخت بسته…"
mkdir -p "$STAGE/DEBIAN" \
         "$STAGE/opt/sanjabos" \
         "$STAGE/lib/systemd/system" \
         "$STAGE/usr/share/applications" \
         "$STAGE/usr/share/pixmaps" \
         "$STAGE/usr/local/bin"

# کد پروژه (بدون node_modules و build)
rsync -a --exclude node_modules --exclude .next --exclude .git \
      --exclude db --exclude upload --exclude download \
      ./ "$STAGE/opt/sanjabos/"

# اسکریپت‌های کنترل دبین
for f in control postinst prerm changelog copyright; do
  cp "$PKG_DIR/$f" "$STAGE/DEBIAN/$f"
done
chmod 755 "$STAGE/DEBIAN/postinst" "$STAGE/DEBIAN/prerm"

# سرویس و میان‌بر
cp linux-edition/sanjabos.service "$STAGE/lib/systemd/system/"
cp linux-edition/sanjabos.desktop "$STAGE/usr/share/applications/"
cp public/logo.svg "$STAGE/usr/share/pixmaps/sanjabos.svg" 2>/dev/null || true
sed -i 's|Icon=sanjabos|Icon=/usr/share/pixmaps/sanjabos.svg|' \
    "$STAGE/usr/share/applications/sanjabos.desktop" 2>/dev/null || true

# CLI سراسری
cat > "$STAGE/usr/local/bin/sanjabos" <<'EOF'
#!/usr/bin/env bash
case "${1:-open}" in
  start|stop|restart|status) systemctl "$1" sanjabos.service ;;
  logs)    journalctl -u sanjabos.service -f ;;
  open)    xdg-open http://localhost:4310 ;;
  kiosk)   exec /opt/sanjabos/linux-edition/kiosk.sh ;;
  update)  cd /opt/sanjabos && sudo -u sanjabos git pull && \
           sudo -u sanjabos bun install --frozen-lockfile && \
           sudo -u sanjabos bun run build && systemctl restart sanjabos ;;
  *) echo "sanjabos <start|stop|restart|status|logs|open|kiosk|update>" ;;
esac
EOF
chmod 755 "$STAGE/usr/local/bin/sanjabos"

echo "▸ بیلد بسته…"
DEB="$(pwd)/sanjabos_${VERSION}_all.deb"
rm -f "$DEB"
dpkg-deb --build --root-owner-group "$STAGE" "$DEB"

echo "✅ بسته ساخته شد: $DEB"
echo "   نصب:   sudo apt install ./$DEB"
echo "   (نصب، بیلد و سرویس را خودکار انجام می‌دهد)"
