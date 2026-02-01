import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** GET: 当前学生的所有错题本 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const list = await prisma.wrongNotebook.findMany({
      where: { studentId: user.id },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { questions: true } } },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '获取错题本失败' }, { status: 500 });
  }
}

/** POST: 创建错题本 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const nameStr = typeof body.name === 'string' ? body.name.trim() || '未命名错题本' : '未命名错题本';
    const notebook = await prisma.wrongNotebook.create({
      data: {
        student: { connect: { id: user.id } },
        name: nameStr,
      },
    });
    return NextResponse.json(notebook);
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : '创建错题本失败';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
