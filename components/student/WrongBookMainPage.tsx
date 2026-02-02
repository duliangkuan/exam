'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CreateQuestionModal from './CreateQuestionModal';
import FloatingChatButton from './FloatingChatButton';

interface WrongBook {
  id: string;
  name: string;
  questionCount: number;
  sortOrder: number;
  createdAt: string;
}

interface WrongQuestion {
  id: string;
  name: string;
  content: string;
  wrongBookId: string | null;
  sortOrder: number;
  createdAt: string;
}

interface WrongBookMainPageProps {
  studentId: string;
}

export default function WrongBookMainPage({ studentId }: WrongBookMainPageProps) {
  const router = useRouter();
  const [wrongBooks, setWrongBooks] = useState<WrongBook[]>([]);
  const [ungroupedQuestions, setUngroupedQuestions] = useState<WrongQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'blank' | 'book' | 'question'; bookId?: string; questionId?: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'book' | 'question'>('book');
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingBookName, setEditingBookName] = useState<string>('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionName, setEditingQuestionName] = useState<string>('');
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null);
  const [dragOverBookId, setDragOverBookId] = useState<string | null>(null);

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const [booksRes, questionsRes] = await Promise.all([
        fetch('/api/student/wrong-books'),
        fetch('/api/student/wrong-questions?wrongBookId=null'),
      ]);

      if (booksRes.ok) {
        const booksData = await booksRes.json();
        setWrongBooks(booksData.wrongBooks || []);
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setUngroupedQuestions(questionsData.questions || []);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 右击菜单
  const handleContextMenu = (e: React.MouseEvent, type: 'blank' | 'book' | 'question', bookId?: string, questionId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, bookId, questionId });
  };

  const handleCreateBook = async () => {
    try {
      const res = await fetch('/api/student/wrong-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '新错题本' }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Create book error:', error);
    }
    setContextMenu(null);
  };

  const handleCreateQuestion = () => {
    setCreateType('question');
    setShowCreateModal(true);
    setContextMenu(null);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('确定删除该错题本吗？其下错题将变为未归类。')) return;
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

  const handleRenameBook = async (bookId: string) => {
    const book = wrongBooks.find(b => b.id === bookId);
    if (!book) return;
    
    setEditingBookId(bookId);
    setEditingBookName(book.name);
    setContextMenu(null);
  };

  const handleStartEditBook = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    const book = wrongBooks.find(b => b.id === bookId);
    if (!book) return;
    setEditingBookId(bookId);
    setEditingBookName(book.name);
  };

  const handleSaveBookName = async (bookId: string) => {
    const newName = editingBookName.trim();
    if (!newName) {
      // 如果名称为空，恢复原名
      const book = wrongBooks.find(b => b.id === bookId);
      if (book) {
        setEditingBookName(book.name);
      }
      setEditingBookId(null);
      return;
    }

    // 检查名称是否重复
    const duplicateBook = wrongBooks.find(b => b.id !== bookId && b.name === newName);
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
      } else {
        const data = await res.json();
        alert(data.error || '重命名失败');
      }
    } catch (error) {
      console.error('Rename book error:', error);
      alert('重命名失败，请重试');
    }
  };

  const handleCancelEditBook = () => {
    setEditingBookId(null);
    setEditingBookName('');
  };

  const handleKeyDownBookName = (e: React.KeyboardEvent, bookId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveBookName(bookId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditBook();
    }
  };

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

  const handleStartEditQuestion = (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    const question = ungroupedQuestions.find(q => q.id === questionId);
    if (!question) return;
    setEditingQuestionId(questionId);
    setEditingQuestionName(question.name);
  };

  const handleSaveQuestionName = async (questionId: string) => {
    const newName = editingQuestionName.trim();
    if (!newName) {
      // 如果名称为空，恢复原名
      const question = ungroupedQuestions.find(q => q.id === questionId);
      if (question) {
        setEditingQuestionName(question.name);
      }
      setEditingQuestionId(null);
      return;
    }

    // 检查名称是否重复（在同一错题本内，未归类错题都在 wrongBookId=null）
    const duplicateQuestion = ungroupedQuestions.find(
      q => q.id !== questionId && q.name === newName
    );
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
      } else {
        const data = await res.json();
        alert(data.error || '重命名失败');
      }
    } catch (error) {
      console.error('Rename question error:', error);
      alert('重命名失败，请重试');
    }
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestionId(null);
    setEditingQuestionName('');
  };

  const handleKeyDownQuestionName = (e: React.KeyboardEvent, questionId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveQuestionName(questionId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditQuestion();
    }
  };

  const handleRenameQuestion = async (questionId: string) => {
    const question = ungroupedQuestions.find(q => q.id === questionId);
    if (question) {
      setEditingQuestionId(questionId);
      setEditingQuestionName(question.name);
    }
    setContextMenu(null);
  };

  // 拖拽处理
  const handleDragStart = (e: React.DragEvent, questionId: string) => {
    setDraggedQuestionId(questionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', questionId);
  };

  const handleDragEnd = () => {
    setDraggedQuestionId(null);
    setDragOverBookId(null);
  };

  const handleDragOver = (e: React.DragEvent, bookId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverBookId(bookId);
  };

  const handleDragLeave = () => {
    setDragOverBookId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetBookId: string) => {
    e.preventDefault();
    const questionId = draggedQuestionId || e.dataTransfer.getData('text/plain');
    
    if (!questionId) {
      setDragOverBookId(null);
      return;
    }

    try {
      const res = await fetch(`/api/student/wrong-questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wrongBookId: targetBookId }),
      });
      
      if (res.ok) {
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || '移动失败');
      }
    } catch (error) {
      console.error('Move question error:', error);
      alert('移动失败，请重试');
    }
    
    setDraggedQuestionId(null);
    setDragOverBookId(null);
  };

  // 点击空白处关闭菜单
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // 如果点击的是菜单本身，不关闭
      const target = e.target as HTMLElement;
      if (target.closest('[data-context-menu]')) {
        return;
      }
      setContextMenu(null);
    };
    if (contextMenu) {
      // 延迟添加监听器，避免立即触发
      setTimeout(() => {
        document.addEventListener('click', handleClick);
      }, 100);
      return () => {
        document.removeEventListener('click', handleClick);
      };
    }
  }, [contextMenu]);

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
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/student/dashboard"
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            ← 返回
          </Link>
          <h1 className="text-3xl font-bold text-blue-400">AI错题本</h1>
        </div>

        {/* 错题本列表 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">错题本</h2>
          {wrongBooks.length === 0 ? (
            <div className="text-gray-400 text-center py-8">暂无错题本，右击空白处创建</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wrongBooks.map((book) => (
                <div
                  key={book.id}
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, 'book', book.id);
                  }}
                  onDragOver={(e) => handleDragOver(e, book.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, book.id)}
                  className={`glass-effect rounded-xl p-6 cursor-pointer transition border ${
                    dragOverBookId === book.id
                      ? 'border-green-500 bg-green-500/20 scale-105'
                      : 'border-blue-500/30 hover:border-blue-500'
                  }`}
                  onClick={(e) => {
                    if (!contextMenu && !editingBookId) {
                      router.push(`/student/notebook/${book.id}`);
                    }
                  }}
                >
                  {editingBookId === book.id ? (
                    <input
                      type="text"
                      value={editingBookName}
                      onChange={(e) => setEditingBookName(e.target.value)}
                      onBlur={() => handleSaveBookName(book.id)}
                      onKeyDown={(e) => handleKeyDownBookName(e, book.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-lg font-bold text-blue-400 mb-2 w-full bg-gray-700 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <h3 
                      className="text-lg font-bold text-blue-400 mb-2 cursor-text hover:underline"
                      onDoubleClick={(e) => handleStartEditBook(e, book.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        // 单击也可以编辑，但需要延迟一下避免和跳转冲突
                        setTimeout(() => {
                          if (!editingBookId) {
                            handleStartEditBook(e, book.id);
                          }
                        }, 200);
                      }}
                    >
                      {book.name}
                    </h3>
                  )}
                  <p className="text-sm text-gray-400">{book.questionCount} 道错题</p>
                  {dragOverBookId === book.id && (
                    <p className="text-sm text-green-400 mt-2">松开以移动错题到这里</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 未归类错题 */}
        {ungroupedQuestions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-cyan-400 mb-4">未归类</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ungroupedQuestions.map((q) => (
                <div
                  key={q.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, q.id)}
                  onDragEnd={handleDragEnd}
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, 'question', undefined, q.id);
                  }}
                  className={`glass-effect rounded-xl p-4 cursor-move transition border ${
                    draggedQuestionId === q.id
                      ? 'border-yellow-500 bg-yellow-500/20 opacity-50'
                      : 'border-blue-500/30 hover:border-blue-500'
                  }`}
                  onClick={(e) => {
                    if (!contextMenu && !editingQuestionId) {
                      router.push(`/student/notebook/question/${q.id}`);
                    }
                  }}
                >
                  {editingQuestionId === q.id ? (
                    <input
                      type="text"
                      value={editingQuestionName}
                      onChange={(e) => setEditingQuestionName(e.target.value)}
                      onBlur={() => handleSaveQuestionName(q.id)}
                      onKeyDown={(e) => handleKeyDownQuestionName(e, q.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-bold text-blue-400 mb-1 w-full bg-gray-700 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <h4 
                      className="text-sm font-bold text-blue-400 mb-1 cursor-text hover:underline"
                      onDoubleClick={(e) => handleStartEditQuestion(e, q.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        // 单击也可以编辑，但需要延迟一下避免和跳转冲突
                        setTimeout(() => {
                          if (!editingQuestionId) {
                            handleStartEditQuestion(e, q.id);
                          }
                        }, 200);
                      }}
                    >
                      {q.name}
                    </h4>
                  )}
                  <p className="text-xs text-gray-400 line-clamp-2">{q.content.slice(0, 60)}...</p>
                  {draggedQuestionId === q.id && (
                    <p className="text-xs text-yellow-400 mt-1">拖动中...</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 右击菜单 */}
        {contextMenu && (
          <div
            data-context-menu
            className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-2 z-[100] min-w-[150px]"
            style={{ 
              left: `${contextMenu.x}px`, 
              top: `${contextMenu.y}px`,
              position: 'fixed',
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'blank' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateBook();
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-sm whitespace-nowrap"
                >
                  创建错题本
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateQuestion();
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-sm whitespace-nowrap"
                >
                  创建错题
                </button>
              </>
            )}
            {contextMenu.type === 'book' && contextMenu.bookId && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameBook(contextMenu.bookId!);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-sm whitespace-nowrap"
                >
                  重命名
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBook(contextMenu.bookId!);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-red-400 whitespace-nowrap"
                >
                  删除
                </button>
              </>
            )}
            {contextMenu.type === 'question' && contextMenu.questionId && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameQuestion(contextMenu.questionId!);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-sm whitespace-nowrap"
                >
                  重命名
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteQuestion(contextMenu.questionId!);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-red-400 whitespace-nowrap"
                >
                  删除
                </button>
              </>
            )}
          </div>
        )}

        {/* 创建错题弹窗 */}
        {showCreateModal && (
          <CreateQuestionModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            wrongBookId={null}
            onSuccess={() => {
              loadData();
              setShowCreateModal(false);
            }}
          />
        )}
      </div>

      {/* 悬浮聊天按钮 */}
      <FloatingChatButton />
    </div>
  );
}
