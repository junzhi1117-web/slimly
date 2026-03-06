import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhTW from './locales/zh-TW/translation.json'
import en from './locales/en/translation.json'

const STORAGE_KEY = 'slimly_lang'
const SUPPORTED_LANGUAGES = ['zh-TW', 'en'] as const

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'zh-TW'

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'zh-TW') return saved

  const locales = [
    window.navigator.language,
    ...(window.navigator.languages ?? []),
    document.documentElement.lang,
  ].filter(Boolean)

  const hasChineseLocale = locales.some(locale =>
    locale.toLowerCase().startsWith('zh'),
  )

  if (hasChineseLocale) return 'zh-TW'

  const hasEnglishLocale = locales.some(locale =>
    locale.toLowerCase().startsWith('en'),
  )

  if (hasEnglishLocale) return 'en'

  return 'zh-TW'
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-TW': { translation: zhTW },
      en: { translation: en },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'zh-TW',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
  })

export default i18n
