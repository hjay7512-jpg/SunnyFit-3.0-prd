<template>
  <div class="sf-plan-progress" aria-hidden="true">
    <template v-if="mode==='stage'"><div v-for="(src,index) in layers" :key="src" class="sf-plan-progress__quadrant" :style="{transform:'rotate('+index*90+'deg)'}"><img :src="src" alt="" data-source-asset="true"/></div></template>
    <template v-else><img v-for="(src,index) in layers" :key="src" :src="src" :class="{'sf-plan-progress__marker':index===2}" alt="" data-source-asset="true"/></template>
  </div>
</template>
<script>
export default {name:'SfPlanProgress',props:{mode:{type:String,default:'percentage',validator:v=>['percentage','stage'].includes(v)},layers:{type:Array,required:true}}}
</script>
