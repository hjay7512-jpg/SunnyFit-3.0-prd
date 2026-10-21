const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto')
const {createLocalCollaboration}=require('../server/collaboration.cjs'),registry=require('../config/collaboration-registry.json')
async function fixture(t){
 const filename=path.resolve('runtime','collaboration-test-'+randomUUID()+'.sqlite'),adminKey=randomUUID(),service=await createLocalCollaboration({filename,adminKey,allowedOrigins:['http://localhost:9876']})
 t.after(()=>{service.close();for(const name of [filename,filename+'-wal',filename+'-shm'])if(fs.existsSync(name))fs.unlinkSync(name)})
 const call=async(url,body,token,extra={})=>{const response=await service.handler(new Request('http://local/api/collaboration'+url,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(token?{Authorization:'Bearer '+token}:{}),...extra.headers},body:body===undefined?undefined:JSON.stringify(body)}));return {status:response.status,headers:response.headers,data:response.status===204?null:await response.json()}}
 const mint=async(role='editor',scopes=['*'])=>(await call('/admin/links',{role,scopes,label:'Test team',days:30},adminKey)).data
 return {...service,call,mint,adminKey}
}
const edit=(value='Team copy',expectedRevision=0)=>({values:{'profile.card.title':value},expectedRevision,operationId:randomUUID(),actor:'Operator',context:{page:'个人中心',state:'未订阅',path:'/app/profile'}})
test('Every editable field has one stable block owner and hosted/local contracts agree',()=>{
 const catalog=require('../config/operations-copy.fields.json'),counts=new Map();for(const block of Object.values(registry.blocks))for(const key of block.fields)counts.set(key,(counts.get(key)||0)+1)
 assert.equal(counts.size,catalog.fields.length);assert.ok([...counts.values()].every(n=>n===1));assert.deepEqual(require('../collaboration-service/core/registry.json'),registry);assert.ok(registry.blocks['page.coach'].fields.length===0)
})
test('Anonymous viewing is read-only; flags, invalid keys and the old API cannot authorize writes',async t=>{
 const {call}=await fixture(t);assert.equal((await call('/copy')).status,200);assert.equal((await call('/blocks/profile.membership',edit())).status,401);assert.equal((await call('/blocks/profile.membership',edit(),'edit=1')).status,401);assert.equal((await call('/session',{},'x'.repeat(64))).status,401)
 const source=fs.readFileSync(path.resolve('server/index.cjs'),'utf8');assert.match(source,/route==='\/api\/prototype-copy'.*410/);assert.ok(!source.includes('copyFiles.save'))
})
test('Capabilities have scoped editor/reviewer roles, expiry and immediate revocation',async t=>{
 const {call,mint,adminKey,database}=await fixture(t),editor=await mint('editor',['profile.membership']),reviewer=await mint('reviewer')
 assert.equal((await call('/blocks/membership.discovery',edit(),editor.token)).status,403);assert.equal((await call('/blocks/profile.membership',edit(),reviewer.token)).status,403)
 assert.equal((await call('/blocks/profile.membership',edit(),editor.token)).status,200);assert.equal(database.prepare('SELECT token_hash FROM capabilities WHERE id=?').get(editor.id).token_hash.includes(editor.token),false)
 await call('/admin/links/'+editor.id+'/revoke',{},adminKey);assert.equal((await call('/session',{},editor.token)).status,401)
 database.prepare('UPDATE capabilities SET expires_at=? WHERE id=?').run('2000-01-01T00:00:00.000Z',reviewer.id);assert.equal((await call('/session',{},reviewer.token)).status,401)
})
test('Two writers use atomic per-block CAS and an immutable audit; unrelated blocks do not conflict',async t=>{
 const {call,mint,database}=await fixture(t),a=await mint(),b=await mint(),first=edit('Version A'),second=edit('Version B'),results=await Promise.all([call('/blocks/profile.membership',first,a.token),call('/blocks/profile.membership',second,b.token)])
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(database.prepare('SELECT count(*) n FROM copy_versions').get().n,1)
 const c=await call('/blocks/membership.discovery',{values:{'membership.preview.title':'A fresh start'},expectedRevision:0,operationId:randomUUID(),actor:'B'},b.token);assert.equal(c.status,200)
 const version=database.prepare('SELECT * FROM copy_versions WHERE block_id=?').get('profile.membership');assert.equal(version.revision,1);assert.equal(version.before_json,'{}');assert.deepEqual(JSON.parse(version.context_json),first.context)
})
test('Save retries are idempotent and a rollback creates a new version',async t=>{
 const {call,mint}=await fixture(t),key=(await mint()).token,input=edit('Original team title')
 const first=await call('/blocks/profile.membership',input,key),retry=await call('/blocks/profile.membership',input,key);assert.equal(first.status,200);assert.equal(retry.data.revision,1);assert.equal(retry.data.replayed,true)
 assert.equal((await call('/blocks/profile.membership',edit('New title',1),key)).data.revision,2);assert.equal((await call('/blocks/profile.membership',edit('Original team title',2),key)).data.revision,3)
 const block=await call('/blocks/profile.membership',undefined,key);assert.equal(block.data.versions.length,3);assert.equal(block.data.values['profile.card.title'],'Original team title')
})
test('Per-block validation protects variables, limits, field ownership and business fields',async t=>{
 const {call,mint}=await fixture(t),key=(await mint()).token
 for(const values of [{'profile.card.title':''},{'profile.card.title':'x'.repeat(161)},{'membership.preview.title':'wrong block'},{priceCents:0},{'profile.card.title':'Unknown {days}'}])assert.equal((await call('/blocks/profile.membership',{...edit(),values},key)).status,400)
 const base={expectedRevision:0,operationId:randomUUID(),actor:'Operator'};assert.equal((await call('/blocks/wall-common',{...base,values:{'wall.base.trialCta':'Free trial'}},key)).status,400);assert.equal((await call('/blocks/wall-common',{...base,values:{'wall.base.trialCta':'Try {days} days'}},key)).status,200)
})
test('Comments persist across clients, keep state context, escape markup and resolve without editing copy',async t=>{
 const {call,mint,database}=await fixture(t),a=await mint('reviewer'),b=await mint('editor'),input={body:'<script>review</script>\nShorten this',actor:'Reviewer',operationId:randomUUID(),context:{page:'会员中心',state:'免费',reviewKey:'must-not-store',path:'/app/membership'}}
 assert.equal((await call('/blocks/membership.discovery/comments',input,a.token)).status,201);assert.equal((await call('/blocks/membership.discovery/comments',input,a.token)).data.replayed,true)
 const read=(await call('/blocks/membership.discovery',undefined,b.token)).data;assert.equal(read.comments.length,1);assert.equal(read.comments[0].body,input.body);assert.equal(JSON.parse(read.comments[0].context_json).reviewKey,undefined);assert.equal(database.prepare('SELECT count(*) n FROM copy_blocks').get().n,0)
 assert.equal((await call('/comments/'+input.operationId+'/resolve',{},b.token)).status,200);assert.ok((await call('/blocks/membership.discovery',undefined,b.token)).data.comments[0].resolved_at)
})
test('Untrusted origins and oversized payloads are rejected; allowed preflight permits Authorization',async t=>{
 const {call,mint,handler}=await fixture(t),key=(await mint()).token
 assert.equal((await call('/blocks/profile.membership',edit(),key,{headers:{Origin:'https://evil.example'}})).status,403)
 const preflight=await handler(new Request('http://local/api/collaboration/copy',{method:'OPTIONS',headers:{Origin:'http://localhost:9876'}}));assert.equal(preflight.status,204);assert.match(preflight.headers.get('Access-Control-Allow-Headers'),/Authorization/)
 assert.equal((await call('/blocks/profile.membership',{...edit(),extra:'x'.repeat(33000)},key)).status,413)
})
test('A new frontend/backend build preserves database overrides and comments instead of reseeding',async t=>{
 const f=await fixture(t),key=(await f.mint()).token;await f.call('/blocks/profile.membership',edit('Persist across deploy'),key)
 const {createCollaborationService}=await import('../collaboration-service/core/service.mjs'),{sqliteAdapter}=require('../server/collaboration.cjs'),updated=structuredClone(registry);updated.defaults['profile.card.title']='Changed bundled default'
 const handler=createCollaborationService({db:sqliteAdapter(f.database),registry:updated}),response=await handler(new Request('http://local/api/collaboration/copy'));assert.equal((await response.json()).values['profile.card.title'],'Persist across deploy')
 const prepare=fs.readFileSync(path.resolve('scripts/prepare-copy-config.cjs'),'utf8');assert.ok(!prepare.includes('createCopyFiles'));assert.ok(!fs.readFileSync(path.resolve('src/copy/operations-copy.js'),'utf8').includes('localStorage'))
})
