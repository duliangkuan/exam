'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CreateQuestionModal from './CreateQuestionModal';
import FloatingChatButton from './FloatingChatButton';

interface WrongQuestion {
  id: string;
  name: string;
  content: string;
  wrongBookId: string | null;
  sortOrder: number;
  createdAt: string;
}

interface WrongBookDetailPageProps {
  wrongBookId: string;
  wrongBookName: string;
  studentId: string;
}

export default function WrongBookDetailPage({ wrongBookId, wrongBookName, studentId }: WrongBookDetailPageProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'blank' | 'question'; questionId?: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionName, setEditingQuestionName] = useState<string>('');

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/wrong-questions?wrongBookId=${wrongBookId}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Load questions error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [wrongBookId]);

  const handleContextMenu = (e: React.MouseEvent, type: 'blank' | 'question' = 'blank', questionId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, questionId });
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('确定删除该错题吗？')) return;
    try {
      const res = await fetch(`/api/student/wrong-questions/${questionId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadQuestions();
      }
    } catch (error) {
      console.error('Delete question error:', error);
    }
    setContextMenu(null);
  };

  const handleStartEditQuestion = (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    setEditingQuestionId(questionId);
    setEditingQuestionName(question.name);
  };

  const handleSaveQuestionName = async (questionId: string) => {
    const newName = editingQuestionName.trim();
    if (!newName) {
      // 如果名称为空，恢复原名
      const question = questions.find(q => q.id === questionId);
      if (question) {
        setEditingQuestionName(question.name);
      }
      setEditingQuestionId(null);
      return;
    }

    // 检查名称是否重复（在同一错题本内）
    const duplicateQuestion = questions.find(
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
        await loadQuestions();
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
    const question = questions.find(q => q.id === questionId);
    if (question) {
      setEditingQuestionId(questionId);
      setEditingQuestionName(question.name);
    }
    setContextMenu(null);
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/student/wrong-books/${wrongBookId}/export`);
      if (res.ok) {
        const data = await res.json();
        // 生成文本文件
        let content = `错题本：${data.wrongBookName}\n`;
        content += `导出时间：${new Date(data.exportTime).toLocaleString('zh-CN')}\n\n`;
        content += '='.repeat(50) + '\n\n';
        
        data.questions.forEach((q: any, index: number) => {
          content += `${index + 1}. ${q.name}\n`;
          content += `${q.content}\n\n`;
          content += '-'.repeat(50) + '\n\n';
        });

        // 下载文件
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.wrongBookName}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowExportModal(false);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败，请重试');
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-context-menu]')) {
        return;
      }
      setContextMenu(null);
    };
    if (contextMenu) {
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/student/notebook"
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
            >
              ← 返回
            </Link>
            <h1 className="text-3xl font-bold text-blue-400">{wrongBookName}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              导出错题本
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              新建错题
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="text-gray-400 text-center py-12">
            <p className="mb-4">该错题本暂无错题</p>
            <p className="text-sm">右击空白处或点击「新建错题」按钮创建错题</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questions.map((q) => (
              <div
                key={q.id}
                onContextMenu={(e) => handleContextMenu(e, 'question', q.id)}
                className="glass-effect rounded-xl p-4 cursor-pointer hover:border-blue-500 transition border border-blue-500/30"
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
                    className="text-sm font-bold text-blue-400 mb-2 w-full bg-gray-700 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <h4 
                    className="text-sm font-bold text-blue-400 mb-2 cursor-text hover:underline"
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
                <p className="text-xs text-gray-400 line-clamp-3">{q.content}</p>
              </div>
            ))}
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal(true);
                  setContextMenu(null);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-sm whitespace-nowrap"
              >
                创建错题
              </button>
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
            wrongBookId={wrongBookId}
            onSuccess={() => {
              loadQuestions();
              setShowCreateModal(false);
            }}
          />
        )}

        {/* 导出确认弹窗 */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">导出错题本</h3>
              <p className="text-gray-400 mb-6">将导出该错题本下的所有错题（题目名称和题目文本）</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  取消
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  确认导出
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 悬浮聊天按钮 */}
      <FloatingChatButton />
    </div>
  );
}
