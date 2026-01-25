import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function NotebookPage() {
  const user = await getAuthUser();
  
  if (!user || user.type !== 'student') {
    redirect('/');
  }

  const reports = await prisma.examReport.findMany({
    where: { studentId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/student/dashboard"
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            ← 返回
          </Link>
          <h1 className="text-3xl font-bold text-blue-400">AI错题本</h1>
        </div>

        <div className="glass-effect rounded-2xl p-8">
          {reports.length === 0 ? (
            <p className="text-center text-gray-400 py-12">暂无测评报告</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/student/exam/${getSubjectId(report.subject)}/report/${report.id}`}
                  className="bg-gray-800 rounded-lg p-6 border border-blue-500/30 hover:border-blue-500 transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-blue-400">{report.subject}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {new Date(report.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-cyan-400">{report.score}</p>
                      <p className="text-sm text-gray-400">分</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">
                    知识点: {typeof report.selectedPath === 'string' ? report.selectedPath : JSON.stringify(report.selectedPath)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getSubjectId(subject: string): string {
  const map: Record<string, string> = {
    '大学语文': 'chinese',
    '大学英语': 'english',
    '高等数学': 'math',
    '计算机基础': 'computer',
  };
  return map[subject] || 'chinese';
}
