<template>
  <div class="sf-page-layout" :class="{'sf-page-layout--footer':$slots.footer,'sf-page-layout--scrolled':scrolled}">
    <div ref="scroll" class="sf-page-layout__scroll" @scroll="scrolled=$event.target.scrollTop>4"><sf-ambient-backdrop v-if="ambient" :asset="asset" :extended="extended"/><main class="sf-page-layout__content"><slot/></main></div>
    <header class="sf-page-layout__top"><div class="sf-page-layout__status" aria-hidden="true"><b>9:41</b><img :src="statusAsset||homeAsset('imgRightSide')" alt="" data-source-asset="true"></div><slot name="header"><sf-header :title="title" :back="back" :glass="glass" @back="$emit('back')"><template v-if="$slots['back-icon']" #back-icon><slot name="back-icon"/></template><template #trailing><slot name="trailing"/></template></sf-header></slot></header>
    <footer v-if="$slots.footer" class="sf-page-layout__footer"><slot name="footer"/><span v-if="homeIndicator" class="sf-page-layout__indicator" aria-hidden="true"></span></footer><span v-else-if="homeIndicator" class="sf-page-layout__indicator" aria-hidden="true"></span>
  </div>
</template>
<script>
import SfAmbientBackdrop from './SfAmbientBackdrop'
import SfHeader from './SfHeader'
import {homeAsset} from '../assets/v3-home'
export default {name:'SfPageLayout',components:{SfAmbientBackdrop,SfHeader},props:{title:{type:String,default:''},back:{type:Boolean,default:true},glass:{type:Boolean,default:true},ambient:{type:Boolean,default:true},extended:Boolean,asset:Function,statusAsset:String,homeIndicator:{type:Boolean,default:true}},data(){return{scrolled:false}},methods:{homeAsset,scrollToTop(){this.$refs.scroll.scrollTop=0;this.scrolled=false}}}
</script>
