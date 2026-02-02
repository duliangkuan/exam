import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getWrongQuestions, saveWrongQuestions, getWrongBooks, generateId, WrongQuestion } from '@/lib/wrong-book-cookie';

// 获取错题列表（支持按错题本筛选，wrongBookId=null 表示未归类）
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const wrongBookId = searchParams.get('wrongBookId');

    let questions = await getWrongQuestions();

    // 筛选
    if (wrongBookId === 'null' || wrongBookId === '') {
      questions = questions.filter(q => q.wrongBookId === null);
    } else if (wrongBookId) {
      questions = questions.filter(q => q.wrongBookId === wrongBookId);
    }

    // 排序
    questions.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Get wrong questions error:', error);
    return NextResponse.json({ error: '获取错题失败' }, { status: 500 });
  }
}

// 创建错题
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { name, content, wrongBookId } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: '题目内容不能为空' }, { status: 400 });
    }

    // 如果指定了 wrongBookId，验证错题本是否存在
    if (wrongBookId) {
      const books = await getWrongBooks();
      const book = books.find(b => b.id === wrongBookId);
      if (!book) {
        return NextResponse.json({ error: '错题本不存在' }, { status: 404 });
      }
    }

    // 获取当前最大 sortOrder（在指定错题本内或未归类）
    const allQuestions = await getWrongQuestions();
    const filteredQuestions = allQuestions.filter(
      q => q.wrongBookId === (wrongBookId || null)
    );
    const maxOrder = filteredQuestions.length > 0
      ? Math.max(...filteredQuestions.map(q => q.sortOrder))
      : -1;

    const newQuestion: WrongQuestion = {
      id: generateId(),
      name: name?.trim() || '未命名错题',
      content: content.trim(),
      wrongBookId: wrongBookId || null,
      sortOrder: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allQuestions.push(newQuestion);
    await saveWrongQuestions(allQuestions);

    return NextResponse.json({
      id: newQuestion.id,
      name: newQuestion.name,
      content: newQuestion.content,
      wrongBookId: newQuestion.wrongBookId,
      sortOrder: newQuestion.sortOrder,
      createdAt: newQuestion.createdAt,
      updatedAt: newQuestion.updatedAt,
    });
  } catch (error) {
    console.error('Create wrong question error:', error);
    return NextResponse.json({ error: '创建错题失败' }, { status: 500 });
  }
}
