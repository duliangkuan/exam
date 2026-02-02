import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { generateSimilarQuestions } from '@/lib/deepseek';

// 举一反三（生成3道同类型题目）
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

    const questions = await generateSimilarQuestions(questionText.trim());

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error('Similar questions API error:', error);
    return NextResponse.json(
      { error: error.message || '生成举一反三题目失败，请重试' },
      { status: 500 }
    );
  }
}
