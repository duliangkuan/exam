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
          <MindMapDiagram
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

// 幕布式布局参数
const LEVEL_WIDTH = 280; // 每层水平间距（px）
const NODE_HEIGHT = 60; // 节点高度（px）
const NODE_VERTICAL_GAP = 20; // 节点垂直间距（px）
const CONNECTOR_LENGTH = 30; // 连接线长度（px）

/** 计算节点树的总高度（用于布局） */
function calculateTreeHeight(node: KnowledgeTreeNode): number {
  if (!node.children || node.children.length === 0) {
    return NODE_HEIGHT;
  }
  const childrenHeight = node.children.reduce(
    (sum, child) => sum + calculateTreeHeight(child),
    0
  );
  const gaps = (node.children.length - 1) * NODE_VERTICAL_GAP;
  return Math.max(NODE_HEIGHT, childrenHeight + gaps);
}

/** 节点位置信息 */
interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

function MindMapDiagram({
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
  // 计算总高度
  let totalHeight = 0;
  const firstLevelHeights: number[] = [];
  for (const node of nodes) {
    const height = calculateTreeHeight(node);
    firstLevelHeights.push(height);
    totalHeight += height;
  }
  totalHeight += (nodes.length - 1) * NODE_VERTICAL_GAP;
  
  // 计算第一层节点的起始Y位置
  let currentY = 100; // 顶部留白
  const firstLevelPositions: NodePosition[] = [];
  for (let i = 0; i < nodes.length; i++) {
    firstLevelPositions.push({
      x: LEVEL_WIDTH,
      y: currentY,
      width: 200,
      height: firstLevelHeights[i],
    });
    currentY += firstLevelHeights[i] + NODE_VERTICAL_GAP;
  }

  const totalWidth = LEVEL_WIDTH * 4; // 假设最多4层
  const containerHeight = Math.max(totalHeight + 200, 800);

  return (
    <div
      className="relative mx-auto"
      style={{ 
        width: `${totalWidth}px`, 
        minHeight: `${containerHeight}px`,
        padding: '40px'
      }}
    >
      {/* 连接线 SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        {nodes.map((node, i) => {
          const pos = firstLevelPositions[i];
          return (
            <line
              key={i}
              x1={120}
              y1={pos.y + NODE_HEIGHT / 2}
              x2={pos.x}
              y2={pos.y + NODE_HEIGHT / 2}
              stroke="rgba(148, 163, 184, 0.5)"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      {/* 中心节点 */}
      <div
        className="absolute rounded-xl border-2 border-blue-500/70 bg-blue-600/20 px-6 py-4 flex items-center justify-center font-bold text-lg text-blue-300 shadow-lg z-10"
        style={{
          left: '0px',
          top: `${firstLevelPositions.length > 0 
            ? (firstLevelPositions[0].y + firstLevelPositions[firstLevelPositions.length - 1].y + firstLevelHeights[firstLevelHeights.length - 1]) / 2 - NODE_HEIGHT / 2
            : 100}px`,
          width: '200px',
          height: `${NODE_HEIGHT}px`,
        }}
      >
        <span className="text-center">{rootLabel}</span>
      </div>

      {/* 第一层分支 */}
      {nodes.map((node, i) => {
        const pos = firstLevelPositions[i];
        return (
          <MindMapBranch
            key={i}
            node={node}
            sectionStatus={sectionStatus}
            onSectionClick={onSectionClick}
            level={0}
            x={pos.x}
            y={pos.y}
            isFirstLevel
          />
        );
      })}
    </div>
  );
}

function MindMapBranch({
  node,
  sectionStatus,
  onSectionClick,
  level,
  x,
  y,
  isFirstLevel,
}: {
  node: KnowledgeTreeNode;
  sectionStatus: SectionStatus;
  onSectionClick: (key: string | null) => void;
  level: number;
  x: number;
  y: number;
  isFirstLevel?: boolean;
}) {
  const isLeaf = !!node.sectionKey;
  const status = node.sectionKey ? sectionStatus[node.sectionKey] : undefined;
  const passed = status?.passed ?? false;
  const hasReports = (status?.reportCount ?? 0) > 0;
  const dim = isLeaf && !hasReports;

  const levelColors = [
    'border-rose-500/70 bg-rose-900/40 text-rose-100 shadow-lg',
    'border-emerald-500/60 bg-emerald-900/30 text-emerald-100 shadow-md',
    'border-amber-500/60 bg-amber-900/30 text-amber-100 shadow-md',
    'border-blue-400/60 bg-blue-900/30 text-blue-100 shadow-md',
  ];
  const colorClass = levelColors[Math.min(level, levelColors.length - 1)];

  let stateClass = colorClass;
  if (isLeaf) {
    if (passed)
      stateClass += ' shadow-xl ring-2 ring-green-400/70 bg-green-900/30';
    else if (dim) stateClass += ' opacity-50 grayscale';
    else stateClass += ' opacity-95';
  }

  // 根据层级调整节点大小
  const nodeSizes = {
    0: 'px-5 py-3 min-w-[180px] text-sm',
    1: 'px-4 py-2.5 min-w-[160px] text-xs',
    2: 'px-3 py-2 min-w-[140px] text-xs',
    3: 'px-2.5 py-1.5 min-w-[120px] text-[11px]',
  };
  const sizeClass = nodeSizes[Math.min(level, 3) as keyof typeof nodeSizes] || nodeSizes[3];

  const nodeContent = (
    <div
      className={`
        rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center
        ${stateClass}
        ${sizeClass}
        ${isLeaf ? 'cursor-pointer hover:scale-105 hover:z-20' : ''}
      `}
      onClick={() =>
        isLeaf && node.sectionKey && onSectionClick(node.sectionKey)
      }
      title={
        isLeaf
          ? passed
            ? '已通关'
            : hasReports
              ? '有测评未通关'
              : '暂无测评'
          : undefined
      }
      style={{ height: `${NODE_HEIGHT}px` }}
    >
      <span className="font-medium text-center break-words leading-tight px-2">
        {node.label}
      </span>
      {isLeaf && (
        <span className={`mt-1 opacity-75 ${level <= 1 ? 'text-[10px]' : 'text-[9px]'}`}>
          {passed
            ? '✓ 已通关'
            : hasReports
              ? `${status?.reportCount}次测评`
              : '未测'}
        </span>
      )}
    </div>
  );

  if (!node.children?.length) {
    return (
      <div
        className="absolute z-10"
        style={{ left: `${x}px`, top: `${y}px` }}
      >
        {nodeContent}
      </div>
    );
  }

  // 计算子节点的位置
  const childPositions: NodePosition[] = [];
  let currentChildY = y;
  
  for (const child of node.children) {
    const childHeight = calculateTreeHeight(child);
    childPositions.push({
      x: x + LEVEL_WIDTH,
      y: currentChildY,
      width: 200,
      height: childHeight,
    });
    currentChildY += childHeight + NODE_VERTICAL_GAP;
  }

  // 调整当前节点位置，使其在子节点中间
  const totalChildrenHeight = childPositions.reduce((sum, pos) => sum + pos.height, 0) + 
    (childPositions.length - 1) * NODE_VERTICAL_GAP;
  const adjustedY = childPositions[0]?.y + totalChildrenHeight / 2 - NODE_HEIGHT / 2;

  return (
    <>
      {/* 当前节点 */}
      <div
        className="absolute z-10"
        style={{ left: `${x}px`, top: `${adjustedY}px` }}
      >
        {nodeContent}
      </div>
      
      {/* 连接线 */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        {node.children.map((child, i) => {
          const childPos = childPositions[i];
          const childCenterY = childPos.y + NODE_HEIGHT / 2;
          const parentRightX = x + (level === 0 ? 180 : level === 1 ? 160 : 140);
          const childLeftX = childPos.x;
          
          return (
            <g key={i}>
              {/* 水平线 */}
              <line
                x1={parentRightX}
                y1={adjustedY + NODE_HEIGHT / 2}
                x2={parentRightX + CONNECTOR_LENGTH}
                y2={adjustedY + NODE_HEIGHT / 2}
                stroke="rgba(148, 163, 184, 0.5)"
                strokeWidth="2"
              />
              {/* 垂直线 */}
              <line
                x1={parentRightX + CONNECTOR_LENGTH}
                y1={adjustedY + NODE_HEIGHT / 2}
                x2={parentRightX + CONNECTOR_LENGTH}
                y2={childCenterY}
                stroke="rgba(148, 163, 184, 0.5)"
                strokeWidth="2"
              />
              {/* 到子节点的水平线 */}
              <line
                x1={parentRightX + CONNECTOR_LENGTH}
                y1={childCenterY}
                x2={childLeftX}
                y2={childCenterY}
                stroke="rgba(148, 163, 184, 0.5)"
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>

      {/* 子节点 */}
      {node.children.map((child, i) => {
        const childPos = childPositions[i];
        return (
          <MindMapBranch
            key={i}
            node={child}
            sectionStatus={sectionStatus}
            onSectionClick={onSectionClick}
            level={level + 1}
            x={childPos.x}
            y={childPos.y}
          />
        );
      })}
    </>
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
