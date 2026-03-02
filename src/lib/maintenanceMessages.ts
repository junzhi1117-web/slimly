/**
 * 維持期 contextual messages
 * 觸發邏輯：距離 maintenanceStartDate 的天數
 * 語氣：溫暖陪伴，不說教，強調習慣而非意志力
 */

export interface MaintenanceMessage {
  id: string
  title: string
  body: string
  expandedBody: string   // 展開後的完整內文（衛教用）
  emoji: string
  minDay: number         // 停藥後第幾天起顯示
  maxDay?: number        // 停藥後第幾天後不再顯示（undefined = 長期顯示）
}

export const MAINTENANCE_MESSAGES: MaintenanceMessage[] = [
  {
    id: 'first_week',
    emoji: '🌱',
    title: '剛開始維持期，這幾天最重要',
    body: '停藥後第一週，身體正在重新適應。食慾可能慢慢恢復，這很正常。',
    expandedBody:
      'GLP-1 藥物的抑制食慾效果會在停藥後幾天到幾週內逐漸消退。這個階段，' +
      '最重要的不是減少熱量，而是維持穩定的飲食節奏——固定的用餐時間、' +
      '足夠的蛋白質攝取，能幫助你更自然地感受飢餓與飽足。繼續記錄體重，' +
      '掌握自己的變化趨勢。',
    minDay: 0,
    maxDay: 7,
  },
  {
    id: 'appetite_returns',
    emoji: '🍽️',
    title: '食慾回來了？這很正常',
    body: '停藥兩週後食慾有所恢復，是身體自然的反應，不是你的意志力問題。',
    expandedBody:
      '研究顯示，GLP-1 藥物停用後，食慾通常在 2-4 週內回到用藥前的水準。' +
      '這不代表失敗，而是身體在恢復正常運作。這段時間，試著用蛋白質豐富的' +
      '食物（雞胸肉、豆腐、雞蛋）來增加飽足感，避免空腹時間太長。',
    minDay: 7,
    maxDay: 28,
  },
  {
    id: 'weight_check',
    emoji: '⚖️',
    title: '維持期第一個月，定期量體重最重要',
    body: '每週量一次體重，能幫助你早點發現趨勢，而不是等到變化很大才察覺。',
    expandedBody:
      '維持期體重管理的關鍵在於「早期發現，早期調整」。' +
      '研究建議每週在固定時間量體重（例如每週一早晨起床後），' +
      '若連續兩週上升超過 1 kg，可以考慮回診與醫師討論調整策略。' +
      '不需要完美，需要的是持續觀察。',
    minDay: 28,
    maxDay: 90,
  },
  {
    id: 'habit_matters',
    emoji: '🥗',
    title: '習慣比意志力更持久',
    body: '維持體重靠的不是每天努力抵抗食慾，而是建立讓健康更容易的生活習慣。',
    expandedBody:
      '長期體重維持研究一致指出，成功的關鍵是「降低決策難度」：' +
      '讓健康選擇成為預設選項，而不是每次都要努力抵抗誘惑。' +
      '一些有效的小技巧：提前備好高蛋白食物、吃飯時先吃蔬菜和蛋白質、' +
      '規律的睡眠時間（睡眠不足會增加食慾荷爾蒙）。',
    minDay: 30,
    maxDay: 180,
  },
  {
    id: 'long_term',
    emoji: '🌿',
    title: '你已經維持了兩個月以上，很了不起',
    body: '能撐過停藥後最難的第一個月，說明你建立了真正的改變。',
    expandedBody:
      '停藥後維持體重的最大挑戰通常在前三個月。你已經度過了最困難的適應期。' +
      '如果未來有需要，與醫師討論是否需要回診或調整治療計畫，都是好的選擇。' +
      '纖記會繼續陪著你記錄，不管你的旅程走到哪個階段。',
    minDay: 60,
  },
]

/** 根據停藥天數取最適合的維持期訊息 */
export function getMaintenanceMessage(maintenanceStartDate: string): MaintenanceMessage | null {
  const days = Math.floor(
    (Date.now() - new Date(maintenanceStartDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  // 優先取 minDay ≤ days < maxDay 的訊息，從最晚的開始（更 specific 優先）
  const candidates = MAINTENANCE_MESSAGES
    .filter(m => m.minDay <= days && (m.maxDay === undefined || days < m.maxDay))
    .sort((a, b) => b.minDay - a.minDay)
  return candidates[0] ?? null
}
