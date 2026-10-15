<template>
  <section class="sf-photo-empty-state">
    <div class="sf-photo-empty-state__photo" :style="mask?{maskImage:'url('+mask+')',WebkitMaskImage:'url('+mask+')'}:null"><img :src="image" alt="" :style="imageStyle" data-source-asset="true"><p>{{ title }}</p></div>
    <sf-button :data-action="action" @click.stop="$emit('action')">{{ actionLabel }}</sf-button>
  </section>
</template>
<script>
import SfButton from './SfButton'
export default {name:'SfPhotoEmptyState',components:{SfButton},props:{image:{type:String,required:true},mask:String,imageStyle:Object,title:{type:String,required:true},action:String,actionLabel:{type:String,required:true}}}
</script>
