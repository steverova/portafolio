import { useLocation } from 'react-router'
import { hrefForRoute, type Route } from '../lib/routes'

/**
 * Href de una seccion de la home. Dentro de la home es un ancla normal
 * (`#proyectos`), que respeta el scroll suave sin recargar la pagina. Desde otra
 * ruta (p. ej. `/blogs`) apunta a la home (`/#proyectos`).
 */
export function useSectionHref() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (route: Route) => (isHome ? hrefForRoute(route) : `/${hrefForRoute(route)}`)
}
