import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getWrongQuestions, saveWrongQuestion, getWrongBooks, generateId, WrongQuestion } from '@/lib/wrong-book-db';

// 获取错题列表（支持按学科和错题本筛选）
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const wrongBookId = searchParams.get('wrongBookId');
    const subject = searchParams.get('subject');

    let questions = await getWrongQuestions(user.id);

    // 按学科筛选
    if (subject) {
      questions = questions.filter(q => q.subject === subject);
    }

    // 按错题本筛选
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
  } catch (error: any) {
    console.error('Get wrong questions error:', error);
    // 确保始终返回 JSON 响应
    return NextResponse.json(
      { 
        error: error?.message || '获取错题失败',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }, 
      { status: 500 }
    );
  }
}

// 创建错题
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: '请求体格式错误' }, { status: 400 });
    }

    const { name, content, wrongBookId, subject } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: '题目内容不能为空' }, { status: 400 });
    }

    // 如果指定了 wrongBookId，验证错题本是否存在且属于同一学科
    if (wrongBookId) {
      const books = await getWrongBooks(user.id);
      const book = books.find(b => b.id === wrongBookId);
      if (!book) {
        return NextResponse.json({ error: '错题本不存在' }, { status: 404 });
      }
      if (subject && book.subject !== subject) {
        return NextResponse.json({ error: '错题本学科不匹配' }, { status: 400 });
      }
    }

    // 获取当前目录下的最大 sortOrder
    const allQuestions = await getWrongQuestions(user.id);
    const filteredQuestions = allQuestions.filter(q => {
      if (subject && q.subject !== subject) return false;
      return q.wrongBookId === (wrongBookId || null);
    });
    const maxOrder = filteredQuestions.length > 0
      ? Math.max(...filteredQuestions.map(q => q.sortOrder))
      : -1;

    const newQuestion: WrongQuestion = {
      id: generateId(),
      name: name?.trim() || '未命名错题',
      content: content.trim(),
      wrongBookId: wrongBookId || null,
      subject: subject || null,
      sortOrder: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveWrongQuestion(user.id, newQuestion);
      return NextResponse.json(newQuestion);
    } catch (dbError: any) {
      console.error('Database error when saving wrong question:', dbError);
      // 检查是否是数据库连接错误
      if (dbError?.message?.includes('Can\'t reach database') || 
          dbError?.message?.includes('connection') ||
          dbError?.code === 'P1001') {
        return NextResponse.json(
          { error: '数据库连接失败，请检查数据库配置' },
          { status: 503 }
        );
      }
      throw dbError; // 重新抛出，让外层 catch 处理
    }
  } catch (error: any) {
    console.error('Create wrong question error:', error);
    // 确保始终返回 JSON 响应
    return NextResponse.json(
      { 
        error: error?.message || '创建错题失败',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
