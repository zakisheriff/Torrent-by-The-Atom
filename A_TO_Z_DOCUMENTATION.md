# Downloader by The Atom — Technical A-to-Z Handbook & Retrospective

Welcome to the comprehensive technical handbook and project retrospective for **Downloader by The Atom**. This document details the inner workings of the media downloader, the smart architectural choices implemented, the major engineering hurdles faced, and how we resolved them to deliver a flawless, high-performance, and 100% free production service.

---

## 🗺️ System Architecture (A-to-Z Workflow)

The application is built on a **Decoupled Frontend-Backend Model** to bypass serverless constraints while providing a premium, low-latency user interface.

```mermaid
sequenceDiagram
    participant User as Browser (Vercel Frontend)
    participant API as Next.js API (Hugging Face Backend)
    participant Engine as yt-dlp / FFmpeg
    
    %% Inspection Flow
    User->>API: GET /api/media/inspect?url=<url>
    API->>Engine: Run yt-dlp --dump-single-json
    Note over API,Engine: Uses smart Cookie Prioritization & Signature Caching
    Engine-->>API: Returns raw media metadata JSON
    Note over API: Scraping: runs parallel HEAD requests for missing sizes (Instagram etc.)
    API-->>User: Returns normalized detail payload + format options
    
    %% Preparation Flow (Merged / Audio modes)
    User->>API: GET /api/media/download?url=<url>&format=<selector>&prepare=true&id=<jobId>
    API-->>User: HTTP 200 { ok: true, status: "preparing" } (Immediate return)
    API->>Engine: Spawns background process (Download audio/video streams)
    
    %% Polling Loop
    loop Every 350ms
        User->>API: GET /api/media/status?id=<jobId>
        Note over API: Monitors stdout/stderr (regex matching progress percent)
        API-->>User: HTTP 200 { status: "downloading"/"merging", progress: X }
    end
    
    Engine->>API: Merges streams using instant stream-copy; caches to temp disk
    
    %% Final Retrieval
    User->>API: GET /api/media/status?id=<jobId>
    API-->>User: HTTP 200 { status: "completed" }
    
    User->>API: GET /api/media/download?ready=true&id=<jobId>
    Note over API: Handles browser Range/HEAD requests without stream destruction
    API-->>User: Streams file (attachment payload with Content-Length)
    Note over API: Clean up: Deletes temp folder on stream close (or 60s grace timeout on abort)
```

### 1. The Decoupled Deployment Model
*   **Static Frontend (Vercel)**: Hosts the client interface. This ensures instantaneous page rendering, premium CSS animations, and zero-downtime globally.
*   **Persistent Media Server (Hugging Face Spaces)**: Hosts the Next.js API server inside a Docker container (Alpine/Node.js environment). Since it's a persistent environment, it executes `yt-dlp` and `ffmpeg` with **16 GB RAM** and **no execution timeouts**, completely free of cost.

---

## 📡 API Endpoints (The Core Media Engine)

### 1. `GET /api/media/inspect`
Extracts formats, duration, thumbnail, and title from user-submitted links.
*   **Core Flow**:
    1.  Validates and normalizes the incoming URL (e.g. converting mobile share links).
    2.  Invokes `inspectMedia(url)` from `ytDlp.js`.
    3.  Sequentially attempts metadata retrieval with cookie priority and player-client bypass configurations.
    4.  Extracts format groupings (video vs. audio tracks) and estimates size.

### 2. `GET /api/media/download`
Performs background downloader preparation and handles secure stream delivery.
*   **Parameters**:
    *   `url`: Target media link.
    *   `format`: Format selector arguments (e.g., `137+bestaudio/best`).
    *   `mode`: Execution mode (`direct` for progressive single streams, `merge` for audio+video combine, `extract-audio` for MP3 conversions).
    *   `id`: Unique identifier tracking the specific client session.
    *   `prepare=true`: Triggers asynchronous background download preparation.
    *   `ready=true`: Directs the server to serve the cached file.
