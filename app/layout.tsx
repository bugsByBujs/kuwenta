import type { Metadata, Viewport } from "next";
import { Inter, Lora, Kalam } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { RegisterSW } from "@/components/pwa/RegisterSW";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-kalam", display: "swap" });

export const metadata: Metadata = {
  applicationName: "Kuwenta",
  title: "Kuwenta — Personal finance, in pesos",
  description: "Track money across banks & e-wallets, log expenses, manage bills, compute pay, and split every cutoff into buckets.",
  appleWebApp: {
    capable: true,
    title: "Kuwenta",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#006241",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} ${kalam.variable} h-full`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <RegisterSW />
      </body>
    </html>
  );
}
