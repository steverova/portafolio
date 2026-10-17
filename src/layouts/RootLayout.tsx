import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { useActiveSection } from '../hooks/useActiveSection'

/** Marco comun a todas las rutas: cabecera, contenido y pie. */
export function RootLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const activeSection = useActiveSection()

  // El scroll-spy solo tiene sentido en la home: las demas rutas no tienen anclas.
  const isHome = pathname === '/'

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t('common.skipToContent')}
      </a>

      <Header activeSection={isHome ? activeSection : undefined} />

      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>

      <Footer />

      {/* Restaura el scroll al navegar y baja al ancla de los enlaces `/#seccion`. */}
      <ScrollRestoration />
    </div>
  )
}
