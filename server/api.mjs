import { timingSafeEqual } from "node:crypto";
import { createRevealClient, RevealError } from "./reveal.mjs";
export function createApi(env = process.env, client = createRevealClient(env)) {
  const send = (res, status, value) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(value));
  };
  return async function api(req, res, next) {
    const path = req.url?.split("?")[0];
    if (!path?.startsWith("/api/")) return next();
    if (path === "/api/verizon/status" && req.method === "GET")
      return send(res, 200, client.state());
    if (path !== "/api/verizon/check" || req.method !== "POST")
      return send(res, 404, {
        error: "not_found",
        message: "API route not found.",
      });
    // Browser mutation requests must be same-origin. No CORS is enabled.
    const origin = req.headers.origin;
    if (origin) {
      let host;
      try {
        host = new URL(origin).host;
      } catch {
        return send(res, 403, { error: "origin", message: "Origin rejected." });
      }
      if (host !== req.headers.host)
        return send(res, 403, { error: "origin", message: "Origin rejected." });
    }
    const expected = env.APP_ACCESS_TOKEN,
      actual = req.headers.authorization?.replace(/^Bearer /, "");
    if (!expected)
      return send(res, 503, {
        error: "operator_key_missing",
        message:
          "Configure the server operator access key before testing an integration.",
      });
    if (
      !actual ||
      Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
    )
      return send(res, 401, {
        error: "unauthorized",
        message: "The operator access key is incorrect.",
      });
    try {
      return send(res, 200, await client.check());
    } catch (e) {
      return send(
        res,
        e instanceof RevealError && e.code === "cooldown" ? 429 : 502,
        {
          error: e instanceof RevealError ? e.code : "connection_failed",
          message:
            e instanceof RevealError ? e.message : "Connection check failed.",
        },
      );
    }
  };
}
