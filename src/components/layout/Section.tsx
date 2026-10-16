import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type SectionProps = {
  id: string
  /** id del encabezado que titula la seccion (aria-labelledby). */
  labelledBy: string
  children: ReactNode
  className?: string
}

/** Envoltorio semantico de cada vista de la SPA. */
export function Section({ id, labelledBy, children, className }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn('scroll-mt-20 py-10 sm:py-14 lg:py-16', className)}
    >
      {children}
    </section>
  )
}