*   **Background Preparation Flow**:
    *   When the client sends `prepare=true`, the API returns a status response `{ status: "preparing" }` immediately (under 200ms) and spawns the download process in the background.
    *   Files are downloaded to a sandbox temporary folder under `os.tmpdir() + "/fetch-by-the-atom/" + id/`.

### 3. `GET /api/media/status`
Retrieves progress reports for a background task.
*   **Returned States**:
    *   `downloading`: Active file transfer. Returns current `progress` float.
    *   `merging`: yt-dlp combining video and audio or converting video to audio. Locks progress at `99%` (or `98%` contextual cap).
    *   `completed`: File compiled on server.
    *   `failed`: Contains specific error message details.

### 4. `GET /api/media/thumbnail`
Proxies external thumbnail image requests.
*   **Why it exists**: Instagram, Facebook, and other major platforms block hotlinking of thumbnails (serving broken links when loaded from external domains). This API proxies the image server-side, overrides HTTP header fields like `Referer` and `User-Agent` to mimic a legitimate browser, fetches the raw image buffer, and streams it to the user.

---

## 🎨 Visual Experience & 3D Tactile Design System

To match high-end modern design patterns, we built a premium, unified **3D Glassmorphic Dark & Light Theme** featuring tactile elevations and micro-interactions.

### 1. The 3D CSS Physics System
We designed realistic depth using layered CSS shadow mappings. When buttons are hovered, they lift up; when clicked, they sink into the page:
*   **Hover Elevation State**: Moves elements up using `transform: translateY(-2px)` and expands the ambient drop shadow.
*   **Pressed Active State**: Moves elements down using `transform: translateY(3px)` and shifts shadows inward (`box-shadow: 0 1px 0 #050506, inset 0 2px 4px rgba(0, 0, 0, 0.24)`). This creates a highly satisfying "click" feedback.

### 2. Glassmorphic Properties
Cards and overlays use subtle background opacities (`rgba(255, 255, 255, 0.72)`) mixed with CSS backdrop filters (`backdrop-filter: blur(14px)`) and fine borders to resemble polished acrylic panels floating above the background gradient mesh.

### 3. Responsive Stacking Dual-Capsules (Mobile UI)
On narrow viewports (`max-width: 640px`), housing the input and the "Find media" button in a single container resulted in cramped inputs and oversized buttons. We resolved this by dynamically shifting the layout:
*   The outer card container becomes transparent and flat.
*   The text input area and action buttons stack vertically as separate, matching 3D rounded capsules (`58px` height) with proportional font scaling.

### 4. Brand-Accurate Source Badges
In the inspection card, rather than rendering raw text, we introduced platform-specific badges with pixel-perfect official brand logos (SVGs) and matching color palettes:
*   **YouTube**: Vibrant red icon with a light red backdrop (`rgba(255, 0, 0, 0.05)`).
*   **Instagram**: Pink/purple brand gradient matching icon.
*   **TikTok**, **Facebook**, **X/Twitter**: Custom monochrome and brand styling.
*   **Globe Fallback**: Renders for unrecognized direct URLs.
*   The badges use `justify-self: start` to prevent them from stretching across the layout, and support tactile hover elevations.

---

## 💡 What We Did Smart (Engineering Masterstrokes)

We implemented several key optimizations that transformed the site from a basic downloader into a highly resilient, enterprise-grade media engine:

### 1. Zero-Transcoding Merge (`-c copy` Muxing)
*   **The Smart Idea**: In high qualities (1080p, 1440p, 4K), YouTube serves video (WebM/VP9/AV1) and audio (Opus) as separate streams. Previously, joining these into an MP4 container involved re-encoding the video using CPU-heavy libx264. On limited cloud containers, this took minutes, spiked CPU usage to 100%, and caused timeouts.
*   **The Solution**: We disabled CPU-heavy video transcoding by utilizing FFmpeg stream-copy muxing (`-c:v copy -c:a copy` or simply `-c copy`). Because it copies the streams directly without transcoding them, **the merge completes in under 2 seconds** with absolutely zero quality loss.

