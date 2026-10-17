import { HeroSection } from '../sections/HeroSection'
import { ProjectsSection } from '../sections/ProjectsSection'
import { ToolsSection } from '../sections/ToolsSection'

/**
 * Home: todas las secciones conviven en la misma pagina, asi que la navegacion
 * del menu es por anclas (#proyectos, #herramientas).
 */
export function HomePage() {
  return (
    <>
      <HeroSection />
      <ProjectsSection />
      <ToolsSection />
    </>
  )
}
