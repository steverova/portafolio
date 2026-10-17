import { cn } from '../../lib/cn'
import type { NoteFile as NoteFileData } from '../../lib/notes'
import { splitBody } from '../../lib/noteBody'
import { NoteFile } from './NoteFile'

type NoteBodyProps = {
  /** HTML ya renderizado por el parser de Markdown. */
  html: string
  /** Archivos de la entrada; se insertan donde los pida un marcador. */
  files?: NoteFileData[]
  className?: string
}

/**
 * Cuerpo de una nota.
 * El HTML se inyecta sin sanitizar a proposito: viene de los `.md` del repo y se
 * empaqueta en el build, no de entrada del usuario. Los estilos viven en la
 * utilidad `.note-content` (ver index.css).
 *
 * Si el markdown pide archivos con un marcador, el HTML se trocea y los
 * componentes se intercalan en su lugar, para que el acordeon de un archivo caiga
 * dentro de la seccion que le toca. El troceado mete cada fragmento en un `div`,
 * y por eso los margenes de `.note-content` van por elemento y no por `> * + *`.
 */
export function NoteBody({ html, files = [], className }: NoteBodyProps) {
  const segments = splitBody(html)

  // Sin marcadores no hay nada que intercalar: un unico bloque, como siempre.
  const hasFiles = segments.some((segment) => segment.type === 'file')

  if (!hasFiles) {
    return (
      <div className={cn('note-content', className)} dangerouslySetInnerHTML={{ __html: html }} />
    )
  }

  const byName = new Map(files.map((file) => [file.name, file]))

  return (
    <div className={cn('note-content', className)}>
      {segments.map((segment, index) => {
        if (segment.type === 'file') {
          const file = byName.get(segment.name)
          return file ? <NoteFile key={`file-${segment.name}`} file={file} /> : null
        }

        return (
          <div key={`html-${index}`} dangerouslySetInnerHTML={{ __html: segment.html }} />
        )
      })}
    </div>
  )
}
