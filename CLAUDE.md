# CLAUDE.md — 纖記 (Slimly) 開發指南

> 台灣在地化處方減重藥追蹤 App。核心精神：「3C 白痴也能用」，患者與醫師協作。

---

## 快速命令

```bash
npm run dev        # 本地開發 (Vite HMR)
npm run build      # 生產 build (tsc + vite build)
npm run preview    # 預覽 build
npm run lint       # ESLint 檢查
```

---

## Tech Stack

| 層面 | 技術 |
|------|------|
| UI | React 19 + Vite 7 |
| 樣式 | Tailwind CSS v4（`@tailwindcss/vite`）|
| 圖表 | Recharts 3 |
| Icons | Lucide React |
| 日期 | date-fns v4 |
| 後端 | Supabase（Auth + PostgreSQL + Edge Functions）|
| AI | Gemini 2.5 Pro（食物圖片分析，透過 Edge Function）|
| PWA | vite-plugin-pwa + Workbox |
| 語言 | TypeScript 5.9 strict mode |

---

## 專案結構

```
src/
├── App.tsx                    # 根元件，state 管理 + 路由（tab-based）
├── main.tsx
├── index.css                  # Tailwind + 設計 token + 全域樣式
├── types/
│   └── index.ts               # 所有 TypeScript 型別
├── lib/
│   ├── db.ts                  # 資料 hooks（useAuth/useProfile/useDoseRecords 等）
│   ├── supabase.ts            # Supabase client + auth helpers + useLocalStorage
│   ├── medications.ts         # 藥物資料庫（三藥 + label maps）
│   ├── nutrition.ts           # 蛋白質目標計算 + 常用食物資料庫
│   └── photoUsage.ts          # AI 拍照次數追蹤（localStorage，按日重置）
├── pages/
│   ├── HomePage.tsx           # 儀表板：體重趨勢、注射摘要、蛋白質追蹤
│   ├── LogPage.tsx            # 注射日記（新增 + 歷史列表）
│   ├── WeightPage.tsx         # 體重趨勢圖 + 記錄
│   ├── NutritionPage.tsx      # 飲食追蹤（拍照 AI / 常用食物）
│   ├── ProfilePage.tsx        # 設定 + 帳號同步
│   └── OnboardingPage.tsx     # 首次設定流程
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx      # 底部導航（5 個 tab）
│   │   └── Header.tsx         # 頂部標題 + 返回按鈕
│   ├── ui/
│   │   ├── Button.tsx         # Button（primary / secondary）
│   │   ├── Card.tsx           # Card（monet / sage / rose / hero 變體）
│   │   ├── Badge.tsx          # Badge
│   │   └── UpgradeModal.tsx   # Premium 升級提示
│   ├── injection/
│   │   ├── InjectionForm.tsx  # 注射記錄表單
│   │   ├── InjectionList.tsx  # 注射歷史列表
│   │   └── PostInjectionCheckIn.tsx  # 注射後副作用回報
│   ├── insight/
│   │   ├── PostInjectionCheckInBanner.tsx  # 注射後 12–72h 提示 banner
│   │   └── SideEffectInsightCard.tsx       # 副作用趨勢摘要
│   ├── medication/
│   │   └── MedSelector.tsx   # 藥物選擇器
│   ├── nutrition/
│   │   ├── FoodPhotoAnalyzer.tsx   # 相機 + AI 拍照分析 UI
│   │   ├── FoodResultCard.tsx      # AI 分析結果確認卡
│   │   ├── CommonFoodPicker.tsx    # 常用食物選擇器
│   │   └── NutritionBar.tsx        # 巨量營養素 bar（compact 模式）
│   └── weight/
│       ├── WeightChart.tsx    # Recharts 折線圖
│       └── WeightForm.tsx     # 體重記錄表單
└── assets/

supabase/
├── schema.sql                 # 資料庫 schema（在 Dashboard SQL Editor 執行）
└── functions/
    └── analyze-food/
        └── index.ts           # Edge Function：Gemini Vision 食物分析
```

---

## 設計系統

### 色彩（莫內印象派）

```css
--color-bg:         #F8F5F0   /* 暖米白背景 */
--color-surface:    #FFFFFF   /* 卡片白 */
--color-sage:       #8FBCB0   /* 主色：鼠尾草綠 */
--color-sage-light: rgba(143,188,176,0.12)
--color-rose:       #C9A0A8   /* 副色：玫瑰粉 */
--color-rose-light: rgba(201,160,168,0.12)
--color-gold:       #E8D5B8   /* 暖金（點綴用）*/
--color-deep:       #5C7A74   /* 深色文字 / hero 背景 */
--color-muted:      #9BB5B0   /* 輔助文字 */
--color-border:     rgba(143,188,176,0.2)
```