### 2. Parallel CDN Metadata Fetching
*   **The Smart Idea**: Some platforms (like Instagram) return progressive stream URLs but do not provide file size metadata in the raw JSON payload. This left the user interface showing "Unknown Size" for formats.
*   **The Solution**: In `inspectMedia`, we parse the format list and identify streams that have direct URLs but are missing file sizes. The server spawns parallel, non-blocking `HEAD` requests (with a strict 3-second timeout) directly to the CDN nodes to fetch `Content-Length` headers, populating filesizes instantly.

### 3. Split Progress Bar Logic in Merge Mode
*   **The Smart Idea**: When downloading merged qualities (e.g. 1080p), yt-dlp performs two sequential downloads (the video track, then the audio track), followed by FFmpeg merging. A standard progress regex parser would reset the progress bar from 100% back to 0% when the second track started downloading, causing a confusing UI jump.
*   **The Solution**: We mapped the progress values:
    *   **Video track download**: Scales from `0%` to `85%`.
    *   **Audio track download**: Scales from `85%` to `98%`.
    *   **FFmpeg Merge**: Switches status to `merging` and locks progress to `99%` until completed.
    This creates a smooth, linear progress bar that moves forwards without jumping backward.

### 4. Dynamic API Resolution
*   **The Smart Idea**: In production, the client must send API requests to the Hugging Face Space backend (`zakisheriff-downloader-backend.hf.space`), but in local development, it must hit relative paths (`/api/media/...`). Hardcoding env variables often breaks between development environments.
*   **The Solution**: We configured a dynamic API base URL resolver in client components:
    ```javascript
    const apiBase = process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== "undefined" &&
       (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.startsWith("192.168."))
       ? ""
       : "https://zakisheriff-downloader-backend.hf.space");
    ```
    This works out of the box with zero configuration required for local developers.

### 5. Automated Disk Garbage Collection
*   **The Smart Idea**: When a background download completes, the file is saved to the server's disk temp directory. If a user inspects a link, triggers background preparation, but closes their tab before clicking download, those files would stay on disk forever, eventually filling up the server.
*   **The Solution**: We added a server-side 5-minute watchdog timeout immediately upon spawning background preparation tasks. If the file is not retrieved by the browser within 5 minutes, it is automatically purged from the disk.

---

## 💣 Key Challenges & How We Conquered Them

### Challenge 1: Vercel Serverless Architecture Limitations
*   **The Problem**: When the project was initially deployed on Vercel, link inspection worked but download streams failed instantly with `503 Service Unavailable` errors. Vercel runs on short-lived serverless functions that lack the system packages `yt-dlp` and `ffmpeg`. Furthermore, Vercel enforces a strict 10-second timeout on function execution and a 4.5MB limit on response payloads.
*   **The Conquering Path**: We split the application. The frontend remains on Vercel for fast, free, static hosting and custom domain management. We packaged the API backend inside a custom Docker container (Node.js + Python + FFmpeg + yt-dlp) and deployed it to Hugging Face Spaces. The backend runs on a persistent environment with **16 GB RAM and no timeouts**, completely bypassing Vercel's payload and timeout constraints.

### Challenge 2: Datacenter IP Blocks & 403 Bot Mitigations
*   **The Problem**: Hugging Face Spaces run on shared cloud IP ranges. YouTube and Instagram aggressively flag cloud IPs, throwing bot challenges (`Sign in to confirm you’re not a bot`) or throttling the connection.
*   **The Conquering Path**: 
    1.  **Cookie Prioritization**: We configured environment-based cookie injection (`YT_DLP_COOKIES_BASE64`). If cookies are configured, the downloader prioritizes them, bypassing anonymous timeouts.
    2.  **Sequential Retries**: We created a robust retry waterfall in `ytDlp.js` that sequentializes query attempts using local session cookies.

