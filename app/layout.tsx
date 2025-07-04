import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Merienda } from "next/font/google";
import { Roboto, Michroma, Audiowide } from 'next/font/google'
import "./globals.css";
import Providers from "./Providers";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const merienda = Merienda({ 
  subsets: ['latin'],
  variable: '--font-merienda'
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
})

const michroma = Michroma({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-michroma',
  display: 'swap',
})

const audiowide = Audiowide({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-audiowide',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Lira",
  description: "Personal AI Multi-Agent",
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/jpeg', sizes: 'any' },
      { url: '/favicon.ico', type: 'image/jpeg', sizes: '16x16' },
      { url: '/favicon.ico', type: 'image/jpeg', sizes: '32x32' },
    ],
    apple: [
      { url: '/favicon.ico', type: 'image/jpeg', sizes: '180x180' },
    ],
    shortcut: [
      { url: '/favicon.ico', type: 'image/jpeg' },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable} ${michroma.variable} ${audiowide.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Michroma&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-black text-gray-100",
          geistSans.variable,
          geistMono.variable,
          merienda.variable,
          roboto.className
        )}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
