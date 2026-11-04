# ============================================================================
#  🐳 SanjabOS — Docker Edition
#  هستهٔ واقعی لینوکسِ میزبان + ایمیج اوبونتو-بیس (oven/bun)
#  بیلد:   docker build -t sanjabos -f linux-edition/Dockerfile .
#  اجرا:   docker run -d -p 4310:4310 --name sanjabos sanjabos
# ============================================================================
FROM oven/bun:1.1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.1 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM oven/bun:1.1-slim AS runner
WORKDIR /app
LABEL org.opencontainers.image.title="SanjabOS" \
      org.opencontainers.image.description="سیستم‌عامل وب فارسی RTL — با اسپانسری سان‌جاب" \
      org.opencontainers.image.source="https://github.com/kiarash65/sanjab-os" \
      org.opencontainers.image.licenses="MIT"
ENV NODE_ENV=production \
    PORT=4310 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
# خروجی standalone شامل static و public هم هست (اسکریپت build کپی‌شان می‌کند)
COPY --from=build /app/.next/standalone ./
EXPOSE 4310
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||4310)).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["bun", "server.js"]
