import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getWrongQuestions, saveWrongQuestion, deleteWrongQuestion, getWrongBooks } from '@/lib/wrong-book-db';

// 更新错题（重命名、修改内容、移动错题本）
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
    const { name, content, wrongBookId } = await request.json();

    const questions = await getWrongQuestions(user.id);
    const question = questions.find(q => q.id === id);

    if (!question) {
      return NextResponse.json({ error: '错题不存在' }, { status: 404 });
    }

    // 如果修改了名称，检查名称是否为空和是否重复
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
      }

      // 检查名称是否重复（排除当前错题，在同一错题本内检查）
      const targetBookId = wrongBookId !== undefined ? (wrongBookId || null) : question.wrongBookId;
      const duplicateQuestion = questions.find(
        q => q.id !== id 
          && q.wrongBookId === targetBookId 
          && q.subject === question.subject
          && q.name === name.trim()
      );
      if (duplicateQuestion) {
        return NextResponse.json({ error: '错题名称已存在，请使用其他名称' }, { status: 400 });
      }
    }

    // 如果修改了 wrongBookId，验证新错题本是否存在且属于同一学科
    if (wrongBookId !== undefined && wrongBookId !== question.wrongBookId) {
      if (wrongBookId) {
        const books = await getWrongBooks(user.id);
        const book = books.find(b => b.id === wrongBookId);
        if (!book) {
          return NextResponse.json({ error: '错题本不存在' }, { status: 404 });
        }
        if (question.subject && book.subject !== question.subject) {
          return NextResponse.json({ error: '错题本学科不匹配' }, { status: 400 });
        }
      }
    }

    // 计算新的 sortOrder（如果移动了错题本）
    let newSortOrder = question.sortOrder;
    if (wrongBookId !== undefined && wrongBookId !== question.wrongBookId) {
      const targetQuestions = questions.filter(
        q => q.wrongBookId === (wrongBookId || null) 
          && q.subject === question.subject
          && q.id !== id
      );
      const maxOrder = targetQuestions.length > 0
        ? Math.max(...targetQuestions.map(q => q.sortOrder))
        : -1;
      newSortOrder = maxOrder + 1;
    }

    const updatedQuestion = await saveWrongQuestion(user.id, {
      ...question,
      name: name !== undefined ? name.trim() : question.name,
      content: content !== undefined ? content.trim() : question.content,
      wrongBookId: wrongBookId !== undefined ? (wrongBookId || null) : question.wrongBookId,
      sortOrder: newSortOrder,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: updatedQuestion.id,
      name: updatedQuestion.name,
      content: updatedQuestion.content,
      wrongBookId: updatedQuestion.wrongBookId,
      sortOrder: updatedQuestion.sortOrder,
      updatedAt: updatedQuestion.updatedAt,
    });
  } catch (error) {
    console.error('Update wrong question error:', error);
    return NextResponse.json({ error: '更新错题失败' }, { status: 500 });
  }
}

// 删除错题
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
    
    // 验证错题是否存在且属于当前学生
    const questions = await getWrongQuestions(user.id);
    const question = questions.find(q => q.id === id);

    if (!question) {
      return NextResponse.json({ error: '错题不存在' }, { status: 404 });
    }

    await deleteWrongQuestion(user.id, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete wrong question error:', error);
    return NextResponse.json({ error: '删除错题失败' }, { status: 500 });
  }
}
