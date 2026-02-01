'use client';

import React from 'react';

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
