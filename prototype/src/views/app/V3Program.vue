<template>
  <div class="v3-program v3-screen" data-reference-node-id="2816:29683">
    <sf-page-layout title="Training Program" :ambient="false" @back="$emit('action','back')">
      <sf-segmented-control :value="panel" :items="panels" label="Program details" @change="selectPanel"/>
      <div class="v3-program__cover">
        <img :src="content.coverUrl||asset('program-cover')" alt=""/>
        <span v-if="accessLabel" class="commerce-content-label">{{ accessLabel }}</span>
      </div>
      <section v-if="panel==='Details'" class="v3-program__details" role="tabpanel" aria-label="Details">
        <div class="v3-program__identity"><h1>{{ content.name }}</h1><p>{{ content.description }}</p></div>
        <sf-card class="v3-program__attributes">
          <dl><div v-for="metric in metrics" :key="metric.label"><dt>{{ metric.label }}</dt><dd>{{ metric.value }}</dd></div></dl>
        </sf-card>
        <section v-if="content.trainers&&content.trainers.length" class="v3-program__trainers">
          <sf-section-title>Trainers</sf-section-title>
          <sf-card><div v-for="trainer in content.trainers" :key="trainer.name" class="v3-program__trainer"><sf-avatar :name="trainer.name" :src="trainer.avatarUrl" :size="44"/><span>{{ trainer.name }}</span></div></sf-card>
        </section>
        <sf-feedback v-if="!members.length" tone="empty" title="No workouts available"/>
      </section>
      <section v-if="panel==='Schedule'" class="v3-program__members" role="tabpanel" aria-label="Schedule">
        <sf-section-title>Program Workouts</sf-section-title>
        <sf-menu-row v-for="(course,index) in members" :key="course.id" :data-action="'open-course:'+course.id" :label="course.name" :description="'Workout '+(index+1)+' · '+course.durationMinutes+' min'" :class="{'is-current':workout&&workout.id===course.id}" @click="$emit('action','open-course:'+course.id)"/>
        <sf-feedback v-if="!members.length" tone="empty" title="No workouts available"/>
      </section>
      <template #footer><sf-button v-copy-block="startLabel&&startLabel!=='Select Program'?'entry-training_program':null" data-action="start-program" :data-content-id="content.id" @click.stop="$emit('action','start-program')">{{ startLabel||'Select Program' }}</sf-button></template>
    </sf-page-layout>
  </div>
</template>
<script>
import {SfPageLayout,SfButton,SfFeedback,SfSegmentedControl,SfCard,SfSectionTitle,SfMenuRow,SfAvatar} from '@/design-system'
export default {
  name:'V3Program',components:{SfPageLayout,SfButton,SfFeedback,SfSegmentedControl,SfCard,SfSectionTitle,SfMenuRow,SfAvatar},
  props:{content:{type:Object,required:true},workout:Object,nextWorkout:Object,courses:{type:Array,default:()=>[]},accessLabel:String,startLabel:String,panelState:String},
  data(){return {panel:this.panelState==='schedule'?'Schedule':'Details',panels:[{value:'Details',label:'Details'},{value:'Schedule',label:'Schedule'}]}},
  watch:{panelState(value){this.panel=value==='schedule'?'Schedule':'Details'}},
  computed:{
    members(){return (this.content.membersPreview||[]).map(member=>this.courses.find(course=>course.id===member.id)).filter(Boolean)},
    metrics(){return [{label:'Total Courses',value:this.members.length},{label:'Program Length',value:this.content.durationWeeks?this.content.durationWeeks+' '+(this.content.durationWeeks===1?'week':'weeks'):'—'},{label:'Workout Goal',value:this.content.workoutGoal||'—'},{label:'Intensity',value:this.content.intensity||'—'},{label:'Target Area',value:this.content.targetArea||'—'}]}
  },
  methods:{asset(name){return process.env.BASE_URL+'assets/figma/content-review/'+name+'.png'},selectPanel(value){this.panel=value;this.$emit('panel-change',value.toLowerCase())}}
}
</script>
<style scoped>
.v3-program__cover{aspect-ratio:375/249;position:relative;flex-shrink:0;overflow:hidden;border-radius:var(--sf-radius-card);background:var(--sf-content-surface)}
.v3-program__cover>img{width:100%;height:auto;display:block}
.v3-program__cover .commerce-content-label{top:12px;right:12px;left:auto}
.v3-program__details{display:flex;flex-direction:column;gap:24px}
.v3-program__identity h1{font-size:calc(24px * var(--sf-scale));line-height:1.35;font-weight:590;color:var(--sf-text);margin:0}
.v3-program__identity p{font-size:calc(14px * var(--sf-scale));line-height:1.6;color:var(--sf-text-secondary);margin:8px 0 0}
.v3-program__attributes dl{margin:0}
.v3-program__attributes dl>div{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:16px;align-items:start;padding:14px 0;border-bottom:1px solid var(--sf-border)}
.v3-program__attributes dl>div:first-child{padding-top:0}.v3-program__attributes dl>div:last-child{padding-bottom:0;border-bottom:0}
.v3-program__attributes dt{font-size:calc(14px * var(--sf-scale));line-height:1.5;color:var(--sf-text-secondary)}
.v3-program__attributes dd{margin:0;font-size:calc(16px * var(--sf-scale));line-height:1.4;font-weight:500;color:var(--sf-text);overflow-wrap:anywhere}
.v3-program__trainers{display:flex;flex-direction:column;gap:12px}
.v3-program__trainer{display:flex;align-items:center;gap:12px;font-size:calc(16px * var(--sf-scale));color:var(--sf-text);padding:8px 0}
.v3-program__trainer:first-child{padding-top:0}.v3-program__trainer:last-child{padding-bottom:0}
.v3-program__members{display:flex;flex-direction:column;gap:12px}
.v3-program__members .is-current{border-color:var(--sf-action)}
</style>
