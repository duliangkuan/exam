'use client';

import { useState, useEffect } from 'react';
import { TextRender } from '@/lib/text-render';

interface Question {
  id: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

interface SimilarQuestionsModalProps {
  questionContent: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SimilarQuestionsModal({
  questionContent,
  isOpen,
  onClose,
}: SimilarQuestionsModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D' | ''>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isOpen && questions.length === 0) {
      handleGenerate();
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setShowResults(false);
    setAnswers({});
    try {
      const res = await fetch('/api/student/similar-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: questionContent }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      } else {
        const data = await res.json();
        setError(data.error || '生成举一反三题目失败，请重试');
      }
    } catch (err: any) {
      setError(err.message || '生成举一反三题目失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (questions.length === 0) return;
    // 检查是否所有题目都已作答
    const allAnswered = questions.every((q) => answers[q.id]);
    if (!allAnswered) {
      alert('请完成所有题目后再提交');
      return;
    }
    setShowResults(true);
  };

  const isCorrect = (questionId: number) => {
    const q = questions.find((q) => q.id === questionId);
    return q && answers[questionId] === q.correctAnswer;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">举一反三</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {loading && <p className="text-gray-400 text-center py-8">生成题目中，请稍候...</p>}
        {error && <p className="text-red-400 text-center py-4">{error}</p>}

        {questions.length > 0 && !showResults && (
          <div className="space-y-6">
            {questions.map((q) => (
              <div key={q.id} className="border border-gray-700 rounded-lg p-4">
                <p className="text-gray-300 mb-4 font-bold">
                  {q.id}. <TextRender text={q.question} />
                </p>
                <div className="space-y-2 mb-4">
                  {(['A', 'B', 'C', 'D'] as const).map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/50 p-2 rounded"
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={option}
                        checked={answers[q.id] === option}
                        onChange={() => setAnswers({ ...answers, [q.id]: option })}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-300">
                        {option}. <TextRender text={q.options[option]} />
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 font-bold"
              >
                提交答案
              </button>
            </div>
          </div>
        )}

        {showResults && questions.length > 0 && (
          <div className="space-y-6">
            {questions.map((q) => {
              const correct = isCorrect(q.id);
              return (
                <div key={q.id} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-300 font-bold">{q.id}.</span>
                    <span className={correct ? 'text-green-400' : 'text-red-400'}>
                      {correct ? '✓ 正确' : '✗ 错误'}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4">
                    <TextRender text={q.question} />
                  </p>
                  <div className="space-y-1 mb-4">
                    {(['A', 'B', 'C', 'D'] as const).map((option) => (
                      <p
                        key={option}
                        className={`text-sm ${
                          option === q.correctAnswer
                            ? 'text-green-400 font-bold'
                            : answers[q.id] === option
                              ? 'text-red-400'
                              : 'text-gray-400'
                        }`}
                      >
                        {option}. <TextRender text={q.options[option]} />
                        {option === q.correctAnswer && ' (正确答案)'}
                        {answers[q.id] === option && option !== q.correctAnswer && ' (你的答案)'}
                      </p>
                    ))}
                  </div>
                  <div className="border-t border-gray-700 pt-4">
                    <p className="text-sm font-bold text-blue-400 mb-2">解析：</p>
                    <p className="text-gray-300 text-sm">
                      <TextRender text={q.explanation} />
                    </p>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
