const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto')
const {defaults,validateCopyDocument}=require('../src/copy/copy-model.cjs')
function createCopyFiles(directory){
  function latest(){
    if(!fs.existsSync(directory))return defaults
    const files=fs.readdirSync(directory).filter(name=>/^copy-[0-9]{17}-[a-f0-9-]+\.json$/.test(name)).sort().reverse()
    for(const name of files){try{const document=JSON.parse(fs.readFileSync(path.join(directory,name),'utf8'));if(validateCopyDocument(document).valid)return document}catch(_){}}
    return defaults
  }
  function save(input){
    const result=validateCopyDocument(input.document);if(!result.valid)return {status:400,errors:result.errors}
    const previous=latest();if(input.expectedRevision!==previous.revision)return {status:409,message:'文案已有新版本。请先重新载入最新配置。'}
    const updatedAt=new Date(Math.max(Date.now(),(Date.parse(previous.updatedAt)||0)+1)).toISOString(),revision='copy-'+updatedAt.replace(/\D/g,'')+'-'+randomUUID(),filename=revision+'.json',document={schemaVersion:1,locale:'en-US',revision,updatedAt,values:{...input.document.values}}
    fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,filename),JSON.stringify(document,null,2)+'\n',{flag:'wx'})
    return {status:200,document,filename}
  }
  return {latest,save}
}
module.exports={createCopyFiles}
