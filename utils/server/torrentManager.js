import path from "node:path";
import os from "node:os";
import { mkdir, unlink, writeFile } from "node:fs/promises";
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

const LOCAL_DOWNLOAD_ROOT = path.join(process.cwd(), "downloads");
const TEMP_DOWNLOAD_ROOT = path.join(os.tmpdir(), "torrent-by-the-atom-downloads");
const EPHEMERAL_HOST = Boolean(
  process.env.VERCEL ||
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.FUNCTIONS_WORKER_RUNTIME
);

function createId() {
  return randomUUID();
}

function createManagerError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function ensureWritableDirectory(directoryPath) {
  await mkdir(directoryPath, { recursive: true });

  const probeFile = path.join(directoryPath, `.write-test-${createId()}`);
  await writeFile(probeFile, "ok");
  await unlink(probeFile);
}

async function resolveDownloadRoot() {
  const customRoot = process.env.TORRENT_DOWNLOAD_DIR;
  const candidates = [
    customRoot,
    EPHEMERAL_HOST ? TEMP_DOWNLOAD_ROOT : LOCAL_DOWNLOAD_ROOT,
    EPHEMERAL_HOST ? LOCAL_DOWNLOAD_ROOT : TEMP_DOWNLOAD_ROOT
  ].filter(Boolean);

  const failures = [];

  for (const candidate of candidates) {
    try {
      await ensureWritableDirectory(candidate);

      return {
        path: candidate,
        temporary: candidate === TEMP_DOWNLOAD_ROOT
      };
    } catch (error) {
      failures.push(`${candidate}: ${error.code || error.message}`);
    }
  }

  throw createManagerError(
    `No writable download directory is available. Tried: ${failures.join(" | ")}`,
    500
  );
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
    downloadPath: torrent?.path || job.downloadPath || LOCAL_DOWNLOAD_ROOT,
    temporaryStorage: Boolean(job.temporaryStorage)
  };
}

class TorrentManager {
  constructor() {
    this.jobs = new Map();
    this.client = new WebTorrent();
    this.downloadRoot = LOCAL_DOWNLOAD_ROOT;
    this.temporaryStorage = false;
    this.ready = this.prepareDownloadRoot();

    this.client.on("error", (error) => {
      console.error("WebTorrent client error", error);
    });
  }

  async prepareDownloadRoot() {
    const resolved = await resolveDownloadRoot();
    this.downloadRoot = resolved.path;
    this.temporaryStorage = resolved.temporary;
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
      throw createManagerError("The link must start with magnet:?xt=urn:btih:", 400);
    }

    const parsed = parseMagnetLink(magnetLink);

    if (!parsed) {
      throw createManagerError("That magnet link could not be parsed.", 400);
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
      downloadPath: this.downloadRoot,
      temporaryStorage: this.temporaryStorage,
      warning: null,
      error: null,
      torrent: null
    };

    this.jobs.set(job.id, job);

    const torrent = this.client.add(parsed.magnetLink, {
      path: this.downloadRoot,
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
