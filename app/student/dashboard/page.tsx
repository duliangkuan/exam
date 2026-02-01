import { redirect } from 'next/navigation';
import Image from 'next/image';
import { getAuthUser } from '@/lib/auth';
import Link from 'next/link';
import { StudentProfileBadge } from '@/components/student/StudentProfileBadge';

/** 中央 Logo：.env 中 NEXT_PUBLIC_CENTER_LOGO_IMAGE 指向 /images/logo.png（将 logo.png 放到 public/images/），未设置时显示默认熊猫 */
const CENTER_LOGO_IMAGE = process.env.NEXT_PUBLIC_CENTER_LOGO_IMAGE || '';

export default async function StudentDashboard() {
  const user = await getAuthUser();
  
  if (!user || user.type !== 'student') {
    redirect('/');
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            重庆专升本
          </h1>
          <div className="flex items-center gap-3">
            <StudentProfileBadge studentId={user.id} />
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
            >
              退出登录
            </Link>
          </div>
        </div>

        {/* 主容器：使用grid布局，四个卡片在角落，中间是熊猫 */}
        <div className="relative w-full" style={{ minHeight: '600px' }}>
          {/* Grid布局：2行2列，中间留空 */}
          <div className="grid grid-cols-2 grid-rows-2 gap-6 h-full" style={{ minHeight: '600px' }}>
            {/* 左上：AI通关测 */}
            <div className="flex items-start justify-start">
              <Link
                href="/student/exam"
                className="glass-effect rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 glow-blue-hover w-full h-full flex flex-col items-center justify-center"
                style={{ minHeight: '280px' }}
              >
                <div className="text-6xl mb-4">📝</div>
                <h2 className="text-2xl font-bold text-blue-400 mb-2">AI通关测</h2>
                <p className="text-gray-300 text-sm">智能测评定位知识薄弱点</p>
              </Link>
            </div>

            {/* 右上：AI精准练 */}
            <div className="flex items-start justify-end">
              <div
                className="glass-effect rounded-2xl p-8 cursor-not-allowed opacity-50 w-full h-full flex flex-col items-center justify-center"
                style={{ minHeight: '280px' }}
                title="此功能暂未上线，敬请期待"
              >
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold text-blue-400 mb-2">AI精准练</h2>
                <p className="text-gray-300 text-sm">千人千面 靶向刷题</p>
              </div>
            </div>

            {/* 左下：AI错题本 */}
            <div className="flex items-end justify-start">
              <Link
                href="/student/notebook"
                className="glass-effect rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 glow-blue-hover w-full h-full flex flex-col items-center justify-center"
                style={{ minHeight: '280px' }}
              >
                <div className="text-6xl mb-4">📚</div>
                <h2 className="text-2xl font-bold text-blue-400 mb-2">AI错题本</h2>
                <p className="text-gray-300 text-sm">提升成绩从消灭错题开始</p>
              </Link>
            </div>

            {/* 右下：学习计划 */}
            <div className="flex items-end justify-end">
              <Link
                href="/student/assignments"
                className="glass-effect rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 glow-blue-hover w-full h-full flex flex-col items-center justify-center"
                style={{ minHeight: '280px' }}
              >
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-2xl font-bold text-blue-400 mb-2">学习计划</h2>
                <p className="text-gray-300 text-sm">可视化任务表，养成自律娃</p>
              </Link>
            </div>
          </div>

          {/* 中间：可替换的 Logo 图片与标题 - 绝对定位居中。替换图片：设置 .env 中 NEXT_PUBLIC_CENTER_LOGO_IMAGE 或将图片放到 public/images/center-logo.png */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="mb-6 w-48 h-48 flex items-center justify-center shrink-0">
              {CENTER_LOGO_IMAGE ? (
                <Image
                  src={CENTER_LOGO_IMAGE}
                  alt=""
                  width={192}
                  height={192}
                  className="object-contain w-full h-full"
                  unoptimized={CENTER_LOGO_IMAGE.startsWith('/')}
                />
              ) : (
                <span className="text-9xl">🐼</span>
              )}
            </div>
            <h2 className="text-5xl font-bold text-blue-400 mb-4">AI辅助学习系统</h2>
            <p className="text-gray-300 text-lg">基于重庆考纲的个性化精准学习</p>
          </div>
        </div>
      </div>
    </div>
  );
}
