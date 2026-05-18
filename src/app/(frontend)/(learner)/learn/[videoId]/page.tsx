// src/app/(frontend)/(learner)/learn/[videoId]/page.tsx
import VideoPlayerShell from "./components/VideoPlayerShell";

export default async function LearnVideoPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}): Promise<React.ReactNode> {
  const { videoId } = await params;
  return <VideoPlayerShell videoId={videoId} />;
}
