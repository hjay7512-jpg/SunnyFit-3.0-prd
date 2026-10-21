import Vue from 'vue'
import registry from '../../config/collaboration-registry.json'
import {defaults,renderCopy,wallCopyConfiguration} from './copy-model.cjs'
import {locationsForBlock,locationForFields} from './copy-locations.cjs'
import {validSession,capabilityRejected} from './copy-auth.cjs'

let initialization,endpoint='',token='',timer,pendingOperation,pendingComment,recovery,authFlight,authSequence=0,copyWriteSequence=0
const credentialKey='sunnyfit-review-credential:'+process.env.BASE_URL
const rememberedKey='sunnyfit-editor-session:'+process.env.BASE_URL
const actorKey='sunnyfit-review-name:'+process.env.BASE_URL
export const copyState=Vue.observable({values:{...defaults.values},saved:{...defaults.values},revisions:{},ready:false,connected:false,busy:false,session:null,authStatus:'none',authBusy:false,authMessage:'',status:'',selected:null,tab:'edit',fields:[],visibleFields:[],location:'',preview:null,draft:{},errors:{},comments:[],versions:[],conflict:false,actor:'',commentDraft:'',unavailable:false})
export const copyText=(id,parameters)=>renderCopy(copyState.values,id,parameters)
export const currentWallCopy=()=>wallCopyConfiguration(copyState.values)
export const copyDirty=()=>!!copyState.selected&&copyState.fields.some(field=>copyState.draft[field.key]!==copyState.saved[field.key])
export const hasPendingChanges=()=>copyDirty()||!!copyState.commentDraft.trim()
export const canEdit=id=>validSession(copyState.session)&&copyState.session.role==='editor'&&copyState.session.scopes.some(scope=>scope==='*'||scope===id)
export const canReview=id=>Object.prototype.hasOwnProperty.call(registry.blocks,id)
export {registry}
function captureCredential(){
  const url=new URL(location.href),hash=url.hash.split('?'),query=new URLSearchParams(hash[1]||''),previous=token;token=query.get('reviewKey')||url.searchParams.get('reviewKey')||''
  try{if(token)sessionStorage.setItem(credentialKey,token);else token=sessionStorage.getItem(credentialKey)||''}catch(_){}
  try{const saved=JSON.parse(localStorage.getItem(rememberedKey)||'null');if(saved&&saved.token?.startsWith('pw1.')&&validSession(saved.session)){token=saved.token;copyState.session=saved.session}}catch(_){}
  if(previous!==token){authSequence++;if(!token.startsWith('pw1.'))copyState.session=null;copyState.authBusy=false;copyState.authStatus=validSession(copyState.session)?'authorized':token?'checking':'none';copyState.authMessage=''}
  if(query.has('reviewKey')||url.searchParams.has('reviewKey')){query.delete('reviewKey');url.searchParams.delete('reviewKey');url.hash=hash[0]+(query.toString()?'?'+query:'');history.replaceState(history.state,'',url.href)}
}
async function request(path,body,authorized=true){
  if(!endpoint)throw Error('共享协作服务尚未启用。')
  const requestToken=token,sequence=authSequence,rpc=authorized&&requestToken.startsWith('pw1.'),payload=rpc?{path,method:body===undefined?'GET':'POST',body,credential:requestToken}:body,response=await fetch(endpoint+(rpc?'/rpc':path),{method:rpc||body!==undefined?'POST':'GET',headers:{...(payload!==undefined?{'Content-Type':'text/plain;charset=UTF-8'}:{}),...(!rpc&&authorized&&requestToken?{Authorization:'Bearer '+requestToken}:{})},body:payload===undefined?undefined:JSON.stringify(payload),cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(8000)})
  const isJson=/\bapplication\/json\b/i.test(response.headers.get('Content-Type')||''),result=isJson?await response.json().catch(()=>null):null
  if(!response.ok||!result){const error=Error(result?.message||'协作服务连接暂不可用，请重试。');error.status=response.status;error.capabilityRejected=authorized&&!!requestToken&&capabilityRejected(response.status,result,isJson);if(error.capabilityRejected&&sequence===authSequence&&requestToken===token){copyState.session=null;copyState.authStatus='invalid';copyState.authMessage=error.message;try{localStorage.removeItem(rememberedKey)}catch(_){}}throw error}return result
}
export async function unlockCopyWithPassword(password){
  await configureEndpoint();const result=await request('/password-session',{password},false);if(!result.token?.startsWith('pw1.')||!validSession(result.session))throw Error('密码验证暂未完成。');token=result.token;authSequence++;copyState.session=result.session;copyState.authStatus='authorized';copyState.authMessage='';try{sessionStorage.removeItem(credentialKey);localStorage.setItem(rememberedKey,JSON.stringify({token,session:result.session}))}catch(_){copyState.status='当前浏览器无法保存登录状态。'}await recoverCopyConnection();return true
}
export function lockCopyEditing(){if(!closeCopyBlock())return false;token='';authSequence++;copyState.session=null;copyState.authStatus='none';try{localStorage.removeItem(rememberedKey);sessionStorage.removeItem(credentialKey)}catch(_){}return true}
async function configureEndpoint(){
  if(endpoint)return
  if(process.env.VUE_APP_DEMO_RUNTIME!=='browser'){endpoint='/api/collaboration';return}
  const response=await fetch(process.env.BASE_URL+'config/collaboration.json',{cache:'no-store',signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error('协作配置暂不可用，请重试。');const config=await response.json();if(!config.apiBase)throw Error('共享协作服务尚未启用。');endpoint=config.apiBase
}
async function verifySession(force=false){
  if(!token){copyState.authStatus='none';return}
  if(token.startsWith('pw1.')&&validSession(copyState.session)&&!force){copyState.authStatus='authorized';return}
  if(copyState.authStatus==='invalid'&&!force)return
  if(authFlight?.token===token)return authFlight.promise
  const requestToken=token,sequence=authSequence
  copyState.authBusy=true;if(!copyState.session)copyState.authStatus='checking'
  const promise=(async()=>{
    try{const session=await request('/session',{});if(requestToken!==token||sequence!==authSequence)return;if(!validSession(session))throw Error('编辑权限验证暂未完成，请重试。');copyState.session=session;copyState.authStatus='authorized';copyState.authMessage=''}
    catch(error){if(requestToken!==token||sequence!==authSequence)return;if(error.capabilityRejected){copyState.session=null;copyState.authStatus='invalid'}else copyState.authStatus='unavailable';copyState.authMessage=error.capabilityRejected?error.message:'编辑权限暂未验证，连接恢复后会自动重试。'}
    finally{if(requestToken===token&&sequence===authSequence)copyState.authBusy=false}
  })();authFlight={token:requestToken,promise};try{await promise}finally{if(authFlight?.promise===promise)authFlight=null}
}
export async function recoverCopyConnection(force=false){
  if(recovery){const active=recovery;if(force&&endpoint)await verifySession(true);await active;if(force&&!endpoint)return recoverCopyConnection(true);return}
  recovery=(async()=>{
    try{
      await configureEndpoint()
      const result=await Promise.allSettled([refresh(),verifySession(force)])
      if(result[0].status==='rejected'){copyState.connected=false;copyState.status='共享文案连接暂不可用，请重试。'}
      if(!copyState.busy&&copyState.selected)await loadBlock(false)
    }catch(error){copyState.connected=false;copyState.status=error.message;if(token){copyState.authStatus='unavailable';copyState.authMessage='编辑权限暂未验证，连接恢复后会自动重试。'}}
    finally{copyState.unavailable=!copyState.connected}
  })();try{await recovery}finally{recovery=null}
}
async function refresh(){
  if(copyState.busy)return
  const sequence=copyWriteSequence
  const result=await request('/copy',undefined,false)
  if(sequence!==copyWriteSequence||copyState.busy)return
  if(result.schemaVersion!==1||!result.values||!result.revisions)throw Error('共享文案版本不兼容。')
  const values={...defaults.values};for(const [key,value]of Object.entries(result.values))if(Object.prototype.hasOwnProperty.call(values,key)&&typeof value==='string')values[key]=value
  const selected=copyState.selected,dirty=copyDirty();copyState.saved=values;copyState.revisions=result.revisions
  copyState.values={...values,...(dirty?copyState.draft:{})};copyState.connected=true;copyState.unavailable=false
  if(selected&&!dirty)resetDraft()
}
export function initializeCopy(){
  if(initialization)return initialization
  initialization=(async()=>{
    captureCredential()
    try{copyState.actor=sessionStorage.getItem(actorKey)||''}catch(_){}
    window.addEventListener('hashchange',async()=>{if(!new URLSearchParams(location.hash.split('?')[1]||'').has('reviewKey'))return;captureCredential();await recoverCopyConnection(true)})
    window.addEventListener('beforeunload',event=>{if(hasPendingChanges()){event.preventDefault();event.returnValue=''}})
    window.addEventListener('online',()=>recoverCopyConnection())
    window.addEventListener('storage',event=>{if(event.key===rememberedKey&&!event.newValue){token='';authSequence++;copyState.session=null;copyState.authStatus='none'}})
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')recoverCopyConnection()})
    // A small poll keeps independent reviewers current. Dirty drafts retain their base revision.
    timer=setInterval(()=>{if(document.visibilityState==='visible'&&!copyState.busy)recoverCopyConnection()},20000)
    await recoverCopyConnection();copyState.ready=true
  })();return initialization
}
function resetDraft(){if(!copyState.selected)return;const id=copyState.selected.id;copyState.draft=Object.fromEntries(copyState.fields.map(field=>[field.key,copyState.saved[field.key]]));copyState.selected={...copyState.selected,revision:copyState.revisions[id]||0};copyState.errors={};copyState.conflict=false;pendingOperation=null}
export function selectCopyBlock(id,tab,context,visibleFields){
  if(copyState.busy)return false
  const block=registry.blocks[id];if(!block)return false
  if(hasPendingChanges()&&!window.confirm('当前区块有未保存的内容，是否放弃修改？'))return false
  const preview=copyState.preview
  discardCopy();copyState.commentDraft='';pendingComment=null;copyState.selected={id,label:block.label,context,revision:copyState.revisions[id]||0};copyState.fields=block.fields.map(key=>registry.fields.find(field=>field.key===key));copyState.visibleFields=block.fields.filter(key=>!visibleFields||visibleFields.includes(key));copyState.location=preview&&id==='entry-'+preview.kind&&copyState.visibleFields.every(key=>preview.fields.includes(key))?preview.id:locationForFields(id,copyState.visibleFields)?.id||'';resetDraft();copyState.comments=[];copyState.versions=[];copyState.tab=tab;copyState.status=''
  if(canReview(id))loadBlock().catch(error=>{copyState.status=error.message});return true
}
export function closeCopyBlock(){if(copyState.busy)return false;if(hasPendingChanges()&&!window.confirm('当前区块有未保存的内容，是否放弃修改？'))return false;discardCopy();copyState.selected=null;copyState.fields=[];copyState.visibleFields=[];copyState.location='';copyState.preview=null;copyState.draft={};copyState.commentDraft='';pendingComment=null;copyState.status='';return true}
export function previewCopyLocation(id,kind){
  if(copyState.busy||!copyState.selected)return
  const blockId=kind?'entry-'+kind:copyState.selected.id;if(!canEdit(blockId))return
  const location=locationsForBlock(blockId).find(item=>item.id===id);if(!location)return
  if(copyState.selected.id===blockId){copyState.location=id;copyState.visibleFields=location.fields.filter(key=>registry.blocks[blockId].fields.includes(key))}
  copyState.preview={...location,kind:blockId.slice(6)}
}
export function exitCopyPreview(){copyState.preview=null}
export function editCopy(id,value){if(!copyState.selected||!canEdit(copyState.selected.id)||!copyState.fields.some(field=>field.key===id))return;Vue.set(copyState.draft,id,value);Vue.set(copyState.values,id,value);copyState.status='';pendingOperation=null;validateDraft()}
function validateDraft(){const errors={};for(const field of copyState.fields){const value=copyState.draft[field.key];if(!value.trim()&&field.inherit)continue;if(!value.trim())errors[field.key]='请填写文案。';else if([...value].length>field.max)errors[field.key]='最多 '+field.max+' 个字符。';else{const tokens=[...new Set(value.match(/\{[a-zA-Z]+\}/g)||[])];if(tokens.some(t=>!field.tokens.includes(t))||field.tokens.some(t=>!tokens.includes(t)))errors[field.key]='请保留变量 '+field.tokens.join('、')+'。'}}copyState.errors=errors;return !Object.keys(errors).length}
export function discardCopy(){copyState.values={...copyState.saved};resetDraft();copyState.status=''}
export async function loadBlock(reset=true){
  const selected=copyState.selected;if(!selected||!canReview(selected.id))return
  const editable=canEdit(selected.id),result=await request('/blocks/'+selected.id+(editable?'':'/comments'),undefined,editable);if(copyState.selected!==selected)return
  copyState.connected=true;copyState.unavailable=false
  copyState.comments=result.comments;copyState.versions=result.versions||[]
  if(editable&&reset&&!copyDirty()){copyState.saved={...copyState.saved,...result.values};copyState.values={...copyState.saved};Vue.set(copyState.revisions,selected.id,result.revision);resetDraft()}
}
export async function reloadCopy(){if(copyDirty()&&!window.confirm('载入最新版本会放弃当前草稿，是否继续？'))return;discardCopy();await refresh();await loadBlock();copyState.status='已载入最新版本。'}
export async function saveCopy(){
  if(copyState.busy||!copyState.selected||!canEdit(copyState.selected.id)||!copyDirty()||!validateDraft())return
  if(!copyState.actor.trim()){copyState.status='请填写用于修改记录的显示名称。';return}
  try{sessionStorage.setItem(actorKey,copyState.actor)}catch(_){}
  const selected=copyState.selected;copyState.busy=true;copyWriteSequence++
  try{
    pendingOperation=pendingOperation||crypto.randomUUID();const result=await request('/blocks/'+selected.id,{values:copyState.draft,expectedRevision:selected.revision,operationId:pendingOperation,actor:copyState.actor,context:selected.context})
    copyState.saved={...copyState.saved,...result.values};copyState.values={...copyState.saved};Vue.set(copyState.revisions,selected.id,result.revision);resetDraft();await loadBlock(false);copyState.status='区块已保存 · v'+result.revision;return result
  }catch(error){copyState.status=error.message;copyState.conflict=error.status===409;return null}finally{copyState.busy=false}
}
export async function submitComment(){
  if(copyState.busy||!copyState.selected||!canReview(copyState.selected.id))return
  if(!copyState.actor.trim()||!copyState.commentDraft.trim()){copyState.status='请填写显示名称和评论。';return}
  try{sessionStorage.setItem(actorKey,copyState.actor)}catch(_){}
  const signature=JSON.stringify([copyState.selected.id,copyState.commentDraft,copyState.actor]);if(!pendingComment||pendingComment.signature!==signature)pendingComment={signature,id:crypto.randomUUID()}
  copyState.busy=true;try{await request('/blocks/'+copyState.selected.id+'/comments',{body:copyState.commentDraft,actor:copyState.actor,context:copyState.selected.context,operationId:pendingComment.id});copyState.commentDraft='';pendingComment=null;await loadBlock(false);copyState.status='评论已提交。'}catch(error){copyState.status=error.message}finally{copyState.busy=false}
}
export async function resolveComment(id){if(copyState.busy)return;copyState.busy=true;try{await request('/comments/'+id+'/resolve',{});await loadBlock(false);copyState.status='评论已标记解决。'}catch(error){copyState.status=error.message}finally{copyState.busy=false}}
export function previewVersion(version){if(!canEdit(copyState.selected.id))return;const values=JSON.parse(version.after_json);for(const field of copyState.fields.filter(field=>copyState.visibleFields.includes(field.key)))editCopy(field.key,values[field.key]===undefined?defaults.values[field.key]:values[field.key]);copyState.tab='edit';copyState.status='正在预览当前展示位置的 v'+version.revision+'；保存后生成新版本。'}
export function installCopy(VueConstructor){
  VueConstructor.prototype.$copy=copyText
  VueConstructor.directive('copy-block',{bind:mark,update:mark})
}
function mark(element,binding){const value=binding.value,id=typeof value==='string'?value:value?.id;if(registry.blocks[id]){element.setAttribute('data-copy-block',id);if(value.fields)element.setAttribute('data-copy-fields',JSON.stringify(value.fields));else element.removeAttribute('data-copy-fields')}else{element.removeAttribute('data-copy-block');element.removeAttribute('data-copy-fields')}}
