<template>
  <div class="sf-user-toolbar">
    <div class="sf-user-toolbar__leading"><button type="button" class="sf-user-toolbar__profile" :class="profileClass" :aria-label="profileLabel" data-action="profile" @click.stop="$emit('action','profile')"><img :src="avatar" alt="" data-source-asset="true"/><img v-if="badge" class="sf-user-toolbar__profile-badge" :src="badge" alt="" data-source-asset="true"/></button><slot name="leading"/></div>
    <div class="sf-user-toolbar__actions"><slot/><button v-for="item in actions" :key="item.id" type="button" class="sf-icon-button sf-icon-button--compact" :aria-label="item.label" :disabled="item.disabled" :data-action="item.id" @click.stop="$emit('action',item.id)"><img :src="item.icon" :style="item.transform?{transform:item.transform}:null" alt="" data-source-asset="true"/><span v-if="item.badge" class="sf-user-toolbar__notification">{{ item.badge }}</span></button></div>
  </div>
</template>
<script>
export default {name:'SfUserToolbar',props:{avatar:{type:String,required:true},badge:String,profileLabel:{type:String,default:'Open profile'},profileClass:String,actions:{type:Array,default:()=>[]}}}
</script>
