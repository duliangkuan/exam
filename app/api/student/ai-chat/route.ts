import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { chatWithAI } from '@/lib/deepseek';

// AI 对话（实时聊天）
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: '消息列表无效' }, { status: 400 });
    }

    // 验证消息格式
    for (const msg of messages) {
      if (!msg.role || !msg.content || !['user', 'assistant'].includes(msg.role)) {
        return NextResponse.json({ error: '消息格式无效' }, { status: 400 });
      }
    }

    const reply = await chatWithAI(messages);

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('AI chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'AI 对话失败，请重试' },
      { status: 500 }
    );
  }
}
