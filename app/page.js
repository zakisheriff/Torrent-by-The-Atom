"use client";

import HeroSection from "@/components/HeroSection";
import styles from "@/app/page.module.css";

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <HeroSection />
      </main>
    </div>
  );
}
