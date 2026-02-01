'use client';

import { useState } from 'react';
import { renderMath } from '@/lib/math-render';
import AnalysisResultModal from './AnalysisResultModal';
import SimilarQuizModal from './SimilarQuizModal';

type Question = { id: string; name: string; content: string; notebookId: string | null };

type Props = {
  question: Question;
  onClose: () => void;
  onDeleted: () => void;
};

export default function QuestionDetailModal({ question, onClose, onDeleted }: Props) {
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [similarOpen, setSimilarOpen] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div
          className="glass-effect rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-blue-400">{question.name}</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">✕ 关闭</button>
          </div>
          <div className="mb-6 p-4 rounded-lg bg-slate-800 border border-slate-600 whitespace-pre-wrap text-gray-200">
            {renderMath(question.content)}
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setAnalysisOpen(true)}
              className="flex-1 py-3 px-4 bg-cyan-600 rounded-xl hover:bg-cyan-500 font-medium"
            >
              AI 分析
            </button>
            <button
              type="button"
              onClick={() => setSimilarOpen(true)}
              className="flex-1 py-3 px-4 bg-emerald-600 rounded-xl hover:bg-emerald-500 font-medium"
            >
              举一反三
            </button>
          </div>
        </div>
      </div>

      {analysisOpen && (
        <AnalysisResultModal
          questionContent={question.content}
          onClose={() => setAnalysisOpen(false)}
          onBack={() => setAnalysisOpen(false)}
        />
      )}
      {similarOpen && (
        <SimilarQuizModal
          questionContent={question.content}
          onClose={() => setSimilarOpen(false)}
          onBack={() => setSimilarOpen(false)}
        />
      )}
    </>
  );
}
