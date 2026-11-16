import {describe, it, expect} from 'vitest';
import {parcelCompactness, demoZone, zoneBand} from '@/lib/zone-metrics';
describe('Zone layer measurements', () => {
 it('computes shape compactness rather than soil density', () => {
  expect(parcelCompactness([[0,0],[10,0],[10,10],[0,10]])).toBe(79);
  expect(parcelCompactness([[0,0],[30,0],[30,2],[0,2]])).toBe(18);
  expect(parcelCompactness([])).toBeNull();
 });
 it('keeps demo metrics tied to zone letters', () => {
  expect(demoZone('Zone F', 0)?.coverage).toBe(91);
  expect(demoZone('Zone B', 7)?.coverage).toBe(28);
 });
 it('uses exact legend thresholds and preserves missing values', () => {
  expect(zoneBand(39, 'vegetation')).toBe('low');
  expect(zoneBand(40, 'vegetation')).toBe('medium');
  expect(zoneBand(70, 'vegetation')).toBe('high');
  expect(zoneBand(null, 'vegetation')).toBe('unknown');
  expect(zoneBand(0, 'observations')).toBe('low');
  expect(zoneBand(1, 'observations')).toBe('medium');
  expect(zoneBand(2, 'observations')).toBe('high');
 });
});