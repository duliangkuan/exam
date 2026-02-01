import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import Link from 'next/link';
import KnowledgeTreeView from '@/components/student/KnowledgeTreeView';
import { SUBJECT_NAMES } from '@/lib/exam-nodes';

const VALID_SUBJECTS = ['chinese', 'english', 'math', 'computer'];

export default async function KnowledgeTreePage({
  params,
}: {
  params: { subject: string };
}) {
  const user = await getAuthUser();
  if (!user || user.type !== 'student') {
    redirect('/');
  }

  const { subject } = params;
  if (!VALID_SUBJECTS.includes(subject)) {
    redirect('/student/exam');
  }

  const subjectName = SUBJECT_NAMES[subject] ?? subject;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/student/exam"
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            ← 返回
          </Link>
          <h1 className="text-3xl font-bold text-blue-400">
            {subjectName}知识树
          </h1>
        </div>
        <p className="text-gray-400 mb-4">
          点击任意「节」可查看该节的历史测评报告。
        </p>
        <div className="flex flex-wrap gap-6 mb-6 text-sm text-gray-400">
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded border-2 border-green-400/60 bg-green-900/20 shadow" />
            已通关（≥80分）
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded border-2 border-amber-500/40 bg-slate-800/70 opacity-90" />
            有测评未通关
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded border-2 border-slate-500 opacity-50 grayscale" />
            未测（灰暗）
          </span>
        </div>
        <div className="glass-effect rounded-2xl p-6 border border-cyan-500/20">
          <KnowledgeTreeView subject={subject} subjectName={subjectName} />
        </div>
      </div>
    </div>
  );
}
