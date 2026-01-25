import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import ReportView from '@/components/student/ReportView';

export default async function ReportPage({
  params,
}: {
  params: { subject: string; id: string };
}) {
  const user = await getAuthUser();
  
  if (!user || user.type !== 'student') {
    redirect('/');
  }

  const report = await prisma.examReport.findUnique({
    where: { id: params.id },
  });

  if (!report || report.studentId !== user.id) {
    redirect('/student/dashboard');
  }

  // 解析JSON字符串
  const reportData = {
    ...report,
    selectedPath: JSON.parse(report.selectedPath),
    questions: JSON.parse(report.questions),
    answers: JSON.parse(report.answers),
  };

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
          <h1 className="text-3xl font-bold text-blue-400">测评报告</h1>
        </div>

        <ReportView report={reportData} />
      </div>
    </div>
  );
}
