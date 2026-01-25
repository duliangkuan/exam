import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'teacher') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: '请选择学生' }, { status: 400 });
    }

    // 验证该学生是否属于当前教师
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.createdByTeacherId !== user.id) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 });
    }

    const reports = await prisma.examReport.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });

    // PostgreSQL的Json类型已经是对象，无需解析
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json({ error: '获取报告失败' }, { status: 500 });
  }
}
