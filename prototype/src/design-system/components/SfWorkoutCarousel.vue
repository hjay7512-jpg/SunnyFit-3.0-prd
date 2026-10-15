<template><div class="sf-workout-carousel"><div class="sf-workout-carousel__back"><img :src="backImage" alt="" data-source-asset="true"></div><div class="sf-workout-carousel__front"><img :src="image" alt="" :style="imageStyle" data-source-asset="true"><div class="sf-workout-carousel__caption"><h2>{{ content.name }}</h2><small v-if="content.durationMinutes">{{ content.durationMinutes }} min</small></div><slot name="badge"/><sf-round-action :size="72" :content-id="content.id" :label="'Start '+content.name" :layers="goLayers" @action="$emit('start')"/></div></div></template>
<script>
import SfRoundAction from './SfRoundAction'
export default {name:'SfWorkoutCarousel',components:{SfRoundAction},props:{content:{type:Object,required:true},image:String,backImage:String,imageStyle:Object,goLayers:Array}}
</script>
