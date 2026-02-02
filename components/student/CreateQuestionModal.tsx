'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wrongBookId?: string | null;
  onSuccess?: () => void;
}

export default function CreateQuestionModal({
  isOpen,
  onClose,
  wrongBookId,
  onSuccess,
}: CreateQuestionModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'upload' | 'manual' | 'ocr-result' | 'saved'>('select');
  const [savedQuestionId, setSavedQuestionId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [manualText, setManualText] = useState('');
  const [questionName, setQuestionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setMode('upload');
    }
  };

  const handleOCR = async () => {
    if (!imagePreview) return;
    setLoading(true);
    setError('');
    try {
      // 提取 base64（去掉 data:image/... 前缀）
      const base64 = imagePreview.split(',')[1];
      const res = await fetch('/api/student/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      if (res.ok) {
        const data = await res.json();
        setOcrText(data.text);
        setMode('ocr-result');
      } else {
        const data = await res.json();
        setError(data.error || 'OCR 识别失败，请重试');
      }
    } catch (err: any) {
      setError(err.message || 'OCR 识别失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const content = mode === 'ocr-result' ? ocrText : manualText;
    if (!content.trim()) {
      setError('题目内容不能为空');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/student/wrong-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: questionName.trim() || '未命名错题',
          content: content.trim(),
          wrongBookId: wrongBookId || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedQuestionId(data.id);
        setMode('saved');
        if (onSuccess) onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || '保存失败');
      }
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMode('select');
    setImageFile(null);
    setImagePreview(null);
    setOcrText('');
    setManualText('');
    setQuestionName('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">创建错题</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {mode === 'select' && (
          <div className="space-y-4">
            <p className="text-gray-400 mb-4">请选择创建方式：</p>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => handleImageSelect(e as any);
                input.click();
              }}
              className="w-full px-6 py-4 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-lg font-bold"
            >
              上传错题图片
            </button>
            <button
              onClick={() => setMode('manual')}
              className="w-full px-6 py-4 bg-green-600 rounded-lg hover:bg-green-700 transition text-lg font-bold"
            >
              手动编辑题目文本
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition text-sm"
            >
              取消
            </button>
          </div>
        )}

        {mode === 'upload' && (
          <div className="space-y-4">
            {imagePreview && (
              <div className="mb-4">
                <img src={imagePreview} alt="预览" className="max-w-full h-auto rounded-lg" />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleOCR}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '识别中...' : '下一步（OCR识别）'}
              </button>
              <button
                onClick={() => setMode('select')}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                返回
              </button>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        )}

        {mode === 'ocr-result' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">题目名称（知识点）：</label>
              <input
                type="text"
                value={questionName}
                onChange={(e) => setQuestionName(e.target.value)}
                placeholder="例如：二次函数"
                className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">识别结果（可编辑）：</label>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                rows={10}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '保存中...' : '确认保存'}
              </button>
              <button
                onClick={() => setMode('upload')}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                返回
              </button>
            </div>
          </div>
        )}

        {mode === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">题目名称（知识点）：</label>
              <input
                type="text"
                value={questionName}
                onChange={(e) => setQuestionName(e.target.value)}
                placeholder="例如：二次函数"
                className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">题目文本：</label>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                rows={10}
                placeholder="请输入题目内容..."
                className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => setMode('select')}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                返回
              </button>
            </div>
          </div>
        )}

        {mode === 'saved' && (
          <div className="space-y-4">
            <p className="text-green-400 font-bold text-center py-4">错题已保存！</p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (savedQuestionId) {
                    router.push(`/student/notebook/question/${savedQuestionId}?action=analyze`);
                  } else {
                    handleReset();
                    onClose();
                  }
                }}
                className="flex-1 px-6 py-4 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-lg font-bold"
              >
                AI分析
              </button>
              <button
                onClick={() => {
                  if (savedQuestionId) {
                    router.push(`/student/notebook/question/${savedQuestionId}?action=similar`);
                  } else {
                    handleReset();
                    onClose();
                  }
                }}
                className="flex-1 px-6 py-4 bg-green-600 rounded-lg hover:bg-green-700 transition text-lg font-bold"
              >
                举一反三
              </button>
            </div>
            <button
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-sm"
            >
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
