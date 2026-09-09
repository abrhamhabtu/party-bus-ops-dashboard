/** Read-only Verizon Reveal adapter. Credentials stay in this server process. */
const BASE = "https://fim.api.us.fleetmatics.com";
export class RevealError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
export function createRevealClient(
  env = process.env,
  fetcher = fetch,
  clock = Date.now,
) {
  let token = "",
    expires = 0,
    lastAttempt = 0,
    lastStatus = null,
    inflight = null;
  const config = () => ({
    app: env.VERIZON_APP_ID,
    user: env.VERIZON_REST_USERNAME,
    password: env.VERIZON_REST_PASSWORD,
    vehicle: env.VERIZON_TEST_VEHICLE_NUMBER,
  });
  const state = () => {
    const c = config();
    return {
      configured: !!(c.app && c.user && c.password),
      testVehicleConfigured: !!c.vehicle,
      operatorKeyConfigured: !!env.APP_ACCESS_TOKEN,
      lastCheck: lastStatus,
      cameras: "not_connected",
      mode: "demo",
    };
  };
  async function request(path, authorization) {
    let response;
    try {
      response = await fetcher(BASE + path, {
        method: "GET",
        redirect: "error",
        headers: { Authorization: authorization, Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new RevealError(
        "unreachable",
        "Verizon could not be reached. Try again shortly.",
      );
    }
    if (!response.ok)
      throw new RevealError(
        `provider_${response.status}`,
        response.status === 401
          ? "Verizon rejected the integration credentials."
          : response.status === 403
            ? "This integration does not have permission for the requested API."
            : response.status === 429
              ? "Verizon rate limit reached. Wait before retrying."
              : `Verizon returned HTTP ${response.status}.`,
      );
    const text = await response.text();
    if (text.length > 1000000)
      throw new RevealError(
        "payload_size",
        "Provider response exceeded the permitted size.",
      );
    try {
      return JSON.parse(text);
    } catch {
      throw new RevealError(
        "invalid_response",
        "Provider response was not valid JSON.",
      );
    }
  }
  async function authorize() {
    if (token && expires > clock()) return token;
    const c = config();
    if (!c.app || !c.user || !c.password)
      throw new RevealError(
        "not_configured",
        "Server integration credentials have not been configured.",
      );
    if (!/^[\w.-]+$/.test(c.app))
      throw new RevealError(
        "invalid_config",
        "Verify the integration app ID on the server.",
      );
    const body = await request(
      "/token",
      "Basic " + Buffer.from(c.user + ":" + c.password).toString("base64"),
    );
    const value =
      typeof body === "string"
        ? body
        : (body?.Token ?? body?.token ?? body?.access_token);
    if (typeof value !== "string" || !value || /[\r\n]/.test(value))
      throw new RevealError(
        "token_schema",
        "The token response format needs verification against your account documentation.",
      );
    token = value;
    expires = clock() + 18 * 60 * 1000;
    return token;
  }
  async function performCheck() {
    const c = config();
    await authorize();
    if (c.vehicle) {
      await request(
        "/rad/v1/vehicles/" + encodeURIComponent(c.vehicle) + "/location",
        `Atmosphere atmosphere_app_id=${c.app}, Bearer ${token}`,
      );
    }
    lastStatus = {
      at: new Date(clock()).toISOString(),
      ok: true,
      scope: c.vehicle
        ? "authentication_and_vehicle_location"
        : "authentication_only",
      message: c.vehicle
        ? "API credentials and the configured vehicle location endpoint verified. Live mapping still requires payload review."
        : "API credentials verified. Configure a test vehicle number to verify location access.",
    };
    return lastStatus;
  }
  async function check() {
    if (inflight) return inflight;
    if (lastAttempt && clock() - lastAttempt < 180000)
      throw new RevealError(
        "cooldown",
        "Checks are limited to once every 3 minutes to respect provider polling guidance.",
      );
    lastAttempt = clock();
    inflight = performCheck()
      .catch((error) => {
        token = "";
        expires = 0;
        lastStatus = {
          at: new Date(clock()).toISOString(),
          ok: false,
          message:
            error instanceof RevealError
              ? error.message
              : "Connection check failed.",
        };
        throw error;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  }
  return { state, check };
}
