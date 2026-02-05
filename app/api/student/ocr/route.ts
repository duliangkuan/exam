import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { recognizeText } from '@/lib/baidu-ocr'; // 文件名保持兼容，实际已替换为 Textin

// OCR 识别接口（后端代理，保护密钥）
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { imageBase64, imageUrl } = await request.json();

    // 支持URL或base64两种方式
    if (!imageUrl && (!imageBase64 || typeof imageBase64 !== 'string')) {
      return NextResponse.json({ error: '图片数据无效，请提供 imageUrl 或 imageBase64' }, { status: 400 });
    }

    let base64Data: string | undefined;
    if (imageBase64) {
      // 移除 data:image/... 前缀（如果有）
      base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    }

    const text = await recognizeText(base64Data, imageUrl);

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      { error: error.message || 'OCR 识别失败，请重试' },
      { status: 500 }
    );
  }
}
