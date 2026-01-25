import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { generateQuestions } from '@/lib/deepseek';

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

    const questions = await generateQuestions(subject, selectedPath);

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error('Generate questions error:', error);
    return NextResponse.json(
      { error: error.message || '生成题目失败' },
      { status: 500 }
    );
  }
}
