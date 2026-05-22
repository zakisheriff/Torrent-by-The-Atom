"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Copy, ExternalLink, Trash2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { useTorrents } from "@/components/providers/TorrentProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { formatDateTime, shortHash } from "@/utils/helpers";
import styles from "@/components/TorrentDetailsView.module.css";

function AccordionSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <GlassCard className={styles.accordion}>
      <button className={styles.accordionTrigger} onClick={() => setOpen((current) => !current)}>
        <span>{title}</span>
        <ChevronDown size={18} className={open ? styles.rotate : ""} />
      </button>
      {open ? <div className={styles.accordionContent}>{children}</div> : null}
    </GlassCard>
  );
}

export default function TorrentDetailsView({ id }) {
  const { getTorrentById, loading, openTorrent, deleteTorrent } = useTorrents();
  const { showToast } = useToast();
  const torrent = getTorrentById(id);

  if (!torrent && loading) {
    return (
      <div className={styles.missing}>
        <GlassCard className={styles.missingCard}>
          <div className={styles.missingBody}>
            <p className={styles.missingEyebrow}>Loading</p>
            <h1>Checking your magnet</h1>
            <p>We&apos;re looking for this magnet in the current browser session.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (!torrent) {
    return (
      <div className={styles.missing}>
        <GlassCard className={styles.missingCard}>
          <div className={styles.missingBody}>
            <p className={styles.missingEyebrow}>Magnet not found</p>
            <h1>This link is not saved in this browser</h1>
            <p>The requested magnet is no longer available in the current local library.</p>
            <p className={styles.missingHint}>
              Add the magnet again on the dashboard and we&apos;ll reopen it on this device.
            </p>
          </div>
          <Link href="/torrents">Back to library</Link>
        </GlassCard>
      </div>
    );
  }

  const copyMagnet = async () => {
    try {
      await navigator.clipboard.writeText(torrent.magnetLink);
      showToast({
        title: "Magnet copied",
        description: "The full magnet link was copied to your clipboard.",
        variant: "success"
      });
    } catch (error) {
      showToast({
        title: "Copy failed",
        description: "Clipboard access was not available in this browser session.",
        variant: "warning"
      });
    }
  };

  return (
    <div className={styles.page}>
      <GlassCard className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1>{torrent.name}</h1>
          <p>{torrent.statusLabel} • Added {formatDateTime(torrent.createdAt)}</p>

          <div className={styles.heroMeta}>
            <div className={styles.metric}>
              <span>Size</span>
              <strong>{torrent.sizeLabel}</strong>
            </div>
            <div className={styles.metric}>
              <span>Trackers</span>
              <strong>{torrent.trackerCount}</strong>
            </div>
            <div className={styles.metric}>
              <span>Info hash</span>
              <strong>{shortHash(torrent.infoHash)}</strong>
            </div>
            <div className={styles.metric}>
              <span>Last opened</span>
              <strong>{torrent.lastOpenedAt ? formatDateTime(torrent.lastOpenedAt) : "Not yet"}</strong>
            </div>
          </div>

          <div className={styles.fileLine}>
            <span>How this works</span>
            <strong>We hand the magnet to your installed torrent app, and your device handles the actual download.</strong>
          </div>

          <p className={styles.notice}>If nothing opens, make sure a torrent app is installed on this phone or laptop, then tap the open button again.</p>

          <div className={styles.actions}>
            <button onClick={() => openTorrent(torrent.id)}>
              <ExternalLink size={16} />
              Open in torrent app
            </button>

            <Link href="/torrents" onClick={() => deleteTorrent(torrent.id)} className={styles.secondary}>
              <Trash2 size={16} />
              Delete from library
            </Link>
          </div>
        </div>
      </GlassCard>

      <AccordionSection title="More details">
        <div className={styles.detailsGrid}>
          <div className={styles.metaCard}>
            <span>Info hash</span>
            <strong>{shortHash(torrent.infoHash)}</strong>
          </div>
          <div className={styles.metaCard}>
            <span>Trackers</span>
            <strong>{torrent.trackerCount}</strong>
          </div>
          <div className={styles.metaCard}>
            <span>Primary host</span>
            <strong>{torrent.trackerHosts[0] || "Unknown"}</strong>
          </div>
          <button onClick={copyMagnet} className={styles.copyButton}>
            <Copy size={16} />
            Copy magnet link
          </button>
        </div>
      </AccordionSection>
    </div>
  );
}
