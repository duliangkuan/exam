import chineseData from '@/data/chinese_exam_nodes.json';
import englishData from '@/data/english_exam_nodes.json';
import mathData from '@/data/math_exam_nodes.json';
import computerData from '@/data/computer_exam_nodes.json';

type ExamNode = { [key: string]: string | string[] };

const SUBJECT_KEY_MAP: Record<string, string> = {
  大学语文: 'chinese',
  大学英语: 'english',
  高等数学: 'math',
  计算机基础: 'computer',
};

export const SUBJECT_NAMES: Record<string, string> = {
  chinese: '大学语文',
  english: '大学英语',
  math: '高等数学',
  computer: '计算机基础',
};

/** 各科目知识树层级（从主干到节） */
export const SUBJECT_STEPS: Record<string, string[]> = {
  chinese: ['板块', '章', '节'],
  english: ['板块', '部分', '章', '节'],
  math: ['章', '节'],
  computer: ['章', '节'],
};

/** 根据 selectedPath 生成稳定 sectionKey，用于与测评报告匹配 */
export function sectionKeyFromPath(
  selectedPath: Record<string, string>,
  subjectKey: string
): string {
  const steps = SUBJECT_STEPS[subjectKey];
  if (!steps) return JSON.stringify(selectedPath);
  const parts = steps
    .filter((k) => selectedPath[k] != null)
    .map((k) => `${k}:${(selectedPath as Record<string, string>)[k]}`);
  return parts.join('|');
}

export interface KnowledgeTreeNode {
  label: string;
  sectionKey?: string;
  children?: KnowledgeTreeNode[];
}

/** 从扁平节点列表构建知识树（根为科目名，叶为节） */
export function buildKnowledgeTree(subjectKey: string): {
  rootLabel: string;
  steps: string[];
  nodes: KnowledgeTreeNode[];
} {
  const steps = SUBJECT_STEPS[subjectKey];
  const name = SUBJECT_NAMES[subjectKey];
  if (!steps || !name) return { rootLabel: '', steps: [], nodes: [] };

  const data = (
    subjectKey === 'chinese'
      ? chineseData
      : subjectKey === 'english'
        ? englishData
        : subjectKey === 'math'
          ? mathData
          : computerData
  ) as ExamNode[];

  function pathFromNode(node: ExamNode): Record<string, string> {
    const path: Record<string, string> = {};
    steps.forEach((step) => {
      const v = node[step];
      if (typeof v === 'string') path[step] = v;
    });
    return path;
  }

  function buildTree(
    nodes: ExamNode[],
    level: number
  ): KnowledgeTreeNode[] {
    if (level >= steps.length) return [];
    const key = steps[level];
    const groups = new Map<string, ExamNode[]>();
    for (const n of nodes) {
      const v = (n[key] as string) ?? '';
      if (!groups.has(v)) groups.set(v, []);
      groups.get(v)!.push(n);
    }
    const result: KnowledgeTreeNode[] = [];
    groups.forEach((groupNodes, label) => {
      const isLeaf = level === steps.length - 1;
      const first = groupNodes[0];
      const path = pathFromNode(first);
      const sectionKey = isLeaf ? sectionKeyFromPath(path, subjectKey) : undefined;
      const children = isLeaf ? undefined : buildTree(groupNodes, level + 1);
      result.push({
        label,
        ...(sectionKey && { sectionKey }),
        ...(children?.length ? { children } : {}),
      });
    });
    return result.sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
  }

  const nodes = buildTree(data, 0);
  return { rootLabel: name, steps, nodes };
}

/** 根据科目与选择路径解析本节知识点数量，供测评报告使用 */
export function getKnowledgePointCount(
  subject: string,
  selectedPath: Record<string, string> | null
): number {
  if (!selectedPath || typeof selectedPath !== 'object') return 0;
  const subjectKey = SUBJECT_KEY_MAP[subject] ?? subject;
  const data = (
    subjectKey === 'chinese'
      ? chineseData
      : subjectKey === 'english'
        ? englishData
        : subjectKey === 'math'
          ? mathData
          : computerData
  ) as ExamNode[];

  const node = data.find((item: ExamNode) => {
    return Object.keys(selectedPath).every(
      (key) => item[key] === selectedPath[key]
    );
  });

  if (!node || !Array.isArray(node['知识点'])) return 0;
  return (node['知识点'] as string[]).length;
}

/** 根据科目与选择路径返回本节知识点名称列表，供报告展示与掌握度统计 */
export function getKnowledgePointList(
  subject: string,
  selectedPath: Record<string, string> | null
): string[] {
  if (!selectedPath || typeof selectedPath !== 'object') return [];
  const subjectKey = SUBJECT_KEY_MAP[subject] ?? subject;
  const data = (
    subjectKey === 'chinese'
      ? chineseData
      : subjectKey === 'english'
        ? englishData
        : subjectKey === 'math'
          ? mathData
          : computerData
  ) as ExamNode[];

  const node = data.find((item: ExamNode) => {
    return Object.keys(selectedPath).every(
      (key) => item[key] === selectedPath[key]
    );
  });

  if (!node || !Array.isArray(node['知识点'])) return [];
  return (node['知识点'] as string[]).slice();
}

export { SUBJECT_KEY_MAP };
