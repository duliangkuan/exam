import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, comparePassword, setAuthToken, generateToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

const ADMIN_PASSWORD = 'admin888';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    // 检查或创建管理员
    let admin = await prisma.admin.findFirst();
    if (!admin) {
      const hashedPassword = await hashPassword(ADMIN_PASSWORD);
      admin = await prisma.admin.create({
        data: { password: hashedPassword },
      });
    }

    const token = generateToken({ id: admin.id, type: 'admin' });
    const response = NextResponse.json({ success: true });
    await setAuthToken(token);

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
