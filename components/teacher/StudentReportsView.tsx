'use client';

import { useState, useEffect } from 'react';
import { Student } from '@prisma/client';

interface StudentReportsViewProps {
  students: Student[];
}

export default function StudentReportsView({ students }: StudentReportsViewProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedStudentId) {
      fetchReports();
    } else {
      setReports([]);
    }
  }, [selectedStudentId]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teacher/reports?studentId=${selectedStudentId}`);
      const data = await response.json();
      if (response.ok) {
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Fetch reports error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">选择学生</label>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">请选择学生</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.username}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-center text-gray-400">加载中...</p>}

      {!loading && selectedStudentId && reports.length === 0 && (
        <p className="text-center text-gray-400">该学生暂无测评报告</p>
      )}

      {!loading && reports.length > 0 && (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-800 rounded-lg p-4 border border-blue-500/30"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-blue-400">{report.subject}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(report.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-cyan-400">{report.score}</p>
                  <p className="text-sm text-gray-400">分</p>
                </div>
              </div>
              <div className="text-sm text-gray-300">
                <p>知识点: {typeof report.selectedPath === 'string' ? report.selectedPath : JSON.stringify(report.selectedPath)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
