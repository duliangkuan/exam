import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import SubjectSelectFlow from '@/components/student/SubjectSelectFlow';
import Link from 'next/link';

const subjectNames: Record<string, string> = {
  chinese: '大学语文',
  english: '大学英语',
  math: '高等数学',
  computer: '计算机基础',
};

export default async function SelectPage({
  params,
}: {
  params: { subject: string };
}) {
  const user = await getAuthUser();
  
  if (!user || user.type !== 'student') {
    redirect('/');
  }

  const subject = params.subject;
  if (!['chinese', 'english', 'math', 'computer'].includes(subject)) {
    redirect('/student/exam');
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/student/exam"
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            ← 返回
          </Link>
          <h1 className="text-3xl font-bold text-blue-400">
            {subjectNames[subject]} - 选择知识点
          </h1>
        </div>

        <div className="glass-effect rounded-2xl p-8">
          <SubjectSelectFlow subject={subject} />
        </div>
      </div>
    </div>
  );
}
