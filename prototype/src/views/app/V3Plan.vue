<template>
  <div class="v3-plan v3-screen" :class="{'v3-plan--paused':isPaused}" :data-node-id="referenceState.nodeId" :data-plan-state="effectiveState" :data-reference="reference">
    <sf-page-layout :asset="asset" :status-asset="asset('imgRightSide')" :glass="false" @back="$emit('action','back')">
      <template #back-icon><img class="v3-plan__back-icon" :src="asset('imgGroup257')" alt="" data-source-asset="true"></template>
      <template #trailing><button type="button" class="sf-icon-button sf-icon-button--compact v3-plan__more" aria-label="Plan actions" @click="actions=true"><sf-icon name="more"/></button></template>
      <section class="v3-plan__identity"><h1>{{ displayTitle }}</h1><div class="v3-plan__facts"><span><span class="v3-plan__fact-icon"><img :src="asset('img')" alt="" data-source-asset="true"></span>{{ displayGoal }}</span><span><span class="v3-plan__fact-icon"><img :src="asset('imgGroup259')" alt="" data-source-asset="true"></span>3 Stages</span><span><span class="v3-plan__fact-icon"><img :src="asset('img1')" alt="" data-source-asset="true"></span>{{ !reference&&plan?plan.days:4 }} Days / wk</span></div><div class="v3-plan__tags"><span v-for="tag in displayTags" :key="tag">{{ tag }}</span></div></section>
      <sf-stage-card :stage-number="reference?2:1" :stage-label="isPaused?'Stage I':null" :title="!reference&&plan?plan.stages[0].name:'Awakening'" :day-label="isPaused?'Paused':!reference&&plan?'Day 1':'Day 4'" :paused="isPaused" :description="!reference&&plan?plan.stages[0].focus:'Develop simple exercise habits, starting with light aerobic exercise and flexibility training.'" :stages="reference?['Awakening','Lgnition','Shift']:plan?plan.stages.map(stage=>stage.name):['Awakening','Ignition','Shift']" :progress="reference?58/90*100:plan?0:55" :marker-progress="reference?(isPaused?45.5/90*100:48.5/90*100):null" :detail="isPaused?'':!reference&&plan?plan.days+' training days each week':'Current stage expected in ~12 days'" :divider="asset('imgVector70')" :marker="asset('imgEllipse202')"/>
      <sf-coach-workout-card v-if="isPaused" class="v3-plan__paused-coach" compact-copy :message="coachMessage"/>
      <section v-else class="v3-plan__forecast"><h2>Next 5 Days</h2><p class="v3-plan__hint">Tap a day to preview its training theme</p><sf-day-strip v-model="selectedDay" :days="days"/>
        <sf-coach-workout-card :message="coachMessage" :courses="suggestedCourses" :go-layers="goLayers" @open-course="$emit('action','open-course:'+$event)" @start-course="$emit('action','start-course:'+$event)"><div v-if="isRecovery" class="v3-plan__recovery-actions"><sf-button appearance="glass" :block="false" data-action="workout" @click.stop="$emit('action','workout')">↪ Change</sf-button><sf-button appearance="glass" :block="false" data-action="workout" @click.stop="$emit('action','workout')">💪 20-min Running</sf-button></div></sf-coach-workout-card>
      </section>
    </sf-page-layout>
    <sf-sheet v-model="actions" title="Plan actions" contained :resizable="false"><sf-menu-row label="Adjust today" description="Discuss a change with AI Coach" @click="planAction('adjust-plan')"/><sf-menu-row label="Courses" description="Choose a course" @click="planAction('workout')"/><sf-menu-row label="Movements" description="Choose a movement" @click="planAction('movement-picker')"/></sf-sheet>
  </div>
