const DEEPSEEK_API_KEY = 'sk-7586d9f6564d40328f886b8f0b0fef1c';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export interface Question {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface QuestionsResponse {
  questions: Question[];
}

export async function generateQuestions(
  subject: string,
  sectionPayload: { 节: string; 知识点: string[] }
): Promise<Question[]> {
  const { 节: sectionName, 知识点: knowledgePoints } = sectionPayload;
  const prompt = `你是专升本考试出题专家。为「${subject}」出题。

范围：节「${sectionName}」。知识点列表：
${JSON.stringify(knowledgePoints, null, 2)}

【数学公式书写规范（必须遵守）】
题目、选项、解析中出现的所有数学表达式都必须用行内 LaTeX 包裹：$...$
- 下标：写成 $a_n$、$a_1$、$a_{n+1}$，不要写裸露的 a_n、a_1。
- 极限：写成 $\\\\lim_{n\\\\to\\\\infty}$ 或 $\\\\lim_{n\\\\rightarrow\\\\infty}$，不要写 lim_{n→∞}。
- 根号：写成 $\\\\sqrt{2+a_n}$、$\\\\sqrt{x}$，让被开方内容在根号内。
- 分数：写成 $\\\\frac{1}{2}$、$\\\\frac{a}{b}$。
- 其它：指数 $x^2$、求和 $\\\\sum$、积分 $\\\\int$ 等一律用 $...$ 包裹。
这样前端才能正确渲染，学生才能看懂。凡有数学符号的地方都必须用 $...$ 包住。

硬性要求：
1. 必须恰好出10道单选题，不多不少。
2. 题目、选项、解析中的文字不要包含未转义的换行或引号；数学部分严格按上面规范用 $...$ 书写，避免破坏 JSON（反斜杠写 \\\\）。
3. 只返回一个JSON对象，不要任何说明、不要markdown代码块，直接以 { 开头、以 } 结尾。

每题结构（严格按此字段名）：
{
  "questions": [
    {
      "id": 1,
      "question": "题目内容（数学用 $...$ 包裹，如：设数列{$a_n$}满足$a_1=1$，$a_{n+1}=\\\\sqrt{2+a_n}$，则$\\\\lim_{n\\\\to\\\\infty}a_n=$()",
      "options": { "A": "选项A（含公式时用$...$）", "B": "选项B", "C": "选项C", "D": "选项D" },
      "correctAnswer": "A",
      "explanation": "解析内容（公式同样用$...$）"
    }
  ]
}

请直接输出上述格式的JSON，共10道题。`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 5000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API request failed:', response.status, response.statusText, errorText);
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('No content in API response:', JSON.stringify(data, null, 2));
      throw new Error('No content in API response');
    }

    let jsonContent = content.trim();
    if (jsonContent.includes('```')) {
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) jsonContent = jsonMatch[1].trim();
    }

    function tryParse(raw: string): QuestionsResponse | null {
      try {
        return JSON.parse(raw) as QuestionsResponse;
      } catch {
        return null;
      }
    }

    let parsed: QuestionsResponse | null = tryParse(jsonContent);
    if (!parsed) {
      jsonContent = jsonContent.replace(/,(\s*[}\]])/g, '$1');
      parsed = tryParse(jsonContent);
    }
    if (!parsed) {
      const firstBrace = jsonContent.indexOf('{');
      if (firstBrace >= 0) {
        let depth = 0;
        let end = -1;
        for (let i = firstBrace; i < jsonContent.length; i++) {
          const c = jsonContent[i];
          if (c === '"' && jsonContent[i - 1] !== '\\') {
            const close = jsonContent.indexOf('"', i + 1);
            if (close === -1) break;
            i = close;
            continue;
          }
          if (c === '{') depth++;
          if (c === '}') {
            depth--;
            if (depth === 0) {
              end = i;
              break;
            }
          }
        }
        if (end > firstBrace) {
          parsed = tryParse(jsonContent.slice(firstBrace, end + 1));
        }
      }
    }
    if (!parsed) {
      console.error('Raw content preview:', content.substring(0, 500));
      throw new Error('JSON解析失败，返回内容格式不正确');
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('题目格式不正确');
    }

    let list = parsed.questions;
    if (list.length < 10) {
      throw new Error(`生成的题目数量不足（${list.length}道），请重试`);
    }
    if (list.length > 10) {
      list = list.slice(0, 10);
    }

    const normalized = list.map((q, i) => ({
      id: i + 1,
      question: String(q?.question ?? '').trim(),
      options: {
        A: String(q?.options?.A ?? '').trim(),
        B: String(q?.options?.B ?? '').trim(),
        C: String(q?.options?.C ?? '').trim(),
        D: String(q?.options?.D ?? '').trim(),
      },
      correctAnswer: (['A', 'B', 'C', 'D'].includes(String(q?.correctAnswer ?? '')) ? q.correctAnswer : 'A') as 'A' | 'B' | 'C' | 'D',
      explanation: String(q?.explanation ?? '').trim(),
    }));

    return normalized;
  } catch (error: any) {
    console.error('Deepseek API error:', error);
    console.error('Error stack:', error.stack);
    // 提供更详细的错误信息
    const errorMessage = error.message || '生成题目失败，请重试';
    throw new Error(errorMessage);
  }
}

export interface LearningSuggestions {
  weakPoints: string;
  learningMethods: string;
}

export async function generateLearningSuggestions(summary: {
  subject: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  wrongQuestionTexts: string[];
  selectedPathSummary?: string;
}): Promise<LearningSuggestions> {
  const apiKey = process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY;
  const prompt = `你是一位专业的专升本学习顾问。请根据以下测评报告摘要，生成针对性的学习建议。

【测评摘要】
- 科目：${summary.subject}
- 得分：${summary.score} 分（满分 100）
- 答题总数：${summary.totalQuestions} 道，答对 ${summary.correctCount} 道，答错 ${summary.wrongCount} 道
${summary.selectedPathSummary ? `- 测评范围：${summary.selectedPathSummary}` : ''}
${summary.wrongQuestionTexts.length > 0 ? `- 错题题干摘要（供分析薄弱点）：\n${summary.wrongQuestionTexts.slice(0, 15).map((t, i) => `${i + 1}. ${t.slice(0, 120)}${t.length > 120 ? '…' : ''}`).join('\n')}` : ''}

请以 JSON 格式返回，且只返回 JSON，不要其他内容。格式如下：
{
  "weakPoints": "针对本次测评分析的薄弱知识点说明，分条或分段写，2～5 条即可",
  "learningMethods": "针对上述薄弱点的学习方法与复习建议，分条或分段写，2～5 条即可，具体可操作"
}`;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Learning suggestions API failed:', response.status, errText);
    throw new Error('生成学习建议失败，请稍后重试');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('未获取到学习建议内容');

  let jsonStr = content;
  if (jsonStr.includes('```')) {
    const m = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (m) jsonStr = m[1];
  }
  const parsed = JSON.parse(jsonStr) as LearningSuggestions;
  if (typeof parsed.weakPoints !== 'string' || typeof parsed.learningMethods !== 'string') {
    throw new Error('学习建议格式不正确');
  }
  return parsed;
}
