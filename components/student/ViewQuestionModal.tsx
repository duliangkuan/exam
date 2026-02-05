'use client';

import { useState } from 'react';
import AIAnalysisModal from './AIAnalysisModal';
import SimilarQuestionsModal from './SimilarQuestionsModal';

interface ViewQuestionModalProps {
  questionId: string;
  questionName: string;
  questionContent: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewQuestionModal({
  questionId,
  questionName,
  questionContent,
  isOpen,
  onClose,
}: ViewQuestionModalProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">{questionName}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-300 whitespace-pre-wrap">{questionContent}</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowAnalysis(true)}
              className="flex-1 px-6 py-4 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-lg font-bold"
            >
              AI分析
            </button>
            <button
              onClick={() => setShowSimilar(true)}
              className="flex-1 px-6 py-4 bg-green-600 rounded-lg hover:bg-green-700 transition text-lg font-bold"
            >
              举一反三
            </button>
          </div>
        </div>
      </div>

      {showAnalysis && (
        <AIAnalysisModal
          questionContent={questionContent}
          isOpen={showAnalysis}
          onClose={() => {
            setShowAnalysis(false);
            // 关闭AI分析后，主弹窗会自动显示（因为 isOpen 条件会重新满足）
          }}
        />
      )}

      {showSimilar && (
        <SimilarQuestionsModal
          questionContent={questionContent}
          isOpen={showSimilar}
          onClose={() => {
            setShowSimilar(false);
            // 关闭举一反三后，主弹窗会自动显示（因为 isOpen 条件会重新满足）
          }}
        />
      )}
    </>
  );
}
