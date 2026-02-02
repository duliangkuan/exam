import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { analyzeWrongQuestion } from '@/lib/deepseek';

// AI 分析错题
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { questionText } = await request.json();

    if (!questionText || !questionText.trim()) {
      return NextResponse.json({ error: '题目内容不能为空' }, { status: 400 });
    }

    const analysis = await analyzeWrongQuestion(questionText.trim());

    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('AI analysis API error:', error);
    return NextResponse.json(
      { error: error.message || 'AI 分析失败，请重试' },
      { status: 500 }
    );
  }
}
