import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080600",
};

export const metadata: Metadata = {
  title: "mem - Memory for AI agents",
  description: "Simple, fast memory layer for AI agents. Hybrid search, relevance scoring, and graph relationships. Works anywhere.",
  keywords: [
    "mem",
    "AI memory",
    "AI agents",
    "vector database",
    "semantic search",
    "hybrid search",
    "Supabase",
    "pgvector",
    "Claude Code",
    "LLM memory",
    "agent memory",
    "knowledge graph",
    "relevance scoring",
  ],
  authors: [{ name: "One", url: "https://withone.ai" }],
  creator: "One",
  publisher: "One",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mem.now"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "mem - Memory for AI agents",
    description: "Simple, fast memory layer for AI agents. Hybrid search, relevance scoring, and graph relationships.",
    url: "/",
    siteName: "mem",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "mem - Memory for AI agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "mem - Memory for AI agents",
    description: "Simple, fast memory layer for AI agents. Hybrid search, relevance scoring, and graph relationships.",
    creator: "@withaborai",
    site: "@withoneai",
    images: ["/og-image.png"],
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
  category: "technology",
  classification: "Developer Tools",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  other: {
    "google-site-verification": process.env.GOOGLE_SITE_VERIFICATION || "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} font-mono antialiased`}>
        {children}
      </body>
    </html>
  );
}
