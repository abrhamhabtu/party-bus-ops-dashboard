import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { fleet, type Trip } from "../lib/data";

export default function NewTrip({
  onClose,
  onSave,
  trips,
}: {
  onClose: () => void;
  onSave: (t: Trip) => void;
  trips: Trip[];
}) {
  const [error, setError] = useState("");
  return (
    <div className="overlay" onClick={onClose}>
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-trip-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-between">
          <div>
            <div className="eyebrow">TONIGHT’S OPERATIONS</div>
            <h2 id="new-trip-title">Create a trip</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close new trip"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <p className="dialog-subtitle">
          Add a reservation to your demo dispatch board.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            const v = fleet.find((v) => v.id === d.get("vehicle"))!;
            const passengers = Number(d.get("passengers"));
            if (passengers > v.capacity) {
              setError(
                `This vehicle seats ${v.capacity}. Choose a larger vehicle.`,
              );
              return;
            }
            const guest = String(d.get("guest")).trim(),
              pickup = String(d.get("pickup")).trim(),
              dropoff = String(d.get("dropoff")).trim();
            if (!guest || !pickup || !dropoff) {
              setError("Please enter a guest name, pickup, and destination.");
              return;
            }
            const time = String(d.get("time"));
            if (
              trips.some(
                (t) =>
                  t.vehicle === v.id &&
                  t.time === time &&
                  t.status !== "Completed",
              )
            ) {
              setError("This vehicle already has a pickup at this time.");
              return;
            }
            onSave({
              id: `TR-${Math.max(2044, ...trips.map((t) => Number(t.id.split("-")[1]))) + 1}`,
              guest,
              pickup,
              dropoff,
              time,
              passengers,
              vehicle: v.id,
              status: "Scheduled",
            });
          }}
        >
          <label>
            Group or guest name
            <input
              autoFocus
              name="guest"
              required
              maxLength={100}
              placeholder="e.g. Morgan birthday party"
            />
          </label>
          <div className="form-grid">
            <label>
              Pickup
              <input
                name="pickup"
                required
                placeholder="Hotel or address"
                list="locations"
              />
            </label>
            <label>
              Destination
              <input
                name="dropoff"
                required
                placeholder="Hotel or address"
                list="locations"
              />
            </label>
            <label>
              Pickup time · PDT
              <input name="time" type="time" defaultValue="21:30" required />
            </label>
            <label>
              Passengers
              <input
                name="passengers"
                type="number"
                min="1"
                max="40"
                defaultValue="20"
                required
              />
            </label>
          </div>
          <datalist id="locations">
            {[
              "Bellagio",
              "MGM Grand",
              "Wynn Las Vegas",
              "Fremont Street",
              "Harry Reid Airport",
              "Sphere",
              "Resorts World",
              "The Venetian",
            ].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </datalist>
          <label>
            Assign vehicle
            <select name="vehicle">
              {fleet
                .filter((v) => v.status === "Available")
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} · {v.name} · {v.capacity} seats
                  </option>
                ))}
            </select>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-footer">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" type="submit">
              Create trip <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
