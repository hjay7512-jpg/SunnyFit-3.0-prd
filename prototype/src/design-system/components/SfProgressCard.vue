<template>
  <section class="sf-progress-card" :aria-label="title">
    <header><h3>{{ title }}</h3><button v-if="arrow" type="button" :aria-label="'Open '+title+' data'" :data-action="action" @click.stop="$emit('action')"><span><img :src="arrow" alt="" data-source-asset="true"></span></button></header>
    <p class="sf-progress-card__detail">{{ detail }}</p>
    <div class="sf-progress-card__chart" role="img" :aria-label="chartLabel"><slot/></div>
  </section>
</template>
<script>
export default {name:'SfProgressCard',props:{title:{type:String,required:true},detail:String,chartLabel:{type:String,required:true},arrow:String,action:String}}
</script>
