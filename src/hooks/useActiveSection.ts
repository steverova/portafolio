import { useEffect, useState } from 'react'
import { ROUTES, type Route } from '../lib/routes'

/**
 * Scroll spy: devuelve la seccion visible actualmente.
 * Observa una franja justo debajo del header sticky (64px) y marca la primera
 * seccion que cae dentro, de modo que el menu siempre refleja donde estas.
 */
export function useActiveSection(): Route {
  const [active, setActive] = useState<Route>(ROUTES[0])

  useEffect(() => {
    const sections = ROUTES.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    )

    if (sections.length === 0) return

    const visibles = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibles.add(entry.target.id)
          else visibles.delete(entry.target.id)
        }

        const first = ROUTES.find((route) => visibles.has(route))
        if (first) setActive(first)
      },
      // Franja de deteccion: desde los 80px superiores hasta el 30% del alto.
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    )

    for (const section of sections) observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return active
}
