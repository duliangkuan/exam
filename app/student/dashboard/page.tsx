import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import Link from 'next/link';
import { StudentProfileBadge } from '@/components/student/StudentProfileBadge';
import AnimatedBackground from '@/components/student/AnimatedBackground';
import LogoImage from '@/components/student/LogoImage';

/** 中央 Logo：优先使用环境变量 NEXT_PUBLIC_CENTER_LOGO_IMAGE，否则默认使用 /images/logo.png，都不存在时显示默认熊猫 */
const CENTER_LOGO_IMAGE = process.env.NEXT_PUBLIC_CENTER_LOGO_IMAGE || '/images/logo.png';

export default async function StudentDashboard() {
  const user = await getAuthUser();
  
  if (!user || user.type !== 'student') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#080c1c] relative overflow-hidden">
      {/* 动态背景 */}
      <AnimatedBackground />
      
      {/* 内容层 */}
      <div className="relative z-10 min-h-screen p-6 md:p-8 pb-20 flex flex-col overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full flex-1">
          {/* 顶部Header */}
          <div className="flex justify-between items-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              重庆专升本
            </h1>
            <div className="flex items-center gap-3">
              <StudentProfileBadge studentId={user.id} />
              <Link
                href="/"
                className="px-4 py-2 bg-slate-700/80 backdrop-blur-sm rounded-xl hover:bg-slate-600/80 transition-all text-white text-sm font-medium"
              >
                退出登录
              </Link>
            </div>
          </div>

          {/* 中央区域：Logo和标题 */}
          <div className="text-center mb-12 md:mb-16">
            <div className="mb-6 flex justify-center">
              <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center">
                <LogoImage src={CENTER_LOGO_IMAGE} />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-blue-400 mb-3 drop-shadow-lg">
              AI辅助学习系统
            </h2>
            <p className="text-gray-300 text-base md:text-lg">
              基于重庆考纲的个性化精准学习
            </p>
          </div>

          {/* 功能模块卡片：2x2网格布局 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
            {/* AI通关测 */}
            <Link
              href="/student/exam"
              className="group relative bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border border-slate-700/50 hover:border-blue-500/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex flex-col items-center text-center">
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">📝</div>
                <h2 className="text-2xl font-bold text-blue-400 mb-2 group-hover:text-cyan-400 transition-colors">
                  AI通关测
                </h2>
                <p className="text-gray-300 text-sm">智能测评定位知识薄弱点</p>
              </div>
            </Link>

            {/* AI精准练 */}
            <div
              className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl p-8 cursor-not-allowed opacity-60 border border-slate-700/30 overflow-hidden"
              title="此功能暂未上线，敬请期待"
            >
              <div className="flex flex-col items-center text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold text-blue-400 mb-2">AI精准练</h2>
                <p className="text-gray-300 text-sm">千人千面 靶向刷题</p>
              </div>
            </div>

            {/* AI错题本 */}
            <Link
              href="/student/notebook"
              className="group relative bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border border-slate-700/50 hover:border-blue-500/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex flex-col items-center text-center">
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">📚</div>
                <h2 className="text-2xl font-bold text-blue-400 mb-2 group-hover:text-cyan-400 transition-colors">
                  AI错题本
                </h2>
                <p className="text-gray-300 text-sm">提升成绩从消灭错题开始</p>
              </div>
            </Link>

            {/* 学习计划 */}
            <Link
              href="/student/assignments"
              className="group relative bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border border-slate-700/50 hover:border-blue-500/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex flex-col items-center text-center">
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">📋</div>
                <h2 className="text-2xl font-bold text-blue-400 mb-2 group-hover:text-cyan-400 transition-colors">
                  学习计划
                </h2>
                <p className="text-gray-300 text-sm">可视化任务表，养成自律娃</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
