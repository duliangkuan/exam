'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { renderMath } from '@/lib/math-render';

interface Question {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

interface QuizComponentProps {
  questions: Question[];
  subject: string;
}

export default function QuizComponent({ questions, subject }: QuizComponentProps) {
  const router = useRouter();
  const params = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  useEffect(() => {
    setSelectedAnswer(answers[currentIndex] || null);
  }, [currentIndex, answers]);

  const handleSelect = (option: 'A' | 'B' | 'C' | 'D') => {
    setSelectedAnswer(option);
    setAnswers({ ...answers, [currentIndex]: option });
  };

  const handleNext = () => {
    if (selectedAnswer) {
      if (isLastQuestion) {
        handleSubmit();
      } else {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const selectedPath = JSON.parse(sessionStorage.getItem('selectedPath') || '{}');
      
      // 计算分数
      let score = 0;
      questions.forEach((q, index) => {
        if (answers[index] === q.correctAnswer) {
          score += 10;
        }
      });

      // 保存报告
      const response = await fetch('/api/student/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject === 'chinese' ? '大学语文' : 
                  subject === 'english' ? '大学英语' :
                  subject === 'math' ? '高等数学' : '计算机基础',
          selectedPath,
          questions,
          answers,
          score,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        router.push(`/student/exam/${subject}/report/${data.reportId}`);
      } else {
        alert('保存报告失败');
        setSubmitting(false);
      }
    } catch (error) {
      alert('提交失败，请重试');
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">📝</div>
          <p className="text-2xl text-blue-400 mb-2">正在阅卷...</p>
          <p className="text-gray-400">请稍候</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-400">
              第 {currentIndex + 1} 题 / 共 {questions.length} 题
            </h2>
            <div className="text-gray-400">
              进度: {Math.round(((currentIndex + 1) / questions.length) * 100)}%
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="glass-effect rounded-2xl p-8 mb-6">
          <h3 className="text-xl font-bold text-white mb-6">
            {renderMath(currentQuestion.question)}
          </h3>
          
          <div className="space-y-4">
            {(['A', 'B', 'C', 'D'] as const).map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`w-full p-4 rounded-lg border-2 text-left transition ${
                  selectedAnswer === option
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10'
                }`}
              >
                <span className="font-bold text-blue-400 mr-2">{option}.</span>
                {renderMath(currentQuestion.options[option])}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="px-8 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLastQuestion ? '提交' : '下一题'}
          </button>
        </div>
      </div>
    </div>
  );
}
