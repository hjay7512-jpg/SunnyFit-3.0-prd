import chatConversation from './chat-conversation'
import {membershipView, membershipDate} from './membership-view'
import {premiumOffers,premiumActivationQuery} from './premium-offers'
import {placementFor,resolveSubscriptionWall,reviewPromotion} from './subscription-wall.cjs'
import {recordPaywallEvent} from './paywall-analytics'
import {requestKey} from '@/api/commerce'
import {contentAction,presentContent} from './content-presentation.cjs'

// View-only fixtures in the original App review shell. No API writes or access grants.
export const pageStates = {
  challenge:[['default','报名开放'],['upcoming','活动未开始'],['joined','已报名'],['ended','活动已结束'],['empty','暂无活动'],['loading','加载中']],
  result:[['default','训练结果'],['saved-insight','已保存洞察'],['insight-loading','洞察生成中']],
  course:[['default','当前内容'],['content-free','Free 内容'],['content-premium','Premium 内容'],['loading','加载中'],['unavailable','内容不可用']],
  'world-tour':[['default','全部路线'],['content-free','Free 路线'],['content-premium','Premium 路线'],['loading','加载中'],['empty','暂无路线']],
  program:[['default','当前 Program'],['content-free','Free Program'],['content-premium','Premium Program'],['loading','加载中'],['empty','暂无训练内容']],
  weekly:[['default','周报与当前权益'],['saved-insight','已保存 Insight · 到期仍可读'],['insight-loading','Insight 生成中'],['empty','训练不足'],['loading','周报加载中']],
  coach:[['default','正常对话'],['plan-preview','Dynamic Plan 预览'],['plan-active','Dynamic Plan 已激活'],['thinking','AI 回复中']],
  plan:[['plan-active','已激活计划'],['loading','计划加载中']]
}

