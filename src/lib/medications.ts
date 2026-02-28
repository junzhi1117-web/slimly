import type { Medication, MedicationType, SideEffectType, InjectionSite } from '../types'

export const MEDICATIONS: Record<MedicationType, Medication> = {
  mounjaro: {
    id: 'mounjaro',
    name: '猛健樂',
    brandName: 'Mounjaro®',
    manufacturer: '台灣禮來',
    doses: [2.5, 5, 7.5, 10, 12.5, 15],
    frequency: 'weekly',
    unit: 'mg',
    route: 'injection',
  },
  wegovy: {
    id: 'wegovy',
    name: '週纖達',
    brandName: 'Wegovy®',
    manufacturer: '諾和諾德',
    doses: [0.25, 0.5, 1.0, 1.7, 2.4],
    frequency: 'weekly',
    unit: 'mg',
    route: 'injection',
  },
  saxenda: {
    id: 'saxenda',
    name: '善纖達',
    brandName: 'Saxenda®',
    manufacturer: '諾和諾德',
    doses: [0.6, 1.2, 1.8, 2.4, 3.0],
    frequency: 'daily',
    unit: 'mg',
    route: 'injection',
  },
}

export const SIDE_EFFECT_LABELS: Record<SideEffectType, string> = {
  nausea: '噁心',
  vomiting: '嘔吐',
  fatigue: '疲倦',
  dizziness: '頭暈',
  constipation: '便秘',
  diarrhea: '腹瀉',
  appetite_loss: '食慾下降',
  other: '其他',
}

export const INJECTION_SITE_LABELS: Record<InjectionSite, string> = {
  'abdomen-left': '腹部左側',
  'abdomen-right': '腹部右側',
  'thigh-left': '大腿左側',
  'thigh-right': '大腿右側',
  'arm-left': '上臂左側',
  'arm-right': '上臂右側',
}

export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const
