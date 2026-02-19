import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// --- DODAJ TO: Middleware do CSP ---
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https://lh3.googleusercontent.com https://imagedelivery.net https://res.cloudinary.com https://*.cloudinary.com; " +
    "connect-src 'self' http://localhost:3000 http://localhost:4200 ws://localhost:4200 https://accounts.google.com https://oauth2.googleapis.com https://mechanicalshopbackend.onrender.com; " +
    "frame-src 'self' https://accounts.google.com;"
  );
  next();
});
// -----------------------------------

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 * Jeśli Angular SSR z jakiegoś powodu nie wygeneruje odpowiedzi,
 * robimy fallback do index.html (SPA-style), żeby deep linki typu /items/3 działały.
 */
app.use((req, res, next) => {
  // Pomiń requesty do statycznych plików (js, css, images, fonts, etc.)
  // Te powinny być obsługiwane przez express.static middleware powyżej
  const staticFileExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.webp'];
  const isStaticFile = staticFileExtensions.some(ext => req.url.endsWith(ext));
  
  if (isStaticFile) {
    // #region agent log
    fetch('http://127.0.0.1:7389/ingest/d4bc3059-1bec-4ee6-bc32-5de3f01e7c26',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'260e7d'},body:JSON.stringify({sessionId:'260e7d',location:'server.ts:50',message:'Skipping SSR for static file',data:{url:req.url},timestamp:Date.now(),runId:'run2',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return next(); // Przekaż do następnego middleware (express.static powinien to obsłużyć)
  }

  // #region agent log
  const logData = {url: req.url, method: req.method, timestamp: Date.now()};
  fetch('http://127.0.0.1:7389/ingest/d4bc3059-1bec-4ee6-bc32-5de3f01e7c26',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'260e7d'},body:JSON.stringify({sessionId:'260e7d',location:'server.ts:55',message:'SSR request received',data:logData,timestamp:Date.now(),runId:'run2',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  angularApp
    .handle(req)
    .then((response) => {
      // #region agent log
      fetch('http://127.0.0.1:7389/ingest/d4bc3059-1bec-4ee6-bc32-5de3f01e7c26',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'260e7d'},body:JSON.stringify({sessionId:'260e7d',location:'server.ts:61',message:'SSR response ready',data:{hasResponse:!!response,url:req.url},timestamp:Date.now(),runId:'run2',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (response) {
        // Standardowa odpowiedź SSR
        return writeResponseToNodeResponse(response, res);
      }

      // Fallback: zwróć index.html z buildu przeglądarkowego
      // #region agent log
      fetch('http://127.0.0.1:7389/ingest/d4bc3059-1bec-4ee6-bc32-5de3f01e7c26',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'260e7d'},body:JSON.stringify({sessionId:'260e7d',location:'server.ts:69',message:'SSR fallback to index.html',data:{url:req.url},timestamp:Date.now(),runId:'run2',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const indexPath = join(browserDistFolder, 'index.html');
      return res.sendFile(indexPath, (err) => {
        if (err) {
          // Jeśli plik nie istnieje (np. w dev mode), zwróć 404 zamiast crashować
          res.status(404).send('Not Found');
        }
      });
    })
    .catch((err) => {
      // #region agent log
      fetch('http://127.0.0.1:7389/ingest/d4bc3059-1bec-4ee6-bc32-5de3f01e7c26',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'260e7d'},body:JSON.stringify({sessionId:'260e7d',location:'server.ts:77',message:'SSR error',data:{error:err?.message,url:req.url},timestamp:Date.now(),runId:'run2',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      next(err);
    });
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
