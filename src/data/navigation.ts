import type { Route } from '../lib/routes'

/**
 * Enlaces del menu principal. El orden define el orden en la navegacion.
 * La etiqueta visible se resuelve con i18n usando la clave `nav.{id}`.
 */
export const NAV_ITEMS: Route[] = ['hero', 'proyectos', 'herramientas']
