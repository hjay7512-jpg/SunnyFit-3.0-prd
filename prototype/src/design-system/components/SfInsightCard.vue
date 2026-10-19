<template>
  <sf-card class="sf-insight-card" :aria-busy="busy?'true':null">
    <template #header><div class="sf-insight-card__heading"><img src="/assets/figma/restored/orbs/insight.png" width="34" height="34" alt=""/><div><h2>Coach Insight</h2><p v-if="rpe!==null" class="sf-insight-card__rpe">RPE : {{ rpe }} / 10<img src="/assets/figma/restored/result_child_9-1517/img.svg" alt="Rating of perceived exertion"/></p></div></div></template>
    <p v-if="saved" class="saved-insight-body sf-insight-card__body">{{ body }}</p>
    <p v-else class="insight-new-copy sf-insight-card__body" :role="state==='insight-loading'?'status':undefined">{{ state==='insight-loading'?'Preparing your workout insight…':state==='insight-error'?'Your insight couldn’t be loaded. Your workout results are still here.':locked?'Look beyond the numbers with a Premium insight on this session. Your workout results stay free.':'Reflect on this session with AI Coach. Included with Premium, without using conversation allowance.' }}</p>
    <template #footer>
      <sf-button v-if="saved" appearance="glass" compact :block="false" :disabled="busy" @click="$emit('ask')"><img src="/assets/figma/restored/result_child_9-1517/imgFrame.svg" alt=""/>Ask Coach</sf-button>
      <sf-button v-else class="insight-generate" appearance="glass" :disabled="busy" @click="$emit('generate')">{{ state==='insight-loading'?'Preparing insight…':state==='insight-error'?'Try again':locked?'Explore Premium':'Generate Insight' }}<span v-if="chargeLabel"> · {{ chargeLabel }}</span></sf-button>
      <sf-button v-if="saved&&chargeLabel&&!locked" class="regenerate-insight" appearance="text" :disabled="busy" @click="$emit('generate')">Generate new insight · {{ chargeLabel }}</sf-button>
    </template>
  </sf-card>
</template>
<script>
import SfCard from './SfCard'
import SfButton from './SfButton'
// Existing result card assets/structure; formal V3 full-page migration is pending resource access.
export default {name:'SfInsightCard',components:{SfCard,SfButton},props:{body:{type:String,default:''},saved:Boolean,busy:Boolean,locked:Boolean,state:String,rpe:{type:Number,default:null},chargeLabel:{type:String,default:''}}}
</script>
