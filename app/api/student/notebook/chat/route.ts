import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

/** POST: body { message: string } 用户发送的消息，返回 AI 回复。不存储历史。 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'AI 服务未配置' }, { status: 500 });
    }
    const { message } = await request.json();
    const text = typeof message === 'string' ? message.trim() : '';
    if (!text) {
      return NextResponse.json({ error: '请输入内容' }, { status: 400 });
    }
    const res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个友善的学习助手，回答简洁清晰。' },
          { role: 'user', content: text },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('DeepSeek chat error', res.status, err);
      return NextResponse.json({ error: '对话请求失败' }, { status: 502 });
    }
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '暂无回复';
    return NextResponse.json({ reply });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '对话失败' }, { status: 500 });
  }
}
