<template>
  <sf-page-layout class="v3-collection" :title="title" extended @back="$emit('action','back')">
    <p class="collection-intro">{{ kind==='movement'?'Choose a movement to practice.':'Explore real-world routes for your next workout.' }}</p>
    <sf-card v-for="content in contents" :key="content.id" class="collection-card" :title="content.name" :data-content-id="content.id"><template #accessory><sf-badge :tone="content.access.allowed?'success':'neutral'">{{ content.access.allowed?'Available':'Plan access' }}</sf-badge></template><p v-if="content.durationMinutes">{{ content.durationMinutes }} min</p><p v-if="content.description&&!content.sample">{{ content.description }}</p><template #footer><sf-button :disabled="busy" @click="$emit('action','start-content:'+content.id)">Start</sf-button></template></sf-card>
    <sf-feedback v-if="!contents.length" tone="empty" :title="'No '+title.toLowerCase()+' available'" description="Your content will appear here when it is published."/>
  </sf-page-layout>
</template>
<script>
import {SfPageLayout,SfCard,SfBadge,SfButton,SfFeedback} from '@/design-system'
export default {components:{SfPageLayout,SfCard,SfBadge,SfButton,SfFeedback},props:{contents:{type:Array,default:()=>[]},kind:String,busy:Boolean},computed:{title(){return this.kind==='movement'?'Movements':'World Tour'}}}
</script>
<style scoped>
.v3-collection{height:100%}.v3-collection >>> .sf-page-layout__content{display:flex;flex-direction:column;gap:16px}.collection-intro{font-size:14px;line-height:22px;color:var(--sf-text-secondary);margin:0}.collection-card p{font-size:14px;line-height:22px;color:var(--sf-text-secondary)}.collection-card .sf-button{min-height:48px}.collection-card >>> .sf-card__title{font-size:18px;line-height:26px}
</style>
