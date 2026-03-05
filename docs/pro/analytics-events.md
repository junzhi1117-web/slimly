# Slimly Pro 事件追蹤規格（MVP）

## 目的
量測「報告頁 → 升級 → 付款 → 匯出」漏斗，快速驗證 Pro 功能轉換效率。

## 事件命名原則
- 小寫 snake_case
- 一個事件只代表一個行為
- 每個事件需有 `timestamp`、`user_id`、`session_id`

---

## 核心事件（MVP）

### 1) report_page_viewed
**觸發：** 使用者進入報告頁

參數：
- `is_pro: boolean`
- `entry_source: 'nav' | 'notification' | 'deep_link' | 'unknown'`
- `period_days: number`（預設 28）
- `has_weight_data: boolean`
- `has_dose_data: boolean`

### 2) report_preview_shown
**觸發：** Free 用戶看到鎖定預覽區

參數：
- `preview_type: 'summary_partial' | 'chart_preview'`
- `locked_sections_count: number`

### 3) report_upgrade_cta_clicked
**觸發：** 使用者點擊升級 CTA

參數：
- `cta_location: 'footer' | 'modal' | 'export_gate'`
- `copy_variant: 'A' | 'B'`
- `is_pro: boolean`

### 4) paywall_viewed
**觸發：** Paywall 彈出

參數：
- `trigger: 'export_click' | 'preview_end' | 'manual_open'`
- `variant: 'A' | 'B'`

### 5) subscription_checkout_started
**觸發：** 點擊付款流程入口

參數：
- `plan_id: 'pro_monthly_149'`
- `price: number`（149）
- `currency: 'TWD'`

### 6) subscription_checkout_completed
**觸發：** 付款成功

參數：
- `plan_id: 'pro_monthly_149'`
- `trial: boolean`
- `payment_method: string`

### 7) report_export_clicked
**觸發：** 點擊匯出 PDF

參數：
- `format: 'pdf'`
- `is_pro: boolean`
- `period_days: number`

### 8) report_export_succeeded
**觸發：** PDF 產生成功

參數：
- `format: 'pdf'`
- `generation_ms: number`
- `file_size_kb: number`

### 9) report_export_failed
**觸發：** PDF 產生失敗

參數：
- `format: 'pdf'`
- `error_code: string`
- `stage: 'render' | 'upload' | 'share'`

---

## 轉換漏斗定義

1. 報告頁進入率
- `report_page_viewed / DAU`

2. 升級意圖率
- `report_upgrade_cta_clicked / report_page_viewed`

3. 付款完成率
- `subscription_checkout_completed / subscription_checkout_started`

4. 匯出使用率（Pro）
- `report_export_succeeded / pro_active_users`

---

## 儀表板最小欄位
- 日期（day）
- 新增 Pro 訂閱數
- Paywall 曝光數
- CTA 點擊率
- Checkout 完成率
- 匯出成功率
- 匯出失敗 Top 3 error_code

---

## 實作注意
- `copy_variant` 必填（支援文案 A/B）
- 失敗事件必帶 `error_code`（後續 debug 核心）
- 避免重複送事件（前端需防 double fire）
