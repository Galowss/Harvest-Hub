import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

// Enhanced SEO Metadata
export const metadata: Metadata = {
  title: {
    default: "Harvest Hub | Connecting Farmers and Buyers",
    template: "%s | Harvest Hub",
  },
  description: "Join Harvest Hub to connect directly with local farmers. Buy fresh, organic produce and support sustainable agriculture. Farm to table made easy.",
  keywords: ["harvest hub", "local farmers", "organic produce", "sustainable agriculture", "farm to table", "fresh vegetables", "buy local"],
  authors: [{ name: "Harvest Hub" }],
  creator: "Harvest Hub",
  publisher: "Harvest Hub",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  
  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Harvest Hub",
    title: "Harvest Hub | Connecting Farmers and Buyers",
    description: "Connect directly with local farmers. Buy fresh, organic produce and support sustainable agriculture.",
    images: [
      {
        url: "/harvest-hub-logo.png",
        width: 1200,
        height: 630,
        alt: "Harvest Hub - Connecting Farmers and Buyers",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Harvest Hub | Connecting Farmers and Buyers",
    description: "Connect directly with local farmers. Buy fresh, organic produce.",
    images: ["/harvest-hub-logo.png"],
  },
  
  // Verification
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Icons
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

// ✅ Add default layout component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#059669" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Harvest Hub',
              description: 'Connecting farmers and buyers for sustainable agriculture',
              url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
              logo: '/harvest-hub-logo.png',
              sameAs: [],
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning={true}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
