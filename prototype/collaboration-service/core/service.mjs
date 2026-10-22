// Portable Web API + SQL only: used unchanged by D1 and the local SQLite adapter.
export class ReviewError extends Error{constructor(status,message){super(message);this.status=status}}
const fail=(status,message)=>{throw new ReviewError(status,message)};
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(n=>n.toString(16).padStart(2,'0')).join('');
const now=()=>new Date().toISOString(),uuid=()=>crypto.randomUUID();
const string=(value,max,label)=>typeof value==='string'&&value.trim()&&[...value].length<=max?value.trim():fail(400,label+'格式不正确。');
const operation=value=>/^[a-zA-Z0-9-]{16,80}$/.test(value||'')?value:fail(400,'缺少有效的操作标识。');
const contextOf=input=>Object.fromEntries(['page','state','path','target','field','surface'].filter(key=>typeof input?.[key]==='string').map(key=>[key,input[key].slice(0,500)]));
export function createCollaborationService({db,registry,adminKey='',editPassword='',allowedOrigins=/** @type {string[]} */([])}){
  const fields=new Map(registry.fields.map(field=>[field.key,field]));
  const hasBlock=id=>Object.prototype.hasOwnProperty.call(registry.blocks,id);
  const blockFor=id=>hasBlock(id)?registry.blocks[id]:fail(404,'此区块已不在当前原型中。');
  const valuesFor=(id,values)=>{
    const block=blockFor(id);if(!values||Array.isArray(values)||typeof values!=='object'||!Object.keys(values).length)fail(400,'请提交当前区块的文案。');
    for(const [key,value]of Object.entries(values)){
      if(!block.fields.includes(key))fail(400,'不能修改其他区块的字段。');const field=fields.get(key);
      if(typeof value!=='string'||[...value].length>field.max||(!value.trim()&&!field.inherit))fail(400,field.label+'：请填写文案，最多 '+field.max+' 个字符。');
      if(!value.trim()&&field.inherit)continue;
      const tokens=[...new Set(value.match(/\{[a-zA-Z]+\}/g)||[])];if(tokens.some(t=>!field.tokens.includes(t))||field.tokens.some(t=>!tokens.includes(t)))fail(400,field.label+'：请保留变量 '+field.tokens.join('、')+'。');
    }return values;
  };
  async function authorize(request,id,edit=false){
    const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');
    if(token.startsWith('pw1.')){
      const parts=token.split('.');if(!editPassword||!adminKey||parts.length!==3||parts[1].length>100||!equal(parts[2],await sign(parts[1])))fail(401,'协作链接已失效，请联系原型维护者。');
      return {id:'password:'+parts[1],role:'editor',scopes_json:JSON.stringify(Object.keys(registry.blocks)),expires_at:null,auth_type:'password'};
    }
    if(!/^[\w-]{40,100}$/.test(token))fail(401,'请使用有效的协作链接。');
    const capability=await db.first('SELECT * FROM capabilities WHERE token_hash=?',[await hash(token)]);
    if(!capability||capability.revoked_at||capability.expires_at<=now())fail(401,'协作链接已失效，请联系原型维护者。');
    if(edit&&capability.role!=='editor')fail(403,'当前链接可评论，不能修改文案。');
    if(id&&!JSON.parse(capability.scopes_json).some(scope=>scope==='*'||scope===id))fail(403,'当前链接无权操作此区块。');
    return capability;
  }
  function equal(a,b){if(typeof a!=='string'||a.length!==b.length)return false;let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0}
  async function sign(value){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(adminKey+':'+editPassword),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)))).map(byte=>byte.toString(16).padStart(2,'0')).join('')}
  const sessionFor=cap=>({role:cap.role,label:cap.auth_type==='password'?'Password editor':cap.label,scopes:JSON.parse(cap.scopes_json),expiresAt:cap.expires_at,authType:cap.auth_type||'link',persistent:cap.auth_type==='password'});
  async function bodyOf(request){if(Number(request.headers.get('Content-Length'))>32000)fail(413,'内容过长。');const text=await request.text();if(text.length>32000)fail(413,'内容过长。');try{return JSON.parse(text)}catch{fail(400,'提交内容不是有效 JSON。')}}
  const json=(data,status=200,origin)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',...(origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})}});
  return async function handle(request){
    const origin=request.headers.get('Origin'),url=new URL(request.url),path=url.pathname.replace(/^\/api\/collaboration/,'');
    const permitted=origin&&allowedOrigins.includes(origin);
    try{
      if(origin&&!permitted)fail(403,'此预览来源未获授权。');
      if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...(permitted?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{}),'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'600'}});
      const reply=(data,status=200)=>json(data,status,permitted?origin:null);
      if(path==='/rpc'&&request.method==='POST'){
        const input=await bodyOf(request);if(!/^\/(session|blocks\/[\w.-]+(?:\/comments)?|comments\/[\w-]+\/resolve)$/.test(input.path||'')||!['GET','POST'].includes(input.method))fail(400,'协作请求无效。');
        const headers=new Headers({'Content-Type':'application/json'});if(origin)headers.set('Origin',origin);if(input.credential)headers.set('Authorization','Bearer '+input.credential);
        return handle(new Request(url.origin+'/api/collaboration'+input.path,{method:input.method,headers,body:input.method==='POST'?JSON.stringify(input.body||{}):undefined}));
      }
      if(path==='/password-session'&&request.method==='POST'){
        if(!editPassword||!adminKey)fail(503,'密码编辑尚未启用。');const input=await bodyOf(request),date=now(),window='login:'+date.slice(0,16)+':'+(await hash(request.headers.get('CF-Connecting-IP')||'local')).slice(0,16);
        await db.batch([{sql:'INSERT INTO comment_limits (window,count) VALUES (?,1) ON CONFLICT(window) DO UPDATE SET count=count+1',params:[window]},{sql:"DELETE FROM comment_limits WHERE window LIKE 'login:%' AND window<?",params:['login:'+new Date(Date.now()-120000).toISOString().slice(0,16)]}]);
        if((await db.first('SELECT count FROM comment_limits WHERE window=?',[window])).count>20)fail(429,'验证次数较多，请稍后再试。');
        if(typeof input.password!=='string'||input.password.length>128||!equal(await hash(input.password),await hash(editPassword)))fail(401,'编辑密码不正确。');
        const nonce=uuid(),token='pw1.'+nonce+'.'+await sign(nonce),cap=await authorize(new Request(request.url,{headers:{Authorization:'Bearer '+token}}));return reply({token,session:sessionFor(cap)});
      }
      if(path==='/health'&&request.method==='GET')return reply({status:'ok',registryVersion:registry.registryVersion,passwordEnabled:!!editPassword});
      if(path.startsWith('/admin/')){
        const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');if(!adminKey||!token||await hash(token)!==await hash(adminKey))fail(401,'管理凭证无效。');
        if(path==='/admin/links'&&request.method==='GET')return reply({links:await db.all('SELECT id,label,role,scopes_json,created_at,expires_at,revoked_at FROM capabilities ORDER BY created_at DESC LIMIT 100')});
        if(path==='/admin/links'&&request.method==='POST'){
          const input=await bodyOf(request),role=['editor','reviewer'].includes(input.role)?input.role:fail(400,'请选择编辑或评论权限。'),label=string(input.label,80,'链接名称'),days=Number(input.days||30);
          if(!Number.isInteger(days)||days<1||days>90)fail(400,'有效期应为 1–90 天。');
          const scopes=input.scopes||['*'];if(!Array.isArray(scopes)||!scopes.length||scopes.some(id=>id!=='*'&&!hasBlock(id)))fail(400,'区块范围无效。');
          const token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(n=>n.toString(16).padStart(2,'0')).join(''),id=uuid(),createdAt=now(),expiresAt=new Date(Date.now()+days*86400000).toISOString();
          await db.batch([{sql:'INSERT INTO capabilities (id,token_hash,label,role,scopes_json,created_at,expires_at) VALUES (?,?,?,?,?,?,?)',params:[id,await hash(token),label,role,JSON.stringify(scopes),createdAt,expiresAt]}]);return reply({id,token,role,expiresAt},201);
        }
        const match=path.match(/^\/admin\/links\/([\w-]+)\/revoke$/);if(match&&request.method==='POST'){await db.batch([{sql:'UPDATE capabilities SET revoked_at=? WHERE id=?',params:[now(),match[1]]}]);return reply({revoked:true});}
        fail(404,'管理接口不存在。');
      }
      if(path==='/copy'&&request.method==='GET'){
        const rows=await db.all('SELECT id,revision,values_json,updated_at FROM copy_blocks'),values={},revisions={};
        for(const row of rows){if(!hasBlock(row.id))continue;revisions[row.id]=row.revision;for(const[key,value]of Object.entries(JSON.parse(row.values_json)))if(fields.has(key))values[key]=value;}
        return reply({schemaVersion:1,registryVersion:registry.registryVersion,values,revisions});
      }
      if(path==='/session'&&request.method==='POST'){return reply(sessionFor(await authorize(request)));}
      const match=path.match(/^\/blocks\/([\w.-]+)$/);
      if(match){
        const id=match[1];blockFor(id);const cap=await authorize(request,id,request.method==='POST');
        if(request.method==='GET'){
          const row=await db.first('SELECT * FROM copy_blocks WHERE id=?',[id]);return reply({id,revision:row?.revision||0,values:row?JSON.parse(row.values_json):{},comments:await db.all('SELECT id,body,actor,context_json,created_at,resolved_at FROM comments WHERE block_id=? ORDER BY created_at DESC LIMIT 100',[id]),versions:await db.all('SELECT id,revision,after_json,actor,created_at FROM copy_versions WHERE block_id=? ORDER BY revision DESC LIMIT 20',[id])});
        }
        if(request.method==='POST'){
          const input=await bodyOf(request),values=valuesFor(id,input.values),op=operation(input.operationId),actor=string(input.actor,40,'显示名称');
          if(!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0)fail(400,'缺少区块版本。');
          const prior=await db.first('SELECT * FROM copy_versions WHERE id=?',[op]);
          if(prior){if(prior.block_id===id&&prior.capability_id===cap.id&&Object.entries(values).every(([k,v])=>JSON.parse(prior.after_json)[k]===v))return reply({revision:prior.revision,values:JSON.parse(prior.after_json),replayed:true});fail(409,'操作标识已被使用。');}
          const current=await db.first('SELECT * FROM copy_blocks WHERE id=?',[id]),before=current?JSON.parse(current.values_json):{},after={...before,...values},date=now();
          const results=await db.batch([
            {sql:"INSERT OR IGNORE INTO copy_blocks (id,revision,values_json) VALUES (?,0,'{}')",params:[id]},
            {sql:'UPDATE copy_blocks SET values_json=?,revision=revision+1,updated_at=?,operation_id=? WHERE id=? AND revision=?',params:[JSON.stringify(after),date,op,id,input.expectedRevision]},
            {sql:'INSERT INTO copy_versions (id,block_id,revision,before_json,after_json,actor,capability_id,context_json,created_at) SELECT ?,id,revision,?,?,?,?,?,? FROM copy_blocks WHERE id=? AND operation_id=?',params:[op,JSON.stringify(before),JSON.stringify(after),actor,cap.id,JSON.stringify(contextOf(input.context)),date,id,op]}
          ]);
          if(!results[1].changes)fail(409,'此区块已有新版本。请载入最新内容后重新修改。');return reply({revision:input.expectedRevision+1,values:after,updatedAt:date});
        }
      }
      const commentMatch=path.match(/^\/blocks\/([\w.-]+)\/comments$/);
      if(commentMatch&&request.method==='GET'){
        const id=commentMatch[1];blockFor(id);return reply({comments:await db.all('SELECT id,body,actor,context_json,created_at,resolved_at FROM comments WHERE block_id=? ORDER BY created_at DESC LIMIT 100',[id])});
      }
      if(commentMatch&&request.method==='POST'){
        const id=commentMatch[1];blockFor(id);let capabilityId='public';if(request.headers.has('Authorization')){try{capabilityId=(await authorize(request)).id}catch(error){if(error.status!==401)throw error}}
        const input=await bodyOf(request),op=operation(input.operationId),actor=string(input.actor,40,'显示名称'),body=string(input.body,2000,'评论'),date=now();
        const prior=await db.first('SELECT * FROM comments WHERE id=?',[op]);if(prior){if(prior.capability_id===capabilityId&&prior.body===body&&prior.block_id===id)return reply({id:op,replayed:true});fail(409,'评论标识已使用。');}
        const window=date.slice(0,16),cutoff=new Date(Date.now()-120000).toISOString().slice(0,16),results=await db.batch([
          {sql:'INSERT INTO comment_limits (window,count) VALUES (?,1) ON CONFLICT(window) DO UPDATE SET count=count+1',params:[window]},
          {sql:'INSERT INTO comments (id,block_id,body,actor,capability_id,context_json,created_at) SELECT ?,?,?,?,?,?,? WHERE (SELECT count FROM comment_limits WHERE window=?)<=30',params:[op,id,body,actor,capabilityId,JSON.stringify(contextOf(input.context)),date,window]},
          {sql:'DELETE FROM comment_limits WHERE window<?',params:[cutoff]}
        ]);if(!results[1].changes)fail(429,'评论提交较频繁，请稍后重试。');return reply({id:op,createdAt:date},201);
      }
      const resolve=path.match(/^\/comments\/([\w-]+)\/resolve$/);
      if(resolve&&request.method==='POST'){
        const row=await db.first('SELECT * FROM comments WHERE id=?',[resolve[1]]);if(!row)fail(404,'评论不存在。');const cap=await authorize(request,row.block_id);if(cap.role!=='editor'&&cap.id!==row.capability_id)fail(403,'只有编辑者或该评论的提交链接可标记解决。');
        await db.batch([{sql:'UPDATE comments SET resolved_at=?,resolved_by=? WHERE id=? AND resolved_at IS NULL',params:[now(),cap.id,row.id]}]);return reply({resolved:true});
      }
      fail(404,'协作接口不存在。');
    }catch(error){if(!(error instanceof ReviewError))console.error('Collaboration request failed',error.name);return json({message:error instanceof ReviewError?error.message:'协作服务暂不可用，请稍后重试。'},error.status||500,permitted?origin:null);}
  };
}
