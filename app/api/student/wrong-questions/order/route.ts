import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getWrongQuestions, saveWrongQuestions } from '@/lib/wrong-book-db';

// 批量更新错题排序（用于拖拽排序）
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { questionIds, wrongBookId } = await request.json();

    if (!Array.isArray(questionIds)) {
      return NextResponse.json({ error: '题目ID列表无效' }, { status: 400 });
    }

    const questions = await getWrongQuestions(user.id);
    const targetQuestions = questions.filter(
      q => questionIds.includes(q.id) && q.wrongBookId === (wrongBookId || null)
    );

    if (targetQuestions.length !== questionIds.length) {
      return NextResponse.json({ error: '部分错题不存在或不属于该错题本' }, { status: 400 });
    }

    // 批量更新排序
    const updatedQuestions = questionIds.map((id: string, index: number) => {
      const q = questions.find(q => q.id === id);
      if (!q) {
        throw new Error(`错题 ${id} 不存在`);
      }
      return {
        ...q,
        sortOrder: index,
        updatedAt: new Date().toISOString(),
      };
    });

    await saveWrongQuestions(user.id, updatedQuestions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update wrong questions order error:', error);
    return NextResponse.json({ error: '更新排序失败' }, { status: 500 });
  }
}
