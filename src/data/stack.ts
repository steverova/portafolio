import gitIcon from '../assets/logos/git.ico'
import zedIcon from '../assets/logos/zed.png'
import vscodeIcon from '../assets/logos/vscode.png'
import visualstudioIcon from '../assets/logos/visualstudio.png'
import datagripIcon from '../assets/logos/datagrip.png'
import riderIcon from '../assets/logos/rider.png'
import opencodeIcon from '../assets/logos/opencode.png'
import kiroIcon from '../assets/logos/kiro.svg'
import claudeIcon from '../assets/logos/claude.svg'
import githubcopilotIcon from '../assets/logos/githubcopilot.svg'
import reactIcon from '../assets/logos/react.svg'
import typescriptIcon from '../assets/logos/typescript.png'
import tailwindIcon from '../assets/logos/tailwindcss.png'
import bootstrapIcon from '../assets/logos/bootstrap.svg'
import muiIcon from '../assets/logos/mui.svg'
import angularIcon from '../assets/logos/angular.svg'
import zustandIcon from '../assets/logos/zustand.ico'
import reacthookformIcon from '../assets/logos/reacthookform.png'
import reactrouterIcon from '../assets/logos/reactrouter.png'
import reactqueryIcon from '../assets/logos/reactquery.svg'
import tanstackIcon from '../assets/logos/tanstack.svg'
import wxtIcon from '../assets/logos/wxt.ico'
import viteIcon from '../assets/logos/vite.svg'
import biomeIcon from '../assets/logos/biome.svg'
import oxlintIcon from '../assets/logos/oxlint.svg'
import vitestIcon from '../assets/logos/vitest.svg'
import nodejsIcon from '../assets/logos/nodejs.png'
import expressIcon from '../assets/logos/express.svg'
import dotnetIcon from '../assets/logos/dotnet.png'
import zodIcon from '../assets/logos/zod.png'
import betterauthIcon from '../assets/logos/betterauth.png'
import drizzleIcon from '../assets/logos/drizzle.ico'
import razorIcon from '../assets/logos/razor.svg'
import blazorIcon from '../assets/logos/blazor.svg'
import mysqlIcon from '../assets/logos/mysql.png'
import postgresqlIcon from '../assets/logos/postgresql.ico'
import sqlserverIcon from '../assets/logos/sqlserver.ico'
import redisIcon from '../assets/logos/redis.png'
import awsIcon from '../assets/logos/aws.png'
import cloudflareIcon from '../assets/logos/cloudflare.ico'
import githubactionsIcon from '../assets/logos/githubactions.svg'
import fedoraIcon from '../assets/logos/fedora.svg'
import caddyIcon from '../assets/logos/caddy.svg'
import pm2Icon from '../assets/logos/pm2.svg'

/** Areas por las que se puede filtrar el stack. */
export const AREAS = ['frontend', 'backend', 'ia', 'datos', 'infra', 'desarrollo'] as const

export type StackArea = (typeof AREAS)[number]

/** Lenguajes por los que se puede filtrar. El orden define el de los botones. */
export const LANGUAGES = ['TypeScript', 'JavaScript', 'C#', 'SQL'] as const

export type StackLanguage = (typeof LANGUAGES)[number]

/** Filtro activo del stack: un valor concreto o `'all'` para no filtrar. */
export type AreaFilter = StackArea | 'all'
export type LanguageFilter = StackLanguage | 'all'

export type StackItem = {
  name: string
  /** Icono (favicon oficial del proyecto) importado como URL. */
  icon: string
  /** Areas a las que pertenece: un item puede estar en varias. */
  areas: StackArea[]
  /** Lenguajes que se tocan al usarlo, si aplica. */
  languages?: StackLanguage[]
}

/**
 * Todo lo que uso para programar: entorno, asistentes, lenguajes,
 * frameworks, datos y servicios.
 */
