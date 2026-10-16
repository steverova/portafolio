import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { SUPPORTED_LANGUAGES, toBaseLanguage } from '../../i18n'

const LABELS: Record<string, string> = { es: 'ES', en: 'EN' }

/** Selector compacto de idioma (ES / EN). */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation()
  const current = toBaseLanguage(i18n.resolvedLanguage)

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className={cn('flex items-stretch border border-border', className)}
    >
      {SUPPORTED_LANGUAGES.map((language) => {
        const isActive = current === language

        return (
          <button
            key={language}
            type="button"
            lang={language}
            aria-pressed={isActive}
            onClick={() => void i18n.changeLanguage(language)}
            className={cn(
              'h-9 px-2.5 text-xs font-semibold transition-colors',
              isActive ? 'bg-primary text-white' : 'text-muted hover:bg-surface-raised hover:text-foreground',
            )}
          >
            {LABELS[language]}
          </button>
        )
      })}
    </div>
  )
}
