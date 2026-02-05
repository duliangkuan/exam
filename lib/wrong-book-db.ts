// 错题本和错题的数据库操作（替换 Cookie 存储）

import { prisma } from './db';
import type { WrongBook, WrongQuestion } from './wrong-book-types';

export type { WrongBook, WrongQuestion, SubjectKey } from './wrong-book-types';
export { SUBJECT_MAP, getNestingLevel } from './wrong-book-types';

/**
 * 获取指定学生的所有错题本
 */
export async function getWrongBooks(studentId: string): Promise<WrongBook[]> {
  const books = await prisma.wrongBook.findMany({
    where: { studentId },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return books.map((book) => ({
    id: book.id,
    name: book.name,
    subject: book.subject,
    parentId: book.parentId,
    sortOrder: book.sortOrder,
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
  }));
}

/**
 * 保存错题本（创建或更新）
 */
export async function saveWrongBook(
  studentId: string,
  book: Omit<WrongBook, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }
): Promise<WrongBook> {
  // 检查是否存在
  const existing = await prisma.wrongBook.findUnique({
    where: { id: book.id },
  });

  if (existing) {
    // 更新（确保只能更新自己的错题本）
    if (existing.studentId !== studentId) {
      throw new Error('无权访问此错题本');
    }
    const saved = await prisma.wrongBook.update({
      where: { id: book.id },
      data: {
        name: book.name,
        subject: book.subject,
        parentId: book.parentId,
        sortOrder: book.sortOrder,
      },
    });
    return {
      id: saved.id,
      name: saved.name,
      subject: saved.subject,
      parentId: saved.parentId,
      sortOrder: saved.sortOrder,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  } else {
    // 创建
    const saved = await prisma.wrongBook.create({
      data: {
        id: book.id,
        studentId,
        name: book.name,
        subject: book.subject,
        parentId: book.parentId,
        sortOrder: book.sortOrder,
      },
    });
    return {
      id: saved.id,
      name: saved.name,
      subject: saved.subject,
      parentId: saved.parentId,
      sortOrder: saved.sortOrder,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }
}

/**
 * 批量保存错题本
 */
export async function saveWrongBooks(
  studentId: string,
  books: WrongBook[]
): Promise<void> {
  // 使用事务批量更新
  await prisma.$transaction(
    books.map((book) =>
      prisma.wrongBook.upsert({
        where: { id: book.id },
        create: {
          id: book.id,
          studentId,
          name: book.name,
          subject: book.subject,
          parentId: book.parentId,
          sortOrder: book.sortOrder,
        },
        update: {
          name: book.name,
          subject: book.subject,
          parentId: book.parentId,
          sortOrder: book.sortOrder,
        },
      })
    )
  );
}

/**
 * 删除错题本
 */
export async function deleteWrongBook(
  studentId: string,
  bookId: string
): Promise<void> {
  await prisma.wrongBook.deleteMany({
    where: {
      id: bookId,
      studentId, // 确保只能删除自己的错题本
    },
  });
}

/**
 * 获取指定学生的所有错题
 */
export async function getWrongQuestions(studentId: string): Promise<WrongQuestion[]> {
  const questions = await prisma.wrongQuestion.findMany({
    where: { studentId },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return questions.map((q) => ({
    id: q.id,
    name: q.name,
    content: q.content,
    wrongBookId: q.wrongBookId,
    subject: q.subject,
    sortOrder: q.sortOrder,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
  }));
}

/**
 * 保存错题（创建或更新）
 */
export async function saveWrongQuestion(
  studentId: string,
  question: Omit<WrongQuestion, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }
): Promise<WrongQuestion> {
  // 检查是否存在
  const existing = await prisma.wrongQuestion.findUnique({
    where: { id: question.id },
  });

  if (existing) {
    // 更新（确保只能更新自己的错题）
    if (existing.studentId !== studentId) {
      throw new Error('无权访问此错题');
    }
    const saved = await prisma.wrongQuestion.update({
      where: { id: question.id },
      data: {
        name: question.name,
        content: question.content,
        wrongBookId: question.wrongBookId,
        subject: question.subject,
        sortOrder: question.sortOrder,
      },
    });
    return {
      id: saved.id,
      name: saved.name,
      content: saved.content,
      wrongBookId: saved.wrongBookId,
      subject: saved.subject,
      sortOrder: saved.sortOrder,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  } else {
    // 创建
    const saved = await prisma.wrongQuestion.create({
      data: {
        id: question.id,
        studentId,
        name: question.name,
        content: question.content,
        wrongBookId: question.wrongBookId,
        subject: question.subject,
        sortOrder: question.sortOrder,
      },
    });
    return {
      id: saved.id,
      name: saved.name,
      content: saved.content,
      wrongBookId: saved.wrongBookId,
      subject: saved.subject,
      sortOrder: saved.sortOrder,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }
}

/**
 * 批量保存错题
 */
export async function saveWrongQuestions(
  studentId: string,
  questions: WrongQuestion[]
): Promise<void> {
  // 使用事务批量更新
  await prisma.$transaction(
    questions.map((q) =>
      prisma.wrongQuestion.upsert({
        where: { id: q.id },
        create: {
          id: q.id,
          studentId,
          name: q.name,
          content: q.content,
          wrongBookId: q.wrongBookId,
          subject: q.subject,
          sortOrder: q.sortOrder,
        },
        update: {
          name: q.name,
          content: q.content,
          wrongBookId: q.wrongBookId,
          subject: q.subject,
          sortOrder: q.sortOrder,
        },
      })
    )
  );
}

/**
 * 删除错题
 */
export async function deleteWrongQuestion(
  studentId: string,
  questionId: string
): Promise<void> {
  await prisma.wrongQuestion.deleteMany({
    where: {
      id: questionId,
      studentId, // 确保只能删除自己的错题
    },
  });
}

/**
 * 生成唯一 ID（兼容原有接口）
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
