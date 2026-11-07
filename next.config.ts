import type { NextConfig } from "next";

// SJB-2.0: خطاهای تایپ‌اسکریپت دیگر نادیده گرفته نمی‌شوند — گیت کیفیت در بیلد فعال است
// SJB-4.1: هدرهای امنیتی پایه برای نسخهٔ وب و نسخهٔ دسکتاپ (سرور sidecar)
//   * connect-src باز است چون هوش‌یار BYOK است — Provider کلید کاربر می‌تواند
//     هر آدرسی باشد (مثلاً Ollama محلی روی http://127.0.0.1:11434). این تصمیم
//     عمدی است و در docs/SECURITY.md مستند شده.
//   * camera=(self) برای اپ تشخیص چهره/سن لازم است.
const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
      {
        // سلامت‌سنجی دسکتاپ — هرگز کش نشود
        source: "/api/health",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
