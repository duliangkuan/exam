'use client';

import { useState } from 'react';
import React from 'react';
import AIAnalysisModal from './AIAnalysisModal';
import SimilarQuestionsModal from './SimilarQuestionsModal';
import { renderMath } from '@/lib/math-render';

/**
 * 预处理 OCR 文本，将纯 LaTeX 代码转换为可渲染格式
 * 检测包含 LaTeX 命令的文本块，自动添加 $ 包裹
 */
function preprocessLaTeX(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  // 如果已经包含 $ 符号，直接返回
  if (text.includes('$')) return text;
  
  // 检测常见的 LaTeX 命令
  const latexCommandPattern = /\\(?:lim|frac|sqrt|sum|int|prod|alpha|beta|gamma|delta|Delta|pi|theta|sin|cos|tan|log|ln|exp|rightarrow|leftarrow|geq|leq|neq|approx|equiv|prime|cdot|times|div|pm|mp|ldots|cdots|vdots|ddots|vec|hat|bar|tilde|dot|ddot|text|mathrm|mathbf|mathit|partial|nabla|infty|emptyset|in|notin|subset|supset|cup|cap)\b/;
  
  // 检测是否包含 LaTeX 命令
  if (!latexCommandPattern.test(text) && !/[_{}\\]/.test(text)) {
    return text; // 没有数学内容，直接返回
  }
  
  // 按行处理，识别并包裹数学表达式
  const lines = text.split('\n');
  const processedLines: string[] = [];
  let mathBlock: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      // 空行：处理之前的数学块
      if (mathBlock.length > 0) {
        const mathText = mathBlock.join(' ').trim();
        if (mathText) {
          processedLines.push(`$$${mathText}$$`);
        }
        mathBlock = [];
      }
      processedLines.push('');
      continue;
    }
    
    // 检测是否包含 LaTeX 命令
    const hasLatex = latexCommandPattern.test(trimmed);
    const hasSubSup = /[_{}]/.test(trimmed);
    const mathSymbolCount = (trimmed.match(/\\[a-zA-Z]+\b|_[{}]|\^{}/g) || []).length;
    
    // 判断是否为数学表达式行
    const isMathLine = hasLatex || (hasSubSup && mathSymbolCount > 2);
    
    // 判断是否为纯文本行（主要是中文，几乎没有数学符号）
    const chineseCount = (trimmed.match(/[\u4e00-\u9fa5]/g) || []).length;
    const chineseRatio = chineseCount / Math.max(trimmed.length, 1);
    const isPureText = chineseRatio > 0.7 && mathSymbolCount < 2;
    
    if (isMathLine && !isPureText) {
      // 数学表达式行，加入数学块
      mathBlock.push(trimmed);
    } else {
      // 文本行：先处理之前的数学块
      if (mathBlock.length > 0) {
        const mathText = mathBlock.join(' ').trim();
        if (mathText) {
          processedLines.push(`$$${mathText}$$`);
        }
        mathBlock = [];
      }
      
      // 如果这行包含数学符号，尝试识别内联公式
      if (hasSubSup && !isPureText && mathSymbolCount > 1) {
        processedLines.push(`$${trimmed}$`);
      } else {
        processedLines.push(trimmed);
      }
    }
  }
  
  // 处理最后的数学块
  if (mathBlock.length > 0) {
    const mathText = mathBlock.join(' ').trim();
    if (mathText) {
      processedLines.push(`$$${mathText}$$`);
    }
  }
  
  const result = processedLines.join('\n');
  
  // 如果处理后仍然没有 $ 符号，但包含 LaTeX 命令，强制添加
  if (!result.includes('$') && latexCommandPattern.test(result)) {
    return `$$${result.trim()}$$`;
  }
  
  return result;
}

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
  const [isMathRenderEnabled, setIsMathRenderEnabled] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">{questionName}</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMathRenderEnabled(!isMathRenderEnabled)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isMathRenderEnabled
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {isMathRenderEnabled ? '✓ 数学公式渲染' : '数学公式渲染'}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
          </div>

          <div className="mb-6">
            {isMathRenderEnabled ? (
              <div className="text-gray-300 whitespace-pre-wrap break-words [&_.katex]:text-gray-300 [&_.katex-display]:my-4 [&_.katex-display]:text-gray-300 [&_.katex-display]:text-center [&_.katex-display]:overflow-x-auto">
                {(() => {
                  const processed = preprocessLaTeX(questionContent);
                  let finalText = processed;
                  if (!processed.includes('$') && /\\[a-zA-Z]+\b|_[{}]|\^{}/.test(processed)) {
                    finalText = `$$${processed.trim()}$$`;
                  }
                  const rendered = renderMath(finalText);
                  return rendered.map((part, index) => (
                    <React.Fragment key={index}>{part}</React.Fragment>
                  ));
                })()}
              </div>
            ) : (
              <p className="text-gray-300 whitespace-pre-wrap">{questionContent}</p>
            )}
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
