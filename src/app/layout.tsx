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
  title: "پنگوئن‌اواس 🐧 | سیستم‌عامل بامزه تحت وب",
  description:
    "یک سیستم‌عامل خیالی بر پایه لینوکس با اپ‌های عجیب‌غریب و کلی بازی — همه در مرورگر شما!",
  keywords: ["پنگوئن‌اواس", "سیستم‌عامل وب", "لینوکس", "بازی", "PenguinOS"],
};

export const viewport: Viewport = {
  themeColor: "#022c22",
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
