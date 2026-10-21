const config=require('../public/config/collaboration.json'),registry=require('../config/collaboration-registry.json')
;(async()=>{
 if(!config.apiBase)throw Error('Configure the shared collaboration API before publishing.')
 const base=new URL(config.apiBase);if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw Error('The hosted API must use an HTTPS URL without credentials.')
 const headers={Origin:'https://hjay7512-jpg.github.io'},health=await fetch(config.apiBase+'/health',{headers,signal:AbortSignal.timeout(15000)}),body=await health.json();if(!health.ok||body.status!=='ok'||body.registryVersion<registry.registryVersion)throw Error('Deploy the compatible collaboration service first.')
 if(health.headers.get('Access-Control-Allow-Origin')!==headers.Origin)throw Error('The collaboration service must allow the prototype origin.')
 const response=await fetch(config.apiBase+'/copy',{headers,signal:AbortSignal.timeout(15000)}),copy=await response.json();if(!response.ok||copy.schemaVersion!==1||!copy.values||!copy.revisions)throw Error('Shared copy contract is unavailable.')
 console.log('PASS compatible hosted collaboration API and prototype CORS')
})().catch(error=>{console.error(error.message);process.exitCode=1})
