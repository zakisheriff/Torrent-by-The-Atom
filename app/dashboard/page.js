"use client";

import { useState, useRef } from "react";
import { ArrowRight, Link2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import TorrentCard from "@/components/TorrentCard";
import { useTorrents } from "@/components/providers/TorrentProvider";
import styles from "@/app/dashboard/page.module.css";

export default function DashboardPage() {
  const [magnet, setMagnet] = useState("");
  const { torrents, loading, addTorrent, deleteTorrent, openTorrent } = useTorrents();
  const inputRef = useRef(null);

  const handleSubmit = async () => {
    if (!magnet.trim()) return;
    if (await addTorrent(magnet)) {
      setMagnet("");
    }
  };

  const handleContainerClick = (e) => {
    if (e.target.tagName !== "BUTTON" && !e.target.closest("button")) {
      inputRef.current?.focus();
    }
  };

  return (
    <div className={styles.page}>
      <GlassCard className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1>Paste a magnet link</h1>
          <p>Send it straight to the torrent app on this device and let the download happen there.</p>
        </div>

        <div className={styles.inputCard} onClick={handleContainerClick}>
          <div className={styles.inputWrap}>
            <Link2 size={18} />
            <input
              ref={inputRef}
              value={magnet}
              onChange={(event) => setMagnet(event.target.value)}
              placeholder="magnet:?xt=urn:btih:..."
            />
          </div>
          <button className={styles.primaryButton} onClick={handleSubmit}>
            <span>Open on device</span>
            <ArrowRight size={18} />
          </button>
        </div>

        <p className={styles.helper}>
          This site keeps a clean local library of your magnets in this browser and hands each link off to your installed torrent app.
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
                onOpen={openTorrent}
              />
            ))
          ) : (
            <EmptyState
              title="Paste your first magnet link"
              description="Once you add one, it will appear here so you can reopen it on this device anytime."
            />
          )}
        </div>
      </section>
    </div>
  );
}
