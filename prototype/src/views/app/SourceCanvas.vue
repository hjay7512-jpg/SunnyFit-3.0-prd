<template>
  <div class="source-visual" :style="{'--sf-message-composer-height':composerHeight+'px'}" :class="['visual-'+screen,{'source-visual--native':['home','workout','course','plan','program'].includes(screen),'show-reference-chat':sampleConversation && !messages.length && !openedAsset}]" @click="dispatch" @keydown.enter="dispatch" @keydown.space="dispatchSpace">
    <v3-home v-if="screen==='home'" :content="content" :courses="courses" :user="user" :report="report" :access-label="commercial?contentAccessLabel:''" @action="$emit('action',$event)"/>
    <v3-program v-if="screen==='program'" :content="content" :panel-state="programPanel" :start-label="startLabel" :start-copy-field="startCopyField" @panel-change="$emit('action','program-panel:'+$event)" :workout="workout" :next-workout="nextWorkout" :courses="courses" :access-label="commercial?contentAccessLabel:''" @action="$emit('action',$event)"/>
    <v3-plan v-if="screen==='plan'" :plan="dynamicPlan" :content="content" :courses="courses" @action="$emit('action',$event)"/>
    <v3-course v-if="screen==='course'" :content="content" :start-label="startLabel" :start-copy-field="startCopyField" :user="user" :access-label="commercial?contentAccessLabel:''" @action="$emit('action',$event)"/>
    <v3-workout v-if="screen==='workout'" :content="content" :courses="courses" :user="user" :access-label="commercial?contentAccessLabel:''" @action="$emit('action',$event)"/>
    <template v-if="screen==='coach'">
      <source-coach :input-locked="inputLocked" :ai-state="aiState" :message="message" @composer-resize="composerHeight=$event" @input="$emit('input',$event)" @send="$emit('action','send')"><template #tools><button type="button" class="coach-plan-tool__entry" :disabled="inputLocked" @click="$refs.planLauncher.launch()"><sf-icon name="calendar" :size="15"/>Dynamic Plan</button></template></source-coach>
      <div ref="conversation" v-if="!sampleConversation || messages.length || openedAsset" class="actual-conversation">
        <template v-if="openedAsset"><p class="history-date">Saved conversation · reading is free</p><sf-message-bubble :text="openedAsset.body"/></template>
        <template v-else-if="!messages.length&&!['plan-preview','plan-active'].includes(planState)"><sf-chat-greeting class="coach-greeting" :name="name"/></template>
        <p v-if="context&&!openedAsset" class="coach-context">{{ context }}</p>
        <div v-for="item in (openedAsset?[]:messages)" :key="item.id" class="coach-turn" :data-delivery="item.delivery||'sent'">
          <sf-message-bubble v-if="item.message" role="user"><button v-if="item.delivery==='failed'" type="button" class="coach-turn__retry" aria-label="Retry message" title="Not sent. Retry message" @click.stop="$emit('action','chat-retry:'+item.id)"><sf-icon name="alert" :size="14"/></button>{{ item.message }}</sf-message-bubble>
          <coach-message-notice v-if="mvpMember&&(item.delivery==='failed'&&['allowance','unknown'].includes(item.failure)||item.delivery==='sent'&&item.quotaReminder)" :item="item" :member="mvpMember" :can-send="canSendChat" @action="$emit('action',$event)"/>
          <div v-if="item.delivery==='pending'" class="coach-turn__thinking" role="status" aria-label="AI Coach is preparing your reply"><span>•••</span></div>
          <mvp-coach-state v-if="item.planSnapshot&&item.delivery==='sent'&&planState!=='default'" ref="messagePlan" :hide-reply="true" :member="mvpMember" :plan="planFor(item)" :state="planStateFor(item)" @preview="openPlanPreview" @action="$emit('action',$event)"/><sf-message-bubble v-else-if="item.body&&!item.planSnapshot" :text="item.body"/>
        </div>
        <mvp-coach-state v-if="mvpMember&&!hasPlanTurn" ref="planCard" :plan="dynamicPlan" :hide-reply="messages.some(m=>m.delivery==='pending')" :member="mvpMember" :state="planState||mvpState" :reply-state="replyState||mvpState" @preview="openPlanPreview" @action="$emit('action',$event)"/>
      </div>

      <coach-plan-launcher ref="planLauncher" no-entry :state="planState" :busy="inputLocked" @review="openPlanPreview(dynamicPlan)" @action="$emit('action',$event)" @generate="$emit('generate-plan',$event)"/>
      <dynamic-plan-preview v-model="planPreviewOpen" :plan="previewPlan" :member="mvpMember" @action="$emit('action',$event)"/>
    </template>
  </div>
