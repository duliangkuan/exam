import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** PATCH: 更新错题（名称、内容、所属错题本） */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const question = await prisma.wrongQuestion.findFirst({
      where: { id: params.id, studentId: user.id },
    });
    if (!question) {
      return NextResponse.json({ error: '错题不存在' }, { status: 404 });
    }
    const body = await request.json();
    const data: { name?: string; content?: string; notebookId?: string | null } = {};
    if (typeof body.name === 'string') data.name = body.name.trim() || question.name;
    if (typeof body.content === 'string') data.content = body.content.trim();
    if (body.notebookId !== undefined) {
      data.notebookId = body.notebookId === null || body.notebookId === '' ? null : body.notebookId;
      if (data.notebookId) {
        const nb = await prisma.wrongNotebook.findFirst({
          where: { id: data.notebookId, studentId: user.id },
        });
        if (!nb) {
          return NextResponse.json({ error: '错题本不存在' }, { status: 400 });
        }
      }
    }
    const updated = await prisma.wrongQuestion.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

/** DELETE: 删除错题 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const question = await prisma.wrongQuestion.findFirst({
      where: { id: params.id, studentId: user.id },
    });
    if (!question) {
      return NextResponse.json({ error: '错题不存在' }, { status: 404 });
    }
    await prisma.wrongQuestion.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
