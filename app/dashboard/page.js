"use client";

import { useState } from "react";
import { ArrowRight, Link2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import TorrentCard from "@/components/TorrentCard";
import { useTorrents } from "@/components/providers/TorrentProvider";
import styles from "@/app/dashboard/page.module.css";

export default function DashboardPage() {
  const [magnet, setMagnet] = useState("");
  const { torrents, loading, addTorrent, deleteTorrent, setTorrentPaused } = useTorrents();

  const handleSubmit = async () => {
    if (await addTorrent(magnet)) {
      setMagnet("");
    }
  };

  return (
    <div className={styles.page}>
      <GlassCard className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1>Paste a magnet link</h1>
          <p>Start the torrent, watch the progress, and open the file when it is ready.</p>
        </div>

        <div className={styles.inputCard}>
          <div className={styles.inputWrap}>
            <Link2 size={18} />
            <input
              value={magnet}
              onChange={(event) => setMagnet(event.target.value)}
              placeholder="magnet:?xt=urn:btih:..."
            />
          </div>
          <button className={styles.primaryButton} onClick={handleSubmit}>
            <span>Start download</span>
            <ArrowRight size={18} />
          </button>
        </div>

        <p className={styles.helper}>
          Downloads are stored on this machine in the project&apos;s <code>downloads</code> folder while the app is running.
        </p>
      </GlassCard>

      <section className={styles.queueSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Your links</h2>
            <p>{torrents.length ? `${torrents.length} ${torrents.length === 1 ? "download" : "downloads"} in this workspace` : loading ? "Loading downloads..." : "Nothing added yet."}</p>
          </div>
        </div>

        <div className={styles.torrentList}>
          {torrents.length ? (
            torrents.map((torrent) => (
              <TorrentCard
                key={torrent.id}
                torrent={torrent}
                onDelete={deleteTorrent}
                onSetPaused={setTorrentPaused}
              />
            ))
          ) : (
            <EmptyState
              title="Paste your first magnet link"
              description="Once you add one, it will appear here in a clean list."
            />
          )}
        </div>
      </section>
    </div>
  );
}
