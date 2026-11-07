#!/bin/bash
# راه‌اندازی مطمئن dev server — بدون رقابت پورت و بدون حذف .next روی سرور زنده
cd /home/z/my-project

echo "--- killing old instances ---"
pkill -f "next dev" 2>/dev/null
pkill -f "bun run dev" 2>/dev/null
for i in 1 2 3 4 5; do
  sleep 1
  if ! curl -s -o /dev/null --max-time 1 http://localhost:3000/ 2>/dev/null; then
    break
  fi
done
if curl -s -o /dev/null --max-time 1 http://localhost:3000/ 2>/dev/null; then
  echo "port 3000 still busy — aborting (would corrupt .next)"
  exit 1
fi
echo "--- port free ---"

if [ "$1" = "--fresh" ]; then
  rm -rf .next
  echo "--- .next removed ---"
fi

setsid bun run dev </dev/null >/dev/null 2>&1 &
echo "started, pid family launched"

ok=""
for i in $(seq 1 120); do
  sleep 1
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$code" = "200" ]; then
    echo "READY after ${i}s"
    ok=1
    break
  fi
done

if [ -z "$ok" ]; then
  echo "FAILED to become ready"
  strings dev.log | tail -20
  exit 1
fi

# بررسی پایداری: اگر سرور بعد از آماده‌شدن سریع بمیرد اینجا لو می‌رود
for k in 1 2 3; do
  sleep 4
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  echo "stability check $k: $code"
  if [ "$code" != "200" ]; then
    echo "SERVER DIED after ready — log tail:"
    strings dev.log | tail -25
    exit 1
  fi
done
echo "STABLE ✓"
