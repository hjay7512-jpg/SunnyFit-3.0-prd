<template>
  <button type="button" class="sf-button" :class="['sf-button--'+appearance,{'sf-button--block':block,'sf-button--compact':compact}]" :disabled="disabled||loading" :aria-busy="loading?'true':null" @click="$emit('click',$event)">
    <template v-if="appearance==='v3-full'"><span class="sf-button__layer sf-button__layer--shadow" aria-hidden="true"></span><span class="sf-button__layer sf-button__layer--backing" aria-hidden="true"></span><span class="sf-button__layer sf-button__layer--tint" aria-hidden="true"></span><span class="sf-button__layer" aria-hidden="true"></span></template>
    <span class="sf-button__label"><slot /></span>
  </button>
</template>
<script>
export default {name:'SfButton',props:{block:{type:Boolean,default:true},compact:Boolean,disabled:Boolean,loading:Boolean,appearance:{type:String,default:'v3-full',validator:value=>['commerce','v3-full','glass','text'].includes(value)}}}
</script>
