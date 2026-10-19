import {membershipView, membershipDate} from './membership-view'
import {premiumOffers,premiumActivationQuery} from './premium-offers'

// View-only fixtures in the original App review shell. No API writes or access grants.
export const pageStates = {
  challenge:[['default','报名开放'],['upcoming','活动未开始'],['joined','已报名'],['ended','活动已结束'],['empty','暂无活动'],['loading','加载中'],['error','加载失败']],
  result:[['default','训练结果'],['saved-insight','已保存洞察'],['insight-loading','洞察生成中'],['insight-error','洞察生成失败']],
  course:[['default','当前内容'],['content-free','Free 内容'],['content-premium','Premium 内容'],['loading','加载中'],['error','加载失败'],['unavailable','内容不可用']],
  'world-tour':[['default','全部路线'],['content-free','Free 路线'],['content-premium','Premium 路线'],['loading','加载中'],['error','加载失败'],['empty','暂无路线']],
  program:[['default','当前 Program'],['content-free','Free Program'],['content-premium','Premium Program'],['loading','加载中'],['error','加载失败'],['empty','暂无训练内容']],
  weekly:[['default','周报与当前权益'],['saved-insight','已保存 Insight · 到期仍可读'],['insight-loading','Insight 生成中'],['insight-error','Insight 生成失败'],['empty','训练不足'],['loading','周报加载中'],['error','周报加载失败']],
  coach:[['default','正常对话'],['plan-preview','Dynamic Plan 预览'],['plan-active','Dynamic Plan 已激活'],['thinking','AI 回复中'],['chat-error','AI 请求失败']],
  plan:[['default','当前计划'],['plan-preview','待激活计划'],['plan-active','已激活计划'],['loading','计划加载中'],['error','计划加载失败']]
}

