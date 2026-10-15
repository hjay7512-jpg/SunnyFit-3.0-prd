<template>
  <component :is="tag" :type="tag==='button'?'button':null" :href="tag==='a'?href:null" :target="tag==='a'?target:null" :rel="tag==='a'&&target==='_blank'?'noopener noreferrer':null" class="sf-menu-row usage-menu-row" :disabled="tag==='button'?disabled:null" :aria-disabled="staticRow?'true':null" @click="activate">
    <sf-icon v-if="icon" class="sf-menu-row__icon" :name="icon" :size="22" />
    <span class="sf-menu-row__copy"><strong>{{ label }}</strong><small v-if="description">{{ description }}</small></span><span v-if="$slots.accessory" class="sf-menu-row__accessory"><slot name="accessory"/></span><span class="sf-menu-row__chevron" aria-hidden="true">›</span>
  </component>
</template>
<script>
import SfIcon from './SfIcon.vue'
export default {name:'SfMenuRow',components:{SfIcon},props:{label:{type:String,required:true},description:String,icon:String,href:String,target:String,staticRow:Boolean,disabled:Boolean},computed:{tag(){return this.staticRow?'div':this.href&&!this.disabled?'a':'button'}},methods:{activate(event){if(!this.staticRow&&!this.disabled)this.$emit('click',event)}}}
</script>
