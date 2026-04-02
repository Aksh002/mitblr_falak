import Image from "next/image";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/env-fallback";
import ClientProviders from "@/components/ClientProviders";
import EnvWarning from "@/components/EnvWarning";
import { Toaster } from "sonner";
import NavProgress from "@/components/NavProgress";
import Navbar from "@/components/Nav";
import Link from "next/link"; 
import PageTransitionClient from "@/components/PageTransitionClient";
import PaymentReturnSync from "@/components/payments/PaymentReturnSync";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FALAK 2025 — MIT Bengaluru Cultural Fest",
    template: "%s | FALAK 2025",
  },
  description: "Official site for FALAK 2025 — MIT Bengaluru’s cultural fest: passes, events, teams, schedule, and updates.",
  applicationName: "FALAK 2025",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "FALAK 2025 — MIT Bengaluru Cultural Fest",
    description: "Passes, events, team registrations, schedule, and live updates.",
    siteName: "FALAK 2025",
    images: [{ url: "/images/artisthead.jpeg", width: 1200, height: 630, alt: "FALAK 2025" }],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "FALAK 2025 — MIT Bengaluru Cultural Fest",
    description: "Passes, events, teams, and schedule.",
    images: ["/images/artisthead.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/falak-icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          rel="preload"
          href="/fonts/brasty-vintage.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="icon" type="image/svg+xml" href="/falak-icon.svg" />
      </head>
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen h-full flex flex-col overflow-x-hidden`}>
        <ClientProviders>
          <PaymentReturnSync />
          <EnvWarning />

          {/* Navbar */}
      <Navbar />

          {/* Fixed Logo */}
<div
  className={`fixed -top-6 -right-5 z-[9999] xl:left-4 xl:top-[-3.5rem] xl:right-auto transition-all duration-300 opacity-100`}
  style={{ transform: "translateZ(0)" }}
>
  <Link href="/" aria-label="Go to homepage">
    <Image
      src="/images/logo.png"
      alt="Falak Logo"
      width={400}
      height={370}
      className="w-[200px] h-[120px] xl:w-[300px] xl:h-[200px] cursor-pointer"
      priority
    />
  </Link>
</div>


          <main className="flex-1 w-full min-h-screen">
            <PageTransitionClient>{children}</PageTransitionClient>
          </main>
          <NavProgress />
          <Toaster richColors position="bottom-right" />
          <Analytics/>
        </ClientProviders>
      </body>
    </html>
  );
}
