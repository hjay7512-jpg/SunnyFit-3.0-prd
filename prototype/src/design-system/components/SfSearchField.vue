<template><div class="sf-search"><label class="sf-visually-hidden" :for="id">{{ label }}</label><sf-icon name="search"/><input :id="id" type="search" :value="value" :placeholder="placeholder" :disabled="disabled" autocomplete="off" @input="$emit('input',$event.target.value)" @keydown.enter="$emit('search',value)"/><button v-if="value" type="button" class="sf-icon-button" :disabled="disabled" aria-label="Clear search" @click="clear"><sf-icon name="close" :size="18"/></button></div></template>
<script>
import SfIcon from './SfIcon'
let sequence=0
export default {name:'SfSearchField',components:{SfIcon},props:{value:{type:String,default:''},label:{type:String,default:'Search'},placeholder:{type:String,default:'Search'},disabled:Boolean},data(){return {id:'sf-search-'+(++sequence)}},methods:{clear(){this.$emit('input','');this.$nextTick(()=>this.$el.querySelector('input').focus())}}}
</script>
