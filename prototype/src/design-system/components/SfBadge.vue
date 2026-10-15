<template><span class="sf-badge" :class="'sf-badge--'+tone"><slot /></span></template>
<script>export default {name:'SfBadge',props:{tone:{type:String,default:'neutral',validator:v=>['neutral','accent','success','warning','danger'].includes(v)}}}</script>
