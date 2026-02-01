'use client';

import { useState, useEffect } from 'react';
import { renderMath } from '@/lib/math-render';

type Props = {
  questionContent: string;
  onClose: () => void;
  onBack: () => void;
};

export default function AnalysisResultModal({ questionContent, onClose, onBack }: Props) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/student/notebook/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: questionContent }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.analysis) setAnalysis(data.analysis);
        else setError(data.error || '解析失败');
      })
      .catch(() => setError('请求失败'))
      .finally(() => setLoading(false));
  }, [questionContent]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-effect rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-blue-400">AI 解析</h3>
          <div className="flex gap-2">
            <button type="button" onClick={onBack} className="px-3 py-1 bg-gray-600 rounded-lg hover:bg-gray-500 text-sm">
              返回
            </button>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
          </div>
        </div>
        <div className="mb-4 p-3 rounded-lg bg-slate-800 border border-slate-600 text-sm text-gray-300">
          <span className="text-gray-500">题目：</span>
          {renderMath(questionContent.slice(0, 200))}
          {questionContent.length > 200 && '...'}
        </div>
        {loading && <p className="text-cyan-400">正在生成解析...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && analysis && (
          <div className="p-4 rounded-lg bg-slate-800 border border-slate-600 whitespace-pre-wrap text-gray-200">
            {renderMath(analysis)}
          </div>
        )}
      </div>
    </div>
  );
}
