import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getWrongBooks as getCookieBooks, getWrongQuestions as getCookieQuestions } from '@/lib/wrong-book-cookie';
import { saveWrongBooks, saveWrongQuestions } from '@/lib/wrong-book-db';
import { getWrongBooks as getDbBooks, getWrongQuestions as getDbQuestions } from '@/lib/wrong-book-db';

// 数据迁移：从 Cookie 迁移到数据库
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 检查数据库中是否已有数据
    const dbBooks = await getDbBooks(user.id);
    const dbQuestions = await getDbQuestions(user.id);

    if (dbBooks.length > 0 || dbQuestions.length > 0) {
      return NextResponse.json({ 
        error: '数据库中已存在错题本数据，无法迁移',
        hasData: true 
      }, { status: 400 });
    }

    // 从 Cookie 读取数据
    const cookieBooks = await getCookieBooks();
    const cookieQuestions = await getCookieQuestions();

    if (cookieBooks.length === 0 && cookieQuestions.length === 0) {
      return NextResponse.json({ 
        message: 'Cookie 中没有数据需要迁移',
        migrated: false 
      });
    }

    // 迁移到数据库
    if (cookieBooks.length > 0) {
      await saveWrongBooks(user.id, cookieBooks);
    }
    if (cookieQuestions.length > 0) {
      await saveWrongQuestions(user.id, cookieQuestions);
    }

    return NextResponse.json({
      success: true,
      migrated: true,
      booksCount: cookieBooks.length,
      questionsCount: cookieQuestions.length,
      message: `成功迁移 ${cookieBooks.length} 个错题本和 ${cookieQuestions.length} 道错题到数据库`,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || '数据迁移失败' },
      { status: 500 }
    );
  }
}
