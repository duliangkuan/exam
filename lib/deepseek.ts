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

${subject === '高等数学' || subject === 'math' ? `【数学公式书写规范（必须遵守）】
题目、选项、解析中出现的所有数学表达式都必须用行内 LaTeX 包裹：$...$
- 下标：写成 $a_n$、$a_1$、$a_{n+1}$，不要写裸露的 a_n、a_1。
- 极限：写成 $\\\\lim_{n\\\\to\\\\infty}$ 或 $\\\\lim_{n\\\\rightarrow\\\\infty}$，不要写 lim_{n→∞}。
- 根号：写成 $\\\\sqrt{2+a_n}$、$\\\\sqrt{x}$，让被开方内容在根号内。
- 分数：写成 $\\\\frac{1}{2}$、$\\\\frac{a}{b}$。
- 其它：指数 $x^2$、求和 $\\\\sum$、积分 $\\\\int$ 等一律用 $...$ 包裹。
这样前端才能正确渲染，学生才能看懂。凡有数学符号的地方都必须用 $...$ 包住。` : subject === '大学英语' || subject === 'english' ? `【英语题目书写规范（必须遵守）】
- 英语题目、选项、解析中的普通英语单词和句子直接书写，不要使用 LaTeX 语法（如 $...$ 或 $\\text{...}$）
- 如果需要强调某个单词或短语，使用双星号包裹：**beautiful**（前端会自动加粗显示）
- 示例：正确写法 "She is a **beautiful** singer."，错误写法 "She is a $\\text{beautiful}$ singer."
- 只有真正的数学表达式（如分数、根号等）才使用 LaTeX，英语题目中通常不会有数学表达式` : `【题目书写规范】
- 题目、选项、解析中的内容直接书写，保持清晰易读
- 如需强调，使用双星号包裹：**强调内容**`}

