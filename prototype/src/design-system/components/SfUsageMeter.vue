<template><div class="sf-usage-meter usage-meter" role="progressbar" :aria-label="label" :aria-valuemin="0" :aria-valuemax="safeTotal" :aria-valuenow="safeRemaining"><span class="sf-usage-meter__fill" :style="{width:percent+'%'}"></span></div></template>
<script>
export default {name:'SfUsageMeter',props:{remaining:{type:Number,required:true},total:{type:Number,required:true},label:{type:String,required:true}},computed:{safeTotal(){return Number.isFinite(this.total)&&this.total>0?this.total:0},safeRemaining(){return Math.max(0,Math.min(this.safeTotal,Number.isFinite(this.remaining)?this.remaining:0))},percent(){return this.safeTotal?this.safeRemaining/this.safeTotal*100:0}}}
</script>
