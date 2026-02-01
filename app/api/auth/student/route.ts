import { NextRequest, NextResponse } from 'next/server';
import { comparePassword, setAuthToken, generateToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '请输入账号和密码' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { username },
    });

    if (!student || !student.isActive || student.deletedAt) {
      return NextResponse.json({ error: '账号不存在或已被注销' }, { status: 401 });
    }

    const isValid = await comparePassword(password, student.password);
    if (!isValid) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    const token = generateToken({ id: student.id, type: 'student' });
    const response = NextResponse.json({ success: true });
    await setAuthToken(token);

    return response;
  } catch (error) {
    const err = error as Error;
    console.error('Student login error:', err);
    const message =
      process.env.NODE_ENV === 'development'
        ? err?.message || '登录失败'
        : '登录失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
