// Admin credentials travel via stdin, never command arguments or project files.
// Input: {apiBase,adminKey,action:'create'|'list'|'revoke',...}
import { stdin } from 'node:process';
let input='',options;for await(const chunk of stdin){input+=chunk;try{options=JSON.parse(input);break}catch{}}
if(!options)throw Error('Provide one JSON object on stdin.');const base=new URL(options.apiBase);
if(base.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(base.hostname))throw Error('Use HTTPS for hosted collaboration.');
const action=options.action||'create',route=action==='revoke'?'/admin/links/'+encodeURIComponent(options.id)+'/revoke':'/admin/links';
const response=await fetch(base.href.replace(/\/$/,'')+route,{method:action==='list'?'GET':'POST',headers:{Authorization:'Bearer '+options.adminKey,'Content-Type':'application/json'},body:action==='list'?undefined:JSON.stringify(action==='revoke'?{}:{label:options.label,role:options.role||'editor',days:options.days||30,scopes:options.scopes||['*']})});
const result=await response.json();if(!response.ok)throw Error(result.message);
if(result.token&&options.previewUrl){const url=new URL(options.previewUrl),[path,search='']=url.hash.split('?'),query=new URLSearchParams(search);query.set('reviewKey',result.token);url.hash=(path||'#/app/profile')+'?'+query;console.log(JSON.stringify({id:result.id,role:result.role,expiresAt:result.expiresAt,url:url.href},null,2));}else console.log(JSON.stringify(result,null,2));
