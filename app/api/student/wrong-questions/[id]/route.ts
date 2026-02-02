import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getWrongQuestions, saveWrongQuestions, getWrongBooks } from '@/lib/wrong-book-cookie';

// 更新错题（重命名、修改内容、移动错题本）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { name, content, wrongBookId } = await request.json();

    const questions = await getWrongQuestions();
    const questionIndex = questions.findIndex(q => q.id === params.id);

    if (questionIndex === -1) {
      return NextResponse.json({ error: '错题不存在' }, { status: 404 });
    }

    const question = questions[questionIndex];

    // 如果修改了名称，检查名称是否为空和是否重复
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
      }

      // 检查名称是否重复（排除当前错题，在同一错题本内检查）
      const targetBookId = wrongBookId !== undefined ? (wrongBookId || null) : question.wrongBookId;
      const duplicateQuestion = questions.find(
        q => q.id !== params.id 
          && q.wrongBookId === targetBookId 
          && q.name === name.trim()
      );
      if (duplicateQuestion) {
        return NextResponse.json({ error: '错题名称已存在，请使用其他名称' }, { status: 400 });
      }
    }

    // 如果修改了 wrongBookId，验证新错题本是否存在
    if (wrongBookId !== undefined && wrongBookId !== question.wrongBookId) {
      if (wrongBookId) {
        const books = await getWrongBooks();
        const book = books.find(b => b.id === wrongBookId);
        if (!book) {
          return NextResponse.json({ error: '错题本不存在' }, { status: 404 });
        }
      }
    }

    // 更新字段
    if (name !== undefined) questions[questionIndex].name = name.trim();
    if (content !== undefined) questions[questionIndex].content = content.trim();
    
    if (wrongBookId !== undefined) {
      const oldBookId = questions[questionIndex].wrongBookId;
      questions[questionIndex].wrongBookId = wrongBookId || null;
      
      // 如果移动了错题本，需要重新计算 sortOrder
      if (wrongBookId !== oldBookId) {
        const targetQuestions = questions.filter(
          q => q.wrongBookId === (wrongBookId || null) && q.id !== params.id
        );
        const maxOrder = targetQuestions.length > 0
          ? Math.max(...targetQuestions.map(q => q.sortOrder))
          : -1;
        questions[questionIndex].sortOrder = maxOrder + 1;
      }
    }

    questions[questionIndex].updatedAt = new Date().toISOString();
    await saveWrongQuestions(questions);

    return NextResponse.json({
      id: questions[questionIndex].id,
      name: questions[questionIndex].name,
      content: questions[questionIndex].content,
      wrongBookId: questions[questionIndex].wrongBookId,
      sortOrder: questions[questionIndex].sortOrder,
      updatedAt: questions[questionIndex].updatedAt,
    });
  } catch (error) {
    console.error('Update wrong question error:', error);
    return NextResponse.json({ error: '更新错题失败' }, { status: 500 });
  }
}

// 删除错题
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const questions = await getWrongQuestions();
    const questionIndex = questions.findIndex(q => q.id === params.id);

    if (questionIndex === -1) {
      return NextResponse.json({ error: '错题不存在' }, { status: 404 });
    }

    questions.splice(questionIndex, 1);
    await saveWrongQuestions(questions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete wrong question error:', error);
    return NextResponse.json({ error: '删除错题失败' }, { status: 500 });
  }
}
