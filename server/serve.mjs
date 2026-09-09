import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createApi } from "./api.mjs";
const root = resolve("dist");
const api = createApi();
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
};
createServer((req, res) => {
  api(req, res, async () => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      return res.end();
    }
    try {
      const raw = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const path = resolve(root, "." + raw);
      if (!path.startsWith(root + sep) && path !== root) {
        res.writeHead(403);
        return res.end();
      }
      const target = path === root ? resolve(root, "index.html") : path;
      const data = await readFile(target);
      res.writeHead(200, {
        "Content-Type": mime[extname(target)] ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
}).listen(Number(process.env.PORT) || 4174, "127.0.0.1", () =>
  console.log(
    "Command server ready on loopback. Use an authenticated HTTPS reverse proxy before remote access.",
  ),
);
