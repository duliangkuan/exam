import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { subject, selectedPath, questions, answers, score } = await request.json();

    const report = await prisma.examReport.create({
      data: {
        studentId: user.id,
        subject,
        selectedPath: JSON.stringify(selectedPath),
        questions: JSON.stringify(questions),
        answers: JSON.stringify(answers),
        score,
      },
    });

    return NextResponse.json({ reportId: report.id });
  } catch (error) {
    console.error('Save report error:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
