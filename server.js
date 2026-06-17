// ============================================================
// SERVER.JS — Mirr Oils
// Petit serveur local SANS dépendance (Node natif uniquement).
//   • Sert les fichiers statiques (HTML, JS, data.json…)
//   • Écrit data.json à chaque sauvegarde via POST /api/save
//
// Lancement :  node server.js
// Puis ouvrir : http://localhost:3000
// ============================================================
const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT      = 3000;
const ROOT      = __dirname;
const INDEX     = 'index.html';            // page d'accueil
const DATA_FILE = path.join(ROOT, 'data.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon'
};

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(url.parse(req.url).pathname);

  // --- API : écriture de data.json -------------------------
  if (req.method === 'POST' && pathname === '/api/save') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20 * 1024 * 1024) req.destroy();   // garde-fou 20 Mo
    });
    req.on('end', () => {
      try {
        const data   = JSON.parse(body);                   // valide le JSON reçu
        const pretty = JSON.stringify(data, null, 2);
        fs.writeFile(DATA_FILE, pretty, 'utf8', err => {
          if (err) {
            console.error('[Server] Échec écriture data.json :', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end('{"ok":false,"error":"write failed"}');
            return;
          }
          console.log('[Server] data.json mis à jour (' + pretty.length + ' octets)');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{"ok":true}');
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end('{"ok":false,"error":"invalid JSON"}');
      }
    });
    return;
  }

  // --- Fichiers statiques (GET) ----------------------------
  const rel      = pathname === '/' ? INDEX : pathname.replace(/^\/+/, '');
  const filePath = path.join(ROOT, rel);

  // Sécurité basique : interdit de sortir du dossier du projet
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 — fichier introuvable : ' + rel);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log('============================================');
  console.log('  Mirr Oils — serveur local démarré');
  console.log('  →  http://localhost:' + PORT);
  console.log('  data.json sera mis à jour à chaque sauvegarde');
  console.log('  (Ctrl+C pour arrêter)');
  console.log('============================================');
});
