// 错题本和错题的 Cookie 存储工具

import { cookies } from 'next/headers';

export interface WrongBook {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface WrongQuestion {
  id: string;
  name: string;
  content: string;
  wrongBookId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const WRONG_BOOKS_COOKIE = 'wrong_books';
const WRONG_QUESTIONS_COOKIE = 'wrong_questions';
const MAX_COOKIE_SIZE = 4000; // 单个 cookie 最大约 4KB

// 获取所有错题本
export async function getWrongBooks(): Promise<WrongBook[]> {
  const cookieStore = await cookies();
  const data = cookieStore.get(WRONG_BOOKS_COOKIE)?.value;
  if (!data) return [];
  try {
    return JSON.parse(decodeURIComponent(data));
  } catch {
    return [];
  }
}

// 保存所有错题本
export async function saveWrongBooks(books: WrongBook[]): Promise<void> {
  const cookieStore = await cookies();
  const data = JSON.stringify(books);
  const encoded = encodeURIComponent(data);
  
  // 如果数据太大，尝试压缩或分片
  if (encoded.length > MAX_COOKIE_SIZE) {
    // 如果超过限制，只保留最近的 50 个错题本
    const limited = books.slice(-50);
    cookieStore.set(WRONG_BOOKS_COOKIE, encodeURIComponent(JSON.stringify(limited)), {
      maxAge: 60 * 60 * 24 * 365, // 1 年
      httpOnly: true,
      sameSite: 'lax',
    });
  } else {
    cookieStore.set(WRONG_BOOKS_COOKIE, encoded, {
      maxAge: 60 * 60 * 24 * 365, // 1 年
      httpOnly: true,
      sameSite: 'lax',
    });
  }
}

// 获取所有错题
export async function getWrongQuestions(): Promise<WrongQuestion[]> {
  const cookieStore = await cookies();
  const data = cookieStore.get(WRONG_QUESTIONS_COOKIE)?.value;
  if (!data) return [];
  try {
    return JSON.parse(decodeURIComponent(data));
  } catch {
    return [];
  }
}

// 保存所有错题
export async function saveWrongQuestions(questions: WrongQuestion[]): Promise<void> {
  const cookieStore = await cookies();
  
  // 如果数据太大，分片存储
  const data = JSON.stringify(questions);
  const encoded = encodeURIComponent(data);
  
  if (encoded.length > MAX_COOKIE_SIZE) {
    // 如果超过限制，只保留最近的 200 个错题
    const limited = questions.slice(-200);
    cookieStore.set(WRONG_QUESTIONS_COOKIE, encodeURIComponent(JSON.stringify(limited)), {
      maxAge: 60 * 60 * 24 * 365, // 1 年
      httpOnly: true,
      sameSite: 'lax',
    });
  } else {
    cookieStore.set(WRONG_QUESTIONS_COOKIE, encoded, {
      maxAge: 60 * 60 * 24 * 365, // 1 年
      httpOnly: true,
      sameSite: 'lax',
    });
  }
}

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
