import TorrentDetailsView from "@/components/TorrentDetailsView";

export default async function TorrentDetailsPage({ params }) {
  const resolvedParams = await params;
  return <TorrentDetailsView id={resolvedParams.id} />;
}
