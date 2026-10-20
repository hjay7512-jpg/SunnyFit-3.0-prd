const defaults=require('../../config/operations-copy.json'),catalog=require('../../config/operations-copy.fields.json'),wall=require('../../config/subscription-wall.cjs')
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key)
function validateCopyDocument(document){
  const errors={}
  if(!document||document.schemaVersion!==1||document.locale!=='en-US'||!document.values||Array.isArray(document.values)||typeof document.values!=='object')return {valid:false,errors:{document:'请选择 SunnyFit 运营文案配置文件（v1 / en-US）。'}}
  for(const key of Object.keys(document.values))if(!own(defaults.values,key))errors[key]='未知文案字段。'
  for(const field of catalog.fields){const value=document.values[field.key];if(typeof value==='string'&&!value.trim()&&field.inherit)continue;if(typeof value!=='string'||!value.trim())errors[field.key]='文案不能为空。';else if([...value].length>field.max)errors[field.key]='最多 '+field.max+' 个字符。';else{const tokens=[...new Set(value.match(/\{[a-zA-Z]+\}/g)||[])];if(field.tokens.some(token=>!tokens.includes(token))||tokens.some(token=>!field.tokens.includes(token)))errors[field.key]='请保留变量 '+field.tokens.join('、')+'，不要添加未知变量。'}}
  return {valid:!Object.keys(errors).length,errors}
}
function renderCopy(values,key,parameters={}){const template=own(values,key)?values[key]:defaults.values[key]||'';return String(template).replace(/\{([a-zA-Z]+)\}/g,(token,name)=>own(parameters,name)?String(parameters[name]):token)}
function wallCopyConfiguration(values){
  const config=JSON.parse(JSON.stringify(wall))
  for(const [key,value] of Object.entries(values)){if(!key.startsWith('wall.'))continue;const path=key.slice(5).split('.');let target=config;for(const part of path.slice(0,-1))target=target[part];target[path[path.length-1]]=value}
  for(const kind of Object.keys(config.placements)){const story=config.entryStories[kind];config.placements[kind].title=story.title;config.placements[kind].headline=story.title;config.placements[kind].subtitle=story.description}
  return config
}
function groupsForPage(screen){
  const kind={course:'course','world-tour':'world_tour','world-tour-detail':'world_tour',program:'training_program','movement-training':'movement',movement:'movement',coach:'ai_allowance',plan:'dynamic_plan',result:'workout_insight',weekly:'weekly_insight',challenge:'limited_challenge',membership:'membership',plans:'membership'}[screen]
  const ids=screen==='profile'?['profile']:screen==='membership'?['membership','entry-membership']:[]
  if(kind&&!ids.includes('entry-'+kind))ids.push('entry-'+kind)
  if(['coach','plan'].includes(screen))ids.push('entry-dynamic_plan')
  if(['membership','coach','plan','result','weekly','challenge'].includes(screen))ids.push('actions')
  if(kind)ids.push('wall-common','paywall','premium-intro','premium-workouts','premium-plans','premium-insights','premium-coach','premium-faq')
  return [...new Set(ids)].map(id=>({id,label:catalog.groups[id]}))
}
module.exports={defaults,catalog,validateCopyDocument,renderCopy,wallCopyConfiguration,groupsForPage}
