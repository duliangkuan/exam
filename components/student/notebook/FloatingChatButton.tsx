'use client';

import { useState, useRef, useEffect } from 'react';

const DEFAULT_POS = { x: 24, y: 200 };
const STORAGE_KEY = 'notebook-chat-pos';

export default function FloatingChatButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState(DEFAULT_POS);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const didDragRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (typeof p.x === 'number' && typeof p.y === 'number') setPos(p);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const save = () => {
      setPos((p) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
        } catch {}
        return p;
      });
    };
    window.addEventListener('pointerup', save);
    return () => window.removeEventListener('pointerup', save);
  }, [dragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    didDragRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) didDragRef.current = true;
      setPos({
        x: Math.max(0, dragStartRef.current.posX + dx),
        y: Math.max(0, dragStartRef.current.posY + dy),
      });
    };
    const up = () => setDragging(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [dragging]);

  const handleClick = () => {
    if (didDragRef.current) return;
    setOpen(true);
  };

  const handleSend = async () => {
    const text = message.trim();
    if (!text || loading) return;
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/student/notebook/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply = data.reply || data.error || '暂无回复';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '请求失败' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages]);

  return (
    <>
      <div
        ref={containerRef}
        className="fixed z-40"
        style={{ left: pos.x, top: pos.y }}
      >
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          className="w-14 h-14 rounded-full bg-cyan-600 hover:bg-cyan-500 shadow-lg flex items-center justify-center text-2xl select-none"
          title="长按拖动，单击打开对话"
        >
          💬
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="glass-effect rounded-2xl w-full max-w-md h-[480px] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-3 border-b border-slate-600">
              <span className="font-medium text-cyan-400">实时 AI 对话</span>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-gray-500 text-sm">输入消息与 AI 对话，历史不保存。</p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
                    m.role === 'user' ? 'bg-cyan-600/30 ml-8' : 'bg-slate-700 mr-8'
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {loading && <p className="text-cyan-400 text-sm">正在回复...</p>}
            </div>
            <div className="p-3 border-t border-slate-600 flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="输入消息..."
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading}
                className="px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 disabled:opacity-50"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
