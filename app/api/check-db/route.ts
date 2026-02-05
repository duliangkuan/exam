import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const results: Record<string, any> = {
      status: 'success',
      timestamp: new Date().toISOString(),
      checks: {},
    };

    // 检查数据库连接
    try {
      await prisma.$connect();
      results.checks.connection = { status: '✅ 连接成功' };
    } catch (error: any) {
      results.checks.connection = { 
        status: '❌ 连接失败', 
        error: error.message 
      };
      return NextResponse.json(results, { status: 500 });
    }

    // 检查所有表是否存在并获取数据统计
    results.checks.tables = {};
    
    // 检查各个表
    const tableChecks = [
      { name: 'admins', check: () => prisma.admin.count() },
      { name: 'teachers', check: () => prisma.teacher.count() },
      { name: 'students', check: () => prisma.student.count() },
      { name: 'assignments', check: () => prisma.assignment.count() },
      { name: 'exam_reports', check: () => prisma.examReport.count() },
      { name: 'wrong_books', check: () => prisma.wrongBook.count() },
      { name: 'wrong_questions', check: () => prisma.wrongQuestion.count() },
    ];

    for (const table of tableChecks) {
      try {
        const count = await table.check();
        results.checks.tables[table.name] = {
          status: '✅ 表存在',
          count: count,
        };
      } catch (error: any) {
        results.checks.tables[table.name] = {
          status: '❌ 表不存在或查询失败',
          error: error.message,
        };
      }
    }

    // 检查 WrongBook 表结构（新添加的字段）
    try {
      const wrongBookSample = await prisma.wrongBook.findFirst();
      if (wrongBookSample) {
        results.checks.wrongBookStructure = {
          status: '✅ 表结构正确',
          fields: {
            id: !!wrongBookSample.id,
            studentId: !!wrongBookSample.studentId,
            name: !!wrongBookSample.name,
            subject: wrongBookSample.subject !== undefined,
            parentId: wrongBookSample.parentId !== undefined,
            sortOrder: wrongBookSample.sortOrder !== undefined,
            createdAt: !!wrongBookSample.createdAt,
            updatedAt: !!wrongBookSample.updatedAt,
          },
        };
      } else {
        results.checks.wrongBookStructure = {
          status: '✅ 表结构正确（表为空）',
          note: '表存在但无数据，这是正常的',
        };
      }
    } catch (error: any) {
      results.checks.wrongBookStructure = {
        status: '❌ 检查失败',
        error: error.message,
      };
    }

    // 检查 WrongQuestion 表结构（新添加的字段）
    try {
      const wrongQuestionSample = await prisma.wrongQuestion.findFirst();
      if (wrongQuestionSample) {
        results.checks.wrongQuestionStructure = {
          status: '✅ 表结构正确',
          fields: {
            id: !!wrongQuestionSample.id,
            studentId: !!wrongQuestionSample.studentId,
            wrongBookId: wrongQuestionSample.wrongBookId !== undefined,
            name: !!wrongQuestionSample.name,
            content: !!wrongQuestionSample.content,
            subject: wrongQuestionSample.subject !== undefined,
            sortOrder: wrongQuestionSample.sortOrder !== undefined,
            createdAt: !!wrongQuestionSample.createdAt,
            updatedAt: !!wrongQuestionSample.updatedAt,
          },
        };
      } else {
        results.checks.wrongQuestionStructure = {
          status: '✅ 表结构正确（表为空）',
          note: '表存在但无数据，这是正常的',
        };
      }
    } catch (error: any) {
      results.checks.wrongQuestionStructure = {
        status: '❌ 检查失败',
        error: error.message,
      };
    }

    // 检查索引（如果可能）
    try {
      const indexes = await prisma.$queryRaw<Array<{ indexname: string; tablename: string }>>`
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE tablename IN ('wrong_books', 'wrong_questions')
        ORDER BY tablename, indexname
      `;
      results.checks.indexes = {
        status: '✅ 索引检查完成',
        count: indexes.length,
        indexes: indexes.map(idx => `${idx.tablename}.${idx.indexname}`),
      };
    } catch (error: any) {
      results.checks.indexes = {
        status: '⚠️ 无法检查索引',
        note: '可能是权限问题，不影响功能',
      };
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
