// src/app/(frontend)/(learner)/exam/[examId]/results/[attemptId]/page.tsx
import ResultsView from "./components/ResultsView";

export default async function ExamResultsPage({
  params,
}: {
  params: Promise<{ examId: string; attemptId: string }>;
}): Promise<React.ReactNode> {
  const { examId, attemptId } = await params;
  return <ResultsView examId={examId} attemptId={attemptId} />;
}
