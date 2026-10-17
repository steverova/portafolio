import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { ROUTES, type Route } from '../lib/routes'

/** Altura del header sticky + su margen: la linea que decide la seccion activa. */
const HEADER_OFFSET = 80

/** Tolerancia para el aterrizaje en un ancla, que deja el borde justo en la linea. */
const EPSILON = 4

/**
 * Scroll spy: devuelve la seccion visible actualmente.
 *
 * Se calcula por geometria (la ultima seccion cuyo borde superior ya cruzo la
 * linea del header) y no con IntersectionObserver. Las secciones son contiguas,
 * asi que al bajar a un ancla el borde inferior de la seccion anterior queda
 * pegado a la franja de deteccion: el observer la seguia contando como visible
 * y, al elegir la primera de `ROUTES`, el resaltado se quedaba en la anterior.
 */
export function useActiveSection(): Route {
  const { pathname } = useLocation()
  const [active, setActive] = useState<Route>(ROUTES[0])

  // `pathname` en las deps: al entrar y salir del blog las secciones se montan
  // y desmontan, y hay que reenganchar el seguimiento.
  useEffect(() => {
    const update = () => {
      let current: Route = ROUTES[0]

      for (const id of ROUTES) {
        const top = document.getElementById(id)?.getBoundingClientRect().top
        if (top !== undefined && top <= HEADER_OFFSET + EPSILON) current = id
      }

      setActive(current)
    }

    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        update()
      })
    }

    if (!ROUTES.some((id) => document.getElementById(id))) return

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [pathname])

  return active
}
