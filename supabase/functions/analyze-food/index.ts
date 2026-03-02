// Supabase Edge Function: analyze-food
// 用 Gemini 2.5 Pro Vision 分析食物圖片，回傳四項營養資訊
// 部署：supabase functions deploy analyze-food
// 環境變數：GEMINI_API_KEY（在 Supabase Dashboard > Edge Functions > Secrets 設定）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_MODEL = 'gemini-2.5-pro'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANALYSIS_PROMPT = `你是一位專業的台灣營養師，請分析這張食物圖片。

請識別圖片中所有可見的食物，用繁體中文命名，估算份量和營養成分。
如果是台灣常見食物（便當、麵食、小吃等），請使用在地化的份量描述。

⚠️ 只回傳 JSON，不要有任何其他文字或 markdown。

格式：
{
  "foods": [
    {
      "name": "食物名稱（繁體中文）",
      "portion": "份量描述（例如：1份、約150g、1碗）",
      "calories": 整數,
      "protein": 小數（g）,
      "carbs": 小數（g）,
      "fat": 小數（g）
    }
  ],
  "totalCalories": 整數,
  "totalProtein": 小數,
  "totalCarbs": 小數,
  "totalFat": 小數,
  "confidence": "high" | "medium" | "low",
  "note": "任何需要補充的說明（可選填，例如：圖片模糊、無法精確估算）"
}`

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
            { text: ANALYSIS_PROMPT },
          ],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,   // 低溫度：確保穩定的 JSON 輸出
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('Gemini API error:', errText)
      return new Response(
        JSON.stringify({ error: 'Gemini API error', detail: errText }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const geminiData = await geminiRes.json()
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: 'No response from Gemini' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Gemini 設定了 responseMimeType: 'application/json'，應直接可解析
    const result = JSON.parse(rawText)

    return new Response(
      JSON.stringify(result),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
