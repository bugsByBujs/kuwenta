import type { Metadata, Viewport } from "next";
import { Inter, Lora, Kalam } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-kalam", display: "swap" });

export const metadata: Metadata = {
  title: "Kuwenta — Personal finance, in pesos",
  description: "Track money across banks & e-wallets, log expenses, manage bills, compute pay, and split every cutoff into buckets.",
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
      </body>
    </html>
  );
}
