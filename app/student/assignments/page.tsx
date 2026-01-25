import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function AssignmentsPage() {
  const user = await getAuthUser();
  
  if (!user || user.type !== 'student') {
    redirect('/');
  }

  const assignments = await prisma.assignment.findMany({
    where: { studentId: user.id },
    include: {
      teacher: {
        select: { username: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/student/dashboard"
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            ← 返回
          </Link>
          <h1 className="text-3xl font-bold text-blue-400">学习计划</h1>
        </div>

        <div className="glass-effect rounded-2xl p-8">
          {assignments.length === 0 ? (
            <p className="text-center text-gray-400 py-12">暂无作业</p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-gray-800 rounded-lg p-6 border border-blue-500/30"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-blue-400">
                        来自: {assignment.teacher.username} 老师
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {new Date(assignment.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-white whitespace-pre-wrap">{assignment.content}</p>
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
