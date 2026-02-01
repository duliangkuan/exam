import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { generateQuestions } from '@/lib/deepseek';
import chineseData from '@/data/chinese_exam_nodes.json';
import englishData from '@/data/english_exam_nodes.json';
import mathData from '@/data/math_exam_nodes.json';
import computerData from '@/data/computer_exam_nodes.json';

type ExamNode = { [key: string]: string | string[] };

const SUBJECT_KEY_MAP: Record<string, string> = {
  大学语文: 'chinese',
  大学英语: 'english',
  高等数学: 'math',
  计算机基础: 'computer',
};

function getSubjectKey(subject: string): string {
  return SUBJECT_KEY_MAP[subject] ?? subject;
}

function resolveSectionPayload(
  subjectKey: string,
  selectedPath: Record<string, string>
): { 节: string; 知识点: string[] } | null {
  const data = (
    subjectKey === 'chinese'
      ? chineseData
      : subjectKey === 'english'
        ? englishData
        : subjectKey === 'math'
          ? mathData
          : computerData
  ) as ExamNode[];

  const node = data.find((item: ExamNode) => {
    return Object.keys(selectedPath).every(
      (key) => item[key] === selectedPath[key]
    );
  });

  if (!node || !node['节'] || !Array.isArray(node['知识点'])) {
    return null;
  }
  return {
    节: node['节'] as string,
    知识点: node['知识点'] as string[],
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { subject, selectedPath } = await request.json();

    if (!subject || !selectedPath) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const subjectKey = getSubjectKey(subject);
    const sectionPayload = resolveSectionPayload(subjectKey, selectedPath);
    if (!sectionPayload) {
      return NextResponse.json(
        { error: '未找到对应的节或知识点' },
        { status: 400 }
      );
    }

    const questions = await generateQuestions(subject, sectionPayload);

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error('Generate questions error:', error);
    return NextResponse.json(
      { error: error.message || '生成题目失败' },
      { status: 500 }
    );
  }
}
