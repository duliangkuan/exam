import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

/** POST: body { content: string } 错题题目文本，返回最完整详细的解析（不存储） */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'AI 服务未配置' }, { status: 500 });
    }
    const { content } = await request.json();
    const questionText = typeof content === 'string' ? content.trim() : '';
    if (!questionText) {
      return NextResponse.json({ error: '请提供题目内容' }, { status: 400 });
    }
    const prompt = `你是一位专业的教师，请对下面这道题目给出最完整、最详细、最全面的解析，包括：考点分析、解题思路、步骤说明、易错点、相关知识点延伸等。不要出题，只做解析。

题目内容：
${questionText}`;
    const res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('DeepSeek analyze error', res.status, err);
      return NextResponse.json({ error: 'AI 解析请求失败' }, { status: 502 });
    }
    const data = await res.json();
    const choice = data.choices?.[0];
    const analysis = choice?.message?.content?.trim() || '暂无解析';
    return NextResponse.json({ analysis });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '解析失败' }, { status: 500 });
  }
}
