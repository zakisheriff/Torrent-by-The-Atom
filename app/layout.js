import "./globals.css";
import RouteShell from "@/components/RouteShell";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { TorrentProvider } from "@/components/providers/TorrentProvider";

const siteUrl = "https://torrent.theatom.lk";
const siteTitle = "Torrent by The Atom";
const siteDescription = "Free self-hosted torrent downloader for torrent.theatom.lk. Paste a magnet link, track progress, and save completed files.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteTitle,
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`
  },
  description: siteDescription,
  keywords: [
    "Torrent by The Atom",
    "torrent downloader",
    "magnet link downloader",
    "self-hosted torrent client",
    "torrent.theatom.lk",
    "web torrent downloader"
  ],
  authors: [{ name: "The Atom" }],
  creator: "The Atom",
  publisher: "The Atom",
  category: "technology",
  alternates: {
    canonical: "/"
  },
  icons: {
    icon: [
      { url: "/Logo.png", type: "image/png" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: ["/Logo.png"],
    apple: [
      { url: "/apple-icon.png", sizes: "512x512", type: "image/png" }
    ]
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: siteTitle,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/Logo.png",
        width: 1200,
        height: 1200,
        alt: `${siteTitle} logo`
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/Logo.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0d0d",
  colorScheme: "dark"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <TorrentProvider>
            <SmoothScrollProvider>
              <RouteShell>{children}</RouteShell>
            </SmoothScrollProvider>
          </TorrentProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
