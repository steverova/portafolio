import type { Route } from '../lib/routes'

/** Rutas propias del sitio: no son anclas de la home, son paginas aparte. */
export type NavPage = 'blog'

/** Item del menu: una seccion de la home (`#id`) o una ruta propia. */
export type NavItem =
  | { kind: 'section'; id: Route }
  | { kind: 'page'; id: NavPage; to: string }

/**
 * Enlaces del menu principal. El orden define el orden en la navegacion.
 * La etiqueta visible se resuelve con i18n usando la clave `nav.{id}`.
 */
export const NAV_ITEMS: NavItem[] = [
  { kind: 'section', id: 'hero' },
  { kind: 'section', id: 'proyectos' },
  { kind: 'section', id: 'herramientas' },
  { kind: 'page', id: 'blog', to: '/blogs' },
]
