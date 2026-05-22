"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { formatBytes, isValidMagnetLink, parseMagnetLink } from "@/utils/helpers";
import { useToast } from "@/components/providers/ToastProvider";

const TorrentContext = createContext(null);
const STORAGE_KEY = "torrent-by-the-atom.magnets";

function getStatusLabel(status) {
  const labels = {
    ready: "Ready",
    opened: "Sent to app"
  };

  return labels[status] || "Ready";
}

function buildTorrentRecord(magnetLink) {
  const parsed = parseMagnetLink(magnetLink);

  if (!parsed) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    magnetLink: parsed.magnetLink,
    name: parsed.name,
    infoHash: parsed.infoHash,
    sizeBytes: parsed.sizeBytes,
    sizeLabel: parsed.sizeLabel,
    trackers: parsed.trackers,
    trackerHosts: parsed.trackerHosts,
    trackerCount: parsed.trackerCount,
    createdAt: new Date().toISOString(),
    lastOpenedAt: null,
    status: "ready",
    statusLabel: getStatusLabel("ready")
  };
}

function launchMagnet(magnetLink) {
  const anchor = document.createElement("a");
  anchor.href = magnetLink;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function TorrentProvider({ children }) {
  const [torrents, setTorrents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        setTorrents([]);
        return;
      }

      const parsed = JSON.parse(raw);
      setTorrents(Array.isArray(parsed) ? parsed : []);
    } catch {
      setTorrents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(torrents));
  }, [loading, torrents]);

  const addTorrent = async (magnetLink) => {
    if (!magnetLink.trim()) {
      showToast({
        title: "Magnet link required",
        description: "Paste a valid magnet link before continuing.",
        variant: "warning"
      });
      return false;
    }

    if (!isValidMagnetLink(magnetLink)) {
      showToast({
        title: "Invalid magnet link",
        description: "The link must start with magnet:?xt=urn:btih:",
        variant: "warning"
      });
      return false;
    }

    const existing = torrents.find((torrent) => torrent.magnetLink === magnetLink.trim());

    if (existing) {
      launchMagnet(existing.magnetLink);
      showToast({
        title: "Opening torrent app",
        description: "This magnet was already in your library, so we reopened it on your device.",
        variant: "success"
      });
      return existing;
    }

    const record = buildTorrentRecord(magnetLink);

    if (!record) {
      showToast({
        title: "Could not read magnet",
        description: "The magnet link could not be parsed correctly.",
        variant: "warning"
      });
      return false;
    }

    const openedRecord = {
      ...record,
      status: "opened",
      statusLabel: getStatusLabel("opened"),
      lastOpenedAt: new Date().toISOString()
    };

    setTorrents((current) => [openedRecord, ...current]);
    launchMagnet(openedRecord.magnetLink);

    showToast({
      title: "Opening torrent app",
      description: `${openedRecord.name} was handed off to your device.`,
      variant: "success"
    });

    return openedRecord;
  };

  const deleteTorrent = async (id) => {
    setTorrents((current) => current.filter((torrent) => torrent.id !== id));
    showToast({
      title: "Removed from library",
      description: "The magnet link was removed from this browser."
    });
  };

  const openTorrent = async (id) => {
    const torrent = torrents.find((item) => item.id === id);

    if (!torrent) {
      showToast({
        title: "Link not found",
        description: "This magnet is no longer in the current browser library.",
        variant: "warning"
      });
      return false;
    }

    launchMagnet(torrent.magnetLink);
    setTorrents((current) => current.map((item) => (
      item.id === id
        ? {
            ...item,
            status: "opened",
            statusLabel: getStatusLabel("opened"),
            lastOpenedAt: new Date().toISOString()
          }
        : item
    )));

    showToast({
      title: "Opening torrent app",
      description: "If a torrent app is installed, your device should handle the magnet now.",
      variant: "success"
    });

    return true;
  };

  const getTorrentById = (id) => torrents.find((item) => item.id === id) || null;

  const stats = useMemo(() => {
    const totalKnownBytes = torrents.reduce((sum, torrent) => sum + (torrent.sizeBytes || 0), 0);

    return {
      queueCount: torrents.length,
      totalKnownBytes,
      knownSizeLabel: formatBytes(totalKnownBytes)
    };
  }, [torrents]);

  const value = useMemo(() => ({
    torrents,
    loading,
    stats,
    addTorrent,
    deleteTorrent,
    openTorrent,
    getTorrentById
  }), [torrents, loading, stats]);

  return <TorrentContext.Provider value={value}>{children}</TorrentContext.Provider>;
}

export function useTorrents() {
  const context = useContext(TorrentContext);

  if (!context) {
    throw new Error("useTorrents must be used within TorrentProvider");
  }

  return context;
}