### Challenge 3: Cookie File Control Character Corruption
*   **The Problem**: When combining cookies for YouTube and Instagram into a single base64 environment variable, the decoded output included invalid ASCII control characters (such as File Separator `\u001c` and Device Control 4 `\u0014`). These characters in HTTP headers violate the HTTP specification (RFC 6265) and are strictly rejected with a `400 Bad Request` by Google Front End (GFE) servers.
*   **The Conquering Path**: We implemented an active regex sanitizer in `getCookiesArg` that strips out all invalid ASCII control characters (`[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]`) while retaining structure-essential characters (tabs and newlines) before writing the cookie file to disk.

### Challenge 4: High-Quality Downloads (1440p/4K) Watchdog Timeout
*   **The Problem**: Downloading 1440p or 4K videos requires fetching large files (often 300MB+). Because YouTube throttles download speeds on cloud container IPs, downloading these files sometimes exceeded 90 seconds. The client-side watchdog was hardcoded to exactly 90 seconds, causing the progress button to time out and reset to the "Download" state midway, preventing the browser download from ever triggering.
*   **The Conquering Path**: We refactored `FormatCard.js` to implement a **Dynamic Watchdog**. The 90-second timeout now resets on every single progress update received during the `downloading` and `merging` states. The watchdog will only fire if the server becomes completely unresponsive for a continuous block of 90 seconds.

### Challenge 5: Premature File Cleanup & Stuck Tab Spinner (Range/HEAD Requests)
*   **The Problem**: When downloading other qualities, the browser tab would load for a long time at 100% before starting. For 1440p/4K qualities, the download wouldn't start at all. This was because when modern browsers (Chrome/Safari) start a file download, they send a preliminary `HEAD` or HTTP Range request to check the server capabilities and fetch headers. In our download route, when a request completed or aborted, the file was immediately deleted from disk. This meant the initial `HEAD` request triggered the cleanup callback, deleting the file before the actual browser download stream request could start!
*   **The Conquering Path**: We implemented a multi-layered correction in `app/api/media/download/route.js`:
    1.  **Immediate HEAD Interception**: We intercepted `HEAD` requests early in the routing code and returned headers (Content-Length, Content-Disposition) immediately, without spawning a stream or invoking file cleanups.
    2.  **Delayed File Cleanup on Abort**: If a download stream is interrupted or cancelled, the backend no longer deletes the file immediately. Instead, it schedules a **60-second grace timeout**. This gives the browser or download manager enough time to reconnect, send Range requests, or retry the stream before the file is deleted.
    3.  **Accurate Content-Length**: We read the file size on disk using node `stat` and supply the exact `Content-Length` header on download retrieval. This bypasses Next.js default chunked transfer encoding, giving browser download managers an accurate size for a realistic progress bar.

### Challenge 6: Link Inspection Latency (Timeout Delay loop)
*   **The Problem**: Paste inspections took over 8 seconds. This was because the anonymous inspection attempt ran without player client extractor arguments. It was blocked or throttled by YouTube, took 4-5 seconds to return <=360p formats, failed the check, and only then fell back to the safe player-client execution.
*   **The Conquering Path**: We re-ordered the inspection process. By prioritizing the bypass parameters (`youtube:player-client=web,mweb,android`) on the first query, it succeeds instantly. We also removed the `--no-cache-dir` flag, enabling yt-dlp to cache decryption ciphers on disk. Subsequent link inspections now resolve in **2-3 seconds**.

