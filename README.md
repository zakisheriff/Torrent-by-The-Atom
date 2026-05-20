# <div align="center">Torrent by The Atom</div>

<div align="center">
<strong>100% Free, Self-Hosted Torrent Downloader</strong>
</div>

<br />

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=white)
![WebTorrent](https://img.shields.io/badge/WebTorrent-2.8-22c55e?style=for-the-badge&logo=webtorrent&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

<br />

<a href="https://torrent.theatom.lk">
<img src="https://img.shields.io/badge/View%20Live%20Site-Click%20Here-0071e3?style=for-the-badge&logo=safari&logoColor=white" height="50" />
</a>

<br />
<br />

**[Visit Live Site: https://torrent.theatom.lk](https://torrent.theatom.lk)**

</div>

<br />

> **"A torrent workflow should feel simple, fast, and beautiful."**
>
> Torrent by The Atom is a free self-hosted downloader built for people who just want one clean flow:  
> paste a magnet link, watch progress, and save the finished file.

---

## 🌟 Vision

Torrent by The Atom is built to be:

- **A completely free torrent experience** with no payment walls, subscriptions, or locked features
- **A real self-hosted downloader** powered by WebTorrent on the server side
- **A polished dark interface** that feels premium, focused, and easy to use on both desktop and mobile

---

## ✨ Why Torrent by The Atom?

Most torrent tools either feel old, cluttered, or technically overwhelming.  
Torrent by The Atom reduces the experience to the few things users actually care about:

- the file name
- current speed
- progress
- peers
- time left
- a final save-to-device action when the torrent is complete

---

## 🎨 Product Design

- **Human-Led Interface**
  Clean spacing, minimal chrome, and no noisy admin-style dashboard clutter.

- **Dark Premium Look**
  Built around deep blacks, soft borders, glassy surfaces, and smooth gradients.

- **35px Rounded Language**
  The entire interface uses a soft high-radius system for a calm, cohesive look.

- **Mobile-First Behavior**
  Responsive layouts, touch-friendly actions, and a drawer-based navigation pattern.

---

## ⚙️ Real Download Engine

- **WebTorrent Backend**
  Torrent downloads run through a real Node.js WebTorrent engine, not a fake progress simulator.

- **Live Status Tracking**
  The app exposes actual progress, peers, speed, and ETA through Next.js route handlers.

- **Pause / Resume**
  Users can pause downloading and seeding, then resume later.

- **Save-to-Device Flow**
  Files are downloaded by the website first, then offered to the browser only after completion.

---

## 🎯 Core Features

✅ **Paste Magnet Link** — Start a torrent in one action  
✅ **Real Progress** — Live percentage, speed, peers, and time left  
✅ **Pause / Resume** — Stop and continue downloads and seeding  
✅ **Minimal Detail View** — Essential information only, with extras collapsed  
✅ **Open Video** — Stream playable files after completion  
✅ **Save to Device** — Browser download only after the torrent finishes  
✅ **SEO Ready** — Metadata, Open Graph, Twitter cards, robots, sitemap, and manifest configured  
✅ **Custom Branding** — Uses `Logo.png` for favicon, app icon, and Apple icon  

---

## 📁 Project Structure

```bash
torrent/
├── app/
│   ├── api/
│   │   └── torrents/
│   │       ├── route.js                    # Create/list torrent jobs
│   │       └── [id]/
│   │           ├── route.js                # Get / pause / resume / delete
│   │           └── files/[index]/route.js  # Stream or save completed files
│   ├── dashboard/                          # Main paste-and-track page
│   ├── torrents/                           # Download library
│   ├── torrent/[id]/                       # Single download detail page
│   ├── settings/                           # App settings page
│   ├── layout.js                           # Global metadata + SEO
│   ├── manifest.js                         # Web app manifest
│   ├── robots.js                           # Robots config
│   └── sitemap.js                          # Sitemap generation
│
├── components/
│   ├── providers/
│   │   ├── TorrentProvider.js              # Client-side torrent state + polling
│   │   └── ToastProvider.js                # Toast notifications
│   ├── Sidebar.js                          # App navigation
│   ├── Topbar.js                           # Compact shell header
│   ├── TorrentCard.js                      # Download card UI
│   ├── TorrentDetailsView.js               # Minimal detail page
│   ├── HeroSection.js                      # Landing hero
│   └── GlassCard.js                        # Shared surface component
│
├── public/
│   └── Logo.png                            # Brand asset used for app icons
│
├── utils/
│   ├── helpers.js                          # Formatting + parsing helpers
│   └── server/
│       └── torrentManager.js               # Singleton WebTorrent manager
│
├── next.config.mjs
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+ recommended)
- **npm**
- **A persistent writable filesystem** for completed downloads

### 1. Clone the Repository

```bash
git clone https://github.com/zakisheriff/Torrent-by-The-Atom.git
cd Torrent-by-The-Atom
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Optional Environment Configuration

Create a `.env.local` file if you want to control the download directory:

```env
TORRENT_DOWNLOAD_DIR=/absolute/path/to/writable/downloads
TORRENT_RETENTION_HOURS=24
TORRENT_STORAGE_LIMIT_GB=150
TORRENT_STORAGE_RESERVE_GB=15
```

### 4. Run the App

```bash
npm run dev
```

Visit **http://localhost:3000** or the port Next.js prints in your terminal.

---

## 🌐 Deployment Notes

### Recommended

- **VPS / Dedicated Server / Persistent Node Host**
- A server where the app can:
  - stay alive for long-running downloads
  - write to a persistent directory
  - keep WebTorrent active in memory

### Important

- **Do not rely on serverless hosting** for real torrent downloading
- Platforms with ephemeral storage or sleeping processes are a bad fit for long-running torrent jobs
- Set `TORRENT_DOWNLOAD_DIR` to a writable persistent directory in production
- By default, completed files are automatically deleted after **24 hours**
- The default storage budget is tuned for a small Oracle-style setup with a protected free-space reserve

---

## 🔧 Tech Stack

### Frontend

- **Next.js 15 App Router**
- **React 19**
- **CSS Modules**
- **Framer Motion**
- **Lucide React**
- **Lenis**

### Backend

- **Next.js Route Handlers**
- **Node.js Runtime**
- **WebTorrent**

---

## 📡 API Overview

### Torrent Jobs

- `GET /api/torrents` — List all torrent jobs
- `POST /api/torrents` — Create a new torrent job from a magnet link
- `GET /api/torrents/:id` — Get one torrent job
- `PATCH /api/torrents/:id` — Pause or resume a torrent
- `DELETE /api/torrents/:id` — Remove a torrent and its downloaded files

### Files

- `GET /api/torrents/:id/files/:index` — Stream a completed file
- `GET /api/torrents/:id/files/:index?download=1` — Save a completed file to the user’s device

---

## 🔍 SEO Configuration

Configured in the app:

✅ App icons from `Logo.png`  
✅ Canonical metadata  
✅ Open Graph metadata  
✅ Twitter card metadata  
✅ `robots.txt`  
✅ `sitemap.xml`  
✅ `manifest.webmanifest`  
✅ Dark theme color + mobile viewport metadata  

---

## ⚠️ Usage Notes

- The app is free to use.
- The downloader stores torrent files on the server first.
- The browser save action is meant for completed files only.
- Use this project only for content you are legally allowed to download, store, or distribute.

---

## 🤝 Contributing

Contributions are welcome. If you want to improve the UI, downloader behavior, mobile experience, or deployment support, feel free to open an issue or submit a pull request.

---

## 📄 License

MIT License

---

<p align="center">
Made by <strong>Zaki Sheriff</strong>
</p>

<p align="center">
<em>Built to make torrent workflows cleaner, simpler, and fully free.</em>
</p>
