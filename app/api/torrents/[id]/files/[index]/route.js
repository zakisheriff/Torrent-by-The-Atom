import { getTorrentManager } from "@/utils/server/torrentManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseRangeHeader(rangeHeader, size) {
  if (!rangeHeader || !rangeHeader.startsWith("bytes=")) {
    return null;
  }

  const [rawStart, rawEnd] = rangeHeader.replace("bytes=", "").split("-");
  const start = Number.parseInt(rawStart, 10);
  const end = Number.parseInt(rawEnd, 10);

  if (Number.isNaN(start)) {
    return null;
  }

  const normalizedEnd = Number.isNaN(end) ? size - 1 : Math.min(end, size - 1);

  if (start < 0 || start > normalizedEnd) {
    return null;
  }

  return {
    start,
    end: normalizedEnd
  };
}

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const manager = getTorrentManager();
  const fileRecord = manager.getFile(resolvedParams.id, Number.parseInt(resolvedParams.index, 10));

  if (!fileRecord) {
    return new Response("File not found.", { status: 404 });
  }

  const { file } = fileRecord;
  const range = parseRangeHeader(request.headers.get("range"), file.length);
  const stream = file.stream(range || undefined);
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Content-Type": file.type || "application/octet-stream",
    "Content-Disposition": `${
      new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline"
    }; filename*=UTF-8''${encodeURIComponent(file.name)}`
  });

  let status = 200;

  if (range) {
    status = 206;
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${file.length}`);
    headers.set("Content-Length", String(range.end - range.start + 1));
  } else {
    headers.set("Content-Length", String(file.length));
  }

  if (request.method === "HEAD") {
    return new Response(null, { status, headers });
  }

  return new Response(stream, { status, headers });
}
