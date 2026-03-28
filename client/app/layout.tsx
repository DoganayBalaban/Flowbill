import { SentryInit } from "@/components/sentry-init";
import { Providers } from "@/providers";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["italic"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://flowbill.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Flowbill – Freelancer Time Tracking & Invoicing",
    template: "%s | Flowbill",
  },
  description:
    "Flowbill helps freelancers track time, manage clients and projects, and generate professional PDF invoices — all in one place. Free to get started.",
  keywords: [
    "freelancer invoicing",
    "time tracking",
    "invoice generator",
    "freelance management",
    "project management",
    "client management",
    "PDF invoices",
    "billable hours",
  ],
  authors: [{ name: "Flowbill" }],
  creator: "Flowbill",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Flowbill",
    title: "Flowbill – Freelancer Time Tracking & Invoicing",
    description:
      "Track time, manage clients, and generate professional invoices — all in one clean workspace. Free to get started.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Flowbill – Freelancer Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowbill – Freelancer Time Tracking & Invoicing",
    description:
      "Track time, manage clients, and generate professional invoices — all in one clean workspace.",
    images: ["/opengraph-image"],
    creator: "@flowbill",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <SentryInit />
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