</template>
<script>
import {SfPageLayout,SfStageCard,SfDayStrip,SfCoachWorkoutCard,SfIcon,SfSheet,SfMenuRow,SfButton} from '@/design-system'
import {sceneAsset} from '@/design-system/assets/v3-scenes'
import {planReferenceStates} from '@/design-system/assets/plan-states'
export default {
  name:'V3Plan',components:{SfPageLayout,SfStageCard,SfDayStrip,SfCoachWorkoutCard,SfIcon,SfSheet,SfMenuRow,SfButton},
  props:{plan:Object,content:Object,courses:{type:Array,default:()=>[]},state:{type:String,default:'training',validator:value=>Object.keys(planReferenceStates).includes(value)},reference:Boolean},
  data(){return {selectedDay:this.reference?(planReferenceStates[this.state]||planReferenceStates.training).selectedDay:0,actions:false,title:'Muscles Targeted, Exercises & Tips',tags:['Beginner','Intermediate','Advanced','Knee-Friendly','Treadmill']}},
  computed:{
    displayTitle(){return !this.reference&&this.plan?this.plan.title:this.title},
    displayGoal(){return !this.reference&&this.plan?this.plan.goalLabel:'Weight Loss'},
    displayTags(){return !this.reference&&this.plan?['Beginner',this.plan.minutes+' min / session']:this.tags},
    // No pause/resume API exists. A paused fixture can only be shown in the workbench.
    effectiveState(){return this.state==='paused'&&!this.reference?'training':planReferenceStates[this.state]?this.state:'training'},
    referenceState(){return planReferenceStates[this.effectiveState]},
    isPaused(){return this.effectiveState==='paused'},
    isRecovery(){return this.days[this.selectedDay].theme==='Recovery'},
    days(){
      const labels=['Today','Fri','Sat','Sun','Mon'],icons=this.effectiveState==='completed'?['img2','imgFrame2147204220','imgFrame','imgFrame2147204221','imgFrame2147204222']:this.effectiveState==='recovery'?['imgFrame','imgFrame2147204221','imgFrame2147204220','imgFrame2147204222','imgFrame2147204223']:['imgFrame2147204220','imgFrame2147204221','imgFrame','imgFrame2147204222','imgFrame2147204223'];
      return labels.map((label,i)=>{const recovery=i===2||(this.effectiveState==='recovery'&&i===0);return {value:i,label:this.reference?label:i===0?'Today':new Date(Date.now()+i*86400000).toLocaleDateString('en-US',{weekday:'short'}),theme:recovery?'Recovery':i===3?'Cardio':'Strength',icon:this.asset(icons[i]),selectedIcon:this.effectiveState==='completed'&&i===0?this.asset('img2'):this.reference&&this.effectiveState==='recovery'&&i===2?this.asset('imgFrame2147204220'):recovery?this.asset('imgFrame'):this.effectiveState==='completed'?sceneAsset('plan-training',i===3?'imgFrame2147204222':'imgFrame2147204220'):this.asset(i===3?'imgFrame2147204222':'imgFrame2147204220')}})
    },
    goLayers(){const scene=this.effectiveState==='completed'?'plan-completed':'plan-training';return [sceneAsset(scene,'imgEllipse312'),sceneAsset(scene,'imgEllipse313')]},
    suggestedCourses(){
      if(this.isRecovery||this.isPaused)return [];
      const list=this.effectiveState==='completed'?this.courses.slice(0,3):[this.content],scene=this.effectiveState==='completed'?'plan-completed':'plan-training';
      const names=['Full Body Fat Burning orkout Pro...muscles','Reformer Pilates Explained','15-Minute Barbell Strength'],durations=[12,20,15];
      return list.filter(Boolean).map((course,i)=>({...course,name:this.reference?names[i]:course.name,image:course.coverUrl||sceneAsset(scene,['imgRectangle1505','imgRectangle1506','imgRectangle1507'][i]||'imgRectangle1505'),durationMinutes:this.reference?durations[i]:course.durationMinutes||12}))
    },
    coachMessage(){
      if(this.reference&&this.selectedDay===this.referenceState.selectedDay)return this.referenceState.message;
      if(this.isRecovery)return 'A day to recover with light aerobic exercise and flexibility. Preview another day or choose a workout when you are ready.';
      return 'Suggested workout for '+(this.selectedDay===0?'today':this.days[this.selectedDay].label)+': '+(this.content&&this.content.name||'your selected course')+' ('+(this.content&&this.content.durationMinutes||12)+' min). Keep the effort controlled and focus on smooth, repeatable movement.'
    }
  },
  methods:{asset(name){return sceneAsset(this.referenceState.scene,name)},planAction(action){this.actions=false;this.$emit('action',action)}}
}
</script>
