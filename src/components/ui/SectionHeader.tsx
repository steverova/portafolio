import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type SectionHeaderProps = {
  /** id del <h2>, usado por aria-labelledby de la seccion. */
  id: string
  eyebrow?: string
  title: ReactNode
  description?: string
  className?: string
}

/** Encabezado de seccion: antetitulo + titulo + descripcion. */
export function SectionHeader({ id, eyebrow, title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn('max-w-2xl', className)}>
      {eyebrow ? (
        <p className="mb-3 flex items-center gap-2 font-mono text-xs font-medium tracking-[0.2em] text-primary uppercase">
          <span aria-hidden="true" className="h-px w-6 bg-primary" />
          {eyebrow}
        </p>
      ) : null}

      <h2 id={id} className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>

      {description ? <p className="mt-4 text-base leading-relaxed text-muted">{description}</p> : null}
    </div>
  )
}
