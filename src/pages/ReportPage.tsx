import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ReportPaywallSheet } from '../components/ui/ReportPaywallSheet'
import type { DoseRecord, SideEffectType, UserProfile, WeightLog } from '../types'
import { MEDICATIONS, SIDE_EFFECT_LABELS } from '../lib/medications'
import { format, parseISO, differenceInDays, isAfter, subDays } from 'date-fns'
import { getPaywallVariant, trackEvent } from '../lib/analytics'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts'

interface ReportPageProps {
  profile: UserProfile
  doseRecords: DoseRecord[]
  weightLogs: WeightLog[]
  userId?: string
}

type SeverityCount = { mild: number; moderate: number; severe: number }

type SideEffectRow = {
  name: string
  mild: number
  moderate: number
  severe: number
  total: number
}

const chartTheme = {
  deep: '#24342F',
  sage: '#8FBCB0',
  rose: '#C9A0A8',
  gold: '#E8D5B8',
  muted: '#5D706A',
  grid: 'rgba(143,188,176,0.2)',
}

function buildWeightTrend(logs: WeightLog[]) {
  const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return sorted.map((log, index) => {
    const windowStart = Math.max(0, index - 6)
    const window = sorted.slice(windowStart, index + 1)
    const avg = window.reduce((sum, item) => sum + item.weight, 0) / window.length

    return {
      date: log.date,
      displayDate: format(parseISO(log.date), 'MM/dd'),
      weight: Number(log.weight.toFixed(1)),
      avg7: Number(avg.toFixed(1)),
    }
  })
}

function buildDoseTimeline(records: DoseRecord[]) {
  return [...records]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((record) => ({
      date: record.date,
      displayDate: format(parseISO(record.date), 'MM/dd'),
      dose: record.dose,
    }))
}

