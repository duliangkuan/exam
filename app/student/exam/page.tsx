import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import Link from 'next/link';

export default async function ExamPage() {
  const user = await getAuthUser();
  
  if (!user || user.type !== 'student') {
    redirect('/');
  }

  const subjects = [
    { id: 'chinese', name: '大学语文', icon: '📖' },
    { id: 'english', name: '大学英语', icon: '🔤' },
    { id: 'math', name: '高等数学', icon: '📐' },
    { id: 'computer', name: '计算机基础', icon: '💻' },
  ];

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
          <h1 className="text-3xl font-bold text-blue-400">AI通关测</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {subjects.map((subject) => (
            <div key={subject.id} className="flex flex-col gap-4">
              <Link
                href={`/student/exam/${subject.id}/select`}
                className="glass-effect rounded-2xl p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 glow-blue-hover flex flex-col items-center justify-center min-h-[140px]"
              >
                <div className="text-5xl mb-2">{subject.icon}</div>
                <h2 className="text-xl font-bold text-blue-400">{subject.name}</h2>
              </Link>
              <Link
                href={`/student/exam/${subject.id}/knowledge-tree`}
                className="glass-effect rounded-2xl p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 glow-blue-hover flex flex-col items-center justify-center min-h-[120px] border border-cyan-500/30"
              >
                <div className="text-4xl mb-2">🌳</div>
                <h2 className="text-lg font-bold text-cyan-400">{subject.name}知识树</h2>
                <p className="text-gray-400 text-xs mt-1">层级结构 · 掌握情况</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
