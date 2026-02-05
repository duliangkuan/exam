import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getWrongBooks, saveWrongBook } from '@/lib/wrong-book-db';

// 更新错题本排序
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { sortOrder } = await request.json();
    if (typeof sortOrder !== 'number') {
      return NextResponse.json({ error: '排序序号无效' }, { status: 400 });
    }

    const wrongBooks = await getWrongBooks(user.id);
    const book = wrongBooks.find(b => b.id === params.id);

    if (!book) {
      return NextResponse.json({ error: '错题本不存在' }, { status: 404 });
    }

    const updatedBook = await saveWrongBook(user.id, {
      ...book,
      sortOrder,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: updatedBook.id,
      sortOrder: updatedBook.sortOrder,
    });
  } catch (error) {
    console.error('Update wrong book order error:', error);
    return NextResponse.json({ error: '更新排序失败' }, { status: 500 });
  }
}
