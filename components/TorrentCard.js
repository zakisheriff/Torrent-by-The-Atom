"use client";

import Link from "next/link";
import { Eye, ExternalLink, Trash2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { formatDateTime } from "@/utils/helpers";
import styles from "@/components/TorrentCard.module.css";

export default function TorrentCard({ torrent, onDelete, onOpen }) {
  return (
    <div className={styles.motionWrap}>
      <GlassCard className={styles.card}>
        <div className={styles.top}>
          <div className={styles.copy}>
            <div className={styles.nameRow}>
              <h3>{torrent.name}</h3>
              <span className={`${styles.status} ${styles[torrent.status] || ""}`}>{torrent.statusLabel}</span>
            </div>
            <p>{torrent.sizeLabel} • Added {formatDateTime(torrent.createdAt)}</p>
          </div>
          <Link href={`/torrent/${torrent.id}`} className={styles.view}>
            <Eye size={16} />
            <span>View</span>
          </Link>
        </div>

        <div className={styles.metaRow}>
          <span>{torrent.trackerCount} trackers</span>
          <span>{torrent.infoHash ? `${torrent.infoHash.slice(0, 8)}...` : "Unknown hash"}</span>
          <span>{torrent.lastOpenedAt ? `Opened ${formatDateTime(torrent.lastOpenedAt)}` : "Not opened yet"}</span>
        </div>

        <div className={styles.actions}>
          <button onClick={() => onOpen(torrent.id)} className={styles.primary}>
            <ExternalLink size={16} />
            Open in torrent app
          </button>

          <button onClick={() => onDelete(torrent.id)} className={styles.danger}>
            <Trash2 size={16} />
            Delete
          </button>
        </div>

        <p className={styles.notice}>Your torrent app on this device handles the real download. This page only keeps the magnet handy in this browser.</p>
      </GlassCard>
    </div>
  );
}