【重要：输出格式要求】
1. 必须恰好出10道单选题，不多不少。
2. 题目、选项、解析中的文字不要包含未转义的换行或引号；数学部分严格按上面规范用 $...$ 书写，避免破坏 JSON（反斜杠写 \\\\）。
3. **每道题必须包含explanation字段（题目解析），这是JSON的一部分，必须输出**
4. **严禁在JSON之外输出任何思考过程、计算步骤、重新计算、尝试或分析说明**
5. **严禁输出任何markdown代码块标记（如\`\`\`json或\`\`\`）**
6. **严禁输出任何前置或后置文字、说明或注释**
7. **只输出一个纯JSON对象，直接以 { 开头、以 } 结尾，中间不要有任何其他内容**
8. 确保JSON格式完全正确，所有字符串都用双引号包裹，所有逗号和括号都正确匹配。

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

现在直接输出上述格式的JSON，共10道题。不要任何其他内容。`;

  const apiKey = process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY;
  // 移除超时限制，允许数学题目生成花费更长时间

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的出题助手。严格按照用户要求输出JSON格式的题目，不要输出任何思考过程、计算步骤或解释说明。只输出纯JSON对象。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 8000,
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
      throw new Error('API未返回内容，请重试');
    }

    // 记录完整内容用于调试
    console.log('API返回内容长度:', content.length);
    console.log('API返回内容预览:', content.substring(0, 500));

    let jsonContent = content.trim();
    
    // 移除markdown代码块标记
    if (jsonContent.includes('```')) {
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      } else {
        // 如果没有匹配到完整的代码块，尝试移除```标记
        jsonContent = jsonContent.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
      }
    }

    // 移除思考过程：查找并移除包含常见思考关键词的段落
    // 这些关键词通常出现在思考过程中：重新计算、可能、但是、不过、如果、考虑、尝试等
    const thinkingPatterns = [
      /重新计算[^]*?\{/g,
      /可能[^]*?\{/g,
      /但是[^]*?\{/g,
      /不过[^]*?\{/g,
      /如果[^]*?\{/g,
      /考虑[^]*?\{/g,
      /尝试[^]*?\{/g,
      /计算[^]*?\{/g,
      /分析[^]*?\{/g,
      /作为[^]*?\{/g,
    ];
    
    // 找到第一个{的位置
    const firstBrace = jsonContent.indexOf('{');
    if (firstBrace > 0) {
      // 移除第一个{之前的所有内容（包括思考过程）
      jsonContent = jsonContent.substring(firstBrace);
    }

    // 找到最后一个}的位置
    let lastBrace = jsonContent.lastIndexOf('}');
    if (lastBrace >= 0 && lastBrace < jsonContent.length - 1) {
      // 移除最后一个}之后的所有内容
      jsonContent = jsonContent.substring(0, lastBrace + 1);
    }
    
    // 如果仍然包含多个JSON对象，尝试提取最大的那个（通常是完整的）
    const braceMatches = Array.from(jsonContent.matchAll(/\{/g));
    if (braceMatches.length > 1) {
      // 找到最外层JSON对象的结束位置
      let depth = 0;
      let startIdx = -1;
      let endIdx = -1;
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < jsonContent.length; i++) {
        const c = jsonContent[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (c === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (c === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (inString) continue;
        
        if (c === '{') {
          if (depth === 0) startIdx = i;
          depth++;
        } else if (c === '}') {
          depth--;
          if (depth === 0 && startIdx >= 0) {
            endIdx = i;
            break;
          }
        }
      }
      
      if (startIdx >= 0 && endIdx > startIdx) {
        jsonContent = jsonContent.substring(startIdx, endIdx + 1);
      }
    }

    /**
     * 增强的 JSON 解析函数，带详细错误信息
     */
    function tryParse(raw: string, attempt: number = 0): QuestionsResponse | null {
      try {
        const parsed = JSON.parse(raw) as QuestionsResponse;
        if (attempt > 0) {
          console.log(`JSON解析成功（尝试${attempt + 1}）`);
        }
        return parsed;
      } catch (e: any) {
        if (attempt === 0) {
          // 只在第一次尝试时记录错误
          console.log('JSON解析尝试失败:', e.message?.substring(0, 150));
        }
        return null;
      }
    }

    /**
     * 修复常见的 JSON 格式问题
     */
    function fixJSONCommonIssues(text: string): string {
      let fixed = text;
      
      // 1. 修复尾随逗号
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
      
      // 2. 修复单引号（替换为双引号，但要小心处理字符串内的引号）
      // 只在对象键和字符串值中使用
      fixed = fixed.replace(/'/g, '"');
      
      // 3. 修复未转义的控制字符（在字符串值中）
      fixed = fixed.replace(/([^\\])\n/g, '$1\\n');
      fixed = fixed.replace(/([^\\])\r/g, '$1\\r');
      fixed = fixed.replace(/([^\\])\t/g, '$1\\t');
      
      // 4. 修复未转义的引号（在字符串值中，但要小心）
      // 这个比较复杂，暂时跳过，避免破坏正确的 JSON
      
      // 5. 移除 BOM 标记
      if (fixed.charCodeAt(0) === 0xFEFF) {
        fixed = fixed.slice(1);
      }
      
      return fixed;
    }

    /**
     * 智能提取 JSON 对象
     */
    function extractJSONObject(text: string): string | null {
      const firstBrace = text.indexOf('{');
      if (firstBrace < 0) return null;
      
      let depth = 0;
      let inString = false;
      let escapeNext = false;
      let startIdx = firstBrace;
      let endIdx = -1;
      
      for (let i = firstBrace; i < text.length; i++) {
        const c = text[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (c === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (c === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (inString) continue;
        
        if (c === '{') {
          if (depth === 0) startIdx = i;
          depth++;
        } else if (c === '}') {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }
      
      if (endIdx > startIdx) {
        return text.slice(startIdx, endIdx + 1);
      }
      
      return null;
    }

    // 尝试1: 直接解析
    let parsed: QuestionsResponse | null = tryParse(jsonContent, 0);
    
    // 尝试2: 修复常见的 JSON 格式问题后解析
    if (!parsed) {
      const fixed = fixJSONCommonIssues(jsonContent);
      parsed = tryParse(fixed, 1);
      if (parsed) jsonContent = fixed;
    }

    // 尝试3: 提取第一个完整的 JSON 对象后解析
    if (!parsed) {
      const extracted = extractJSONObject(jsonContent);
      if (extracted) {
        parsed = tryParse(extracted, 2);
        if (parsed) jsonContent = extracted;
      }
    }

    // 尝试4: 提取 JSON 对象后再次修复格式问题
    if (!parsed) {
      const extracted = extractJSONObject(jsonContent);
      if (extracted) {
        const fixed = fixJSONCommonIssues(extracted);
        parsed = tryParse(fixed, 3);
        if (parsed) jsonContent = fixed;
      }
    }

    // 尝试5: 尝试修复可能的转义问题
    if (!parsed) {
      // 尝试修复双反斜杠（可能是转义问题）
      let fixed = jsonContent.replace(/\\\\/g, '\\');
      // 但保留已转义的引号
      fixed = fixed.replace(/\\"/g, '"');
      parsed = tryParse(fixed, 4);
      if (parsed) jsonContent = fixed;
    }

    // 如果仍然失败，进行详细诊断
    if (!parsed) {
      // 记录详细诊断信息
      const diagnostics = {
        originalLength: content.length,
        processedLength: jsonContent.length,
        hasOpeningBrace: jsonContent.includes('{'),
        hasClosingBrace: jsonContent.includes('}'),
        hasQuestionsField: jsonContent.includes('questions'),
        braceCount: (jsonContent.match(/\{/g) || []).length,
        firstBraceIndex: jsonContent.indexOf('{'),
        lastBraceIndex: jsonContent.lastIndexOf('}'),
        preview: jsonContent.substring(0, 200),
        endPreview: jsonContent.substring(Math.max(0, jsonContent.length - 200)),
      };
      
      console.error('JSON解析失败 - 诊断信息:', JSON.stringify(diagnostics, null, 2));
      console.error('JSON解析失败 - 完整处理后内容:', jsonContent);
      
      // 尝试最后一次解析以获取具体错误信息
      try {
        JSON.parse(jsonContent);
      } catch (parseError: any) {
        console.error('JSON解析具体错误:', parseError.message);
        console.error('错误位置:', parseError.message.match(/position (\d+)/)?.[1]);
      }
      
      // 提供更有用的错误信息
      let errorHint = '返回内容格式不正确';
      if (!jsonContent.includes('{')) {
        errorHint = '返回内容中未找到JSON对象，可能是AI返回了非JSON格式的内容';
      } else if (!jsonContent.includes('}')) {
        errorHint = 'JSON对象不完整，缺少结束括号';
      } else if (diagnostics.braceCount === 0) {
        errorHint = '未找到有效的JSON对象结构';
      } else if (!jsonContent.includes('questions')) {
        errorHint = '返回内容中未找到questions字段，JSON结构可能不正确';
      } else if (jsonContent.length < 100) {
        errorHint = '返回内容过短，可能不完整或被截断';
      } else if (diagnostics.firstBraceIndex > 100) {
        errorHint = 'JSON对象位置过远，可能包含大量前置文本';
      } else if (diagnostics.lastBraceIndex < jsonContent.length - 100) {
        errorHint = 'JSON对象可能不完整，包含后续文本';
      }
      
      throw new Error(`JSON解析失败：${errorHint}。请重试，如问题持续存在请联系管理员。`);
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

/**
 * AI 分析错题（返回详细解析）
 */
export async function analyzeWrongQuestion(questionText: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY;
  const prompt = `你是一位专业的专升本考试辅导老师。请对以下题目进行最完整、最详细、最全面的解析。

题目：
${questionText}

要求：
1. 解析要完整、详细、全面，帮助学生彻底理解这道题。
2. 如果题目涉及数学公式，请用 LaTeX 格式（$...$ 包裹）书写，例如：$x^2$、$\\frac{a}{b}$、$\\sqrt{x}$、$\\lim_{n\\to\\infty}$ 等。
3. 解析应包括：题目考查的知识点、解题思路、详细步骤、易错点提醒等。
4. 直接返回解析内容，不要额外的说明或格式标记。`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI analysis API failed:', response.status, errorText);
      throw new Error('AI 分析失败，请稍后重试');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('未获取到解析内容');

    return content;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('AI 分析超时（约 90 秒），请重试');
    }
    console.error('AI analysis error:', error);
    throw new Error(error.message || 'AI 分析失败，请重试');
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 举一反三（生成3道同类型单选题）
 */
export async function generateSimilarQuestions(questionText: string): Promise<Question[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY;
  const prompt = `你是专升本考试出题专家。请根据以下题目，出3道同类型、类似的单选题，并提供每道题的正确答案和详细解析。

原题：
${questionText}

【重要：输出格式要求】
1. 必须恰好出3道单选题，不多不少。
2. 题目类型、难度、考查知识点要与原题类似。
3. 每道题必须包含4个选项（A、B、C、D），且只有一个正确答案。
4. 如果涉及数学公式，必须用 LaTeX 格式（$...$ 包裹），例如：$x^2$、$\\frac{a}{b}$、$\\sqrt{x}$、$\\lim_{n\\to\\infty}$ 等。
5. **每道题必须包含explanation字段（题目解析），这是JSON的一部分，必须输出**
6. **严禁在JSON之外输出任何思考过程、计算步骤、重新计算、尝试或分析说明**
7. **严禁输出任何markdown代码块标记（如\`\`\`json或\`\`\`）**
8. **严禁输出任何前置或后置文字、说明或注释**
9. **只输出一个纯JSON对象，直接以 { 开头、以 } 结尾，中间不要有任何其他内容**

格式：
{
  "questions": [
    {
      "id": 1,
      "question": "题目内容（数学用 $...$ 包裹）",
      "options": { "A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D" },
      "correctAnswer": "A",
      "explanation": "解析内容（公式同样用$...$）"
    },
    {
      "id": 2,
      ...
    },
    {
      "id": 3,
      ...
    }
  ]
}

现在直接输出上述格式的JSON，共3道题。不要任何其他内容。`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的出题助手。严格按照用户要求输出JSON格式的题目，不要输出任何思考过程、计算步骤或解释说明。只输出纯JSON对象。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Similar questions API failed:', response.status, errorText);
      throw new Error('生成举一反三题目失败，请稍后重试');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('未获取到题目内容');

    let jsonContent = content.trim();
    
    // 移除markdown代码块标记
    if (jsonContent.includes('```')) {
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      } else {
        jsonContent = jsonContent.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
      }
    }

    // 移除可能的前置说明文字（找到第一个{之前的内容）
    const firstBrace = jsonContent.indexOf('{');
    if (firstBrace > 0) {
      jsonContent = jsonContent.substring(firstBrace);
    }

    // 移除可能的后续说明文字（找到最后一个}之后的内容）
    let lastBrace = jsonContent.lastIndexOf('}');
    if (lastBrace >= 0 && lastBrace < jsonContent.length - 1) {
      jsonContent = jsonContent.substring(0, lastBrace + 1);
    }
    
    // 如果包含多个JSON对象，提取最大的那个
    const braceMatches = Array.from(jsonContent.matchAll(/\{/g));
    if (braceMatches.length > 1) {
      let depth = 0;
      let startIdx = -1;
      let endIdx = -1;
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < jsonContent.length; i++) {
        const c = jsonContent[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (c === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (c === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (inString) continue;
        
        if (c === '{') {
          if (depth === 0) startIdx = i;
          depth++;
        } else if (c === '}') {
          depth--;
          if (depth === 0 && startIdx >= 0) {
            endIdx = i;
            break;
          }
        }
      }
      
      if (startIdx >= 0 && endIdx > startIdx) {
        jsonContent = jsonContent.substring(startIdx, endIdx + 1);
      }
    }

    /**
     * 增强的 JSON 解析函数（用于举一反三）
     */
    function tryParseSimilar(raw: string, attempt: number = 0): QuestionsResponse | null {
      try {
        const parsed = JSON.parse(raw) as QuestionsResponse;
        if (attempt > 0) {
          console.log(`JSON解析成功（举一反三，尝试${attempt + 1}）`);
        }
        return parsed;
      } catch (e: any) {
        if (attempt === 0) {
          console.log('JSON解析尝试失败（举一反三）:', e.message?.substring(0, 150));
        }
        return null;
      }
    }

    /**
     * 修复常见的 JSON 格式问题
     */
    function fixJSONCommonIssuesSimilar(text: string): string {
      let fixed = text;
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
      if (fixed.charCodeAt(0) === 0xFEFF) {
        fixed = fixed.slice(1);
      }
      return fixed;
    }

    /**
     * 智能提取 JSON 对象（用于举一反三）
     */
    function extractJSONObjectSimilar(text: string): string | null {
      const firstBrace = text.indexOf('{');
      if (firstBrace < 0) return null;
      
      let depth = 0;
      let inString = false;
      let escapeNext = false;
      let startIdx = firstBrace;
      let endIdx = -1;
      
      for (let i = firstBrace; i < text.length; i++) {
        const c = text[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (c === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (c === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (inString) continue;
        
        if (c === '{') {
          if (depth === 0) startIdx = i;
          depth++;
        } else if (c === '}') {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }
      
      if (endIdx > startIdx) {
        return text.slice(startIdx, endIdx + 1);
      }
      
      return null;
    }

    // 尝试1: 直接解析
    let parsed: QuestionsResponse | null = tryParseSimilar(jsonContent, 0);
    
    // 尝试2: 修复常见的 JSON 格式问题后解析
    if (!parsed) {
      const fixed = fixJSONCommonIssuesSimilar(jsonContent);
      parsed = tryParseSimilar(fixed, 1);
      if (parsed) jsonContent = fixed;
    }

    // 尝试3: 提取第一个完整的 JSON 对象后解析
    if (!parsed) {
      const extracted = extractJSONObjectSimilar(jsonContent);
      if (extracted) {
        parsed = tryParseSimilar(extracted, 2);
        if (parsed) jsonContent = extracted;
      }
    }

    // 尝试4: 提取 JSON 对象后再次修复格式问题
    if (!parsed) {
      const extracted = extractJSONObjectSimilar(jsonContent);
      if (extracted) {
        const fixed = fixJSONCommonIssuesSimilar(extracted);
        parsed = tryParseSimilar(fixed, 3);
        if (parsed) jsonContent = fixed;
      }
    }

    // 如果仍然失败，记录详细错误信息
    if (!parsed) {
      console.error('JSON解析失败（举一反三） - 处理后内容:', jsonContent);
      console.error('JSON解析失败（举一反三） - 内容长度:', jsonContent.length);
      
      let errorHint = '返回内容格式不正确';
      if (!jsonContent.includes('{')) {
        errorHint = '返回内容中未找到JSON对象';
      } else if (!jsonContent.includes('questions')) {
        errorHint = '返回内容中未找到questions字段';
      } else if (jsonContent.length < 50) {
        errorHint = '返回内容过短，可能不完整';
      }
      
      throw new Error(`JSON解析失败：${errorHint}。请重试。`);
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('题目格式不正确');
    }

    let list = parsed.questions;
    if (list.length < 3) {
      throw new Error(`生成的题目数量不足（${list.length}道），请重试`);
    }
    if (list.length > 3) {
      list = list.slice(0, 3);
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
    if (error?.name === 'AbortError') {
      throw new Error('生成举一反三题目超时（约 90 秒），请重试');
    }
    console.error('Similar questions error:', error);
    throw new Error(error.message || '生成举一反三题目失败，请重试');
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * AI 对话（实时聊天）
 */
export async function chatWithAI(messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI chat API failed:', response.status, errorText);
      throw new Error('AI 对话失败，请稍后重试');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('未获取到回复内容');

    return content;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('AI 对话超时（约 90 秒），请重试');
    }
    console.error('AI chat error:', error);
    throw new Error(error.message || 'AI 对话失败，请重试');
  } finally {
    clearTimeout(timeoutId);
  }
}
