import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Container } from '../ui/Container'

/**
 * Error de las rutas del blog. El caso real es un slug que no existe
 * (`/blogs/lo-que-sea`), donde el loader lanza un 404.
 */
export function BlogError() {
  const { t } = useTranslation()
  const error = useRouteError()

  const isNotFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
          {isNotFound ? '404' : t('blog.errorTitle')}
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {isNotFound ? t('blog.notFound') : t('blog.errorTitle')}
        </h1>

        <p className="mt-4 text-base leading-relaxed text-muted">
          {isNotFound ? t('blog.notFoundBody') : t('blog.errorBody')}
        </p>

        <Link
          to="/blogs"
          className="mt-8 inline-flex h-11 items-center gap-2 border border-border px-6 text-sm font-semibold transition-colors hover:border-primary hover:bg-primary/10 hover:text-white"
        >
          {t('blog.back')}
        </Link>
      </div>
    </Container>
  )
}
