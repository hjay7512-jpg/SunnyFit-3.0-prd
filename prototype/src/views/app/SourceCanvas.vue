<template>
  <div class="source-visual" :style="{'--sf-message-composer-height':composerHeight+'px'}" :class="['visual-'+screen,{'source-visual--native':['home','workout','course','plan','program'].includes(screen),'show-reference-chat':sampleConversation && !messages.length && !openedAsset}]" @click="dispatch" @keydown.enter="dispatch" @keydown.space="dispatchSpace">
    <v3-home v-if="screen==='home'" :content="content" :courses="courses" :user="user" :report="report" :access-label="commercial?contentAccessLabel:''" @action="$emit('action',$event)"/>
    <v3-program v-if="screen==='program'" :content="content" :workout="workout" :next-workout="nextWorkout" :courses="courses" :access-label="commercial?contentAccessLabel:''" @action="$emit('action',$event)"/>
    <v3-plan v-if="screen==='plan'" :content="content" :courses="courses" :preview-member="mvpMember" :preview-state="mvpState" @action="$emit('action',$event)"/>
    <v3-course v-if="screen==='course'" :content="content" :user="user" :access-label="commercial?contentAccessLabel:''" @action="$emit('action',$event)"/>
    <v3-workout v-if="screen==='workout'" :content="content" :courses="courses" :user="user" :access-label="commercial?contentAccessLabel:''" @action="$emit('action',$event)"/>
    <div v-if="screen==='result'" class="result-composition">
      <result-backdrop /><header class="result-top-bar sf-top-bar-mask"><div class="source-status"><b>9:41</b><img :src="statusAsset" alt="" /></div>
      <div class="result-header"><result-header /></div></header>
      <div class="result-summary"></div><p class="result-calorie-label">The Calories In</p>
      <div class="result-calories"><result-calories /></div><result-fruit />
      <div class="result-stats"><result-stats /></div>
      <div class="result-detail-flow">
        <sf-insight-card class="result-insight" :saved="hasInsight" :body="insightBody" :locked="!!mvpMember&&!mvpMember.active" :state="mvpState" :charge-label="mvpMember?'':commercial?chargeLabel:''" :rpe="4" :busy="inputLocked||mvpState==='insight-loading'" @generate="$emit('action','generate-insight')" @ask="$emit('action','coach-workout')"/>
        <div class="result-chart"><result-chart /></div>
        <div class="result-course"><result-course /></div><div class="result-footer"><result-footer /></div>
      </div>
      <div class="source-home-indicator"></div>
    </div>
    <template v-if="screen==='coach'">
      <source-coach :send-disabled="!!mvpMember&&!mvpMember.unlimited&&(mvpMember.percent===0||mvpMember.percent===null)" :input-locked="inputLocked" :ai-state="aiState" :message="message" @composer-resize="composerHeight=$event" @input="$emit('input',$event)" @send="$emit('action','send')" />
      <div v-if="!sampleConversation || messages.length || openedAsset" class="actual-conversation">
        <template v-if="openedAsset"><p class="history-date">Saved conversation · reading is free</p><sf-message-bubble :text="openedAsset.body"/></template>
        <template v-else-if="!messages.length"><sf-chat-greeting class="coach-greeting" :name="name"/><p v-if="context" class="coach-context">{{ context }}</p></template>
        <mvp-coach-state v-if="mvpMember" :member="mvpMember" :state="mvpState" @action="$emit('action',$event)"/>
        <template v-for="item in (openedAsset?[]:messages)"><sf-message-bubble v-if="item.message" :key="item.id+'q'" role="user" :text="item.message"/><sf-message-bubble :key="item.id" :text="item.body"/></template>
      </div>
      <button v-if="commercial" class="coach-credit-hint" @click.stop="$emit('action','usage')">{{ chatLabel }} · View usage</button>
    </template>
  </div>
</template>
<script>
import V3Home from './V3Home'
import MvpCoachState from './MvpCoachState'
import SourceCoach from './restored/Coach'
import V3Program from './V3Program'
import V3Plan from './V3Plan'
import V3Course from './V3Course'
import V3Workout from './V3Workout'
import ResultHeader from './restored/ResultHeader'
import ResultBackdrop from './restored/ResultBackdrop'
import ResultStats from './restored/ResultStats'
import ResultCalories from './restored/ResultCalories'
import ResultFruit from './restored/ResultFruit'
import ResultChart from './restored/ResultChart'
import ResultCourse from './restored/ResultCourse'
import ResultFooter from './restored/ResultFooter'
import './restored/source.css'
import {SfChatGreeting,SfMessageBubble,SfInsightCard} from '@/design-system'
export default {
  components:{MvpCoachState,V3Home,V3Plan,V3Course,V3Workout,V3Program,SourceCoach,SfChatGreeting,SfMessageBubble,SfInsightCard,ResultHeader,ResultBackdrop,ResultStats,ResultCalories,ResultFruit,ResultChart,ResultCourse,ResultFooter},
  data(){return {composerHeight:48}},
  props:{mvpMember:Object,mvpState:String,user:Object,report:Object,inputLocked:Boolean,aiState:String,screen:String,name:String,message:String,messages:Array,openedAsset:Object,context:String,balance:Number,commercial:Boolean,sampleConversation:Boolean,hasInsight:Boolean,insightBody:String,analysisCredits:Number,chatCredits:Number,tier:String,redemptionCredits:Number,content:Object,courses:Array,workout:Object,nextWorkout:Object,chargeLabel:String,chatLabel:String},
  computed:{statusAsset(){return '/assets/figma/restored/source_home/imgRightSide.svg'},contentAccessLabel(){return this.content.access&&this.content.access.reason==='PROGRAM_INCLUDED'?'Included in your Program':this.content.access&&this.content.access.reason==='REDEEMED'?'Unlocked':this.tier==='featured'?'Unlock · '+this.redemptionCredits+' Credits':this.tier==='premium'?'Included with Premium':'Free'}},
  methods:{dispatch(event){if(event.target.closest('.sf-message-composer,.sf-insight-card'))return;if(['home','workout','course','plan','program'].includes(this.screen))return;const target=event.target.closest('[data-action]');if(target){event.preventDefault();this.$emit('action',target.dataset.action)}},dispatchSpace(event){if(event.target.matches('[role="button"]'))this.dispatch(event)}}
}
</script>
