// Admin credentials travel via stdin, never command arguments or project files.
// Input: {apiBase,adminKey,action:'create'|'list'|'revoke',...}
import { stdin } from 'node:process';
import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
const {values:flags}=parseArgs({options:{label:{type:'string'},days:{type:'string'},role:{type:'string'},'all-prototype-blocks':{type:'boolean'}}});
if(stdin.isTTY){stdin.setRawMode(true);process.stdout.write('Ready for management JSON on stdin (input is hidden).\n')}
let input='',options;for await(const chunk of stdin){input+=chunk;try{options=JSON.parse(input);break}catch{}}
if(stdin.isTTY){try{stdin.setRawMode(false)}catch{}}
if(!options)throw Error('Provide one JSON object on stdin.');const base=new URL(options.apiBase);
if(flags.label)options.label=flags.label;if(flags.days)options.days=Number(flags.days);if(flags.role)options.role=flags.role;
if(flags['all-prototype-blocks'])options.scopes=JSON.parse(readFileSync(new URL('../config/copy-blocks.json',import.meta.url),'utf8')).blocks.map(block=>block.id);
if(base.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(base.hostname))throw Error('Use HTTPS for hosted collaboration.');
const action=options.action||'create',route=action==='revoke'?'/admin/links/'+encodeURIComponent(options.id)+'/revoke':'/admin/links';
if(action==='create'&&(!options.label||!['editor','reviewer'].includes(options.role)||!Number.isInteger(options.days)||!Array.isArray(options.scopes)||!options.scopes.length))throw Error('Explicit recipient label, role, expiry days and scopes are required.');
const response=await fetch(base.href.replace(/\/$/,'')+route,{method:action==='list'?'GET':'POST',headers:{Authorization:'Bearer '+options.adminKey,'Content-Type':'application/json'},body:action==='list'?undefined:JSON.stringify(action==='revoke'?{}:{label:options.label,role:options.role,days:options.days,scopes:options.scopes})});
const result=await response.json();if(!response.ok)throw Error(result.message);
if(result.token&&options.previewUrl){const url=new URL(options.previewUrl),[path,search='']=url.hash.split('?'),query=new URLSearchParams(search);query.set('reviewKey',result.token);url.hash=(path||'#/app/profile')+'?'+query;console.log(JSON.stringify({id:result.id,role:result.role,expiresAt:result.expiresAt,url:url.href},null,2));}else console.log(JSON.stringify(result,null,2));
