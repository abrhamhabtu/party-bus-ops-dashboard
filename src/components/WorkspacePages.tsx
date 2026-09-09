import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  BusFront,
  Check,
  Search,
  ShieldCheck,
  Video,
  Wrench,
} from "lucide-react";
import { fleet, FLEET_EVENING, fleetSnapshot } from "../lib/data";
export default function WorkspacePages({
  view,
  onConnect,
  onNewTrip,
  onExport,
}: {
  view: "Fleet" | "Cameras" | "Maintenance" | "Reports";
  onConnect: () => void;
  onNewTrip: () => void;
  onExport: () => void;
}) {
  const [query, setQuery] = useState(""),
    [ack, setAck] = useState(false);
  const offline = fleet.filter((v) => !v.legs.length);
  const legs = fleet.flatMap((v) => v.legs);
  if (view === "Cameras")
    return (
      <div className="camera-workspace">
        <div className="camera-page-toolbar">
          <div>
            <h2>Road & driver visibility</h2>
            <p>Verizon Reveal Integrated Video · connection required</p>
          </div>
          <button className="primary" onClick={onConnect}>
            Set up Verizon <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="camera-grid">
          {["Road-facing camera", "Driver-facing camera"].map((name, i) => (
            <section className="camera-view" key={name}>
              <div>
                <Video size={16} />
                {name}
                <span>OFFLINE</span>
              </div>
              <div className="camera-empty">
                <Video size={38} />
                <h3>No camera connected</h3>
                <p>
                  {i === 0
                    ? "Review the road context around an incident."
                    : "Review driver-facing footage with authorized access."}
                </p>
                <button onClick={onConnect}>
                  Configure video access <ArrowUpRight size={14} />
                </button>
              </div>
              <footer>
                Footage and live-stream availability depend on your Verizon
                account.
              </footer>
            </section>
          ))}
        </div>
        <div className="camera-privacy">
          <ShieldCheck size={19} />
          <p>
            Video is available only to authorized staff. GPS integration alone
            does not grant camera access. No footage is collected in this demo.
          </p>
        </div>
      </div>
    );
  if (view === "Maintenance")
    return (
      <section className="management-panel">
        <div className="management-heading">
          <h2>Maintenance holds</h2>
          <span>{offline.length} vehicle offline</span>
        </div>
        {offline.map((v) => (
          <article className="maintenance-item" key={v.id}>
            <Wrench size={24} />
            <div>
              <h3>
                {v.name} <small>{v.id}</small>
              </h3>
              <p>Scheduled inspection · unavailable for dispatch</p>
              <span>Demo maintenance hold</span>
            </div>
            <button
              className="secondary"
              disabled={ack}
              onClick={() => setAck(true)}
            >
              {ack ? (
                <>
                  <Check size={14} />
                  Acknowledged
                </>
              ) : (
                "Acknowledge"
              )}
            </button>
          </article>
        ))}
        <p className="management-note">
          Acknowledging an alert does not release the vehicle. Inspection
          sign-off and maintenance records must be connected before live
          dispatch.
        </p>
      </section>
    );
  if (view === "Reports")
    return (
      <section className="management-panel">
        <div className="management-heading">
          <h2>Daily operations report</h2>
          <button className="secondary" onClick={onExport}>
            <ArrowDownToLine size={15} />
            Export dispatch CSV
          </button>
        </div>
        <div className="report-metrics">
          <div>
            <span>Scheduled fleet legs</span>
            <strong>{legs.length}</strong>
          </div>
          <div>
            <span>Average scheduled leg</span>
            <strong>
              {Math.round(
                legs.reduce((a, l) => a + l.end - l.start, 0) / legs.length,
              )}
              <small>min</small>
            </strong>
          </div>
          <div>
            <span>Total seating capacity</span>
            <strong>{fleet.reduce((a, v) => a + v.capacity, 0)}</strong>
          </div>
        </div>
        <p className="management-note">
          Calculated from the example fleet schedule. These are planned
          movements, not measured live trips. The CSV contains your demo
          dispatch reservations.
        </p>
      </section>
    );
  const matches = fleet.filter((v) =>
    `${v.name} ${v.driver} ${v.id}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="management-panel">
      <div className="management-heading">
        <h2>
          Vehicle directory <small>{fleet.length} vehicles</small>
        </h2>
        <label className="directory-search">
          <Search size={15} />
          <input
            aria-label="Search fleet directory"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Vehicle or driver"
          />
        </label>
      </div>
      <div className="directory-grid">
        {matches.map((v) => (
          <article key={v.id}>
            <div>
              <BusFront size={24} />
              <span className={!v.legs.length ? "directory-offline" : ""}>
                {fleetSnapshot(v, FLEET_EVENING).status}
              </span>
            </div>
            <h3>{v.name}</h3>
            <p>
              {v.id} · {v.capacity} passengers
            </p>
            <div className="directory-driver">{v.driver}</div>
            <button onClick={onNewTrip}>
              Open dispatch <ArrowUpRight size={14} />
            </button>
          </article>
        ))}
      </div>
      {matches.length === 0 && (
        <p className="management-note">No vehicles match your search.</p>
      )}
    </section>
  );
}
