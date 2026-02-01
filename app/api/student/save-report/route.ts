import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { subject, selectedPath, questions, answers, score, durationSeconds } = await request.json();

    // 构建数据对象，使用 student.connect 来关联学生
    const reportData: any = {
      student: {
        connect: { id: user.id },
      },
      subject,
      selectedPath,
      questions,
      answers,
      score,
    };

    // 注意：如果云端数据库表还没有 duration_seconds 列，请先运行迁移
    // 暂时注释掉 durationSeconds，等数据库结构同步后再启用
    // if (typeof durationSeconds === 'number' && durationSeconds >= 0) {
    //   reportData.durationSeconds = durationSeconds;
    // }

    const report = await prisma.examReport.create({
      data: reportData,
    });

    return NextResponse.json({ reportId: report.id });
  } catch (error: any) {
    console.error('Save report error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    // 开发环境返回详细错误信息，生产环境只返回通用错误
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `保存失败: ${error?.message || String(error)}${error?.code ? ` (代码: ${error.code})` : ''}`
      : '保存失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
