import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronRight,
  Gauge,
  KeyRound,
  LockKeyhole,
  MapPinned,
  Radio,
  RefreshCw,
  ShieldCheck,
  Video,
} from "lucide-react";
import { fleet, readSaved } from "../lib/data";
type ConnectionState = {
  configured: boolean;
  testVehicleConfigured: boolean;
  operatorKeyConfigured: boolean;
  lastCheck: null | {
    at: string;
    ok: boolean;
    scope?: string;
    message: string;
  };
};
export default function VerizonSetup() {
  const [state, setState] = useState<ConnectionState | null>(null),
    [key, setKey] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [unavailable, setUnavailable] = useState(false),
    [mapping, setMapping] = useState<Record<string, string>>(() =>
      readSaved("vegas-verizon-mapping", {}),
    );
  useEffect(() => {
    try {
      localStorage.setItem("vegas-verizon-mapping", JSON.stringify(mapping));
    } catch {
      /* draft stays in memory for this session */
    }
  }, [mapping]);
  const mappedCount = fleet.filter((v) => mapping[v.id]?.trim()).length;
  async function refresh() {
    try {
      const r = await fetch("/api/verizon/status");
      if (!r.ok || !r.headers.get("content-type")?.includes("application/json"))
        throw Error();
      setState(await r.json());
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/verizon/status", { signal: controller.signal })
      .then((r) => {
        if (
          !r.ok ||
          !r.headers.get("content-type")?.includes("application/json")
        )
          throw Error();
        return r.json();
      })
      .then((data) => {
        setState(data);
        setUnavailable(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setUnavailable(true);
      });
    return () => controller.abort();
  }, []);
  async function check() {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/verizon/check", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
      });
      const data = await r.json();
      setMessage(data.message ?? "Connection check finished.");
      await refresh();
    } catch {
      setMessage(
        "Connection service is unavailable. Start the application server and try again.",
      );
    } finally {
      setBusy(false);
      setKey("");
    }
  }
  return (
    <section className="verizon-setup">
      <div className="setup-intro">
        <div className="verizon-emblem">
          <Radio size={28} />
        </div>
        <div>
          <span className="micro-label">CONNECTED OPERATIONS</span>
          <h2>Verizon Connect Reveal</h2>
          <p>Bring your fleet’s location data into one operational view.</p>
        </div>
        <span className="connection-pending">
          {state?.lastCheck?.ok
            ? "API verified · mapping pending"
            : "Not connected"}
        </span>
      </div>
      <div className="setup-grid">
        <div className="setup-steps">
          <h3>Your connection checklist</h3>
          <div className="setup-step">
            <b>01</b>
            <div>
              <strong>Authorize the integration in Reveal</strong>
              <p>
                Open your profile → Marketplace → API Integrations → Get
                started. Use your company name for an internal integration.
              </p>
              <a
                href="https://reveal-help.verizonconnect.com/hc/en-us/articles/5491815998099-Create-API-and-webhook-integrations"
                target="_blank"
                rel="noreferrer"
              >
                Official setup guide <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
          <div className="setup-step">
            <b>02</b>
            <div>
              <strong>Register your private developer app</strong>
              <p>
                Verizon sends REST integration credentials to the authorized
                developer. Register an app in the developer portal to obtain its
                app ID.
              </p>
              <a
                href="https://fim.us.fleetmatics.com/"
                target="_blank"
                rel="noreferrer"
              >
                Open developer portal <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
          <div className="setup-step">
            <b>03</b>
            <div>
              <strong>Configure the server and verify access</strong>
              <p>
                Your developer adds the app ID and integration credentials to
                the server environment. Use the actual Reveal vehicle number for
                the optional location check.
              </p>
            </div>
          </div>
          <div className="setup-step">
            <b>04</b>
            <div>
              <strong>Map vehicles and validate a supervised shift</strong>
              <p>
                Review your account’s location payload, match it to your fleet,
                and confirm GPS freshness before enabling live operations.
              </p>
            </div>
          </div>
        </div>
        <div className="connection-test">
          <div className="section-heading">
            <h3>Connection diagnostics</h3>
            <button
              className="quiet-button"
              aria-label="Refresh connection status"
              onClick={refresh}
            >
              <RefreshCw size={15} />
            </button>
          </div>
          {[
            {
              label: "Server connection service",
              ready: !!state && !unavailable,
            },
            { label: "REST credentials + app ID", ready: !!state?.configured },
            {
              label: "Test vehicle number",
              ready: !!state?.testVehicleConfigured,
            },
            {
              label: "Operator access key",
              ready: !!state?.operatorKeyConfigured,
            },
          ].map((s) => (
            <div className="connection-check-row" key={s.label}>
              <span>{s.label}</span>
              <b className={s.ready ? "ready" : ""}>
                {s.ready ? (
                  <>
                    <Check size={12} /> Ready
                  </>
                ) : (
                  "Pending"
                )}
              </b>
            </div>
          ))}
          {unavailable && (
            <p className="setup-help">
              This static preview has no connection service. Use the development
              server or run <code>npm run serve</code> after building.
            </p>
          )}
          <label className="operator-key">
            <KeyRound size={14} /> Operator access key
            <input
              aria-label="Operator access key"
              autoComplete="off"
              type="password"
              placeholder="Server operator key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </label>
          <button
            className="connection-test-button"
            disabled={
              !state?.configured ||
              !state?.operatorKeyConfigured ||
              !key ||
              busy
            }
            onClick={check}
          >
            {busy ? "Checking access…" : "Verify read-only API access"}
            <ChevronRight size={15} />
          </button>
          <p className="setup-help">
            <LockKeyhole size={12} /> Credentials stay on the server. This key
            is cleared after each check.
          </p>
          {message && (
            <p className="connection-result" role="status">
              {message}
            </p>
          )}
          {state?.lastCheck && (
            <p className="setup-help">
              Last check: {new Date(state.lastCheck.at).toLocaleString()} ·{" "}
              {state.lastCheck.ok ? "Verified" : "Needs attention"}
            </p>
          )}
          <div className="camera-access-note">
            <Video size={18} />
            <div>
              <strong>Dashcam access is separate</strong>
              <p>
                Road-facing and driver-facing video require the relevant Verizon
                product, API permissions, and verified footage endpoints. A
                successful GPS check does not enable cameras.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="vehicle-mapping">
        <div className="section-heading">
          <div>
            <h3>Vehicle mapping</h3>
            <p className="subtle">
              Reveal identifies vehicles by its own device/vehicle number, not
              by the names your team already uses. Pair each one so a Reveal
              reading resolves to a bus your team recognizes.
            </p>
          </div>
          <span className="mapping-progress">
            {mappedCount} / {fleet.length} mapped
          </span>
        </div>
        <div className="mapping-list">
          {fleet.map((v) => (
            <div className="mapping-row" key={v.id}>
              <div className="mapping-vehicle">
                <strong>{v.name}</strong>
                <span>
                  {v.id} · {v.driver}
                </span>
              </div>
              <label className="mapping-input">
                <span className="micro-label">Reveal vehicle number</span>
                <input
                  aria-label={`Reveal vehicle number for ${v.name}`}
                  placeholder="e.g. 104822"
                  value={mapping[v.id] ?? ""}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [v.id]: e.target.value }))
                  }
                />
              </label>
            </div>
          ))}
        </div>
        <p className="setup-help">
          This mapping is a local draft saved in this browser only — it
          previews how one roster-wide pairing would replace the single
          <code> VERIZON_TEST_VEHICLE_NUMBER</code> the server supports today.
          Live mode still requires validating your account's vehicle-number
          format against this roster.
        </p>
      </div>
      <div className="connection-unlocks">
        <h3>What connecting unlocks</h3>
        <p className="subtle">
          None of this is active yet. Once GPS mapping is verified, these
          replace their demo equivalents one at a time.
        </p>
        {[
          {
            icon: Radio,
            title: "Live GPS in place of the demo replay",
            text: "Real vehicle positions and the 24-hour replay scrubber give way to an actual live feed once payload mapping is verified.",
          },
          {
            icon: Gauge,
            title: "Telematics-driven ETAs",
            text: "Pickup and shuttle ETAs come from measured vehicle speed and position instead of the scheduled demo legs.",
          },
          {
            icon: AlertTriangle,
            title: "Safety and harsh-event alerts",
            text: "Hard-brake, speeding, and idle-time events can feed the same maintenance and notifications inbox used for demo alerts today.",
          },
          {
            icon: MapPinned,
            title: "Geofenced arrival and departure",
            text: "T1/T3, hotel, and Venetian geofences can advance a shuttle's cycle automatically, replacing the manual departure/arrival buttons.",
          },
          {
            icon: Video,
            title: "Dashcam clip retrieval — separate approval",
            text: "Road-facing and driver-facing footage tied to a trip or event requires its own Verizon video product and permissions beyond GPS access.",
          },
        ].map((x) => (
          <div className="driver-feature" key={x.title}>
            <x.icon size={22} />
            <div>
              <h3>{x.title}</h3>
              <p>{x.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="setup-boundary">
        <ShieldCheck size={17} />
        <span>
          Demo data remains active until the live-data mapping and account
          permissions are verified. Your regular Reveal password is not entered
          here.
        </span>
      </div>
    </section>
  );
}
