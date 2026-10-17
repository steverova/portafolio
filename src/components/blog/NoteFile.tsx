import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { NoteFile as NoteFileData } from '../../lib/notes'
import { CheckIcon, CopyIcon } from '../ui/Icons'

type CopyState = 'idle' | 'copied' | 'error'

/** Milisegundos que se muestra el aviso antes de volver al estado inicial. */
const FEEDBACK_MS: Record<Exclude<CopyState, 'idle'>, number> = {
  copied: 2000,
  error: 4000,
}

/**
 * Archivo de una entrada: plegado y con boton para copiarlo.
 * Se muestra en crudo, sin renderizar: son ficheros que se copian (definiciones
 * de agentes, configuraciones), asi que lo util es el texto exacto.
 * Usamos `<details>` nativo: es accesible por defecto y no necesita estado.
 */
export function NoteFile({ file }: { file: NoteFileData }) {
  const { t } = useTranslation()
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<number | null>(null)

  // El aviso se borra solo; el temporizador se limpia al desmontar.
  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  const onCopy = async () => {
    let copied = false

    try {
      await navigator.clipboard.writeText(file.source)
      copied = true
    } catch {
      copied = false
    }

    const next: CopyState = copied ? 'copied' : 'error'
    setState(next)

    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), FEEDBACK_MS[next])
  }

  const label =
    state === 'copied' ? t('blog.copied') : state === 'error' ? t('blog.copyError') : t('blog.copy')

  return (
    <details className="group mt-6 border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-raised [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-xs font-medium text-foreground">{file.name}</span>
        <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>

      <div className="border-t border-border">
        <div className="flex justify-end border-b border-border bg-surface-raised px-3 py-2">
          <button
            type="button"
            onClick={onCopy}
            aria-live="polite"
            className="inline-flex h-7 items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            {state === 'copied' ? (
              <CheckIcon className="size-3.5 text-primary" />
            ) : (
              <CopyIcon className="size-3.5" />
            )}
            {label}
          </button>
        </div>

        <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-muted"><code>{file.source}</code></pre>
      </div>
    </details>
  )
}
