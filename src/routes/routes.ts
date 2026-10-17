import type { RouteObject } from 'react-router'
import { RootLayout } from '../layouts/RootLayout'
import { HomePage } from '../pages/HomePage'
import { BlogError } from '../components/blog/BlogError'

/**
 * Definicion de rutas (data mode).
 * La home reune todas las secciones; el blog tiene su propio arbol de rutas.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      {
        path: 'blogs',
        ErrorBoundary: BlogError,
        // Diferido: el parser de Markdown y las notas solo se descargan si se
        // visita el blog.
        lazy: async () => {
          const [{ loadBlogIndex }, { BlogIndexPage }] = await Promise.all([
            import('../lib/notes'),
            import('../pages/BlogIndexPage'),
          ])

          return { Component: BlogIndexPage, loader: loadBlogIndex }
        },
      },
      {
        path: 'blogs/:slug',
        ErrorBoundary: BlogError,
        lazy: async () => {
          const [{ loadEntry }, { BlogEntryPage }] = await Promise.all([
            import('../lib/notes'),
            import('../pages/BlogEntryPage'),
          ])

          return { Component: BlogEntryPage, loader: loadEntry }
        },
      },
    ],
  },
]
