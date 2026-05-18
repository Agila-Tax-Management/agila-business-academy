// src/app/(frontend)/(learner)/library/[seriesId]/[moduleId]/page.tsx
import ModuleDetailShell from "./components/ModuleDetailShell";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ seriesId: string; moduleId: string }>;
}): Promise<React.ReactNode> {
  const { seriesId, moduleId } = await params;
  return <ModuleDetailShell seriesId={seriesId} moduleId={moduleId} />;
}
