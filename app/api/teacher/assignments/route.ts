import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'teacher') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { studentId, content } = await request.json();

    if (!studentId || !content) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });
    }

    // 验证该学生是否属于当前教师
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.createdByTeacherId !== user.id) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 });
    }

    await prisma.assignment.create({
      data: {
        teacherId: user.id,
        studentId,
        content,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Create assignment error:', error);
    return NextResponse.json({ error: '发送失败' }, { status: 500 });
  }
}
