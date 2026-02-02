'use client';

import React from 'react';
import { renderMath } from './math-render';

/** 将 **强调内容** 渲染为加粗，用于英语题中的“划线部分”等 */
export function renderBold(text: string): (string | React.ReactElement)[] {
  if (!text || typeof text !== 'string') return [text];
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
