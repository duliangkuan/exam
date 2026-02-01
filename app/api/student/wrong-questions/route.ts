import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** GET: 当前学生的错题列表，可选 notebookId（不传则只返回未归类的） */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const { searchParams } = request.nextUrl;
    const notebookIdParam = searchParams.get('notebookId');
    const notebookId = notebookIdParam === null || notebookIdParam === '' ? null : notebookIdParam;
    const list = await prisma.wrongQuestion.findMany({
      where: {
        studentId: user.id,
        notebookId,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '获取错题失败' }, { status: 500 });
  }
}

/** POST: 创建错题 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '未命名错题';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const notebookId = body.notebookId === undefined || body.notebookId === null
      ? null
      : (typeof body.notebookId === 'string' ? body.notebookId : null);
    if (notebookId) {
      const nb = await prisma.wrongNotebook.findFirst({
        where: { id: notebookId, studentId: user.id },
      });
      if (!nb) {
        return NextResponse.json({ error: '错题本不存在' }, { status: 400 });
      }
    }
    const question = await prisma.wrongQuestion.create({
      data: {
        student: { connect: { id: user.id } },
        ...(notebookId ? { notebook: { connect: { id: notebookId } } } : {}),
        name: name || '未命名错题',
        content: content || '',
      },
    });
    return NextResponse.json(question);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '创建错题失败' }, { status: 500 });
  }
}
