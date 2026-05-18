// src/app/(frontend)/(learner)/library/[seriesId]/page.tsx
import SeriesDetailShell from "./components/SeriesDetailShell";

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}): Promise<React.ReactNode> {
  const { seriesId } = await params;
  return <SeriesDetailShell seriesId={seriesId} />;
}
