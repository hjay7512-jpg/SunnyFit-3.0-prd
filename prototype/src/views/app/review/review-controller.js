import {reviewGroups,reviewModel} from './review-model'
const pick=(query,key,legacy,allowed,fallback='default')=>allowed.includes(query[key])?query[key]:legacy.includes(query.mvpState)?query.mvpState:fallback
export const reviewQueryKeys=['reviewFixture','reviewPage','reviewContent','reviewInsight','reviewReply','reviewPlan','reviewEvent','reviewWorkouts','reviewScene','reviewMode','reviewPanel','reviewOrientation','reviewWindows','reviewCamera','reviewDevice','reviewOffer','reviewPurchaseView','reviewBenefit']
export default {
  data(){return {reviewGroups,mvpInternalRoute:'',reviewMovementKey:'',reviewWallKey:''}},
  computed:{
    reviewPageState(){return pick(this.$route.query,'reviewPage',['loading','error','unavailable','empty'],['default','loading','error','unavailable','empty'])},
    mvpContentState(){return pick(this.$route.query,'reviewContent',['content-free','content-premium'],['default','content-free','content-premium'])},
    mvpInsightState(){return pick(this.$route.query,'reviewInsight',['saved-insight','insight-loading','insight-error'],['default','locked','ready','saved-insight','insight-loading','insight-error'])},
    mvpReplyState(){return pick(this.$route.query,'reviewReply',['thinking','chat-error'],['default','thinking','chat-error'])},
    mvpPlanState(){return pick(this.$route.query,'reviewPlan',['plan-preview','plan-active'],['default','plan-preview','plan-active'])},
    mvpEventState(){return pick(this.$route.query,'reviewEvent',['upcoming','joined','ended'],['default','upcoming','joined','ended'])},
    reviewDocument(){return reviewModel(this)}
  },
  created(){if(this.reviewMode&&this.$route.query.reviewFixture!=='1')this.replaceReviewQuery({reviewFixture:'1',membershipState:this.$route.query.membershipState||'free',chatRemaining:this.$route.query.chatRemaining||'65'})},
  watch:{loading(value){if(!value)this.$nextTick(()=>{this.restoreReviewMovement();this.restoreReviewPaywall()})},'$route.fullPath'(){this.$nextTick(this.restoreReviewMovement)}},
  methods:{
    async replaceReviewQuery(patch){
      const query={...this.$route.query,...patch};for(const key of Object.keys(query))if(query[key]===undefined)delete query[key]
      await new Promise(resolve=>this.$router.replace({path:this.$route.path,query},resolve,resolve));await this.$nextTick()
    },
    async applyReviewState(scope,value){
      if(scope==='purchase-view'||scope==='benefit'){
        if(this.mvpPendingPurchase||['processing','restoring'].includes(this.mvpGate?.stage))return
        if(!this.mvpGate)this.previewReviewPurchase('offer')
        if(scope==='purchase-view')await this.changeWallView(value)
        else {if(this.mvpGate?.view!=='benefits')await this.changeWallView('benefits');await this.changeWallBenefit(value)}
        return
      }
      if(scope==='offer'){
        if(this.mvpPendingPurchase||['processing','restoring'].includes(this.mvpGate?.stage))return
        const flow=this.mvpGate;this.mvpCheckoutToken++;this.mvpCheckoutApplying=true
        try{await this.replaceReviewQuery({reviewOffer:value,membershipState:'free'});this.reviewWallKey=this.$route.path}finally{this.mvpCheckoutApplying=false}
        if(flow)this.mvpGate={...flow,kind:'membership',offer:null,stage:'offer',feedback:''};else this.previewReviewPurchase('offer')
        return
      }
      if(scope==='purchase'){
        const flow=this.mvpGate;this.mvpRequestToken++;this.mvpCheckoutToken++;clearTimeout(this.mvpTimer)
        if(value==='closed'){this.cancelMvpPurchase();this.mvpPendingPurchase=null;return}
        if(value==='success'){this.mvpCheckoutApplying=true;try{await this.replaceReviewQuery({membershipState:'active',chatRemaining:'100'})}finally{this.mvpCheckoutApplying=false}}
        if(flow){const wall=this.mvpWall;this.mvpGate={...flow,stage:value,offer:flow.offer||wall.offers.find(item=>item.offerId===wall.defaultOfferId)}}else this.previewReviewPurchase(value)
        this.mvpPurchaseOutcome='success';if(value==='pending')this.mvpPendingPurchase=this.mvpGate
        return
      }
      this.mvpRequestToken++;clearTimeout(this.mvpTimer);this.cancelMvpPurchase();this.mvpPendingPurchase=null;this.closeSheet();this.error='';this.sourceGap='';this.flowState='';this.appToast=''
      if(this.screen==='movement-training'){
        if(scope==='framing'){this.movementReview={...this.movementReview,framed:value==='in-view'};if(this.movementReview.pinned&&this.$refs.movement)this.$refs.movement.bodyVisible=value==='in-view';return}
        if(scope==='device'){this.movementReview={...this.movementReview,performance:value};await this.replaceReviewQuery({reviewDevice:value});return}
        const visual={windows:'reviewWindows',panel:'reviewPanel',orientation:'reviewOrientation'}[scope]
        if(visual){await this.replaceReviewQuery({[visual]:value});this.restoreReviewMovement();return}
        if(scope==='camera'){this.movementReview={...this.movementReview,source:value};await this.replaceReviewQuery({reviewCamera:value});return}
        const field={page:'reviewScene','training-mode':'reviewMode',device:'reviewDevice',camera:'reviewCamera',windows:'reviewWindows',panel:'reviewPanel',orientation:'reviewOrientation'}[scope]
        if(field){const patch={reviewFixture:'1',membershipState:'active',reviewMode:this.$refs.movement?.mode||'regular',reviewScene:this.movementView.stage||'prepare',[field]:value};if(scope==='page'&&value==='setup')patch.reviewMode='vision';if(scope==='training-mode'&&value==='regular'&&patch.reviewScene==='setup')patch.reviewScene='training';await this.replaceReviewQuery(patch);this.restoreReviewMovement();return}
      }
      let patch={reviewFixture:'1',membershipState:this.$route.query.membershipState||'free',chatRemaining:this.$route.query.chatRemaining||'65',mvpState:undefined}
      if(scope==='page'){
        if(['profile','membership','plans'].includes(this.screen))patch.membershipState=value
        else if(this.screen==='plan'&&['plan-preview','plan-active'].includes(value)){patch.reviewPlan=value;patch.reviewPage=undefined}
        else patch.reviewPage=value==='default'?undefined:value
      }else{
        const keys={content:'reviewContent',insight:'reviewInsight',reply:'reviewReply',plan:'reviewPlan',event:'reviewEvent',workouts:'reviewWorkouts',cycle:'membershipCycle'}
        if(keys[scope])patch[keys[scope]]=value
        if(scope==='access')patch.membershipState=value==='unlocked'?'active':'free'
        if(scope==='insight'&&['ready','insight-loading','insight-error'].includes(value))patch.membershipState='active'
        if(scope==='insight'&&value==='locked')patch.membershipState='free'
        if(scope==='quota'){patch.chatRemaining=value==='low'?'10':value==='empty'?'0':['campaign','ended'].includes(value)?this.$route.query.chatRemaining||'65':'65';patch.allowanceMode=value==='campaign'?'campaign':value==='ended'?'ended':'standard'}
        if(scope==='reply'&&value!=='default'&&!this.message)this.setMessage('Help me plan a 20-minute workout.')
      }
      await this.replaceReviewQuery(patch)
    },
    selectReviewPage(screen){
      const query={review:'1',reviewFixture:'1',membershipState:screen==='movement-training'?'active':'free',chatRemaining:'65',user:'DEMO-2002'}
      this.$router.push({path:'/app/'+screen,query},()=>{})
    },
    restoreReviewPaywall(){
      const variant=this.$route.query.reviewOffer,key=this.$route.path
      if(!this.reviewMode||!this.data||this.loading||this.reviewWallKey===key)return
      this.reviewWallKey=key;if(variant||this.$route.query.reviewPurchaseView)this.previewReviewPurchase('offer')
    },
    restoreReviewMovement(){
      if(!this.reviewMode||this.screen!=='movement-training'||!this.$refs.movement)return
      const q=this.$route.query
      if(q.reviewDevice)this.movementReview.performance=q.reviewDevice==='low'?'low':'auto'
      if(q.reviewCamera)this.movementReview.source=q.reviewCamera
      const player=this.$refs.movement
      if(q.reviewPanel)player.immersive=q.reviewPanel==='collapsed'
      if(q.reviewWindows)player.cameraMain=q.reviewWindows!=='trainer'
      if(q.reviewOrientation&&player.mode==='regular')player.landscape=q.reviewOrientation==='landscape'
      player.emitView()
      if(!q.reviewScene)return
      const key=player._uid+':'+['reviewScene','reviewMode'].map(field=>q[field]||'').join(':')
      if(key===this.reviewMovementKey)return;this.reviewMovementKey=key
      this.movementReview={...this.movementReview,source:q.reviewCamera||'demo',performance:q.reviewDevice==='low'?'low':'auto',framed:true,pinned:true}
      this.$nextTick(()=>this.$refs.movement?.previewScene(q.reviewScene,{mode:q.reviewMode,orientation:q.reviewOrientation,panel:q.reviewPanel,windows:q.reviewWindows}))
    },
    handleMovementView(view){
      const before=this.movementView;this.movementView=view;if(!this.reviewMode||this.screen!=='movement-training')return
      const patch={}
      for(const [field,key,first,second] of [['immersive','reviewPanel','collapsed','expanded'],['cameraMain','reviewWindows','camera','trainer'],['landscape','reviewOrientation','landscape','portrait']]){
        if(before[field]!==undefined&&view[field]!==undefined&&before[field]!==view[field]){const value=view[field]?first:second;if(this.$route.query[key]!==value)patch[key]=value}
      }
      if(Object.keys(patch).length)this.replaceReviewQuery(patch)
    },
    previewReviewPurchase(stage){
      const kinds={course:'course',program:'training_program','world-tour':'world_tour',weekly:'weekly_insight',result:'workout_insight',coach:'ai_allowance',plan:'dynamic_plan',challenge:'limited_challenge','movement-training':'movement'}
      const kind=kinds[this.screen]||'membership',content=kind==='training_program'?this.selectedProgram:kind==='movement'?this.movementContent:kind==='limited_challenge'?this.challengeContents[0]:this.selectedContent
      this.mvpUpgrade(kind,content)
      if(this.mvpGate){const wall=this.mvpWall;this.mvpGate={...this.mvpGate,stage,offer:wall.offers.find(item=>item.offerId===wall.defaultOfferId)};this.mvpPurchaseOutcome='success'}
    },
    reviewDocumentAction(action){if(action==='purchase')this.previewReviewPurchase('offer');if(action==='movement-run')this.movementReview={...this.movementReview,pinned:false};if(action.startsWith('simulate-'))this.$refs.movement?.simulate(action.slice(9))},
    openReviewPreview(){this.go(this.screen,{review:'0',...(this.screen==='movement-training'?{reviewScene:undefined,reviewMode:undefined,reviewCamera:undefined}: {})})}
  }
}
