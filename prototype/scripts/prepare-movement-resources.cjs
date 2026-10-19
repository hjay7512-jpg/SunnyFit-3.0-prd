const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process')
const out=path.resolve(__dirname,'../public/assets/movement/real')
const clips={
  'shoulder-rolls':'https://d36ltzaqhvxnap.cloudfront.net/movement/20250312/M010_merged.mp4_slo_191154156w.mp4',
  'shoulder-car':'https://d36ltzaqhvxnap.cloudfront.net/movement/20250312/M011_merged.mp4_slo_191203577w.mp4',
  'arm-triceps-stretch':'https://d36ltzaqhvxnap.cloudfront.net/movement/20250312/M026.mp4_slo_191353523w.mp4',
  'chest-opener':'https://d36ltzaqhvxnap.cloudfront.net/movement/20250312/M024_merge_191345852d.mp4',
  'jm-press':'https://d36ltzaqhvxnap.cloudfront.net/movement/20250221/S175_output.mp4_slo_114508445w.mp4',
  'bicep-curl':'https://d36ltzaqhvxnap.cloudfront.net/movement/20250221/S173_output.mp4_slo_114346997w.mp4',
  woodchop:'https://d36ltzaqhvxnap.cloudfront.net/movement/20250221/S179_output.mp4_slo_114622888w.mp4',
  'high-pull':'https://d36ltzaqhvxnap.cloudfront.net/movement/20250221/S184_output.mp4_slo_114841874w.mp4'
}
const selected=process.argv.slice(2)
for(const name of selected.length?selected:Object.keys(clips)){
  if(!clips[name])throw new Error('Unknown movement resource: '+name)
  const archived=path.resolve(__dirname,'../runtime/movement-source-videos',name+'.mp4'),input=fs.existsSync(archived)?archived:path.join(out,name+'.mp4')
  for(const args of [
    ['-ss','1','-i',input,'-frames:v','1','-vf','scale=600:600','-y',path.join(out,name+'.jpg')],
    ['-i',input,'-vf','scale=720:720','-c:v','libx264','-crf','23','-preset','fast','-an','-movflags','+faststart','-y',path.join(out,name+'-preview.mp4')]
  ]){const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error',...args],{windowsHide:true});if(r.status!==0)throw new Error(r.stderr.toString())}
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({source:'User-provided SunnyFit training resources',clips,highPull:{type:'video',source:clips['high-pull'],referenceImage:'https://d36ltzaqhvxnap.cloudfront.net/icon/equip/20250421/S18_1337535474.png'},previews:'720px H.264 copies of the original footage; no generated movement frames. JM Press, High Pull and Woodchop use timed targets because no validated repetition detector is configured.'},null,2)+'\n')
console.log('Prepared '+(selected.length||Object.keys(clips).length)+' real movement videos and their posters.')
