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
  selectedPath: Record<string, any>
): Promise<Question[]> {
  const prompt = `你是一位专业的专升本考试出题专家。现在需要你为${subject}科目出题。

知识点信息：
${JSON.stringify(selectedPath, null, 2)}

请严格按照以下要求出题：
1. 出10道单选题
2. 每道题必须包含：
   - 题目内容
   - A、B、C、D四个选项
   - 正确答案（A/B/C/D中的一个）
   - 详细解析

3. 题目难度适中，符合专升本考试水平
4. 题目必须与所选知识点紧密相关

请以以下JSON格式返回，只返回JSON，不要其他内容：
{
  "questions": [
    {
      "id": 1,
      "question": "题目内容",
      "options": {
        "A": "选项A",
        "B": "选项B",
        "C": "选项C",
        "D": "选项D"
      },
      "correctAnswer": "A",
      "explanation": "详细解析内容"
    }
  ]
}`;

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
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in API response');
    }

    // 尝试提取JSON
    let jsonContent = content.trim();
    
    // 如果返回的内容包含markdown代码块，提取JSON部分
    if (jsonContent.includes('```')) {
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }
    }

    const parsed = JSON.parse(jsonContent) as QuestionsResponse;
    
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length !== 10) {
      throw new Error('Invalid questions format or count');
    }

    return parsed.questions;
  } catch (error) {
    console.error('Deepseek API error:', error);
    throw new Error('生成题目失败，请重试');
  }
}
