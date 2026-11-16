// Image-space tracing of visible parcels, not surveyed boundaries or business geometry.
// Coordinates match the fixed 1200 × 800 satellite canvas (no image cropping).
export const DEMO_PARCELS = [
 { points: [[0,0],[235,0],[235,81],[0,81]], label: [116,40] },
 { points: [[242,87],[406,89],[405,243],[238,238]], label: [323,165] },
 { points: [[0,87],[232,88],[232,232],[0,232]], label: [114,157] },
 { points: [[2,348],[225,350],[222,520],[0,520]], label: [113,433] },
 { points: [[516,164],[786,164],[785,309],[516,305]], label: [650,236] },
 { points: [[795,154],[1182,154],[1181,167],[1006,312],[795,312]], label: [955,228] },
 { points: [[0,530],[222,531],[221,633],[0,631]], label: [110,581] },
 { points: [[512,354],[649,356],[647,527],[508,526]], label: [578,436] },
] as const;