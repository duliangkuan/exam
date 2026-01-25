'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DeleteStudentButtonProps {
  studentId: string;
}

export default function DeleteStudentButton({ studentId }: DeleteStudentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('确定要注销该学生账号吗？此操作将永久删除该学生的所有数据！')) {
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('studentId', studentId);

      const response = await fetch('/api/teacher/delete-student', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('删除失败，请重试');
      }
    } catch (error) {
      alert('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
    >
      {loading ? '删除中...' : '注销账号'}
    </button>
  );
}
