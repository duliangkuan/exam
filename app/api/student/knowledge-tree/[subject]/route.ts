import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  buildKnowledgeTree,
  sectionKeyFromPath,
  SUBJECT_NAMES,
} from '@/lib/exam-nodes';

const VALID_SUBJECTS = ['chinese', 'english', 'math', 'computer'];

export async function GET(
  _request: NextRequest,
  { params }: { params: { subject: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { subject } = params;
    if (!VALID_SUBJECTS.includes(subject)) {
      return NextResponse.json({ error: '无效科目' }, { status: 400 });
    }

    const subjectName = SUBJECT_NAMES[subject];
    const tree = buildKnowledgeTree(subject);

    const reports = await prisma.examReport.findMany({
      where: { studentId: user.id, subject: subjectName },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        score: true,
        createdAt: true,
        selectedPath: true,
      },
    });

    const sectionStatus: Record<
      string,
      { reportCount: number; passed: boolean }
    > = {};

    reports.forEach((r) => {
      const path =
        r.selectedPath && typeof r.selectedPath === 'object'
          ? (r.selectedPath as Record<string, string>)
          : null;
      if (!path) return;
      const key = sectionKeyFromPath(path, subject);
      if (!sectionStatus[key]) {
        sectionStatus[key] = { reportCount: 0, passed: false };
      }
      sectionStatus[key].reportCount += 1;
      if (r.score >= 80) sectionStatus[key].passed = true;
    });

    return NextResponse.json({
      tree,
      sectionStatus,
      reports: reports.map((r) => ({
        id: r.id,
        score: r.score,
        createdAt: r.createdAt,
        selectedPath: r.selectedPath,
        sectionKey:
          r.selectedPath && typeof r.selectedPath === 'object'
            ? sectionKeyFromPath(r.selectedPath as Record<string, string>, subject)
            : null,
      })),
    });
  } catch (error) {
    console.error('Knowledge tree API error:', error);
    return NextResponse.json(
      { error: '获取知识树失败' },
      { status: 500 }
    );
  }
}
