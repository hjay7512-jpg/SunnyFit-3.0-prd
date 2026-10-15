// Convert the fetched, inspectable Figma JSX into Vue 2 templates and plain CSS.
// This is an authoring script; neither React nor Tailwind runs in the prototype.
const fs = require('node:fs'); const path = require('node:path'); const crypto = require('node:crypto'); const parser = require('@babel/parser');
const assets = JSON.parse(fs.readFileSync('runtime/design-context/assets.json','utf8'));
const iconExports = JSON.parse(fs.readFileSync('runtime/design-context/icon-exports.json','utf8'));
const variants = {source_home:'Home',source_chat:'Coach',source_plan:'Plan',source_program:'Program',source_course_current:'Course',source_workout_header:'WorkoutHeader',source_workout_title:'WorkoutTitle',source_workout_banner:'WorkoutBanner',source_workout_cards:'WorkoutCategories',source_workout_nav:'WorkoutNav',source_result_chart:'ResultChart','result_child_9:1517':'Insight','result_child_9:1910':'ResultStats','result_child_9:1898':'ResultFruit','result_child_9:1904':'ResultCalories','result_child_9:2070':'ResultCourse','result_child_9:2059':'ResultFooter','result_child_9:1735':'ResultHeader','result_child_9:1508':'ResultBackdrop'};
const css = new Map(); const unknown = new Set();
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const value = raw => { if(raw.startsWith('[')) return raw.slice(1,-1).replaceAll('_',' ').replace(/(?<=[\w)%])([+-])(?=[\w.(])/g,' $1 '); if(raw==='full')return '100%'; if(raw==='px')return '1px'; if(raw==='0')return '0px'; if(raw==='auto'||raw==='none')return raw; if(raw.includes('/')){const [a,b]=raw.split('/').map(Number); if(b) return a/b*100+'%';} if(!Number.isNaN(Number(raw)))return Number(raw)*4+'px'; return raw; };
function classes(raw, svg=false) {
 const out={}; const transform={}; let gradient=false; let from='transparent',via=null,to='transparent',viaPos='50%',toPos='100%';
 const simple={absolute:['position','absolute'],relative:['position','relative'],contents:['display','contents'],block:['display','block'],flex:['display','flex'],grid:['display','grid'],'inline-grid':['display','inline-grid'],hidden:['display','none'],'flex-col':['flex-direction','column'],'flex-row':['flex-direction','row'],'flex-none':['flex','none'],'shrink-0':['flex-shrink','0'],'items-center':['align-items','center'],'items-start':['align-items','flex-start'],'items-end':['align-items','flex-end'],'items-baseline':['align-items','baseline'],'justify-center':['justify-content','center'],'justify-between':['justify-content','space-between'],'justify-end':['justify-content','flex-end'],'justify-start':['justify-content','flex-start'],'content-stretch':['align-content','stretch'],'place-items-start':['place-items','start'],'overflow-clip':['overflow','hidden'],'overflow-hidden':['overflow','hidden'],'pointer-events-none':['pointer-events','none'],'cursor-pointer':['cursor','pointer'],'text-center':['text-align','center'],'text-ellipsis':['text-overflow','ellipsis'],'whitespace-nowrap':['white-space','nowrap'],'whitespace-pre-wrap':['white-space','pre-wrap'],'border-solid':['border-style','solid'],border:['border-width','1px'],'font-normal':['font-weight','400'],'not-italic':['font-style','normal'],capitalize:['text-transform','capitalize'],lowercase:['text-transform','lowercase'],'underline':['text-decoration','underline'],'bg-gradient-to-b':['background-image','gradient'],'bg-gradient-to-t':['background-image','gradient'],'mask-no-repeat':['mask-repeat','no-repeat'],'mask-no-clip':['mask-clip','no-clip'],'mask-intersect':['mask-composite','intersect'],'mask-luminance':['mask-mode','luminance'],'mask-alpha':['mask-mode','alpha']};
 for(const c of raw.split(/\s+/).filter(Boolean)) {
  if(c.startsWith('font-[\'')){if(/Semibold/.test(c))out['font-weight']='600';else if(/Medium/.test(c))out['font-weight']='500';else if(/Black/.test(c))out['font-weight']='900';continue;}
  if(simple[c]) { if(c.startsWith('bg-gradient'))gradient=true; else out[simple[c][0]]=simple[c][1]; continue; }
  if(c==='max-w-none'){out['max-width']='none';continue;}
  if(/^\[.*:.*\]$/.test(c)){ const parts=c.slice(1,-1).split(':');out[parts.shift()]=parts.join(':').replaceAll('_',' '); continue; }
  if(['object-cover','object-contain'].includes(c)){out['object-fit']=c.slice(7);continue;}
  if(c==='uppercase'){out['text-transform']='uppercase';continue;}
  if(c==='self-stretch'){out['align-self']='stretch';continue;}
  if(c==='whitespace-pre'){out['white-space']='pre';continue;}
  if(c==='text-right'||c==='text-left'){out['text-align']=c.slice(5);continue;}
  if(c==='col-1'||c==='row-1'){out[c==='col-1'?'grid-column':'grid-row']='1';continue;}
  const negative=c.startsWith('-');const positive=negative?c.slice(1):c;
  const keys=['drop-shadow','backdrop-blur','mix-blend','scale-x','scale-y','translate-x','translate-y','skew-x','mask-position','mask-size','grid-cols','grid-rows','rounded-tl','rounded-tr','rounded-bl','rounded-br','min-w','max-w','min-h','max-h','w','h','left','right','top','bottom','gap','p','pt','pb','pl','pr','m','mt','mb','ml','mr','leading','tracking','rounded','shadow','size','px','py','inset','text','bg','border','font','opacity','blur','rotate','from','via','to','flex'];
  const key=keys.find(k=>positive.startsWith(k+'-'));if(!key){unknown.add(c);continue;}const rawValue=positive.slice(key.length+1);
  let v=value(rawValue); if(negative && !['scale-x','scale-y'].includes(key))v=v==='0px'?v:v.startsWith('calc(')?'calc(-1 * '+v+')':'-'+v;
  const properties={w:'width',h:'height','min-w':'min-width','max-w':'max-width','min-h':'min-height','max-h':'max-height',left:'left',right:'right',top:'top',bottom:'bottom',gap:'gap',p:'padding',pt:'padding-top',pb:'padding-bottom',pl:'padding-left',pr:'padding-right',m:'margin',mt:'margin-top',mb:'margin-bottom',ml:'margin-left',mr:'margin-right',leading:'line-height',tracking:'letter-spacing',rounded:'border-radius','rounded-tl':'border-top-left-radius','rounded-tr':'border-top-right-radius','rounded-bl':'border-bottom-left-radius','rounded-br':'border-bottom-right-radius',shadow:'box-shadow','grid-cols':'grid-template-columns','grid-rows':'grid-template-rows','mask-position':'mask-position','mask-size':'mask-size'};
  if(properties[key]){out[properties[key]]=v;continue;}
  if(key==='size'){out.width=v;out.height=v;continue;}
  if(['px','py'].includes(key)){for(const edge of key==='px'?['left','right']:['top','bottom'])out['padding-'+edge]=v;continue;}
  if(key==='inset'){out.inset=v;continue;}
  if(key==='text'){out[/^(\d|calc|clamp)/.test(v)?'font-size':'color']=v==='black'?'#000':v==='white'?'#fff':v;continue;}
  if(key==='bg'){out['background-color']=v==='black'?'#000':v==='white'?'#fff':v;continue;}
  if(key==='border'){out['border-color']=v==='black'?'#000':v==='white'?'#fff':v;continue;}
  if(key==='font'){out['font-weight']=v;continue;}
  if(key==='flex'){out.flex=v;continue;}
  if(key==='opacity'){out.opacity=Number(rawValue)/100;continue;}
  if(key==='mix-blend'){out['mix-blend-mode']=rawValue;continue;}
  if(key==='blur'||key==='backdrop-blur'){out[key==='blur'?'filter':'backdrop-filter']='blur('+v+')';continue;}
  if(key==='drop-shadow'){out.filter='drop-shadow('+v+')';continue;}
  if(key==='rotate'){transform.rotate=rawValue.startsWith('[')?v:(negative?'-':'')+rawValue+'deg';continue;}
  if(key==='skew-x'){transform.skew=v;continue;}
  if(key==='translate-x'||key==='translate-y'){transform[key==='translate-x'?'tx':'ty']=v;continue;}
  if(key==='scale-x'||key==='scale-y'){transform[key==='scale-x'?'sx':'sy']=(negative?-1:1)*Number(rawValue)/100;continue;}
  if(key==='from'){from=v;continue;}
  if(key==='via'){if(v.endsWith('%'))viaPos=v;else via=v;continue;}
  if(key==='to'){if(v.endsWith('%'))toPos=v;else to=v;continue;}
  unknown.add(c);
 }
 if(Object.keys(transform).length)out.transform=`translate(${transform.tx||'0'},${transform.ty||'0'}) rotate(${transform.rotate||'0deg'}) skewX(${transform.skew||'0deg'}) scale(${transform.sx===undefined?1:transform.sx},${transform.sy===undefined?1:transform.sy})`;
 if(gradient)out['background-image']=`linear-gradient(to bottom, ${from} 0%${via?', '+via+' '+viaPos:''}, ${to} ${toPos})`;
 if(svg){for(const key of ['width','height','min-width','max-width','min-height','max-height'])delete out[key];}
 return out;
}
function evaluate(node, env) {
 if(!node)return '';
 if(['StringLiteral','NumericLiteral','BooleanLiteral'].includes(node.type))return node.value;
 if(node.type==='Identifier')return env[node.name]||'';
 if(node.type==='TemplateLiteral')return node.quasis.map((q,i)=>q.value.cooked+(node.expressions[i]?evaluate(node.expressions[i],env):'')).join('');
 if(node.type==='ObjectExpression')return Object.fromEntries(node.properties.filter(p=>p.type==='ObjectProperty').map(p=>[p.key.name||p.key.value,evaluate(p.value,env)]));
 if(node.type==='LogicalExpression')return evaluate(node.right,env);
 throw new Error('Unsupported Figma expression: '+node.type);
}
const findReturn = n => { if(n.type==='ReturnStatement')return n.argument; for(const v of Object.values(n)){if(Array.isArray(v)){for(const x of v){if(x && x.type){const r=findReturn(x);if(r)return r;}}}else if(v && v.type){const r=findReturn(v);if(r)return r;}} };
const kebab = s=>s.replace(/[A-Z]/g,l=>'-'+l.toLowerCase());
function render(node, env, funcs, overrides={}) {
 if(node.type==='JSXText')return escape(node.value.replace(/\s*\n\s*/g,' ').trim());
 if(node.type==='JSXExpressionContainer')return node.expression.type==='JSXEmptyExpression'?'':escape(evaluate(node.expression,env));
 if(node.type!=='JSXElement')throw new Error(node.type);
 let tag=node.openingElement.name.name; let attrs={};
 for(const a of node.openingElement.attributes){if(a.type==='JSXAttribute')attrs[a.name.name]=a.value?.type==='JSXExpressionContainer'?evaluate(a.value.expression,env):a.value?.value??true;}
 Object.assign(attrs,overrides);
 if(funcs[tag])return render(findReturn(funcs[tag]),env,funcs,attrs);
 if(!tag || /^[A-Z]/.test(tag))throw new Error('Unknown component '+tag);
 if(['6006:28180','6006:28183','6006:28187'].includes(attrs['data-node-id']))return '';
 const svg=tag==='img'&&String(attrs.src).endsWith('.svg');
 const style=classes(attrs.className||'',svg); delete attrs.className;
 if(attrs.style){for(const [k,v] of Object.entries(attrs.style))style[kebab(k)]=v;delete attrs.style;}
 if(svg){delete attrs.width;delete attrs.height;}
 const signature=JSON.stringify(style); const className='sf-'+crypto.createHash('sha1').update(signature).digest('hex').slice(0,10);
 css.set(className,'.source-visual .'+className+'{'+Object.entries(style).map(([k,v])=>k+':'+v).join(';')+'}');
 const actions={'151:7579':'profile','151:7609':'plan','151:7713':'start-course','151:7746':'workout','151:7737':'home','151:7770':'coach','864:2862':'new-chat','864:2871':'history','864:2877':'home','864:2835':'send','I9:1735;374:3749':'home','9:1537':'coach-workout','9:2070':'course','10:2627':'home','10:2762':'start-course','10:2766':'adjust-plan','10:2771':'workout','6006:28094':'home','6006:28166':'start-course','199:3044':'start-course','199:3604':'profile','199:3031':'workout','199:3033':'world-tour'};
 Object.assign(actions,{'151:7765':'coach','151:7755':'existing-challenge','151:7761':'existing-social','I10:2700;3510:405':'home','1:4650':'start-program','1:4655':'program-next','1:188':'home','1:193':'workout','1:201':'existing-challenge','1:207':'existing-social','1:211':'coach','199:3529':'home','199:3533':'workout','I9:1735;374:3753':'existing-share'});delete actions['10:2627'];
 const action=actions[attrs['data-node-id']];if(action){attrs['data-action']=action;attrs.role='button';attrs.tabindex='0';}
 let attributes=' class="'+className+'"'; for(const [k,v] of Object.entries(attrs))attributes+=' '+(k==='aria-hidden'&&v===true?'aria-hidden="true"':k+'="'+escape(v)+'"');
 if(attrs['data-node-id']==='864:2834')return '<input'+attributes+' :value="message" @input="$emit(\'input\',$event.target.value)" @keydown.enter.prevent="$emit(\'send\')" placeholder="Message AI..." aria-label="Message AI" maxlength="5000">';
 if(tag==='img'){if(attrs.src===env.img && env.img.includes('result_child_9-1735'))attributes=attributes.replace('src="'+escape(attrs.src)+'"','src="/assets/figma/restored/source_course_current/img6.svg"')+' style="position:absolute;left:0;top:0"';attributes+=' data-source-asset="true"';return '<img'+attributes+'>';}
 if(iconExports[attrs['data-node-id']])return '<'+tag+attributes+'><img class="original-orb" src="'+iconExports[attrs['data-node-id']].path+'" alt="AI Coach" data-source-asset="true"></'+tag+'>';
 let children=node.children.map(child=>render(child,env,funcs)).join('');
 // Match the original static design copy's line wrapping with platform font fallbacks.
 if(attrs['data-node-id']==='151:7690')children='80% users start their fat-burn<br>journey here. give it a try!';
 if(attrs['data-node-id']==='1:4627')children='Quick movement to awake your<br>body.';
 return '<'+tag+attributes+'>'+children+'</'+tag+'>';
}
fs.mkdirSync('src/views/app/restored',{recursive:true});
for(const [key,name] of Object.entries(variants)){
 const code=fs.readFileSync('runtime/design-context/'+key.replaceAll(':','-')+'.txt','utf8').split('SUPER CRITICAL:')[0];
 const ast=parser.parse(code,{sourceType:'module',plugins:['jsx','typescript']});const funcs={};let main;
 for(const entry of ast.program.body){const f=entry.type==='ExportDefaultDeclaration'?entry.declaration:entry;if(f.type==='FunctionDeclaration'){funcs[f.id.name]=f;if(entry.type==='ExportDefaultDeclaration')main=f;}}
 const env=Object.fromEntries(Object.entries(assets[key]||{}).map(([k,v])=>[k,v.path]));
 let template=render(findReturn(main),env,funcs);
 // Only the onboarding guide overlay is removed. Its underlying Course screen is retained.
 if(name==='Course'){
  const start=template.indexOf('data-node-id="6006:28180"');
  // Guide elements are tagged separately in the review component CSS; source geometry remains inspectable.
 }
 fs.writeFileSync('src/views/app/restored/'+name+'.vue','<!-- Figma reference: '+key+'. Source IDs retained for handoff. -->\n<template>\n'+template.replaceAll('><','>\n<')+'\n</template>\n<script>\nexport default { name: "Source'+name+'", props: { message: String } }\n</script>\n');
}
fs.writeFileSync('src/views/app/restored/source.css',[...css.values()].join('\n')+'\n');
console.log(JSON.stringify({components:Object.values(variants),styles:css.size,unmapped:[...unknown]}));
