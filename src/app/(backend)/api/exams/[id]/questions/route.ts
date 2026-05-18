// src/app/(backend)/api/exams/[id]/questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { QuestionType } from "@/generated/prisma";

export type { QuestionType };

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id: examId } = await params;
    const questions = await prisma.question.findMany({
      where:   { examId },
      orderBy: { order: "asc" },
      include: { choices: { orderBy: { order: "asc" } } },
    });

    const data: QuestionItem[] = questions.map((q) => ({
      id:      q.id,
      examId:  q.examId,
      text:    q.text,
      type:    q.type,
      order:   q.order,
      choices: q.choices.map((c) => ({
        id:        c.id,
        text:      c.text,
        isCorrect: c.isCorrect,
        order:     c.order,
      })),
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch questions." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const count = await prisma.question.count({ where: { examId } });

    const question = await prisma.question.create({
      data: {
        examId,
        text:  text.trim(),
        type,
        order: count + 1,
        choices: {
          create: (choices ?? []).map((c, i) => ({
            text:      c.text.trim(),
            isCorrect: c.isCorrect,
            order:     i + 1,
          })),
        },
      },
      include: { choices: { orderBy: { order: "asc" } } },
    });

    const data: QuestionItem = {
      id:      question.id,
      examId:  question.examId,
      text:    question.text,
      type:    question.type,
      order:   question.order,
      choices: question.choices.map((c) => ({
        id:        c.id,
        text:      c.text,
        isCorrect: c.isCorrect,
        order:     c.order,
      })),
    };

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add question." }, { status: 500 });
  }
}

