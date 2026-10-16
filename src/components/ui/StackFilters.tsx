import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AREAS, LANGUAGES, type AreaFilter, type LanguageFilter } from '../../data/stack'
import { cn } from '../../lib/cn'

type StackFiltersProps = {
  area: AreaFilter
  language: LanguageFilter
  onAreaChange: (area: AreaFilter) => void
  onLanguageChange: (language: LanguageFilter) => void
}

/**
 * Filtros del stack por area y por lenguaje. Componente controlado:
 * el estado vive en la seccion, que se lo pasa al marquee.
 */
export function StackFilters({ area, language, onAreaChange, onLanguageChange }: StackFiltersProps) {
  const { t } = useTranslation()

  return (
    <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:gap-4">
      <FilterGroup label={t('stack.filter.area')}>
        <Chip active={area === 'all'} onClick={() => onAreaChange('all')}>
          {t('stack.filter.allAreas')}
        </Chip>
        {AREAS.map((id) => (
          <Chip key={id} active={area === id} onClick={() => onAreaChange(id)}>
            {t(`stack.areas.${id}`)}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup label={t('stack.filter.language')}>
        <Chip active={language === 'all'} onClick={() => onLanguageChange('all')}>
          {t('stack.filter.allLanguages')}
        </Chip>
        {LANGUAGES.map((id) => (
          <Chip key={id} active={language === id} onClick={() => onLanguageChange(id)}>
            {id}
          </Chip>
        ))}
      </FilterGroup>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 font-mono text-[11px] tracking-[0.2em] text-muted uppercase">{label}</span>
      {children}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-8 rounded-none border px-3 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-white'
          : 'border-border text-muted hover:border-primary/60 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
