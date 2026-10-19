<template>
  <sf-page-layout class="movement-detail" title="Workout Details" extended @back="$emit('exit')">
    <div class="movement-detail__hero"><video :src="media(training.steps[0])" :poster="poster(training.steps[0])" autoplay muted loop playsinline aria-label="Workout preview"/></div>
    <div class="movement-detail__intro"><h1>{{ content.name }}</h1><p>{{ content.durationMinutes }} min <span>·</span> {{ training.steps.length }} movements</p><span v-if="training.vision.supported" class="movement-detail__vision"><training-icon name="scan" :size="16"/>Vision recognition available</span></div>
    <p v-if="content.description&&!content.sample" class="movement-detail__description">{{ content.description }}</p>
    <section v-for="group in groups" :key="group.phase" class="movement-detail__section"><h2>{{ group.name }} <span>{{ group.steps.length }} movements</span></h2><ol><template v-for="(step,i) in group.steps"><li :key="'move-'+i" class="movement-detail__step"><img :src="poster(step)" alt=""/><strong>{{ exercise(step).name }}</strong><span>{{ step.target }} {{ step.kind==='time'?'sec':'reps' }}</span></li><li v-if="step.restSeconds>0&&training.steps.indexOf(step)<training.steps.length-1" :key="'rest-'+i" class="movement-detail__rest"><span>Rest</span><b>{{ step.restSeconds }} sec</b></li></template></ol></section>
    <template #footer><sf-button block @click="$emit('prepare')">Get Ready</sf-button></template>
  </sf-page-layout>
</template>
<script>
import {SfPageLayout,SfButton} from '@/design-system'
import TrainingIcon from './TrainingIcon'
import {exercises} from '../../../config/movement-training.cjs'
export default {components:{SfPageLayout,SfButton,TrainingIcon},props:{content:Object,training:Object,media:Function,poster:Function},computed:{groups(){return[{phase:'warmup',name:'Warm-up'},{phase:'main',name:'Workout'},{phase:'cooldown',name:'Cooldown'}].map(g=>({...g,steps:this.training.steps.filter(s=>s.phase===g.phase)})).filter(g=>g.steps.length)}},methods:{exercise(step){return exercises.find(e=>e.id===step.exerciseId)||{name:'Movement'}}}}
</script>
