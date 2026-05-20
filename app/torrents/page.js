"use client";

import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import TorrentCard from "@/components/TorrentCard";
import { useTorrents } from "@/components/providers/TorrentProvider";
import styles from "@/app/torrents/page.module.css";

export default function TorrentsPage() {
  const { torrents, loading, deleteTorrent, setTorrentPaused } = useTorrents();

  return (
    <div className={styles.page}>
      <GlassCard className={styles.hero}>
        <div>
          <h1>Your downloads</h1>
          <p>Every torrent in this session appears here with live progress and file actions.</p>
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
              onSetPaused={setTorrentPaused}
            />
          ))
        ) : (
          <EmptyState title={loading ? "Loading downloads" : "No torrents yet"} description={loading ? "Fetching the current torrent list." : "Paste a magnet link on the dashboard to start a download."} />
        )}
      </div>
    </div>
  );
}
