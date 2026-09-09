import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapInstance } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
maplibregl.setWorkerUrl(workerUrl);
import { mapStyle } from "../lib/map/style";
import { routes, stations, type Hotel, type Station } from "../lib/shuttling";
export type MapVehicle = {
  id: string;
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
  perspective: boolean;
  command: { kind: string; id: number };
};
const areaCoordinates = [
  [-115.211, 36.157],
  [-115.175, 36.173],
  [-115.135, 36.152],
  [-115.126, 36.114],
  [-115.127, 36.07],
  [-115.164, 36.056],
  [-115.204, 36.084],
  [-115.218, 36.125],
  [-115.211, 36.157],
];
export default function FleetMap({
  vehicles,
  selected,
  onSelect,
  shuttle,
  hotel,
  showArea,
  showVehicles,
  showBuildings,
  perspective,
  command,
}: Props) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<MapInstance | null>(null),
    markers = useRef(new Map<string, maplibregl.Marker>()),
    selectRef = useRef(onSelect);
  const [ready, setReady] = useState(false),
    [failure, setFailure] = useState("");
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    if (!container.current) return;
    let m: MapInstance;
    try {
      m = new maplibregl.Map({
        container: container.current,
        style: mapStyle,
        center: [-115.165, 36.113],
        zoom: 12.55,
        pitch: 54,
        bearing: -24,
        maxPitch: 70,
        maxZoom: 18,
        minZoom: 10,
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
          geometry: { type: "Polygon", coordinates: [areaCoordinates] },
        },
      });
      m.addLayer(
        {
          id: "service-fill",
          source: "service-area",
          type: "fill",
          paint: { "fill-color": "#8ca5bb", "fill-opacity": 0.11 },
        },
        "roads-small",
      );
      m.addLayer({
        id: "service-outline",
        source: "service-area",
        type: "line",
        paint: {
          "line-color": "#9fb0c0",
          "line-opacity": 0.65,
          "line-width": 1,
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
          "text-size": 11,
          "text-offset": [0, 1.8],
          "text-anchor": "top",
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#d2e2f0",
          "text-halo-color": "#172430",
          "text-halo-width": 2,
        },
      });
      setReady(true);
    });
    m.on("error", (e) => {
      if (e.error?.message?.includes("WebGL"))
        setFailure(
          "3D rendering interrupted. Reload the map or use the vehicle list.",
        );
    });
    const fit = () => {
      m.resize();
      m.setPadding({
        top: 40,
        bottom: window.innerWidth > 760 ? 115 : 35,
        left: 20,
        right:
          window.innerWidth > 1100 ? 365 : window.innerWidth > 760 ? 320 : 20,
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
      showArea ? "visible" : "none",
    );
    m.setLayoutProperty(
      "service-outline",
      "visibility",
      showArea ? "visible" : "none",
    );
    m.setLayoutProperty(
      "buildings-3d",
      "visibility",
      showBuildings ? "visible" : "none",
    );
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
  }, [ready, showArea, showBuildings, shuttle, hotel]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    m.easeTo({
      pitch: perspective ? 54 : 0,
      bearing: perspective ? -24 : 0,
      duration: 650,
    });
  }, [perspective]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (command.kind === "in") m.zoomIn();
    if (command.kind === "out") m.zoomOut();
    if (command.kind === "reset")
      m.flyTo({
        center: [-115.165, 36.113],
        zoom: 12.55,
        pitch: perspective ? 54 : 0,
        bearing: perspective ? -24 : 0,
      });
    if (command.kind in stations)
      m.flyTo({
        center: stations[command.kind as Station].coordinates,
        zoom: 14.2,
        pitch: perspective ? 54 : 0,
        duration: 900,
      });
  }, [command, perspective]);
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
    vehicles.forEach((v) => {
      let marker = markers.current.get(v.id);
      if (!marker) {
        const el = document.createElement("button");
        el.className = "map-bus";
        el.type = "button";
        el.innerHTML =
          '<svg width="34" height="24" viewBox="0 0 34 24" fill="none"><path d="M3 10L24 3L31 8L10 16Z" fill="currentColor"/><path d="M10 16L31 8V15L10 23Z" fill="currentColor" opacity=".7"/><path d="M3 10L10 16V23L3 17Z" fill="currentColor" opacity=".45"/><path d="M7 10L23 5L26 7L10 13Z" fill="#263642"/><path d="M13 16L17 14.5M20 13L24 11.5" stroke="#1b2936" stroke-width="2"/><circle cx="15" cy="21" r="2" fill="#111a24"/><circle cx="27" cy="16.5" r="2" fill="#111a24"/></svg><span></span>';
        el.addEventListener("click", () => selectRef.current(v.id));
        marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat(v.coordinates)
          .addTo(m);
        markers.current.set(v.id, marker);
      }
      marker.setLngLat(v.coordinates);
      const el = marker.getElement();
      el.style.setProperty("--vehicle-color", v.color);
      el.classList.toggle("chosen", selected === v.id);
      el.classList.toggle("stale", !!v.stale);
      el.setAttribute("aria-label", `Locate ${v.id} · ${v.driver}`);
      el.setAttribute("aria-pressed", String(selected === v.id));
      el.querySelector("span")!.textContent = v.id;
    });
  }, [vehicles, selected, showVehicles]);
  return (
    <div
      className="map-renderer"
      data-map-ready={ready}
      data-perspective={perspective ? "3d" : "2d"}
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
