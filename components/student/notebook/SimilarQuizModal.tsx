'use client';

import { useState, useEffect } from 'react';
import { renderMath } from '@/lib/math-render';

type SimilarQuestion = {
  id: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
};

type Props = {
  questionContent: string;
  onClose: () => void;
  onBack: () => void;
};

export default function SimilarQuizModal({ questionContent, onClose, onBack }: Props) {
  const [questions, setQuestions] = useState<SimilarQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/student/notebook/similar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: questionContent }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions.slice(0, 3));
        } else {
          setError(data.error || '未获取到题目');
        }
      })
      .catch(() => setError('请求失败'))
      .finally(() => setLoading(false));
  }, [questionContent]);

  const current = questions[currentIndex];
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] != null);
  const showResult = submitted && allAnswered;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="glass-effect rounded-2xl p-8">
          <p className="text-cyan-400">正在生成举一反三题目...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="glass-effect rounded-2xl p-8" onClick={(e) => e.stopPropagation()}>
          <p className="text-red-400 mb-4">{error}</p>
          <button type="button" onClick={onBack} className="px-4 py-2 bg-gray-600 rounded-lg">返回</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  if (showResult) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div
          className="glass-effect rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-blue-400">举一反三 · 作答结果</h3>
            <div className="flex gap-2">
              <button type="button" onClick={onBack} className="px-3 py-1 bg-gray-600 rounded-lg text-sm">返回</button>
              <button type="button" onClick={onClose}>✕</button>
            </div>
          </div>
          <div className="space-y-6">
            {questions.map((q) => {
              const correct = answers[q.id] === q.correctAnswer;
              return (
                <div key={q.id} className="p-4 rounded-xl border border-slate-600 bg-slate-800">
                  <p className="text-gray-300 mb-2">{renderMath(q.question)}</p>
                  <p className="text-sm mb-2">
                    你的答案：<span className={correct ? 'text-green-400' : 'text-red-400'}>{answers[q.id] ?? '—'}</span>
                    {!correct && <span className="text-gray-400"> 正确答案：{q.correctAnswer}</span>}
                  </p>
                  <p className="text-sm text-cyan-200 whitespace-pre-wrap">{renderMath(q.explanation)}</p>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={onClose} className="mt-4 px-6 py-2 bg-cyan-600 rounded-lg">关闭</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-effect rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-blue-400">
            举一反三 第 {currentIndex + 1} / {questions.length} 题
          </h3>
          <div className="flex gap-2">
            <button type="button" onClick={onBack} className="px-3 py-1 bg-gray-600 rounded-lg text-sm">返回</button>
            <button type="button" onClick={onClose}>✕</button>
          </div>
        </div>
        <p className="text-gray-200 mb-4">{renderMath(current.question)}</p>
        <div className="space-y-2 mb-6">
          {(['A', 'B', 'C', 'D'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: opt }))}
              className={`w-full p-3 rounded-lg border-2 text-left transition ${
                answers[current.id] === opt ? 'border-cyan-500 bg-cyan-500/20' : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <span className="font-medium text-cyan-400">{opt}.</span> {renderMath(current.options[opt])}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="px-4 py-2 bg-gray-600 rounded-lg"
            >
              上一题
            </button>
          )}
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="px-4 py-2 bg-cyan-600 rounded-lg"
            >
              下一题
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              disabled={answers[current.id] == null}
              className="px-4 py-2 bg-emerald-600 rounded-lg disabled:opacity-50"
            >
              提交并查看结果
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
