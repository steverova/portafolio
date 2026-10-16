import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type CardProps = {
  children: ReactNode
  className?: string
  /** Anade realce visual al pasar el cursor / recibir foco. */
  interactive?: boolean
  /** Padding interno. Desactivar cuando el contenido va a sangre (p. ej. imagenes). */
  padded?: boolean
}

/** Superficie reutilizable con borde y fondo. */
export function Card({ children, className, interactive = false, padded = true }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-none border border-border bg-surface',
        padded && 'p-5 sm:p-6',
        interactive && 'transition-colors duration-200 hover:bg-surface-raised',
        className,
      )}
    >
      {children}
    </div>
  )
}