### 字體

- **標題/serif**：`Cormorant Garamond` + `Noto Serif TC`
- **內文**：`Noto Sans TC`
- **數字**：`.stat-number`（serif，letter-spacing: -0.02em）

### Card 變體

| class | 用途 |
|-------|------|
| `.card-monet` | 標準白色卡片（陰影）|
| `.card-sage` | 淺綠色卡片（輕量資訊）|
| `.card-rose` | 淡玫瑰卡片（警示/目標）|
| `.card-hero` | 深綠 `#5C7A74` 白字（主角卡片）|

### 設計禁忌

- ❌ **禁止 gradient**（漸層）
- ❌ **禁止 neon/螢光色**
- ✅ 圓角統一 20px（`rounded-[20px]` / `rounded-3xl`）
- ✅ Active 回饋：`active:scale-[0.97]` 或 `active:opacity-80`

---

## 資料模型

### 核心 Types（`src/types/index.ts`）

```typescript
// 三種藥物
type MedicationType = 'mounjaro' | 'wegovy' | 'saxenda'
type MedicationRoute = 'injection' | 'oral'  // oral 預留口服 GLP-1 擴充

// 注射/用藥記錄（取代舊版 InjectionLog）
interface DoseRecord {
  id, date, medication, dose, route
  injectionSite?: InjectionSite  // 注射部位輪換
  withMeal?: boolean
  notes?: string
  sideEffects?: SideEffectEntry[]
}

// 副作用（每筆 1-3 嚴重度）
interface SideEffectEntry {
  type: 'nausea'|'vomiting'|'fatigue'|'dizziness'|'constipation'|'diarrhea'|'appetite_loss'|'other'
  severity: 1 | 2 | 3
}

// 體重
interface WeightLog { id, date, weight, waist? }

// 飲食
interface NutritionEntry {
  id, date, name, portion
  calories, protein, carbs, fat
  source: 'ai_photo' | 'manual' | 'common_food'
}

// 用戶資料
interface UserProfile {
  medicationType, currentDose, injectionDay?
  startDate, startWeight, targetWeight?, height?
  isPremium?  // 後台/金流 webhook 寫入，前端唯讀
}
```

---

## 藥物資料庫（`src/lib/medications.ts`）

| 藥物 | 台灣名 | 廠牌 | 劑量 | 頻率 |
|------|--------|------|------|------|
| mounjaro | 猛健樂 | 台灣禮來 Mounjaro® | 2.5/5/7.5/10/12.5/15 mg | 每週 |
| wegovy | 週纖達 | 諾和諾德 Wegovy® | 0.25/0.5/1.0/1.7/2.4 mg | 每週 |
| saxenda | 善纖達 | 諾和諾德 Saxenda® | 0.6/1.2/1.8/2.4/3.0 mg | 每日 |

---

## 資料層架構

### Offline-first 雙軌設計

```
未登入                    已登入
localStorage  ←──────────→  Supabase
  (guest)      syncOnLogin   (cloud)
```

- 所有 hooks（`useProfile` / `useDoseRecords` 等）根據 `user` 狀態自動切換
- 登入時 `syncLocalToSupabase()` 將 localStorage 資料上傳（避免資料遺失）
- `refreshKey` 機制：登入/同步後遞增，觸發所有 hooks 重新 fetch

### Supabase Tables

| Table | 描述 | Key |
|-------|------|-----|
| `profiles` | 用戶設定 | `id` = auth.users.id |
| `dose_records` | 注射/用藥記錄 | `user_id`, `date` |
| `weight_logs` | 體重記錄 | `user_id`, `date` |
| `nutrition_logs` | 飲食記錄 | `user_id`, `date` |

所有 table 啟用 RLS，policy：`auth.uid() = user_id`。

`profiles.is_premium` 只能由後台 webhook 寫入，前端不能修改。

### 欄位轉換規則

- DB: `snake_case`（`injection_site`, `start_weight`）
- TS: `camelCase`（`injectionSite`, `startWeight`）
- 轉換函式在 `db.ts`：`toSnake*` / `toCamel*`

---

## 蛋白質目標計算（`src/lib/nutrition.ts`）

```
有身高（AdjBW 法，ESPEN 減重期建議）：
  IBW   = 22.5 × (身高m)²
  AdjBW = IBW + 0.25 × (當前體重 - IBW)  // 若體重 < IBW 直接用當前體重
  目標  = AdjBW × 1.3 g/kg

無身高（保守估計）：
  目標 = 當前體重 × 1.2 g/kg
```