function buildSideEffectRows(records: DoseRecord[]): SideEffectRow[] {
  const map = new Map<SideEffectType, SeverityCount>()

  records.forEach((record) => {
    record.sideEffects?.forEach((entry) => {
      const current = map.get(entry.type) ?? { mild: 0, moderate: 0, severe: 0 }
      if (entry.severity === 1) current.mild += 1
      if (entry.severity === 2) current.moderate += 1
      if (entry.severity === 3) current.severe += 1
      map.set(entry.type, current)
    })
  })

  return Array.from(map.entries())
    .map(([key, value]) => ({
      name: SIDE_EFFECT_LABELS[key],
      mild: value.mild,
      moderate: value.moderate,
      severe: value.severe,
      total: value.mild + value.moderate + value.severe,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
}

function getSummary(profile: UserProfile, weightLogs: WeightLog[], doseRecords: DoseRecord[], sideEffectRows: SideEffectRow[]) {
  const sortedWeights = [...weightLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const latestWeight = sortedWeights.at(-1)?.weight ?? profile.startWeight
  const loss = Number((profile.startWeight - latestWeight).toFixed(1))

  const latestDate = sortedWeights.at(-1)?.date
  const recentStartDate = latestDate ? subDays(parseISO(latestDate), 14) : subDays(new Date(), 14)
  const recentWeights = sortedWeights.filter((log) => isAfter(parseISO(log.date), recentStartDate))
  const trend14d = recentWeights.length >= 2
    ? Number((recentWeights[0].weight - recentWeights[recentWeights.length - 1].weight).toFixed(1))
    : 0

  const activeDays = differenceInDays(new Date(), parseISO(profile.startDate)) + 1
  const monthlyDoseCount = doseRecords.filter((r) => isAfter(parseISO(r.date), subDays(new Date(), 30))).length

  const severeCount = sideEffectRows.reduce((sum, row) => sum + row.severe, 0)

  const headline = loss > 0
    ? `目前較起始體重下降 ${loss} kg，進度持續中。`
    : '目前體重仍在起步階段，建議持續紀錄觀察。'

  const highlights = [
    `療程已進行 ${activeDays} 天，近 30 天共記錄 ${monthlyDoseCount} 次用藥。`,
    trend14d > 0
      ? `近 14 天再下降 ${trend14d} kg，節奏穩定。`
      : trend14d < 0
        ? `近 14 天上升 ${Math.abs(trend14d)} kg，可微調作息與飲食。`
        : '近 14 天體重變化不大，屬常見平台期。',
    severeCount > 0
      ? `本期有 ${severeCount} 次重度不適，回診時建議主動與醫師討論。`
      : '本期未記錄重度副作用，整體耐受度良好。',
  ]

  const actions = [
    '固定每週同一天用藥，避免間隔波動。',
    '每週至少記錄 2 次體重，方便判讀趨勢。',
    severeCount > 0
      ? '若噁心或疲倦持續加重，提早回診評估。'
      : '維持目前節奏，下週觀察體重曲線是否續降。',
  ]

  return { headline, highlights, actions, latestWeight, loss }
}

export const ReportPage: React.FC<ReportPageProps> = ({ profile, doseRecords, weightLogs, userId }) => {
  const med = MEDICATIONS[profile.medicationType]
  const isPro = profile.isPremium === true
  const [showPaywall, setShowPaywall] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const reportExportRef = useRef<HTMLDivElement>(null)
  const paywallVariant = useMemo(() => getPaywallVariant(), [])
  const exportGeneratedAt = useMemo(() => format(new Date(), 'yyyy/MM/dd HH:mm'), [])

  const weightTrend = useMemo(() => buildWeightTrend(weightLogs), [weightLogs])
  const doseTimeline = useMemo(() => buildDoseTimeline(doseRecords), [doseRecords])
  const sideEffectRows = useMemo(() => buildSideEffectRows(doseRecords), [doseRecords])
  const summary = useMemo(
    () => getSummary(profile, weightLogs, doseRecords, sideEffectRows),
    [profile, weightLogs, doseRecords, sideEffectRows]
  )
  const visibleWeightTrend = isPro ? weightTrend : weightTrend.slice(-14)

  const reportUserId = userId ?? 'guest'

  useEffect(() => {
    trackEvent('report_page_viewed', reportUserId, {
      is_pro: isPro,
      entry_source: 'nav',
      period_days: 28,
      has_weight_data: weightLogs.length > 0,
      has_dose_data: doseRecords.length > 0,
    })

    if (!isPro) {
      trackEvent('report_preview_shown', reportUserId, {
        preview_type: 'summary_partial',
        locked_sections_count: 3,
      })
    }
  }, [reportUserId, isPro, weightLogs.length, doseRecords.length])

  const openPaywall = (trigger: 'export_click' | 'preview_end' | 'manual_open', location: 'footer' | 'modal' | 'export_gate') => {
    trackEvent('report_upgrade_cta_clicked', reportUserId, {
      cta_location: location,
      copy_variant: paywallVariant,
      is_pro: isPro,
    })

    trackEvent('paywall_viewed', reportUserId, {
      trigger,
      variant: paywallVariant,
    })

    setShowPaywall(true)
  }

  const handleExport = async () => {
    trackEvent('report_export_clicked', reportUserId, {
      format: 'pdf',
      is_pro: isPro,
      period_days: 28,
    })

    if (!isPro) {
      openPaywall('export_click', 'export_gate')
      return
    }

    if (!reportExportRef.current) {
      trackEvent('report_export_failed', reportUserId, {
        format: 'pdf',
        error_code: 'missing_export_root',
        stage: 'render',
      })
      return
    }

    const startedAt = performance.now()
    setIsExporting(true)

    try {
      const exportSections = Array.from(reportExportRef.current.querySelectorAll<HTMLElement>('[data-export-section]'))

      if (exportSections.length === 0) {
        trackEvent('report_export_failed', reportUserId, {
          format: 'pdf',
          error_code: 'missing_export_sections',
          stage: 'render',
        })
        alert('PDF 產生失敗，請稍後再試一次')
        return
      }

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const marginX = 12
      const marginTop = 12
      const marginBottom = 18
      const sectionGap = 4
      const contentWidth = pageWidth - marginX * 2
      const contentMaxY = pageHeight - marginBottom
      const maxSectionHeight = contentMaxY - marginTop

      let cursorY = marginTop
      let estimatedBytes = 0

      for (let index = 0; index < exportSections.length; index += 1) {
        const section = exportSections[index]
        const canvas = await html2canvas(section, {
          scale: 2,
          backgroundColor: '#F8F5F0',
          useCORS: true,
        })

        const imageData = canvas.toDataURL('image/jpeg', 0.95)
        estimatedBytes += imageData.length * 0.75

        let renderHeight = (canvas.height * contentWidth) / canvas.width

        if (renderHeight > maxSectionHeight) {
          renderHeight = maxSectionHeight
        }

        if (cursorY + renderHeight > contentMaxY) {
          pdf.addPage()
          cursorY = marginTop
        }

        pdf.addImage(imageData, 'JPEG', marginX, cursorY, contentWidth, renderHeight)
        cursorY += renderHeight + sectionGap
      }

      const totalPages = pdf.getNumberOfPages()
      for (let page = 1; page <= totalPages; page += 1) {
        pdf.setPage(page)
        pdf.setFontSize(10)
        pdf.setTextColor(36, 52, 47)
        pdf.text('Slimly', marginX, pageHeight - 8)

        pdf.setFontSize(8)
        pdf.setTextColor(93, 112, 106)
        pdf.text('此報告僅供回診溝通與自我追蹤，不能取代醫療專業判斷。', marginX + 18, pageHeight - 8)
        pdf.text(`${page}/${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: 'right' })
      }

      const fileName = `slimly-report-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`
      pdf.save(fileName)

      trackEvent('report_export_succeeded', reportUserId, {
        format: 'pdf',
        generation_ms: Math.round(performance.now() - startedAt),
        file_size_kb: Math.round(estimatedBytes / 1024),
      })
    } catch {
      trackEvent('report_export_failed', reportUserId, {
        format: 'pdf',
        error_code: 'pdf_generation_failed',
        stage: 'render',
      })
      alert('PDF 產生失敗，請稍後再試一次')
    } finally {
      setIsExporting(false)
    }
  }

  const handleUpgradeStart = () => {
    trackEvent('subscription_checkout_started', reportUserId, {
      plan_id: 'pro_monthly_149',
      price: 149,
      currency: 'TWD',
    })

    alert('付款流程下一步可串接 RevenueCat / 金流頁')
  }

  const exportButtonLabel = isExporting ? 'PDF 產生中…' : isPro ? '匯出 PDF' : '升級 Pro 解鎖 PDF'

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header title="診間報告" />
      <main className="p-4 space-y-4 pb-24">
        <Card variant="hero" className="space-y-3">
          <p className="text-white/70 text-xs tracking-[0.16em] uppercase">Slimly Report</p>
          <h2 className="text-2xl font-semibold text-white leading-snug">{summary.headline}</h2>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/12 rounded-2xl p-3">
              <p className="text-white/70 text-xs mb-1">目前體重</p>
              <p className="text-white text-2xl font-serif">{summary.latestWeight.toFixed(1)} kg</p>
            </div>
            <div className="bg-white/12 rounded-2xl p-3">
              <p className="text-white/70 text-xs mb-1">累積變化</p>
              <p className="text-white text-2xl font-serif">
                {summary.loss > 0 ? `-${summary.loss.toFixed(1)} kg` : `${Math.abs(summary.loss).toFixed(1)} kg`}
              </p>
            </div>
          </div>
        </Card>

        <div ref={reportExportRef} className="space-y-4">
          <Card className="space-y-3" data-export-section>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--color-deep)]">白話重點</p>
              {!isPro && (
                <span className="text-[10px] text-[var(--color-sage)] bg-[var(--color-sage-light)] px-2 py-0.5 rounded-full">Free 預覽</span>
              )}
            </div>
            <ul className="space-y-2 text-sm text-[var(--color-deep)]/90 leading-relaxed">
              {(isPro ? summary.highlights : summary.highlights.slice(0, 1)).map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[var(--color-sage)]">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {!isPro && (
              <button
                onClick={() => openPaywall('preview_end', 'footer')}
                className="w-full rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-sage-light)]/50 p-3 text-left"
              >
                <p className="text-sm font-medium text-[var(--color-deep)]">完整圖表與醫師版摘要僅限 Pro</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">解鎖完整報告 + 一鍵匯出 PDF</p>
              </button>
            )}
          </Card>

          <Card className="p-4" data-export-section>
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="font-serif text-lg text-[var(--color-deep)]">體重趨勢</h3>
              <p className="text-xs text-[var(--color-muted)]">實線：每日體重｜虛線：7日平均</p>
            </div>
            {visibleWeightTrend.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-[var(--color-muted)] text-sm">
                尚無體重資料
              </div>
            ) : (
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={visibleWeightTrend} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                    <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartTheme.muted }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartTheme.muted }} domain={['dataMin - 0.8', 'dataMax + 0.8']} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 6px 18px rgba(92,122,116,0.14)' }}
                      labelStyle={{ color: chartTheme.deep, fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="weight" name="每日" stroke={chartTheme.deep} strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="avg7" name="7日平均" stroke={chartTheme.rose} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="p-4" data-export-section>
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="font-serif text-lg text-[var(--color-deep)]">劑量歷程</h3>
              <p className="text-xs text-[var(--color-muted)]">{med.name} ({med.unit})</p>
            </div>
            {!isPro ? (
              <button onClick={() => openPaywall('manual_open', 'footer')} className="h-[200px] w-full rounded-2xl bg-[var(--color-sage-light)]/60 border border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-center px-4">
                <p className="text-sm font-medium text-[var(--color-deep)]">Pro 解鎖：完整劑量歷程圖</p>
                <p className="text-xs text-[var(--color-muted)] mt-1">看見每次調整與變化</p>
              </button>
            ) : doseTimeline.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-[var(--color-muted)] text-sm">
                尚無用藥資料
              </div>
            ) : (
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={doseTimeline} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                    <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartTheme.muted }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartTheme.muted }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 6px 18px rgba(92,122,116,0.14)' }}
                      labelStyle={{ color: chartTheme.deep, fontWeight: 600 }}
                    />
                    <Line type="stepAfter" dataKey="dose" name={`劑量 (${med.unit})`} stroke={chartTheme.sage} strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="p-4" data-export-section>
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="font-serif text-lg text-[var(--color-deep)]">副作用概況</h3>
              <p className="text-xs text-[var(--color-muted)]">輕 / 中 / 重</p>
            </div>
            {!isPro ? (
              <button onClick={() => openPaywall('manual_open', 'footer')} className="h-[200px] w-full rounded-2xl bg-[var(--color-rose-light)]/60 border border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-center px-4">
                <p className="text-sm font-medium text-[var(--color-deep)]">Pro 解鎖：副作用分布圖</p>
                <p className="text-xs text-[var(--color-muted)] mt-1">回診時快速聚焦不適重點</p>
              </button>
            ) : sideEffectRows.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-[var(--color-muted)] text-sm">
                尚無副作用資料
              </div>
            ) : (
              <div style={{ width: '100%', height: 230 }}>
                <ResponsiveContainer>
                  <BarChart data={sideEffectRows} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartTheme.muted }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartTheme.muted }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 6px 18px rgba(92,122,116,0.14)' }}
                      labelStyle={{ color: chartTheme.deep, fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="mild" name="輕" stackId="a" fill={chartTheme.gold} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="moderate" name="中" stackId="a" fill={chartTheme.rose} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="severe" name="重" stackId="a" fill={chartTheme.deep} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card variant="sage" className="space-y-2" data-export-section>
            <p className="text-sm font-semibold text-[var(--color-deep)]">下週建議行動</p>
            <ul className="space-y-1.5 text-sm text-[var(--color-deep)] leading-relaxed">
              {summary.actions.map((item) => (
                <li key={item} className="flex gap-2">
                  <span>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-[var(--color-deep)]/70 pt-1">
              報告產生時間：{exportGeneratedAt}
            </p>
          </Card>
        </div>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--color-deep)]">診間分享</p>
            {!isPro && <span className="text-[10px] text-[var(--color-sage)]">Pro 功能</span>}
          </div>
          <p className="text-xs text-[var(--color-muted)]">一鍵匯出 PDF，回診直接分享給醫師或家人。</p>
          <Button onClick={handleExport} fullWidth className="h-12" disabled={isExporting}>
            {exportButtonLabel}
          </Button>
          {!isPro && (
            <button onClick={() => openPaywall('manual_open', 'footer')} className="w-full text-sm text-[var(--color-sage)] py-1">
              解鎖完整報告與 PDF
            </button>
          )}
        </Card>
      </main>

      {showPaywall && (
        <ReportPaywallSheet
          variant={paywallVariant}
          onClose={() => setShowPaywall(false)}
          onSecondaryAction={() => setShowPaywall(false)}
          onPrimaryAction={handleUpgradeStart}
        />
      )}
    </div>
  )
}