export const STACK: StackItem[] = [
  // Entorno de trabajo
  { name: 'Git', icon: gitIcon, areas: ['desarrollo'] },
  { name: 'Zed', icon: zedIcon, areas: ['desarrollo'] },
  { name: 'VS Code', icon: vscodeIcon, areas: ['desarrollo'] },
  { name: 'Visual Studio', icon: visualstudioIcon, areas: ['desarrollo'], languages: ['C#'] },
  { name: 'DataGrip', icon: datagripIcon, areas: ['desarrollo', 'datos'], languages: ['SQL'] },
  { name: 'Rider', icon: riderIcon, areas: ['desarrollo'], languages: ['C#'] },
  // Asistentes IA
  { name: 'OpenCode', icon: opencodeIcon, areas: ['ia'] },
  { name: 'Kiro', icon: kiroIcon, areas: ['ia'] },
  { name: 'Claude', icon: claudeIcon, areas: ['ia'] },
  { name: 'GitHub Copilot', icon: githubcopilotIcon, areas: ['ia'] },
  // Interfaz
  { name: 'React', icon: reactIcon, areas: ['frontend'], languages: ['TypeScript', 'JavaScript'] },
  { name: 'TypeScript', icon: typescriptIcon, areas: ['frontend', 'backend'], languages: ['TypeScript'] },
  { name: 'Tailwind CSS', icon: tailwindIcon, areas: ['frontend'] },
  { name: 'Bootstrap', icon: bootstrapIcon, areas: ['frontend'] },
  { name: 'Material UI', icon: muiIcon, areas: ['frontend'], languages: ['TypeScript', 'JavaScript'] },
  { name: 'Angular', icon: angularIcon, areas: ['frontend'], languages: ['TypeScript'] },
  { name: 'Zustand', icon: zustandIcon, areas: ['frontend'], languages: ['TypeScript'] },
  { name: 'React Hook Form', icon: reacthookformIcon, areas: ['frontend'], languages: ['TypeScript'] },
  { name: 'React Router', icon: reactrouterIcon, areas: ['frontend'], languages: ['TypeScript'] },
  { name: 'TanStack Query', icon: reactqueryIcon, areas: ['frontend'], languages: ['TypeScript'] },
  { name: 'TanStack Table', icon: tanstackIcon, areas: ['frontend'], languages: ['TypeScript'] },
  { name: 'WXT', icon: wxtIcon, areas: ['frontend', 'desarrollo'], languages: ['TypeScript'] },
  // Calidad y build
  { name: 'Vite', icon: viteIcon, areas: ['desarrollo'], languages: ['TypeScript'] },
  { name: 'Biome', icon: biomeIcon, areas: ['desarrollo'], languages: ['JavaScript'] },
  { name: 'Oxlint', icon: oxlintIcon, areas: ['desarrollo'] },
  { name: 'Vitest', icon: vitestIcon, areas: ['desarrollo'], languages: ['TypeScript'] },
  // Servidor
  { name: 'Node.js', icon: nodejsIcon, areas: ['backend'], languages: ['JavaScript', 'TypeScript'] },
  { name: 'Express', icon: expressIcon, areas: ['backend'], languages: ['JavaScript', 'TypeScript'] },
  { name: '.NET', icon: dotnetIcon, areas: ['backend'], languages: ['C#'] },
  { name: 'Blazor', icon: blazorIcon, areas: ['frontend'], languages: ['C#'] },
  { name: 'Razor', icon: razorIcon, areas: ['frontend'], languages: ['C#'] },
  { name: 'Zod', icon: zodIcon, areas: ['frontend', 'backend'], languages: ['TypeScript'] },
  { name: 'Better Auth', icon: betterauthIcon, areas: ['backend'], languages: ['TypeScript'] },
  { name: 'Drizzle', icon: drizzleIcon, areas: ['backend', 'datos'], languages: ['TypeScript'] },
  // Datos
  { name: 'MySQL', icon: mysqlIcon, areas: ['datos'], languages: ['SQL'] },
  { name: 'PostgreSQL', icon: postgresqlIcon, areas: ['datos'], languages: ['SQL'] },
  { name: 'SQL Server', icon: sqlserverIcon, areas: ['datos'], languages: ['SQL'] },
  { name: 'Redis', icon: redisIcon, areas: ['datos'] },
  // Nube e infraestructura
  { name: 'AWS', icon: awsIcon, areas: ['infra'] },
  { name: 'Cloudflare', icon: cloudflareIcon, areas: ['infra'] },
  { name: 'GitHub Actions', icon: githubactionsIcon, areas: ['infra'] },
  { name: 'Fedora', icon: fedoraIcon, areas: ['infra'] },
  { name: 'Caddy', icon: caddyIcon, areas: ['infra'] },
  { name: 'PM2', icon: pm2Icon, areas: ['infra'] },
]

/**
 * Aplica los filtros del stack. Un item sin `languages` no coincide con
 * ningun filtro de lenguaje (no se puede afirmar que use ese lenguaje).
 */
export function filterStack(area: AreaFilter, language: LanguageFilter): StackItem[] {
  return STACK.filter((item) => {
    const matchesArea = area === 'all' || item.areas.includes(area)
    const matchesLanguage = language === 'all' || (item.languages?.includes(language) ?? false)

    return matchesArea && matchesLanguage
  })
}
