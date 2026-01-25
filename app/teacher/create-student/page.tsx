import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import CreateStudentForm from '@/components/teacher/CreateStudentForm';
import DeleteStudentButton from '@/components/teacher/DeleteStudentButton';
import Link from 'next/link';

export default async function CreateStudentPage() {
  const user = await getAuthUser();
  
  if (!user || user.type !== 'teacher') {
    redirect('/');
  }

  const students = await prisma.student.findMany({
    where: {
      createdByTeacherId: user.id,
      isActive: true,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/teacher"
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            ← 返回
          </Link>
          <h1 className="text-3xl font-bold text-blue-400">创建学生账号</h1>
        </div>

        <div className="glass-effect rounded-2xl p-8 mb-6">
          <CreateStudentForm />
        </div>

        <div className="glass-effect rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-blue-400 mb-4">学生列表</h2>
          {students.length === 0 ? (
            <p className="text-center text-gray-400">暂无学生账号</p>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="bg-gray-800 rounded-lg p-4 border border-blue-500/30 flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-blue-400">{student.username}</p>
                    <p className="text-sm text-gray-400">
                      创建时间: {new Date(student.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <DeleteStudentButton studentId={student.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
