'use client';

import { useState, useRef, useEffect } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultNotebookId?: string;
  notebookOptions: { id: string; name: string }[];
};

export default function CreateQuestionModal({
  open,
  onClose,
  onSaved,
  defaultNotebookId,
  notebookOptions,
}: Props) {
  const [step, setStep] = useState<'choose' | 'upload' | 'ocr-edit' | 'manual-edit' | 'saved'>('choose');
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [notebookId, setNotebookId] = useState<string | null>(defaultNotebookId ?? null);
  const [imageBase64, setImageBase64] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setNotebookId(defaultNotebookId ?? null);
  }, [open, defaultNotebookId]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('图片请小于 4MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setImageBase64(base64);
      setStep('ocr-edit');
      setOcrLoading(true);
      fetch('/api/student/ocr/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.text) setContent(data.text);
        })
        .catch(() => alert('OCR 识别失败'))
        .finally(() => setOcrLoading(false));
    };
    reader.readAsDataURL(file);
  };

  const handleManual = () => {
    setStep('manual-edit');
    setContent('');
  };

  const handleSave = async () => {
    const nameTrim = name.trim() || '未命名错题';
    const contentTrim = content.trim();
    if (!contentTrim) {
      alert('请填写题目内容');
      return;
    }
    setSaveLoading(true);
    try {
      const res = await fetch('/api/student/wrong-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameTrim,
          content: contentTrim,
          notebookId: notebookId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '保存失败');
      }
      setStep('saved');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleClose = () => {
    setStep('choose');
    setName('');
    setContent('');
    setImageBase64('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="glass-effect rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-blue-400">
            {step === 'choose' && '新建错题'}
            {step === 'upload' && '上传错题图片'}
            {(step === 'ocr-edit' || step === 'manual-edit') && '编辑题目'}
            {step === 'saved' && '已保存'}
          </h3>
          <button type="button" onClick={handleClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {step === 'choose' && (
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 p-6 rounded-xl border-2 border-cyan-500/50 bg-slate-800 hover:border-cyan-400"
            >
              <div className="text-4xl mb-2">📷</div>
              <p className="font-medium">上传错题图片</p>
              <p className="text-sm text-gray-400 mt-1">通过 OCR 识别题目（JPG/PNG/BMP，≤4MB）</p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/bmp"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={handleManual}
              className="flex-1 p-6 rounded-xl border-2 border-cyan-500/50 bg-slate-800 hover:border-cyan-400"
            >
              <div className="text-4xl mb-2">✏️</div>
              <p className="font-medium">手动编辑题目</p>
              <p className="text-sm text-gray-400 mt-1">直接输入题目文本</p>
            </button>
          </div>
        )}

        {(step === 'ocr-edit' || step === 'manual-edit') && (
          <>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">错题名称（建议：主要知识点）</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="未命名错题"
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">题目内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white resize-y"
                placeholder="题目文本..."
              />
            </div>
            {notebookOptions.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">所属错题本（可选）</label>
                <select
                  value={notebookId ?? ''}
                  onChange={(e) => setNotebookId(e.target.value || null)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                >
                  <option value="">不归类</option>
                  {notebookOptions.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>
            )}
            {ocrLoading ? (
              <p className="text-cyan-400">正在识别...</p>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="px-6 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 disabled:opacity-50"
                >
                  {saveLoading ? '保存中...' : '确认保存'}
                </button>
                <button type="button" onClick={handleClose} className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500">
                  取消
                </button>
              </div>
            )}
          </>
        )}

        {step === 'saved' && (
          <div className="space-y-4">
            <p className="text-gray-300">错题已保存。</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('choose');
                  setName('');
                  setContent('');
                  onSaved();
                }}
                className="px-6 py-3 bg-cyan-600 rounded-lg hover:bg-cyan-500"
              >
                继续新建
              </button>
              <button type="button" onClick={handleClose} className="px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-500">
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
