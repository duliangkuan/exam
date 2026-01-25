import { NextRequest, NextResponse } from 'next/server';
import { comparePassword, setAuthToken, generateToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '请输入账号和密码' }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { username },
    });

    if (!teacher || !teacher.isActive) {
      return NextResponse.json({ error: '账号不存在或已被禁用' }, { status: 401 });
    }

    const isValid = await comparePassword(password, teacher.password);
    if (!isValid) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    const token = generateToken({ id: teacher.id, type: 'teacher' });
    const response = NextResponse.json({ success: true });
    await setAuthToken(token);

    return response;
  } catch (error) {
    console.error('Teacher login error:', error);
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
