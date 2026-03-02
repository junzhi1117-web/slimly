import { supabase } from './supabase'
import type { AiFoodAnalysis } from '../types'

// 壓縮圖片至 1MB 以下（節省 API 費用 + 加速傳輸）
async function compressImage(file: File, maxSizeMB = 1): Promise<{ base64: string; mimeType: string }> {
  const maxBytes = maxSizeMB * 1024 * 1024

  // 如果已經夠小，直接轉 base64
  if (file.size <= maxBytes) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve({ base64, mimeType: file.type || 'image/jpeg' })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 需要壓縮
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      // 等比縮小
      const scale = Math.sqrt(maxBytes / file.size)
      width = Math.round(width * scale)
      height = Math.round(height * scale)

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return }
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            const base64 = result.split(',')[1]
            resolve({ base64, mimeType: 'image/jpeg' })
          }
          reader.onerror = reject
          reader.readAsDataURL(blob)
        },
        'image/jpeg',
        0.85
      )

      URL.revokeObjectURL(url)
    }

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

// 呼叫 Supabase Edge Function 分析食物圖片
export async function analyzeFood(file: File): Promise<AiFoodAnalysis> {
  const { base64, mimeType } = await compressImage(file)

  const { data, error } = await supabase.functions.invoke('analyze-food', {
    body: { imageBase64: base64, mimeType },
  })

  if (error) throw new Error(error.message || 'AI 分析失敗，請稍後再試')
  if (!data?.foods) throw new Error('AI 回傳格式錯誤')

  return data as AiFoodAnalysis
}
