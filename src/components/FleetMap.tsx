import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapInstance } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
maplibregl.setWorkerUrl(workerUrl);
import {
  landmarks,
  landmarkBuildings,
  landmarkIcon,
} from "../lib/map/landmarks";
import { mapStyle } from "../lib/map/style";
import { routes, stations, type Hotel, type Station } from "../lib/shuttling";
import {
  cameraKind,
  corridorLandmarks,
  nightCorridor,
  valleyArea,
  viewCamera,
} from "../lib/map/cameras";
export type MapVehicle = {
  id: string;
  name: string;
  driver: string;
  coordinates: [number, number];
  color: string;
  heading: number;
  capacity: number;
  stale?: boolean;
};
export type VehiclePlacement = Record<
  string,
  { coordinates: [number, number]; heading: number }
>;
type Props = {
  vehicles: MapVehicle[];
  /**
   * Resamples every vehicle's place on its road at an arbitrary moment. The
   * replay clock ticks in coarse jumps, so the map re-reads the route each
   * animation frame instead of sliding vehicles straight between two far-apart
   * samples — that is what keeps a bus on its street instead of cutting across
   * blocks.
   */
  placementAt?: (minute: number) => VehiclePlacement;
  selected: string | null;
  onSelect: (id: string) => void;
  shuttle: boolean;
  hotel: Hotel;
  showArea: boolean;
  showVehicles: boolean;
  showBuildings: boolean;
  showLandmarks: boolean;
  showZones: boolean;
  perspective: boolean;
  minute: number;
  command: { kind: string; id: number };
};
const vis = (on: boolean) => (on ? "visible" : "none");
/**
 * Vehicles are drawn in plan view with the nose pointing up, so the marker's
 * rotation can be set straight from the road bearing and the bus reads as
 * driving along the street it is actually on.
 */
const partyBusMark = `<svg class="bus-art" width="14" height="32" viewBox="0 0 14 32" fill="none" aria-hidden="true"><path d="M7 .9c2.6 0 5.4 1.6 5.4 4.1v22c0 2.4-1.1 3.6-3 3.6H4.6c-1.9 0-3-1.2-3-3.6v-22C1.6 2.5 4.4.9 7 .9Z" fill="currentColor" stroke="#050c13" stroke-width=".9" stroke-linejoin="round"/><path d="M3.8 3.7c1.9-1.3 4.5-1.3 6.4 0l.5 2.2H3.3Z" fill="#cfe8ff" opacity=".9"/><rect x="3.2" y="7.7" width="7.6" height="18" rx="1.2" fill="#07141f" opacity=".5"/><rect x="1.9" y="8.5" width="1.6" height="3.1" rx=".5" fill="#07141f"/><rect x="1.9" y="12.7" width="1.6" height="3.1" rx=".5" fill="#07141f"/><rect x="1.9" y="16.9" width="1.6" height="3.1" rx=".5" fill="#07141f"/><rect x="1.9" y="21.1" width="1.6" height="3.1" rx=".5" fill="#07141f"/><rect x="10.5" y="8.5" width="1.6" height="3.1" rx=".5" fill="#07141f"/><rect x="10.5" y="12.7" width="1.6" height="3.1" rx=".5" fill="#07141f"/><rect x="10.5" y="16.9" width="1.6" height="3.1" rx=".5" fill="#07141f"/><rect x="10.5" y="21.1" width="1.6" height="3.1" rx=".5" fill="#07141f"/><rect x="6.5" y="8.2" width="1" height="17.2" rx=".5" fill="#ffe0ad" opacity=".55"/><rect x="3.3" y="27.6" width="2.6" height="1.3" rx=".55" fill="#ff8a6b" opacity=".95"/><rect x="8.1" y="27.6" width="2.6" height="1.3" rx=".55" fill="#ff8a6b" opacity=".95"/></svg>`;
const sprinterMark = `<svg class="bus-art" width="13" height="22" viewBox="0 0 13 22" fill="none" aria-hidden="true"><path d="M6.5.9c2.4 0 4.8 1.4 4.8 3.6v13.7c0 2.1-1.1 3.2-3 3.2H4.7c-1.9 0-3-1.1-3-3.2V4.5C1.7 2.3 4.1.9 6.5.9Z" fill="currentColor" stroke="#050c13" stroke-width=".9" stroke-linejoin="round"/><path d="M3.5 3.4c1.8-1.2 4.2-1.2 6 0l.5 2.1H3Z" fill="#cfe8ff" opacity=".9"/><rect x="3.1" y="7.2" width="6.8" height="10.4" rx="1.1" fill="#07141f" opacity=".45"/><rect x="1.9" y="7.9" width="1.5" height="3.3" rx=".5" fill="#07141f"/><rect x="9.6" y="7.9" width="1.5" height="3.3" rx=".5" fill="#07141f"/><rect x="6" y="7.6" width="1" height="9.6" rx=".5" fill="#ffe0ad" opacity=".5"/><rect x="3.2" y="19" width="2.4" height="1.2" rx=".5" fill="#ff8a6b" opacity=".95"/><rect x="7.4" y="19" width="2.4" height="1.2" rx=".5" fill="#ff8a6b" opacity=".95"/></svg>`;
const vehicleMark = (capacity: number) =>
  capacity <= 12 ? sprinterMark : partyBusMark;
