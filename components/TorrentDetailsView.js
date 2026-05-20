"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Copy, Download, Pause, Play } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { useTorrents } from "@/components/providers/TorrentProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { shortHash } from "@/utils/helpers";
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
  const { getTorrentById, loading, setTorrentPaused } = useTorrents();
  const { showToast } = useToast();
  const [serverTorrent, setServerTorrent] = useState(null);
  const [lookupState, setLookupState] = useState("idle");
  const [lookupMessage, setLookupMessage] = useState("");
  const cachedTorrent = getTorrentById(id);
  const torrent = cachedTorrent || serverTorrent;

  useEffect(() => {
    if (cachedTorrent) {
      setServerTorrent(null);
      setLookupState("ready");
      setLookupMessage("");
      return;
    }

    if (loading) {
      return;
    }

    let cancelled = false;

    const loadTorrent = async () => {
      setLookupState("loading");
      setLookupMessage("");

      try {
        const response = await fetch(`/api/torrents/${id}`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));

        if (cancelled) {
          return;
        }

        if (response.ok && data.torrent) {
          setServerTorrent(data.torrent);
          setLookupState("ready");
          return;
        }

        setServerTorrent(null);
        setLookupState(response.status === 404 ? "missing" : "error");
        setLookupMessage(data.error || "The download could not be loaded.");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setServerTorrent(null);
        setLookupState("error");
        setLookupMessage(error.message || "The download could not be loaded.");
      }
    };

    loadTorrent();

    return () => {
      cancelled = true;
    };
  }, [cachedTorrent, id, loading]);

  if (!torrent && (loading || lookupState === "idle" || lookupState === "loading")) {
    return (
      <div className={styles.missing}>
        <GlassCard className={styles.missingCard}>
          <div className={styles.missingBody}>
            <p className={styles.missingEyebrow}>Loading</p>
            <h1>Checking your download</h1>
            <p>We&apos;re looking for this torrent in the current downloader session.</p>
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
            <p className={styles.missingEyebrow}>Download not found</p>
            <h1>This download is no longer active here</h1>
            <p>{lookupMessage || "The requested torrent is not available in the current session."}</p>
            <p className={styles.missingHint}>
              On hosted deployments, real torrent jobs need a persistent Node server with writable storage. Serverless hosts lose the active download between requests.
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
          <p>{torrent.statusLabel} • {torrent.progressPercent}% complete</p>

          <div className={styles.heroMeta}>
            <div className={styles.metric}>
              <span>Speed</span>
              <strong>{torrent.downloadSpeedLabel}</strong>
            </div>
            <div className={styles.metric}>
              <span>Size</span>
              <strong>{torrent.sizeLabel}</strong>
            </div>
            <div className={styles.metric}>
              <span>Time left</span>
              <strong>{torrent.timeRemainingLabel}</strong>
            </div>
            <div className={styles.metric}>
              <span>Peers</span>
              <strong>{torrent.peers}</strong>
            </div>
          </div>

          <div className={styles.progressTrack}>
            <span style={{ width: `${torrent.progressPercent}%` }} />
          </div>

          {torrent.primaryFile ? (
            <div className={styles.fileLine}>
              <span>File</span>
              <strong>{torrent.primaryFile.name}</strong>
            </div>
          ) : null}

          {torrent.warning ? <p className={styles.notice}>{torrent.warning}</p> : null}
          {torrent.error ? <p className={`${styles.notice} ${styles.error}`}>{torrent.error}</p> : null}
          {!torrent.done ? <p className={styles.notice}>This server downloads the torrent first, then offers the final save-to-device step when it finishes.</p> : null}
          {torrent.done ? <p className={styles.notice}>Completed files stay on the server for about {torrent.retentionHours} hours, then they are deleted automatically.</p> : null}

          <div className={styles.actions}>
            {!torrent.error ? (
              <button
                onClick={() => setTorrentPaused(torrent.id, !torrent.paused)}
                className={styles.secondary}
              >
                {torrent.paused ? <Play size={16} /> : <Pause size={16} />}
                {torrent.paused ? "Resume" : "Pause"}
              </button>
            ) : null}

            {torrent.canStream && torrent.primaryFile ? (
              <a href={torrent.primaryFile.streamHref} target="_blank" rel="noreferrer">
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
            <span>Downloaded</span>
            <strong>{torrent.downloadedLabel}</strong>
          </div>
          <div className={styles.metaCard}>
            <span>Saved to</span>
            <strong>{torrent.downloadPath}</strong>
          </div>
          <button onClick={copyMagnet} className={styles.copyButton}>
            <Copy size={16} />
            Copy magnet link
          </button>
        </div>

        {torrent.files.length ? (
          <div className={styles.fileList}>
            {torrent.files.map((file) => (
              <div key={`${file.index}-${file.name}`} className={styles.fileRow}>
                <div>
                  <strong>{file.name}</strong>
                  <span>{file.sizeLabel} • {file.progressPercent}%</span>
                </div>
                {torrent.done ? <a href={file.downloadHref} download>Save</a> : null}
              </div>
            ))}
          </div>
        ) : null}
      </AccordionSection>
    </div>
  );
}
