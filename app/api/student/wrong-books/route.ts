import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getWrongBooks, saveWrongBook, generateId, WrongBook, getNestingLevel } from '@/lib/wrong-book-db';

// 获取错题本列表（支持按学科和父错题本筛选）
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const parentId = searchParams.get('parentId');

    let wrongBooks = await getWrongBooks(user.id);

    // 按学科筛选
    if (subject) {
      wrongBooks = wrongBooks.filter(b => b.subject === subject);
    }

    // 按父错题本筛选
    if (parentId === 'null' || parentId === '') {
      wrongBooks = wrongBooks.filter(b => b.parentId === null);
    } else if (parentId) {
      wrongBooks = wrongBooks.filter(b => b.parentId === parentId);
    }

    // 排序
    wrongBooks.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ wrongBooks });
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

    const { name, subject, parentId } = await request.json();
    const bookName = name?.trim() || '未命名错题本';

    const wrongBooks = await getWrongBooks(user.id);

    // 验证嵌套层级（最多5级）
    if (parentId) {
      const level = getNestingLevel(parentId, wrongBooks);
      if (level >= 5) {
        return NextResponse.json({ error: '嵌套层级已达到最大限制（5级）' }, { status: 400 });
      }

      // 验证父错题本是否存在且属于同一学科
      const parentBook = wrongBooks.find(b => b.id === parentId);
      if (!parentBook) {
        return NextResponse.json({ error: '父错题本不存在' }, { status: 404 });
      }
      if (subject && parentBook.subject !== subject) {
        return NextResponse.json({ error: '父错题本学科不匹配' }, { status: 400 });
      }
    }

    // 获取当前目录下的最大sortOrder
    const filteredBooks = wrongBooks.filter(b => {
      if (subject && b.subject !== subject) return false;
      if (parentId === null || parentId === undefined) {
        return b.parentId === null;
      }
      return b.parentId === parentId;
    });
    const maxOrder = filteredBooks.length > 0 
      ? Math.max(...filteredBooks.map(b => b.sortOrder))
      : -1;

    const newBook: WrongBook = {
      id: generateId(),
      name: bookName,
      subject: subject || null,
      parentId: parentId || null,
      sortOrder: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveWrongBook(user.id, newBook);

    return NextResponse.json(newBook);
  } catch (error) {
    console.error('Create wrong book error:', error);
    return NextResponse.json({ error: '创建错题本失败' }, { status: 500 });
  }
}
