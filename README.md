# Torrent by The Atom

Frontend for `torrent.theatom.lk`, built with Next.js 15 App Router, CSS Modules, Framer Motion, and Lucide React.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js 15 App Router
- React 19
- CSS Modules
- Framer Motion
- Lucide React

## Included Pages

- Landing page
- Dashboard
- Torrents
- Torrent details
- Settings
- Custom 404

## Notes

- The interface is intentionally free to use, with no payment or subscription flow.
- Torrent downloads run through a real WebTorrent backend in Node.js.
- For deployed environments, set `TORRENT_DOWNLOAD_DIR` to a writable persistent directory when needed.
- Serverless and ephemeral hosts are not ideal for long-running torrent downloads.
