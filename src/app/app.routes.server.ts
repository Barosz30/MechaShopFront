import { RenderMode, ServerRoute } from '@angular/ssr';

// Wszystkie trasy w trybie Server (SSR w runtime). Prerender przy buildzie
// na Renderze powodował timeout – brak serwera/API w środowisku buildu.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
