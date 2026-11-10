import type { Metadata, Viewport } from "next";
import "./globals.css";

/* فونت‌ها به‌صورت محلی در public/fonts باندل شده‌اند (woff2، مجوز SIL OFL)
   و در globals.css با @font-face + font-display: swap تعریف شده‌اند.
   دو فونت اصلی (وزیرمتن و استعداد) preload می‌شوند تا CLS نزدیک صفر بماند. */

export const metadata: Metadata = {
  title: "سان‌جاب‌او‌اس | سیستم‌عامل بامزه تحت وب، با اسپانسری سان‌جاب",
  description:
    "سان‌جاب‌او‌اس: سیستم‌عامل رنگی و بامزهٔ تحت وب با ترمینال آموزشی، پایتون، نویسا (خروجی Word و PDF)، ماشین‌حساب فول، نقاشی و کلی بازی، با اسپانسری سان‌جاب (sunjob.ir)",
  keywords: ["سان‌جاب‌او‌اس", "SunJob OS", "سیستم‌عامل وب", "پایتون آنلاین", "ترمینال آموزشی", "بازی", "سان‌جاب"],
};

export const viewport: Viewport = {
  themeColor: "#f7931e",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/Vazirmatn-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Estedad-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/JetBrainsMono-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased overflow-hidden bg-zinc-950 text-zinc-100">
        {children}
      </body>
    </html>
  );
}
