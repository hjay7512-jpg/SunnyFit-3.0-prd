<template><header class="sf-header" :class="{'sf-header--glass':glass}"><div class="sf-header__leading"><button v-if="back" type="button" class="sf-icon-button" :aria-label="backLabel" @click="$emit('back')"><slot name="back-icon"><sf-icon name="back" :size="22"/></slot></button><span v-else class="sf-header__space"></span></div><h1 v-if="title">{{ title }}</h1><span v-else class="sf-header__title-space" aria-hidden="true"></span><div class="sf-header__trailing"><slot name="trailing"><span class="sf-header__space"></span></slot></div></header></template>
<script>
import SfIcon from './SfIcon'
export default {name:'SfHeader',components:{SfIcon},props:{title:{type:String,required:true},back:{type:Boolean,default:true},backLabel:{type:String,default:'Back'},glass:Boolean}}
</script>
