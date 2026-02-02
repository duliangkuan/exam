import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getWrongBooks, saveWrongBooks, generateId, WrongBook, getWrongQuestions } from '@/lib/wrong-book-cookie';

// 获取错题本列表（包含每个错题本下的错题数量）
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const wrongBooks = await getWrongBooks();
    const questions = await getWrongQuestions();

    // 计算每个错题本的错题数量
    const booksWithCount = wrongBooks
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .map((book) => ({
        id: book.id,
        name: book.name,
        questionCount: questions.filter((q) => q.wrongBookId === book.id).length,
        sortOrder: book.sortOrder,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      }));

    return NextResponse.json({ wrongBooks: booksWithCount });
  } catch (error) {
    console.error('Get wrong books error:', error);
    return NextResponse.json({ error: '获取错题本失败' }, { status: 500 });
  }
}

// 创建错题本
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { name } = await request.json();
    const bookName = name?.trim() || '未命名错题本';

    const wrongBooks = await getWrongBooks();
    const maxOrder = wrongBooks.length > 0 
      ? Math.max(...wrongBooks.map(b => b.sortOrder))
      : -1;

    const newBook: WrongBook = {
      id: generateId(),
      name: bookName,
      sortOrder: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    wrongBooks.push(newBook);
    await saveWrongBooks(wrongBooks);

    return NextResponse.json({
      id: newBook.id,
      name: newBook.name,
      sortOrder: newBook.sortOrder,
      createdAt: newBook.createdAt,
      updatedAt: newBook.updatedAt,
    });
  } catch (error) {
    console.error('Create wrong book error:', error);
    return NextResponse.json({ error: '创建错题本失败' }, { status: 500 });
  }
}
