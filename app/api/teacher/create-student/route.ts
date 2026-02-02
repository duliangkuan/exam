import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'teacher') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 });
    }

    // 检查用户名是否已存在
    const existing = await prisma.student.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json({ error: '该用户名已存在' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.student.create({
      data: {
        username,
        password: hashedPassword,
        createdByTeacherId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
