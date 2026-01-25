'use client';

import { useState } from 'react';
import AdminLoginModal from '@/components/auth/AdminLoginModal';
import TeacherLoginModal from '@/components/auth/TeacherLoginModal';
import StudentLoginModal from '@/components/auth/StudentLoginModal';

export default function Home() {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-6xl">
        <h1 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          专升本学习系统
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 学生端卡片 */}
          <div
            onClick={() => setShowStudentModal(true)}
            className="glass-effect rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 glow-blue-hover"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">👨‍🎓</div>
              <h2 className="text-2xl font-bold text-blue-400 mb-2">学生端</h2>
              <p className="text-gray-300">进入学习系统</p>
            </div>
          </div>

          {/* 教师端卡片 */}
          <div
            onClick={() => setShowTeacherModal(true)}
            className="glass-effect rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 glow-blue-hover"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">👨‍🏫</div>
              <h2 className="text-2xl font-bold text-blue-400 mb-2">教师端</h2>
              <p className="text-gray-300">管理学生账号</p>
            </div>
          </div>

          {/* 管理端卡片 */}
          <div
            onClick={() => setShowAdminModal(true)}
            className="glass-effect rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 glow-blue-hover"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">👨‍💼</div>
              <h2 className="text-2xl font-bold text-blue-400 mb-2">管理端</h2>
              <p className="text-gray-300">管理系统设置</p>
            </div>
          </div>
        </div>
      </div>

      {showAdminModal && (
        <AdminLoginModal onClose={() => setShowAdminModal(false)} />
      )}
      {showTeacherModal && (
        <TeacherLoginModal onClose={() => setShowTeacherModal(false)} />
      )}
      {showStudentModal && (
        <StudentLoginModal onClose={() => setShowStudentModal(false)} />
      )}
    </div>
  );
}
