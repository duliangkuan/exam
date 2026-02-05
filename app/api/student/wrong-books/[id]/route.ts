import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getWrongBooks, saveWrongBook, deleteWrongBook, getWrongQuestions, deleteWrongQuestion } from '@/lib/wrong-book-db';
import { prisma } from '@/lib/db';

// 更新错题本（重命名）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
    }

    const wrongBooks = await getWrongBooks(user.id);
    const currentBook = wrongBooks.find(b => b.id === id);

    if (!currentBook) {
      return NextResponse.json({ error: '错题本不存在' }, { status: 404 });
    }
    
    // 检查名称是否重复（在同一父目录下）
    const duplicateBook = wrongBooks.find(b => 
      b.id !== id && 
      b.name === name.trim() && 
      b.parentId === currentBook.parentId &&
      b.subject === currentBook.subject
    );
    if (duplicateBook) {
      return NextResponse.json({ error: '错题本名称已存在，请使用其他名称' }, { status: 400 });
    }

    const updatedBook = await saveWrongBook(user.id, {
      ...currentBook,
      name: name.trim(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: updatedBook.id,
      name: updatedBook.name,
      updatedAt: updatedBook.updatedAt,
    });
  } catch (error) {
    console.error('Update wrong book error:', error);
    return NextResponse.json({ error: '更新错题本失败' }, { status: 500 });
  }
}

// 删除错题本（递归删除所有子错题本和错题）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const wrongBooks = await getWrongBooks(user.id);
    const bookToDelete = wrongBooks.find(b => b.id === id);

    if (!bookToDelete) {
      return NextResponse.json({ error: '错题本不存在' }, { status: 404 });
    }

    // 递归查找所有子错题本
    const findChildBooks = (parentId: string): string[] => {
      const children: string[] = [];
      const directChildren = wrongBooks.filter(b => b.parentId === parentId);
      directChildren.forEach(child => {
        children.push(child.id);
        children.push(...findChildBooks(child.id));
      });
      return children;
    };

    const allBookIdsToDelete = [id, ...findChildBooks(id)];

    // 使用事务删除所有相关错题和错题本
    await prisma.$transaction(async (tx) => {
      // 删除所有相关错题
      await tx.wrongQuestion.deleteMany({
        where: {
          studentId: user.id,
          wrongBookId: { in: allBookIdsToDelete },
        },
      });

      // 删除所有相关错题本（递归删除）
      await tx.wrongBook.deleteMany({
        where: {
          studentId: user.id,
          id: { in: allBookIdsToDelete },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete wrong book error:', error);
    return NextResponse.json({ error: '删除错题本失败' }, { status: 500 });
  }
}
