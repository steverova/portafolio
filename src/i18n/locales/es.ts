/** Traducciones en español (idioma por defecto). */
export const es = {
  meta: {
    title: 'Portafolio — Desarrollador Full Stack',
    description:
      'Portafolio de Steve, desarrollador full stack: proyectos con React, TypeScript y Angular, y APIs REST en Node.js en la nube. Foco en rendimiento y accesibilidad.',
  },
  common: {
    skipToContent: 'Saltar al contenido',
  },
  nav: {
    hero: 'Inicio',
    proyectos: 'Proyectos',
    herramientas: 'Herramientas',
    mainLabel: 'Navegación principal',
    footerLabel: 'Navegación del pie de página',
    homeAria: '{{name}} — ir al inicio',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
  },
  language: {
    label: 'Idioma',
  },
  site: {
    role: 'Desarrollador Full Stack',
    tagline:
      'Desarrollador full stack que convierte ideas en productos web listos para producción. Construyo interfaces rápidas, accesibles y responsivas con React, TypeScript y Angular, sobre APIs REST en Node.js en la nube, cuidando rendimiento, accesibilidad y cada detalle.',
    location: 'Remoto · Latinoamérica',
  },
  hero: {
    greeting: 'Hola, soy',
    viewProjects: 'Ver proyectos',
    contact: 'Contacto',
  },
  projects: {
    title: 'Proyectos',
    description: 'Experimentos que construyo para el uso del día a día.',
    viewCode: 'Ver código',
    codeAria: '{{title}} — ver código en GitHub (se abre en una nueva pestaña)',
    cta: '¿Trabajamos juntos?',
    items: {
      'zed-fmt-switcher':
        'TUI que configura el formatter de Zed en proyectos JS/TS: Biome u Oxc, con edición mínima del config.',
      'bookmarks-gist':
        'Extensión de Chrome y Firefox que sincroniza tus marcadores entre navegadores usando un GitHub Gist.',
      'kiro-provider':
        'Plugin de OpenCode V2 que añade los modelos de AWS Kiro, con autenticación y bridge local.',
      'my-php-router':
        'Enrutador HTTP minimalista en PHP puro: rutas con métodos, parámetros dinámicos por regex, despacho a controladores y tests con PHPUnit.',
    },
  },
  tools: {
    eyebrow: 'Stack',
    title: 'Herramientas',
    description:
      'Todo lo que uso para programar: entorno, asistentes IA, lenguajes, frameworks y servicios. Filtra por área o por lenguaje.',
  },
  stack: {
    areas: {
      frontend: 'Frontend',
      backend: 'Backend',
      ia: 'IA',
      datos: 'Datos',
      infra: 'Infraestructura',
      desarrollo: 'Desarrollo',
    },
  },
  footer: {
    sections: 'Secciones',
    contact: 'Contacto',
    sendMail: 'Enviar correo',
    rights: '© {{year}} {{name}}. Todos los derechos reservados.',
    built: 'Hecho con React + Tailwind CSS',
  },
} as const
