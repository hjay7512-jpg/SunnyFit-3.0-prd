<template>
  <div class="coach-plan-tool">
    <button v-if="!noEntry" type="button" class="coach-plan-tool__entry" :disabled="busy" @click="launch"><sf-icon name="calendar" :size="15"/>Dynamic Plan</button>
    <sf-sheet v-model="open" title="Create your Dynamic Plan" contained :resizable="false">
      <div class="coach-plan-form">
        <fieldset><legend>Your goal</legend><div class="coach-plan-form__goals"><button v-for="option in goals" :key="option.value" type="button" :aria-pressed="goal===option.value?'true':'false'" @click="goal=option.value">{{ option.label }}</button></div></fieldset>
        <label>Training days per week<select v-model.number="days"><option v-for="n in [3,4,5]" :key="n" :value="n">{{ n }} days</option></select></label>
        <label>Time per session<select v-model.number="minutes"><option v-for="n in [15,30,45]" :key="n" :value="n">{{ n }} min</option></select></label>
      </div>
      <template #footer><sf-button @click="generate">Create with AI Coach</sf-button></template>
    </sf-sheet>
  </div>
</template>
<script>
import {SfIcon,SfSheet,SfButton} from '@/design-system'
export default {
  components:{SfIcon,SfSheet,SfButton},props:{state:String,busy:Boolean,noEntry:Boolean},
  data(){return {open:false,goal:'fitness',days:4,minutes:30,goals:[{value:'fitness',label:'Build a habit'},{value:'weight-loss',label:'Weight loss'},{value:'strength',label:'Get stronger'}]}},
  methods:{launch(){if(this.state==='plan-active')this.$emit('action','plan');else if(this.state==='plan-preview')this.$emit('review');else this.open=true},generate(){this.open=false;this.$emit('generate',{goal:this.goal,days:this.days,minutes:this.minutes})},openSetup(){this.open=true}}
}
</script>
<style scoped>
.coach-plan-tool{align-self:flex-start}.coach-plan-tool__entry{display:flex;align-items:center;gap:6px;padding:8px 12px;min-height:36px;position:relative;border:1px solid var(--sf-content-edge);border-radius:20px;background:var(--sf-content-surface);color:var(--sf-text-secondary);font:500 12px var(--sf-font-family);cursor:pointer}.coach-plan-tool__entry:disabled{opacity:.45;cursor:default}.coach-plan-tool__entry::before{content:'';position:absolute;inset:-4px 0}.coach-plan-form{display:grid;gap:24px}.coach-plan-form fieldset{padding:0;border:0;min-width:0;margin:0}.coach-plan-form legend,.coach-plan-form>label{font-size:13px;font-weight:600;line-height:20px}.coach-plan-form__goals{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.coach-plan-form__goals button{font:500 12px var(--sf-font-family);border:1px solid var(--sf-content-edge);background:var(--sf-page);border-radius:12px;color:var(--sf-text-secondary);min-height:44px;padding:9px 12px;cursor:pointer}.coach-plan-form__goals button[aria-pressed=true]{background:#fff0ee;border-color:#f7b7ae;color:var(--sf-action)}.coach-plan-form>label{display:grid;gap:8px}.coach-plan-form select{width:100%;min-height:48px;border-radius:12px;padding:10px 12px;border:1px solid var(--sf-content-edge);background:var(--sf-page);font:400 14px var(--sf-font-family);color:var(--sf-text)}
</style>
