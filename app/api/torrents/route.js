import { NextResponse } from "next/server";
import { getTorrentManager } from "@/utils/server/torrentManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const manager = getTorrentManager();
  return NextResponse.json({ torrents: manager.list() });
}

export async function POST(request) {
  const manager = getTorrentManager();
  const body = await request.json().catch(() => null);
  const magnetLink = body?.magnetLink || "";

  try {
    const torrent = await manager.addMagnet(magnetLink);
    return NextResponse.json({ torrent }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to add torrent." },
      { status: error.statusCode || 500 }
    );
  }
}
