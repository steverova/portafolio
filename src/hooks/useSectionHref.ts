import { useLocation } from 'react-router'
import { hrefForRoute, type Route } from '../lib/routes'

/**
 * Destino de una seccion de la home, relativo al `basename` del router.
 * Dentro de la home es un ancla (`#proyectos`); desde otra ruta (p. ej.
 * `/blogs`) apunta a la home (`/#proyectos`). Se usa con `<Link>`/`<NavLink>`
 * para que react-router le añada el subdirectorio de GitHub Pages
 * (`/portafolio/`) y baje al ancla con `ScrollRestoration`.
 */
export function useSectionHref() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (route: Route) => (isHome ? hrefForRoute(route) : `/${hrefForRoute(route)}`)
}
