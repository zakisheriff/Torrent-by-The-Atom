export default function manifest() {
  return {
    name: "Torrent by The Atom",
    short_name: "The Atom",
    description: "Free self-hosted torrent downloader for torrent.theatom.lk.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0d0d",
    theme_color: "#0d0d0d",
    icons: [
      {
        src: "/Logo.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
