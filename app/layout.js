import "./globals.css";
import RouteShell from "@/components/RouteShell";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { TorrentProvider } from "@/components/providers/TorrentProvider";

export const metadata = {
  title: "The Atom Torrent",
  description: "Premium cloud torrent downloader UI for torrent.theatom.lk",
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