### Challenge 7: 100% Progress Stalls & Renaming Lag
*   **The Problem**: Direct and progressive (1080p and lower) downloads completed fast but hung on the UI at "100%" or loading spinner states for up to 30 seconds. This was because `yt-dlp` default behaviors write to a `.part` temporary file and perform a heavy disk rename upon completion, which throttles disk I/O.
*   **The Conquering Path**:
    1.  **Direct-to-File Arguments**: Appended `--no-part`, `--no-mtime`, `--no-embed-metadata`, and `--no-embed-thumbnail` to speed up the writing process.
    2.  **Progress Capping**: Capped the visual progress update at `95%` for progressive and `98%` for merged downloads. The UI only jumps to `100%` when the server-side callback explicitly confirms the compilation is done.
    3.  **Double Polling Rates**: Shifted polling frequencies from `800ms` down to `350ms` for immediate UI response.
    4.  **Contextual Audio Labels**: Implemented checking to show `"Extracting audio..."` instead of `"Merging formats..."` when processing MP3s.

### Challenge 8: Resource Exhaustion, OOM, and DoS Risks (Free-Tier Architecture)
*   **The Problem**: Running concurrent downloads and FFmpeg merging processes on a free Hugging Face container exposes it to Out-Of-Memory (OOM) crashes, Node.js event-loop blocking, and DoS abuse. Ephemeral file storage could fill up the disk, and buffering files in memory during HTTP stream delivery could crash the Node process.
*   **The Conquering Path**:
    1.  **Centralized Job Queue & State Manager (`lib/JobQueue.js`)**: Configured a concurrency queue capping background downloads/merges to a maximum of `3` at any time. Excess requests are queued, and the `/api/media/status` endpoint returns the user's position in line. State survives Next.js dev reloads via `global.__activeDownloads`.
    2.  **In-Memory Rate Limiter (`lib/RateLimiter.js`)**: Enforced a sliding-window limit restricting each client (resolved via proxy headers `x-forwarded-for`/`x-real-ip` or URL fallbacks) to a maximum of `5` downloads per hour.
    3.  **Flat-Memory Web Stream Delivery**: Removed file-to-buffer memory loading. Files are piped directly using Node's native `stream.Readable.toWeb` combined with standard Web Response streams. This respects stream backpressure, keeping memory flat during active transfers.
    4.  **Continuous Garbage Collection**: Built a background worker inside the `JobQueue` module running every 10 minutes to scan and delete temp folders/files and prune in-memory rate-limiter maps/job states older than 30 minutes.
    5.  **Hard Duration Block**: Implemented checking in both the inspect and download routes that rejects any media exceeding 30 minutes (1,800 seconds) with a `400 Bad Request`.

### Challenge 9: Instagram Photo/Carousel Download Block (Cookie Format Incompatibility)
*   **The Problem**: Users trying to download Instagram photo or carousel posts received `We couldn't prepare that link` and `This Instagram link contains only photos/images` errors. `yt-dlp` does not support downloading non-video post formats and fails with `No video formats found!`. While we had designed an Instagram API fallback (`/api/v1/media/{mediaId}/info/`) that was supposed to fetch carousel data using base64 cookies, the fallback query returned 400 Bad Request or failed on the deployed backend while working on localhost.
*   **The Conquering Path**: We identified that the cookies configured in the Hugging Face environment variables were in the tab-separated **Netscape cookie file** format, whereas the fallback code only supported parsing **JSON-formatted** cookies. We implemented a Netscape cookie parser directly inside `getCookiesArg` and merged it into the fallback headers. This enabled the server to correctly parse, authenticate, and query the Instagram API in production.

### Challenge 10: Blank Image Previews (Server Proxy IP Blocking)
*   **The Problem**: After fixing the API fallback, photo carousel posts successfully resolved, but the slide cards and preview images rendered as blank white boxes on the deployed site. The frontend was proxying images through the server (`/api/media/thumbnail?src=...`) to avoid hotlink blocks. However, because Hugging Face's container IP ranges are blocked by the Instagram CDN, the server-side proxy fetch request failed or timed out.
*   **The Conquering Path**: Since browser client IPs are not blocked by the Instagram CDN, we bypassed the server proxy entirely for all Instagram images. We modified `FormatCard.js` and `LinkInspector.js` to render the CDN image source directly inside the browser `<img>` elements, appending `referrerPolicy="no-referrer"`. This strips the `Referer` header from the browser request, successfully bypassing Instagram's hotlink protection without sending the request through the server.

