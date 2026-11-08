import type { NextConfig } from "next";

// SJB-2.0: خطاهای تایپ‌اسکریپت دیگر نادیده گرفته نمی‌شوند — گیت کیفیت در بیلد فعال است
const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
};

export default nextConfig;
