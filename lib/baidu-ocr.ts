// Textin 智能文档解析 OCR 集成

const TEXTIN_APP_ID = process.env.TEXTIN_APP_ID || '0e5b56a003c7a2bd613302180ad60de0';
const TEXTIN_SECRET_CODE = process.env.TEXTIN_SECRET_CODE || '7b823a7b278fe8df1a1a45e63e23d68f';
const TEXTIN_API_URL = 'https://api.textin.com/ai/service/v1/pdf_to_markdown';

/**
 * 将 base64 字符串转换为 Uint8Array（二进制，兼容 Node.js 和 Edge Runtime）
 */
function base64ToUint8Array(base64: string): Uint8Array {
  // 在 Node.js 环境中可以使用 Buffer，但为了兼容 Edge Runtime，使用通用方法
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64');
  }
  // Edge Runtime 环境：手动解码 base64
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * OCR 识别图片文本（使用 Textin 文档解析 API）
 * @param imageBase64 图片的 base64 编码（不含 data:image/... 前缀）
 * @param imageUrl 图片的 URL（可选，如果提供则优先使用URL）
 */
export async function recognizeText(
  imageBase64?: string,
  imageUrl?: string
): Promise<string> {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams({
      parse_mode: 'scan', // 图片识别模式
      raw_ocr: '1', // 返回原始 OCR 文本
      get_image: 'none', // 不需要图片
      dpi: '144', // 默认 DPI
      markdown_details: '0', // 不需要 markdown 详细信息
      page_details: '1', // 保留页面信息
      apply_document_tree: '0', // 不需要标题层级
    });

    let body: BodyInit;
    let contentType: string;

    // 优先使用 URL，否则使用 base64 转二进制
    if (imageUrl) {
      // 方式二：使用 URL
      body = imageUrl;
      contentType = 'text/plain';
    } else if (imageBase64) {
      // 方式一：使用二进制流
      body = base64ToUint8Array(imageBase64) as BodyInit;
      contentType = 'application/octet-stream';
    } else {
      throw new Error('必须提供图片URL或base64数据');
    }

    const response = await fetch(`${TEXTIN_API_URL}?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'x-ti-app-id': TEXTIN_APP_ID,
        'x-ti-secret-code': TEXTIN_SECRET_CODE,
        'Content-Type': contentType,
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Textin OCR request failed:', response.status, errorText);
      
      // 尝试解析错误信息
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          throw new Error(`OCR 识别失败: ${errorData.message}`);
        }
      } catch {
        // 如果无法解析 JSON，使用原始错误文本
      }
      
      // 根据状态码提供更具体的错误信息
      if (response.status === 401) {
        throw new Error('OCR 认证失败，请检查 API Key 配置');
      } else if (response.status === 403) {
        throw new Error('OCR 请求被拒绝，可能是文件格式或大小不符合要求');
      } else if (response.status === 400) {
        throw new Error('OCR 请求参数错误');
      }
      
      throw new Error('OCR 识别失败，请重试');
    }

    const data = await response.json();

    // 检查响应状态码
    if (data.code !== 200) {
      console.error('Textin OCR error:', data);
      const errorMsg = data.message || 'OCR 识别失败';
      
      // 根据错误码提供更具体的错误信息
      if (data.code === 40101 || data.code === 40102) {
        throw new Error('OCR API Key 无效，请检查配置');
      } else if (data.code === 40103) {
        throw new Error('OCR IP 不在白名单，请联系管理员');
      } else if (data.code === 40003) {
        throw new Error('OCR 余额不足，请充值后使用');
      } else if (data.code === 40301) {
        throw new Error('图片类型不支持');
      } else if (data.code === 40302) {
        throw new Error('文件大小超过限制（最大 500M）');
      } else if (data.code === 40303) {
        throw new Error(`文件类型不支持: ${errorMsg}`);
      } else if (data.code === 40304) {
        throw new Error('图片尺寸不符合要求');
      }
      
      throw new Error(errorMsg);
    }

    // 提取文本
    if (!data.result) {
      throw new Error('OCR 返回格式错误：缺少 result 字段');
    }

    const result = data.result;
    let text = '';

    // 优先从 raw_ocr 提取（原始 OCR 文本）
    if (result.pages && Array.isArray(result.pages)) {
      const rawTexts: string[] = [];
      
      for (const page of result.pages) {
        // 从 raw_ocr 提取
        if (page.raw_ocr && Array.isArray(page.raw_ocr)) {
          for (const ocrItem of page.raw_ocr) {
            if (ocrItem.text) {
              rawTexts.push(ocrItem.text);
            }
          }
        }
        
        // 如果没有 raw_ocr，从 content 提取
        if (rawTexts.length === 0 && page.content && Array.isArray(page.content)) {
          for (const contentItem of page.content) {
            if (contentItem.text) {
              rawTexts.push(contentItem.text);
            }
          }
        }
      }
      
      if (rawTexts.length > 0) {
        text = rawTexts.join('\n');
      }
    }

    // 如果没有从 pages 提取到文本，尝试从 markdown 提取（去除 markdown 格式标记）
    if (!text && result.markdown) {
      // 简单去除 markdown 格式标记
      text = result.markdown
        .replace(/^#+\s+/gm, '') // 去除标题标记
        .replace(/\*\*(.*?)\*\*/g, '$1') // 去除粗体
        .replace(/\*(.*?)\*/g, '$1') // 去除斜体
        .replace(/`(.*?)`/g, '$1') // 去除代码标记
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 去除链接
        .replace(/^\s*[-*+]\s+/gm, '') // 去除列表标记
        .replace(/^\s*\d+\.\s+/gm, '') // 去除有序列表标记
        .trim();
    }

    if (!text) {
      throw new Error('OCR 未能识别到文本内容');
    }

    return text;
  } catch (error: any) {
    console.error('Textin OCR error:', error);
    throw new Error(error.message || 'OCR 识别失败，请重试');
  }
}
