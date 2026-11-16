import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { canCreateOrganization, canReviewTrade, safeAttachment } from './communication-policy';
import { VEGETABLES } from './vegetables';
const uuid=z.string().uuid();
const input=z.object({op:z.string(),orgId:uuid.optional(),conversationId:uuid.optional(),id:uuid.optional(),token:uuid.optional(),name:z.string().trim().max(160).optional(),body:z.string().max(8000).optional(),kind:z.enum(['channel','direct','group','approval']).optional(),private:z.boolean().optional(),users:z.array(uuid).max(50).optional(),parentId:uuid.optional(),harvestId:uuid.optional(),requestId:uuid.optional(),role:z.enum(['member','manager']).optional(),muted:z.boolean().optional(),direction:z.enum(['import','export']).optional(),vegetable:z.string().optional(),quantity:z.number().positive().max(100000).optional(),origin:z.string().max(200).optional(),destination:z.string().max(200).optional(),partnerOrgId:uuid.optional(),status:z.enum(['approved','rejected']).optional(),reaction:z.enum(['like','done','question']).optional(),mentions:z.array(uuid).max(50).optional(),attachments:z.array(z.object({path:z.string(),name:z.string().max(200),type:z.string(),size:z.number()})).max(5).optional()});
export const communicationAction=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input).handler(async({context,data})=>{
 const s=context.supabase,u=context.userId;
 const fail=(error:unknown)=>{if(error)throw new Error('Could not complete this action.');};
 const member=async(org:string)=>{const {data:m,error}=await s.from('comm_org_members').select('*').eq('org_id',org).eq('user_id',u).maybeSingle();fail(error);if(!m)throw new Error('Organization access required.');return m;};
 const manager=async(org:string)=>{const m=await member(org);if(m.role!=='manager')throw new Error('Organization manager access required.');};
 const conversation=async(id:string)=>{const {data:c,error}=await s.from('comm_conversations').select('*').eq('id',id).single();fail(error);if(!c)throw new Error('Conversation unavailable.');return c;};
 const admin=async()=> (await import('@/integrations/supabase/client.server')).supabaseAdmin;
 if(data.op==='createOrg'){
  const {data:roles,error}=await s.from('user_roles').select('role').eq('user_id',u);fail(error);if(!canCreateOrganization((roles??[]).map(r=>r.role)))throw new Error('Only CEOs can create organizations.');if(!data.name)throw new Error('Name required.');const a=await admin();const {data:o,error:e}=await a.from('comm_organizations').insert({name:data.name,created_by:u}).select().single();fail(e);if(!o)throw new Error('Could not create organization.');fail((await a.from('comm_org_members').insert({org_id:o.id,user_id:u,role:'manager'})).error);return {id:o.id};
 }
 if(data.op==='acceptInvite'){
  if(!data.token)throw new Error('Invitation required.');const {data:result,error}=await s.rpc('comm_accept_invitation',{p_token:data.token,...(data.orgId?{p_org:data.orgId}:{})});if(error)throw new Error('Invitation expired, already accepted, or unavailable for this organization.');const id=result&&typeof result==='object'&&!Array.isArray(result)?result['id']:null;return {id:typeof id==='string'?id:undefined};
 }
 if(data.op==='invite'){
  if(!data.orgId)throw new Error('Organization required.');await manager(data.orgId);if(data.conversationId){const c=await conversation(data.conversationId);if(c.org_id!==data.orgId||c.kind==='channel'||c.harvest_id||c.request_id)throw new Error('External invitations are for unlinked direct/group conversations.');}
  const a=await admin();const {data:i,error}=await a.from('comm_invitations').insert({org_id:data.orgId,conversation_id:data.conversationId??null,invited_by:u}).select().single();fail(error);return {token:i?.token};
 }
 if(data.op==='createConversation'){
  if(!data.orgId||!data.name)throw new Error('Organization and name required.');await member(data.orgId);if(data.kind==='channel')await manager(data.orgId);
  const ids=[...new Set([u,...(data.users??[])])];const {data:members,error}=await s.from('comm_org_members').select('*').eq('org_id',data.orgId).in('user_id',ids);fail(error);if(members?.length!==ids.length)throw new Error('Only organization members can be added.');
  if(data.kind==='direct'&&ids.length!==2)throw new Error('Direct messages require exactly two organization members.');
  if(data.harvestId){const {data:h}=await s.from('harvests').select('id,farmer_id').eq('id',data.harvestId).single();if(!h)throw new Error('Harvest unavailable.');for(const id of ids){if(id===h.farmer_id)continue;const {data:staff}=await s.rpc('is_staff',{_user_id:id});if(!staff)throw new Error('Participants must have harvest access.');}}
  if(data.requestId){const {data:r}=await s.from('trade_requests').select('id,org_id,created_by').eq('id',data.requestId).single();if(!r||r.org_id!==data.orgId)throw new Error('Request unavailable in this organization.');if(!ids.includes(r.created_by))ids.push(r.created_by);}
  const a=await admin();if(data.harvestId||data.requestId){let q=a.from('comm_conversations').select('*').eq('org_id',data.orgId);q=data.harvestId?q.eq('harvest_id',data.harvestId):q.eq('request_id',data.requestId??'');const {data:existing}=await q.maybeSingle();if(existing){const {data:accessible}=await s.from('comm_conversations').select('id').eq('id',existing.id).maybeSingle();if(!accessible)throw new Error('Ask a discussion participant to add you.');return {id:existing.id};}}
  const {data:c,error:e}=await a.from('comm_conversations').insert({org_id:data.orgId,kind:data.kind??'group',name:data.name,description:data.body??'',private:data.kind==='channel'?(data.private??true):true,created_by:u,harvest_id:data.harvestId??null,request_id:data.requestId??null}).select().single();fail(e);if(!c)throw new Error('Could not create conversation.');fail((await a.from('comm_participants').insert(ids.map(id=>({conversation_id:c.id,user_id:id,org_id:data.orgId??''})))).error);return {id:c.id};
 }
 if(data.op==='tradeCreate'){
  if(!data.orgId||!data.name||!data.vegetable||!VEGETABLES.some(v=>v===data.vegetable)||!data.quantity||!data.origin||!data.destination)throw new Error('Complete the request with a standard crop and kilograms.');await member(data.orgId);if(data.partnerOrgId)await member(data.partnerOrgId);const a=await admin();const {data:r,error}=await a.from('trade_requests').insert({org_id:data.orgId,partner_org_id:data.partnerOrgId??null,created_by:u,title:data.name,direction:data.direction??'export',vegetable:data.vegetable,quantity:Math.round(data.quantity*10)/10,origin:data.origin,destination:data.destination,notes:data.body??''}).select().single();fail(error);return {id:r?.id};
 }
 if(data.op==='tradeReview'){
  if(!data.id||!data.status)throw new Error('Request required.');const {data:r}=await s.from('trade_requests').select('*').eq('id',data.id).single();if(!r)throw new Error('Request unavailable.');const m=await member(r.org_id);if(!canReviewTrade(m.role,r.created_by,u))throw new Error('A different organization manager must review this request.');const a=await admin();const {data:updated,error}=await a.from('trade_requests').update({status:data.status,review_note:data.body??'',reviewed_by:u}).eq('id',r.id).eq('status','pending').select('id').single();fail(error);if(!updated)throw new Error('Request already reviewed.');return {ok:true};
 }
 if(data.op==='memberRole'){
  if(!data.orgId||!data.id||!data.role)throw new Error('Member required.');await manager(data.orgId);if(data.id===u)throw new Error('You cannot remove your own management access.');const a=await admin();fail((await a.from('comm_org_members').update({role:data.role}).eq('org_id',data.orgId).eq('user_id',data.id)).error);return {ok:true};
 }
 if(!data.conversationId)throw new Error('Conversation required.');const c=await conversation(data.conversationId);
 if(data.op==='send'){
  if(!data.body?.trim()&&!data.attachments?.length)throw new Error('Message required.');if(data.parentId){const {data:p}=await s.from('comm_messages').select('id').eq('id',data.parentId).eq('conversation_id',c.id).is('deleted_at',null).single();if(!p)throw new Error('Reply unavailable.');}
  for(const f of data.attachments??[]){if(!safeAttachment(f)||!f.path.startsWith(`${c.id}/${u}/`))throw new Error('Invalid attachment.');const name=f.path.split('/').at(-1);const {data:objects,error}=await s.storage.from('communication-files').list(`${c.id}/${u}`,{search:name??""});if(error||!objects?.some(o=>o.name===name))throw new Error('Attachment upload unavailable.');}
  const {data:participants}=await s.from('comm_participants').select('user_id').eq('conversation_id',c.id);if((data.mentions??[]).some(id=>!participants?.some(p=>p.user_id===id)))throw new Error('Mention must identify a participant.');
  const a=await admin();await a.from('comm_participants').upsert({conversation_id:c.id,user_id:u,org_id:c.org_id},{ignoreDuplicates:true});const {data:m,error}=await a.from('comm_messages').insert({conversation_id:c.id,sender_id:u,body:data.body??'',parent_id:data.parentId??null,attachments:data.attachments??[],mentions:data.mentions??[]}).select().single();fail(error);return {id:m?.id};
 }
 if(data.op==='read'||data.op==='mute'){
  const a=await admin();const {data:p}=await a.from('comm_participants').select('*').eq('conversation_id',c.id).eq('user_id',u).maybeSingle();fail((await a.from('comm_participants').upsert({conversation_id:c.id,user_id:u,org_id:p?.org_id??c.org_id,last_read_at:data.op==='read'?new Date().toISOString():(p?.last_read_at??"1970-01-01"),muted:data.op==='mute'?(data.muted??false):(p?.muted??false)})).error);return {ok:true};
 }
 if(data.op==='edit'||data.op==='delete'||data.op==='reaction'){
  if(!data.id)throw new Error('Message required.');const {data:m}=await s.from('comm_messages').select('*').eq('id',data.id).eq('conversation_id',c.id).is('deleted_at',null).single();if(!m)throw new Error('Message unavailable.');const a=await admin();if(data.op==='reaction'){if(!data.reaction)throw new Error('Reaction required.');const {data:r}=await a.from('comm_reactions').select('*').eq('message_id',m.id).eq('user_id',u).maybeSingle();fail((r?await a.from('comm_reactions').delete().eq('message_id',m.id).eq('user_id',u):await a.from('comm_reactions').insert({message_id:m.id,user_id:u,reaction:data.reaction})).error);}else{if(m.sender_id!==u)throw new Error('Only your own messages can be changed.');if(data.op==='edit'&&!data.body?.trim())throw new Error('Message required.');fail((await a.from('comm_messages').update(data.op==='delete'?{body:'',attachments:[],mentions:[],deleted_at:new Date().toISOString()}:{body:data.body??"",edited_at:new Date().toISOString()}).eq('id',m.id).eq('sender_id',u)).error);}return {ok:true};
 }
 if(['addParticipant','removeParticipant','leave','rename'].includes(data.op)){
  if(data.op!=='leave'&&c.created_by!==u)await manager(c.org_id);if(data.op==='leave'&&c.kind==='direct')throw new Error('Direct conversations cannot be left.');const a=await admin();if(data.op==='rename'){fail((await a.from('comm_conversations').update({name:data.name??c.name,description:data.body??c.description}).eq('id',c.id)).error);}else if(data.op==='addParticipant'){if(!data.id)throw new Error('Member required.');const {data:m}=await s.from('comm_org_members').select('*').eq('org_id',c.org_id).eq('user_id',data.id).single();if(!m)throw new Error('Organization member required.');if(c.harvest_id){const {data:h}=await s.from('harvests').select('farmer_id').eq('id',c.harvest_id).single();const {data:staff}=await s.rpc('is_staff',{_user_id:data.id});if(h?.farmer_id!==data.id&&!staff)throw new Error('Harvest access required.');}fail((await a.from('comm_participants').upsert({conversation_id:c.id,user_id:data.id,org_id:c.org_id})).error);}else{fail((await a.from('comm_participants').delete().eq('conversation_id',c.id).eq('user_id',data.op==='leave'?u:data.id??'')).error);}return {ok:true};
 }
 throw new Error('Action unavailable.');
});
export const loadCommunication=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({orgId:uuid.optional(),conversationId:uuid.optional(),search:z.string().max(200).optional(),before:z.string().optional()})).handler(async({context,data})=>{
 const s=context.supabase;const check=(e:unknown)=>{if(e)throw new Error('Could not load communication.');};
 const {data:orgs,error:oe}=await s.from('comm_organizations').select('*').order('name');check(oe);
 const orgId=data.orgId??orgs?.[0]?.id;
 const {data:members,error:me}=orgId?await s.from('comm_org_members').select('*').eq('org_id',orgId):{data:[],error:null};check(me);
 const {data:conversations,error:ce}=await s.from('comm_conversations').select('*').order('created_at',{ascending:false});check(ce);
 const {data:participants,error:pe}=await s.from('comm_participants').select('*');check(pe);
 const ids=[...new Set([...(members??[]).map(m=>m.user_id),...(participants??[]).map(p=>p.user_id)])];
 const {supabaseAdmin:a}=await import('@/integrations/supabase/client.server');
 // Only reveal profile names for members of the selected accessible organization or visible conversations.
 const {data:profiles,error:ne}=ids.length?await a.from('profiles').select('id,display_name').in('id',ids):{data:[],error:null};check(ne);
 const {data:requests,error:re}=await s.from('trade_requests').select('*').order('created_at',{ascending:false});check(re);
 let q=s.from('comm_messages').select('*').order('created_at',{ascending:false}).order('id',{ascending:false}).limit(100);
 if(data.conversationId)q=q.eq('conversation_id',data.conversationId);if(data.search)q=q.ilike('body',`%${data.search}%`);if(data.before)q=q.lt('created_at',data.before);
 const {data:messages,error:xe}=await q;check(xe);
 const {data:unreadRows,error:ue}=await s.from('comm_messages').select('conversation_id,created_at,sender_id,mentions').neq('sender_id',context.userId).order('created_at',{ascending:false}).limit(1000);check(ue);
 const {data:reactions,error:ae}=messages?.length?await s.from('comm_reactions').select('*').in('message_id',messages.map(m=>m.id)):{data:[],error:null};check(ae);
 const unread=Object.fromEntries((conversations??[]).map(c=>{const p=participants?.find(p=>p.conversation_id===c.id&&p.user_id===context.userId);return[c.id,(unreadRows??[]).filter(m=>m.conversation_id===c.id&&m.created_at>(p?.last_read_at??'1970')).length];}));
 return {orgs:orgs??[],members:members??[],profiles:profiles??[],conversations:conversations??[],participants:participants??[],messages:messages??[],requests:requests??[],reactions:reactions??[],unread,userId:context.userId,orgId};
});