---

## AI 拍照功能

### 流程

```
用戶拍照/上傳 → base64 → Supabase Edge Function (analyze-food)
→ Gemini 2.5 Pro Vision → 解析 JSON → FoodResultCard 確認
→ 用戶確認 → addEntry × N
```

### 免費次數限制

- 每日 3 次（`DAILY_FREE_LIMIT = 3`）
- 追蹤於 localStorage：`slimly_photo_uses_YYYY-MM-DD`
- Premium 用戶無限次
- `src/lib/photoUsage.ts` 管理

### Edge Function 部署

```bash
supabase functions deploy analyze-food
# 在 Supabase Dashboard > Edge Functions > Secrets 設定 GEMINI_API_KEY
```

---

## 舊版資料遷移

`migrateLegacyData()`（`lib/db.ts`）在 App 載入時執行一次：
- 將 `slimly_injection_logs`（舊 key）轉換為 `slimly_dose_records`（新 key + route: 'injection'）
- 已遷移則 skip

---

## Premium 功能

| 功能 | Free | Premium |
|------|------|---------|
| 注射/體重/飲食記錄 | ✅ 無限 | ✅ 無限 |
| AI 拍照辨識 | 每日 3 次 | 無限 |
| 雲端同步 | ✅（登入後）| ✅ |
| PDF 報告 | ❌ | ✅（待實作）|
| PK 曲線 | ❌ | ✅（待實作）|

Premium 定價：149 元/月（台幣）

---

## 注射部位輪換邏輯

`LogPage.tsx` 自動建議下次注射部位：
```
sites = [腹左, 腹右, 腿左, 腿右, 臂左, 臂右]
建議 = sites[(上次index + 1) % 6]
```

---

## 注射後副作用回報（PostInjectionCheckIn）

- 注射後 12–72 小時內顯示 Banner
- 用戶回報副作用 → 寫回該 `DoseRecord.sideEffects`
- `findPendingCheckIn()` 找出符合條件的最近一筆注射記錄

---

## 環境變數

`.env.local`：
```
VITE_SUPABASE_URL=https://obgpxpulwskesirttxzx.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

---

## 目前狀態

### ✅ 已完成（Phase 1）
- 三藥支援（猛健樂/週纖達/善纖達）
- 注射日記 + 部位輪換建議
- 體重追蹤 + 趨勢圖（Recharts）
- 飲食追蹤（AI 拍照 + 常用食物 + 手動）
- 蛋白質目標計算（AdjBW 法）
- 副作用追蹤 + 12–72h 回報提示
- Offline-first（localStorage ↔ Supabase 雙軌）
- Google OAuth + Email 登入
- PWA（vite-plugin-pwa）
- Supabase Edge Function（Gemini Vision）

### 🔲 待實作（優先度順序）

#### 金流（Phase 2 重點）
- **Web：Lemon Squeezy**（決策已定，複用 InkBlade 架構，Merchant of Record 處理全球稅）
  - 複製 InkBlade `handle-webhook` Edge Function（改 CORS origins + 單一 Premium tier）
  - Profiles DDL migration（新增 `subscription_status` / `expires_at` / `payment_provider`）
  - 建立 `subscription_events` 表（audit log）
  - 前端 `services/payment/lemonSqueezy.ts` + 訂閱 UI
- **App 版（未來）：RevenueCat**（iOS/Android IAP 必須走 RC，避開 30% 抽成）
- 定價：**149 元/月**（台幣）

#### App 化（Phase 3）
- Capacitor（React → iOS/Android），大部分程式碼可共用
- 域名：`slimly.app`（尚未購買，俊智待辦）

#### Premium 功能
- PDF 報告
- PK 曲線（藥物吸收曲線視覺化）
- AI 拍照：Free 每日 3 次 → Premium 無限

#### 其他
- 口服 GLP-1 支援（`MedicationRoute = 'oral'` 已預留）
- 劑量遞增說明頁（ProfilePage 衛教按鈕已有 UI）
- 副作用應對指南頁
- 醫師共享/協作模式

---

## 注意事項

1. **`profiles.is_premium` 只讀**：前端絕對不能寫入，只由後台/金流 webhook 控制
2. **`DoseRecord` 取代 `InjectionLog`**：新功能一律用 DoseRecord，InjectionLog 只在遷移邏輯存在
3. **蛋白質目標**：依賴最新體重記錄動態計算，沒有體重記錄則用 `startWeight`
4. **AI 分析用繁體中文**：Prompt 明確要求繁體中文 + 台灣在地化份量描述
5. **RLS 都有開啟**：不需要額外 service key，anon key 即可（配合 auth）
