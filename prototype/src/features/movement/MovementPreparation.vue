<template>
  <sf-page-layout class="movement-preparation" title="Prepare" extended @back="$emit('exit')">
    <div class="movement-preparation__preview movement-hero" data-source-node="36:5886">
      <video :src="media(previewStep)" :poster="poster(previewStep)" autoplay muted loop playsinline aria-label="Movement demonstration"/>
    </div>
    <div class="movement-preparation__name"><h1>{{ content.name }}</h1><p>{{ content.durationMinutes }} min · {{ training.steps.length }} movements</p></div>
    <button class="movement-preparation__heart-rate" type="button" aria-label="Heart Rate" @click="heartRateOpen=true"><img :src="heartRateIcon" width="28" height="28" alt=""/><span>Heart Rate</span><b aria-hidden="true">+</b></button>
    <template #footer>
      <div class="movement-preparation__start-area">
        <div class="movement-preparation__actions">
          <button class="movement-preparation__start" type="button" aria-label="Start follow along" :disabled="busy" @click="$emit('start','regular')"><span><training-icon name="play" :size="28"/></span><strong>Follow Along</strong></button>
          <button v-if="training.vision.supported" class="movement-preparation__start movement-preparation__start--vision" type="button" aria-label="Start vision recognition" :disabled="!visionAvailable||busy" :aria-describedby="!visionAvailable?'movement-device-reason':null" @click="$emit('start','vision')"><span><training-icon name="scan" :size="29"/></span><strong>Vision Recognition</strong></button>
        </div>
        <p v-if="training.vision.supported&&!visionAvailable" id="movement-device-reason" class="movement-device-note" role="status">Vision Recognition unavailable on this device.</p>
      </div>
    </template>
    <sf-sheet :open="heartRateOpen" title="Heart Rate" contained @close="heartRateOpen=false" @input="heartRateOpen=$event"><p class="movement-heart-rate-status">Pairing is unavailable in this preview.</p><template #footer><sf-button block @click="heartRateOpen=false">Done</sf-button></template></sf-sheet>
  </sf-page-layout>
</template>
<script>
import {SfPageLayout,SfSheet,SfButton} from '@/design-system'
import TrainingIcon from './TrainingIcon'
export default {
  components:{SfPageLayout,SfSheet,SfButton,TrainingIcon},props:{content:Object,training:Object,visionAvailable:Boolean,media:Function,poster:Function,busy:Boolean},data(){return{heartRateOpen:false,heartRateIcon:process.env.BASE_URL+'assets/movement/heart-rate.svg'}},
  computed:{previewStep(){return this.training.steps[0]}}
}
</script>
