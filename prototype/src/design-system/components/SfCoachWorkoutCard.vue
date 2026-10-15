<template><section class="sf-coach-workout-card" :class="{'sf-coach-workout-card--compact-copy':compactCopy}"><h3><sf-ai-ball :size="24" fit state="idle" decorative/>From Coach</h3><p>{{ message }}</p><div v-for="course in courses" :key="course.id" class="sf-coach-workout-card__course"><button type="button" class="sf-coach-workout-card__detail" :data-action="'open-course:'+course.id" :aria-label="'View '+course.name" @click.stop="$emit('open-course',course.id)"><img :src="course.image" alt="" :data-source-asset="course.image&&course.image.startsWith('/assets/figma/')?'true':null"><span><strong>{{ course.name }}</strong><small>Course | {{ course.durationMinutes }} min</small></span></button><sf-round-action :content-id="course.id" :label="'Start '+course.name" :layers="goLayers" @action="$emit('start-course',course.id)"/></div><slot/></section></template>
<script>
import SfAiBall from './SfAiBall'
import SfRoundAction from './SfRoundAction'
export default {name:'SfCoachWorkoutCard',components:{SfAiBall,SfRoundAction},props:{message:String,courses:{type:Array,default:()=>[]},goLayers:Array,compactCopy:Boolean}}
</script>
