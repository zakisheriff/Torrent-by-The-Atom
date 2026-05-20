import path from "node:path";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import WebTorrent from "webtorrent";
import {
  clampProgress,
  formatBytes,
  formatDurationMs,
  formatSpeed,
  getFileIconHint,
  getStatusLabel,
  isValidMagnetLink,
  parseMagnetLink,
  pickPrimaryFile
} from "@/utils/helpers";

const DOWNLOAD_ROOT = path.join(process.cwd(), "downloads");

function createId() {
  return randomUUID();
}

function deriveStatus(job) {
  if (job.error) {
    return "error";
  }

  if (job.torrent?.paused) {
    return "paused";
  }

  if (job.torrent?.done) {
    return "completed";
  }

  if (job.torrent?.progress > 0 || job.torrent?.downloaded > 0) {
    return "downloading";
  }

  if (job.status === "waiting") {
    return "waiting";
  }

  return job.status || "connecting";
}

function serializeFile(job, file, index) {
  const progress = clampProgress(file.progress ?? 0);

  return {
    index,
    name: file.name,
    path: file.path,
    kind: getFileIconHint(file.name),
    sizeBytes: file.length,
    sizeLabel: formatBytes(file.length),
    progress,
    progressPercent: Math.round(progress * 100),
    streamHref: `/api/torrents/${job.id}/files/${index}`,
    downloadHref: `/api/torrents/${job.id}/files/${index}?download=1`
  };
}

function serializeJob(job) {
  const torrent = job.torrent;
  const files = torrent?.files?.map((file, index) => serializeFile(job, file, index)) || [];
  const primaryFile = pickPrimaryFile(files);
  const progress = clampProgress(torrent?.progress ?? 0);
  const sizeBytes = torrent?.length || job.sizeBytes || 0;
  const status = deriveStatus(job);
  const done = Boolean(torrent?.done);
  const showDeviceActions = done && Boolean(primaryFile);
  const paused = Boolean(torrent?.paused);

  return {
    id: job.id,
    magnetLink: job.magnetLink,
    name: torrent?.name || job.name || "Fetching torrent metadata",
    infoHash: torrent?.infoHash || job.infoHash || null,
    status,
    statusLabel: getStatusLabel(status),
    progress,
    progressPercent: Math.round(progress * 100),
    sizeBytes,
    sizeLabel: formatBytes(sizeBytes),
    downloadedBytes: torrent?.downloaded || 0,
    downloadedLabel: formatBytes(torrent?.downloaded || 0),
    downloadSpeed: torrent?.downloadSpeed || 0,
    downloadSpeedLabel: formatSpeed(torrent?.downloadSpeed || 0),
    uploadSpeed: torrent?.uploadSpeed || 0,
    uploadSpeedLabel: formatSpeed(torrent?.uploadSpeed || 0),
    peers: torrent?.numPeers || 0,
    trackerCount: torrent?.announce?.length || job.trackerCount || 0,
    createdAt: job.createdAt,
    completedAt: job.completedAt || null,
    ready: Boolean(torrent?.ready),
    done,
    paused,
    warning: job.warning || null,
    error: job.error || null,
    timeRemainingMs: Number.isFinite(torrent?.timeRemaining) ? torrent.timeRemaining : null,
    timeRemainingLabel: paused ? "Paused" : done ? "Ready" : formatDurationMs(torrent?.timeRemaining),
    files,
    primaryFile,
    canDownload: showDeviceActions,
    canStream: showDeviceActions ? primaryFile.kind === "video" || primaryFile.kind === "audio" : false,
    canPause: !paused,
    canResume: paused,
    downloadPath: torrent?.path || DOWNLOAD_ROOT
  };
}

class TorrentManager {
  constructor() {
    this.jobs = new Map();
    this.client = new WebTorrent();
    this.ready = mkdir(DOWNLOAD_ROOT, { recursive: true });

    this.client.on("error", (error) => {
      console.error("WebTorrent client error", error);
    });
  }

