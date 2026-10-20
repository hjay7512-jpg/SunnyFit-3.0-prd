<template>
  <div class="mvp-coach-state">
    <div v-if="!hideReply&&(replyState||state)==='thinking'" class="mvp-coach-thinking" role="status">AI Coach is preparing your reply<span aria-hidden="true">•••</span></div>
    <section v-if="['plan-preview','plan-active'].includes(state)" class="mvp-dynamic-preview">
      <div class="dynamic-plan-label"><sf-icon name="calendar" :size="16"/><span>{{ state==='plan-active'?'Plan activated':'Your Dynamic Plan' }}</span><sf-icon v-if="state==='plan-active'" name="check" :size="16"/></div>
      <h3>{{ planTitle }}</h3>
      <div class="dynamic-plan-facts"><span>{{ goalLabel }}</span><span>3 stages</span><span>{{ plan.days||4 }} days / wk</span></div>
      <plan-journey-chart/>
      <sf-button appearance="glass" @click="state==='plan-active'?$emit('action','plan'):openPreview()">{{ state==='plan-active'?'View Plan':'Review plan' }}</sf-button>
    </section>
    <sf-sheet v-model="previewOpen" title="Your Dynamic Plan" contained :resizable="false">
      <div class="dynamic-plan-detail"><h3>{{ planTitle }}</h3><p>{{ plan.days||4 }} days a week · {{ plan.minutes||30 }} min per session</p><plan-journey-chart/><dl><div><dt>Awakening</dt><dd>Build your routine with approachable sessions.</dd></div><div><dt>Ignition</dt><dd>Progress your training as your routine settles.</dd></div><div><dt>Metabolic Shift</dt><dd>Keep adapting your sessions with AI Coach.</dd></div></dl></div>
      <template #footer><sf-button @click="activate">Activate Plan</sf-button><p class="dynamic-plan-access">{{ member.active?'Included with Premium':'Activate with Premium' }}</p></template>
    </sf-sheet>
  </div>
</template>
<script>
import {SfIcon,SfButton,SfSheet} from '@/design-system'
import PlanJourneyChart from './PlanJourneyChart'
export default {
  components:{SfIcon,SfButton,SfSheet,PlanJourneyChart},props:{hideReply:Boolean,state:String,replyState:String,member:Object,plan:{type:Object,default:()=>({})}},
  data(){return {previewOpen:false}},computed:{goalLabel(){return {'weight-loss':'Weight loss',strength:'Strength',fitness:'Fitness'}[this.plan.goal]||'Weight loss'},planTitle(){return {fitness:'Build a lasting routine',strength:'Build strength, step by step','weight-loss':'Your path to a stronger you'}[this.plan.goal]||'Muscles Targeted, Exercises & Tips'}},
  methods:{openPreview(){this.previewOpen=true},activate(){this.previewOpen=false;this.$emit('action','activate-plan')}}
}
</script>
<style scoped>
.mvp-coach-state{display:grid;gap:12px;margin-bottom:18px}.mvp-coach-thinking{padding:20px;border-radius:18px;background:var(--sf-content-surface);font-size:13px;line-height:1.6}.mvp-coach-thinking>span{display:block;letter-spacing:5px;color:var(--sf-action);margin-top:8px}.mvp-dynamic-preview{padding:16px;background:var(--sf-content-surface);border:1px solid var(--sf-content-edge);border-radius:20px;box-shadow:var(--sf-content-shadow)}.dynamic-plan-label{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--sf-text-secondary)}.dynamic-plan-label>svg:last-child{margin-left:auto;color:var(--sf-action)}.mvp-dynamic-preview h3{font-size:17px;line-height:24px;margin:12px 0 8px;letter-spacing:-.3px}.dynamic-plan-facts{display:flex;gap:9px;flex-wrap:wrap;font-size:10px;line-height:16px;color:var(--sf-text-secondary)}.dynamic-plan-facts span+span{border-left:1px solid var(--sf-content-edge);padding-left:9px}.mvp-dynamic-preview .sf-button{color:var(--sf-text);margin-top:14px;min-height:44px;font-size:14px}.dynamic-plan-detail h3{font-size:21px;line-height:28px;margin:0 0 8px}.dynamic-plan-detail p{font-size:13px;color:var(--sf-text-secondary);margin:0}.dynamic-plan-detail dl{margin:20px 0 0}.dynamic-plan-detail dl>div{padding:12px 0;border-bottom:1px solid var(--sf-content-edge)}.dynamic-plan-detail dt{font-size:13px;font-weight:600}.dynamic-plan-detail dd{font-size:12px;line-height:19px;margin:5px 0 0;color:var(--sf-text-secondary)}.dynamic-plan-detail dl>div:last-child{border:0}.dynamic-plan-access{margin:8px 0 0;text-align:center;font-size:11px;line-height:17px;color:var(--sf-text-secondary)}.mvp-coach-state:empty{display:none}
</style>
