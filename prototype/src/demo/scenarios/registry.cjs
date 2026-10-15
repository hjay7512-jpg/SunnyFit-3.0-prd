const scenarios = [
  {id:'free',name:'Free · 无额外 Credits',userId:'DEMO-1001',contentId:'course_premium'},
  {id:'member',name:'Premium · 包含服务与历史 Credits',userId:'DEMO-1003',contentId:'course_premium'},
  {id:'low-balance',name:'Premium · 低余额',userId:'DEMO-1004',contentId:'course_featured'},
  {id:'expired',name:'会员过期 · 保留独立资产',userId:'DEMO-1005',contentId:'course_featured'}
]
const experiment = {
  id:'membership-cta',version:1,title:'会员权益入口文案',
  task:'从 Membership & Usage 找到当前可用的会员权益和方案。',
  difference:'只改变免费账户的主按钮文案；同一份账户快照、权益、价格和目标页面。',
  variants:{A:{label:'Explore Premium',source:'Alpha 原稿'},B:{label:'View plans & benefits',source:'待验证的文案提案'}}
}
function scenarioById(id){return scenarios.find(s=>s.id===id)||scenarios[0]}
function resolveVariant(value){return value==='B'?'B':'A'}
module.exports={scenarios,experiment,scenarioById,resolveVariant}
