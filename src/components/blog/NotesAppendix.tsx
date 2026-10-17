import { useTranslation } from 'react-i18next'
import type { NoteFile } from '../../lib/notes'

/**
 * Archivos extra de una entrada, plegados en un acordeon.
 * Se muestran en crudo, sin renderizar: son ficheros que se copian (definiciones
 * de agentes, configuraciones), asi que lo util es el texto exacto.
 * Usamos `<details>` nativo: es accesible por defecto y no necesita estado.
 */
export function NotesAppendix({ files }: { files: NoteFile[] }) {
  const { t } = useTranslation()

  if (files.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="font-mono text-xs tracking-[0.2em] text-muted uppercase">{t('blog.files')}</h2>

      <div className="mt-4 flex flex-col gap-2">
        {files.map((file) => (
          <details key={file.name} className="group border border-border bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-raised [&::-webkit-details-marker]:hidden">
              <span className="font-mono text-xs font-medium text-foreground">{file.name}</span>
              <span
                aria-hidden="true"
                className="text-muted transition-transform group-open:rotate-90"
              >
                ›
              </span>
            </summary>
            <pre className="overflow-x-auto border-t border-border bg-surface-raised p-4 font-mono text-xs leading-relaxed text-muted"><code>{file.source}</code></pre>
          </details>
        ))}
      </div>
    </section>
  )
}
