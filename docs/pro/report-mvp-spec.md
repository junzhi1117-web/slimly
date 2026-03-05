# Slimly 診間一鍵報告 MVP 規格

## 目的
將用戶日常紀錄整理成回診可直接使用的報告，先完成可用 MVP。

## 報告期間
- 預設：近 28 天
- 依據：`period_start` ~ `period_end`

---

## 資料模型（MVP）

### A. Report Metadata
- `report_id: string`（uuid）
- `user_id: string`
- `period_start: string`（ISO date）
- `period_end: string`（ISO date）
- `generated_at: string`（ISO datetime）
- `version: string`（固定 `report_v1`）

### B. Summary Metrics
- `start_weight_kg: number`
- `latest_weight_kg: number`
- `weight_change_kg: number`
- `weight_change_pct: number`
- `current_medication: string`（猛健樂 / 週纖達 / 善纖達）
- `current_dose: number`
- `current_dose_unit: string`
- `side_effect_top3: Array<{ name: string; count: number }>`
- `adherence_rate: number | null`

### C. Chart Data

#### 1) Weight Trend
- `date: string`
- `weight_kg: number`
- `weight_ma7: number`

#### 2) Dose Timeline
- `date: string`
- `medication_name: string`
- `dose_value: number`
- `dose_unit: string`

#### 3) Side Effect Distribution
- `side_effect_name: string`
- `count: number`
- `severity_avg?: number`

---

## 文案生成規則（Summary）

### Headline
- 若 `weight_change_kg < 0`：
  - `目前較起始體重下降 {abs(weight_change_kg)} kg，進度持續中。`
- 否則：
  - `目前體重仍在起步階段，建議持續紀錄觀察。`

### Highlights（至少 3 句）
1. 療程天數 + 近 30 天用藥次數
2. 近 14 天體重趨勢（下降 / 持平 / 上升）
3. 副作用嚴重度提示（有無重度）

### Action Items（固定 3 句）
- 固定週期用藥提醒
- 每週至少 2 次體重記錄
- 若有重度副作用，建議提早回診

---

## Free / Pro 權限規則

### Free
- 可看：
  - Summary 首句
  - 體重趨勢縮圖（近 14 天）
- 不可看：
  - 完整 Summary
  - 劑量歷程圖
  - 副作用分布圖
  - PDF 匯出

### Pro
- 可看完整報告 + PDF 匯出

---

## 錯誤與空狀態

### 沒有體重資料
- `尚無體重資料，請先記錄 2 次以上體重。`

### 沒有用藥資料
- `尚無用藥資料，請先新增一筆用藥記錄。`

### 沒有副作用資料
- `本期未記錄副作用，整體耐受度良好。`

---

## 驗收標準（MVP）
1. 可基於近 28 天資料生成完整報告
2. 無資料情境不崩潰，皆有對應空狀態
3. Pro 使用者可完成 PDF 匯出
4. 報告頁載入時間（P95）< 2 秒（不含 PDF 生成）
5. 核心事件埋點可正常收集（見 analytics-events.md）
