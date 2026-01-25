import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'teacher') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const formData = await request.formData();
    const studentId = formData.get('studentId') as string;

    if (!studentId) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    // 验证该学生是否属于当前教师
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.createdByTeacherId !== user.id) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 });
    }

    // 删除学生及其所有相关数据（永久删除）
    await prisma.examReport.deleteMany({
      where: { studentId },
    });

    await prisma.assignment.deleteMany({
      where: { studentId },
    });

    await prisma.student.delete({
      where: { id: studentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
