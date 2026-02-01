import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

/** POST: body { content: string } 原题文本，返回 3 道同类型选择题（四选一）+ 每道解析。不存储。 */
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
    const prompt = `请根据下面这道题目，举一反三，出 3 道同类型、同难度的单选题（四选一）。要求：
1. 每题结构严格为 JSON：question、options（A/B/C/D）、correctAnswer（A/B/C/D 之一）、explanation（解析）。
2. 数学公式用 $...$ 包裹，如 $x^2$、$\\\\frac{1}{2}$。
3. 只返回一个 JSON 对象，不要 markdown 代码块，不要其他说明。

原题：
${questionText}

请直接输出如下格式的 JSON（共 3 道题）：
{"questions":[{"id":1,"question":"题目1","options":{"A":"A选项","B":"B选项","C":"C选项","D":"D选项"},"correctAnswer":"A","explanation":"解析1"},{"id":2,...},{"id":3,...}]}`;
    const res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 4000,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('DeepSeek similar error', res.status, err);
      return NextResponse.json({ error: '举一反三请求失败' }, { status: 502 });
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || '';
    let parsed: { questions?: Array<{ id: number; question: string; options: { A: string; B: string; C: string; D: string }; correctAnswer: 'A' | 'B' | 'C' | 'D'; explanation: string }> };
    try {
      const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: '举一反三返回格式异常' }, { status: 502 });
    }
    const questions = Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [];
    return NextResponse.json({ questions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '举一反三失败' }, { status: 500 });
  }
}
