import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import CreateTeacherForm from '@/components/admin/CreateTeacherForm';
import Link from 'next/link';

export default async function CreateTeacherPage() {
  const user = await getAuthUser();
  
  if (!user || user.type !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            ← 返回
          </Link>
          <h1 className="text-3xl font-bold text-blue-400">创建教师账号</h1>
        </div>

        <div className="glass-effect rounded-2xl p-8">
          <CreateTeacherForm />
        </div>
      </div>
    </div>
  );
}
