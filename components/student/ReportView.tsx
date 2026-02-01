'use client';

import { useState, useEffect } from 'react';
import { renderMath } from '@/lib/math-render';
import { renderBold } from '@/lib/text-render';

interface ReportViewProps {
  report: any;
  studentName?: string;
  knowledgePointCount?: number;
  /** 本节知识点名称列表，用于展示「共测知识点」与熟练/一般/较弱具体项 */
  knowledgePointList?: string[];
}

interface LearningSuggestionsData {
  weakPoints: string;
  learningMethods: string;
}

function DonutChart({
  percent,
  color = '#22d3ee',
  size = 140,
  centerLabel,
  centerSub,
}: {
  percent: number;
  color?: string;
  size?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  const r = (size - 12) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (percent / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(71, 85, 105, 0.6)" strokeWidth={10} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerLabel != null && <span className="text-2xl font-bold text-white">{centerLabel}</span>}
        {centerSub != null && <span className="text-xs text-gray-400">{centerSub}</span>}
      </div>
    </div>
  );
}

function DonutChartThree({
  proficient,
  general,
  weak,
  size = 160,
}: {
  proficient: number;
  general: number;
  weak: number;
  size?: number;
}) {
  const total = proficient + general + weak;
  const r = (size - 14) / 2;
  const circumference = 2 * Math.PI * r;
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-gray-500 text-sm">暂无数据</span>
      </div>
    );
  }
  const p1 = (proficient / total) * circumference;
  const p2 = (general / total) * circumference;
  const p3 = (weak / total) * circumference;
  const colors = ['#22c55e', '#eab308', '#ef4444'];
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors[0]} strokeWidth={12} strokeDasharray={`${p1} ${circumference}`} strokeDashoffset={0} strokeLinecap="round" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors[1]} strokeWidth={12} strokeDasharray={`${p2} ${circumference}`} strokeDashoffset={-p1} strokeLinecap="round" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors[2]} strokeWidth={12} strokeDasharray={`${p3} ${circumference}`} strokeDashoffset={-(p1 + p2)} strokeLinecap="round" />
    </svg>
  );
}

