<template>
  <div class="v3-program v3-screen" data-reference-node-id="7618:8832"><sf-page-layout title="Training Program" @back="$emit('action','back')">
    <section class="v3-program__identity"><h1>{{ content.name }}</h1><p>{{ content.description }}</p><span v-if="accessLabel" class="v3-program__access commerce-content-label">{{ accessLabel }}</span></section>
    <mvp-access-note :content="content" @action="$emit('action',$event)"/>
    <sf-plan-card title="Training Program" :arrow="homeAsset('img')" progress-text="—" progress-caption="Progress" progress-label="Training progress is not recorded in this preview" :details="[{label:'Workouts',value:String(members.length)},{label:'Completed',value:'—'}]" action="program-workouts" @action="scrollToWorkouts"><template #progress><img :src="progressAsset" alt="" data-source-asset="true"></template></sf-plan-card>
    <section v-if="workout" class="v3-program__current"><sf-section-title>Current Workout</sf-section-title><sf-course-card :title="workout.name" :duration="workout.durationMinutes+' min'" :image="workout.coverUrl||homeAsset('img1')"/><sf-button data-action="start-program" @click.stop="$emit('action','start-program')">Start</sf-button><sf-button v-if="nextWorkout" appearance="glass" data-action="program-next" @click.stop="$emit('action','program-next')">Next Workout · {{ nextWorkout.name }}</sf-button></section>
    <section ref="workouts" class="v3-program__members"><sf-section-title>Program Workouts</sf-section-title><sf-menu-row v-for="course in members" :key="course.id" :label="course.name" :description="course.durationMinutes+' min'" @click="$emit('action','open-course:'+course.id)"/><sf-feedback v-if="!members.length" tone="empty" title="No workouts available"/></section>
  </sf-page-layout></div>
</template>
<script>
import {SfPageLayout,SfPlanCard,SfCourseCard,SfButton,SfSectionTitle,SfMenuRow,SfFeedback} from '@/design-system'
import {homeAsset} from '@/design-system/assets/v3-home'
import MvpAccessNote from './MvpAccessNote'
import progress from '../../../public/assets/figma/v3/home-course-plan/manifest.json'
export default {name:'V3Program',components:{MvpAccessNote,SfPageLayout,SfPlanCard,SfCourseCard,SfButton,SfSectionTitle,SfMenuRow,SfFeedback},props:{content:{type:Object,required:true},workout:Object,nextWorkout:Object,courses:{type:Array,default:()=>[]},accessLabel:String},computed:{members(){return (this.content.membersPreview||[]).map(m=>this.courses.find(c=>c.id===m.id)).filter(Boolean)},progressAsset(){return '/assets/figma/v3/home-course-plan/'+progress.img8.file}},methods:{homeAsset,scrollToWorkouts(){this.$refs.workouts.scrollIntoView({block:'start'})}}}
</script>
