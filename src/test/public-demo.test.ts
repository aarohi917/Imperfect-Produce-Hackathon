import {describe,expect,it} from 'vitest';
import {DEMO_HARVESTS,DEMO_SECTIONS,demoTotals} from '@/lib/public-demo';
describe('Public demonstration boundaries',()=>{
  it('excludes Communication from public sections',()=>{
    expect(DEMO_SECTIONS.includes('communication' as typeof DEMO_SECTIONS[number])).toBe(false);
  });
  it('includes only approved examples in financial and weight totals',()=>{
    expect(demoTotals(DEMO_HARVESTS)).toEqual({kg:205,revenue:735,cost:350});
  });
});