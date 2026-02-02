import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    // 错题本接口占位，待实现
    return NextResponse.json({ questions: [] });
  } catch (error) {
    console.error('Wrong questions error:', error);
    return NextResponse.json({ error: '获取错题失败' }, { status: 500 });
  }
}
