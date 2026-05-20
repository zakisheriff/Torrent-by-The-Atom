"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/AppShell";

const shellPrefixes = ["/dashboard", "/torrents", "/downloads", "/settings", "/torrent/"];

export default function RouteShell({ children }) {
  const pathname = usePathname();
  const shouldWrap = pathname === "/dashboard" || shellPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!shouldWrap) {
    return children;
  }

  return <AppShell>{children}</AppShell>;
}
