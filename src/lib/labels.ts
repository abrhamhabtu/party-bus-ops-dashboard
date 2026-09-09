export function spreadOverlappingLabels(
  points: { id: string; x: number; y: number }[],
  minSep = 52,
): Record<string, { dx: number; dy: number }> {
  const offsets: Record<string, { dx: number; dy: number }> = {};
  points.forEach((point) => {
    offsets[point.id] = { dx: 0, dy: 0 };
  });
  for (let iter = 0; iter < 12; iter++) {
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i],
          b = points[j];
        const dx =
          a.x + offsets[a.id].dx - (b.x + offsets[b.id].dx);
        const dy =
          a.y + offsets[a.id].dy - (b.y + offsets[b.id].dy);
        const dist = Math.hypot(dx, dy);
        if (dist >= minSep) continue;
        const angle = dist < 0.4 ? (i * 2.399) / points.length : Math.atan2(dy, dx);
        const push = (minSep - Math.max(dist, 0.4)) / 2;
        offsets[a.id].dx += Math.cos(angle) * push;
        offsets[a.id].dy += Math.sin(angle) * push;
        offsets[b.id].dx -= Math.cos(angle) * push;
        offsets[b.id].dy -= Math.sin(angle) * push;
      }
    }
  }
  for (const id of Object.keys(offsets)) {
    offsets[id] = {
      dx: Math.round(offsets[id].dx),
      dy: Math.round(offsets[id].dy),
    };
  }
  return offsets;
}