### Challenge 11: 15-Second Link Inspection Latency (SSL Handshake Timeout & yt-dlp Overhead)
*   **The Problem**: Inspecting Instagram links was extremely slow, taking upwards of 15 seconds to return formats. This was caused by two sequential delays: (1) `inspectMedia` first ran `yt-dlp` attempts which took 3–5 seconds to fail on photo links, and (2) the API fallback queried `www.instagram.com` which has a known SSL handshake timeout issue on Hugging Face (wasting 8 seconds before trying the next subdomain).
*   **The Conquering Path**: We optimized the routing in two ways:
    1. **Bypassed yt-dlp first check**: We added a fast check at the start of `inspectMedia` that catches Instagram URLs and immediately attempts the API fallback, skipping the slow `yt-dlp` process entirely.
    2. **Endpoint Swapping**: We swapped the endpoints order in `fetchInstagramMediaInfo` so it queries the mobile-friendly `i.instagram.com` subdomain first. This avoids the 8-second SSL handshake timeout on `www.instagram.com`, dropping the total fetch time down to under 1.5 seconds.

---

## ✅ How it Works Perfectly Now

1.  **Instant Direct Downloads**: Clicking progressive MP4 video or direct audio formats opens the stream immediately, initiating browser downloads in under 300ms.
2.  **Smooth, Adaptive Progress Interface**: Clicking merged qualities displays a progress bar that scales correctly through video downloading, audio downloading, and merging without resets.
3.  **Zero-Latency High-Quality Merges**: High-quality formats (1080p, 1440p, 4K) are merged in under 2 seconds using FFmpeg stream copying, and download success toast notifications are displayed when the browser download starts.
4.  **Abuse & Concurrency Protection**: The backend queue caps concurrent active merges at 3, queueing subsequent tasks and displaying queue position feedback to users. The rate limiter strictly caps client downloads to 5 per hour.
5.  **Automatic Memory & Disk Cleanups**: Temporary directories are deleted immediately on a successful download, and delayed by 60 seconds on aborted downloads to accommodate browser Range requests. A global cleanup worker executes every 10 minutes to purge any stale files or states older than 30 minutes.
6.  **Robust Bot-Bypass**: Sanitized cookies and prioritized player client configurations allow the space backend to run uninterrupted without throwing Google/Instagram challenge blocks, inspecting links under 3 seconds.

## 📈 Vercel Web Analytics Integration

To monitor visitor traffic, page views, and download success patterns in production without impacting performance or user privacy:
1. **Zero-Config Web Analytics**: Installed the official `@vercel/analytics` package as a dependency in both the root application (`torrent`) and subdirectory (`fetch-by-the-atom`) projects.
2. **React Root Layout Component**: Configured the `<Analytics />` component from `@vercel/analytics/next` directly in both root `app/layout.js` files. This automatically records page view and session flow data whenever visitors interact with the live apps.

---

## 🛠️ Maintenance & Deployment Commands

### Local Dev Run
```bash
cd fetch-by-the-atom
npm install
npm run dev
```

### Deploying to GitHub & Vercel
```bash
git add .
git commit -m "Commit message"
git push origin main
```

### Deploying to Hugging Face Spaces (with LFS for binary compatibility)
Because Hugging Face requires Git LFS for binary files and Vercel does not support LFS pointers, we use the temporary orphan branch flow to push code to Hugging Face:
```bash
git checkout --orphan temp-hf-branch
git reset
git lfs install
git lfs track "*.png"
git add .gitattributes
git add .
git commit -m "deploy to hugging face space with LFS"
git push hf temp-hf-branch:main --force
git checkout main
git branch -D temp-hf-branch
```
