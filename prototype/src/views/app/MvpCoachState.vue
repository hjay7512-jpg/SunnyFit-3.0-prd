<template>
  <div class="mvp-coach-state">
    <div v-if="!hideReply&&(replyState||state)==='thinking'" class="mvp-coach-thinking" role="status">AI Coach is preparing your reply<span aria-hidden="true">•••</span></div>
    <section v-if="plan&&['plan-preview','plan-active','plan-superseded'].includes(state)" class="mvp-dynamic-preview" :class="{'mvp-dynamic-preview--active':state==='plan-active','mvp-dynamic-preview--previous':state==='plan-superseded'}" :data-plan-id="plan.id">
      <p v-if="state==='plan-preview'" class="dynamic-plan-intro">{{ plan.summary }}</p>
      <div class="dynamic-plan-overview">
        <header class="dynamic-plan-heading"><h3>{{ plan.title }}</h3><span v-if="state==='plan-active'" class="dynamic-plan-status"><sf-icon name="check" :size="12"/>Active</span><span v-else-if="state==='plan-superseded'" class="dynamic-plan-status dynamic-plan-status--muted">Earlier plan</span></header>
        <div class="dynamic-plan-facts"><span><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2.5"/><path d="m9 7 5-5m-3 0h3v3"/></svg>{{ plan.goalLabel }}</span><span><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m2 5 6-3 6 3-6 3-6-3Zm0 3 6 3 6-3M2 11l6 3 6-3"/></svg>3 Stages</span><span><sf-icon name="calendar" :size="14"/>{{ plan.days }} days / wk</span></div>
        <plan-journey-chart v-if="state==='plan-preview'" :stages="plan.stages"/>
        <div v-else-if="state==='plan-active'" class="dynamic-plan-active-stage"><span>Stage 1 · {{ plan.stages[0].name }}</span><small>{{ plan.minutes }} min / session</small></div>
      </div>
      <sf-button v-if="state!=='plan-superseded'" appearance="glass" @click="state==='plan-active'?$emit('action','plan'):openPreview()">{{ state==='plan-active'?'View Plan':'Preview plan' }}<sf-icon name="arrow" :size="16"/></sf-button>
      <p v-else class="dynamic-plan-earlier">A newer plan is available in this conversation.</p>
    </section>


  </div>
</template>
<script>
import {SfIcon,SfButton} from '@/design-system'
import PlanJourneyChart from './PlanJourneyChart'
export default {
  components:{SfIcon,SfButton,PlanJourneyChart},props:{hideReply:Boolean,state:String,replyState:String,member:Object,plan:Object},
  methods:{openPreview(){if(this.state==='plan-preview')this.$emit('preview',this.plan)}}
}
</script>
<style scoped>
.mvp-coach-state{display:grid;gap:12px;min-width:0}.mvp-coach-thinking{padding:18px;border-radius:16px;background:var(--sf-content-surface);font-size:13px;line-height:1.6}.mvp-coach-thinking>span{display:block;letter-spacing:5px;color:var(--sf-action);margin-top:8px}.mvp-dynamic-preview{padding:12px;border:1px solid var(--sf-content-edge);border-radius:17px;background:var(--sf-content-surface);box-shadow:var(--sf-content-shadow)}.dynamic-plan-intro{font-size:14px;line-height:21px;margin:0 1px 12px;color:var(--sf-text)}.dynamic-plan-overview{background:#f3f7fd;border-radius:11px;padding:12px 8px 0}.dynamic-plan-heading{display:flex;align-items:flex-start;gap:8px}.dynamic-plan-heading h3{margin:0;flex:1;min-width:0;font-size:16px;line-height:23px;letter-spacing:-.2px;font-weight:600}.dynamic-plan-facts{display:flex;align-items:center;flex-wrap:wrap;gap:7px 12px;margin-top:10px;color:var(--sf-text-secondary)}.dynamic-plan-facts>span{display:flex;align-items:center;gap:4px;font-size:12px;line-height:18px;white-space:nowrap}.dynamic-plan-facts>span>svg{width:14px;height:14px;flex:none;stroke:currentColor;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}.mvp-dynamic-preview .sf-button{display:flex;align-items:center;justify-content:center;gap:6px;color:var(--sf-text);font:500 14px/22px var(--sf-font-family);margin-top:10px;min-height:46px;padding:10px 14px;border-radius:13px}.mvp-dynamic-preview .sf-button .sf-icon{color:var(--sf-text-secondary)}.dynamic-plan-status{display:flex;align-items:center;gap:3px;border-radius:6px;padding:3px 5px;background:#eaf4ed;color:#3a7450;font-size:10px;line-height:15px;white-space:nowrap}.dynamic-plan-status--muted{color:var(--sf-text-secondary);background:#eceff4}.mvp-dynamic-preview--active .dynamic-plan-overview,.mvp-dynamic-preview--previous .dynamic-plan-overview{padding:3px 2px;background:transparent}.dynamic-plan-active-stage{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid var(--sf-content-edge)}.dynamic-plan-active-stage>span{font-size:12px;line-height:18px;font-weight:500}.dynamic-plan-active-stage>small{font-size:11px;color:var(--sf-text-secondary)}.dynamic-plan-earlier{font-size:11px;line-height:18px;margin:12px 2px 0;color:var(--sf-text-secondary)}
</style>
