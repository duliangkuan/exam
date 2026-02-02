import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { recognizeText } from '@/lib/baidu-ocr';

// OCR 识别接口（后端代理，保护密钥）
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { imageBase64 } = await request.json();

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: '图片数据无效' }, { status: 400 });
    }

    // 移除 data:image/... 前缀（如果有）
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const text = await recognizeText(base64Data);

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      { error: error.message || 'OCR 识别失败，请重试' },
      { status: 500 }
    );
  }
}
