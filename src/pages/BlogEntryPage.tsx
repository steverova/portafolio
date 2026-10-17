import { Link, useLoaderData } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { Entry } from '../lib/notes'
import { Container } from '../components/ui/Container'
import { filesInBody } from '../lib/noteBody'
import { NoteBody } from '../components/blog/NoteBody'
import { NoteHeader } from '../components/blog/NoteHeader'
import { NotesAppendix } from '../components/blog/NotesAppendix'

/** Entrada del blog (`/blogs/:slug`). */
export function BlogEntryPage() {
  const { t } = useTranslation()
  const entry = useLoaderData<Entry>()

  // Los archivos que el markdown no coloca en ningun punto se listan al final,
  // para que anadir un `.md` a la carpeta nunca lo deje invisible.
  const inBody = new Set(filesInBody(entry.html))
  const leftover = entry.files.filter((file) => !inBody.has(file.name))

  return (
    <Container className="py-12 sm:py-16">
      <article className="mx-auto max-w-2xl">
        <Link
          to="/blogs"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">←</span>
          {t('blog.back')}
        </Link>

        <NoteHeader
          title={entry.title}
          description={entry.description}
          date={entry.date}
          className="mt-6"
        />

        <NoteBody html={entry.html} files={entry.files} className="mt-8" />

        <NotesAppendix files={leftover} />
      </article>
    </Container>
  )
}
