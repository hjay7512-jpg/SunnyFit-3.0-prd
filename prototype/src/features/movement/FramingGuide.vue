<template>
  <div class="framing-guide" :class="{'framing-guide--upper':framing==='upper_body','framing-guide--valid':valid}" aria-hidden="true">
    <i v-for="corner in ['tl','tr','bl','br']" :key="corner" class="framing-guide__corner" :class="'framing-guide__corner--'+corner"/>
    <div class="framing-guide__shape" :style="shapeStyle"><img :src="silhouette" width="166.95" height="529.089" data-node-id="6637:23125" alt=""/></div>
    <span class="framing-guide__scan"/>
  </div>
</template>
<script>
export default {
  props:{framing:String,valid:Boolean},data(){return{width:300,height:560,silhouette:process.env.BASE_URL+'assets/movement/framing-silhouette.svg'}},
  computed:{shapeStyle(){const crop=this.framing==='upper_body'?318:529.089,scale=Math.min(this.width*.52/166.95,this.height*.84/crop);return{height:crop+'px',transform:'translateX(-50%) scale('+scale+')'}}},
  mounted(){this.observer=new ResizeObserver(([entry])=>{this.width=entry.contentRect.width;this.height=entry.contentRect.height});this.observer.observe(this.$el)},beforeDestroy(){this.observer.disconnect()}
}
</script>
