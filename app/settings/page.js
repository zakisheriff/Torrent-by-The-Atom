"use client";

import { useState } from "react";
import { Fingerprint, KeySquare, Shield, SlidersHorizontal, UserCircle2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import styles from "@/app/settings/page.module.css";

const sections = [
  {
    icon: UserCircle2,
    title: "Submission flow",
    description: "Keep the interface centered on magnet intake instead of account management."
  },
  {
    icon: Shield,
    title: "Safety",
    description: "Use the app only with content you have the rights to access and transfer."
  },
  {
    icon: SlidersHorizontal,
    title: "Device flow",
    description: "Keep the handoff fast so the installed torrent app on this device does the actual transfer work."
  },
  {
    icon: KeySquare,
    title: "App handoff",
    description: "Use the browser as the clean launcher and magnet library instead of pretending to be the downloader itself."
  },
  {
    icon: Fingerprint,
    title: "Preferences",
    description: "Keep small client-side behavior choices here without changing the main workflow."
  }
];

export default function SettingsPage() {
  const [streamingPreview, setStreamingPreview] = useState(true);
  const [quietMode, setQuietMode] = useState(false);

  return (
    <div className={styles.page}>
      <GlassCard className={styles.hero}>
        <div>
          <span className="eyebrow"><Shield size={14} /> Settings</span>
          <h1>Fine-tune how the workspace feels and behaves</h1>
          <p>Built as a simple control surface for handing magnets off to the torrent app on this device.</p>
        </div>
      </GlassCard>

      <div className={styles.sections}>
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <GlassCard className={styles.sectionCard} key={section.title}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Icon size={18} /></div>
                <div>
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
              </div>

              {section.title === "Preferences" ? (
                <div className={styles.toggleGrid}>
                  <button className={styles.toggle} onClick={() => setStreamingPreview((current) => !current)}>
                    <span>Streaming preview</span>
                    <strong>{streamingPreview ? "Enabled" : "Disabled"}</strong>
                  </button>
                  <button className={styles.toggle} onClick={() => setQuietMode((current) => !current)}>
                    <span>Quiet mode</span>
                    <strong>{quietMode ? "On" : "Off"}</strong>
                  </button>
                </div>
              ) : (
                <div className={styles.placeholder}>
                  <span>Not configured</span>
                  <strong>This section is waiting for a future device-level or client integration.</strong>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
