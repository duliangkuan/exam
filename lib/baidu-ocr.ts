// 百度智能云 OCR 集成

const BAIDU_API_KEY = process.env.BAIDU_API_KEY || 'TZSRc9whjXNzBw5xYF1MB1b1';
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY || '576cpz1lE3xCSGZoDSjpZnTvsKbmyun0';
const TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
const OCR_URL = 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic';

interface TokenCache {
  access_token: string;
  expires_at: number; // 过期时间戳（毫秒）
}

// 内存缓存 access_token（有效期30天，提前1天刷新）
let tokenCache: TokenCache | null = null;

/**
 * 获取 access_token（带缓存）
 */
async function getAccessToken(): Promise<string> {
  // 如果缓存有效，直接返回
  if (tokenCache && Date.now() < tokenCache.expires_at) {
    return tokenCache.access_token;
  }

  // 获取新 token
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: BAIDU_API_KEY,
    client_secret: BAIDU_SECRET_KEY,
  });

  const response = await fetch(`${TOKEN_URL}?${params.toString()}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Baidu token request failed:', response.status, errorText);
    let errorMsg = '获取百度 OCR token 失败';
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error_description) {
        errorMsg = `获取百度 OCR token 失败: ${errorData.error_description}`;
      } else if (errorData.error) {
        errorMsg = `获取百度 OCR token 失败: ${errorData.error}`;
      }
    } catch {
      // 如果无法解析JSON，使用原始错误文本
      if (errorText) {
        errorMsg = `获取百度 OCR token 失败: ${errorText}`;
      }
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  if (data.error_code) {
    console.error('Baidu token error:', data);
    throw new Error(data.error_msg || '获取百度 OCR token 失败');
  }
  if (!data.access_token) {
    throw new Error('百度 OCR token 响应格式错误：缺少 access_token');
  }

  // 缓存 token（30天有效期，提前1天刷新，即29天后过期）
  const expiresIn = (data.expires_in || 2592000) * 1000; // 默认30天转毫秒
  tokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + expiresIn - 24 * 60 * 60 * 1000, // 提前1天
  };

  return data.access_token;
}

/**
 * OCR 识别图片文本
 * @param imageBase64 图片的 base64 编码（不含 data:image/... 前缀）
 */
export async function recognizeText(imageBase64: string): Promise<string> {
  try {
    const accessToken = await getAccessToken();

    const params = new URLSearchParams({
      image: imageBase64,
      detect_direction: 'false',
      paragraph: 'false',
      probability: 'false',
      multidirectional_recognize: 'false',
    });

    const response = await fetch(`${OCR_URL}?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Baidu OCR request failed:', response.status, errorText);
      throw new Error('OCR 识别失败，请重试');
    }

    const data = await response.json();

    if (data.error_code) {
      console.error('Baidu OCR error:', data);
      throw new Error(data.error_msg || 'OCR 识别失败');
    }

    // 提取文本（words_result 数组）
    if (!data.words_result || !Array.isArray(data.words_result)) {
      throw new Error('OCR 返回格式错误');
    }

    // 合并所有识别出的文本行
    const text = data.words_result
      .map((item: { words: string }) => item.words)
      .join('\n');

    return text;
  } catch (error: any) {
    console.error('Baidu OCR error:', error);
    throw new Error(error.message || 'OCR 识别失败，请重试');
  }
}
