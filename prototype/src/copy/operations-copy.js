import Vue from 'vue'
import registry from '../../config/collaboration-registry.json'
import {defaults,renderCopy,wallCopyConfiguration} from './copy-model.cjs'

let initialization,endpoint='',token='',timer,pendingOperation,pendingComment
const credentialKey='sunnyfit-review-credential:'+process.env.BASE_URL
const actorKey='sunnyfit-review-name:'+process.env.BASE_URL
export const copyState=Vue.observable({values:{...defaults.values},saved:{...defaults.values},revisions:{},ready:false,connected:false,busy:false,session:null,status:'',selected:null,tab:'edit',fields:[],draft:{},errors:{},comments:[],versions:[],conflict:false,actor:'',commentDraft:'',unavailable:false})
export const copyText=(id,parameters)=>renderCopy(copyState.values,id,parameters)
export const currentWallCopy=()=>wallCopyConfiguration(copyState.values)
export const copyDirty=()=>!!copyState.selected&&copyState.fields.some(field=>copyState.draft[field.key]!==copyState.saved[field.key])
export const hasPendingChanges=()=>copyDirty()||!!copyState.commentDraft.trim()
export const canEdit=id=>!!copyState.session&&copyState.session.role==='editor'&&copyState.session.scopes.some(scope=>scope==='*'||scope===id)
export const canReview=id=>!!copyState.session&&copyState.session.scopes.some(scope=>scope==='*'||scope===id)
export {registry}
function captureCredential(){
  const url=new URL(location.href),hash=url.hash.split('?'),query=new URLSearchParams(hash[1]||'');token=query.get('reviewKey')||url.searchParams.get('reviewKey')||''
  try{if(token)sessionStorage.setItem(credentialKey,token);else token=sessionStorage.getItem(credentialKey)||''}catch(_){}
  if(query.has('reviewKey')||url.searchParams.has('reviewKey')){query.delete('reviewKey');url.searchParams.delete('reviewKey');url.hash=hash[0]+(query.toString()?'?'+query:'');history.replaceState(history.state,'',url.href)}
}
async function request(path,body,authorized=true){
  if(!endpoint)throw Error('共享协作服务尚未启用。')
  const response=await fetch(endpoint+path,{method:body===undefined?'GET':'POST',headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(authorized&&token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(8000)})
  const result=await response.json().catch(()=>({message:'协作服务暂不可用。'}))
  if(!response.ok){const error=Error(result.message||'协作请求未完成。');error.status=response.status;if(response.status===401){copyState.session=null;try{sessionStorage.removeItem(credentialKey)}catch(_){}}throw error}return result
}
async function refresh(){
  const result=await request('/copy',undefined,false)
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
    try{const config=await(await fetch(process.env.BASE_URL+'config/collaboration.json',{cache:'no-store',signal:AbortSignal.timeout(5000)})).json();endpoint=config.apiBase||''}catch(_){}
    if(process.env.VUE_APP_DEMO_RUNTIME!=='browser')endpoint='/api/collaboration'
    try{await refresh();if(token)copyState.session=await request('/session',{})}catch(error){copyState.unavailable=true;if(token)copyState.status=error.message}finally{copyState.ready=true}
    window.addEventListener('hashchange',async()=>{if(!new URLSearchParams(location.hash.split('?')[1]||'').has('reviewKey'))return;captureCredential();copyState.session=null;discardCopy();try{copyState.session=await request('/session',{});copyState.unavailable=false;if(copyState.selected)await loadBlock()}catch(error){copyState.status=error.message}})
    window.addEventListener('beforeunload',event=>{if(hasPendingChanges()){event.preventDefault();event.returnValue=''}})
    // A small poll keeps independent reviewers current. Dirty drafts retain their base revision.
    timer=setInterval(()=>{if(document.visibilityState==='visible'&&!copyState.busy&&!copyDirty())refresh().then(()=>copyState.selected&&canReview(copyState.selected.id)?loadBlock(false):null).catch(()=>{copyState.connected=false})},20000)
  })();return initialization
}
function resetDraft(){if(!copyState.selected)return;const id=copyState.selected.id;copyState.draft=Object.fromEntries(copyState.fields.map(field=>[field.key,copyState.saved[field.key]]));copyState.selected={...copyState.selected,revision:copyState.revisions[id]||0};copyState.errors={};copyState.conflict=false;pendingOperation=null}
export function selectCopyBlock(id,tab,context,visibleFields){
  if(copyState.busy)return false
  const block=registry.blocks[id];if(!block)return false
  if(hasPendingChanges()&&!window.confirm('当前区块有未保存的内容，是否放弃修改？'))return false
  discardCopy();copyState.commentDraft='';pendingComment=null;copyState.selected={id,label:block.label,context,revision:copyState.revisions[id]||0};copyState.fields=block.fields.filter(key=>!visibleFields||visibleFields.includes(key)).map(key=>registry.fields.find(field=>field.key===key));resetDraft();copyState.comments=[];copyState.versions=[];copyState.tab=tab;copyState.status=''
  if(canReview(id))loadBlock().catch(error=>{copyState.status=error.message});return true
}
export function closeCopyBlock(){if(copyState.busy)return false;if(hasPendingChanges()&&!window.confirm('当前区块有未保存的内容，是否放弃修改？'))return false;discardCopy();copyState.selected=null;copyState.fields=[];copyState.draft={};copyState.commentDraft='';pendingComment=null;copyState.status='';return true}
export function editCopy(id,value){if(!copyState.selected||!canEdit(copyState.selected.id)||!copyState.fields.some(field=>field.key===id))return;Vue.set(copyState.draft,id,value);Vue.set(copyState.values,id,value);copyState.status='';pendingOperation=null;validateDraft()}
function validateDraft(){const errors={};for(const field of copyState.fields){const value=copyState.draft[field.key];if(!value.trim()&&field.inherit)continue;if(!value.trim())errors[field.key]='请填写文案。';else if([...value].length>field.max)errors[field.key]='最多 '+field.max+' 个字符。';else{const tokens=[...new Set(value.match(/\{[a-zA-Z]+\}/g)||[])];if(tokens.some(t=>!field.tokens.includes(t))||field.tokens.some(t=>!tokens.includes(t)))errors[field.key]='请保留变量 '+field.tokens.join('、')+'。'}}copyState.errors=errors;return !Object.keys(errors).length}
export function discardCopy(){copyState.values={...copyState.saved};resetDraft();copyState.status=''}
export async function loadBlock(reset=true){
  const selected=copyState.selected;if(!selected||!canReview(selected.id))return
  const result=await request('/blocks/'+selected.id);if(copyState.selected!==selected)return
  copyState.comments=result.comments;copyState.versions=result.versions
  if(reset&&!copyDirty()){copyState.saved={...copyState.saved,...result.values};copyState.values={...copyState.saved};Vue.set(copyState.revisions,selected.id,result.revision);resetDraft()}
}
export async function reloadCopy(){if(copyDirty()&&!window.confirm('载入最新版本会放弃当前草稿，是否继续？'))return;discardCopy();await refresh();await loadBlock();copyState.status='已载入最新版本。'}
export async function saveCopy(){
  if(copyState.busy||!copyState.selected||!canEdit(copyState.selected.id)||!copyDirty()||!validateDraft())return
  if(!copyState.actor.trim()){copyState.status='请填写用于修改记录的显示名称。';return}
  try{sessionStorage.setItem(actorKey,copyState.actor)}catch(_){}
  const selected=copyState.selected;copyState.busy=true
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
export function previewVersion(version){if(!canEdit(copyState.selected.id))return;const values=JSON.parse(version.after_json);for(const field of copyState.fields)editCopy(field.key,values[field.key]===undefined?defaults.values[field.key]:values[field.key]);copyState.tab='edit';copyState.status='正在预览 v'+version.revision+'；保存后生成新版本。'}
export function installCopy(VueConstructor){
  VueConstructor.prototype.$copy=copyText
  VueConstructor.directive('copy-block',{bind:mark,update:mark})
}
function mark(element,binding){const value=binding.value,id=typeof value==='string'?value:value?.id;if(registry.blocks[id]){element.setAttribute('data-copy-block',id);if(value.fields)element.setAttribute('data-copy-fields',JSON.stringify(value.fields));else element.removeAttribute('data-copy-fields')}else{element.removeAttribute('data-copy-block');element.removeAttribute('data-copy-fields')}}
