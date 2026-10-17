import { Link, useLoaderData } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { BlogIndex } from '../lib/notes'
import { Container } from '../components/ui/Container'
import { NoteBody } from '../components/blog/NoteBody'
import { NoteHeader } from '../components/blog/NoteHeader'

/**
 * Portada del blog (`/blogs`): el texto de `index.md` y, debajo, la lista de
 * entradas generada desde las carpetas `entry-<n>`. El numero que se ve delante
 * del titulo (`01 - ...`) sale de la carpeta y el titulo del frontmatter, asi
 * que no hay que mantener una lista a mano.
 */
export function BlogIndexPage() {
  const { t } = useTranslation()
  const blog = useLoaderData<BlogIndex>()

  return (
    <Container className="py-12 sm:py-16">
      <article className="mx-auto max-w-2xl">
        <NoteHeader title={blog.title} description={blog.description} date={blog.date} />

        <NoteBody html={blog.html} className="mt-8" />

        <h2 className="mt-12 font-mono text-xs tracking-[0.2em] text-muted uppercase">
          {t('blog.notes')}
        </h2>

        <ol className="mt-4 flex flex-col gap-3">
          {blog.entries.map((entry) => (
            <li key={entry.slug}>
              <Link
                to={entry.slug}
                className="block border border-border bg-surface p-4 transition-colors hover:bg-surface-raised"
              >
                <span className="text-base font-semibold tracking-tight text-foreground">
                  {entry.order === null ? null : (
                    <span className="font-mono text-primary">
                      {String(entry.order).padStart(2, '0')} -{' '}
                    </span>
                  )}
                  {entry.title}
                </span>

                {entry.description ? (
                  <span className="mt-1 block text-sm leading-relaxed text-muted">
                    {entry.description}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ol>
      </article>
    </Container>
  )
}
