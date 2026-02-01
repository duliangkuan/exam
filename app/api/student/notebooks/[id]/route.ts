import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** PATCH: 重命名错题本 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const notebook = await prisma.wrongNotebook.findFirst({
      where: { id: params.id, studentId: user.id },
    });
    if (!notebook) {
      return NextResponse.json({ error: '错题本不存在' }, { status: 404 });
    }
    const { name } = await request.json();
    const nameStr = typeof name === 'string' ? name.trim() : notebook.name;
    const updated = await prisma.wrongNotebook.update({
      where: { id: params.id },
      data: { name: nameStr || notebook.name },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '重命名失败' }, { status: 500 });
  }
}

/** DELETE: 删除错题本（其内错题一并删除） */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const notebook = await prisma.wrongNotebook.findFirst({
      where: { id: params.id, studentId: user.id },
      include: { _count: { select: { questions: true } } },
    });
    if (!notebook) {
      return NextResponse.json({ error: '错题本不存在' }, { status: 404 });
    }
    await prisma.wrongNotebook.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, deletedQuestions: notebook._count.questions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
