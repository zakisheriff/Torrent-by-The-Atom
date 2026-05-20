"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { formatBytes, isValidMagnetLink } from "@/utils/helpers";
import { useToast } from "@/components/providers/ToastProvider";

const TorrentContext = createContext(null);
const POLL_INTERVAL = 2500;

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return data;
}

export function TorrentProvider({ children }) {
  const [torrents, setTorrents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const refreshTorrents = async ({ silent = false } = {}) => {
    try {
      const data = await parseJson(await fetch("/api/torrents", { cache: "no-store" }));
      setTorrents(data.torrents || []);
    } catch (error) {
      if (!silent) {
        showToast({
          title: "Could not refresh downloads",
          description: error.message || "The torrent list could not be loaded.",
          variant: "warning"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTorrents();

    const interval = window.setInterval(() => {
      refreshTorrents({ silent: true });
    }, POLL_INTERVAL);

    return () => window.clearInterval(interval);
  }, []);

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

    try {
      const data = await parseJson(await fetch("/api/torrents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ magnetLink })
      }));

      await refreshTorrents({ silent: true });
      showToast({
        title: "Download started",
        description: `${data.torrent.name} has been added to the downloader.`,
        variant: "success"
      });
      return data.torrent;
    } catch (error) {
      showToast({
        title: error.status === 503
          ? "This host cannot run torrent downloads"
          : error.status === 507
            ? "Server storage is full"
            : "Could not start download",
        description: error.status === 503
          ? error.message || "Run this app on a persistent Node server with writable storage."
          : error.status === 507
            ? error.message || "Older files need to expire before this download can start."
            : error.message || "The torrent could not be added.",
        variant: "warning"
      });
      return false;
    }
  };

  const deleteTorrent = async (id) => {
    try {
      await parseJson(await fetch(`/api/torrents/${id}`, {
        method: "DELETE"
      }));
      setTorrents((current) => current.filter((torrent) => torrent.id !== id));
      showToast({
        title: "Download removed",
        description: "The torrent and its downloaded files were removed."
      });
    } catch (error) {
      showToast({
        title: "Could not remove download",
        description: error.message || "The torrent could not be removed.",
        variant: "warning"
      });
    }
  };

  const setTorrentPaused = async (id, paused) => {
    try {
      const data = await parseJson(await fetch(`/api/torrents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: paused ? "pause" : "resume" })
      }));

      setTorrents((current) => current.map((torrent) => (
        torrent.id === id ? data.torrent : torrent
      )));

      showToast({
        title: paused ? "Download paused" : "Download resumed",
        description: paused
          ? "The torrent is paused, including background transfer activity."
          : "The torrent has resumed downloading and seeding."
      });
    } catch (error) {
      showToast({
        title: paused ? "Could not pause" : "Could not resume",
        description: error.message || "The torrent state could not be changed.",
        variant: "warning"
      });
    }
  };

  const getTorrentById = (id) => {
    return torrents.find((item) => item.id === id) || null;
  };

  const stats = useMemo(() => {
    const totalKnownBytes = torrents.reduce((sum, torrent) => sum + (torrent.sizeBytes || 0), 0);
    const activeCount = torrents.filter((torrent) => torrent.status === "downloading" || torrent.status === "connecting" || torrent.status === "waiting").length;
    const completedCount = torrents.filter((torrent) => torrent.status === "completed").length;

    return {
      queueCount: torrents.length,
      activeCount,
      completedCount,
      knownSizeLabel: formatBytes(totalKnownBytes)
    };
  }, [torrents]);

  const value = useMemo(() => ({
    torrents,
    loading,
    stats,
    refreshTorrents,
    addTorrent,
    deleteTorrent,
    setTorrentPaused,
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
