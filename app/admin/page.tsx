import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import Link from 'next/link';

export default async function AdminPage() {
  const user = await getAuthUser();
  
  if (!user || user.type !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            管理端
          </h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            返回主页
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/create-teacher"
            className="glass-effect rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 glow-blue-hover"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">➕</div>
              <h2 className="text-2xl font-bold text-blue-400 mb-2">创建教师账号</h2>
              <p className="text-gray-300">为教师创建登录账号</p>
            </div>
          </Link>

          <Link
            href="/admin/teacher-stats"
            className="glass-effect rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 glow-blue-hover"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-blue-400 mb-2">查看统计</h2>
              <p className="text-gray-300">查看教师和学生统计信息</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
