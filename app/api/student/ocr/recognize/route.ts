import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

const BAIDU_AK = process.env.BAIDU_OCR_API_KEY || '';
const BAIDU_SK = process.env.BAIDU_OCR_SECRET_KEY || '';
const TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
const OCR_URL = 'https://aip.baidubce.com/rest/2.0/ocr/v1/doc_analysis';

async function getAccessToken(): Promise<string> {
  const url = `${TOKEN_URL}?grant_type=client_credentials&client_id=${encodeURIComponent(BAIDU_AK)}&client_secret=${encodeURIComponent(BAIDU_SK)}`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Baidu token failed: ${res.status}`);
  }
  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Baidu OCR: no access_token');
  }
  return data.access_token;
}

/** POST: body { image: base64String }，返回识别文本（拼接 results[].words.word） */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.type !== 'student') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    if (!BAIDU_AK || !BAIDU_SK) {
      return NextResponse.json({ error: 'OCR 服务未配置' }, { status: 500 });
    }
    const body = await request.json();
    const imageBase64 = typeof body.image === 'string' ? body.image.replace(/^data:image\/\w+;base64,/, '') : '';
    if (!imageBase64) {
      return NextResponse.json({ error: '请提供 base64 图片' }, { status: 400 });
    }
    const token = await getAccessToken();
    const params = new URLSearchParams();
    params.set('image', imageBase64);
    params.set('line_probability', 'false');
    params.set('disp_line_poly', 'false');
    params.set('words_type', 'handprint_mix');
    params.set('layout_analysis', 'false');
    params.set('recg_long_division', 'false');
    const ocrRes = await fetch(`${OCR_URL}?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: params.toString(),
    });
    if (!ocrRes.ok) {
      const errText = await ocrRes.text();
      console.error('Baidu OCR error', ocrRes.status, errText);
      return NextResponse.json({ error: 'OCR 识别失败' }, { status: 502 });
    }
    const data = await ocrRes.json();
    const results = Array.isArray(data.results) ? data.results : [];
    const text = results
      .map((r: { words?: { word?: string } }) => r?.words?.word || '')
      .filter(Boolean)
      .join('\n');
    return NextResponse.json({ text, raw: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '识别失败' }, { status: 500 });
  }
}
