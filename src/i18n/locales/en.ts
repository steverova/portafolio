/** English translations. */
export const en = {
  meta: {
    title: 'Portfolio — Full Stack Developer',
    description:
      "Steve's portfolio, full stack developer: projects with React, TypeScript and Angular, and REST APIs in Node.js on the cloud. Focused on performance and accessibility.",
  },
  common: {
    skipToContent: 'Skip to content',
  },
  nav: {
    hero: 'Home',
    proyectos: 'Projects',
    herramientas: 'Tools',
    mainLabel: 'Main navigation',
    footerLabel: 'Footer navigation',
    homeAria: '{{name}} — go to home',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  language: {
    label: 'Language',
  },
  site: {
    role: 'Full Stack Developer',
    tagline:
      'Full stack developer who turns ideas into production-ready web products. I build fast, accessible and responsive interfaces with React, TypeScript and Angular, backed by REST APIs in Node.js running in the cloud — caring about performance, accessibility and every detail.',
    location: 'Remote · Latin America',
  },
  hero: {
    greeting: "Hi, I'm",
    viewProjects: 'View projects',
    contact: 'Contact',
  },
  projects: {
    title: 'Projects',
    description: 'Experiments I build for everyday use.',
    viewCode: 'View code',
    codeAria: '{{title}} — view code on GitHub (opens in a new tab)',
    cta: "Let's work together?",
    items: {
      'zed-fmt-switcher':
        "TUI that configures Zed's formatter in JS/TS projects: Biome or Oxc, with minimal config edits.",
      'bookmarks-gist':
        'Chrome and Firefox extension that syncs your bookmarks across browsers using a GitHub Gist.',
      'kiro-provider':
        'OpenCode V2 plugin that adds AWS Kiro models, with authentication and a local bridge.',
      'my-php-router':
        'Minimalist HTTP router in pure PHP: method-based routes, regex dynamic parameters, controller dispatch and PHPUnit tests.',
    },
  },
  tools: {
    title: 'Tools',
    description:
      'Everything I use to build software: environment, AI assistants, languages, frameworks and services. Filter by area or language.',
  },
  stack: {
    filter: {
      area: 'Area',
      language: 'Language',
      allAreas: 'All',
      allLanguages: 'All',
      empty: 'No tools match that combination. Try another filter.',
    },
    areas: {
      frontend: 'Frontend',
      backend: 'Backend',
      ia: 'AI',
      datos: 'Data',
      infra: 'Infrastructure',
      desarrollo: 'Development',
    },
  },
  footer: {
    sections: 'Sections',
    contact: 'Contact',
    sendMail: 'Send email',
    rights: '© {{year}} {{name}}. All rights reserved.',
    built: 'Built with React + Tailwind CSS',
  },
} as const
