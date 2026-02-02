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
}

export default function WrongQuestionDetailPage({
  questionId,
  questionName,
  questionContent,
  wrongBookId,
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
    if (wrongBookId) {
      router.push(`/student/notebook/${wrongBookId}`);
    } else {
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
