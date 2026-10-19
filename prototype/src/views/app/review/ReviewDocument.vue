<template>
  <aside class="review-document" aria-label="功能与交互说明">
    <header class="review-document__header"><span>功能与交互说明</span><h1>{{ model.title }}</h1></header>
    <section class="review-page-state" data-review-scope="page">
      <h2>页面状态</h2>
      <review-tabs v-if="model.states.length>1" id="review-page" label="页面状态" :items="model.states" :value="model.active" page @input="$emit('page-state',$event)"/>
      <div id="review-page-panel" role="tabpanel" :aria-labelledby="model.states.length>1?'review-page-'+model.active:undefined"><p v-for="(line,index) in model.description" :key="index">{{ line }}</p></div>
    </section>
    <section v-for="(section,index) in model.sections" :key="section.id" class="review-feature" :data-review-component="section.id" :class="{'is-unavailable':section.disabled}">
      <div class="review-feature__title"><span>{{ String(index+1).padStart(2,'0') }}</span><h2>{{ section.title }}</h2></div>
      <review-tabs v-if="section.states&&section.states.length>1" :id="'review-'+section.id" :label="section.title+'状态'" :items="section.states" :value="section.active" :disabled="section.disabled" @input="$emit('component-state',{id:section.id,value:$event})"/>
      <div :id="'review-'+section.id+'-panel'" :role="section.states&&section.states.length>1?'tabpanel':undefined" :aria-labelledby="section.states&&section.states.length>1?'review-'+section.id+'-'+section.active:undefined"><p v-for="(line,i) in section.description" :key="i">{{ line }}</p></div>
      <slot :name="section.id" :section="section"/>
      <button v-for="action in section.actions||[]" :key="action.id" type="button" class="review-document-action" :disabled="section.disabled" @click="$emit('action',action.id)">{{ action.label }}<span aria-hidden="true">↗</span></button>
    </section>
    <footer class="review-document__footer"><a v-if="source" :href="source" target="_blank" rel="noopener noreferrer">设计来源 ↗</a><button type="button" @click="$emit('preview')">打开纯页面预览 ↗</button></footer>
  </aside>
</template>
<script>
import ReviewTabs from './ReviewTabs'
export default {components:{ReviewTabs},props:{model:{type:Object,required:true},source:String}}
</script>
