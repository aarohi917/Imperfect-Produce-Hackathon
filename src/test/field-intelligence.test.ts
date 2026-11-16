import {describe,it,expect} from 'vitest';
import {validateFields,fieldStats,MAP_LIMIT} from '@/lib/field-geometry';
const shape=(x=73.7)=>({type:'Feature',properties:{name:'Test zone'},geometry:{type:'Polygon',coordinates:[[[x,18.6],[x+.01,18.6],[x+.01,18.61],[x,18.61],[x,18.6]]]}});
describe('Field Intelligence geography and operational rules',()=>{
 it('accepts closed WGS84 polygons with measured map area',()=>{const result=validateFields({type:'FeatureCollection',features:[shape()]});expect(result[0]?.name).toBe('Test zone');expect(result[0]?.area_m2).toBeGreaterThan(1000000);});
 it('rejects duplicate and overlapping boundaries',()=>expect(()=>validateFields({type:'FeatureCollection',features:[shape(),shape()]})).toThrow('overlap'));
 it('rejects unclosed polygons',()=>{const f=shape();f.geometry.coordinates[0]?.pop();expect(()=>validateFields({type:'FeatureCollection',features:[f]})).toThrow('closed');});
 it('rejects unsupported coordinate reference systems',()=>expect(()=>validateFields({type:'FeatureCollection',features:[shape()]},'EPSG:9999')).toThrow('Unsupported'));
 it('converts recognized Web Mercator coordinates into WGS84',()=>{const f=shape();f.geometry.coordinates=[[[0,0],[111319,0],[111319,111325],[0,111325],[0,0]]];const result=validateFields({type:'FeatureCollection',features:[f]},'EPSG:3857');expect(result[0]?.geometry.coordinates[0]?.[1]?.[0]).toBeCloseTo(1,3);});
 it('keeps the import size limit at 10 MB',()=>expect(MAP_LIMIT).toBe(10485760));
 it('counts unresolved reports without inferring financial losses',()=>{const stats=fieldStats([{field_id:'A',category:'quality',status:'submitted',harvest_id:'batch'},{field_id:'A',category:'weather',status:'resolved',harvest_id:'batch'}]);expect(stats.total).toBe(2);expect(stats.open).toBe(1);expect(stats.quality).toBe(1);expect(stats.repeatedBatches).toEqual([['batch',2]]);});
});