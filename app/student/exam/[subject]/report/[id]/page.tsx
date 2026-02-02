import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getKnowledgePointCount, getKnowledgePointList } from '@/lib/exam-nodes';
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
    include: { student: true },
  });

  if (!report || report.studentId !== user.id) {
    redirect('/student/dashboard');
  }

  const selectedPath =
    report.selectedPath && typeof report.selectedPath === 'object'
      ? (report.selectedPath as Record<string, string>)
      : null;
  const knowledgePointCount = getKnowledgePointCount(
    report.subject,
    selectedPath
  );
  const knowledgePointList = getKnowledgePointList(
    report.subject,
    selectedPath
  );
  const studentName =
    report.student?.username || '学生';

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

        <ReportView
          report={report}
          studentName={studentName}
          knowledgePointCount={knowledgePointCount}
          knowledgePointList={knowledgePointList}
        />
      </div>
    </div>
  );
}
