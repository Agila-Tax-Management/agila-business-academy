// src/app/(backend)/api/exams/[id]/questions/route.ts
import { NextRequest, NextResponse } from "next/server";

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";

export interface ChoiceItem {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface QuestionItem {
  id: string;
  examId: string;
  text: string;
  type: QuestionType;
  order: number;
  choices: ChoiceItem[];
}

const MOCK_QUESTIONS: QuestionItem[] = [
  {
    id: "q1", examId: "exam1",
    text: "What is the company's official working hours?",
    type: "MULTIPLE_CHOICE", order: 1,
    choices: [
      { id: "c1", text: "8 AM to 5 PM",   isCorrect: true,  order: 1 },
      { id: "c2", text: "9 AM to 6 PM",   isCorrect: false, order: 2 },
      { id: "c3", text: "7 AM to 4 PM",   isCorrect: false, order: 3 },
      { id: "c4", text: "Flexible hours", isCorrect: false, order: 4 },
    ],
  },
  {
    id: "q2", examId: "exam1",
    text: "How many days of sick leave are provided annually?",
    type: "MULTIPLE_CHOICE", order: 2,
    choices: [
      { id: "c5", text: "5 days",  isCorrect: false, order: 1 },
      { id: "c6", text: "10 days", isCorrect: true,  order: 2 },
      { id: "c7", text: "15 days", isCorrect: false, order: 3 },
      { id: "c8", text: "None",    isCorrect: false, order: 4 },
    ],
  },
  {
    id: "q3", examId: "exam1",
    text: "Is it mandatory to wear your ID inside the office premises?",
    type: "TRUE_FALSE", order: 3,
    choices: [
      { id: "c9",  text: "True",  isCorrect: true,  order: 1 },
      { id: "c10", text: "False", isCorrect: false, order: 2 },
    ],
  },
  {
    id: "q4", examId: "exam4",
    text: "Personal Protective Equipment (PPE) must be worn at all times in hazardous areas.",
    type: "TRUE_FALSE", order: 1,
    choices: [
      { id: "c11", text: "True",  isCorrect: true,  order: 1 },
      { id: "c12", text: "False", isCorrect: false, order: 2 },
    ],
  },
  {
    id: "q5", examId: "exam4",
    text: "What is the first step when you discover a workplace fire?",
    type: "MULTIPLE_CHOICE", order: 2,
    choices: [
      { id: "c13", text: "Evacuate immediately via the fire exit plan", isCorrect: true,  order: 1 },
      { id: "c14", text: "Try to extinguish the fire yourself",         isCorrect: false, order: 2 },
      { id: "c15", text: "Call a colleague first",                      isCorrect: false, order: 3 },
      { id: "c16", text: "Continue working until the alarm sounds",     isCorrect: false, order: 4 },
    ],
  },
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: examId } = await params;
  // TODO: replace with real Prisma query
  const questions = MOCK_QUESTIONS.filter((q) => q.examId === examId);
  return NextResponse.json({ data: questions });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id: examId } = await params;
    const body = await request.json() as {
      text?: string;
      type?: QuestionType;
      choices?: Array<{ text: string; isCorrect: boolean }>;
    };
    const { text, type, choices } = body;

    if (!text?.trim() || !type) {
      return NextResponse.json({ error: "Question text and type are required." }, { status: 400 });
    }

    const existing = MOCK_QUESTIONS.filter((q) => q.examId === examId);
    const newQuestion: QuestionItem = {
      id:     crypto.randomUUID(),
      examId,
      text:   text.trim(),
      type,
      order:  existing.length + 1,
      choices: (choices ?? []).map((c, i) => ({
        id:        crypto.randomUUID(),
        text:      c.text,
        isCorrect: c.isCorrect,
        order:     i + 1,
      })),
    };

    // TODO: real prisma.question.create with choices
    return NextResponse.json({ data: newQuestion }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add question." }, { status: 500 });
  }
}
