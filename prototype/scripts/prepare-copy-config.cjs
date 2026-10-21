const fs=require('node:fs'),path=require('node:path')
function prepareCopyConfiguration(){const root=path.resolve(__dirname,'..'),latest=require('../config/operations-copy.json'),target=path.join(root,'public/config/operations-copy.latest.json');require('./prepare-collaboration.cjs').prepare();fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(latest,null,2)+'\n');return latest}
if(require.main===module)console.log('Copy configuration prepared: '+prepareCopyConfiguration().revision)
module.exports={prepareCopyConfiguration}
