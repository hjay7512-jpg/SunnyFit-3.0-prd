import Vue from 'vue'
import {defaults,validateCopyDocument,renderCopy,wallCopyConfiguration} from './copy-model.cjs'

const key='sunnyfit-operations-copy:v1:'+process.env.BASE_URL,browserRuntime=process.env.VUE_APP_DEMO_RUNTIME==='browser'
let serverRevision=defaults.revision,initialization
export const copyState=Vue.observable({values:{...defaults.values},saved:defaults,busy:false,ready:false,source:'内置配置',filename:'operations-copy.json',status:'',errors:{},external:false})
export const copyText=(id,parameters)=>renderCopy(copyState.values,id,parameters)
export const currentWallCopy=()=>wallCopyConfiguration(copyState.values)
export const copyDirty=()=>JSON.stringify(copyState.values)!==JSON.stringify(copyState.saved.values)
const document=()=>({schemaVersion:1,locale:'en-US',values:{...copyState.values}})
const accept=(value,source,filename)=>{copyState.saved=value;copyState.values={...value.values};copyState.source=source;copyState.filename=filename||value.revision+'.json';copyState.errors={};copyState.external=false}
async function storageDirectory(){if(!navigator.storage?.getDirectory)return null;const root=await navigator.storage.getDirectory();return root.getDirectoryHandle('sunnyfit-copy-'+process.env.BASE_URL.replace(/[^a-zA-Z0-9_-]/g,'_'),{create:true})}
async function readBrowserFile(){try{const directory=await storageDirectory();if(!directory)return null;const manifest=JSON.parse(await(await(await directory.getFileHandle('latest.json')).getFile()).text());if(!/^copy-[a-zA-Z0-9-]+\.json$/.test(manifest.filename))return null;const saved=JSON.parse(await(await(await directory.getFileHandle(manifest.filename)).getFile()).text());return validateCopyDocument(saved).valid?{document:saved,filename:manifest.filename}:null}catch(_){return null}}
async function writeBrowserFile(value,filename){const directory=await storageDirectory();if(!directory)return false;const write=async(name,text)=>{const handle=await directory.getFileHandle(name,{create:true}),stream=await handle.createWritable();await stream.write(text);await stream.close()};await write(filename,JSON.stringify(value,null,2)+'\n');await write('latest.json',JSON.stringify({filename}));return true}
async function requestLatest(){const url=browserRuntime?process.env.BASE_URL+'config/operations-copy.latest.json':'/api/prototype-copy';const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error('Latest copy is unavailable');const value=await response.json();if(!validateCopyDocument(value).valid)throw Error('Latest copy is invalid');if(!browserRuntime)serverRevision=value.revision;return value}
export function initializeCopy(){
  if(initialization)return initialization
  initialization=(async()=>{const candidates=[{document:defaults,source:'内置配置',filename:'operations-copy.json'}];try{const cached=JSON.parse(localStorage.getItem(key)||'null');if(validateCopyDocument(cached).valid)candidates.push({document:cached,source:'此浏览器已保存配置'})}catch(_){}
    const results=await Promise.allSettled([requestLatest(),readBrowserFile()]);if(results[0].status==='fulfilled')candidates.push({document:results[0].value,source:browserRuntime?'随原型发布的配置':'本地配置文件',filename:results[0].value.revision===defaults.revision?(browserRuntime?'operations-copy.latest.json':'operations-copy.json'):results[0].value.revision+'.json'});if(results[1].status==='fulfilled'&&results[1].value)candidates.push({...results[1].value,source:'此浏览器本地配置文件'})
    const ranked=candidates.map((candidate,index)=>({...candidate,index})).sort((a,b)=>(Date.parse(b.document.updatedAt)||0)-(Date.parse(a.document.updatedAt)||0)||b.index-a.index),chosen=!browserRuntime&&results[0].status==='fulfilled'?candidates.find(candidate=>candidate.document===results[0].value):ranked[0];accept(chosen.document,chosen.source,chosen.filename);copyState.ready=true
  })();return initialization
}
export function editCopy(id,value){Vue.set(copyState.values,id,value);copyState.status='';copyState.errors=validateCopyDocument(document()).errors}
export function discardCopy(){if(copyState.external)return reloadCopy();copyState.values={...copyState.saved.values};copyState.errors={};copyState.status='已还原为上次保存的配置。'}
export function importCopy(value){const result=validateCopyDocument(value);if(!result.valid){copyState.status='导入失败：'+Object.values(result.errors)[0];return false}copyState.values={...value.values};copyState.errors={};copyState.status='已导入并预览，保存后成为默认配置。';return true}
export async function reloadCopy(){initialization=null;await initializeCopy();copyState.status='已重新载入最新文件。'}
export async function saveCopy(){
  const result=validateCopyDocument(document());copyState.errors=result.errors;if(!result.valid){copyState.status='请修正文案后再保存。';return null}if(copyState.busy)return null
  copyState.busy=true
  try{
    let saved,filename,source
    if(!browserRuntime){const response=await fetch('/api/prototype-copy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedRevision:serverRevision,document:document()})}),result=await response.json();if(!response.ok)throw Error(result.message||'配置未保存，请重试。');saved=result.document;filename=result.filename;serverRevision=saved.revision;source='本地配置文件'}
    else{let previous=null;try{previous=JSON.parse(localStorage.getItem(key)||'null')}catch(_){}if(previous&&previous.revision!==copyState.saved.revision&&(Date.parse(previous.updatedAt)||0)>(Date.parse(copyState.saved.updatedAt)||0))throw Error('另一个页面已保存新版本，请先载入最新配置。');const updatedAt=new Date().toISOString(),revision='copy-'+updatedAt.replace(/\D/g,'')+'-'+Math.random().toString(36).slice(2,9);saved={...document(),revision,updatedAt};filename=revision+'.json';source='此浏览器本地配置文件';const written=await writeBrowserFile(saved,filename);if(!written)source='此浏览器已保存配置'}
    try{localStorage.setItem(key,JSON.stringify(saved))}catch(error){if(source==='此浏览器已保存配置')throw error}accept(saved,source,filename);copyState.status='已保存 '+filename+'；下次打开默认载入。';return saved
  }catch(error){copyState.status=error.message;return null}finally{copyState.busy=false}
}
export function exportCopy(){const result=validateCopyDocument(document());if(!result.valid){copyState.errors=result.errors;copyState.status='请先修正无效字段。';return}const value={...document(),revision:copyDirty()?'draft-'+Date.now():copyState.saved.revision,updatedAt:copyDirty()?new Date().toISOString():copyState.saved.updatedAt},blob=new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=window.document.createElement('a');anchor.href=url;anchor.download='sunnyfit-'+value.revision+'.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function installCopy(VueConstructor){VueConstructor.prototype.$copy=copyText}
window.addEventListener('storage',event=>{if(event.key!==key||!event.newValue)return;try{const saved=JSON.parse(event.newValue);if(!validateCopyDocument(saved).valid)return;if(copyDirty()){copyState.external=true;copyState.status='另一个页面保存了新版本，当前预览尚未保存。'}else accept(saved,'此浏览器已保存配置')}catch(_){}})
