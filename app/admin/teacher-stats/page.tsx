import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function TeacherStatsPage() {
  const user = await getAuthUser();
  
  if (!user || user.type !== 'admin') {
    redirect('/');
  }

  const teachers = await prisma.teacher.findMany({
    where: { isActive: true },
    include: {
      students: {
        where: { isActive: true, deletedAt: null },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            ← 返回
          </Link>
          <h1 className="text-3xl font-bold text-blue-400">教师学生统计</h1>
        </div>

        <div className="glass-effect rounded-2xl p-8">
          {teachers.length === 0 ? (
            <p className="text-center text-gray-400">暂无教师账号</p>
          ) : (
            <div className="space-y-4">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="bg-gray-800 rounded-lg p-4 border border-blue-500/30"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-blue-400">{teacher.username}</h3>
                      <p className="text-gray-400 text-sm">
                        创建时间: {new Date(teacher.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-400">
                        {teacher.students.length}
                      </p>
                      <p className="text-sm text-gray-400">个学生</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