  list() {
    return [...this.jobs.values()]
      .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
      .map((job) => serializeJob(job));
  }

  get(id) {
    const job = this.jobs.get(id);
    return job ? serializeJob(job) : null;
  }

  getRaw(id) {
    return this.jobs.get(id) || null;
  }

  async addMagnet(magnetLink) {
    await this.ready;

    if (!isValidMagnetLink(magnetLink)) {
      throw new Error("The link must start with magnet:?xt=urn:btih:");
    }

    const parsed = parseMagnetLink(magnetLink);

    if (!parsed) {
      throw new Error("That magnet link could not be parsed.");
    }

    const duplicate = [...this.jobs.values()].find((job) => job.infoHash?.toLowerCase() === parsed.infoHash.toLowerCase());

    if (duplicate) {
      return serializeJob(duplicate);
    }

    const job = {
      id: createId(),
      createdAt: new Date().toISOString(),
      completedAt: null,
      status: "connecting",
      magnetLink: parsed.magnetLink,
      name: parsed.name,
      infoHash: parsed.infoHash.toLowerCase(),
      sizeBytes: parsed.sizeBytes || 0,
      trackerCount: parsed.trackerCount || 0,
      warning: null,
      error: null,
      torrent: null
    };

    this.jobs.set(job.id, job);

    const torrent = this.client.add(parsed.magnetLink, {
      path: DOWNLOAD_ROOT,
      strategy: "sequential"
    });

    job.torrent = torrent;

    torrent.on("metadata", () => {
      job.status = "downloading";
      job.name = torrent.name || job.name;
      job.infoHash = (torrent.infoHash || job.infoHash).toLowerCase();
      job.sizeBytes = torrent.length || job.sizeBytes;
      job.trackerCount = torrent.announce?.length || job.trackerCount;
    });

    torrent.on("ready", () => {
      if (!torrent.done) {
        job.status = "downloading";
      }
    });

    torrent.on("download", () => {
      if (!torrent.done) {
        job.status = "downloading";
      }
    });

    torrent.on("done", () => {
      job.status = "completed";
      job.completedAt = new Date().toISOString();
      job.warning = null;
    });

    torrent.on("warning", (error) => {
      job.warning = error.message;

      if (job.status === "connecting") {
        job.status = "waiting";
      }
    });

    torrent.on("noPeers", (announceType) => {
      job.warning = announceType
        ? `No peers available through ${announceType} yet.`
        : "No peers available yet.";

      if (!torrent.done && torrent.downloaded === 0) {
        job.status = "waiting";
      }
    });

    torrent.on("error", (error) => {
      job.error = error.message;
      job.status = "error";
    });

    return serializeJob(job);
  }

  async remove(id) {
    const job = this.jobs.get(id);

    if (!job) {
      return false;
    }

    if (job.torrent) {
      await this.client.remove(job.torrent, { destroyStore: true });
    }

    this.jobs.delete(id);
    return true;
  }

  setPaused(id, paused) {
    const job = this.jobs.get(id);

    if (!job?.torrent) {
      return null;
    }

    if (paused) {
      job.torrent.pause();
      job.status = "paused";
    } else {
      job.torrent.resume();
      job.status = job.torrent.done ? "completed" : "downloading";
    }

    return serializeJob(job);
  }

  getFile(id, index) {
    const job = this.jobs.get(id);

    if (!job || !job.torrent?.files?.length) {
      return null;
    }

    const file = job.torrent.files[index];

    if (!file) {
      return null;
    }

    return {
      job,
      torrent: job.torrent,
      file
    };
  }
}

export function getTorrentManager() {
  if (!globalThis.__atomTorrentManager) {
    globalThis.__atomTorrentManager = new TorrentManager();
  }

  return globalThis.__atomTorrentManager;
}
