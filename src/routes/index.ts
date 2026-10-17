import { createBrowserRouter } from 'react-router'
import { routes } from './routes.ts'

/**
 * Router de la app. `basename` sale del `base` de vite.config.ts (Vite lo expone
 * con barra final; el router lo quiere sin), asi las rutas funcionan bajo el
 * subdirectorio /portafolio/ de GitHub Pages.
 */
export const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL.replace(/\/$/, ''),
})
