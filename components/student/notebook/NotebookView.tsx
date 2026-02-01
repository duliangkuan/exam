'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CreateQuestionModal from './CreateQuestionModal';
import QuestionDetailModal from './QuestionDetailModal';

type Notebook = { id: string; name: string; createdAt: string; _count?: { questions: number } };
type WrongQuestion = { id: string; name: string; content: string; notebookId: string | null; createdAt: string };

export default function NotebookView({
  notebookId,
  notebookName,
}: {
  notebookId: string | null;
  notebookName: string | null;
}) {
  const router = useRouter();
  const isMain = notebookId === null;
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'page' | 'notebook' | 'question'; id?: string } | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailQuestion, setDetailQuestion] = useState<WrongQuestion | null>(null);
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(null);
  const [editingNotebookName, setEditingNotebookName] = useState('');
  const [draggingQuestionId, setDraggingQuestionId] = useState<string | null>(null);
  const [dragOverNotebookId, setDragOverNotebookId] = useState<string | null>(null);

  const fetchNotebooks = useCallback(async () => {
    const res = await fetch('/api/student/notebooks');
    if (res.ok) {
      const list = await res.json();
      setNotebooks(list);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    const url = notebookId
      ? `/api/student/wrong-questions?notebookId=${encodeURIComponent(notebookId)}`
      : '/api/student/wrong-questions';
    const res = await fetch(url);
    if (res.ok) {
      const list = await res.json();
      setQuestions(list);
    }
  }, [notebookId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      isMain ? fetchNotebooks() : Promise.resolve(),
      fetchQuestions(),
    ]).finally(() => setLoading(false));
  }, [isMain, fetchNotebooks, fetchQuestions]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, type: 'page' | 'notebook' | 'question', id?: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, id });
  };

  const handleCreateNotebook = async () => {
    setContextMenu(null);
    const name = window.prompt('错题本名称（建议：某类错题的名字）', '未命名错题本') || '未命名错题本';
    const res = await fetch('/api/student/notebooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      await fetchNotebooks();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || '创建失败');
    }
  };

  const handleRenameNotebook = async (id: string, currentName: string) => {
    setEditingNotebookId(null);
    const name = window.prompt('错题本名称', currentName) || currentName;
    const res = await fetch(`/api/student/notebooks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      await fetchNotebooks();
    }
  };

  const handleDeleteNotebook = async (id: string) => {
    setContextMenu(null);
    if (!window.confirm('将删除本错题本及其内全部错题，是否继续？')) return;
    const res = await fetch(`/api/student/notebooks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchNotebooks();
      if (notebookId === id) router.push('/student/notebook');
    } else {
      alert('删除失败');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    setContextMenu(null);
    setDetailQuestion(null);
    if (!window.confirm('确定删除这道错题？')) return;
    const res = await fetch(`/api/student/wrong-questions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchQuestions();
    } else {
      alert('删除失败');
    }
  };

  const handleMoveToNotebook = async (questionId: string, targetNotebookId: string) => {
    const res = await fetch(`/api/student/wrong-questions/${questionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notebookId: targetNotebookId }),
    });
    if (res.ok) {
      await fetchQuestions();
      setDraggingQuestionId(null);
      setDragOverNotebookId(null);
    }
  };

  const handleCreateQuestion = (defaultNotebookId?: string | null) => {
    setContextMenu(null);
    setCreateModalOpen(true);
  };

  const onQuestionCreated = () => {
    setCreateModalOpen(false);
    fetchQuestions();
    if (isMain) fetchNotebooks();
  };

  if (loading) {
    return <div className="text-gray-400 py-12 text-center">加载中...</div>;
  }

  return (
    <div
      className="space-y-6"
      onContextMenu={(e) => {
        if (isMain) {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, type: 'page' });
        }
      }}
    >
      {/* 错题本列表（仅主页） */}
      {isMain && (
        <div>
          <h2 className="text-lg font-semibold text-cyan-400 mb-3">错题本</h2>
          <div className="flex flex-wrap gap-4">
            {notebooks.map((nb) => (
              <div
                key={nb.id}
                className="relative"
                onContextMenu={(e) => handleContextMenu(e, 'notebook', nb.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggingQuestionId) setDragOverNotebookId(nb.id);
                }}
                onDragLeave={() => setDragOverNotebookId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const qid = e.dataTransfer.getData('questionId');
                  if (qid) handleMoveToNotebook(qid, nb.id);
                  setDragOverNotebookId(null);
                }}
              >
                <Link
                  href={`/student/notebook/${nb.id}`}
                  className={`block w-44 p-4 rounded-xl border-2 transition ${
                    dragOverNotebookId === nb.id
                      ? 'border-cyan-400 bg-cyan-500/20'
                      : 'border-cyan-500/40 bg-slate-800/80 hover:border-cyan-400'
                  }`}
                >
                  <div className="text-3xl mb-2">📁</div>
                  {editingNotebookId === nb.id ? (
                    <input
                      className="w-full bg-slate-700 text-white rounded px-2 py-1 text-sm"
                      value={editingNotebookName}
                      onChange={(e) => setEditingNotebookName(e.target.value)}
                      onBlur={() => handleRenameNotebook(nb.id, editingNotebookName)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameNotebook(nb.id, editingNotebookName)}
                      autoFocus
                    />
                  ) : (
                    <p
                      className="font-medium text-cyan-300 truncate"
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        setEditingNotebookId(nb.id);
                        setEditingNotebookName(nb.name);
                      }}
                    >
                      {nb.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{nb._count?.questions ?? 0} 道错题</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 未归类 / 本错题本内的错题 */}
      <div>
        <h2 className="text-lg font-semibold text-cyan-400 mb-3">
          {isMain ? '未归类错题' : '错题'}
        </h2>
        {questions.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">暂无错题，右键可创建错题</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {questions.map((q) => (
              <div
                key={q.id}
                draggable={isMain}
                onDragStart={(e) => {
                  setDraggingQuestionId(q.id);
                  e.dataTransfer.setData('questionId', q.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => setDraggingQuestionId(null)}
                onContextMenu={(e) => handleContextMenu(e, 'question', q.id)}
                onClick={() => setDetailQuestion(q)}
                className="p-4 rounded-xl border border-slate-600 bg-slate-800/80 hover:border-cyan-500/50 cursor-pointer transition"
              >
                <p className="font-medium text-white truncate">{q.name}</p>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{q.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed z-50 py-1 rounded-lg bg-slate-800 border border-slate-600 shadow-xl min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === 'page' && (
            <>
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700"
                onClick={handleCreateNotebook}
              >
                创建错题本
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700"
                onClick={() => handleCreateQuestion()}
              >
                创建错题
              </button>
            </>
          )}
          {contextMenu.type === 'notebook' && contextMenu.id && (
            <>
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700"
                onClick={() => {
                  setContextMenu(null);
                  const nb = notebooks.find((n) => n.id === contextMenu.id);
                  if (nb) {
                    setEditingNotebookId(nb.id);
                    setEditingNotebookName(nb.name);
                  }
                }}
              >
                重命名
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700"
                onClick={() => handleDeleteNotebook(contextMenu.id!)}
              >
                删除错题本
              </button>
            </>
          )}
          {contextMenu.type === 'question' && contextMenu.id && (
            <button
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700"
              onClick={() => handleDeleteQuestion(contextMenu.id!)}
            >
              删除错题
            </button>
          )}
        </div>
      )}

      {/* 错题本内页：新建错题按钮 */}
      {!isMain && (
        <button
          type="button"
          onClick={() => handleCreateQuestion()}
          className="px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition"
        >
          新建错题
        </button>
      )}

      <CreateQuestionModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSaved={onQuestionCreated}
        defaultNotebookId={notebookId || undefined}
        notebookOptions={notebooks.map((n) => ({ id: n.id, name: n.name }))}
      />

      {detailQuestion && (
        <QuestionDetailModal
          question={detailQuestion}
          onClose={() => setDetailQuestion(null)}
          onDeleted={() => {
            setDetailQuestion(null);
            fetchQuestions();
          }}
        />
      )}
    </div>
  );
}
