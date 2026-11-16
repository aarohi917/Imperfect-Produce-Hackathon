// Public examples are static and never populated from private account queries.
export const DEMO_SECTIONS = ['home', 'insights', 'harvest', 'approvals', 'field-intelligence', 'guide', 'visual-intelligence', 'notifications', 'requests'] as const;
export type DemoSection = typeof DEMO_SECTIONS[number];
export function demoSection(value: string): DemoSection {
  return DEMO_SECTIONS.find(section => section === value) ?? 'home';
}
export type DemoHarvest = {id: string; crop: string; kg: number; zone: string; grade: string; destination: string; status: 'pending' | 'approved' | 'rejected'; revenue: number; cost: number};
export const DEMO_HARVESTS: DemoHarvest[] = [
  {id:'example-1',crop:'胡萝卜',kg:120,zone:'A',grade:'B',destination:'market',status:'approved',revenue:480,cost:210},
  {id:'example-2',crop:'土豆',kg:85,zone:'C',grade:'B',destination:'factory',status:'approved',revenue:255,cost:140},
  {id:'example-3',crop:'黄瓜',kg:40,zone:'E',grade:'A',destination:'market',status:'pending',revenue:160,cost:70},
];
export function demoTotals(rows: DemoHarvest[]) {
  return rows.filter(row=>row.status==='approved').reduce((total,row)=>({kg:total.kg+row.kg,revenue:total.revenue+row.revenue,cost:total.cost+row.cost}),{kg:0,revenue:0,cost:0});
}