export type MapCamera = {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
};

export const SHUTTLE_CAMERA: MapCamera = {
  center: [-115.156, 36.105],
  zoom: 12.55,
  bearing: -28,
  pitch: 50,
};

export const NIGHT_CORRIDOR_CAMERA: MapCamera = {
  center: [-115.158, 36.12],
  zoom: 12.22,
  bearing: -18,
  pitch: 58,
};

export const DAY_VALLEY_CAMERA: MapCamera = {
  center: [-115.18, 36.125],
  zoom: 11.2,
  bearing: -18,
  pitch: 46,
};

export const valleyArea = [
  [-115.35, 36.3],
  [-115.08, 36.3],
  [-114.96, 36.16],
  [-114.95, 36.02],
  [-115.12, 35.97],
  [-115.3, 35.97],
  [-115.36, 36.12],
  [-115.35, 36.3],
] as [number, number][];

export const nightCorridor = [
  [-115.182, 36.092],
  [-115.166, 36.092],
  [-115.148, 36.138],
  [-115.128, 36.171],
  [-115.142, 36.178],
  [-115.16, 36.144],
  [-115.182, 36.092],
] as [number, number][];

export const corridorLandmarks: {
  id: string;
  name: string;
  coordinates: [number, number];
}[] = [
  { id: "mgm", name: "MGM", coordinates: [-115.169, 36.102] },
  { id: "bellagio", name: "Bellagio", coordinates: [-115.1766, 36.1126] },
  { id: "venetian", name: "Venetian", coordinates: [-115.1697, 36.1212] },
  { id: "wynn", name: "Wynn", coordinates: [-115.165, 36.128] },
  { id: "downtown", name: "Fremont", coordinates: [-115.1425, 36.1705] },
];

export function isNightOps(minute: number) {
  const now = ((Math.floor(minute) % 1440) + 1440) % 1440;
  return now >= 18 * 60 || now < 5 * 60;
}

export function cameraKind(
  shuttle: boolean,
  minute: number,
): "shuttle" | "night-corridor" | "valley" {
  if (shuttle) return "shuttle";
  return isNightOps(minute) ? "night-corridor" : "valley";
}

export function fleetCamera(minute: number, perspective: boolean): MapCamera {
  const base = isNightOps(minute) ? NIGHT_CORRIDOR_CAMERA : DAY_VALLEY_CAMERA;
  return {
    ...base,
    pitch: perspective ? base.pitch : 0,
    bearing: perspective ? base.bearing : 0,
  };
}

export function viewCamera(
  shuttle: boolean,
  minute: number,
  perspective: boolean,
): MapCamera {
  if (shuttle) {
    return {
      ...SHUTTLE_CAMERA,
      pitch: perspective ? SHUTTLE_CAMERA.pitch : 0,
      bearing: perspective ? SHUTTLE_CAMERA.bearing : 0,
    };
  }
  return fleetCamera(minute, perspective);
}
