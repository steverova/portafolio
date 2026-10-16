import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AreaFilter, LanguageFilter } from '../data/stack'
import { Container } from '../components/ui/Container'
import { SectionHeader } from '../components/ui/SectionHeader'
import { StackFilters } from '../components/ui/StackFilters'
import { StackMarquee } from '../components/ui/StackMarquee'
import { Section } from '../components/layout/Section'
import Ferrofluid from '../components/backgrounds/Ferrofluid'

export function ToolsSection() {
  const { t } = useTranslation()
  const [area, setArea] = useState<AreaFilter>('all')
  const [language, setLanguage] = useState<LanguageFilter>('all')

  return (
    <Section id="herramientas" labelledBy="herramientas-title" className="relative overflow-hidden">
      {/*
        Fondo animado (React Bits - Ferrofluid). Es decorativo:
        - pointer-events-none: no intercepta clics. La interaccion con el raton
          la escucha el propio componente en window.
        - Se pausa solo cuando sale de pantalla (trae su propio IntersectionObserver).
        - dpr=1 para no multiplicar el trabajo de GPU en pantallas retina.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Ferrofluid
          colors={['#ffc2c6', '#e10717', '#ff5a63']}
          brightness={0.9}
          speed={0.4}
          scale={1.6}
          spikeHeight={0.9}
          sharpness={2.5}
          tilt={48}
          turbulence={0.9}
          fluidity={0.5}
          magnetism={1}
          flowDirection="down"
          mouseInteraction
          mouseStrength={0.8}
          mouseRadius={0.22}
          clickPulse
          intro
          dpr={1}
        />
      </div>

      {/* Velo: baja el contraste del fondo para que el texto siga siendo legible */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-background/75" />

      <Container className="relative">
        <SectionHeader
          id="herramientas-title"
          title={t('tools.title')}
          description={t('tools.description')}
        />

        <StackFilters
          area={area}
          language={language}
          onAreaChange={setArea}
          onLanguageChange={setLanguage}
        />

        <StackMarquee area={area} language={language} />
      </Container>
    </Section>
  )
}
