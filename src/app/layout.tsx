import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://agi.psyverse.fun"),
  title: "AGI Research Lab — Paths to Artificial General Intelligence",
  description:
    "AI-powered research assistant exploring Artificial General Intelligence — curated papers, labs, and the open problems ahead.",
  keywords: ["AGI", "artificial general intelligence", "AI research", "machine learning", "AI safety"],
  authors: [{ name: "Gewenbo", url: "https://psyverse.fun" }],
  alternates: {
    canonical: "/",
    languages: { en: "/", "zh-CN": "/", "x-default": "/" },
  },
  openGraph: {
    title: "AGI Research Lab",
    description: "Paths to Artificial General Intelligence — papers, labs, open problems.",
    url: "https://agi.psyverse.fun/",
    siteName: "Psyverse",
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AGI Research Lab",
    description: "Paths to Artificial General Intelligence.",
  },
  robots: { index: true, follow: true },
  other: { "theme-color": "#0f172a" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script src="https://analytics-dashboard-two-blue.vercel.app/tracker.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
