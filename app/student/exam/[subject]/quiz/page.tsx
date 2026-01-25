'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QuizComponent from '@/components/student/QuizComponent';

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const subject = params.subject as string;
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('currentQuestions');
    if (stored) {
      setQuestions(JSON.parse(stored));
      setLoading(false);
    } else {
      router.push(`/student/exam/${subject}/select`);
    }
  }, [router, subject]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-xl text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return <QuizComponent questions={questions} subject={subject} />;
}
