import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BusFront,
  Clock3,
  Radio,
  Settings2,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { fleet, fleetSnapshot } from "../lib/data";
export default function CommandOverview({
  minute,
  onConnect,
  onReview,
  onFleet,
}: {
  minute: number;
  onConnect: () => void;
  onReview: () => void;
  onFleet: () => void;
}) {
  const [period, setPeriod] = useState("today"),
    [insight, setInsight] = useState(false);
  const snapshots = fleet.map((v) => ({ v, s: fleetSnapshot(v, minute) })),
    online = snapshots.filter((x) => x.s.status !== "Offline"),
    available = snapshots.filter((x) => x.s.status === "Available"),
    eta = snapshots
      .filter((x) => x.s.status === "To pickup")
      .map((x) => x.s.eta),
    avg = eta.length
      ? Math.round(eta.reduce((a, b) => a + b, 0) / eta.length)
      : null;
  const bins = Array.from({ length: 24 }, (_, hour) =>
    fleet.reduce(
      (sum, v) =>
        sum + v.legs.filter((l) => Math.floor(l.start / 60) === hour).length,
      0,
    ),
  );
  const chosen = period === "evening" ? bins.slice(18) : bins;
  const max = Math.max(1, ...chosen);
  const total = chosen.reduce((a, b) => a + b, 0);
  const points = chosen
    .map(
      (value, i) =>
        `${(i / (chosen.length - 1)) * 320},${114 - (value / max) * 94}`,
    )
    .join(" ");
  const upcoming = fleet.flatMap((v) =>
    v.legs.filter((l) => l.start > minute && l.start < minute + 90),
  ).length;
  const stats = [
    {
      label: "Active fleet",
      value: online.length,
      unit: `/ ${fleet.length}`,
      sub: "Vehicles available to operations",
      icon: BusFront,
      tone: "cyan",
      action: onFleet,
    },
    {
      label: "Available buses",
      value: available.length,
      unit: "",
      sub: "Ready for the next assignment",
      icon: BusFront,
      tone: "blue",
      action: onFleet,
    },
    {
      label: "Assigned drivers",
      value: online.length,
      unit: "",
      sub: "Demo roster · shift status unlinked",
      icon: Users,
      tone: "cyan",
      action: onFleet,
    },
    {
      label: "Avg. pickup ETA",
      value: avg ?? "—",
      unit: "min",
      sub: "Across vehicles heading to pickup",
      icon: Clock3,
      tone: "gold",
      action: onFleet,
    },
    {
      label: "Maintenance alerts",
      value: fleet.length - online.length,
      unit: "",
      sub: "Requires attention",
      icon: Wrench,
      tone: "red",
      action: onReview,
    },
    {
      label: "Verizon Connect",
      value: "Not connected",
      unit: "",
      sub: "Configure your Reveal integration",
      icon: Radio,
      tone: "cyan",
      action: onConnect,
    },
  ];
  return (
    <aside className="command-overview">
      <section className="fleet-overview-card">
        <div className="command-section-title">
          <h2>FLEET OVERVIEW</h2>
          <span>
            <i /> Demo environment
          </span>
        </div>
        <div className="command-stats">
          {stats.map((s, i) => (
            <button
              className={`command-stat ${s.tone}`}
              key={s.label}
              onClick={s.action}
            >
              <s.icon size={27} />
              <div>
                <span>{s.label}</span>
                <strong className={i === 5 ? "connection-stat-value" : ""}>
                  {s.value}
                  <small>{s.unit}</small>
                </strong>
                <em>{s.sub}</em>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="ride-activity">
        <div className="command-section-title">
          <h3>
            <Activity size={18} />
            Ride activity
          </h3>
          <select
            aria-label="Ride activity period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="evening">Evening</option>
          </select>
        </div>
        <div className="ride-total">
          <strong>{total}</strong>
          <span>Scheduled trips</span>
          <small>Demo schedule</small>
        </div>
        <div className="ride-graph">
          <div className="ride-axis">
            <span>{max}</span>
            <span>{Math.round(max / 2)}</span>
            <span>0</span>
          </div>
          <svg
            viewBox="0 0 320 126"
            preserveAspectRatio="none"
            role="img"
            aria-label="Scheduled departures by hour"
          >
            <defs>
              <linearGradient id="ridefill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1269ed" stopOpacity=".65" />
                <stop offset="1" stopColor="#1269ed" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[20, 67, 114].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="320"
                y2={y}
                stroke="#183146"
                strokeWidth=".8"
              />
            ))}
            <polygon points={`0,126 ${points} 320,126`} fill="url(#ridefill)" />
            <polyline
              points={points}
              fill="none"
              stroke="#2488ff"
              strokeWidth="2"
            />
            {chosen.map((n, i) => (
              <circle
                key={i}
                cx={(i / (chosen.length - 1)) * 320}
                cy={114 - (n / max) * 94}
                r="2"
                fill="#47acff"
              />
            ))}
          </svg>
        </div>
        <div className="ride-hours">
          {(period === "evening"
            ? ["6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"]
            : ["12 AM", "6 AM", "12 PM", "6 PM", "11 PM"]
          ).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </section>
      <section className="dispatch-insight">
        <div>
          <span>
            <Sparkles size={16} />
            Dispatch insight
          </span>
          <button onClick={() => setInsight(!insight)}>
            {insight ? "Less" : "Details"}
            <ArrowUpRight size={12} />
          </button>
        </div>
        <p>{upcoming} scheduled departures in the next 90 minutes.</p>
        <small>
          {available.length} vehicles currently available in the demo.
        </small>
        {insight && (
          <div className="insight-detail">
            Based on the demo reservation schedule, not a demand prediction.
            Review pickup locations and vehicle capacity before assigning a
            trip.
            <button onClick={onFleet}>
              Review fleet <ArrowUpRight size={13} />
            </button>
          </div>
        )}
      </section>
      <button className="overview-settings" onClick={onConnect}>
        <Settings2 size={14} /> Connections & fleet settings{" "}
        <ArrowUpRight size={13} />
      </button>
    </aside>
  );
}
