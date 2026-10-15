<template>
  <section class="sf-stage-card" :class="{'sf-stage-card--paused':paused}" aria-label="Current stage">
    <header><div><p>{{ stageLabel || 'Stage '+stageNumber }}</p><h2>{{ title }}</h2></div><strong>{{ dayLabel }}</strong></header>
    <p class="sf-stage-card__description">{{ description }}</p>
    <ol :aria-label="'Stage '+stageNumber+' of '+stages.length">
      <li v-for="(stage,index) in stages" :key="stage" :class="{'is-current':index===stageNumber-1,'is-complete':index<stageNumber-1}">
        <div class="sf-stage-card__track-row"><div class="sf-stage-card__track" aria-hidden="true"><span :style="{width:index<stageNumber-1?'100%':index===stageNumber-1?boundedProgress+'%':'0%'}"></span><img v-if="marker&&index===stageNumber-1" :src="marker" :style="{left:boundedMarker+'%'}" alt="" data-source-asset="true"><i v-else-if="index===stageNumber-1" :style="{left:boundedMarker+'%'}"></i></div></div>
        <span>{{ stage }}</span><img v-if="divider&&index<stages.length-1" :src="divider" alt="" data-source-asset="true">
      </li>
    </ol>
    <p v-if="detail" class="sf-stage-card__detail">{{ detail }}</p>
  </section>
</template>
<script>
export default {name:'SfStageCard',props:{stageNumber:{type:Number,default:1},stageLabel:String,title:String,dayLabel:String,description:String,stages:{type:Array,default:()=>['Awakening','Ignition','Shift']},progress:{type:Number,default:55},markerProgress:{type:Number,default:null},detail:String,divider:String,marker:String,paused:Boolean},computed:{boundedProgress(){return Math.max(0,Math.min(100,this.progress))},boundedMarker(){return Math.max(0,Math.min(100,this.markerProgress===null?this.progress:this.markerProgress))}}}
</script>
</script>
