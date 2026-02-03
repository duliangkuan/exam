'use client';

import React from 'react';
import { renderMath } from './math-render';

/** 
 * 清理英语文本中的 LaTeX 标记（如 $\text{...}$），提取纯文本
 * 用于修复 AI 错误生成的 LaTeX 语法
 */
function cleanLaTeXFromText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  // 清理 $\text{...}$ 格式，提取其中的文本
  text = text.replace(/\$\\text\{([^}]+)\}\$/g, '$1');
  
  // 清理其他可能的 LaTeX 文本格式变体
  text = text.replace(/\$\{([^}]+)\}\$/g, '$1');
  
  // 清理单独的 $...$ 如果里面是纯文本（不包含数学符号）
  text = text.replace(/\$([^$]+?)\$/g, (match, content) => {
    // 如果内容包含数学符号（如 ^, _, {, }, \frac, \sqrt 等），保留原样
    if (/[\^_\\{}]/.test(content)) {
      return match;
    }
    // 否则提取纯文本
    return content;
  });
  
  return text;
}

/** 将 **强调内容** 渲染为加粗，用于英语题中的"划线部分"等 */
export function renderBold(text: string): (string | React.ReactElement)[] {
  if (!text || typeof text !== 'string') return [text];
  
  // 先清理 LaTeX 标记，避免显示乱码
  text = cleanLaTeXFromText(text);
  
  const parts: (string | React.ReactElement)[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push(text.slice(lastIndex, m.index));
    }
    parts.push(<strong key={key++}>{m[1]}</strong>);
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
}

interface TextRenderProps {
  text: string;
}

/**
 * 文本渲染组件，支持数学公式和加粗文本
 * 先处理数学公式，再处理加粗文本
 */
export function TextRender({ text }: TextRenderProps) {
  if (!text || typeof text !== 'string') {
    return <>{text}</>;
  }

  // 先处理数学公式
  const mathParts = renderMath(text);
  
  // 对每个部分处理加粗
  const result: (string | React.ReactElement)[] = [];
  let key = 0;

  mathParts.forEach((part) => {
    if (typeof part === 'string') {
      // 如果是字符串，处理加粗
      const boldParts = renderBold(part);
      boldParts.forEach((boldPart) => {
        if (typeof boldPart === 'string') {
          result.push(boldPart);
        } else {
          result.push(React.cloneElement(boldPart, { key: key++ }));
        }
      });
    } else {
      // 如果是React元素（数学公式），直接添加
      result.push(React.cloneElement(part, { key: key++ }));
    }
  });

  return <>{result}</>;
}
