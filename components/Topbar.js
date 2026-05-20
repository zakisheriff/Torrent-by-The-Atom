"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import styles from "@/components/Topbar.module.css";

const titles = {
  "/dashboard": {
    title: "Paste a link",
  },
  "/torrents": {
    title: "Your library",
  },
  "/settings": {
    title: "Settings",
  },
};

export default function Topbar({ onMenuOpen }) {
  const pathname = usePathname();
  const current = titles[pathname] || {
    title: "Torrent by The Atom",
  };

  return (
    <div className={styles.topbar}>
      <button
        className={styles.mobileMenuButton}
        onClick={onMenuOpen}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <div className={styles.titleBlock}>
        <strong>{current.title}</strong>
        <span>{current.description}</span>
      </div>
    </div>
  );
}
