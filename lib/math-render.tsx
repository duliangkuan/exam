'use client';

import { InlineMath, BlockMath } from 'react-katex';
import React from 'react';

/**
 * 将文本中的LaTeX代码转换为可渲染的React组件
 * 支持行内公式 $...$ 和块级公式 $$...$$
 * 如果文本中没有LaTeX代码，直接返回原文本
 */
export function renderMath(text: string): (string | React.ReactElement)[] {
  if (!text || typeof text !== 'string') {
    return [text];
  }

  // 检查是否包含LaTeX公式
  const hasInlineMath = /\$[^$\n]+\$/.test(text);
  const hasBlockMath = /\$\$[\s\S]*?\$\$/.test(text);
  
  if (!hasInlineMath && !hasBlockMath) {
    // 没有LaTeX公式，直接返回原文本
    return [text];
  }

  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let key = 0;

  // 先处理块级公式 $$...$$
  const blockRegex = /\$\$([\s\S]*?)\$\$/g;
  const blockMatches: Array<{ start: number; end: number; content: string }> = [];
  let match;

  while ((match = blockRegex.exec(text)) !== null) {
    blockMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[1].trim(),
    });
  }

  // 处理行内公式 $...$（排除块级公式内的）
  const inlineRegex = /\$([^$\n]+?)\$/g;
  const allMatches: Array<{
    start: number;
    end: number;
    content: string;
    isBlock: boolean;
  }> = [];

  // 添加块级公式
  blockMatches.forEach((bm) => {
    allMatches.push({
      start: bm.start,
      end: bm.end,
      content: bm.content,
      isBlock: true,
    });
  });

  // 添加行内公式（排除在块级公式内的）
  while ((match = inlineRegex.exec(text)) !== null) {
    const isInsideBlock = blockMatches.some(
      (bm) => match.index >= bm.start && match.index < bm.end
    );
    if (!isInsideBlock) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1].trim(),
        isBlock: false,
      });
    }
  }

  // 按位置排序
  allMatches.sort((a, b) => a.start - b.start);

  // 构建结果
  allMatches.forEach((match) => {
    // 添加之前的文本
    if (match.start > lastIndex) {
      const textPart = text.substring(lastIndex, match.start);
      if (textPart) {
        parts.push(textPart);
      }
    }

    // 添加数学公式
    try {
      if (match.isBlock) {
        parts.push(<BlockMath key={key++} math={match.content} />);
      } else {
        parts.push(<InlineMath key={key++} math={match.content} />);
      }
    } catch (error) {
      // 如果LaTeX语法错误，显示原始内容
      console.warn('KaTeX render error:', error, 'Content:', match.content);
      parts.push(match.isBlock ? `$$${match.content}$$` : `$${match.content}$`);
    }

    lastIndex = match.end;
  });

  // 添加剩余文本
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(remainingText);
    }
  }

  return parts.length > 0 ? parts : [text];
}
