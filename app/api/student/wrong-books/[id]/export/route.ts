import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getWrongBooks, getWrongQuestions } from '@/lib/wrong-book-db';

// 导出错题本（返回错题列表，前端生成文件）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const wrongBooks = await getWrongBooks(user.id);
    const wrongBook = wrongBooks.find(b => b.id === params.id);

    if (!wrongBook) {
      return NextResponse.json({ error: '错题本不存在' }, { status: 404 });
    }

    const allQuestions = await getWrongQuestions(user.id);
    const questions = allQuestions
      .filter(q => q.wrongBookId === params.id)
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .map(q => ({
        name: q.name,
        content: q.content,
        createdAt: q.createdAt,
      }));

    return NextResponse.json({
      wrongBookName: wrongBook.name,
      questions,
      exportTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Export wrong book error:', error);
    return NextResponse.json({ error: '导出错题本失败' }, { status: 500 });
  }
}
