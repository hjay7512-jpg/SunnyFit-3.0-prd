// Read-only client for the official Figma desktop MCP endpoint.
const fs=require('node:fs'),path=require('node:path');
const url='http://127.0.0.1:3845/mcp';
const headers={'Content-Type':'application/json',Accept:'application/json, text/event-stream','MCP-Protocol-Version':'2025-03-26'};
let nextId=1;
function parse(body){
  if(!body.trim())return null;
  if(body.trim().startsWith('{'))return JSON.parse(body);
  const messages=body.split(/\r?\n\r?\n/).map(event=>event.split(/\r?\n/).filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trim()).join('\n')).filter(Boolean).map(line=>JSON.parse(line));
  return messages.find(message=>message.id!==undefined)||messages[0];
}
async function rpc(method,params,notification=false){
  const request={jsonrpc:'2.0',method,...(notification?{}:{id:nextId++}),...(params?{params}:{})};
  const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(request),signal:AbortSignal.timeout(60000)});
  if(response.headers.get('mcp-session-id'))headers['Mcp-Session-Id']=response.headers.get('mcp-session-id');
  const body=await response.text();
  const message=parse(body);
  if(!response.ok||message?.error)throw Error(JSON.stringify({method,status:response.status,error:message?.error,body:!message?body.slice(0,500):undefined}));
  return message?.result;
}
(async()=>{
  const init=await rpc('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'SunnyFit-Figma-Readonly',version:'1.0.0'}});
  console.log(JSON.stringify({server:init?.serverInfo?.name,protocol:init?.protocolVersion}));
  await rpc('notifications/initialized',null,true);
  const result=process.argv[2]==='list'?await rpc('tools/list',{}):{tools:[]};
  const tools=result.tools||[];
  if(process.argv[2]==='list'){
    console.log(JSON.stringify(tools.filter(t=>['get_design_context','get_metadata','get_screenshot'].includes(t.name)).map(t=>({name:t.name,inputSchema:t.inputSchema}))));return;
  }
  const name=process.argv[2]||'get_metadata',nodeId=process.argv[3]||'221:1177';
  if(!['get_design_context','get_metadata','get_screenshot','get_variable_defs'].includes(name))throw Error('Only read-only inspection tools are allowed.');
  const properties=tools.find(tool=>tool.name===name)?.inputSchema?.properties||{};
  const arguments=nodeId==='pages'&&name==='get_metadata'?{}:{nodeId};
  if(name!=='get_screenshot'){arguments.clientLanguages='javascript,html,css';arguments.clientFrameworks='vue';}
  if(name==='get_design_context'){arguments.skillNames='figma-design-to-code';arguments.excludeScreenshot=false;arguments.dirForAssetWrites=path.resolve(__dirname,'../public/assets/figma/account',nodeId.replace(':','-'));fs.mkdirSync(arguments.dirForAssetWrites,{recursive:true});arguments.artifactType='WEB_PAGE_OR_APP_SCREEN';arguments.taskType='CHANGE_ARTIFACT';}
  const response=await rpc('tools/call',{name,arguments});
  const dir=path.resolve(__dirname,'../docs/figma-connection-recovery');fs.mkdirSync(dir,{recursive:true});
  const output=[];
  for(const [index,block]of(response.content||[]).entries()){
    if(block.type==='image'){const file=path.join(dir,nodeId.replace(':','-')+'-'+index+'.png');fs.writeFileSync(file,Buffer.from(block.data,'base64'));output.push({type:'image',file});}
    else if(block.type==='text'){const file=path.join(dir,nodeId.replace(':','-')+'-'+name+'-'+index+'.txt');fs.writeFileSync(file,block.text);output.push({type:'text',file,preview:block.text.slice(0,900)});}
  }
  fs.writeFileSync(path.join(dir,nodeId.replace(':','-')+'-'+name+'-result.json'),JSON.stringify({tool:name,nodeId,isError:!!response.isError,output},null,2));
  console.log(JSON.stringify({tool:name,nodeId,isError:!!response.isError,output}));
  if(response.isError)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1});
