export function formatStorage(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} TB`;
  }

  return `${value.toFixed(1)} GB`;
}

export function getStatusLabel(status) {
  const labels = {
    submitted: "Added",
    connecting: "Connecting",
    waiting: "Waiting",
    downloading: "Downloading",
    paused: "Paused",
    completed: "Completed",
    error: "Error",
    backend_missing: "Backend Missing",
    errored: "Error"
  };

  return labels[status] || "Unknown";
}

export function isValidMagnetLink(link) {
  if (!link || typeof link !== "string") {
    return false;
  }

  return /^magnet:\?xt=urn:btih:/i.test(link.trim());
}

export function extractMagnetName(link) {
  const match = link.match(/[?&]dn=([^&]+)/i);

  if (!match) {
    return "Unnamed Torrent";
  }

  try {
    return decodeURIComponent(match[1].replace(/\+/g, " "));
  } catch (error) {
    return "Unnamed Torrent";
  }
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatBytes(value) {
  if (!value || Number.isNaN(value) || value <= 0) {
    return "Unknown";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatSpeed(value) {
  if (!value || Number.isNaN(value) || value <= 0) {
    return "0 B/s";
  }

  return `${formatBytes(value)}/s`;
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function shortHash(value) {
  if (!value) {
    return "Unknown";
  }

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function clampProgress(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

export function formatDurationMs(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "Calculating";
  }

  const totalSeconds = Math.round(value / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

export function parseMagnetLink(link) {
  const trimmed = link.trim();

  if (!isValidMagnetLink(trimmed)) {
    return null;
  }

  const query = trimmed.replace(/^magnet:\?/i, "");
  const params = new URLSearchParams(query);
  const xt = params.get("xt") || "";
  const infoHash = xt.replace(/^urn:btih:/i, "");
  const name = extractMagnetName(trimmed);
  const sizeBytes = Number(params.get("xl") || 0);
  const trackers = params.getAll("tr");
  const trackerHosts = trackers.map((tracker) => {
    try {
      return new URL(tracker).host || tracker;
    } catch (error) {
      return tracker;
    }
  });

  return {
    name,
    infoHash,
    sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : 0,
    sizeLabel: formatBytes(sizeBytes),
    trackers,
    trackerHosts,
    trackerCount: trackers.length,
    magnetLink: trimmed
  };
}

export function getFileIconHint(name) {
  const lower = name.toLowerCase();

  if (lower.endsWith(".mkv") || lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm") || lower.endsWith(".m4v")) {
    return "video";
  }

  if (lower.endsWith(".flac") || lower.endsWith(".mp3")) {
    return "audio";
  }

  if (lower.endsWith(".zip") || lower.endsWith(".rar") || lower.endsWith(".7z")) {
    return "archive";
  }

  return "file";
}

export function pickPrimaryFile(files) {
  if (!Array.isArray(files) || !files.length) {
    return null;
  }

  const sorted = [...files].sort((first, second) => {
    const firstPriority = first.kind === "video" ? 2 : first.kind === "audio" ? 1 : 0;
    const secondPriority = second.kind === "video" ? 2 : second.kind === "audio" ? 1 : 0;

    if (firstPriority !== secondPriority) {
      return secondPriority - firstPriority;
    }

    return (second.sizeBytes || 0) - (first.sizeBytes || 0);
  });

  return sorted[0] || null;
}
