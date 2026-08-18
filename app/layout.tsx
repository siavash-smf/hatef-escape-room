import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  title: "اتاق فرار هاتف",
  description:
    "از ذهن هاتف، نخستین ابرهوش‌مصنوعی جهان، فرار کن. شش لایه، شش کلید، دوازده دقیقه.",
};

export const viewport: Viewport = {
  themeColor: "#04060f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className="scanlines grain min-h-screen text-[#e7f6ff] antialiased">
        {children}
      </body>
    </html>
  );
}
