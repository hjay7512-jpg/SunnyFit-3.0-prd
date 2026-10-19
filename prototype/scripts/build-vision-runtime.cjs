const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),{build}=require('esbuild')
const root=path.resolve(__dirname,'..'),out=path.join(root,'public/assets/vision-runtime')
async function main(){
  fs.mkdirSync(path.join(out,'wasm'),{recursive:true})
  const dependency=path.join(root,'vision-guide/node_modules/@mediapipe/tasks-vision')
  for(const name of ['vision_wasm_internal.js','vision_wasm_internal.wasm','vision_wasm_nosimd_internal.js','vision_wasm_nosimd_internal.wasm'])fs.copyFileSync(path.join(dependency,'wasm',name),path.join(out,'wasm',name))
  await build({entryPoints:[path.join(root,'src/features/movement/vision-entry.ts')],outfile:path.join(out,'engine.js'),bundle:true,format:'iife',globalName:'SunnyVision',platform:'browser',target:'es2020',minify:true,nodePaths:[path.join(root,'vision-guide/node_modules')],legalComments:'eof'})
  const pkg=JSON.parse(fs.readFileSync(path.join(dependency,'package.json'),'utf8')),model=path.join(out,'pose_landmarker_lite.task'),engineFile='engine.'+createHash('sha256').update(fs.readFileSync(path.join(out,'engine.js'))).digest('hex').slice(0,16)+'.js'
  fs.copyFileSync(path.join(out,'engine.js'),path.join(out,engineFile))
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({engineFile,runtime:{package:pkg.name,version:pkg.version,license:pkg.license,source:'https://github.com/google-ai-edge/mediapipe'},model:{name:'MediaPipe Pose Landmarker Lite float16 v1',source:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',sha256:fs.existsSync(model)?createHash('sha256').update(fs.readFileSync(model)).digest('hex'):null},processing:'On-device only; camera frames are never uploaded.'},null,2)+'\n')
  console.log('Local vision runtime built from vision-guide.')
}
main().catch(e=>{console.error(e);process.exitCode=1})
