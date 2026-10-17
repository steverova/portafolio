import { cn } from '../../lib/cn'

type NoteHeaderProps = {
  title: string
  description?: string
  /** Fecha en formato ISO corto (`2026-10-16`). */
  date?: string
  className?: string
}

/** Cabecera de una nota: titulo, descripcion y fecha. */
export function NoteHeader({ title, description, date, className }: NoteHeaderProps) {
  return (
    <header className={cn('border-b border-border/70 pb-6', className)}>
      <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>

      {description ? <p className="mt-3 text-base text-muted">{description}</p> : null}

      {date ? (
        <time
          dateTime={date}
          className="mt-4 block font-mono text-xs tracking-[0.2em] text-muted uppercase"
        >
          {date}
        </time>
      ) : null}
    </header>
  )
}
