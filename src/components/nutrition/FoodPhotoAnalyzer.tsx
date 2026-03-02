// 拍照 + AI 分析流程
import React, { useRef, useState } from 'react'
import { Camera, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { analyzeFood } from '../../lib/foodAnalysis'
import type { AiFoodAnalysis } from '../../types'

interface FoodPhotoAnalyzerProps {
  onResult: (analysis: AiFoodAnalysis) => void
  onError?: (msg: string) => void
}

type Status = 'idle' | 'analyzing' | 'done' | 'error'

const LOADING_MESSAGES = [
  'AI 正在辨識食物...',
  '計算營養成分中...',
  '整理份量資訊...',
  '快好了...',
]

export const FoodPhotoAnalyzer: React.FC<FoodPhotoAnalyzerProps> = ({ onResult, onError }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 顯示預覽
    setPreview(URL.createObjectURL(file))
    setStatus('analyzing')
    setLoadingMsgIdx(0)

    // 輪播 loading 訊息
    const interval = setInterval(() => {
      setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length)
    }, 1800)

    try {
      const result = await analyzeFood(file)
      clearInterval(interval)
      setStatus('done')
      onResult(result)
    } catch (err) {
      clearInterval(interval)
      const msg = err instanceof Error ? err.message : 'AI 分析失敗，請稍後再試'
      setErrorMsg(msg)
      setStatus('error')
      onError?.(msg)
    } finally {
      // 重置 input，讓用戶可以重新選同一張圖
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"   // 預設開後鏡頭
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 拍照按鈕 */}
      {status === 'idle' && (
        <Button
          fullWidth
          variant="secondary"
          className="h-16 gap-3 text-base"
          onClick={() => inputRef.current?.click()}
        >
          <Camera size={24} />
          拍照辨識食物
        </Button>
      )}

      {/* 分析中 */}
      {status === 'analyzing' && (
        <Card className="p-4">
          {preview && (
            <div className="relative mb-3 rounded-2xl overflow-hidden">
              <img src={preview} alt="食物圖片" className="w-full h-40 object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Loader2 size={32} className="text-white animate-spin" />
              </div>
            </div>
          )}
          <p className="text-center text-sm text-[var(--color-muted)] animate-pulse">
            {LOADING_MESSAGES[loadingMsgIdx]}
          </p>
        </Card>
      )}

      {/* 分析完成提示 */}
      {status === 'done' && (
        <div className="flex items-center gap-2 text-sm text-[var(--color-sage)] px-1">
          <CheckCircle2 size={16} />
          分析完成，請確認下方結果
        </div>
      )}

      {/* 錯誤 */}
      {status === 'error' && (
        <Card className="p-4 border-[var(--color-rose)]/30">
          <div className="flex gap-3 items-start">
            <AlertCircle size={18} className="text-[var(--color-rose)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-[var(--color-deep)]">{errorMsg}</p>
              <button
                className="text-xs text-[var(--color-sage)] mt-2 underline"
                onClick={() => { setStatus('idle'); setPreview(null) }}
              >
                重新拍照
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
