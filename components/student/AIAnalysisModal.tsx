'use client';

import { useState, useEffect } from 'react';
import { TextRender } from '@/lib/text-render';

interface AIAnalysisModalProps {
  questionContent: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAnalysisModal({
  questionContent,
  isOpen,
  onClose,
}: AIAnalysisModalProps) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && !analysis) {
      handleAnalyze();
    }
  }, [isOpen]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/student/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: questionContent }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis);
      } else {
        const data = await res.json();
        setError(data.error || 'AI 分析失败，请重试');
      }
    } catch (err: any) {
      setError(err.message || 'AI 分析失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">AI 分析</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-bold text-gray-400 mb-2">题目：</h4>
          <p className="text-gray-300 whitespace-pre-wrap">{questionContent}</p>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-bold text-blue-400 mb-2">解析：</h4>
          {loading && <p className="text-gray-400">AI 分析中，请稍候...</p>}
          {error && <p className="text-red-400">{error}</p>}
          {analysis && (
            <div className="text-gray-300 whitespace-pre-wrap">
              <TextRender text={analysis} />
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
