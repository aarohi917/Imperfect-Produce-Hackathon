import {DEMO_PARCELS} from './demo-parcels';

export type ZoneLayer = 'vegetation' | 'shape' | 'observations';
// Fictional coverage values for demonstrating the UI; never inferred from imagery.
const DEMO_COVERAGE = [72, 28, 85, 46, 63, 91, 79, 88];
export function parcelCompactness(points: readonly (readonly number[])[]) {
 let area = 0, perimeter = 0;
 for (let i = 0; i < points.length; i++) {
  const a = points[i], b = points[(i + 1) % points.length];
  if (!a || !b) continue;
  area += (a[0] ?? 0) * (b[1] ?? 0) - (b[0] ?? 0) * (a[1] ?? 0);
  perimeter += Math.hypot((b[0] ?? 0) - (a[0] ?? 0), (b[1] ?? 0) - (a[1] ?? 0));
 }
 return perimeter ? Math.round(100 * 4 * Math.PI * Math.abs(area / 2) / perimeter ** 2) : null;
}
export function demoZone(name: string, fallback: number) {
 const letter = name.match(/\b([A-H])\b/)?.[1];
 const index = letter ? letter.charCodeAt(0) - 65 : fallback;
 const parcel = DEMO_PARCELS[index];
 return parcel ? {parcel, coverage: DEMO_COVERAGE[index] ?? null, compactness: parcelCompactness(parcel.points)} : null;
}
export function zoneBand(value: number | null, layer: ZoneLayer): 'low' | 'medium' | 'high' | 'unknown' {
 if (value === null) return 'unknown';
 if (layer === 'observations') return value === 0 ? 'low' : value === 1 ? 'medium' : 'high';
 return value < 40 ? 'low' : value < 70 ? 'medium' : 'high';
}