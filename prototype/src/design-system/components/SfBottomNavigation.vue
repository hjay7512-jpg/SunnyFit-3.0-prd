<template>
  <div class="sf-bottom-navigation">
    <div class="sf-bottom-navigation__row" :class="{'sf-bottom-navigation__row--accessory':$slots.accessory}">
      <nav class="sf-bottom-navigation__tabs" :aria-label="label">
        <button v-for="item in items" :key="item.value" type="button" :data-action="item.action" :aria-current="active===item.value?'page':null" :disabled="item.disabled" @click.stop="$emit('select',item)">
          <span class="sf-bottom-navigation__selection" aria-hidden="true"></span>
          <span class="sf-bottom-navigation__icon"><slot name="icon" :item="item" :selected="active===item.value"><img :src="active===item.value&&item.activeIcon?item.activeIcon:item.icon" alt="" data-source-asset="true"></slot></span>
          <span class="sf-bottom-navigation__label">{{ item.label }}</span>
          <span v-if="item.notification" class="sf-bottom-navigation__dot" aria-label="New activity"></span>
        </button>
      </nav>
      <div v-if="$slots.accessory" class="sf-bottom-navigation__accessory"><slot name="accessory"/></div>
    </div>
    <div v-if="homeIndicator" class="sf-bottom-navigation__safe-area" aria-hidden="true"><span></span></div>
  </div>
</template>
<script>
export default {name:'SfBottomNavigation',props:{items:{type:Array,required:true},active:String,label:{type:String,default:'Main navigation'},homeIndicator:{type:Boolean,default:true}}}
</script>
