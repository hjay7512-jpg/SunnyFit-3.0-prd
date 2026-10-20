import {allowanceReminder,creditOffers,sameCreditOffer} from './chat-allowance.cjs'
import {requestKey} from '@/api/commerce'

export default {
  data(){return {chatWarningLevels:[],chatWarningKey:'',chatSending:false,chatFulfilledCreditFlows:{}}},
  watch:{'$route.path'(){this.cancelPendingChat()},mvpReplyState(value){if(value!=='thinking')this.cancelPendingChat()},'mvpMember.percent'(value,previous){if(value>20&&previous<=20){this.chatWarningLevels=[];if(this.chatWarningKey)sessionStorage.removeItem(this.chatWarningKey)}}},
  computed:{
    mvpCreditOffers(){return creditOffers(this.data||{})},
    mvpChatUnitCost(){const service=this.data?.services.find(s=>s.id==='ai_chat');return service?.credits>0?service.credits:null},
    mvpChatPurchasedCredits(){if(this.isMvpPreview){const n=Number(this.$route.query.reviewAiCredits);return Number.isFinite(n)?Math.max(0,n):0}return (this.data?.wallet.batches||[]).filter(b=>b.creditType==='AI_COACH_CREDIT'&&b.status==='active'&&b.expiresAt===null).reduce((sum,b)=>sum+Number(b.available||0),0)},
    mvpChatPurchasedTotal(){if(this.isMvpPreview){const n=Number(this.$route.query.reviewAiCreditsTotal);return Number.isFinite(n)?Math.max(0,n):0}return (this.data?.wallet.batches||[]).filter(b=>b.creditType==='AI_COACH_CREDIT'&&b.status==='active'&&b.expiresAt===null).reduce((sum,b)=>sum+Number(b.original||0),0)},
    canSendMvpChat(){return this.mvpMember.unlimited||this.mvpMember.percent>0||this.mvpChatUnitCost!==null&&this.mvpChatPurchasedCredits>=this.mvpChatUnitCost}
  },
  methods:{
    cancelPendingChat(){this.chatSending=false;for(const item of this.sessionResults){if(item.delivery==='pending'){this.$set(item,'delivery','failed');this.$set(item,'failure','network')}}},
    chatReminderFor(member){
      if(member.unlimited)return null
      const purchased=this.mvpChatPurchasedCredits>0,percent=purchased?(this.mvpChatPurchasedTotal>0?Math.ceil(this.mvpChatPurchasedCredits/this.mvpChatPurchasedTotal*100):null):member.percent
      const key=['sunnyfit-chat-thresholds',this.userId,purchased?'purchased-'+this.mvpChatPurchasedTotal:member.resetAt||member.expiry||'current'].join(':')
      if(key!==this.chatWarningKey){this.chatWarningKey=key;try{const levels=JSON.parse(sessionStorage.getItem(key)||'[]');this.chatWarningLevels=Array.isArray(levels)?levels:[]}catch(_){this.chatWarningLevels=[]}}
      const reminder=allowanceReminder(percent,this.chatWarningLevels)
      if(reminder){this.chatWarningLevels=reminder.seen;sessionStorage.setItem(key,JSON.stringify(reminder.seen));return {threshold:reminder.threshold,percent:reminder.percent}}
      return null
    },
    async sendMvpConversation(messageId){
      if(this.chatSending||this.mvpReplyState==='thinking')return
      let item=messageId&&this.sessionResults.find(m=>m.id===messageId&&m.type==='conversation')
      if(messageId&&(!item||item.delivery!=='failed'))return
      const draft=item?item.message:this.message.trim();if(!draft)return
      this.openedConversation=null;this.sampleConversation=false
      if(!item){item={id:'preview-chat-'+requestKey(),type:'conversation',message:draft,body:'',delivery:'pending',failure:null,quotaReminder:null};this.sessionResults.push(item);this.setMessage('')}
      this.$set(item,'failure',null);this.$set(item,'delivery','pending')
      if(!this.canSendMvpChat){this.$set(item,'delivery','failed');this.$set(item,'failure',this.mvpMember.percent===null?'unknown':'allowance');this.setMvpPageState('default','reply');return}
      if(!item.quotaReminder)this.$set(item,'quotaReminder',this.chatReminderFor(this.mvpMember))
      this.setMvpPageState('thinking','reply');this.chatSending=true
      const token=this.mvpRequestToken,origin=this.$route.path,user=this.userId
      this.mvpTimer=setTimeout(async()=>{
        if(token!==this.mvpRequestToken||this.$route.path!==origin||this.userId!==user)return
        if(!this.mvpMember.unlimited&&!(this.mvpMember.percent>0)&&this.mvpChatUnitCost){const balance=this.mvpChatPurchasedCredits;if(balance<this.mvpChatUnitCost){this.$set(item,'delivery','failed');this.$set(item,'failure','allowance');this.setMvpPageState('default','reply');return}const patch={reviewAiCredits:String(balance-this.mvpChatUnitCost)};this.mvpInternalRoute=this.$router.resolve({path:this.$route.path,query:{...this.$route.query,...patch}}).route.fullPath;this.mvpCheckoutApplying=true;try{await this.replaceReviewQuery(patch)}finally{this.mvpCheckoutApplying=false}}
        if(token!==this.mvpRequestToken||this.userId!==user)return
        this.$set(item,'body','Let’s make your next workout manageable. Tell me how much time you have, which equipment you want to use, and how you felt after your last session. We can use that to discuss a plan you can preview before activating.')
        this.$set(item,'delivery','sent');this.setMvpPageState('default','reply')
      },700)
    },
    openChatPurchase(messageId){
      const item=this.sessionResults.find(m=>m.id===messageId);if(!item)return
      this.mvpUpgrade('ai_allowance',null,item.delivery==='failed'?{messageId,draft:item.message}:{draft:this.message})
    },
    async purchaseMvpCredits(offer){
      const flow=this.mvpGate;if(!flow||flow.kind!=='credits'||flow.stage==='processing'||!offer)return
      if(this.chatFulfilledCreditFlows[flow.context.flowId]){this.mvpGate={...flow,stage:'success'};return}
      const matched=this.mvpCreditOffers.find(o=>sameCreditOffer(o,offer))
      if(!matched){this.mvpGate={...flow,stage:'offer',feedback:'This pack changed. Please review the current price.'};return}
      const token=++this.mvpCheckoutToken;this.mvpGate={...flow,offer:matched,stage:'processing'}
      await new Promise(resolve=>setTimeout(resolve,450))
      if(token!==this.mvpCheckoutToken||flow.context.userId!==this.userId)return
      if(this.mvpPurchaseOutcome!=='success'){this.mvpGate={...flow,offer:matched,stage:this.mvpPurchaseOutcome};if(this.mvpPurchaseOutcome==='pending')this.mvpPendingPurchase=this.mvpGate;return}
      const current=this.mvpCreditOffers.find(o=>sameCreditOffer(o,matched))
      if(!current){this.mvpGate={...flow,stage:'offer',feedback:'This pack changed. Please review the current price.'};return}
      this.mvpCheckoutApplying=true;try{await this.replaceReviewQuery({reviewAiCredits:String(this.mvpChatPurchasedCredits+current.product.credits.amount),reviewAiCreditsTotal:String(this.mvpChatPurchasedTotal+current.product.credits.amount),...(!this.isMvpPreview?{reviewFixture:'1',membershipState:this.mvpMember.state,chatRemaining:String(this.mvpMember.percent)}:{})})}finally{this.mvpCheckoutApplying=false}
      if(token!==this.mvpCheckoutToken)return
      this.$set(this.chatFulfilledCreditFlows,flow.context.flowId,true);this.mvpPendingPurchase=null;this.mvpGate={...flow,offer:current,stage:'success'}
    }
  }
}
