'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { KnowledgeTreeNode } from '@/lib/exam-nodes';

type SectionStatus = Record<
  string,
  { reportCount: number; passed: boolean }
>;
type ReportItem = {
  id: string;
  score: number;
  createdAt: string;
  sectionKey: string | null;
};

const PASS_SCORE = 80;

export default function KnowledgeTreeView({
  subject,
  subjectName,
}: {
  subject: string;
  subjectName: string;
}) {
  const [tree, setTree] = useState<{
    rootLabel: string;
    steps: string[];
    nodes: KnowledgeTreeNode[];
  } | null>(null);
  const [sectionStatus, setSectionStatus] = useState<SectionStatus>({});
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSectionKey, setSelectedSectionKey] = useState<string | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/student/knowledge-tree/${subject}`)
      .then((res) => {
        if (!res.ok) throw new Error('获取知识树失败');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setTree(data.tree);
          setSectionStatus(data.sectionStatus || {});
          setReports(data.reports || []);
        }
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [subject]);

  const sectionReports = selectedSectionKey
    ? reports
        .filter((r) => r.sectionKey === selectedSectionKey)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-blue-400 text-lg">加载知识树中...</div>
      </div>
    );
  }
  if (error || !tree) {
    return (
      <div className="text-red-400">
        {error || '未获取到知识树数据'}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto overflow-y-auto pb-8" style={{ minHeight: '500px' }}>
        <div className="inline-block p-6 min-w-full">
          <TreeDiagram
            rootLabel={tree.rootLabel}
            nodes={tree.nodes}
            sectionStatus={sectionStatus}
            onSectionClick={setSelectedSectionKey}
          />
        </div>
      </div>

      {selectedSectionKey !== null && (
        <SectionReportsModal
          sectionKey={selectedSectionKey}
          reports={sectionReports}
          subject={subject}
          onClose={() => setSelectedSectionKey(null)}
        />
      )}
    </div>
  );
}

function TreeDiagram({
  rootLabel,
  nodes,
  sectionStatus,
  onSectionClick,
}: {
  rootLabel: string;
  nodes: KnowledgeTreeNode[];
  sectionStatus: SectionStatus;
  onSectionClick: (key: string | null) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-8">
      {/* 主干：科目名 */}
      <div
        className="relative flex-shrink-0 px-8 py-4 rounded-2xl font-bold text-xl text-blue-400 border-2 border-blue-500/50 bg-slate-800/90 shadow-lg glow-blue"
        style={{
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)',
        }}
      >
        {rootLabel}
      </div>
      {/* 主干到第一层的连接线 */}
      {nodes.length > 0 && (
        <div className="w-1 h-6 bg-gradient-to-b from-blue-500/60 to-transparent rounded-full" />
      )}
      {/* 第一层枝干 */}
      <div className="flex flex-wrap justify-center gap-6">
        {nodes.map((node, i) => (
          <TreeNode
            key={i}
            node={node}
            sectionStatus={sectionStatus}
            onSectionClick={onSectionClick}
            level={0}
          />
        ))}
      </div>
    </div>
  );
}

function TreeNode({
  node,
  sectionStatus,
  onSectionClick,
  level,
}: {
  node: KnowledgeTreeNode;
  sectionStatus: SectionStatus;
  onSectionClick: (key: string | null) => void;
  level: number;
}) {
  const isLeaf = !!node.sectionKey;
  const status = node.sectionKey
    ? sectionStatus[node.sectionKey]
    : undefined;
  const passed = status?.passed ?? false;
  const hasReports = (status?.reportCount ?? 0) > 0;
  const dim = isLeaf && !hasReports; // 无任何测试则灰暗

  const baseClass =
    'rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center';
  const levelColors = [
    'border-cyan-500/50 bg-slate-800/80 text-cyan-300',
    'border-emerald-500/40 bg-slate-800/70 text-emerald-300',
    'border-amber-500/40 bg-slate-800/70 text-amber-300',
    'border-blue-400/40 bg-slate-800/70 text-blue-200',
  ];
  const colorClass = levelColors[Math.min(level, levelColors.length - 1)];

  let stateClass = colorClass;
  if (isLeaf) {
    if (passed) stateClass += ' shadow-lg ring-2 ring-green-400/60 bg-green-900/20';
    else if (dim) stateClass += ' opacity-50 grayscale';
    else stateClass += ' opacity-90';
  }

  const content = (
    <div
      className={`${baseClass} ${stateClass} ${
        isLeaf ? 'cursor-pointer hover:scale-105 min-w-[100px] px-4 py-3' : 'px-4 py-2'
      }`}
      onClick={() => isLeaf && node.sectionKey && onSectionClick(node.sectionKey)}
      title={isLeaf ? (passed ? '已通关' : hasReports ? '有测评未通关' : '暂无测评') : undefined}
    >
      <span className="text-sm font-medium text-center break-words max-w-[140px]">
        {node.label}
      </span>
      {isLeaf && (
        <span className="text-xs mt-1 opacity-70">
          {passed ? '✓ 已通关' : hasReports ? `${status?.reportCount}次测评` : '未测'}
        </span>
      )}
    </div>
  );

  if (!node.children?.length) {
    return content;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {content}
      <div className="w-px h-4 bg-gradient-to-b from-slate-500 to-transparent rounded-full" />
      <div className="flex flex-wrap justify-center gap-3">
        {node.children.map((child, i) => (
          <TreeNode
            key={i}
            node={child}
            sectionStatus={sectionStatus}
            onSectionClick={onSectionClick}
            level={level + 1}
          />
        ))}
      </div>
    </div>
  );
}

function SectionReportsModal({
  sectionKey,
  reports,
  subject,
  onClose,
}: {
  sectionKey: string;
  reports: ReportItem[];
  subject: string;
  onClose: () => void;
}) {
  const sectionLabel = sectionKey.split('|').pop()?.replace(/^节:/, '') ?? sectionKey;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-effect rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col shadow-xl border border-blue-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-600">
          <h3 className="text-lg font-bold text-blue-400">
            本节历史测评 · {sectionLabel}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-600 transition text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          {reports.length === 0 ? (
            <p className="text-gray-400 text-center py-8">该节暂无测评记录</p>
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/student/exam/${subject}/report/${r.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition border border-slate-600"
                  >
                    <span className="text-gray-300">
                      {new Date(r.createdAt).toLocaleString('zh-CN')}
                    </span>
                    <span
                      className={
                        r.score >= PASS_SCORE
                          ? 'text-green-400 font-bold'
                          : 'text-amber-400'
                      }
                    >
                      {r.score} 分 {r.score >= PASS_SCORE ? '✓ 通关' : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
