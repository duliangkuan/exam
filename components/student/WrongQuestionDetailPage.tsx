'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ViewQuestionModal from './ViewQuestionModal';
import AIAnalysisModal from './AIAnalysisModal';
import SimilarQuestionsModal from './SimilarQuestionsModal';

interface WrongQuestionDetailPageProps {
  questionId: string;
  questionName: string;
  questionContent: string;
  wrongBookId: string | null;
  subject: string | null; // 学科：'chinese' | 'english' | 'math' | 'computer'
}

export default function WrongQuestionDetailPage({
  questionId,
  questionName,
  questionContent,
  wrongBookId,
  subject,
}: WrongQuestionDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showViewModal, setShowViewModal] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'analyze') {
      setShowViewModal(false);
      setShowAnalysis(true);
    } else if (action === 'similar') {
      setShowViewModal(false);
      setShowSimilar(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    // 根据新的路由结构返回
    if (subject && wrongBookId) {
      // 有学科和错题本，返回到错题本页面
      router.push(`/student/notebook/${subject}/${wrongBookId}`);
    } else if (subject) {
      // 有学科但没有错题本，返回到学科页面
      router.push(`/student/notebook/${subject}`);
    } else {
      // 没有学科信息（旧数据），返回到学科选择页
      router.push('/student/notebook');
    }
  };

  return (
    <>
      <ViewQuestionModal
        questionId={questionId}
        questionName={questionName}
        questionContent={questionContent}
        isOpen={showViewModal && !showAnalysis && !showSimilar}
        onClose={handleClose}
      />
      {showAnalysis && (
        <AIAnalysisModal
          questionContent={questionContent}
          isOpen={showAnalysis}
          onClose={handleClose}
        />
      )}
      {showSimilar && (
        <SimilarQuestionsModal
          questionContent={questionContent}
          isOpen={showSimilar}
          onClose={handleClose}
        />
      )}
    </>
  );
}
