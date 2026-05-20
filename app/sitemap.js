export default function sitemap() {
  const baseUrl = "https://torrent.theatom.lk";
  const now = new Date();

  return [
    "",
    "/dashboard",
    "/torrents",
    "/settings"
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7
  }));
}
