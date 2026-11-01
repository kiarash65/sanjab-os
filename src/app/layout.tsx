import type { Metadata, Viewport } from "next";
import { Geist_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";

const vazir = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "900"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "سان‌جاب‌او‌اس | سیستم‌عامل بامزه تحت وب — با اسپانسری سان‌جاب",
  description:
    "سان‌جاب‌او‌اس: سیستم‌عامل رنگی و بامزهٔ تحت وب با ترمینال آموزشی، پایتون، نویسا (خروجی Word و PDF)، ماشین‌حساب فول، نقاشی و کلی بازی — با اسپانسری سان‌جاب (sunjob.ir)",
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
      <body
        className={`${vazir.variable} ${mono.variable} antialiased overflow-hidden bg-zinc-950 text-zinc-100`}
      >
        {children}
      </body>
    </html>
  );
}
