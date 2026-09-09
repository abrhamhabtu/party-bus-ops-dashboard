import { test } from "node:test";
import assert from "node:assert/strict";
import { createRevealClient } from "./reveal.mjs";
import { createApi } from "./api.mjs";
const env = {
  VERIZON_APP_ID: "app-123",
  VERIZON_REST_USERNAME: "integration-user",
  VERIZON_REST_PASSWORD: "secret-password",
  VERIZON_TEST_VEHICLE_NUMBER: "bus/1",
  APP_ACCESS_TOKEN: "operator-secret",
};
test("credentials remain private; location check encodes vehicle and caches token", async () => {
  let now = 1000000;
  const calls = [];
  const client = createRevealClient(
    env,
    async (url, options) => {
      calls.push({ url, ...options });
      return Response.json(
        url.endsWith("/token") ? "private-token" : { Latitude: 36.1 },
      );
    },
    () => now,
  );
  const result = await client.check();
  assert.equal(result.scope, "authentication_and_vehicle_location");
  assert.equal(calls.length, 2);
  assert.equal(
    calls[0].headers.Authorization,
    "Basic " +
      Buffer.from("integration-user:secret-password").toString("base64"),
  );
  assert.ok(calls[1].url.endsWith("/bus%2F1/location"));
  assert.equal(
    calls[1].headers.Authorization,
    "Atmosphere atmosphere_app_id=app-123, Bearer private-token",
  );
  assert.equal(client.state().mode, "demo");
  assert.equal(client.state().cameras, "not_connected");
  assert.doesNotMatch(
    JSON.stringify(client.state()),
    /secret-password|private-token|operator-secret/,
  );
  await assert.rejects(client.check(), { code: "cooldown" });
  now += 180001;
  await client.check();
  assert.equal(calls.length, 3);
});
test("missing configuration never contacts Verizon", async () => {
  let calls = 0;
  const client = createRevealClient({}, async () => {
    calls++;
  });
  await assert.rejects(client.check(), { code: "not_configured" });
  assert.equal(calls, 0);
});
test("provider errors redact response bodies", async () => {
  const client = createRevealClient(
    env,
    async () => new Response("credential-secret", { status: 401 }),
  );
  await assert.rejects(client.check(), { code: "provider_401" });
  assert.doesNotMatch(JSON.stringify(client.state()), /credential-secret/);
  assert.equal(client.state().lastCheck.ok, false);
});
test("concurrent checks share a single provider request", async () => {
  let calls = 0;
  const client = createRevealClient(
    { ...env, VERIZON_TEST_VEHICLE_NUMBER: "" },
    async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 5));
      return Response.json("token");
    },
  );
  await Promise.all([client.check(), client.check()]);
  assert.equal(calls, 1);
});
test("API blocks missing operator keys and cross-origin checks before provider access", async () => {
  let calls = 0;
  const api = createApi(env, {
    state: () => ({ mode: "demo" }),
    check: async () => {
      calls++;
      return { ok: true };
    },
  });
  const invoke = async (headers) => {
    let status, body;
    await api(
      {
        url: "/api/verizon/check",
        method: "POST",
        headers: { host: "localhost:5173", ...headers },
      },
      { writeHead: (s) => (status = s), end: (b) => (body = JSON.parse(b)) },
      () => {},
    );
    return { status, body };
  };
  assert.equal((await invoke({})).status, 401);
  assert.equal(
    (
      await invoke({
        authorization: "Bearer operator-secret",
        origin: "https://other.example",
      })
    ).status,
    403,
  );
  assert.equal(calls, 0);
  assert.equal(
    (
      await invoke({
        authorization: "Bearer operator-secret",
        origin: "http://localhost:5173",
      })
    ).status,
    200,
  );
  assert.equal(calls, 1);
});
