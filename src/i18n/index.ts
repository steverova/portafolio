import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { es } from './locales/es'

/** Idiomas soportados. El primero es el que se usa como respaldo. */
export const SUPPORTED_LANGUAGES = ['es', 'en'] as const

export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const FALLBACK_LANGUAGE: Language = 'es'

const resources = {
  es: { translation: es },
  en: { translation: en },
}

/** Normaliza variantes regionales (es-MX, en-US…) al idioma base soportado. */
export function toBaseLanguage(language: string | undefined): Language {
  return language?.toLowerCase().startsWith('en') ? 'en' : FALLBACK_LANGUAGE
}

/**
 * Mantiene sincronizados con el idioma activo el atributo `lang` del <html>
 * y los metadatos del documento (title y description).
 */
function syncDocument(language: string) {
  const base = toBaseLanguage(language)

  document.documentElement.lang = base
  document.title = i18n.t('meta.title')
  document.querySelector('meta[name="description"]')?.setAttribute('content', i18n.t('meta.description'))
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: FALLBACK_LANGUAGE,
    // Permite que es-MX / en-US se resuelvan a es / en.
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: {
      // React ya escapa las cadenas.
      escapeValue: false,
    },
    detection: {
      // Primero el idioma del navegador; luego lo elegido previamente por la persona.
      order: ['navigator', 'localStorage', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'portafolio-language',
    },
  })
  .then(() => syncDocument(i18n.resolvedLanguage ?? FALLBACK_LANGUAGE))

i18n.on('languageChanged', syncDocument)

export default i18n
