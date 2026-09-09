/*
 * Tiny zero-dependency static file server for the NEBULA OS renderer.
 * Used in two ways:
 *   1. Inside Electron (main.js) to serve the renderer over http://127.0.0.1
 *   2. As a standalone browser preview:  node server.js
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "renderer");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg"
};

function safeResolve(urlPath) {
  if (urlPath === "/") urlPath = "/index.html";
  // strip query/fragment
  urlPath = urlPath.split("?")[0].split("#")[0];
  let filePath = path.normalize(path.join(ROOT, decodeURIComponent(urlPath)));
  if (!filePath.startsWith(ROOT)) return null;
  return filePath;
}

function serve(req, res) {
  const u = new URL(req.url, "http://localhost");
  let filePath = safeResolve(u.pathname);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      // SPA fallback -> index.html
      filePath = path.join(ROOT, "index.html");
    }
    const ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, (e2, data) => {
      if (e2) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "no-cache",
        "Cross-Origin-Opener-Policy": "same-origin"
      });
      res.end(data);
    });
  });
}

function start({ host = "127.0.0.1", port = 0 } = {}) {
  const server = http.createServer(serve);
  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, host, () => resolve(server));
  });
}

module.exports = { start, ROOT };

if (require.main === module) {
  const host = process.env.HOST || "0.0.0.0";
  const port = Number(process.env.PORT || 5173);
  start({ host, port })
    .then((s) => {
      console.log("\n  ◈ NEBULA OS — live preview\n");
      console.log(`     ➜  http://${host === "0.0.0.0" ? "localhost" : host}:${s.address().port}/\n`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
