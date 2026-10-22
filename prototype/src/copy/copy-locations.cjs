// Presentation metadata only. Persistent block IDs and database fields stay unchanged.
const contentKinds=['course','world_tour','training_program']
function locationsForBlock(id){
  if(!id||!id.startsWith('entry-'))return []
  const kind=id.slice(6),placement='wall.placements.'+kind+'.',story='wall.entryStories.'+kind+'.'
  // These three detail pages share this exact content -> subscription journey.
  // Other entry types must register their own real page adapter before previewing.
  if(!contentKinds.includes(kind))return []
  const locations=[]
  if(contentKinds.includes(kind))locations.push(
    {id:'detail-standard',label:'详情页 · 开始按钮',condition:'未订阅用户查看 Premium 内容，当前没有可用试用。',stage:'detail',offer:'standard',fields:[placement+'contentCta']},
    {id:'detail-trial',label:'详情页 · 试用开始按钮',condition:'未订阅用户符合试用资格，默认方案包含试用。预览使用 30 天示例。',stage:'detail',offer:'trial',fields:[placement+'contentTrialCta']}
  )
  locations.push(
    {id:'quick',label:'快速付费墙 · 权益引导',condition:'点击受限权益入口后出现；承接用户刚才想使用的内容。',stage:'offer',view:'quick',offer:'standard',fields:(kind==='ai_allowance'?['title','description']:['category','title','description','unlock']).map(key=>story+key)},
    {id:'subscribe-standard',label:'付费墙 · 订阅按钮',condition:'当前选中的方案不含试用。切换方案时，按钮跟随当前方案。',stage:'offer',view:'quick',offer:'standard',fields:[placement+'cta']},
    {id:'subscribe-trial',label:'付费墙 · 试用按钮',condition:'当前选中的方案含试用。预览选中包含 30 天试用的年度方案。',stage:'offer',view:'quick',offer:'trial',fields:[placement+'trialCta']},
    {id:'plans',label:'套餐步骤 · 订阅按钮',condition:'从完整权益介绍进入独立套餐步骤，月付和年付均直接可见。',stage:'offer',view:'plans',offer:'standard',fields:[placement+'cta']},
    {id:'plans-trial',label:'套餐步骤 · 试用按钮',condition:'独立套餐步骤中的年度试用方案，今天金额及试用后完整年费同时展示。',stage:'offer',view:'plans',offer:'trial',fields:[placement+'trialCta']}
  )
  if(kind!=='membership')locations.push({id:'benefits',label:'完整权益介绍 · 原任务提示',condition:'从快速付费墙点击了解更多后出现；顶部提示原任务，底部再次承接。',stage:'offer',view:'benefits',offer:'standard',fields:[story+'category',story+'next']})
  locations.push(
    {id:'success',label:'订阅完成 · 继续原任务',condition:'订阅成功后出现。此时仍未开始运动或执行原任务，由用户点击继续。',stage:'success',offer:'standard',fields:[placement+'label',placement+'success',placement+'continueLabel']},
    {id:'cancelled',label:'付款取消 · 返回原任务',condition:'取消付款后的结果弹层。次要返回按钮也用于付款失败；关闭普通付费墙不会显示它。',stage:'cancelled',offer:'standard',fields:[placement+'label',placement+'cancelLabel']}
  )
  return locations
}
function locationForFields(id,fields){const locations=locationsForBlock(id);return locations.find(location=>fields&&fields.length&&fields.every(key=>location.fields.includes(key)))||locations[0]}
const labels={contentCta:'详情页底部 · 开始按钮',contentTrialCta:'详情页底部 · 试用开始按钮',title:'快速付费墙 · 主标题',description:'快速付费墙 · 权益说明',unlock:'快速付费墙 · 解锁提示',category:'内容卡片 · 场景标签',cta:'付费墙底部 · 订阅按钮',trialCta:'付费墙底部 · 试用按钮',next:'完整权益介绍 · 原任务提示',label:'结果弹层 · 内容标签',success:'订阅完成 · 成功说明',continueLabel:'订阅完成 · 继续按钮',cancelLabel:'取消 / 失败弹层 · 返回按钮'}
function fieldUsage(key){
  if(!/^wall\.(placements|entryStories)\./.test(key))return null
  const suffix=key.split('.').pop()
  return {label:labels[suffix],shared:suffix==='next'?'同一文案用于完整权益页顶部和底部。':suffix==='category'?'同一标签用于快速付费墙与完整权益页。':suffix==='label'?'同一标签用于订阅完成、付款取消等结果弹层。':suffix==='cancelLabel'?'用于付款取消和付款失败的次要返回按钮。':''}
}
function effectiveCopy(values,field){const inherited=!String(values[field.key]||'').trim()&&field.inherit;return {value:values[inherited||field.key]||'',source:inherited||field.key,inherited:!!inherited}}
module.exports={locationsForBlock,locationForFields,fieldUsage,effectiveCopy}
