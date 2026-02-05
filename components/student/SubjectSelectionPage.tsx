'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SUBJECT_MAP, SubjectKey } from '@/lib/wrong-book-types';

export default function SubjectSelectionPage() {
  const router = useRouter();

  const handleSubjectClick = (subject: SubjectKey) => {
    router.push(`/student/notebook/${subject}`);
  };

  return (
    <div className="min-h-screen p-8 bg-[#080c1c]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/student/dashboard"
            className="px-4 py-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-lg hover:bg-slate-700/80 transition text-gray-300"
          >
            ← 返回
          </Link>
          <h1 className="text-3xl font-bold text-cyan-400">错题本</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Object.keys(SUBJECT_MAP) as SubjectKey[]).map((subject) => (
            <button
              key={subject}
              onClick={() => handleSubjectClick(subject)}
              className="glass-effect rounded-2xl p-8 hover:border-cyan-400/50 transition-all duration-300 transform hover:scale-105 cursor-pointer text-left"
            >
              <div className="text-2xl font-bold text-cyan-400 mb-2">
                {SUBJECT_MAP[subject]}
              </div>
              <div className="text-gray-400 text-sm">
                点击查看错题本
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
