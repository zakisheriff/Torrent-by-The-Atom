"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import styles from "@/components/AppShell.module.css";

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className={styles.mainArea}>
        <Topbar onMenuOpen={() => setMobileOpen(true)} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
