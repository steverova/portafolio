import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AREAS,
  filterStack,
  type AreaFilter,
  type LanguageFilter,
  type StackArea,
  type StackItem,
} from '../../data/stack'
import { Logo } from './Logo'

/** Logos por grupo: si un area tiene pocos, se repiten para llenar la fila. */
const MIN_ITEMS_PER_GROUP = 12
/** Segundos de animacion por logo (velocidad constante entre filas). */
const SECONDS_PER_ITEM = 2.2

type StackMarqueeProps = {
  area: AreaFilter
  language: LanguageFilter
}

type Row = {
  area: StackArea
  items: StackItem[]
}

/** Logo ya colocado en la fila, con una key estable (el area se repite para llenar la fila). */
type Slot = {
  key: string
  item: StackItem
}

/**
 * Stack agrupado por area. Sin filtros es un marquee CSS (filas que se desplazan
 * en loop, direccion alterna, pausa al pasar el cursor y respeto por
 * `prefers-reduced-motion`, ver index.css). Con un filtro activo se convierte en
 * una rejilla estatica: repetir un logo 12 veces no ayuda a quien ya sabe que busca.
 */
export function StackMarquee({ area, language }: StackMarqueeProps) {
  const { t } = useTranslation()

  const items = filterStack(area, language)
  const rows: Row[] = AREAS.map((areaId) => ({
    area: areaId,
    items: items.filter((item) => item.areas.includes(areaId)),
  })).filter((row) => row.items.length > 0)

  if (rows.length === 0) {
    return <p className="mt-10 text-sm text-muted sm:mt-12">{t('stack.filter.empty')}</p>
  }

  const isFiltered = area !== 'all' || language !== 'all'

  return (
    <div className="mt-10 flex flex-col gap-6 sm:mt-12 sm:gap-8">
      {rows.map(({ area: rowArea, items: rowItems }, rowIndex) => (
        <div key={rowArea} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <h3 className="shrink-0 font-mono text-xs tracking-[0.2em] text-muted uppercase sm:w-28">
            {t(`stack.areas.${rowArea}`)}
          </h3>

          {isFiltered ? (
            <ul className="flex min-w-0 flex-1 flex-wrap gap-x-6 gap-y-4">
              {rowItems.map((item) => (
                <StackEntry key={item.name} item={item} />
              ))}
            </ul>
          ) : (
            <MarqueeRow items={rowItems} direction={rowIndex % 2 === 0 ? 'left' : 'right'} />
          )}
        </div>
      ))}
    </div>
  )
}

function MarqueeRow({ items, direction }: { items: StackItem[]; direction: 'left' | 'right' }) {
  const repeat = Math.max(1, Math.ceil(MIN_ITEMS_PER_GROUP / items.length))
  // Keys estables (nombre + ronda de repeticion) calculadas fuera del render de la lista.
  const slots: Slot[] = Array.from({ length: repeat }).flatMap((_, copy) =>
    items.map((item) => ({ key: `${item.name}-${copy}`, item })),
  )
  const duration = `${Math.round(slots.length * SECONDS_PER_ITEM)}s`

  return (
    <div className="marquee min-w-0 flex-1">
      <div
        className="marquee__track"
        data-direction={direction}
        style={{ '--marquee-duration': duration } as CSSProperties}
      >
        <MarqueeGroup slots={slots} />
        {/* Copia para el loop continuo; se oculta a lectores de pantalla. */}
        <MarqueeGroup slots={slots} duplicate />
      </div>
    </div>
  )
}

function MarqueeGroup({ slots, duplicate = false }: { slots: Slot[]; duplicate?: boolean }) {
  return (
    <ul className="marquee__group" aria-hidden={duplicate || undefined}>
      {slots.map(({ key, item }) => (
        <StackEntry key={key} item={item} />
      ))}
    </ul>
  )
}

function StackEntry({ item }: { item: StackItem }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center bg-surface-raised p-1.5">
        <Logo src={item.icon} />
      </span>
      <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
    </li>
  )
}