export default {
  data(){return {mvpRequestToken:0,mvpTimer:null,mvpGate:null,mvpFlowSequence:0,mvpCheckoutToken:0,mvpCheckoutApplying:false,mvpPurchaseOutcome:'success',mvpPendingPurchase:null}},
  computed:{
    mvpMember(){return this.data?membershipView(this.data,this.$route.query):{}},
    isMvpPreview(){return ['free','active','canceled','expired'].includes(this.$route.query.membershipState)},
    mvpPageState(){return this.isMvpPreview?this.$route.query.mvpState||'default':'default'},
    mvpOptions(){return pageStates[this.screen]||[]},
    mvpOffers(){return premiumOffers(this.data)},
    mvpHasInsight(){return this.isMvpPreview&&this.screen==='result'?this.mvpPageState==='saved-insight':this.hasInsight},
    mvpInsightBody(){return this.isMvpPreview&&this.screen==='result'?'You completed a 40-minute session and rated the effort 4 out of 10. Use this alongside how you feel as you reflect on today’s workout and plan your next session.':this.insightBody},
    challengeContents(){
      const list=(this.presentationData?.contents||[]).filter(c=>c.contentType==='limited_challenge')
      if(!this.isMvpPreview)return list
      if(this.mvpPageState==='empty')return []
      const now=Date.now(),day=86400000,state=this.mvpPageState
      return list.map(c=>({...c,participation:state==='joined'?{status:'joined'}:c.participation,challengeRules:state==='upcoming'?{...c.challengeRules,startsAt:new Date(now+day).toISOString(),endsAt:new Date(now+day*10).toISOString()}:state==='ended'?{...c.challengeRules,startsAt:new Date(now-day*3).toISOString(),endsAt:new Date(now-day).toISOString()}:c.challengeRules}))
    },
    mvpPageFeedback(){return this.isMvpPreview&&(['loading','error','unavailable'].includes(this.mvpPageState)||this.mvpPageState==='empty'&&this.screen==='program')},
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
      const weeklyReport=this.data.weeklyReport?{...this.data.weeklyReport,available:this.mvpPageState==='empty'&&this.screen==='weekly'?false:this.data.weeklyReport.available,insight:{...this.data.weeklyReport.insight,body:previewInsight,allowed:member.active||this.mvpPageState==='saved-insight',saved:this.mvpPageState==='saved-insight',status:this.mvpPageState==='insight-loading'?'loading':this.mvpPageState==='insight-error'?'error':'ready'}}:null
      return {...this.data,contents,weeklyReport}
    },
    mvpChatLabel(){
      if(!this.isMvpPreview)return this.costLabel('ai_chat')
      return this.mvpMember.unlimited?'Unlimited event · Until '+membershipDate(this.mvpMember.campaignEndsAt):this.mvpMember.percent===null?'Allowance unavailable':this.mvpMember.percent+'% conversation allowance left'
    },
    mvpAiState(){return this.mvpPageState==='thinking'?'thinking':this.mvpPageState==='chat-error'?'error':this.aiActivity},
    mvpInputLocked(){return this.chatInputLocked||this.isMvpPreview&&this.mvpPageState==='thinking'},
    collectionContents(){const kind=this.screen==='movement'?'movement':'world_tour';let list=(this.presentationData?.contents||[]).filter(c=>c.contentType===kind);if(this.mvpPageState==='empty')return [];if(this.mvpPageState==='content-free'||this.mvpPageState==='content-premium')list=list.filter(c=>c.tier===(this.mvpPageState==='content-free'?'free':'premium'));return list}
  },
  beforeDestroy(){clearTimeout(this.mvpTimer);this.mvpCheckoutToken++},
  methods:{
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
    setMvpPageState(state){this.mvpRequestToken++;clearTimeout(this.mvpTimer);this.$router.replace({path:this.$route.path,query:{...this.$route.query,membershipState:this.$route.query.membershipState||this.mvpMember.state||'free',chatRemaining:this.$route.query.chatRemaining||'65',mvpState:state==='default'?undefined:state}},()=>{})},
    mvpUpgrade(kind,content){
      if(this.mvpPendingPurchase){this.mvpGate=this.mvpPendingPurchase;return}
      const copy={
        movement:{title:'Start this movement workout',body:'This movement group is included with Premium. Choose your training mode after unlocking access.',benefits:['Follow the selected movement group','Choose vision recognition on supported devices'],label:'YOUR SELECTED MOVEMENT GROUP',action:'start-workout',continueLabel:'Start this workout',cancelLabel:'Back to preparation',success:'Your movement group is ready.'},
        course:{title:'Start this Premium workout',body:'Follow this trainer-led session with Premium and bring fresh variety to your training routine.',benefits:['Start the workout you’ve chosen','Explore more sessions to match your next training day'],label:'YOUR SELECTED WORKOUT',action:'start-workout',continueLabel:'Start this workout',cancelLabel:'Back to workout',success:'Premium is active. Your selected workout is ready to start.'},
        world_tour:{title:'Start your selected route',body:'Turn your next session into a change of scenery. Premium gives you access to this route and more real-world destinations.',benefits:['Train along the route you’ve chosen','Find new scenery for your next session'],label:'YOUR SELECTED ROUTE',action:'start-workout',continueLabel:'Start this route',cancelLabel:'Back to routes',success:'Premium is active. Your selected route is ready to start.'},
        training_program:{title:'Train with this Program',body:'This Program is part of Premium. Subscribe to follow its sequence of workouts and continue with your selected session.',benefits:['Access the workouts in this Program','Follow a structured sequence of sessions'],label:'YOUR SELECTED PROGRAM',action:'start-program',continueLabel:'Continue this Program',cancelLabel:'Back to Program',success:'Premium is active. Your Program and selected session are ready.'},
        dynamic_plan:{title:'Activate your saved plan',body:'Turn your saved preview into a routine you can follow. Premium lets you activate this Dynamic Plan and keep your upcoming sessions together.',benefits:['Follow the training plan you’ve previewed','Activation does not use conversation allowance'],label:'YOUR SAVED PLAN',action:'activate-plan',continueLabel:'Activate this plan',cancelLabel:'Back to plan preview',success:'Premium is active. Your saved plan is ready. Activate it when you’re ready.'},
        weekly_insight:{title:'Understand this week’s training',body:'Your weekly stats are free. Premium adds an AI perspective on this week’s workout mix and consistency.',benefits:['View this week’s AI insight','Keep all your basic weekly stats'],label:'YOUR WEEKLY REPORT',action:'view-insight',continueLabel:'View this week’s insight',cancelLabel:'Back to weekly report',success:'Premium is active. The AI insight for this report is ready to view.'},
        limited_challenge:{title:'Join this Premium challenge',body:'Take part in this event with Premium. Subscribe, then confirm your entry while registration is open.',benefits:['Eligibility to join this challenge during the event','Premium workouts, routes and Training Programs'],label:'YOUR SELECTED CHALLENGE',action:'join-challenge',continueLabel:'Join this challenge',cancelLabel:'Back to challenge',success:'Premium is active. Confirm your entry to join this challenge.'},
        workout_insight:{title:'Reflect on this workout',body:'Your workout results are yours to keep. Premium adds an AI perspective on your session and perceived effort.',benefits:['An insight for this completed workout','Included with Premium; no conversation allowance used'],label:'YOUR COMPLETED WORKOUT',action:'workout-insight',continueLabel:'Generate this insight',cancelLabel:'Back to workout results',success:'Premium is active. You can now generate an insight for this workout.'},
        ai_allowance:{title:'Continue this conversation',body:'Your Free conversation allowance is used up. Subscribing to Premium gives you a new finite allowance immediately, so you can continue with this message.',benefits:['New finite AI Coach allowance available after purchase','Access Premium training and Dynamic Plans'],label:'YOUR CONVERSATION',action:'send-message',continueLabel:'Send saved message',cancelLabel:'Back to conversation',success:'Premium and your new conversation allowance are ready.'},
        membership:{title:'Choose your Premium plan',body:'Get more ways to train, activate your Dynamic Plan and receive a new finite AI Coach allowance when you subscribe.',benefits:['Premium courses, World Tours and Training Programs','Dynamic Plans, weekly insights and AI Coach allowance'],label:'YOUR MEMBERSHIP',action:'membership',continueLabel:'View membership & usage',cancelLabel:'Back to benefits',success:'Your Premium membership is active and your new finite AI Coach allowance is available.'}
      }
      const item=copy[kind]||copy.course
      const weekly=this.data.weeklyReport
      const intent={key:++this.mvpFlowSequence,userId:this.userId,kind,action:item.action,originScreen:this.screen,originPath:this.$route.path,originQuery:{...this.$route.query},originState:this.mvpPageState,resourceId:content?.id||(kind==='weekly_insight'?weekly?.id:this.$route.query.planId||'preview-dynamic-plan'),resourceName:content?.name||(kind==='weekly_insight'?'Week of '+weekly?.weekStart:'Your saved Dynamic Plan'),label:item.label,detail:content?.durationMinutes?content.durationMinutes+' min':kind==='training_program'?(content?.membersPreview?.length||0)+' workouts':undefined,programId:this.$route.query.fromProgram,stepId:kind==='training_program'?this.programWorkout?.id:undefined,draft:kind==='ai_allowance'?this.message:undefined,continueLabel:item.continueLabel,cancelLabel:item.cancelLabel,success:item.success}
      if(kind==='limited_challenge'){intent.startsAt=content.challengeRules?.startsAt;intent.endsAt=content.challengeRules?.endsAt;intent.detail='Registration ends '+membershipDate(intent.endsAt)}
      if(kind==='workout_insight'){intent.resourceId=this.objectKey;intent.resourceName='Your completed workout';intent.detail='40 min · Perceived effort 4 / 10'}
      if(kind==='membership'){intent.resourceId='premium';intent.resourceName='SunnyFit Premium'}
      if(kind==='ai_allowance'){intent.resourceId='conversation-'+this.userId;intent.resourceName='AI Coach';if(this.mvpMember.percent===null){this.mvpGate={kind:'unknown',stage:'offer',title:'Check your allowance',context:intent};return}if(this.mvpMember.active){this.mvpGate={kind:'usage',stage:'offer',title:this.mvpMember.campaignEnded?'Your unlimited event has ended':'Your allowance is used up',context:intent};return}}
      this.mvpGate={...item,kind:'membership',stage:'offer',context:intent,expired:this.mvpMember.state==='expired'}
    },
    cancelMvpPurchase(){this.mvpCheckoutToken++;this.mvpGate=null},
    async purchaseMvpOffer(offer){
      const flow=this.mvpGate;if(!flow||flow.stage==='processing'||!offer||this.mvpMember.active&&flow.context.action==='send-message')return
      const token=++this.mvpCheckoutToken
      this.mvpGate={...flow,offer,stage:'processing'}
      await new Promise(resolve=>setTimeout(resolve,450))
      if(token!==this.mvpCheckoutToken||flow.context.userId!==this.userId)return
      const outcome=this.mvpPurchaseOutcome
      if(outcome!=='success'){this.mvpGate={...flow,offer,stage:outcome};if(outcome==='pending')this.mvpPendingPurchase=this.mvpGate;return}
      this.mvpCheckoutApplying=true
      try{await new Promise(resolve=>this.$router.replace({path:this.$route.path,query:premiumActivationQuery(this.$route.query,offer.sku.billingPeriod)},resolve,resolve))}finally{this.mvpCheckoutApplying=false}
      if(token!==this.mvpCheckoutToken)return
      this.mvpPendingPurchase=null
      this.mvpGate={...flow,offer,stage:'success'}
    },
    retryMvpPurchase(){if(this.mvpGate)this.mvpGate={...this.mvpGate,stage:'offer'}},
    checkMvpPurchase(){const flow=this.mvpGate||this.mvpPendingPurchase;if(flow){this.mvpGate={...flow,stage:'offer'};this.purchaseMvpOffer(flow.offer)}},
    async refreshMvpAllowance(){
      const flow=this.mvpGate;if(!flow||flow.stage==='refreshing')return
      const token=++this.mvpCheckoutToken;this.mvpGate={...flow,stage:'refreshing'}
      await this.load()
      if(token!==this.mvpCheckoutToken||this.userId!==flow.context.userId||this.mvpGate?.context.key!==flow.context.key)return
      if(this.error||this.mvpMember.percent===null){this.mvpGate={...flow,stage:'offer'};return}
      if(this.mvpMember.percent>0||this.mvpMember.unlimited)this.mvpGate={...flow,stage:'success'}
      else this.mvpUpgrade('ai_allowance')
    },
    viewMvpUsage(){const context=this.mvpGate?.context;this.cancelMvpPurchase();this.go('membership',{returnTo:context?.originScreen||this.screen,resumeState:context?.originState||this.mvpPageState})},
    async resumeMvpPurchase(){
      const flow=this.mvpGate;if(!flow||flow.stage!=='success')return
      const intent=flow.context
      if(intent.userId!==this.userId){this.cancelMvpPurchase();return}
      const restoredQuery={...intent.originQuery}
      for(const key of ['membershipState','chatRemaining','membershipCycle','allowanceMode']){if(this.$route.query[key]!==undefined)restoredQuery[key]=this.$route.query[key];else delete restoredQuery[key]}
      const sameQuery=Object.keys({...restoredQuery,...this.$route.query}).every(key=>restoredQuery[key]===this.$route.query[key])
      if(this.$route.path!==intent.originPath||!sameQuery){this.mvpCheckoutApplying=true;try{await new Promise(resolve=>this.$router.push({path:intent.originPath,query:restoredQuery},resolve,resolve))}finally{this.mvpCheckoutApplying=false}}
      if(intent.kind==='course'||intent.kind==='world_tour')this.contentId=intent.resourceId
      if(intent.action==='send-message'){
        if(!this.mvpMember.unlimited&&!(this.mvpMember.percent>0)){this.mvpUpgrade('ai_allowance');return}
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
      if(action==='quota-options'&&(this.isMvpPreview||this.data.policyVersion===20261014)){this.mvpUpgrade('ai_allowance');return true}
      if(!this.isMvpPreview)return false
      if(action==='generate-insight'){
        if(!this.mvpMember.active){this.mvpUpgrade('workout_insight');return true}
        this.setMvpPageState('insight-loading');const token=this.mvpRequestToken
        this.mvpTimer=setTimeout(()=>{if(token===this.mvpRequestToken)this.setMvpPageState(this.simulateFailure?'insight-error':'saved-insight')},700)
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
      if(action==='mvp-retry'){this.setMvpPageState('default');return true}
      if(action==='weekly-upgrade'){this.mvpUpgrade('weekly_insight');return true}
      if(action==='quota-options'){this.mvpUpgrade('ai_allowance');return true}
      if(action==='retry-weekly'){this.setMvpPageState('default');return true}
      if(action==='activate-plan'){
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
      if(action==='send'){
        if(!this.message.trim())return true
        if(!this.mvpMember.unlimited&&(this.mvpMember.percent===null||this.mvpMember.percent===0)){
          this.mvpUpgrade('ai_allowance')
          return true
        }
        const draft=this.message,origin=this.$route.path,token=++this.mvpRequestToken
        this.setMvpPageState('thinking')
        const currentToken=this.mvpRequestToken
        this.mvpTimer=setTimeout(()=>{
          if(currentToken!==this.mvpRequestToken||this.$route.path!==origin)return
          if(this.simulateFailure){this.setMvpPageState('chat-error');return}
          this.sessionResults.push({id:'preview-chat-'+token,type:'conversation',message:draft,body:'Let’s make your next workout manageable. Tell me how much time you have, which equipment you want to use, and how you felt after your last session. We can use that to discuss a plan you can preview before activating.'})
          if(this.message===draft)this.setMessage('')
          this.setMvpPageState('default')
        },900)
        return true
      }
      if(action==='new-chat'){this.setMvpPageState('default');return false}
      if(action==='adjust-plan'||action==='create-plan'){this.coachContext=action==='create-plan'?'Discuss a new Dynamic Plan':'Discuss changes to my plan';this.go('coach',{mvpState:'plan-preview'});return true}
      return false
    }
  }
}
