// 错题本类型和常量 - 客户端可安全导入（不含 next/headers）

export interface WrongBook {
  id: string;
  name: string;
  subject: string | null; // 学科：'chinese' | 'english' | 'math' | 'computer' | null
  parentId: string | null; // 父错题本ID，null表示在学科根目录下
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface WrongQuestion {
  id: string;
  name: string;
  content: string;
  wrongBookId: string | null; // 所属错题本ID
  subject: string | null; // 学科
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// 学科映射
export const SUBJECT_MAP = {
  chinese: '大学语文',
  english: '大学英语',
  math: '高等数学',
  computer: '计算机基础',
} as const;

export type SubjectKey = keyof typeof SUBJECT_MAP;

// 计算嵌套层级（纯函数，不依赖 cookies）
export function getNestingLevel(bookId: string | null, books: WrongBook[]): number {
  if (!bookId) return 0;

  let level = 0;
  let currentId: string | null = bookId;
  const visited = new Set<string>();

  while (currentId && level < 10) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const book = books.find((b) => b.id === currentId);
    if (!book || !book.parentId) break;
    currentId = book.parentId;
    level++;
  }

  return level;
}
