import { area, booleanValid, intersect, featureCollection, feature } from '@turf/turf';
import proj4 from 'proj4';
import type { Polygon, MultiPolygon, FeatureCollection } from 'geojson';
export type FieldGeometry = Polygon | MultiPolygon;
export type ImportedField = { code:string; name:string; crop:string; geometry:FieldGeometry; area_m2:number; matchId?:string|undefined; users:string[] };
export const MAP_LIMIT = 10 * 1024 * 1024;
export function validateFields(value:unknown, sourceCrs='EPSG:4326'):ImportedField[] {
  if(!value || typeof value!=='object') throw new Error('A GeoJSON FeatureCollection is required.');
  const collection=value as FeatureCollection;
  if(collection.type!=='FeatureCollection'||!Array.isArray(collection.features)||!collection.features.length) throw new Error('No field polygons found.');
  if(collection.features.length>200) throw new Error('Maximum 200 fields per import.');
  if(!['EPSG:4326','EPSG:3857','EPSG:32643','EPSG:32644'].includes(sourceCrs)) throw new Error('Unsupported coordinate system. Select WGS 84, Web Mercator, or UTM 43N/44N.');
  proj4.defs('EPSG:32643','+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs');
  proj4.defs('EPSG:32644','+proj=utm +zone=44 +datum=WGS84 +units=m +no_defs');
  const transform=(node:unknown):unknown=>{
    if(!Array.isArray(node)) throw new Error('Invalid coordinates.');
    if(typeof node[0]==='number') {
      if(node.length<2||!Number.isFinite(node[0])||!Number.isFinite(node[1])) throw new Error('Missing coordinates.');
      const pair=sourceCrs==='EPSG:4326'?[node[0],node[1]]:proj4(sourceCrs,'EPSG:4326',[node[0],node[1]]);
      if(Math.abs(pair[0])>180||Math.abs(pair[1])>90) throw new Error('Coordinates are outside WGS 84 bounds. Check the coordinate system.');
      return pair;
    }
    return node.map(transform);
  };
  const fields=collection.features.map((f,i)=>{
    if(!f.geometry||!['Polygon','MultiPolygon'].includes(f.geometry.type)) throw new Error(`Field ${i+1}: only Polygon and MultiPolygon boundaries are supported.`);
    const g=f.geometry as FieldGeometry;
    const geometry={type:g.type,coordinates:transform(g.coordinates)} as FieldGeometry;
    const rings=geometry.type==='Polygon'?geometry.coordinates:geometry.coordinates.flat();
    for(const ring of rings) if(ring.length<4||ring[0]?.[0]!==ring.at(-1)?.[0]||ring[0]?.[1]!==ring.at(-1)?.[1]) throw new Error(`Field ${i+1}: boundary must form a closed ring.`);
    const shape=feature(geometry);
    if(!booleanValid(shape)||area(shape)<=0) throw new Error(`Field ${i+1}: invalid or empty polygon.`);
    const p=f.properties??{};
    return {code:String(p['code']??p['id']??`F-${i+1}`).slice(0,40),name:String(p['name']??p['Name']??'').slice(0,120),crop:String(p['crop']??'').slice(0,100),geometry,area_m2:area(shape),users:[]};
  });
  for(let i=0;i<fields.length;i++)for(let j=i+1;j<fields.length;j++){
    const a=fields[i],b=fields[j];if(!a||!b)continue;
    const overlap=intersect(featureCollection([feature(a.geometry),feature(b.geometry)]));
    if(overlap&&area(overlap)>0.1) throw new Error(`Fields ${i+1} and ${j+1} overlap or are duplicates.`);
  }
  return fields;
}
export async function parseFarmFile(file:File, crs='EPSG:4326'):Promise<ImportedField[]> {
  if(file.size>MAP_LIMIT) throw new Error('Map files must be 10 MB or smaller.');
  const extension=file.name.split('.').at(-1)?.toLowerCase();
  let data:unknown;
  if(extension==='json'||extension==='geojson') {
    data=JSON.parse(await file.text());
    const declared=(data as {crs?:{properties?:{name?:string}}}).crs?.properties?.name;
    if(declared&&crs==='EPSG:4326'&&!/4326|CRS84/i.test(declared)) throw new Error('This file declares a different coordinate system. Choose the correct source system.');
  } else if(extension==='kml') {
    const xml=new DOMParser().parseFromString(await file.text(),'application/xml');
    if(xml.querySelector('parsererror')||xml.querySelector('NetworkLink')) throw new Error('Invalid KML or unsupported network links.');
    const {kml}=await import('@tmcw/togeojson');data=kml(xml);crs='EPSG:4326';
  } else if(extension==='zip') {
    const {unzipSync}=await import('fflate');
    const archive=unzipSync(new Uint8Array(await file.arrayBuffer()));
    const names=Object.keys(archive);
    if(names.some(n=>n.includes('..')||n.startsWith('/'))||Object.values(archive).reduce((n,b)=>n+b.length,0)>50*1024*1024) throw new Error('Unsafe or excessively large expanded map archive.');
    const shapes=names.filter(n=>/\.shp$/i.test(n));
    if(!shapes.length)throw new Error('Shapefile archive is missing .shp boundaries.');
    for(const name of shapes){const stem=name.slice(0,-4).toLowerCase();for(const ext of ['.shx','.dbf','.prj'])if(!names.some(n=>n.toLowerCase()===stem+ext))throw new Error(`Shapefile is missing ${ext}; include boundaries, index, attributes and coordinate-system definition.`);}
    const {default:shp}=await import('shpjs');
    const parsed=await shp(await file.arrayBuffer());
    const collections=Array.isArray(parsed)?parsed:[parsed];
    data={type:'FeatureCollection',features:collections.flatMap(c=>c.features)};
    crs='EPSG:4326';
  } else throw new Error('Supported formats: GeoJSON, KML and zipped Shapefile. GeoPackage is not yet supported.');
  return validateFields(data,crs);
}
export function geometryBounds(fields:{geometry:FieldGeometry}[]):[number,number,number,number] {
  const points:number[][]=[];
  const walk=(x:unknown)=>{if(!Array.isArray(x))return;if(typeof x[0]==='number')points.push(x as number[]);else x.forEach(walk);};
  fields.forEach(f=>walk(f.geometry.coordinates));
  if(!points.length)return [0,0,1,1];
  return [Math.min(...points.map(p=>p[0]??0)),Math.min(...points.map(p=>p[1]??0)),Math.max(...points.map(p=>p[0]??0)),Math.max(...points.map(p=>p[1]??0))];
}
export function fieldStats(reports:{field_id:string;category:string;status:string;harvest_id:string|null}[]) {
  return {total:reports.length,open:reports.filter(r=>!['resolved','closed'].includes(r.status)).length,quality:reports.filter(r=>r.category==='quality').length,byField:Object.entries(reports.reduce<Record<string,number>>((a,r)=>({...a,[r.field_id]:(a[r.field_id]??0)+1}),{})),repeatedBatches:Object.entries(reports.reduce<Record<string,number>>((a,r)=>r.harvest_id?({...a,[r.harvest_id]:(a[r.harvest_id]??0)+1}):a,{})).filter(([,n])=>n>1)};
}