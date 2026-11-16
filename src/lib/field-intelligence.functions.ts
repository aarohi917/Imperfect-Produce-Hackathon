import {createServerFn} from '@tanstack/react-start';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {z} from 'zod';
import {validateFields} from './field-geometry';
import {CATEGORIES,STATUSES} from './field-labels';
const uuid=z.string().uuid();
export const loadFieldIntelligence=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const s=context.supabase;
 const check=(error:unknown)=>{if(error)throw new Error('Could not load Field Intelligence.');};
 const all=async<T>(fetchPage:(from:number,to:number)=>PromiseLike<{data:T[]|null;error:unknown}>)=>{const rows:T[]=[];for(let from=0;;from+=500){const r=await fetchPage(from,from+499);check(r.error);rows.push(...(r.data??[]));if((r.data?.length??0)<500)break;}return rows;};
 const [farms,fields,boundaries,reports,activity,evidence,assignments,orgs,members]=await Promise.all([
  all((f,t)=>s.from('fi_farms').select('*').order('id').range(f,t)),all((f,t)=>s.from('fi_fields').select('*').order('id').range(f,t)),all((f,t)=>s.from('fi_boundaries').select('*').order('id').range(f,t)),all((f,t)=>s.from('fi_reports').select('*').order('id').range(f,t)),all((f,t)=>s.from('fi_activity').select('*').order('id').range(f,t)),all((f,t)=>s.from('fi_evidence').select('*').order('id').range(f,t)),all((f,t)=>s.from('fi_assignments').select('*').order('field_id').order('user_id').range(f,t)),all((f,t)=>s.from('comm_organizations').select('id,name').order('id').range(f,t)),all((f,t)=>s.from('comm_org_members').select('*').order('org_id').order('user_id').range(f,t))]);
 const managing:string[]=[];for(const farm of farms){const r=await s.rpc('fi_manage',{p_farm:farm.id});check(r.error);if(r.data)managing.push(farm.id);}
 const names=members.length?await (await import('@/integrations/supabase/client.server')).supabaseAdmin.from('profiles').select('id,display_name').in('id',[...new Set(members.map(m=>m.user_id))]):{data:[],error:null};check(names.error);
 const signed=await Promise.all(evidence.map(async e=>{const result=await s.storage.from('field-evidence').createSignedUrl(e.path,900);check(result.error);return {...e,url:result.data?.signedUrl??''};}));
 const harvestResult=await s.rpc('operational_harvests');check(harvestResult.error);
 const {data:requests,error:re}=await s.from('trade_requests').select('id,org_id,title,status');check(re);
 return {farms,fields,boundaries,reports,activity,evidence:signed,assignments,orgs,members,profiles:names.data??[],managing,userId:context.userId,harvests:Array.isArray(harvestResult.data)?harvestResult.data:[],requests:requests??[]};
});
export const createFieldReport=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({field_id:uuid,boundary_id:uuid,category:z.enum(CATEGORIES),description:z.string().trim().min(5).max(8000),crop:z.string().max(100),quantity_kg:z.number().nonnegative().nullable(),affected_area_m2:z.number().nonnegative().nullable(),observed_at:z.string().datetime(),harvest_id:uuid.nullable(),request_id:uuid.nullable()})).handler(async({context,data})=>{
 const {data:r,error}=await context.supabase.from('fi_reports').insert({...data,submitted_by:context.userId}).select('id').single();if(error||!r)throw new Error('Could not submit this field report. Check field and linked record access.');return r;
});
export const reviewFieldReport=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:uuid,status:z.enum([...STATUSES,'response']),body:z.string().trim().min(1).max(8000),internal:z.boolean(),assigned:uuid.nullable()})).handler(async({context,data})=>{const {error}=await context.supabase.rpc('fi_review',{p_report:data.id,p_status:data.status,p_body:data.body,p_internal:data.internal,...(data.assigned?{p_assigned:data.assigned}:{})});if(error)throw new Error('Could not save review. Check manager access and employee assignment.');return {ok:true};});
export const importFarm=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({orgId:uuid,farmId:uuid.optional(),name:z.string().trim().min(2).max(160),location:z.string().max(200),fields:z.array(z.object({code:z.string().trim().min(1).max(40),name:z.string().trim().min(1).max(120),crop:z.string().max(100),geometry:z.unknown(),matchId:uuid.optional(),users:z.array(uuid).max(100)})).min(1).max(200)})).handler(async({context,data})=>{
 validateFields({type:'FeatureCollection',features:data.fields.map(f=>({type:'Feature',properties:{name:f.name,code:f.code},geometry:f.geometry}))});
 const base={p_org:data.orgId,p_name:data.name,p_location:data.location,p_fields:JSON.parse(JSON.stringify(data.fields))};
 const {data:id,error}=data.farmId?await context.supabase.rpc('fi_import_farm',{...base,p_farm:data.farmId}):await context.supabase.rpc('fi_create_farm_map',base);if(error)throw new Error('Could not activate map. Check organization access, unique identifiers, boundaries and field matching.');return {id};
});