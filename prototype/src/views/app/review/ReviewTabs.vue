<template>
  <div class="review-state-tabs" role="tablist" :aria-label="label" :class="{'is-page-tabs':page}">
    <button v-for="item in items" :id="id+'-'+item.id" :key="item.id" type="button" role="tab" :data-state="item.id" :aria-controls="id+'-panel'" :aria-selected="value===item.id?'true':'false'" :tabindex="value===item.id?0:-1" :disabled="disabled" @click="$emit('input',item.id)" @keydown="navigate($event,item.id)">{{ item.label }}</button>
  </div>
</template>
<script>
export default {
  props:{id:String,label:String,items:{type:Array,default:()=>[]},value:String,disabled:Boolean,page:Boolean},
  methods:{navigate(event,current){
    const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(event.key))return
    event.preventDefault();const index=this.items.findIndex(item=>item.id===current),next=event.key==='Home'?0:event.key==='End'?this.items.length-1:(index+(event.key==='ArrowRight'?1:-1)+this.items.length)%this.items.length
    this.$emit('input',this.items[next].id);this.$nextTick(()=>this.$el.querySelectorAll('[role=tab]')[next].focus())
  }}
}
</script>
