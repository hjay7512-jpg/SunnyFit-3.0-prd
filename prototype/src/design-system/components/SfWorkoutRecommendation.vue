<template>
  <div class="sf-workout-recommendation v3-home__recommendation">
    <div class="sf-workout-recommendation__intro v3-home__intro"><sf-ai-ball fit :size="48" state="idle" decorative/><p>{{ introduction }}</p></div>
    <sf-course-card :title="course.title" :duration="course.duration" :level="course.level" :image="course.image" :image-style="course.imageStyle"><template v-if="$slots.badge" #badge><slot name="badge"/></template></sf-course-card>
    <sf-button data-action="start-course" :disabled="disabled" @click.stop="$emit('action','start-course')">Start Now</sf-button>
    <div class="sf-workout-recommendation__quick-actions v3-home__quick-actions"><button v-for="item in quickActions" :key="item.id" type="button" :data-action="item.id" :disabled="disabled||item.disabled" @click.stop="$emit('action',item.id)"><span v-if="item.emoji" aria-hidden="true">{{ item.emoji }}</span>{{ item.label }}</button></div>
  </div>
</template>
<script>
import SfAiBall from './SfAiBall'
import SfCourseCard from './SfCourseCard'
import SfButton from './SfButton'
export default {name:'SfWorkoutRecommendation',components:{SfAiBall,SfCourseCard,SfButton},props:{course:{type:Object,required:true},introduction:{type:String,default:'80% users start their fat-burn journey here. give it a try!'},disabled:Boolean,quickActions:{type:Array,default:()=>[{id:'existing-recommendation-change',label:'Change',emoji:'🔄'},{id:'existing-running-20',label:'20-min Running',emoji:'💪'},{id:'existing-running-10',label:'10-min Running',emoji:'💪'}]}}}
</script>
