import express, { type Express } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { type Server } from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(message: string, source = 'express') {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  try {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server } },
      appType: 'custom',
      root: path.join(__dirname, '../client'),
    });

    // Middleware do Vite
    app.use(vite.middlewares);

    // Tratamento SPA para desenvolvimento
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const template = await fs.promises.readFile(
          path.join(__dirname, '../client/index.html'),
          'utf-8'
        );
        
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        if (e instanceof Error) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });

    log('Vite middleware configurado para desenvolvimento');
  } catch (err) {
    log(`Erro ao configurar Vite: ${err instanceof Error ? err.message : String(err)}`, 'error');
    process.exit(1);
  }
}

export function serveStatic(app: Express) {
  const clientDistPath = path.join(__dirname, '../dist/client');
  
  if (!fs.existsSync(clientDistPath)) {
    throw new Error(
      `Diretório de build não encontrado: ${clientDistPath}\nExecute 'npm run build' primeiro.`
    );
  }

  // Servir arquivos estáticos
  app.use(express.static(clientDistPath, {
    index: false,
    redirect: false,
    extensions: ['html', 'js', 'css', 'json'],
  }));

  // Rota fallback para SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });

  log(`Servindo arquivos estáticos de: ${clientDistPath}`);
}