export default {
  mixins:[chatConversation],
  data(){return {mvpRequestToken:0,mvpTimer:null,mvpGate:null,mvpFlowSequence:0,mvpCheckoutToken:0,mvpCheckoutApplying:false,mvpPurchaseOutcome:'success',mvpPendingPurchase:null,paywallEvents:[],paywallViewKeys:[]}},
  computed:{
    mvpMember(){return this.data?membershipView(this.data,this.reviewMode?{...this.$route.query,reviewFixture:'1'}:this.$route.query):{}},
    isMvpPreview(){return this.reviewMode||this.$route.query.reviewFixture==='1'||['free','active','canceled','expired'].includes(this.$route.query.membershipState)},
    mvpPageState(){const value=this.isMvpPreview?this.$route.query.reviewPage||this.$route.query.mvpState||'default':'default';return ['error','insight-error','chat-error'].includes(value)?'default':this.screen==='plan'&&value==='plan-preview'?'plan-active':value},
    mvpOptions(){return pageStates[this.screen]||[]},
    mvpOffers(){return premiumOffers(this.data)},
    mvpWall(){return this.mvpGate?this.resolveCurrentWall(Date.now()):null},
    paywallExposureKey(){return this.mvpGate?.kind==='membership'&&['offer','processing'].includes(this.mvpGate.stage)?this.mvpGate.context.flowId+'|'+this.mvpWall.signature:''},
    mvpHasInsight(){return this.isMvpPreview&&this.screen==='result'?this.mvpInsightState==='saved-insight':this.hasInsight},
    mvpInsightBody(){return this.isMvpPreview&&this.screen==='result'?'You completed a 40-minute session and rated the effort 4 out of 10. Use this alongside how you feel as you reflect on today’s workout and plan your next session.':this.insightBody},
    challengeContents(){
      const list=(this.presentationData?.contents||[]).filter(c=>c.contentType==='limited_challenge')
      if(!this.isMvpPreview)return list
      if(this.reviewPageState==='empty')return []
      const now=Date.now(),day=86400000,state=this.mvpEventState
      return list.map(c=>({...c,participation:state==='joined'?{status:'joined'}:c.participation,challengeRules:state==='upcoming'?{...c.challengeRules,startsAt:new Date(now+day).toISOString(),endsAt:new Date(now+day*10).toISOString()}:state==='ended'?{...c.challengeRules,startsAt:new Date(now-day*3).toISOString(),endsAt:new Date(now-day).toISOString()}:c.challengeRules}))
    },
    mvpPageFeedback(){return this.isMvpPreview&&(['loading','unavailable'].includes(this.reviewPageState)||this.reviewPageState==='empty'&&this.screen==='program')},
    presentationData(){
      if(!this.data||!this.isMvpPreview)return this.data
      const member=this.mvpMember
      const contents=this.data.contents.filter(c=>c.tier!=='featured').map(c=>({...c,access:{...c.access,allowed:c.tier==='free'||member.active,reason:c.tier==='free'||member.active?'ENTITLED':'ENTITLEMENT_REQUIRED'}}))
      // Missing Free content is a local review fixture, never inserted into the catalog.
      for(const [kind,id,name] of [['world_tour','preview-free-world-tour','Coastal Discovery'],['training_program','preview-free-program','Beginner Foundations']]){
        if(!contents.some(c=>c.contentType===kind&&c.tier==='free')){
          const source=contents.find(c=>c.contentType===kind)
          if(source)contents.push({...source,id,name,tier:'free',description:kind==='world_tour'?'A scenic route to find your pace.':'Build a consistent routine with an approachable series of workouts.',access:{allowed:true,reason:'ENTITLED'}})
        }
      }
      const previewInsight=this.data.weeklyReport?.insight?.body||'Your '+(this.data.weeklyReport?.stats?.workouts||0)+' workouts added up to '+(this.data.weeklyReport?.stats?.time||0)+' minutes this week. Reflect on your workout mix and active days as you plan a routine that fits your next week.'
      const weeklyReport=this.data.weeklyReport?{...this.data.weeklyReport,available:this.reviewPageState==='empty'&&this.screen==='weekly'?false:this.data.weeklyReport.available,insight:{...this.data.weeklyReport.insight,body:previewInsight,allowed:member.active||this.mvpInsightState==='saved-insight',saved:this.mvpInsightState==='saved-insight',status:this.mvpInsightState==='insight-loading'?'loading':'ready'}}:null
      return {...this.data,contents:contents.map(presentContent),weeklyReport}
    },
    mvpChatLabel(){
      if(!this.isMvpPreview)return this.costLabel('ai_chat')
      return this.mvpMember.unlimited?'Unlimited event · Until '+membershipDate(this.mvpMember.campaignEndsAt):this.mvpMember.percent===null?'Allowance unavailable':this.mvpMember.percent+'% conversation allowance left'
    },
    mvpAiState(){return this.mvpReplyState==='thinking'?'thinking':this.aiActivity},
    mvpInputLocked(){return this.chatInputLocked||this.chatSending||this.isMvpPreview&&this.mvpReplyState==='thinking'},
    collectionContents(){const kind=this.screen==='movement'?'movement':'world_tour';let list=(this.presentationData?.contents||[]).filter(c=>c.contentType===kind);if(this.reviewPageState==='empty')return [];if(this.mvpContentState==='content-free'||this.mvpContentState==='content-premium')list=list.filter(c=>c.tier===(this.mvpContentState==='content-free'?'free':'premium'));return list}
  },
  watch:{paywallExposureKey(key){if(!key||this.paywallViewKeys.includes(key))return;this.$nextTick(()=>{if(this.paywallExposureKey!==key)return;this.paywallViewKeys.push(key);this.emitPaywallEvent('paywall_view')})}},
  beforeDestroy(){clearTimeout(this.mvpTimer);this.mvpCheckoutToken++},
  methods:{
    wallInput(now){
      const provided=this.data?.subscriptionOffer||{},requested=this.isMvpPreview?(this.$route.query.reviewContentOffer||this.$route.query.reviewOffer):undefined,variant=requested==='unavailable'?undefined:requested,promotion=variant?reviewPromotion(variant,now):provided
      return {member:this.mvpMember,offers:this.mvpOffers,campaign:promotion.campaign,eligibility:promotion.eligibility,channel:provided.channel||'web_demo',currency:provided.currency,now}
    },
    contentStartAction(content){return contentAction(content,this.wallInput(Date.now()))},
    resolveCurrentWall(now){const context=this.mvpGate?.context||{};return resolveSubscriptionWall({...this.wallInput(now),kind:context.kind||'membership',resource:{id:context.resourceId,name:context.resourceName,detail:context.detail,image:context.image,draft:!!context.draft}})},
    emitPaywallEvent(type,offer,extra={}){
      const flow=this.mvpGate;if(!flow?.context||flow.kind==='credits')return
      const wall=this.resolveCurrentWall(Date.now()),selected=offer||flow.offer||wall.offers.find(item=>item.offerId===wall.defaultOfferId),context=flow.context
      const event=recordPaywallEvent({type,flowId:context.flowId,placementId:context.placementId||wall.placementId,wallId:wall.id,wallVersion:wall.version,entitlementCode:context.entitlementCode||wall.entitlementCode,scope:context.scope||wall.scope,resourceId:context.resourceId,campaignId:selected?.campaignId||null,offerId:selected?.offerId||null,skuId:selected?.sku.id,productId:selected?.product.id,billingPeriod:selected?.sku.billingPeriod,currency:selected?.sku.currency,priceCents:selected?.chargeTodayCents,trialDays:selected?.trialDays||0,eligibilityStatus:wall.eligibility.status,eligibilityReason:wall.eligibility.reason,source:this.isMvpPreview?'review':'prototype',view:flow.view||'quick',benefitId:flow.benefitTab,...extra})
      this.paywallEvents=[...this.paywallEvents,event].slice(-30)
    },
    selectWallOffer(offer){if(this.mvpGate)this.mvpGate={...this.mvpGate,offer};this.emitPaywallEvent('paywall_offer_selected',offer)},
    async changeWallView(input){
      const view=typeof input==='string'?input:input.view,flow=this.mvpGate
      if(!flow||flow.kind!=='membership'||flow.stage!=='offer'||!['quick','benefits'].includes(view))return
      const offer=typeof input==='object'?input.offer:flow.offer,wall=this.mvpWall
      this.mvpGate={...flow,view,offer:offer||flow.offer||wall.offers.find(item=>item.offerId===wall.defaultOfferId),benefitTab:flow.benefitTab||wall.entry.defaultBenefit}
      if(flow.view!==view)this.emitPaywallEvent(view==='benefits'?'paywall_details_view':'paywall_quick_return',this.mvpGate.offer,{view,benefitId:this.mvpGate.benefitTab})
      if(this.reviewMode){this.mvpCheckoutApplying=true;try{await this.replaceReviewQuery({reviewPurchaseView:view,reviewBenefit:this.mvpGate.benefitTab})}finally{this.mvpCheckoutApplying=false}}
    },
    async changeWallBenefit(benefitId){
      const flow=this.mvpGate;if(!flow||flow.stage!=='offer'||!this.mvpWall.education.stories.some(item=>item.id===benefitId))return
      this.mvpGate={...flow,benefitTab:benefitId};this.emitPaywallEvent('paywall_benefit_explored',flow.offer,{view:'benefits',benefitId})
      if(this.reviewMode){this.mvpCheckoutApplying=true;try{await this.replaceReviewQuery({reviewBenefit:benefitId})}finally{this.mvpCheckoutApplying=false}}
    },
    validWallOffer(offer){
      if(!offer)return null
      return this.resolveCurrentWall(Date.now()).offers.find(item=>(offer.offerId?item.offerId===offer.offerId:item.sku.id===offer.sku.id)&&item.sku.currency===offer.sku.currency&&item.sku.priceCents===offer.sku.priceCents&&(!offer.offerId||item.trialDays===offer.trialDays))||null
    },
    async restoreWallPurchases(){
      const flow=this.mvpGate;if(!flow||this.busy||['processing','restoring'].includes(flow.stage))return
      const token=++this.mvpCheckoutToken;this.emitPaywallEvent('paywall_restore_started');this.mvpGate={...flow,stage:'restoring'}
      await this.load();if(token!==this.mvpCheckoutToken||this.userId!==flow.context.userId)return
      const actual=this.data&&membershipView(this.data)
      if(this.error||!actual?.active){this.mvpGate={...flow,stage:'offer',feedback:this.error?'Purchases couldn’t be checked. Please try again.':'No active subscription was found for this account.'};this.emitPaywallEvent('paywall_restore_result',null,{result:this.error?'error':'not_found'});return}
      this.mvpCheckoutApplying=true
      try{await new Promise(resolve=>this.$router.replace({path:this.$route.path,query:{...this.$route.query,membershipState:actual.state,chatRemaining:actual.percent===null?undefined:String(actual.percent)}},resolve,resolve))}finally{this.mvpCheckoutApplying=false}
      if(token!==this.mvpCheckoutToken)return
      this.mvpGate={...flow,stage:'success'};this.emitPaywallEvent('paywall_restore_result',null,{result:'restored'})
    },
    async reloadWallOffers(){
      const flow=this.mvpGate;if(!flow)return
      await this.load();if(this.mvpGate?.context.flowId!==flow.context.flowId)return
      if(this.isMvpPreview&&this.$route.query.reviewOffer==='unavailable'){this.mvpCheckoutApplying=true;try{await this.replaceReviewQuery({reviewOffer:'standard'})}finally{this.mvpCheckoutApplying=false}}
      this.mvpGate={...flow,stage:'offer',feedback:this.error?'Plans couldn’t be loaded. Please try again.':''}
    },
    async restoreMvpPurchases(){
      if(!this.isMvpPreview){await this.restore();return}
      if(this.busy)return
      const user=this.userId,origin=this.$route.fullPath;this.busy=true
      try{
        await this.load();if(this.error||this.userId!==user||this.$route.fullPath!==origin)return
        const actual=membershipView(this.data)
        if(actual.active){await new Promise(resolve=>this.$router.replace({path:this.$route.path,query:{...this.$route.query,membershipState:actual.state,chatRemaining:actual.percent===null?undefined:String(actual.percent)}},resolve,resolve));this.notice={title:'Membership restored',body:'Your existing Premium access is available. Restoring does not issue another conversation allowance.'}}
        else this.notice={title:'No active subscription found',body:'No active Premium subscription was found for this account. Check that you are using the account linked to your purchase. Nothing was charged.'}
      }finally{this.busy=false}
    },
    setMvpPageState(state,scope){
      this.mvpRequestToken++;clearTimeout(this.mvpTimer)
      const key=scope==='page'?'reviewPage':['saved-insight','insight-loading'].includes(state)?'reviewInsight':['thinking'].includes(state)?'reviewReply':['plan-preview','plan-active'].includes(state)?'reviewPlan':['joined','upcoming','ended'].includes(state)?'reviewEvent':state==='default'&&this.screen==='coach'?'reviewReply':state==='default'&&['weekly','result'].includes(this.screen)?'reviewInsight':'reviewPage'
      const query={...this.$route.query,membershipState:this.$route.query.membershipState||this.mvpMember.state||'free',chatRemaining:this.$route.query.chatRemaining||'65',mvpState:undefined,[key]:state==='default'?undefined:state}
      if(state==='default')delete query.reviewPage
      for(const field of Object.keys(query))if(query[field]===undefined)delete query[field]
      const route={path:this.$route.path,query};this.mvpInternalRoute=this.$router.resolve(route).route.fullPath
      this.$router.replace(route,()=>{})
    },
    mvpUpgrade(kind,content,options={}){
      if(this.mvpPendingPurchase){this.mvpGate=this.mvpPendingPurchase;return}
      const item=placementFor(kind)
      const weekly=this.data.weeklyReport
      const intent={key:++this.mvpFlowSequence,flowId:requestKey(),placementId:item.placementId,entitlementCode:item.entitlementCode,scope:item.scope,userId:this.userId,kind,action:item.action,originScreen:this.screen,originPath:this.$route.path,originQuery:{...this.$route.query},originState:this.mvpPageState,resourceId:content?.id||(kind==='weekly_insight'?weekly?.id:this.$route.query.planId||'preview-dynamic-plan'),resourceName:content?.name||(kind==='weekly_insight'?'Week of '+weekly?.weekStart:'Your saved Dynamic Plan'),label:item.label,detail:kind==='training_program'?(content?.membersPreview?.length||0)+' workouts':content?.durationMinutes?content.durationMinutes+' min':undefined,programId:this.$route.query.fromProgram,stepId:kind==='training_program'?this.programWorkout?.id:undefined,draft:kind==='ai_allowance'?(options.draft===undefined?this.message:options.draft):undefined,messageId:options.messageId,continueLabel:item.continueLabel,cancelLabel:item.cancelLabel,success:item.success}
      if(kind==='limited_challenge'){intent.startsAt=content.challengeRules?.startsAt;intent.endsAt=content.challengeRules?.endsAt;intent.detail='Registration ends '+membershipDate(intent.endsAt)}
      if(kind==='workout_insight'){intent.resourceId=this.objectKey;intent.resourceName='Your completed workout';intent.detail='40 min'+(this.resultRpe===null?'':' · Perceived effort '+this.resultRpe+' / 10')}
      if(kind==='membership'){intent.resourceId='premium';intent.resourceName='SunnyFit Premium'}
      if(kind==='ai_allowance'){if(options.messageId)intent.continueLabel='Resend message';if(!intent.draft)intent.continueLabel='Back to conversation';intent.resourceId='conversation-'+this.userId;intent.resourceName='AI Coach';if(this.mvpMember.percent===null&&!this.mvpMember.unlimited){this.mvpGate={kind:'unknown',stage:'offer',title:'Check your allowance',context:intent};return}if(this.mvpMember.active&&!options.usage){this.mvpGate={kind:'credits',stage:'offer',title:'Add AI Coach Credits',context:intent,offer:this.mvpCreditOffers[0]};return}if(options.usage){this.mvpGate={kind:'usage',stage:'offer',title:'Conversation allowance',context:intent};return}}
      intent.image=content?.coverUrl||''
      const requestedView=this.reviewMode&&['quick','benefits'].includes(this.$route.query.reviewPurchaseView)?this.$route.query.reviewPurchaseView:null
      this.mvpGate={...item,kind:'membership',stage:'offer',view:requestedView||(kind==='membership'?'benefits':'quick'),benefitTab:this.reviewMode?this.$route.query.reviewBenefit:undefined,context:intent,expired:this.mvpMember.state==='expired'}
      const wall=this.mvpWall;this.mvpGate={...this.mvpGate,offer:wall.offers.find(item=>item.offerId===wall.defaultOfferId),benefitTab:this.mvpGate.benefitTab||wall.entry.defaultBenefit}
    },
    cancelMvpPurchase(reason,offer){if(reason==='dismiss')this.emitPaywallEvent('paywall_dismissed',offer,{reason:'user_dismissed'});this.mvpCheckoutToken++;this.mvpGate=null},
    async purchaseMvpOffer(offer){
      const flow=this.mvpGate;if(flow?.kind==='credits')return this.purchaseMvpCredits(offer);if(!flow||flow.stage==='processing'||!offer||this.mvpMember.active&&flow.context.action==='send-message')return
      const matched=this.validWallOffer(offer)
      if(!matched){this.mvpGate={...flow,stage:'offer',feedback:'This offer changed. Please review the available plan.'};this.emitPaywallEvent('paywall_purchase_result',offer,{result:'offer_changed'});return}
      offer=matched;const attemptId=requestKey()
      const token=++this.mvpCheckoutToken
      this.mvpGate={...flow,offer,stage:'processing'}
      this.emitPaywallEvent('paywall_purchase_started',offer,{attemptId})
      await new Promise(resolve=>setTimeout(resolve,450))
      if(token!==this.mvpCheckoutToken||flow.context.userId!==this.userId)return
      if(!this.validWallOffer(offer)){this.mvpGate={...flow,stage:'offer',feedback:'This offer changed. Please review the available plan.'};this.emitPaywallEvent('paywall_purchase_result',offer,{result:'offer_changed',attemptId});return}
      const outcome=this.mvpPurchaseOutcome
      if(outcome!=='success'){this.mvpGate={...flow,offer,stage:outcome};if(outcome==='pending')this.mvpPendingPurchase=this.mvpGate;this.emitPaywallEvent('paywall_purchase_result',offer,{result:outcome,attemptId});return}
      this.mvpCheckoutApplying=true
      try{await new Promise(resolve=>this.$router.replace({path:this.$route.path,query:premiumActivationQuery(this.$route.query,offer.sku.billingPeriod)},resolve,resolve))}finally{this.mvpCheckoutApplying=false}
      if(token!==this.mvpCheckoutToken)return
      this.mvpPendingPurchase=null
      this.mvpGate={...flow,offer,stage:'success'}
      this.emitPaywallEvent('paywall_purchase_result',offer,{result:'success',attemptId})
    },
    retryMvpPurchase(){if(this.mvpGate)this.mvpGate={...this.mvpGate,stage:'offer'}},
    checkMvpPurchase(){const flow=this.mvpGate||this.mvpPendingPurchase;if(flow){this.mvpGate={...flow,stage:'offer'};this.purchaseMvpOffer(flow.offer)}},
    async refreshMvpAllowance(){
      const flow=this.mvpGate;if(!flow||flow.stage==='refreshing')return
      const token=++this.mvpCheckoutToken;this.mvpGate={...flow,stage:'refreshing'}
      await this.load()
      if(token!==this.mvpCheckoutToken||this.userId!==flow.context.userId||this.mvpGate?.context.key!==flow.context.key)return
      if(this.error||this.mvpMember.percent===null){this.mvpGate={...flow,stage:'offer'};return}
      if(this.mvpMember.percent>0||this.mvpMember.unlimited)this.mvpGate={...flow,stage:'success',context:{...flow.context,success:'Your allowance is available. You decide when to send your message.'}}
      else this.mvpUpgrade('ai_allowance')
    },
    viewMvpUsage(){const context=this.mvpGate?.context;this.cancelMvpPurchase();this.go('membership',{returnTo:context?.originScreen||this.screen,resumeState:context?.originState||this.mvpPageState})},
    async resumeMvpPurchase(){
      const flow=this.mvpGate;if(!flow||flow.stage!=='success')return
      const intent=flow.context
      if(intent.userId!==this.userId){this.cancelMvpPurchase();return}
      this.emitPaywallEvent('paywall_continue',flow.offer,{result:'requested',reason:intent.action})
      const restoredQuery={...intent.originQuery}
      for(const key of ['membershipState','chatRemaining','membershipCycle','allowanceMode','reviewQuota','reviewAiCredits','reviewAiCreditsTotal']){if(this.$route.query[key]!==undefined)restoredQuery[key]=this.$route.query[key];else delete restoredQuery[key]}
      const sameQuery=Object.keys({...restoredQuery,...this.$route.query}).every(key=>restoredQuery[key]===this.$route.query[key])
      if(this.$route.path!==intent.originPath||!sameQuery){this.mvpCheckoutApplying=true;try{await new Promise(resolve=>this.$router.push({path:intent.originPath,query:restoredQuery},resolve,resolve))}finally{this.mvpCheckoutApplying=false}}
      if(intent.kind==='course'||intent.kind==='world_tour')this.contentId=intent.resourceId
      if(intent.action==='send-message'){
        if(!this.canSendMvpChat){this.mvpUpgrade('ai_allowance',null,{messageId:intent.messageId,draft:intent.draft});return}
        if(intent.messageId){this.cancelMvpPurchase();await this.sendMvpConversation(intent.messageId);return}
        this.setMessage(intent.draft||this.message);this.cancelMvpPurchase();await this.handleMvpAction('send');return
      }
      if(!this.mvpMember.active){this.mvpGate={...flow,stage:'failure'};return}
      if(intent.action==='membership'){this.cancelMvpPurchase();return}
      if(intent.action==='workout-insight'){if(this.objectKey!==intent.resourceId){this.mvpGate={...flow,stage:'access-error'};return}this.cancelMvpPurchase();await this.handleMvpAction('generate-insight');return}
      if(intent.action==='activate-plan'){this.cancelMvpPurchase();this.setMvpPageState('plan-active');this.appToast='Your saved Dynamic Plan is active.';return}
      if(intent.action==='view-insight'){if(this.data.weeklyReport?.id!==intent.resourceId){this.mvpGate={...flow,stage:'access-error'};return}this.cancelMvpPurchase();this.setMvpPageState('default');this.$nextTick(()=>this.$el.querySelector('.weekly-ai-insight')?.scrollIntoView({block:'center'}));return}
      if(intent.action==='join-challenge'){
        if(Date.parse(intent.endsAt)<=Date.now()||Date.parse(intent.startsAt)>Date.now()){this.mvpGate={...flow,stage:'event-closed'};return}
        const challenge=this.challengeContents.find(c=>c.id===intent.resourceId)
        if(!challenge?.access.allowed){this.mvpGate={...flow,stage:'access-error'};return}
        this.cancelMvpPurchase();this.setMvpPageState('joined');this.appToast='You joined '+intent.resourceName+'.';return
      }
      const resource=this.presentationData.contents.find(c=>c.id===intent.resourceId)
      if(!resource?.access.allowed){this.mvpGate={...flow,stage:'access-error'};return}
      this.cancelMvpPurchase()
      if(intent.kind==='movement'&&this.screen==='movement-training'){this.$refs.movement.begin();return}
      if(intent.action==='start-program'){const step=resource.membersPreview?.find(c=>c.id===intent.stepId)||resource.membersPreview?.[0];if(step){this.contentId=step.id;this.programId=resource.id;this.go('course',{fromProgram:resource.id,courseOrigin:'program',mvpState:undefined})}else this.setMvpPageState('empty');return}
      this.notice={title:'Ready to train',body:resource.name+' is ready to start.'}
    },
    async handleMvpAction(action){
      if(action.startsWith('chat-pay:')){this.openChatPurchase(action.slice(9));return true}
      if(action.startsWith('chat-retry:')){await this.sendMvpConversation(action.slice(11));return true}
      if(action==='send'&&(this.isMvpPreview||this.data.policyVersion===20261014&&!this.canSendMvpChat)){await this.sendMvpConversation();return true}
      if(action==='allowance-details'&&(this.isMvpPreview||this.data.policyVersion===20261014)){this.mvpUpgrade('ai_allowance',null,{usage:true});return true}
      if(action==='quota-options'&&(this.isMvpPreview||this.data.policyVersion===20261014)){this.mvpUpgrade('ai_allowance');return true}
      if(!this.isMvpPreview)return false
      if(action==='generate-insight'){
        if(this.screen==='result'&&this.resultRpe===null)return true
        if(!this.mvpMember.active){this.mvpUpgrade('workout_insight');return true}
        this.setMvpPageState('insight-loading');const token=this.mvpRequestToken
        this.mvpTimer=setTimeout(()=>{if(token===this.mvpRequestToken)this.setMvpPageState('saved-insight')},700)
        return true
      }
      if(action.startsWith('join-challenge:')){
        const challenge=this.challengeContents.find(c=>c.id===action.slice(15));if(!challenge)return true
        if(Date.parse(challenge.challengeRules.endsAt)<=Date.now()||Date.parse(challenge.challengeRules.startsAt)>Date.now()||challenge.participation)return true
        if(!challenge.access.allowed)this.mvpUpgrade('limited_challenge',challenge)
        else {this.setMvpPageState('joined');this.appToast='You joined '+challenge.name+'.'}
        return true
      }
      if(action==='usage'){this.go('membership',{returnTo:this.screen,resumeState:this.mvpPageState});return true}
      if(action==='open-weekly'){this.go('weekly',{object:this.data.weeklyReport?.id});return true}
      if(action==='weekly-later'){this.appToast='Your weekly report stays available.';return true}
      if(action==='mvp-retry'){this.setMvpPageState('default','page');return true}
      if(action==='weekly-upgrade'){this.mvpUpgrade('weekly_insight');return true}
      if(action==='quota-options'){this.mvpUpgrade('ai_allowance');return true}
      if(action==='retry-weekly'){this.setMvpPageState('default');return true}
      if(action==='activate-plan'){
        if(this.screen!=='coach'){this.go('coach',{reviewPlan:'plan-preview'});return true}
        if(this.mvpMember.active){this.setMvpPageState('plan-active');this.appToast='Your Dynamic Plan is active. No conversation allowance was used.'}else this.mvpUpgrade('dynamic_plan')
        return true
      }
      if(action==='start-program'){
        const program=this.selectedProgram
        if(!program)return true
        if(!program.access.allowed){this.mvpUpgrade('training_program',program);return true}
        const first=program.membersPreview?.[0]
        if(first){this.contentId=first.id;this.go('course',{fromProgram:program.id,courseOrigin:'program',resumeState:undefined})}else this.setMvpPageState('empty')
        return true
      }
      if(action==='start-course'||action.startsWith('start-course:')||action.startsWith('start-content:')){
        const id=action.includes(':')?action.slice(action.indexOf(':')+1):this.selectedContent?.id
        const content=this.presentationData.contents.find(c=>c.id===id)
        if(!content)return true
        const program=this.presentationData.contents.find(c=>c.id===this.$route.query.fromProgram)
        const included=program?.access.allowed&&program.membersPreview?.some(c=>c.id===id)
        if(content.access.allowed||included){this.notice={title:'Ready to train',body:content.name+' is available. Your conversation allowance is not used to start a workout.'}}
        else this.mvpUpgrade(content.contentType,content)
        return true
      }
      if(action==='new-chat'){this.setMvpPageState('default');return false}
      if(action==='adjust-plan'||action==='create-plan'){this.coachContext=action==='create-plan'?'Discuss a new Dynamic Plan':'Discuss changes to my plan';this.go('coach',{reviewPlan:action==='create-plan'?'plan-preview':'default',mvpState:undefined});return true}
      return false
    }
  }
}
