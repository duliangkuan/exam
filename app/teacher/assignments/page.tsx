import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import AssignmentForm from '@/components/teacher/AssignmentForm';

export default async function AssignmentsPage() {
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
          <h1 className="text-3xl font-bold text-blue-400">布置作业</h1>
        </div>

        <div className="glass-effect rounded-2xl p-8">
          <AssignmentForm students={students} />
        </div>
      </div>
    </div>
  );
}
