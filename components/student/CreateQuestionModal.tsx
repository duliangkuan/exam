'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { renderMath } from '@/lib/math-render';

/**
 * 预处理 OCR 文本，将纯 LaTeX 代码转换为可渲染格式
 * 检测包含 LaTeX 命令的文本块，自动添加 $ 包裹
 */
function preprocessLaTeX(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  // 如果已经包含 $ 符号，直接返回
  if (text.includes('$')) return text;
  
  // 检测常见的 LaTeX 命令
  const latexCommandPattern = /\\(?:lim|frac|sqrt|sum|int|prod|alpha|beta|gamma|delta|Delta|pi|theta|sin|cos|tan|log|ln|exp|rightarrow|leftarrow|geq|leq|neq|approx|equiv|prime|cdot|times|div|pm|mp|ldots|cdots|vdots|ddots|vec|hat|bar|tilde|dot|ddot|text|mathrm|mathbf|mathit|partial|nabla|infty|emptyset|in|notin|subset|supset|cup|cap)\b/;
  
  // 检测是否包含 LaTeX 命令
  if (!latexCommandPattern.test(text) && !/[_{}\\]/.test(text)) {
    return text; // 没有数学内容，直接返回
  }
  
  // 按行处理，识别并包裹数学表达式
  const lines = text.split('\n');
  const processedLines: string[] = [];
  let mathBlock: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      // 空行：处理之前的数学块
      if (mathBlock.length > 0) {
        const mathText = mathBlock.join(' ').trim();
        if (mathText) {
          processedLines.push(`$$${mathText}$$`);
        }
        mathBlock = [];
      }
      processedLines.push('');
      continue;
    }
    
    // 检测是否包含 LaTeX 命令
    const hasLatex = latexCommandPattern.test(trimmed);
    const latexCount = (trimmed.match(/\\[a-zA-Z]+\b/g) || []).length;
    const hasSubSup = /[_{}]/.test(trimmed);
    const mathSymbolCount = (trimmed.match(/\\[a-zA-Z]+\b|_[{}]|\^{}/g) || []).length;
    const mathDensity = mathSymbolCount / Math.max(trimmed.length, 1);
    
    // 判断是否为数学表达式行
    // 条件：包含 LaTeX 命令，或者有下标/上标且数学符号数量 > 2
    const isMathLine = hasLatex || (hasSubSup && mathSymbolCount > 2);
    
    // 判断是否为纯文本行（主要是中文，几乎没有数学符号）
    const chineseCount = (trimmed.match(/[\u4e00-\u9fa5]/g) || []).length;
    const chineseRatio = chineseCount / Math.max(trimmed.length, 1);
    const isPureText = chineseRatio > 0.7 && mathSymbolCount < 2;
    
    if (isMathLine && !isPureText) {
      // 数学表达式行，加入数学块
      mathBlock.push(trimmed);
    } else {
      // 文本行：先处理之前的数学块
      if (mathBlock.length > 0) {
        const mathText = mathBlock.join(' ').trim();
        if (mathText) {
          processedLines.push(`$$${mathText}$$`);
        }
        mathBlock = [];
      }
      
      // 如果这行包含数学符号，尝试识别内联公式
      if (hasSubSup && !isPureText && mathSymbolCount > 1) {
        processedLines.push(`$${trimmed}$`);
      } else {
        processedLines.push(trimmed);
      }
    }
  }
  
  // 处理最后的数学块
  if (mathBlock.length > 0) {
    const mathText = mathBlock.join(' ').trim();
    if (mathText) {
      processedLines.push(`$$${mathText}$$`);
    }
  }
  
  const result = processedLines.join('\n');
  
  // 如果处理后仍然没有 $ 符号，但包含 LaTeX 命令，强制添加
  if (!result.includes('$') && latexCommandPattern.test(result)) {
    return `$$${result.trim()}$$`;
  }
  
  return result;
}

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wrongBookId?: string | null;
  subject?: string | null; // 学科：'chinese' | 'english' | 'math' | 'computer'
  onSuccess?: () => void;
}

