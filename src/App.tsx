import { useTranslation } from 'react-i18next'
import { Footer } from './components/layout/Footer'
import { Header } from './components/layout/Header'
import { useActiveSection } from './hooks/useActiveSection'
import { HeroSection } from './sections/HeroSection'
import { ProjectsSection } from './sections/ProjectsSection'
import { ToolsSection } from './sections/ToolsSection'

function App() {
  const { t } = useTranslation()
  const activeSection = useActiveSection()

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t('common.skipToContent')}
      </a>

      <Header activeSection={activeSection} />

      {/* Todas las secciones conviven en la misma pagina; el menu navega por anclas. */}
      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        <HeroSection />
        <ProjectsSection />
        <ToolsSection />
      </main>

      <Footer />
    </div>
  )
}

export default App
