"use client";

import Link from "next/link";
import { Download, Eye, Pause, Play, Trash2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { formatDateTime } from "@/utils/helpers";
import styles from "@/components/TorrentCard.module.css";

export default function TorrentCard({ torrent, onDelete, onSetPaused }) {
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

        <div className={styles.progressBlock}>
          <div className={styles.progressRow}>
            <span>{torrent.progressPercent}% complete</span>
            <span>{torrent.downloadSpeedLabel}</span>
          </div>
          <div className={styles.progressTrack}>
            <span style={{ width: `${torrent.progressPercent}%` }} />
          </div>
          <div className={styles.metaRow}>
            <span>{torrent.peers} peers</span>
            <span>{torrent.timeRemainingLabel}</span>
            <span>{torrent.downloadedLabel}</span>
          </div>
        </div>

        {torrent.warning ? <p className={styles.notice}>{torrent.warning}</p> : null}
        {torrent.error ? <p className={`${styles.notice} ${styles.error}`}>{torrent.error}</p> : null}

        <div className={styles.actions}>
          {!torrent.error ? (
            <button
              onClick={() => onSetPaused(torrent.id, !torrent.paused)}
              className={styles.secondary}
            >
              {torrent.paused ? <Play size={16} /> : <Pause size={16} />}
              {torrent.paused ? "Resume" : "Pause"}
            </button>
          ) : null}

          {torrent.canStream && torrent.primaryFile ? (
            <a href={torrent.primaryFile.streamHref} target="_blank" rel="noreferrer" className={styles.primary}>
              <Play size={16} />
              Open video
            </a>
          ) : null}

          {torrent.canDownload && torrent.primaryFile ? (
            <a href={torrent.primaryFile.downloadHref} className={styles.secondary} download>
              <Download size={16} />
              Save to device
            </a>
          ) : null}

          <button onClick={() => onDelete(torrent.id)} className={styles.danger}>
            <Trash2 size={16} />
            Delete
          </button>
        </div>

        {!torrent.done ? <p className={styles.notice}>The server is downloading this first. Save it to your device once it finishes.</p> : null}
        {torrent.done ? <p className={styles.notice}>Completed files are kept for about {torrent.retentionHours} hours before automatic cleanup.</p> : null}
      </GlassCard>
    </div>
  );
}