export default function CreateQuestionModal({
  isOpen,
  onClose,
  wrongBookId,
  subject,
  onSuccess,
}: CreateQuestionModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'upload' | 'crop' | 'manual' | 'ocr-result' | 'saved'>('select');
  const [savedQuestionId, setSavedQuestionId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [croppedImagePreview, setCroppedImagePreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [manualText, setManualText] = useState('');
  const [questionName, setQuestionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const editableRef = useRef<HTMLDivElement>(null);
  const hiddenTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  
  // 图片裁剪相关状态
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
        setCroppedImagePreview(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
      };
      reader.readAsDataURL(file);
      setMode('upload');
    }
  };

  // 初始化裁剪区域（默认全图，不限制比例）
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // 默认选择整张图片，用户可以自由调整
    setCrop({
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
  }, []);

  // 将裁剪后的图片转换为 base64
  const getCroppedImg = useCallback(async (): Promise<string | null> => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return null;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * scaleX * pixelRatio;
    canvas.height = crop.height * scaleY * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(blob);
        },
        'image/png',
        1
      );
    });
  }, [completedCrop]);

  // 确认裁剪
  const handleCropConfirm = async () => {
    const croppedImage = await getCroppedImg();
    if (croppedImage) {
      setCroppedImagePreview(croppedImage);
      setMode('crop');
    }
  };

  // 跳过裁剪，直接使用原图
  const handleSkipCrop = () => {
    setCroppedImagePreview(imagePreview);
    setMode('crop');
  };

  const handleOCR = async () => {
    // 使用裁剪后的图片，如果没有裁剪则使用原图
    const imageToUse = croppedImagePreview || imagePreview;
    if (!imageToUse) return;
    setLoading(true);
    setError('');
    try {
      // 提取 base64（去掉 data:image/... 前缀）
      const base64 = imageToUse.split(',')[1];
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
        // 检查响应类型，避免解析非 JSON 响应
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await res.json();
            setError(data.error || 'OCR 识别失败，请重试');
          } catch (e) {
            setError(`OCR 识别失败 (${res.status}): ${res.statusText}`);
          }
        } else {
          const text = await res.text();
          console.error('OCR API 返回非 JSON 响应:', text.substring(0, 200));
          setError(`OCR 识别失败 (${res.status}): 服务器错误`);
        }
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
          subject: subject || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedQuestionId(data.id);
        setMode('saved');
        if (onSuccess) onSuccess();
      } else {
        // 检查响应类型，避免解析非 JSON 响应
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await res.json();
            setError(data.error || '保存失败');
          } catch (e) {
            setError(`保存失败 (${res.status}): ${res.statusText}`);
          }
        } else {
          const text = await res.text();
          console.error('API 返回非 JSON 响应:', text.substring(0, 200));
          setError(`保存失败 (${res.status}): 服务器错误`);
        }
      }
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 同步 textarea 和显示区域的高度和滚动位置
  useEffect(() => {
    if (hiddenTextareaRef.current && editableRef.current) {
      // 同步高度
      const height = Math.max(300, hiddenTextareaRef.current.scrollHeight);
      hiddenTextareaRef.current.style.height = `${height}px`;
      editableRef.current.style.minHeight = `${height}px`;
      
      // 同步滚动位置
      const syncScroll = () => {
        if (hiddenTextareaRef.current && editableRef.current) {
          editableRef.current.scrollTop = hiddenTextareaRef.current.scrollTop;
        }
      };
      
      hiddenTextareaRef.current.addEventListener('scroll', syncScroll);
      return () => {
        hiddenTextareaRef.current?.removeEventListener('scroll', syncScroll);
      };
    }
  }, [ocrText]);

  const handleReset = () => {
    setMode('select');
    setImageFile(null);
    setImagePreview(null);
    setCroppedImagePreview(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
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
                <div className="mb-2 text-sm text-gray-400">拖动选择要识别的区域（可选）</div>
                <div className="relative max-w-full overflow-auto bg-gray-900 rounded-lg p-4">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={undefined}
                    minWidth={20}
                    minHeight={20}
                  >
                    <img
                      ref={imgRef}
                      src={imagePreview}
                      alt="预览"
                      onLoad={onImageLoad}
                      className="max-w-full h-auto"
                      style={{ maxHeight: '60vh' }}
                    />
                  </ReactCrop>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}
            <div className="flex gap-2">
              {crop && completedCrop && (
                <button
                  onClick={handleCropConfirm}
                  className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
                >
                  确认裁剪
                </button>
              )}
              <button
                onClick={handleSkipCrop}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
              >
                {crop && completedCrop ? '跳过裁剪' : '下一步'}
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

        {mode === 'crop' && (
          <div className="space-y-4">
            <div className="mb-2 text-sm text-gray-400">裁剪后的图片预览</div>
            {croppedImagePreview && (
              <div className="mb-4">
                <img src={croppedImagePreview} alt="裁剪预览" className="max-w-full h-auto rounded-lg" />
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
                onClick={() => setMode('upload')}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                返回重新裁剪
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
              <div className="relative bg-gray-700 rounded-lg border border-gray-600 hover:border-blue-500 focus-within:border-blue-400 min-h-[300px] max-h-[400px] overflow-hidden">
                {/* 显示区域，始终显示渲染后的数学公式 */}
                <div
                  ref={editableRef}
                  className="w-full px-4 py-2 min-h-[300px] max-h-[400px] overflow-y-auto text-white [&_.katex]:text-white [&_.katex-display]:my-4 [&_.katex-display]:text-white [&_.katex-display]:text-center [&_.katex-display]:overflow-x-auto"
                  style={{ 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {ocrText ? (
                    <div>
                      {(() => {
                        const processed = preprocessLaTeX(ocrText);
                        let finalText = processed;
                        if (!processed.includes('$') && /\\[a-zA-Z]+\b|_[{}]|\^{}/.test(processed)) {
                          finalText = `$$${processed.trim()}$$`;
                        }
                        const rendered = renderMath(finalText);
                        return rendered.map((part, index) => (
                          <React.Fragment key={index}>{part}</React.Fragment>
                        ));
                      })()}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">输入 LaTeX 代码，将自动渲染为数学公式...</div>
                  )}
                </div>
                {/* 透明的 textarea 用于实际编辑，覆盖在显示区域上 */}
                <textarea
                  ref={hiddenTextareaRef}
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  className="absolute inset-0 w-full h-full px-4 py-2 bg-transparent text-transparent caret-white resize-none border-0 outline-none font-mono text-sm z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style]:none [scrollbar-width]:none"
                  style={{ 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflow: 'auto'
                  }}
                  placeholder=""
                  rows={15}
                />
              </div>
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
                onClick={() => setMode('crop')}
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
