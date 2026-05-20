import { NextResponse } from "next/server";
import { getTorrentManager } from "@/utils/server/torrentManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { id } = await params;
  const manager = getTorrentManager();
  const torrent = manager.get(id);

  if (!torrent) {
    return NextResponse.json({ error: "Torrent not found." }, { status: 404 });
  }

  return NextResponse.json({ torrent });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const manager = getTorrentManager();
  const removed = await manager.remove(id);

  if (!removed) {
    return NextResponse.json({ error: "Torrent not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const manager = getTorrentManager();

  if (!body?.action || !["pause", "resume"].includes(body.action)) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const torrent = manager.setPaused(id, body.action === "pause");

  if (!torrent) {
    return NextResponse.json({ error: "Torrent not found." }, { status: 404 });
  }

  return NextResponse.json({ torrent });
}
