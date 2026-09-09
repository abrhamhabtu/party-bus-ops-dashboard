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
import { spreadOverlappingLabels } from "../lib/labels";
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
  stale?: boolean;
};
type Props = {
  vehicles: MapVehicle[];
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
const partyBusMark = `<svg width="40" height="26" viewBox="0 0 40 26" fill="none" aria-hidden="true"><path d="M3 11.2L29 2.4L38 8.6L12 18.2Z" fill="currentColor"/><path d="M12 18.2L38 8.6V16.8L12 26Z" fill="currentColor" opacity=".72"/><path d="M3 11.2L12 18.2V26L3 19Z" fill="currentColor" opacity=".48"/><path d="M7.2 11.4L26.8 4.8L30.2 7.1L10.8 14Z" fill="#1b2836"/><path d="M15.6 17.2L20.8 15.2 22.2 16.2 17 18.2Z" fill="#1b2836" opacity=".9"/><path d="M23.2 14.4L28.4 12.4 29.8 13.4 24.6 15.4Z" fill="#1b2836" opacity=".9"/><path d="M33.6 11.2L36.6 13.2" stroke="#f3ead6" stroke-width="1.15" stroke-linecap="round"/><circle cx="16.4" cy="23.6" r="2.15" fill="#101820"/><circle cx="32.2" cy="17.6" r="2.15" fill="#101820"/><circle cx="16.4" cy="23.6" r=".7" fill="#4c5b6a"/><circle cx="32.2" cy="17.6" r=".7" fill="#4c5b6a"/></svg><span></span>`;
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
    landmarkMarkers = useRef<maplibregl.Marker[]>([]),
    selectRef = useRef(onSelect);
  const [ready, setReady] = useState(false),
    [failure, setFailure] = useState("");
  const kind = cameraKind(shuttle, minute);
  const framing = useRef({ shuttle, minute, perspective });
  useEffect(() => {
    framing.current = { shuttle, minute, perspective };
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
          "fill-extrusion-color": "#c49440",
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
        el.innerHTML = landmarkIcon(l.kind) + "<span></span>";
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
    if (!showVehicles) return;
    const sync = () => {
      const projected = vehicles.map((v) => {
        const point = m.project(v.coordinates);
        return { id: v.id, x: point.x, y: point.y };
      });
      const offsets = spreadOverlappingLabels(projected, 68);
      const iconOffsets = spreadOverlappingLabels(projected, 22);
      vehicles.forEach((v) => {
        let marker = markers.current.get(v.id);
        if (!marker) {
          const el = document.createElement("button");
          el.className = "map-bus";
          el.type = "button";
          el.innerHTML = partyBusMark;
          el.addEventListener("click", () => selectRef.current(v.id));
          marker = new maplibregl.Marker({ element: el, anchor: "center" })
            .setLngLat(v.coordinates)
            .addTo(m);
          markers.current.set(v.id, marker);
        }
        marker.setLngLat(v.coordinates);
        const el = marker.getElement();
        if (!el.querySelector("svg")) el.innerHTML = partyBusMark;
        const offset = offsets[v.id] ?? { dx: 0, dy: 0 };
        const icon = iconOffsets[v.id] ?? { dx: 0, dy: 0 };
        el.style.setProperty("--vehicle-color", v.color);
        el.style.setProperty("--lx", `${offset.dx}px`);
        el.style.setProperty("--ly", `${offset.dy}px`);
        marker.setOffset(
          Math.hypot(icon.dx, icon.dy) > 4
            ? [icon.dx * 0.38, icon.dy * 0.38]
            : [0, 0],
        );
        el.classList.toggle("chosen", selected === v.id);
        el.classList.toggle("stale", !!v.stale);
        el.classList.toggle(
          "spread",
          Math.abs(offset.dx) > 6 || Math.abs(offset.dy) > 6,
        );
        el.setAttribute("aria-label", `Locate ${v.name} · ${v.driver}`);
        el.setAttribute("aria-pressed", String(selected === v.id));
        el.querySelector("span")!.textContent = v.name;
        el.style.zIndex = selected === v.id ? "12" : "3";
      });
    };
    sync();
    m.on("move", sync);
    return () => {
      m.off("move", sync);
    };
  }, [vehicles, selected, showVehicles]);
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
