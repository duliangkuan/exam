// 数据库状态检查脚本
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 正在检查数据库连接...\n');

    // 检查所有表是否存在
    const tables = [
      'admins',
      'teachers',
      'students',
      'assignments',
      'exam_reports',
      'wrong_books',
      'wrong_questions',
    ];

    console.log('📊 检查表结构：');
    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = $1`,
          table
        );
        const exists = result[0]?.count > 0;
        console.log(`  ${exists ? '✅' : '❌'} ${table}: ${exists ? '存在' : '不存在'}`);
      } catch (error) {
        console.log(`  ❌ ${table}: 检查失败`);
      }
    }

    console.log('\n📈 检查数据统计：');
    
    // 检查各表的数据量
    const counts = {
      admins: await prisma.admin.count(),
      teachers: await prisma.teacher.count(),
      students: await prisma.student.count(),
      assignments: await prisma.assignment.count(),
      examReports: await prisma.examReport.count(),
      wrongBooks: await prisma.wrongBook.count(),
      wrongQuestions: await prisma.wrongQuestion.count(),
    };

    console.log(`  📝 Admins: ${counts.admins}`);
    console.log(`  👨‍🏫 Teachers: ${counts.teachers}`);
    console.log(`  👨‍🎓 Students: ${counts.students}`);
    console.log(`  📋 Assignments: ${counts.assignments}`);
    console.log(`  📊 Exam Reports: ${counts.examReports}`);
    console.log(`  📚 Wrong Books: ${counts.wrongBooks}`);
    console.log(`  ❓ Wrong Questions: ${counts.wrongQuestions}`);

    // 检查 WrongBook 表的字段
    console.log('\n🔍 检查 WrongBook 表结构：');
    const wrongBookSample = await prisma.wrongBook.findFirst();
    if (wrongBookSample) {
      console.log('  ✅ WrongBook 表有数据，字段检查：');
      console.log(`    - id: ${wrongBookSample.id ? '✅' : '❌'}`);
      console.log(`    - studentId: ${wrongBookSample.studentId ? '✅' : '❌'}`);
      console.log(`    - name: ${wrongBookSample.name ? '✅' : '❌'}`);
      console.log(`    - subject: ${wrongBookSample.subject !== undefined ? '✅' : '❌'} (值: ${wrongBookSample.subject || 'null'})`);
      console.log(`    - parentId: ${wrongBookSample.parentId !== undefined ? '✅' : '❌'} (值: ${wrongBookSample.parentId || 'null'})`);
      console.log(`    - sortOrder: ${wrongBookSample.sortOrder !== undefined ? '✅' : '❌'}`);
    } else {
      console.log('  ℹ️  WrongBook 表为空（这是正常的，如果还没有创建错题本）');
    }

    // 检查 WrongQuestion 表的字段
    console.log('\n🔍 检查 WrongQuestion 表结构：');
    const wrongQuestionSample = await prisma.wrongQuestion.findFirst();
    if (wrongQuestionSample) {
      console.log('  ✅ WrongQuestion 表有数据，字段检查：');
      console.log(`    - id: ${wrongQuestionSample.id ? '✅' : '✅'}`);
      console.log(`    - studentId: ${wrongQuestionSample.studentId ? '✅' : '❌'}`);
      console.log(`    - wrongBookId: ${wrongQuestionSample.wrongBookId !== undefined ? '✅' : '❌'} (值: ${wrongQuestionSample.wrongBookId || 'null'})`);
      console.log(`    - name: ${wrongQuestionSample.name ? '✅' : '❌'}`);
      console.log(`    - content: ${wrongQuestionSample.content ? '✅' : '❌'}`);
      console.log(`    - subject: ${wrongQuestionSample.subject !== undefined ? '✅' : '❌'} (值: ${wrongQuestionSample.subject || 'null'})`);
      console.log(`    - sortOrder: ${wrongQuestionSample.sortOrder !== undefined ? '✅' : '❌'}`);
    } else {
      console.log('  ℹ️  WrongQuestion 表为空（这是正常的，如果还没有创建错题）');
    }

    // 检查索引
    console.log('\n🔍 检查索引：');
    try {
      const indexes = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(
        `SELECT indexname FROM pg_indexes WHERE tablename IN ('wrong_books', 'wrong_questions')`
      );
      console.log(`  ✅ 找到 ${indexes.length} 个索引`);
      indexes.forEach(idx => console.log(`    - ${idx.indexname}`));
    } catch (error) {
      console.log('  ⚠️  无法检查索引（可能是权限问题）');
    }

    console.log('\n✅ 数据库检查完成！');
  } catch (error) {
    console.error('❌ 数据库检查失败：', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
