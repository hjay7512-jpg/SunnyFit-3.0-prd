// Derive browser-sized WebP assets, retaining original Figma files for reference.
const fs=require('node:fs'),path=require('node:path')
const {chromium}=require('playwright-core')
const root=path.resolve(__dirname,'..'),assets=path.join(root,'public','assets','figma','restored')
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):entry.isFile()?[path.join(dir,entry.name)]:[])}
async function run(){const browser=await chromium.launch({channel:'msedge',headless:true});const map=[];try{const page=await browser.newPage();for(const file of files(assets).filter(file=>file.endsWith('.png')&&fs.statSync(file).size>300000)){
  const original=fs.readFileSync(file),data='data:image/png;base64,'+original.toString('base64')
  const result=await page.evaluate(async input=>{const image=new Image();image.src=input;await image.decode();const ratio=Math.min(1,900/image.width);const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);return{data:canvas.toDataURL('image/webp',0.84).split(',')[1],width:canvas.width,height:canvas.height}},data)
  const output=file.slice(0,-4)+'.webp',bytes=Buffer.from(result.data,'base64');fs.writeFileSync(output,bytes);map.push({from:'/assets/'+path.relative(path.join(root,'public','assets'),file).replace(/\\/g,'/'),to:'/assets/'+path.relative(path.join(root,'public','assets'),output).replace(/\\/g,'/'),before:original.length,after:bytes.length,width:result.width,height:result.height})
 }
 for(const file of files(path.join(root,'src')).filter(file=>/\.(vue|css|js)$/.test(file))){const previous=fs.readFileSync(file,'utf8');let text=previous;for(const item of map)text=text.split(item.from).join(item.to);if(text!==previous)fs.writeFileSync(file,text)}
 fs.writeFileSync(path.join(root,'runtime','optimized-asset-map.json'),JSON.stringify(map,null,2));console.log(JSON.stringify({assets:map.length,before:map.reduce((sum,a)=>sum+a.before,0),after:map.reduce((sum,a)=>sum+a.after,0)}))
}finally{await browser.close()}}
run().catch(error=>{console.error(error);process.exitCode=1})
