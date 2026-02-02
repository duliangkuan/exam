import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getWrongBooks, saveWrongBooks, getWrongQuestions, saveWrongQuestions } from '@/lib/wrong-book-cookie';

// 更新错题本（重命名）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
    }

    const wrongBooks = await getWrongBooks();
    const bookIndex = wrongBooks.findIndex(b => b.id === params.id);

    if (bookIndex === -1) {
      return NextResponse.json({ error: '错题本不存在' }, { status: 404 });
    }

    // 检查名称是否重复（排除当前错题本）
    const duplicateBook = wrongBooks.find(b => b.id !== params.id && b.name === name.trim());
    if (duplicateBook) {
      return NextResponse.json({ error: '错题本名称已存在，请使用其他名称' }, { status: 400 });
    }

    wrongBooks[bookIndex].name = name.trim();
    wrongBooks[bookIndex].updatedAt = new Date().toISOString();
    await saveWrongBooks(wrongBooks);

    return NextResponse.json({
      id: wrongBooks[bookIndex].id,
      name: wrongBooks[bookIndex].name,
      updatedAt: wrongBooks[bookIndex].updatedAt,
    });
  } catch (error) {
    console.error('Update wrong book error:', error);
    return NextResponse.json({ error: '更新错题本失败' }, { status: 500 });
  }
}

// 删除错题本（删除时，其下错题变为未归类）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const wrongBooks = await getWrongBooks();
    const bookIndex = wrongBooks.findIndex(b => b.id === params.id);

    if (bookIndex === -1) {
      return NextResponse.json({ error: '错题本不存在' }, { status: 404 });
    }

    // 先将其下错题的 wrongBookId 设为 null（未归类）
    const questions = await getWrongQuestions();
    questions.forEach(q => {
      if (q.wrongBookId === params.id) {
        q.wrongBookId = null;
        q.updatedAt = new Date().toISOString();
      }
    });
    await saveWrongQuestions(questions);

    // 然后删除错题本
    wrongBooks.splice(bookIndex, 1);
    await saveWrongBooks(wrongBooks);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete wrong book error:', error);
    return NextResponse.json({ error: '删除错题本失败' }, { status: 500 });
  }
}
