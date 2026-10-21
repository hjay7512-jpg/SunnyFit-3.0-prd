const fs=require('node:fs'),path=require('node:path')
const root=path.resolve(__dirname,'..'),catalog=require('../config/operations-copy.fields.json'),defaults=require('../config/operations-copy.json')
// IDs are a persistent contract. Rename/move a component without changing its ID.
function blockFor(field){
  const key=field.key
  if(key.startsWith('membership.preview.'))return 'membership.discovery'
  if(key.startsWith('membership.active.')||key.startsWith('membership.manage.'))return 'membership.active'
  if(key.startsWith('membership.utility.'))return 'membership.utilities'
  if(field.group==='profile')return 'profile.membership'
  if(field.group==='actions')return key.split('.').slice(0,2).join('.')
  return field.group
}
function prepare(){
  const contract=JSON.parse(fs.readFileSync(path.join(root,'config/copy-blocks.json'),'utf8')),blocks={},seen=new Set(),known=new Set(catalog.fields.map(field=>field.key))
  for(const block of contract.blocks){if(blocks[block.id]||!/^[-\w.]+$/.test(block.id))throw Error('Duplicate/invalid block ID: '+block.id);blocks[block.id]=block;for(const key of block.fields){if(!known.has(key)||seen.has(key))throw Error('Unknown/duplicate block field: '+key);seen.add(key)}}
  for(const key of known)if(!seen.has(key))throw Error('Register the new field in config/copy-blocks.json: '+key)
  const manifest={schemaVersion:contract.schemaVersion,registryVersion:contract.registryVersion,blocks,fields:catalog.fields,defaults:defaults.values}
  for(const target of ['config/collaboration-registry.json','collaboration-service/core/registry.json']){fs.mkdirSync(path.dirname(path.join(root,target)),{recursive:true});fs.writeFileSync(path.join(root,target),JSON.stringify(manifest,null,2)+'\n')}
  return manifest
}
if(require.main===module){const m=prepare();console.log('Collaboration contract: '+Object.keys(m.blocks).length+' stable blocks / '+m.fields.length+' fields')}
module.exports={prepare,blockFor}
