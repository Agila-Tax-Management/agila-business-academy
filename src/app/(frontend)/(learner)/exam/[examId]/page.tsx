// src/app/(frontend)/(learner)/exam/[examId]/page.tsx
import ExamShell from "./components/ExamShell";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}): Promise<React.ReactNode> {
  const { examId } = await params;
  return <ExamShell examId={examId} />;
}
