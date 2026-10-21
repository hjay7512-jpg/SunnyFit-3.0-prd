import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { Miniflare } from 'miniflare';
import { createCollaborationService } from '../core/service.mjs';
import { d1Adapter } from '../core/d1.mjs';
const registry=JSON.parse(readFileSync(new URL('../core/registry.json',import.meta.url),'utf8'));
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',d1Databases:['DB'],cf:false});
try{
 const binding=await mf.getD1Database('DB');
 for(const filename of readdirSync(new URL('../drizzle',import.meta.url)).filter(name=>name.endsWith('.sql')).sort()){
  const sql=readFileSync(new URL('../drizzle/'+filename,import.meta.url),'utf8');for(const statement of sql.split('--> statement-breakpoint').filter(s=>s.trim()))await binding.prepare(statement).run();
 }
 const adminKey=randomUUID(),handler=createCollaborationService({db:d1Adapter(binding),registry,adminKey});
 async function call(path,body,token=adminKey){const response=await handler(new Request('http://test/api/collaboration'+path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}));return {status:response.status,data:await response.json()};}
 const token=(await call('/admin/links',{role:'editor',label:'D1 smoke',days:1})).data.token;
 const draft=value=>({actor:'D1 smoke',values:{'profile.card.title':value},expectedRevision:0,operationId:randomUUID()});
 const results=await Promise.all([call('/blocks/profile.membership',draft('D1 first'),token),call('/blocks/profile.membership',draft('D1 second'),token)]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const record=(await call('/blocks/profile.membership',undefined,token)).data;assert.equal(record.revision,1);assert.equal(record.versions.length,1);assert.equal(JSON.parse(record.versions[0].after_json)['profile.card.title'],record.values['profile.card.title']);
 assert.equal((await call('/blocks/profile.membership/comments',{body:'D1 persisted comment',actor:'D1 reviewer',operationId:randomUUID()},token)).status,201);
 assert.equal((await call('/blocks/profile.membership',undefined,token)).data.comments.length,1);
 console.log('PASS D1 migrations, authorization, atomic CAS/audit and comments');
}finally{await mf.dispose();}
