// Behavior, attribution and entitlement facts are separate from editable copy.
const definition=require('./subscription-wall.structure.json'),values=require('./operations-copy.json').values
function hydrate(value){
  if(Array.isArray(value))return value.map(hydrate)
  if(value&&typeof value==='object'){if(value.$copy)return values[value.$copy];const result={};for(const [key,item] of Object.entries(value))result[key]=hydrate(item);return result}
  return value
}
module.exports=hydrate(definition)
