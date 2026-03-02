// 情境化時間線訊息
// 醫學審核完成（2026-03-02）：內容由俊智（家醫科住院醫師）確認
// 資料來源：Ubie Health (2026), Cleveland Clinic (2025), NewBeauty (2025),
//           STEP-10, SURMOUNT-4, Lancet eClinicalMedicine (2025)

export interface TimelineMessage {
  id: string
  title: string
  body: string           // 主文（支援 \n\n 換段）
  safetyNote: string     // 安全提醒（較小字顯示）
  trigger: TimelineTrigger
  applicableMeds?: string[]  // undefined = 三藥共用
}

export type TimelineTrigger =
  | { type: 'week_range'; minWeek: number; maxWeek?: number }
  | { type: 'after_dose_increase' }
  | { type: 'weight_plateau'; minWeeks: number }

export const TIMELINE_MESSAGES: TimelineMessage[] = [
  {
    id: 'first_injection',
    title: '你打了第一針 🎉',
    body: '前幾週身體正在慢慢認識這個藥物，食慾變化也不一定立刻出現，這很正常。\n\n每週固定時間注射，把每次的感受記錄下來，慢慢就能看出自己的規律。',
    safetyNote: '如果出現持續嚴重的肚子痛，請聯繫你的醫師。',
    trigger: { type: 'week_range', minWeek: 0, maxWeek: 1 }
  },
  {
    id: 'dose_increase',
    title: '劑量剛調高了',
    body: '身體需要時間適應新的劑量，腸胃道通常是第一個感受到的地方。不舒服感通常在調升後 2–5 天最明顯，多數人在 1–2 週內就會明顯好轉。\n\n這幾天可以少量多餐、吃清淡一點、多喝水，讓這段適應期好過一些。',
    safetyNote: '如果出現很嚴重的肚子痛、或一直吐停不下來，請聯繫你的醫師。',
    trigger: { type: 'after_dose_increase' }
  },
  {
    id: 'weight_plateau',
    title: '體重好像停下來了？',
    body: '這是用藥過程中非常常見的現象，不要擔心。身體在快速減重後會自動調整，讓下降速度暫時變慢，這種短暫停滯通常持續 3–8 週，之後多數人會繼續下降。\n\n不需要因此焦慮。檢查一下最近的蛋白質是否吃夠、睡眠有沒有不規律，這些都可能影響體重變化。',
    safetyNote: '如果停滯超過 2–3 個月都沒有任何改變，可以和你的醫師討論下一步。',
    trigger: { type: 'weight_plateau', minWeeks: 3 }
  },
  {
    id: 'hair_loss_warning',
    title: '最近掉髮有變多嗎？',
    body: '大約 4 個人裡有 1 個用藥者會有這個狀況，你不孤單。\n\n原因是快速減重讓身體感受到壓力，毛囊暫時進入休息狀態，通常在用藥 2–4 個月後才開始明顯，和藥物本身直接傷害毛囊無關。\n\n這個情況一般是暫時的。最有根據的做法是確保每天蛋白質攝取充足，同時避免過度節食。',
    safetyNote: '如果掉得很嚴重、或頭皮有異常，建議去看皮膚科確認。',
    trigger: { type: 'week_range', minWeek: 8 }
  },
  {
    id: 'maintenance_discussion',
    title: '你已經用藥半年了 🌟',
    body: '真的很不容易。\n\n這個階段很多人會開始想「接下來要繼續嗎？」這是個好問題，值得好好聊。\n\n有一件事可以先知道：停藥後體重有可能慢慢回來，這不代表你失敗，而是說明這類藥物在維持體重上本來就扮演著角色。所以不管是繼續、還是準備慢慢停，都建議跟你的醫師一起規劃，不要突然自行中止。\n\n你有在維持飲食和運動習慣嗎？這些是最重要的長期保護。',
    safetyNote: '請勿自行突然中止用藥，與醫師討論漸進式計畫。',
    trigger: { type: 'week_range', minWeek: 24 }
  }
]
