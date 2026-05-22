"use client";

import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import TorrentCard from "@/components/TorrentCard";
import { useTorrents } from "@/components/providers/TorrentProvider";
import styles from "@/app/torrents/page.module.css";

export default function TorrentsPage() {
  const { torrents, loading, deleteTorrent, openTorrent } = useTorrents();

  return (
    <div className={styles.page}>
      <GlassCard className={styles.hero}>
        <div>
          <h1>Your magnet links</h1>
          <p>Every magnet saved in this browser appears here so you can reopen it on your device when you need it.</p>
        </div>
        <span className="pill">{torrents.length} total</span>
      </GlassCard>

      <div className={styles.list}>
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
          <EmptyState title={loading ? "Loading links" : "No torrents yet"} description={loading ? "Loading your browser library." : "Paste a magnet link on the dashboard to open it on this device."} />
        )}
      </div>
    </div>
  );
}
