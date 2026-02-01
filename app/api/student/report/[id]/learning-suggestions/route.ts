import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateLearningSuggestions } from '@/lib/deepseek';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await context.params;
    const report = await prisma.examReport.findUnique({
      where: { id },
    });

    if (!report || report.studentId !== user.id) {
      return NextResponse.json({ error: '报告不存在或无权访问' }, { status: 404 });
    }

    const existing = (report as any).learningSuggestions as { weakPoints?: string; learningMethods?: string } | null | undefined;
    if (existing && typeof existing.weakPoints === 'string' && typeof existing.learningMethods === 'string') {
      return NextResponse.json(existing);
    }

    const questions = (report.questions || []) as { question?: string; correctAnswer?: string }[];
    const answers = (report.answers || {}) as Record<number, string>;
    const totalQuestions = questions.length;
    const correctCount = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
    const wrongCount = totalQuestions - correctCount;
    const wrongQuestionTexts = questions
      .filter((_, i) => answers[i] !== questions[i].correctAnswer)
      .map((q) => (q.question || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const selectedPath = report.selectedPath && typeof report.selectedPath === 'object'
      ? (report.selectedPath as Record<string, string>)
      : undefined;
    const selectedPathSummary = selectedPath
      ? `章：${selectedPath['章'] ?? '—'}，节：${selectedPath['节'] ?? '—'}`
      : undefined;

    const suggestions = await generateLearningSuggestions({
      subject: report.subject,
      score: report.score,
      totalQuestions,
      correctCount,
      wrongCount,
      wrongQuestionTexts,
      selectedPathSummary,
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Learning suggestions error:', error);
    return NextResponse.json(
      { error: (error as Error).message || '生成学习建议失败' },
      { status: 500 }
    );
  }
}