function responsiveCamera(
  shuttle: boolean,
  minute: number,
  perspective: boolean,
) {
  const camera = viewCamera(shuttle, minute, perspective);
  return window.innerWidth <= 760
    ? {
        ...camera,
        zoom: shuttle ? 12.1 : camera.zoom - 0.4,
        pitch: perspective ? 42 : 0,
        bearing: perspective ? -12 : 0,
      }
    : camera;
}

export default function FleetMap({
  vehicles,
  placementAt,
  selected,
  onSelect,
  shuttle,
  hotel,
  showArea,
  showVehicles,
  showBuildings,
  showLandmarks,
  showZones,
  perspective,
  minute,
  command,
}: Props) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<MapInstance | null>(null),
    markers = useRef(new Map<string, maplibregl.Marker>()),
    labelMarkers = useRef(new Map<string, maplibregl.Marker>()),
    shownMinute = useRef(minute),
    targetMinute = useRef(minute),
    landmarkMarkers = useRef<maplibregl.Marker[]>([]),
    selectRef = useRef(onSelect);
  const [ready, setReady] = useState(false),
    [failure, setFailure] = useState("");
  const kind = cameraKind(shuttle, minute);
  const framing = useRef({ shuttle, minute, perspective });
  useEffect(() => {
    framing.current = { shuttle, minute, perspective };
    targetMinute.current = minute;
  }, [shuttle, minute, perspective]);
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    if (!container.current) return;
    let m: MapInstance;
    try {
      const initial = framing.current;
      const start = responsiveCamera(initial.shuttle, initial.minute, initial.perspective);
      m = new maplibregl.Map({
        container: container.current,
        style: mapStyle,
        center: start.center,
        zoom: start.zoom,
        pitch: start.pitch,
        bearing: start.bearing,
        maxPitch: 70,
        maxZoom: 18,
        minZoom: 10.2,
        attributionControl: { compact: true },
        canvasContextAttributes: { preserveDrawingBuffer: true },
      });
    } catch {
      queueMicrotask(() =>
        setFailure(
          "3D map unavailable on this device. Use the vehicle list below.",
        ),
      );
      return;
    }
    map.current = m;
    const loadingTimer = setTimeout(
      () =>
        setFailure(
          "Map data is taking longer than expected. Check your connection; the vehicle list is still available.",
        ),
      20000,
    );
    m.on("load", () => {
      clearTimeout(loadingTimer);
      setFailure("");
      m.addSource("service-area", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [valleyArea] },
        },
      });
      m.addLayer(
        {
          id: "service-fill",
          source: "service-area",
          type: "fill",
          paint: { "fill-color": "#6d7c8a", "fill-opacity": 0.06 },
        },
        "roads-small",
      );
      m.addLayer({
        id: "service-outline",
        source: "service-area",
        type: "line",
        paint: {
          "line-color": "#8a9aa8",
          "line-opacity": 0.4,
          "line-width": 1,
          "line-dasharray": [3, 3],
        },
      });
      m.addSource("night-corridor", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [nightCorridor] },
        },
      });
      m.addLayer({
        id: "corridor-fill",
        source: "night-corridor",
        type: "fill",
        paint: { "fill-color": "#248cc2", "fill-opacity": 0.07 },
      });
      m.addLayer({
        id: "corridor-outline",
        source: "night-corridor",
        type: "line",
        paint: {
          "line-color": "#26bff8",
          "line-opacity": 0.9,
          "line-width": 1.8,
        },
      });
      m.addSource("shuttle-route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "shuttle-casing",
        type: "line",
        source: "shuttle-route",
        paint: {
          "line-color": "#1b334d",
          "line-width": 8,
          "line-opacity": 0.8,
        },
      });
      m.addLayer({
        id: "shuttle-line",
        type: "line",
        source: "shuttle-route",
        paint: {
          "line-color": "#85b7e7",
          "line-width": 2.5,
          "line-opacity": 0.9,
        },
      });
      m.addSource("station-points", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: Object.entries(stations).map(([id, s]) => ({
            type: "Feature" as const,
            properties: { name: s.short, id },
            geometry: { type: "Point" as const, coordinates: s.coordinates },
          })),
        },
      });
      m.addLayer({
        id: "station-halo",
        type: "circle",
        source: "station-points",
        paint: {
          "circle-color": "#67a9eb",
          "circle-radius": 12,
          "circle-opacity": 0.1,
          "circle-stroke-color": "#83b4e1",
          "circle-stroke-width": 1,
          "circle-stroke-opacity": 0.4,
        },
      });
      m.addLayer({
        id: "station-core",
        type: "circle",
        source: "station-points",
        paint: {
          "circle-radius": 4,
          "circle-color": "#c2d9ed",
          "circle-stroke-color": "#25394b",
          "circle-stroke-width": 2,
        },
      });
      m.addLayer({
        id: "station-labels",
        type: "symbol",
        source: "station-points",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 10,
          "text-offset": [0, 1.6],
          "text-anchor": "top",
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#d2e2f0",
          "text-halo-color": "#172430",
          "text-halo-width": 2,
        },
      });
      m.addSource("corridor-landmarks", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: corridorLandmarks.map((place) => ({
            type: "Feature" as const,
            properties: { name: place.name, id: place.id },
            geometry: {
              type: "Point" as const,
              coordinates: place.coordinates,
            },
          })),
        },
      });
      m.addLayer({
        id: "landmark-labels",
        type: "symbol",
        source: "corridor-landmarks",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 10,
          "text-letter-spacing": 0.14,
          "text-transform": "uppercase",
          "text-offset": [0, -1.35],
          "text-anchor": "bottom",
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#d2e2f0",
          "text-halo-color": "#172430",
          "text-halo-width": 1.4,
          "text-opacity": 0.88,
        },
      });
      m.addSource("landmark-buildings", {
        type: "geojson",
        data: landmarkBuildings(),
      });
      m.addLayer({
        id: "landmark-towers",
        type: "fill-extrusion",
        source: "landmark-buildings",
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-opacity": 0.82,
        },
      });
      m.addSource("activity-zones", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: landmarks
            .filter((l) => ["resorts", "venetian", "mgm"].includes(l.id))
            .map((l) => ({
              type: "Feature",
              properties: {},
              geometry: { type: "Point", coordinates: [...l.coordinates] },
            })),
        },
      });
      m.addLayer({
        id: "zone-halo",
        type: "circle",
        source: "activity-zones",
        paint: {
          "circle-radius": 38,
          "circle-color": "#9059ff",
          "circle-opacity": 0.15,
          "circle-blur": 0.65,
        },
      });
      m.addLayer({
        id: "zone-core",
        type: "circle",
        source: "activity-zones",
        paint: {
          "circle-radius": 4,
          "circle-color": "#b46cff",
          "circle-opacity": 0.9,
          "circle-blur": 0.2,
        },
      });
      landmarks.forEach((l) => {
        const el = document.createElement("button");
        el.className = "landmark-marker " + l.kind;
        el.setAttribute("aria-label", "Focus " + l.name);
        el.innerHTML = landmarkIcon(l.kind, l.shape) + "<span></span>";
        el.style.setProperty("--landmark-color", l.color);
        el.querySelector("span")!.textContent = l.name;
        el.addEventListener("click", () =>
          m.easeTo({ center: [...l.coordinates], zoom: 14.2, duration: 800 }),
        );
        const marker = new maplibregl.Marker({
          element: el,
          anchor: "bottom-left",
        })
          .setLngLat([...l.coordinates])
          .addTo(m);
        landmarkMarkers.current.push(marker);
      });
      const positionLabels = () => {
        const boxes: { x: number; y: number }[] = [];
        landmarks
          .map((l, i) => ({ l, i }))
          .sort((a, b) => a.l.priority - b.l.priority)
          .forEach(({ l, i }) => {
            const p = m.project([...l.coordinates]);
            const collides = boxes.some(
              (b) => Math.abs(b.x - p.x) < 130 && Math.abs(b.y - p.y) < 29,
            );
            landmarkMarkers.current[i]
              ?.getElement()
              .classList.toggle("compact-landmark", collides);
            if (!collides) boxes.push(p);
          });
      };
      m.on("move", positionLabels);
      positionLabels();
      // Vehicles grow as you zoom in so they stay in proportion to the streets
      // instead of looming over the whole Strip at valley zoom.
      const scaleVehicles = () => {
        const zoom = m.getZoom();
        const scale = Math.min(1.9, Math.max(0.78, 0.78 + (zoom - 12) * 0.2));
        m.getContainer().style.setProperty("--bus-scale", scale.toFixed(2));
      };
      m.on("zoom", scaleVehicles);
      scaleVehicles();
      setReady(true);
    });
    m.on("error", (e) => {
      if (e.error?.message?.includes("WebGL"))
        setFailure(
          "3D rendering interrupted. Reload the map or use the vehicle list.",
        );
    });
    const fit = () => {
      m.stop();
      m.resize();
      const f = framing.current;
      m.jumpTo(responsiveCamera(f.shuttle, f.minute, f.perspective));
      m.setPadding({
        top: 40,
        bottom: window.innerWidth > 760 ? 30 : 20,
        left: 20,
        right: 20,
      });
    };
    const observer = new ResizeObserver(fit);
    observer.observe(container.current);
    fit();
    const currentMarkers = markers.current;
    return () => {
      clearTimeout(loadingTimer);
      observer.disconnect();
      currentMarkers.forEach((marker) => marker.remove());
      currentMarkers.clear();
      landmarkMarkers.current.forEach((marker) => marker.remove());
      landmarkMarkers.current = [];
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    m.setLayoutProperty(
      "service-fill",
      "visibility",
      vis(showArea && !shuttle),
    );
    m.setLayoutProperty(
      "service-outline",
      "visibility",
      vis(showArea && !shuttle),
    );
    m.setLayoutProperty(
      "corridor-fill",
      "visibility",
      vis(showArea && !shuttle),
    );
    m.setLayoutProperty(
      "corridor-outline",
      "visibility",
      vis(showArea && !shuttle),
    );
    m.setLayoutProperty("landmark-labels", "visibility", vis(!shuttle));
    m.setLayoutProperty("station-halo", "visibility", vis(shuttle));
    m.setLayoutProperty("station-core", "visibility", vis(shuttle));
    m.setLayoutProperty("station-labels", "visibility", vis(shuttle));
    m.setLayoutProperty("buildings-3d", "visibility", vis(showBuildings));
    m.setLayoutProperty(
      "landmark-towers",
      "visibility",
      vis(showBuildings && showLandmarks),
    );
    m.setLayoutProperty("zone-halo", "visibility", vis(showZones));
    m.setLayoutProperty("zone-core", "visibility", vis(showZones));
    landmarkMarkers.current.forEach((marker) => {
      marker.getElement().style.display = showLandmarks ? "" : "none";
    });
    m.setLayoutProperty("landmark-labels", "visibility", "none");
    (m.getSource("shuttle-route") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: shuttle
        ? [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: routes[hotel] },
            },
          ]
        : [],
    });
  }, [
    ready,
    showArea,
    showBuildings,
    showLandmarks,
    showZones,
    shuttle,
    hotel,
  ]);
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    const framed = kind === "valley" ? 12 * 60 : 21 * 60;
    m.easeTo({
      ...responsiveCamera(shuttle, framed, perspective),
      duration: window.innerWidth <= 760 ? 0 : 900,
    });
  }, [ready, kind, perspective, shuttle]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const framed = kind === "valley" ? 12 * 60 : 21 * 60;
    const camera = responsiveCamera(shuttle, framed, perspective);
    if (command.kind === "in") m.zoomIn();
    if (command.kind === "out") m.zoomOut();
    if (command.kind === "reset") m.flyTo({ ...camera, duration: 900 });
    if (Object.hasOwn(stations, command.kind))
      m.flyTo({
        center: stations[command.kind as Station].coordinates,
        zoom: 14.2,
        pitch: perspective ? camera.pitch : 0,
        duration: 900,
      });
  }, [command, perspective, shuttle, kind]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const ids = new Set(vehicles.map((v) => v.id));
    markers.current.forEach((marker, id) => {
      if (!ids.has(id) || !showVehicles) {
        marker.remove();
        markers.current.delete(id);
      }
    });
    if (!showVehicles) {
      labelMarkers.current.forEach((marker) => marker.remove());
      labelMarkers.current.clear();
      return;
    }
    labelMarkers.current.forEach((marker, id) => {
      if (!ids.has(id) || id !== selected) {
        marker.remove();
        labelMarkers.current.delete(id);
      }
    });
    vehicles.forEach((v) => {
      let marker = markers.current.get(v.id);
      if (!marker) {
        const el = document.createElement("button");
        el.className = "map-bus";
        el.type = "button";
        el.innerHTML = vehicleMark(v.capacity);
        el.addEventListener("click", () => selectRef.current(v.id));
        marker = new maplibregl.Marker({
          element: el,
          anchor: "center",
          rotationAlignment: "map",
          pitchAlignment: "map",
        })
          .setLngLat(v.coordinates)
          .addTo(m);
        markers.current.set(v.id, marker);
      }
      marker.setLngLat(v.coordinates);
      marker.setRotation(v.heading);
      const el = marker.getElement();
      if (!el.querySelector("svg")) el.innerHTML = vehicleMark(v.capacity);
      el.style.setProperty("--vehicle-color", v.color);
      el.classList.toggle("chosen", selected === v.id);
      el.classList.toggle("stale", !!v.stale);
      el.setAttribute("aria-label", `Locate ${v.name} · ${v.driver}`);
      el.setAttribute("aria-pressed", String(selected === v.id));
      // The name rides in its own upright marker so it stays readable while the
      // vehicle itself lies flat on the road.
      if (selected === v.id) {
        let label = labelMarkers.current.get(v.id);
        if (!label) {
          const chip = document.createElement("div");
          chip.className = "map-bus-label";
          label = new maplibregl.Marker({
            element: chip,
            anchor: "bottom",
            offset: [0, -14],
          })
            .setLngLat(v.coordinates)
            .addTo(m);
          labelMarkers.current.set(v.id, label);
        }
        label.setLngLat(v.coordinates);
        const chip = label.getElement();
        chip.textContent = v.name;
        chip.style.setProperty("--vehicle-color", v.color);
      }
    });
  }, [vehicles, selected, showVehicles]);
  // Glide the fleet between replay ticks. The clock eases toward the simulated
  // minute and every frame re-reads each vehicle's position from its route, so
  // buses trace the actual streets rather than jumping in straight lines.
  useEffect(() => {
    const m = map.current;
    if (!m || !placementAt || !showVehicles) return;
    let frame = 0;
    const step = () => {
      const target = targetMinute.current;
      const gap = target - shownMinute.current;
      // A scrub or a midnight rollover is a jump, not motion — land on it.
      shownMinute.current =
        Math.abs(gap) > 30 ? target : shownMinute.current + gap * 0.16;
      const placement = placementAt(shownMinute.current);
      for (const [id, at] of Object.entries(placement)) {
        const marker = markers.current.get(id);
        if (!marker) continue;
        marker.setLngLat(at.coordinates);
        marker.setRotation(at.heading);
        labelMarkers.current.get(id)?.setLngLat(at.coordinates);
      }
      // Marker DOM writes are queued against the map's own render pass, so ask
      // for a frame or the fleet only visibly moves when something else
      // repaints the map.
      m.triggerRepaint();
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [placementAt, showVehicles, ready]);
  return (
    <div
      className="map-renderer"
      data-map-ready={ready}
      data-perspective={perspective ? "3d" : "2d"}
      data-camera={kind}
    >
      <div
        ref={container}
        className="vector-map"
        aria-label="Interactive 3D Las Vegas fleet map"
      />
      {!ready && !failure && (
        <div className="map-loading">Loading Las Vegas cartography…</div>
      )}
      {failure && (
        <div className="map-error" role="alert">
          {failure}
        </div>
      )}
    </div>
  );
}
