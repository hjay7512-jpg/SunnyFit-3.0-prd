<template>
  <section class="sf-plan-card" :class="{'sf-plan-card--empty':empty,'sf-plan-card--body-values':valueSize==='body','sf-plan-card--stage':progressCaption==='Stage'}" :aria-label="title">
    <template v-if="empty">
      <img class="sf-plan-card__background" :src="image" alt="" data-source-asset="true">
      <div class="sf-plan-card__empty-content"><h3>{{ title }}</h3><p>{{ description }}</p><sf-button compact :block="false" :data-action="action" @click.stop="$emit('action')">{{ actionLabel }}</sf-button></div>
    </template>
    <template v-else>
      <header><h3>{{ title }}</h3><button type="button" class="sf-plan-card__open" :aria-label="'Open '+title" :data-action="action" @click.stop="$emit('action')"><span><img :src="arrow" alt="" data-source-asset="true"></span></button></header>
      <div class="sf-plan-card__body"><div class="sf-plan-card__ring" role="img" :aria-label="progressLabel"><slot name="progress"/><div class="sf-plan-card__ring-label" aria-hidden="true"><strong>{{ progressText }}</strong><span>{{ progressCaption }}</span></div></div><dl><div v-for="detail in details" :key="detail.label"><dt>{{ detail.label }}</dt><dd>{{ detail.value }}</dd></div></dl></div>
    </template>
  </section>
</template>
<script>
import SfButton from './SfButton'
export default {name:'SfPlanCard',components:{SfButton},props:{empty:Boolean,title:{type:String,required:true},description:String,image:String,action:String,actionLabel:{type:String,default:'Create My Plan'},arrow:String,progressText:String,progressCaption:{type:String,default:'Progress'},progressLabel:{type:String,default:'Plan progress'},valueSize:{type:String,default:'emphasis',validator:v=>['body','emphasis'].includes(v)},details:{type:Array,default:()=>[]}}}
</script>
