// Prototype-only subscription guidance model. Contract: V3.0.0 §4.1.
// This content is display configuration, not an entitlement or store-offer source.
const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'zh-CN', label: '简体中文' }
]
const BENEFITS = [
  { id: 'content', label: 'Content', headline: 'More ways to move', description: 'Explore more workouts, World Tours, and Training Programs.' },
  { id: 'plan', label: 'Plan', headline: 'A plan that moves with you', description: 'Activate a personalized Dynamic Plan and build your routine.' },
  { id: 'ai_insight', label: 'AI Insights', headline: 'Understand your progress', description: 'Get personalized insights from workouts and weekly reports.' },
  { id: 'ai_chat', label: 'AI Chat', headline: 'Your coach, always in reach', description: 'Talk to AI Coach with the credits available on your account.' }
]
const SECTION_IDS = ['comparison', 'details', 'faq']
const MEMBERSHIP_SCENE_CODE = 'membership'
const MAX_VARIANTS = 5
const CORE_SCENES = [
  { code:MEMBERSHIP_SCENE_CODE, name:'Membership Page Entry', kind:'membership' },
  { code:'course_access', name:'Course Access' },
  { code:'world_tour_access', name:'World Tour Access' },
  { code:'training_program_access', name:'Training Program Access' },
  { code:'dynamic_plan', name:'Dynamic Plan' },
  { code:'workout_result_ai_insight', name:'Workout Result AI Insight' },
  { code:'weekly_report_ai_insight', name:'Weekly Report AI Insight' },
  { code:'ai_coach_chat', name:'AI Coach Chat' },
  // Additional paywall scenes are included only after the corresponding entry exists.
]
// These two feature entry points are not currently supported in V3.0.
// Exclude them even if an older browser draft or entitlement catalog contains them.
const UNAVAILABLE_SCENE_CODES = ['movement_access', 'challenge_access']
const IMAGE_SIZES = { detail: { width: 750, height: 375 }, banner: { width: 750, height: 320 } }
const clone = value => JSON.parse(JSON.stringify(value))
const languageText = (value, locale = 'en') => value && (value[locale] || value.en || '') || ''
const textMap = en => ({ en })
const escapeXml = value => String(value || '').replace(/[<>&"']/g, letter => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' }[letter]))
function placeholder(kind, label, index = 0) {
  const { width, height } = IMAGE_SIZES[kind]
  const shades = [['#223b67','#6487b2'],['#344f63','#7caea8'],['#473a69','#9385c1'],['#66514c','#c4988b']]
  const colors = shades[index % shades.length]
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="' + colors[0] + '"/><stop offset="1" stop-color="' + colors[1] + '"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="' + Math.round(width * .83) + '" cy="' + Math.round(height * .33) + '" r="' + Math.round(height * .48) + '" fill="#ffffff" fill-opacity=".09"/><circle cx="' + Math.round(width * .68) + '" cy="' + Math.round(height * .75) + '" r="' + Math.round(height * .45) + '" fill="#ffffff" fill-opacity=".06"/><text x="36" y="' + Math.round(height * .78) + '" fill="#fff" font-family="Arial,sans-serif" font-size="23" opacity=".9">' + escapeXml(label) + '</text></svg>'
  return { src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), width, height, demo: true }
}
const exampleRow = (id, title, freeOn, premiumOn, freeDesc = '', premiumDesc = '') => ({
  id, name: textMap(title),
  free: { enabled: freeOn, description: textMap(freeDesc) },
  premium: { enabled: premiumOn, description: textMap(premiumDesc) }
})
// Every entry has a stable Control A plus optional named A/B test groups.
// Membership is an entry_source, not an entitlement; SKU and purchase rules remain separate.
function createScene(item,index=0) {
  const fromMembership=item.code===MEMBERSHIP_SCENE_CODE
  return {
    experimentId:'intro_'+item.code+'_v1',
    experimentName:fromMembership?'Membership upgrade intro':item.name+' intro',
    enabled:false,
    variants:[{
      id:'A', name:'Control A', traffic:100,
      banner:placeholder('banner',fromMembership?'SUNNYFIT PREMIUM':'SunnyFit Premium',index),
      title:textMap(fromMembership?'Discover SunnyFit Premium':'Unlock more with Premium'),
      description:textMap(fromMembership?'More ways to move, with guidance that fits your routine.':'Get more from '+item.name+' with a SunnyFit Premium subscription.')
    }]
  }
}
function seed(catalog = []) {
  const scenes = {}
  const known = new Set(CORE_SCENES.map(item => item.code))
  CORE_SCENES.concat(catalog.filter(item => item.type !== 'consumable_credits' && item.category !== 'Consumable Credits' && !known.has(item.code) && !UNAVAILABLE_SCENE_CODES.includes(item.code))).forEach((item, index) => {
    scenes[item.code] = createScene(item,index)
  })
  return {
    schemaVersion:2,
    enabledLocales:['en'],
    membership:{
      comparison:{
        enabled:true, sort:300, title:textMap('Compare Free & Premium'),
        rows:[
          exampleRow('content','Workout content',true,true,'Selected free workouts','More workouts and programs'),
          exampleRow('plan','Dynamic Plan',false,true,'','Personalized plan activation'),
          exampleRow('insight','AI Insights',false,true,'','Workout and weekly insights'),
          exampleRow('chat','AI Coach Chat',true,true,'Available credits','Available Premium credits')
        ]
      },
      details:{
        enabled:true, sort:200, title:textMap('Explore your Premium benefits'),
        benefits:BENEFITS.map((item,index)=>({
          id:item.id, name:textMap(item.label), headline:textMap(item.headline),
          description:textMap(item.description),
          image:placeholder('detail',item.label,index)
        }))
      },
      faq:{
        enabled:true, sort:100, title:textMap('Questions & Answers'),
        rows:[
          {id:'cancel',question:textMap('Can I cancel anytime?'),answer:textMap('Manage your subscription through the App Store or Google Play.')},
          {id:'restore',question:textMap('How do I restore a purchase?'),answer:textMap('Use Restore Purchases on the membership page.')}
        ]
      }
    },
    scenes
  }
}
function normalizeScene(stored,initial) {
  if (!stored || typeof stored!=='object') return clone(initial)
  const baseline=initial.variants[0]
  // Migrate the pre-A/B data shape without dropping the user's existing edits.
  const oldStyle=!Array.isArray(stored.variants) || !stored.variants.length
  const source=oldStyle?[{id:'A',name:'Control A',traffic:100,
    banner:stored.banner,title:stored.title,description:stored.description}]:stored.variants
  const variants=source.map((item,index)=>({
    id:item.id || String.fromCharCode(65+index),
    name:typeof item.name==='string'?item.name:index===0?'Control A':'Variant '+String.fromCharCode(65+index),
    traffic:Number.isInteger(item.traffic)?item.traffic:(index===0?100:0),
    banner:item.banner || clone(baseline.banner),
    title:item.title && typeof item.title==='object'?item.title:clone(baseline.title),
    description:item.description && typeof item.description==='object'?item.description:clone(baseline.description)
  }))
  return {
    experimentId:typeof stored.experimentId==='string'?stored.experimentId:initial.experimentId,
    experimentName:typeof stored.experimentName==='string'?stored.experimentName:initial.experimentName,
    enabled:!!stored.enabled && variants.length>1,
    variants
  }
}
function reconcile(snapshot,catalog=[]) {
  const fresh=seed(catalog)
  const target=snapshot && (snapshot.schemaVersion===1||snapshot.schemaVersion===2)?clone(snapshot):clone(fresh)
  target.schemaVersion=2
  if (!Array.isArray(target.enabledLocales)) target.enabledLocales=['en']
  target.enabledLocales=['en',...target.enabledLocales.filter(code=>code!=='en'&&LOCALES.some(locale=>locale.code===code))]
  if (!target.membership) target.membership=clone(fresh.membership)
  for (const id of SECTION_IDS) if (!target.membership[id]) target.membership[id]=clone(fresh.membership[id])
  if (!target.scenes) target.scenes={}
  for (const code of UNAVAILABLE_SCENE_CODES) delete target.scenes[code]
  // Normalize known and locally saved custom entries. Catalog entries are optional.
  for (const [code,scene] of Object.entries(fresh.scenes)) target.scenes[code]=normalizeScene(target.scenes[code],scene)
  for (const [code,scene] of Object.entries(target.scenes)) {
    if (UNAVAILABLE_SCENE_CODES.includes(code)) { delete target.scenes[code]; continue }
    if (!fresh.scenes[code]) target.scenes[code]=normalizeScene(scene,createScene({code,name:code}))
  }
  return target
}
function rebalanceTraffic(scene) {
  const variants=scene.variants || []
  if (!variants.length) return
  const equal=Math.floor(100/variants.length), remainder=100%variants.length
  variants.forEach((v,index)=>{v.traffic=equal+(index<remainder?1:0)})
}
function addVariant(scene,sourceId='A') {
  if (!scene||!Array.isArray(scene.variants)||scene.variants.length>=MAX_VARIANTS) return null
  const candidate=['B','C','D','E'].find(id=>!scene.variants.some(v=>v.id===id))
  if (!candidate) return null
  const source=scene.variants.find(v=>v.id===sourceId)||scene.variants[0]
  const next=clone(source)
  next.id=candidate
  next.name='Variant '+candidate
  scene.variants.push(next)
  rebalanceTraffic(scene)
  return next
}
function removeVariant(scene,id) {
  if (id==='A'||!scene||!Array.isArray(scene.variants)) return false
  const index=scene.variants.findIndex(v=>v.id===id)
  if (index<0)return false
  scene.variants.splice(index,1)
  if (scene.variants.length<2) scene.enabled=false
  rebalanceTraffic(scene)
  return true
}
// Deterministic preview-only bucket. Real exposure assignment must be server-owned
// and sticky to an anonymous, appropriately scoped experiment unit.
function stableBucket(value) {
  let hash=2166136261
  for (let i=0;i<value.length;i++) {
    hash^=value.charCodeAt(i)
    hash=Math.imul(hash,16777619)
  }
  return (hash>>>0)%100
}
function assignVariant(config,code,userKey) {
  const scene=config && config.scenes && config.scenes[code]
  if (!scene) return null
  const variants=scene.variants||[]
  const control=variants.find(v=>v.id==='A')||variants[0]
  if (!control) return null
  const fallback={variantId:control.id,name:control.name,traffic:control.traffic,experimentId:scene.experimentId,experimentEnabled:false,reason:'control_only'}
  if (!scene.enabled||variants.length<2) return fallback
  const total=variants.reduce((sum,v)=>sum+v.traffic,0)
  if (total!==100 || variants.some(v=>!Number.isInteger(v.traffic)||v.traffic<0)) return {...fallback,reason:'invalid_allocation'}
  const key=String(userKey||'').trim()
  if(!key)return {...fallback,reason:'missing_test_user'}
  const bucket=stableBucket(scene.experimentId+'|'+code+'|'+key)
  let cursor=0
  for (const variant of variants) {
    cursor+=variant.traffic
    if(bucket<cursor)return {variantId:variant.id,name:variant.name,traffic:variant.traffic,experimentId:scene.experimentId,experimentEnabled:true,bucket,reason:'sample_assignment'}
  }
  return fallback
}
function checkText(errors, path, value, max, required) {
  const content = typeof value === 'string' ? value.trim() : ''
  if (required && !content) errors.push(path + ': required')
  else if (content.length > max) errors.push(path + ': exceeds ' + max + ' characters')
}
function checkImage(errors, path, image, expected) {
  if (!image || !image.src) { errors.push(path + ': image required'); return }
  if (image.width !== expected.width || image.height !== expected.height) {
    errors.push(path + ': required dimensions ' + expected.width + ' × ' + expected.height)
  }
}
function validate(input) {
  const errors = []
  const data = input || {}
  const locales = Array.isArray(data.enabledLocales) ? data.enabledLocales : ['en']
  if (!locales.includes('en')) errors.push('Languages: English is the required base locale')
  for (const section of SECTION_IDS) {
    const module = data.membership && data.membership[section]
    if (!module) { errors.push(section + ': missing section'); continue }
    if (!Number.isInteger(module.sort)) errors.push(section + ' sort: integer required')
    if (!module.enabled) continue
    for (const locale of locales) {
      checkText(errors, section + ' / ' + locale + ' / title', module.title && module.title[locale], 30, section !== 'faq')
      if (section === 'comparison') {
        ;(module.rows || []).forEach((row, index) => {
          checkText(errors, 'comparison row ' + (index + 1) + ' / ' + locale + ' / name', row.name && row.name[locale], 20, true)
        })
      }
      if (section === 'details') {
        for (const definition of BENEFITS) {
          const item = (module.benefits || []).find(benefit => benefit.id === definition.id)
          if (!item) { errors.push('details / ' + definition.id + ': required fixed benefit'); continue }
          checkText(errors, 'details / ' + definition.id + ' / ' + locale + ' / name', item.name && item.name[locale], 20, true)
          checkText(errors, 'details / ' + definition.id + ' / ' + locale + ' / headline', item.headline && item.headline[locale], 30, true)
          checkText(errors, 'details / ' + definition.id + ' / ' + locale + ' / description', item.description && item.description[locale], 120, true)
        }
      }
      if (section === 'faq') {
        ;(module.rows || []).forEach((row, index) => {
          const question = row.question && row.question[locale]
          const answer = row.answer && row.answer[locale]
          checkText(errors, 'Q&A ' + (index + 1) + ' / ' + locale + ' / question', question, 50, !!(answer || '').trim())
          checkText(errors, 'Q&A ' + (index + 1) + ' / ' + locale + ' / answer', answer, 300, !!(question || '').trim())
        })
      }
    }
    if (section === 'details') for (const definition of BENEFITS) {
      const item = (module.benefits || []).find(benefit => benefit.id === definition.id)
      if (item) checkImage(errors, 'details / ' + definition.id, item.image, IMAGE_SIZES.detail)
    }
  }
  for (const [code,scene] of Object.entries(data.scenes||{})) {
    if (UNAVAILABLE_SCENE_CODES.includes(code)) continue
    const label='scenario / '+code
    const variants=scene && scene.variants
    if (!Array.isArray(variants)||!variants.length||variants.length>MAX_VARIANTS) {
      errors.push(label+': requires 1–'+MAX_VARIANTS+' variant groups')
      continue
    }
    checkText(errors,label+' / experiment name',scene.experimentName,60,!!scene.enabled)
    checkText(errors,label+' / experiment ID',scene.experimentId,100,true)
    const seen=new Set()
    for (const variant of variants) {
      const group=label+' / group '+variant.id
      if (!/^[A-E]$/.test(variant.id||'')||seen.has(variant.id)) errors.push(group+': invalid or duplicate group ID')
      seen.add(variant.id)
      checkText(errors,group+' / group name',variant.name,40,true)
      if (!Number.isInteger(variant.traffic)||variant.traffic<0||variant.traffic>100) errors.push(group+': traffic must be an integer 0–100')
      checkImage(errors,group+' / banner',variant.banner,IMAGE_SIZES.banner)
      for (const locale of locales) {
        checkText(errors,group+' / '+locale+' / title',variant.title && variant.title[locale],30,true)
        checkText(errors,group+' / '+locale+' / description',variant.description && variant.description[locale],120,true)
      }
    }
    if (!seen.has('A')) errors.push(label+': Control A is required')
    if (scene.enabled) {
      if (variants.length<2) errors.push(label+': enable A/B testing only with 2 or more groups')
      if (variants.reduce((sum,v)=>sum+(Number.isInteger(v.traffic)?v.traffic:0),0)!==100) errors.push(label+': A/B traffic allocation must total 100%')
      if (variants.some(v=>v.traffic<=0)) errors.push(label+': enabled groups must have positive traffic')
    }
  }
  return errors
}
function projectMembership(config, locale = 'en') {
  const membership = config.membership
  return SECTION_IDS.map(id => ({ id, ...membership[id] }))
    .filter(section => section.enabled)
    .sort((a, b) => b.sort - a.sort || SECTION_IDS.indexOf(a.id) - SECTION_IDS.indexOf(b.id))
    .map(section => {
      if (section.id === 'comparison') return { id: section.id, title: languageText(section.title, locale), rows: section.rows.map(row => ({
        id: row.id, name: languageText(row.name, locale),
        free: { enabled: !!row.free.enabled, ...(languageText(row.free.description, locale) ? { description: languageText(row.free.description, locale) } : {}) },
        premium: { enabled: !!row.premium.enabled, ...(languageText(row.premium.description, locale) ? { description: languageText(row.premium.description, locale) } : {}) }
      })) }
      if (section.id === 'details') return { id: section.id, title: languageText(section.title, locale), benefits: BENEFITS.map(item => {
        const value = section.benefits.find(benefit => benefit.id === item.id)
        return { id: item.id, name: languageText(value.name, locale), headline: languageText(value.headline, locale), description: languageText(value.description, locale), image: value.image && value.image.src }
      }) }
      return { id: section.id, title: languageText(section.title, locale), rows: section.rows.filter(row => languageText(row.question, locale) && languageText(row.answer, locale)).map(row => ({
        id: row.id, question: languageText(row.question, locale), answer: languageText(row.answer, locale)
      })) }
    })
}
function projectScene(config,code,locale='en',variantId='A') {
  if (UNAVAILABLE_SCENE_CODES.includes(code)) return null
  const scene=config.scenes && config.scenes[code]
  if (!scene) return null
  const variants=Array.isArray(scene.variants)?scene.variants:[{id:'A',banner:scene.banner,title:scene.title,description:scene.description}]
  const selected=variants.find(v=>v.id===variantId)||variants[0]
  if (!selected) return null
  return {
    entrySource:code===MEMBERSHIP_SCENE_CODE?'membership':code,
    entitlementCode:code===MEMBERSHIP_SCENE_CODE?null:code,
    experimentId:scene.experimentId||null,
    variantId:selected.id,
    banner:selected.banner && selected.banner.src,
    title:languageText(selected.title,locale),
    description:languageText(selected.description,locale)
  }
}
module.exports={LOCALES,BENEFITS,SECTION_IDS,CORE_SCENES,UNAVAILABLE_SCENE_CODES,MEMBERSHIP_SCENE_CODE,MAX_VARIANTS,IMAGE_SIZES,clone,languageText,seed,reconcile,validate,projectMembership,projectScene,rebalanceTraffic,addVariant,removeVariant,stableBucket,assignVariant}
