// Serve static pages and relay same-origin API requests to the backend.
import http from "node:http";
import https from "node:https";
import { frontendPath, pageFile } from "./page-paths.js";
import { imageCredits } from "./public/js/shared/image-credits.js";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const directory = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "public",
);
const legacyProductImages = new Map(
  imageCredits
    .filter((credit) => credit.legacyAsset)
    .map((credit) => [credit.legacyAsset, credit.assets[0]]),
);
// Connection-specific headers belong to each individual HTTP hop.
function relayHeaders(headers) {
  const excluded = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "proxy-connection",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    ...(headers.connection || "")
      .toLowerCase()
      .split(",")
      .map((name) => name.trim()),
  ]);
  return Object.fromEntries(
    Object.entries(headers).filter(([name]) => !excluded.has(name)),
  );
}
function relayApi(req, res, url, pathname) {
  const fail = (status) => {
    if (res.destroyed || res.writableEnded) return;
    if (res.headersSent) {
      res.destroy();
      return;
    }
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(
      JSON.stringify({
        ok: false,
        message: "ติดต่อบริการหลังบ้านไม่ได้ กรุณาลองใหม่",
      }),
    );
  };
  try {
    const target = new URL(process.env.API_UPSTREAM || "http://127.0.0.1:3001");
    target.pathname = pathname;
    target.search = url.search;
    const headers = relayHeaders(req.headers);
    delete headers.host;
    const transport = target.protocol === "https:" ? https : http;
    const upstream = transport.request(
      target,
      { method: req.method, headers },
      (response) => {
        response.on("error", () => fail(502));
        res.writeHead(response.statusCode, relayHeaders(response.headers));
        response.pipe(res);
      },
    );
    upstream.on("error", () => fail(502));
    upstream.setTimeout(15000, () => {
      fail(504);
      upstream.destroy();
    });
    res.on("close", () => {
      if (!res.writableFinished) upstream.destroy();
    });
    req.on("error", () => upstream.destroy());
    req.pipe(upstream);
  } catch {
    fail(502);
  }
}
export const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      relayApi(req, res, url, url.pathname);
      return;
    }
    // Legacy media URLs still go through the backend's access checks.
    if (
      url.pathname.startsWith("/payment-proof/") ||
      url.pathname.startsWith("/images/uploads/")
    ) {
      relayApi(req, res, url, "/api" + url.pathname);
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      res.end();
      return;
    }
    if (url.pathname === "/config.js") {
      res.writeHead(200, {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-store",
      });
      res.end(
        "window.BUDDY_API_ORIGIN=" +
          JSON.stringify(process.env.API_ORIGIN || "") +
          ";",
      );
      return;
    }
    // Older demo databases can still point to the original product artwork.
    const photo = legacyProductImages.get(url.pathname);
    if (photo) {
      res.writeHead(302, { Location: photo });
      res.end();
      return;
    }
    // Old navigation URLs redirect to real HTML files. Unknown routes never load index.html.
    const canonical = frontendPath(url.pathname + url.search + url.hash);
    if (canonical !== url.pathname + url.search + url.hash) {
      res.writeHead(302, { Location: canonical });
      res.end();
      return;
    }
    const file = path.resolve(
      directory,
      pageFile(url.pathname) || "." + decodeURIComponent(url.pathname),
    );
    if (!file.startsWith(directory + path.sep) && file !== directory)
      throw Error("Not found");
    let target = file;
    try {
      if (!(await stat(target)).isFile()) throw Error();
    } catch {
      throw Error("Not found");
    }
    const ext = path.extname(target),
      mime = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".woff2": "font/woff2",
        ".ttf": "font/ttf",
      };
    res.writeHead(200, {
      "Content-Type": mime[ext] || "application/octet-stream",
      "Cache-Control": [".html", ".js", ".css"].includes(ext)
        ? "no-cache"
        : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    res.end(req.method === "HEAD" ? undefined : await readFile(target));
  } catch {
    if (
      !path.extname(new URL(req.url, "http://localhost").pathname) ||
      req.url.split("?")[0].endsWith(".html")
    ) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(await readFile(path.join(directory, "404.html")));
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("ไม่พบไฟล์");
  }
});
export async function start(port = Number(process.env.FRONTEND_PORT || 3000)) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, resolve);
  });
  console.log(
    "BuddyGiftfy frontend: http://localhost:" + server.address().port,
  );
  return server;
}
export const stop = () => new Promise((resolve) => server.close(resolve));
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  start().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
