'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CreateQuestionModal from './CreateQuestionModal';
import FloatingChatButton from './FloatingChatButton';
import ViewQuestionModal from './ViewQuestionModal';
import { SubjectKey, SUBJECT_MAP, getNestingLevel } from '@/lib/wrong-book-types';

interface WrongBook {
  id: string;
  name: string;
  subject: string | null;
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface WrongQuestion {
  id: string;
  name: string;
  content: string;
  wrongBookId: string | null;
  subject: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface SubjectContentPageProps {
  subject: SubjectKey;
  studentId: string;
  parentBookId?: string | null; // 当前所在的错题本ID，null表示在学科根目录
}

export default function SubjectContentPage({ subject, studentId, parentBookId = null }: SubjectContentPageProps) {
  const router = useRouter();
  const [books, setBooks] = useState<WrongBook[]>([]);
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ 
    x: number; 
    y: number; 
    type: 'blank' | 'book' | 'question'; 
    bookId?: string; 
    questionId?: string 
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'book' | 'question'>('book');
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingBookName, setEditingBookName] = useState<string>('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionName, setEditingQuestionName] = useState<string>('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<WrongQuestion | null>(null);

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const [booksRes, questionsRes] = await Promise.all([
        fetch(`/api/student/wrong-books?subject=${subject}&parentId=${parentBookId || 'null'}`),
        fetch(`/api/student/wrong-questions?subject=${subject}&wrongBookId=${parentBookId || 'null'}`),
      ]);

      if (booksRes.ok) {
        const booksData = await booksRes.json();
        setBooks(booksData.wrongBooks || []);
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setQuestions(questionsData.questions || []);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subject, parentBookId]);

  // 获取所有错题本（用于计算嵌套层级）
  const getAllBooks = async (): Promise<WrongBook[]> => {
    try {
      const res = await fetch(`/api/student/wrong-books?subject=${subject}`);
      if (res.ok) {
        const data = await res.json();
        return data.wrongBooks || [];
      }
    } catch (error) {
      console.error('Get all books error:', error);
    }
    return [];
  };

  // 右击菜单
  const handleContextMenu = (
    e: React.MouseEvent,
    type: 'blank' | 'book' | 'question',
    bookId?: string,
    questionId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, bookId, questionId });
  };

  // 创建错题本
  const handleCreateBook = async () => {
    try {
      const allBooks = await getAllBooks();
      const currentLevel = parentBookId ? getNestingLevel(parentBookId, allBooks) : 0;
      
      if (currentLevel >= 5) {
        alert('嵌套层级已达到最大限制（5级），无法继续创建子错题本');
        setContextMenu(null);
        return;
      }

      const res = await fetch('/api/student/wrong-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: '新错题本',
          subject,
          parentId: parentBookId,
        }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Create book error:', error);
    }
    setContextMenu(null);
  };

  // 创建错题
  const handleCreateQuestion = () => {
    setCreateType('question');
    setShowCreateModal(true);
    setContextMenu(null);
  };

  // 删除错题本
  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('确定删除该错题本吗？删除后其中的所有错题和子错题本也将被删除。')) return;
    try {
      const res = await fetch(`/api/student/wrong-books/${bookId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Delete book error:', error);
    }
    setContextMenu(null);
  };

  // 删除错题
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('确定删除该错题吗？')) return;
    try {
      const res = await fetch(`/api/student/wrong-questions/${questionId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Delete question error:', error);
    }
    setContextMenu(null);
  };

  // 开始编辑错题本名称
  const handleStartEditBook = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    setEditingBookId(bookId);
    setEditingBookName(book.name);
  };

  // 保存错题本名称
  const handleSaveBookName = async (bookId: string) => {
    const newName = editingBookName.trim();
    if (!newName) {
      const book = books.find(b => b.id === bookId);
      if (book) {
        setEditingBookName(book.name);
      }
      setEditingBookId(null);
      return;
    }

    const duplicateBook = books.find(b => b.id !== bookId && b.name === newName);
    if (duplicateBook) {
      alert('错题本名称已存在，请使用其他名称');
      return;
    }

    try {
      const res = await fetch(`/api/student/wrong-books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        await loadData();
        setEditingBookId(null);
      }
    } catch (error) {
      console.error('Update book name error:', error);
    }
  };

  // 开始编辑错题名称
  const handleStartEditQuestion = (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    setEditingQuestionId(questionId);
    setEditingQuestionName(question.name);
  };

  // 保存错题名称
  const handleSaveQuestionName = async (questionId: string) => {
    const newName = editingQuestionName.trim();
    if (!newName) {
      const question = questions.find(q => q.id === questionId);
      if (question) {
        setEditingQuestionName(question.name);
      }
      setEditingQuestionId(null);
      return;
    }

    const duplicateQuestion = questions.find(q => q.id !== questionId && q.name === newName);
    if (duplicateQuestion) {
      alert('错题名称已存在，请使用其他名称');
      return;
    }

    try {
      const res = await fetch(`/api/student/wrong-questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        await loadData();
        setEditingQuestionId(null);
      }
    } catch (error) {
      console.error('Update question name error:', error);
    }
  };

  // 点击错题本进入子页面
  const handleBookClick = (bookId: string) => {
    router.push(`/student/notebook/${subject}/${bookId}`);
  };

  // 点击错题查看详情（打开模态框）
  const handleQuestionClick = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      setSelectedQuestion(question);
      setShowViewModal(true);
    }
  };

  // 面包屑导航
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (parentBookId) {
      getAllBooks().then(allBooks => {
        const crumbs: Array<{ id: string; name: string }> = [];
        let currentId: string | null = parentBookId;
        const visited = new Set<string>();

        while (currentId && visited.size < 10) {
          if (visited.has(currentId)) break;
          visited.add(currentId);

          const book = allBooks.find(b => b.id === currentId);
          if (!book) break;

          crumbs.unshift({ id: book.id, name: book.name });
          currentId = book.parentId;
        }

        setBreadcrumbs(crumbs);
      });
    } else {
      setBreadcrumbs([]);
    }
  }, [parentBookId]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" onContextMenu={(e) => handleContextMenu(e, 'blank')}>
      <div className="max-w-7xl mx-auto">
        {/* 导航栏 */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={parentBookId ? `/student/notebook/${subject}` : '/student/notebook'}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            ← 返回
          </Link>
          <h1 className="text-3xl font-bold text-blue-400">{SUBJECT_MAP[subject]}</h1>
          
          {/* 面包屑导航 */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 text-gray-400">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.id}>
                  {index > 0 && ' / '}
                  <button
                    onClick={() => router.push(`/student/notebook/${subject}/${crumb.id}`)}
                    className="hover:text-blue-400 transition"
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 错题本列表 */}
        {books.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">错题本</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book) => (
                <div
                  key={book.id}
                  onClick={() => handleBookClick(book.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'book', book.id)}
                  className="glass-effect rounded-xl p-6 cursor-pointer hover:scale-105 transition-transform"
                >
                  {editingBookId === book.id ? (
                    <input
                      type="text"
                      value={editingBookName}
                      onChange={(e) => setEditingBookName(e.target.value)}
                      onBlur={() => handleSaveBookName(book.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveBookName(book.id);
                        if (e.key === 'Escape') {
                          setEditingBookId(null);
                          const book = books.find(b => b.id === editingBookId);
                          if (book) setEditingBookName(book.name);
                        }
                      }}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                      autoFocus
                    />
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-white mb-2">{book.name}</h3>
                      <p className="text-gray-400 text-sm">点击进入</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 错题列表 */}
        {questions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">错题</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questions.map((question) => (
                <div
                  key={question.id}
                  onClick={() => handleQuestionClick(question.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'question', undefined, question.id)}
                  className="glass-effect rounded-xl p-6 cursor-pointer hover:scale-105 transition-transform"
                >
                  {editingQuestionId === question.id ? (
                    <input
                      type="text"
                      value={editingQuestionName}
                      onChange={(e) => setEditingQuestionName(e.target.value)}
                      onBlur={() => handleSaveQuestionName(question.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveQuestionName(question.id);
                        if (e.key === 'Escape') {
                          setEditingQuestionId(null);
                          const question = questions.find(q => q.id === editingQuestionId);
                          if (question) setEditingQuestionName(question.name);
                        }
                      }}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                      autoFocus
                    />
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-white mb-2">{question.name}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2">{question.content.substring(0, 100)}...</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空白提示 */}
        {books.length === 0 && questions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-4">当前目录为空</p>
            <p className="text-gray-500 text-sm">右键空白处可以创建错题本或错题</p>
          </div>
        )}

        {/* 右键菜单 */}
        {contextMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setContextMenu(null)}
            />
            <div
              className="fixed z-50 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 min-w-[150px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              {contextMenu.type === 'blank' && (
                <>
                  <button
                    onClick={handleCreateBook}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition text-white"
                  >
                    创建错题本
                  </button>
                  <button
                    onClick={handleCreateQuestion}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition text-white"
                  >
                    创建错题
                  </button>
                </>
              )}
              {contextMenu.type === 'book' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (contextMenu.bookId) handleStartEditBook(e, contextMenu.bookId);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition text-white"
                  >
                    重命名
                  </button>
                  <button
                    onClick={() => {
                      if (contextMenu.bookId) handleDeleteBook(contextMenu.bookId);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition text-red-400"
                  >
                    删除
                  </button>
                </>
              )}
              {contextMenu.type === 'question' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (contextMenu.questionId) handleStartEditQuestion(e, contextMenu.questionId);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition text-white"
                  >
                    重命名
                  </button>
                  <button
                    onClick={() => {
                      if (contextMenu.questionId) handleDeleteQuestion(contextMenu.questionId);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition text-red-400"
                  >
                    删除
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* 创建错题模态框 */}
        {showCreateModal && (
          <CreateQuestionModal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              loadData();
            }}
            wrongBookId={parentBookId || undefined}
            subject={subject}
            onSuccess={() => {
              setShowCreateModal(false);
              loadData();
            }}
          />
        )}

        {/* 查看错题模态框 */}
        {showViewModal && selectedQuestion && (
          <ViewQuestionModal
            questionId={selectedQuestion.id}
            questionName={selectedQuestion.name}
            questionContent={selectedQuestion.content}
            isOpen={showViewModal}
            onClose={() => {
              setShowViewModal(false);
              setSelectedQuestion(null);
            }}
          />
        )}

        <FloatingChatButton />
      </div>
    </div>
  );
}
