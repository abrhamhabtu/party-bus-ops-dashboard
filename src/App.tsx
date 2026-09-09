import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  Clock,
  LayoutDashboard,
  Plus,
  Radio,
  Route,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import Operations from "./components/Operations";
import NewTrip from "./components/NewTrip";
import { initialTrips, readSaved, type Trip } from "./lib/data";
import "./App.css";
import "./components/Operations.css";
type View = "Overview" | "Dispatch" | "Shuttles" | "Drivers" | "Integrations";
function App() {
  const [view, setView] = useState<View>("Overview"),
    [trips, setTrips] = useState<Trip[]>(() =>
      readSaved("vegas-trips", initialTrips),
    ),
    [modal, setModal] = useState(false),
    [toast, setToast] = useState(""),
    [alerts, setAlerts] = useState(false),
    [resolved, setResolved] = useState(false),
    [shiftEnd, setShiftEnd] = useState<number | null>(null),
    [now, setNow] = useState(() => Date.now());
  const notify = (s: string) => setToast(s);
  useEffect(() => {
    try {
      localStorage.setItem("vegas-trips", JSON.stringify(trips));
    } catch {
      queueMicrotask(() =>
        setToast(
          "Browser storage unavailable. Changes will last for this session.",
        ),
      );
    }
  }, [trips]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
    }, 4000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!shiftEnd) return;
    const timer = setTimeout(
      () => {
        setShiftEnd(null);
        setToast("Shift ended. Demo tracking stopped automatically.");
      },
      Math.max(0, shiftEnd - now),
    );
    return () => clearTimeout(timer);
  }, [shiftEnd, now]);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModal(false);
        setAlerts(false);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  useEffect(() => {
    if (!modal && !alerts) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, select, a[href], [tabindex="0"]',
        ),
      );
    if (!dialog.contains(document.activeElement)) focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable(),
        first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    dialog.addEventListener("keydown", trap);
    return () => {
      dialog.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [modal, alerts]);
  function exportTrips() {
    const rows = [
      [
        "Trip",
        "Time",
        "Guest",
        "Pickup",
        "Destination",
        "Passengers",
        "Vehicle",
        "Status",
      ],
      ...trips.map((t) => [
        t.id,
        t.time,
        t.guest,
        t.pickup,
        t.dropoff,
        String(t.passengers),
        t.vehicle,
        t.status,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map(
            (cell) =>
              '"' +
              (/^[=+@-]/.test(cell) ? "'" : "") +
              cell.replaceAll('"', '""') +
              '"',
          )
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "vegas-control-dispatch.csv";
    a.click();
    URL.revokeObjectURL(url);
    notify("Dispatch manifest exported.");
  }
  return (
    <div
      className={`app-shell ${view === "Overview" || view === "Shuttles" ? "map-workspace" : "standard-workspace"}`}
    >
      <aside className="rail">
        <a
          className="brand-mark"
          href="#"
          aria-label="Vegas Control home"
          onClick={() => setView("Overview")}
        >
          <Zap size={23} fill="currentColor" />
        </a>
        <div className="rail-nav">
          {(
            [
              { name: "Overview", icon: LayoutDashboard },
              { name: "Dispatch", icon: CalendarDays },
              { name: "Shuttles", icon: Route },
              { name: "Drivers", icon: Users },
              { name: "Integrations", icon: SlidersHorizontal },
            ] as const
          ).map((n) => (
            <button
              key={n.name}
              className={view === n.name ? "rail-button active" : "rail-button"}
              title={n.name}
              aria-label={n.name === "Shuttles" ? "Shuttling" : n.name}
              onClick={() => {
                setView(n.name);
              }}
            >
              <n.icon size={20} />
              <span>{n.name === "Shuttles" ? "Shuttling" : n.name}</span>
            </button>
          ))}
        </div>
        <button
          className="rail-button"
          title="Integration settings"
          onClick={() => setView("Integrations")}
        >
          <Settings2 size={20} />
        </button>
        <div className="avatar">AC</div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="brand">
            VEGAS<span>CONTROL</span>
            <span className="brand-divider" />
            <span className="company">Discreet Transportation</span>
          </div>
          <div className="top-actions">
            <span className="demo-tag">
              <i /> DEMO WORKSPACE
            </span>
            <span className="timezone">
              Las Vegas, NV <span>· PDT</span>
            </span>
            <button
              className="icon-button notification"
              aria-label="Notifications"
              onClick={() => setAlerts(!alerts)}
            >
              <Bell size={18} />
              {!resolved && <i />}
            </button>
            <div className="avatar small">AC</div>
          </div>
        </header>
        {view !== "Overview" && view !== "Shuttles" && (
          <div className="page-heading">
            <div>
              <div className="eyebrow">VEGAS CONTROL / WORKSPACE</div>
              <h1>
                {view === "Dispatch"
                  ? "Dispatch board"
                  : view === "Drivers"
                    ? "Driver workspace"
                    : "Connected operations"}
                <span className="live-pill">
                  <i />
                  Demo workspace
                </span>
              </h1>
              <p>
                {view === "Dispatch"
                  ? "The right vehicle, in the right place, at the right time."
                  : view === "Drivers"
                    ? "A simpler shift, from the first pickup to the last drop-off."
                    : "Your existing tools. One operational picture."}
              </p>
            </div>
            <div className="heading-actions">
              <span className="date">
                <CalendarDays size={15} /> Wed, Sep 9, 2026
              </span>
              <button className="primary" onClick={() => setModal(true)}>
                <Plus size={17} /> New trip
              </button>
            </div>
          </div>
        )}
        {(view === "Overview" || view === "Shuttles") && (
          <Operations
            shuttle={view === "Shuttles"}
            onMode={(value) => setView(value ? "Shuttles" : "Overview")}
            onNewTrip={() => setModal(true)}
            onIntegrations={() => setView("Integrations")}
          />
        )}
        {view === "Dispatch" && (
          <section className="content-panel">
            <div className="panel-heading">
              <h2>
                Tonight’s manifest{" "}
                <span className="subtle">{trips.length} trips</span>
              </h2>
              <button className="secondary" onClick={exportTrips}>
                <ArrowDownToLine size={16} /> Export CSV
              </button>
            </div>
            <div className="dispatch-list">
              {trips.map((t) => (
                <article className="trip-card" key={t.id}>
                  <div className="trip-time">
                    {t.time}
                    <small>{t.id}</small>
                  </div>
                  <div className="trip-main">
                    <h3>{t.guest}</h3>
                    <p>
                      {t.pickup} <ArrowRight size={14} /> {t.dropoff}
                    </p>
                    <span>
                      {t.passengers} passengers · {t.vehicle}
                    </span>
                  </div>
                  <span className="status-pill">{t.status}</span>
                  {t.status !== "Completed" && (
                    <button
                      className="secondary"
                      onClick={() => {
                        setTrips(
                          trips.map((x) =>
                            x.id === t.id
                              ? {
                                  ...x,
                                  status:
                                    x.status === "In progress"
                                      ? "Completed"
                                      : "In progress",
                                }
                              : x,
                          ),
                        );
                        notify("Demo trip updated.");
                      }}
                    >
                      {t.status === "In progress"
                        ? "Complete trip"
                        : "Start trip"}{" "}
                      <ArrowRight size={14} />
                    </button>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
        {view === "Drivers" && (
          <div className="driver-layout">
            <section className="driver-phone">
              <div className="phone-top">
                <Zap size={20} /> VEGAS CONTROL <span>DRIVER</span>
              </div>
              <div className="driver-greeting">
                <span>YOUR SHIFT, SIMPLIFIED</span>
                <h2>Good evening, Marcus.</h2>
                <p>Buffalo · DL-01</p>
              </div>
              <div className={"shift-status " + (shiftEnd ? "on" : "")}>
                <Radio size={20} />
                <div>
                  <strong>
                    {shiftEnd
                      ? "On shift · demo tracking active"
                      : "Off shift · tracking is off"}
                  </strong>
                  <p>
                    {shiftEnd
                      ? `Ends ${new Date(shiftEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · this browser session`
                      : "Your location is not being collected."}
                  </p>
                </div>
              </div>
              <div className="shift-details">
                <span>
                  Shift length<strong>8 hours</strong>
                </span>
                <span>
                  Assigned vehicle<strong>Buffalo</strong>
                </span>
                <span>
                  Next pickup<strong>Bellagio · 20:15</strong>
                </span>
              </div>
              <button
                className="primary wide"
                onClick={() => {
                  setShiftEnd(
                    shiftEnd ? null : Date.now() + 8 * 60 * 60 * 1000,
                  );
                  notify(
                    shiftEnd
                      ? "Shift ended. Demo tracking stopped."
                      : "Demo shift started. No device location is collected.",
                  );
                }}
              >
                {shiftEnd ? "End shift" : "Start demo shift"}
                <ArrowRight size={17} />
              </button>
              <p className="driver-note">
                <ShieldCheck size={15} /> Demo only. No phone GPS is collected.
              </p>
            </section>
            <section className="driver-explainer">
              <div className="eyebrow">BUILT AROUND YOUR DRIVERS</div>
              <h2>
                Clock in.
                <br />
                Stay connected.
                <br />
                Clock out.
              </h2>
              <p>
                A driver-first experience for phones, with a clear tracking
                indicator and automatic shift expiry.
              </p>
              {[
                {
                  icon: Clock,
                  title: "Shift-bound location sharing",
                  text: "The demo automatically stops its tracking state at shift end and checks expiry when the page resumes.",
                },
                {
                  icon: Smartphone,
                  title: "Ready for the mobile workflow",
                  text: "This responsive preview models driver check-in. Reliable background GPS needs a native app and device permissions.",
                },
                {
                  icon: ShieldCheck,
                  title: "A production privacy boundary",
                  text: "The live service must enforce expiry on the server, revoke shift tokens, and reject off-shift location updates.",
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
            </section>
          </div>
        )}
        {view === "Integrations" && (
          <div className="integration-grid">
            {[
              {
                name: "Moovs",
                icon: CalendarDays,
                tag: "Access to confirm",
                text: "Bring reservations, passenger counts, and assignments into your dispatch board.",
                details:
                  "Moovs lists a Custom API on its pricing page. Your plan, endpoints, and access must be confirmed with Moovs.",
                url: "https://www.moovsapp.com/pricing",
              },
              {
                name: "Verizon Connect",
                icon: Video,
                tag: "Not connected",
                text: "Pair your fleet positions with vehicle health and safety-event context.",
                details:
                  "Reveal offers an API and webhook integration program. Camera-event and footage access depend on your account and permissions.",
                url: "https://www.verizonconnect.com/services/api-integration/",
              },
              {
                name: "Driver mobile",
                icon: Smartphone,
                tag: "Demo available",
                text: "A practical fallback for vehicles without connected telematics.",
                details:
                  "Try shift start and end in the driver workspace. Production background tracking requires a native mobile application.",
                url: "",
              },
            ].map((x) => (
              <section className="integration-card" key={x.name}>
                <x.icon size={30} />
                <span className="integration-tag">{x.tag}</span>
                <h2>{x.name}</h2>
                <p>{x.text}</p>
                <div className="integration-detail">{x.details}</div>
                {x.url ? (
                  <a
                    className="secondary"
                    href={x.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Provider information <ArrowUpRight size={15} />
                  </a>
                ) : (
                  <button
                    className="secondary"
                    onClick={() => setView("Drivers")}
                  >
                    Open driver demo <ArrowRight size={15} />
                  </button>
                )}
              </section>
            ))}
            <div className="integration-notice">
              <ShieldCheck size={20} />
              <div>
                <h3>Demo data is isolated from your real business.</h3>
                <p>
                  No provider credentials or customer records are connected.
                  Trip edits are saved in this browser only.
                </p>
              </div>
            </div>
          </div>
        )}
        {view !== "Overview" && view !== "Shuttles" && (
          <footer className="footer">
            <span>
              <i /> Demo environment · simulated fleet data
            </span>
            <span>
              VEGAS CONTROL <i className="footer-dot" /> Las Vegas fleet
              operations.
            </span>
          </footer>
        )}
      </div>
      {alerts && (
        <div className="overlay" onClick={() => setAlerts(false)}>
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-between">
              <h2 id="alert-title">Operations inbox</h2>
              <button
                className="icon-button"
                aria-label="Close notifications"
                onClick={() => setAlerts(false)}
              >
                <X />
              </button>
            </div>
            <div className="alert-detail">
              <ShieldCheck size={25} />
              <h3>
                {resolved
                  ? "Maintenance acknowledged"
                  : "DL-12 · Maintenance due"}
              </h3>
              <p>
                Executive 3 is offline for its scheduled inspection. Keep this
                vehicle out of dispatch until the inspection is complete.
              </p>
              <span className="subtle">Demo alert · 19:52 PDT</span>
            </div>
            <button
              className="primary wide"
              disabled={resolved}
              onClick={() => {
                setResolved(true);
                notify(
                  "Maintenance alert acknowledged. Vehicle remains offline.",
                );
              }}
            >
              <Check size={16} />
              {resolved ? "Acknowledged" : "Acknowledge alert"}
            </button>
          </section>
        </div>
      )}
      {modal && (
        <NewTrip
          trips={trips}
          onClose={() => setModal(false)}
          onSave={(t) => {
            setTrips([...trips, t]);
            setModal(false);
            setView("Dispatch");
            notify(`${t.id} added to the demo dispatch board.`);
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
export default App;
