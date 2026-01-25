'use client';

import { useState } from 'react';
import { Student } from '@prisma/client';
import { useRouter } from 'next/navigation';

interface AssignmentFormProps {
  students: Student[];
}

export default function AssignmentForm({ students }: AssignmentFormProps) {
  const [studentId, setStudentId] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, content }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('作业发送成功！');
        setContent('');
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setError(data.error || '发送失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">选择学生</label>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">请选择学生</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.username}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">作业内容</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
          placeholder="请输入作业内容..."
          required
        />
      </div>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-400 text-sm mb-4">{success}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? '发送中...' : '发送作业'}
      </button>
    </form>
  );
}
