<template><div class="sf-message-bubble" :class="[role==='user'?'sf-message-bubble--user user-bubble':'sf-message-bubble--assistant assistant-bubble']"><slot>{{ text }}</slot></div></template>
<script>export default {name:'SfMessageBubble',props:{text:{type:String,default:''},role:{type:String,default:'assistant',validator:value=>['user','assistant'].includes(value)}}}</script>