</template>
<script>
import V3Home from './V3Home'
import MvpCoachState from './MvpCoachState'
import CoachMessageNotice from './CoachMessageNotice'
import CoachPlanLauncher from './CoachPlanLauncher'
import DynamicPlanPreview from './DynamicPlanPreview'
import SourceCoach from './restored/Coach'
import V3Program from './V3Program'
import V3Plan from './V3Plan'
import V3Course from './V3Course'
import V3Workout from './V3Workout'
import './restored/source.css'
import {SfIcon,SfChatGreeting,SfMessageBubble} from '@/design-system'
export default {
  components:{SfIcon,DynamicPlanPreview,CoachPlanLauncher,CoachMessageNotice,MvpCoachState,V3Home,V3Plan,V3Course,V3Workout,V3Program,SourceCoach,SfChatGreeting,SfMessageBubble},
  data(){return {composerHeight:48,previewPlan:null,planPreviewOpen:false}},
  props:{dynamicPlan:Object,draftPlan:Object,activePlan:Object,canSendChat:Boolean,programPanel:String,startLabel:String,startCopyField:String,mvpMember:Object,mvpState:String,insightState:String,planState:String,replyState:String,user:Object,report:Object,inputLocked:Boolean,aiState:String,screen:String,name:String,message:String,messages:Array,openedAsset:Object,context:String,balance:Number,commercial:Boolean,sampleConversation:Boolean,hasInsight:Boolean,insightBody:String,analysisCredits:Number,chatCredits:Number,tier:String,redemptionCredits:Number,content:Object,courses:Array,workout:Object,nextWorkout:Object,chargeLabel:String,chatLabel:String},
  watch:{screen(value){if(value==='coach'&&this.$route.query.planSetup==='1')this.$nextTick(()=>this.$refs.planLauncher?.openSetup())},'$route.query.planSetup'(value){if(value==='1')this.$nextTick(()=>this.$refs.planLauncher?.openSetup())},messages:{deep:true,handler(){this.$nextTick(()=>{const feed=this.$refs.conversation;if(feed)feed.scrollTop=feed.scrollHeight})}}},
  mounted(){if(this.screen==='coach'&&this.$route.query.planSetup==='1')this.$nextTick(()=>this.$refs.planLauncher?.openSetup())},
  computed:{hasPlanTurn(){return this.messages.some(item=>item.delivery==='sent'&&item.planSnapshot)},lastPlanTurn(){return [...this.messages].reverse().find(item=>item.delivery==='sent'&&item.planSnapshot)},contentAccessLabel(){return this.content.access&&this.content.access.reason==='PROGRAM_INCLUDED'?'Program':this.content.access&&this.content.access.reason==='REDEEMED'?'Unlocked':this.tier==='featured'?'Unlock · '+this.redemptionCredits+' Credits':this.tier==='premium'?'Premium':'Free'}},
  methods:{planFor(item){return this.activePlan?.messageId===item.id?this.activePlan:this.draftPlan?.messageId===item.id?this.draftPlan:item.planSnapshot},planStateFor(item){if(this.activePlan?.messageId===item.id)return 'plan-active';if(this.draftPlan?.messageId===item.id)return 'plan-preview';return 'plan-superseded'},openPlanPreview(plan){if(plan){this.previewPlan=plan;this.planPreviewOpen=true}},dispatch(event){if(event.target.closest('.sf-message-composer,.sf-insight-card'))return;if(['home','workout','course','plan','program'].includes(this.screen))return;const target=event.target.closest('[data-action]');if(target){event.preventDefault();this.$emit('action',target.dataset.action)}},dispatchSpace(event){if(event.target.matches('[role="button"]'))this.dispatch(event)}}
}
</script>

<style scoped>
.coach-plan-tool__entry{display:flex;align-items:center;gap:6px;padding:8px 12px;min-height:36px;align-self:flex-start;position:relative;border:1px solid var(--sf-content-edge);border-radius:20px;background:var(--sf-content-surface);color:var(--sf-text-secondary);font:500 12px var(--sf-font-family);cursor:pointer}.coach-plan-tool__entry:disabled{opacity:.45;cursor:default}.coach-plan-tool__entry::before{content:'';position:absolute;inset:-4px 0}
</style>
