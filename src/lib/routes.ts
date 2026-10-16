/**
 * Anclas de la pagina. Cada una corresponde al id de una seccion
 * (#hero, #proyectos, #herramientas) y a un enlace del menu.
 */
export const ROUTES = ['hero', 'proyectos', 'herramientas'] as const

export type Route = (typeof ROUTES)[number]

export function hrefForRoute(route: Route): string {
  return `#${route}`
}
