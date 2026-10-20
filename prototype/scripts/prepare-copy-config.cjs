const fs=require('node:fs'),path=require('node:path'),{createCopyFiles}=require('../server/operations-copy.cjs')
function prepareCopyConfiguration(){const root=path.resolve(__dirname,'..'),directory=path.resolve(process.env.COPY_CONFIG_DIR||path.join(root,'config/operations-copy')),latest=createCopyFiles(directory).latest(),target=path.join(root,'public/config/operations-copy.latest.json');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(latest,null,2)+'\n');return latest}
if(require.main===module)console.log('Copy configuration prepared: '+prepareCopyConfiguration().revision)
module.exports={prepareCopyConfiguration}