export default function ReportView({
  report,
  studentName = '学生',
  knowledgePointCount = 0,
  knowledgePointList = [],
}: ReportViewProps) {
  const questions = (report.questions || []) as any[];
  const answers = (report.answers || {}) as Record<number, 'A' | 'B' | 'C' | 'D'>;
  const isMath = report.subject === '高等数学';
  const isEnglish = report.subject === '大学英语';

  const totalQuestions = questions.length;
  const correctCount = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
  const wrongCount = totalQuestions - correctCount;
  const accuracyRate = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const N = knowledgePointList.length;
  const kpStats: { correct: number; total: number }[] = Array.from({ length: N }, () => ({ correct: 0, total: 0 }));
  questions.forEach((q: any, i: number) => {
    const idx = typeof q?.knowledgePointIndex === 'number' && q.knowledgePointIndex >= 0 && q.knowledgePointIndex < N
      ? q.knowledgePointIndex
      : N > 0 ? i % N : -1;
    if (idx >= 0) {
      kpStats[idx].total += 1;
      if (answers[i] === q.correctAnswer) kpStats[idx].correct += 1;
    }
  });
  const proficientNames: string[] = [];
  const generalNames: string[] = [];
  const weakNames: string[] = [];
  for (let k = 0; k < N; k++) {
    const name = knowledgePointList[k];
    if (!name) continue;
    const { correct, total } = kpStats[k];
    if (total === 0) continue;
    if (correct === total) proficientNames.push(name);
    else if (correct > 0) generalNames.push(name);
    else weakNames.push(name);
  }
  let proficientCount = proficientNames.length;
  let generalCount = generalNames.length;
  let weakCount = weakNames.length;
  const hasRealKpData = N > 0 && questions.some((q: any) => typeof q?.knowledgePointIndex === 'number');
  if (!hasRealKpData) {
    const M = knowledgePointCount > 0 ? knowledgePointCount : 1;
    proficientCount = Math.round(M * ((report.score ?? 0) / 100));
    weakCount = M - proficientCount;
    generalCount = 0;
  }

  const assessTimeStr =
    report.createdAt != null
      ? new Date(report.createdAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : '—';

  const durationSeconds = report.durationSeconds;
  const durationDisplay =
    typeof durationSeconds === 'number' && durationSeconds >= 0
      ? `${Math.floor(durationSeconds / 60)}分${durationSeconds % 60}秒`
      : '—';

  const passed = (report.score ?? 0) >= 80;

  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [kpListExpanded, setKpListExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<LearningSuggestionsData | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  useEffect(() => {
    if (!report?.id) {
      setSuggestionsLoading(false);
      return;
    }
    let cancelled = false;
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    fetch(`/api/student/report/${report.id}/learning-suggestions`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? '未授权' : '获取学习建议失败');
        return res.json();
      })
      .then((data: LearningSuggestionsData) => {
        if (!cancelled) setSuggestions(data);
      })
      .catch((err) => {
        if (!cancelled) setSuggestionsError(err.message || '加载失败');
      })
      .finally(() => {
        if (!cancelled) setSuggestionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [report?.id]);

  return (
    <div className="space-y-6">
      {/* 个人信息 */}
      <div className="glass-effect rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-500/30 flex items-center justify-center text-2xl text-blue-400 shrink-0">👤</div>
          <div className="flex-1">
            <p className="text-gray-400 text-sm mb-0.5">姓名</p>
            <p className="text-white font-medium">{studentName}</p>
            <p className="text-gray-400 text-sm mt-2 mb-0.5">测评时间</p>
            <p className="text-blue-400">{assessTimeStr}</p>
          </div>
        </div>
      </div>

      {/* 答题正确率 */}
      <div className="glass-effect rounded-2xl p-6">
        <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">答题正确率</span>
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/60 border border-gray-700">
              <span className="text-gray-400">答题总数</span>
              <span className="text-blue-400 font-bold ml-auto">{totalQuestions} 道</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/60 border border-gray-700">
              <span className="text-gray-400">答对总数</span>
              <span className="text-green-400 font-bold ml-auto">{correctCount} 道</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/60 border border-gray-700">
              <span className="text-gray-400">答错总数</span>
              <span className="text-red-400 font-bold ml-auto">{wrongCount} 道</span>
            </div>
          </div>
          <div className="flex items-center justify-center shrink-0">
            <DonutChart percent={accuracyRate} color="#22d3ee" size={160} centerLabel={`${accuracyRate}%`} centerSub="答题正确率" />
          </div>
        </div>
      </div>

      {/* 知识点掌握情况 */}
      <div className="glass-effect rounded-2xl p-6">
        <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">知识点掌握情况</span>
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/60 border border-gray-700">
              <span className="text-gray-400">累计测评时间</span>
              <span className="text-cyan-400 font-bold ml-auto">{durationDisplay}</span>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setKpListExpanded((v) => !v)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800/60 border border-gray-700 hover:border-blue-500/50 transition text-left"
              >
                <span className="text-gray-400">共测试知识点</span>
                <span className="text-blue-400 font-bold ml-auto">
                  {knowledgePointList.length > 0 ? knowledgePointList.length : knowledgePointCount || totalQuestions} 个
                </span>
                <span className="text-gray-500 text-sm">{kpListExpanded ? '收起' : '点击查看'}</span>
              </button>
              {kpListExpanded && (knowledgePointList.length > 0 ? (
                <div className="p-3 rounded-lg bg-gray-800/40 border border-gray-700 text-gray-300 text-sm space-y-1">
                  {knowledgePointList.map((name, idx) => (
                    <div key={idx}>{idx + 1}. {name}</div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-gray-800/40 border border-gray-700 text-gray-500 text-sm">暂无知识点列表</div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-400" /> 熟练 {proficientCount} 个
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-yellow-400" /> 一般 {generalCount} 个
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-400" /> 较弱 {weakCount} 个
              </span>
            </div>
            {hasRealKpData && (proficientNames.length > 0 || generalNames.length > 0 || weakNames.length > 0) && (
              <div className="mt-3 space-y-2 text-sm">
                {proficientNames.length > 0 && (
                  <div>
                    <span className="text-green-400 font-medium">熟练：</span>
                    <span className="text-gray-300">{proficientNames.join('、')}</span>
                  </div>
                )}
                {generalNames.length > 0 && (
                  <div>
                    <span className="text-yellow-400 font-medium">一般：</span>
                    <span className="text-gray-300">{generalNames.join('、')}</span>
                  </div>
                )}
                {weakNames.length > 0 && (
                  <div>
                    <span className="text-red-400 font-medium">较弱：</span>
                    <span className="text-gray-300">{weakNames.join('、')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center shrink-0">
            <div className="relative" style={{ width: 160, height: 160 }}>
              <DonutChartThree proficient={proficientCount} general={generalCount} weak={weakCount} size={160} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-gray-400 text-xs">掌握分布</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 得分与评判结果 */}
      <div className="glass-effect rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-blue-400 mb-2">{report.subject}</h2>
        <div className="text-5xl font-bold text-cyan-400 mb-1">{report.score}</div>
        <p className="text-gray-400 mb-6">分</p>
        <div className="pt-4 border-t border-gray-600/50">
          <p className="text-gray-400 text-sm mb-2">评判标准：80分及以上为通关，80分以下为未通关</p>
          <p className={`text-xl font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>{passed ? '通关' : '未通关'}</p>
        </div>
      </div>

      {/* 学习建议（AI 生成） */}
      <div className="glass-effect rounded-2xl p-8">
        <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">学习建议</span>
        </h3>
        {suggestionsLoading && (
          <div className="flex items-center gap-2 text-gray-400 py-6">
            <span className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            正在生成学习建议…
          </div>
        )}
        {!suggestionsLoading && (
          <>
            {suggestionsError && <p className="text-red-400 mb-4">学习建议加载失败：{suggestionsError}</p>}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-cyan-400 mb-2">薄弱知识点</h4>
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  {suggestions?.weakPoints || '暂无'}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-cyan-400 mb-2">学习方法</h4>
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  {suggestions?.learningMethods || '暂无'}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 答题详情（可展开） */}
      <div className="glass-effect rounded-2xl p-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-xl font-bold text-blue-400">答题详情</h3>
          <button
            type="button"
            onClick={() => setDetailsExpanded((v) => !v)}
            className="px-4 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white text-sm font-medium transition"
          >
            {detailsExpanded ? '收起' : `展开查看全部答题详情（共 ${questions.length} 题）`}
          </button>
        </div>
        {detailsExpanded && (
          <div className="space-y-6">
            {questions.map((question: any, index: number) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              return (
                <div
                  key={index}
                  className={`bg-gray-800 rounded-lg p-6 border-2 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className={`text-lg font-bold text-white flex-1 ${isEnglish ? 'break-words' : ''}`}>
                      第 {index + 1} 题:{' '}
                      {isMath ? renderMath(question.question) : isEnglish ? renderBold(question.question) : question.question}
                    </h3>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {isCorrect ? '✓ 正确' : '✗ 错误'}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {(['A', 'B', 'C', 'D'] as const).map((option) => {
                      const isUserAnswer = userAnswer === option;
                      const isCorrectAnswer = question.correctAnswer === option;
                      return (
                        <div
                          key={option}
                          className={`p-3 rounded-lg border-2 ${isEnglish ? 'break-words' : ''} ${
                            isCorrectAnswer ? 'border-green-500 bg-green-500/10' : isUserAnswer ? 'border-red-500 bg-red-500/10' : 'border-gray-700'
                          }`}
                        >
                          <span className="font-bold mr-2">{option}.</span>
                          {isMath ? renderMath(question.options?.[option]) : isEnglish ? renderBold(question.options?.[option]) : question.options?.[option]}
                          {isCorrectAnswer && <span className="ml-2 text-green-400">✓ 正确答案</span>}
                          {isUserAnswer && !isCorrectAnswer && <span className="ml-2 text-red-400">✗ 你的答案</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-sm font-bold text-blue-400 mb-2">解析：</p>
                    <p className={`text-gray-300 ${isEnglish ? 'break-words' : ''}`}>
                      {isMath ? renderMath(question.explanation) : isEnglish ? renderBold(question.explanation) : question.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
