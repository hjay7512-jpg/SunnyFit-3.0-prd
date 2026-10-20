<template>
  <aside class="review-document" aria-label="功能与交互说明">
    <header class="review-document__header"><span>功能与交互说明</span><h1>{{ model.title }}</h1><button v-if="copyEnabled" type="button" class="review-copy-toggle" :aria-expanded="editing?'true':'false'" @click="editing=!editing">{{ editing?'返回交互说明':'编辑运营文案' }}<span v-if="copyDirty"> · 未保存</span></button></header>
    <section class="review-page-state" data-review-scope="page">
      <h2>页面状态</h2>
      <review-tabs v-if="model.states.length>1" id="review-page" label="页面状态" :items="model.states" :value="model.active" page @input="$emit('page-state',$event)"/>
      <div id="review-page-panel" role="tabpanel" :aria-labelledby="model.states.length>1?'review-page-'+model.active:undefined"><p v-for="(line,index) in model.description" :key="index">{{ line }}</p></div>
    </section>
    <operations-copy-editor v-if="editing&&copyEnabled" :screen="screen"/>
    <section v-for="(section,index) in (editing?[]:model.sections)" :key="section.id" class="review-feature" :data-review-component="section.id" :class="{'is-unavailable':section.disabled}">
      <div class="review-feature__title"><span>{{ String(index+1).padStart(2,'0') }}</span><h2>{{ section.title }}</h2></div>
      <review-tabs v-if="section.states&&section.states.length>1" :id="'review-'+section.id" :label="section.title+'状态'" :items="section.states" :value="section.active" :disabled="section.disabled" @input="$emit('component-state',{id:section.id,value:$event})"/>
      <div :id="'review-'+section.id+'-panel'" :role="section.states&&section.states.length>1?'tabpanel':undefined" :aria-labelledby="section.states&&section.states.length>1?'review-'+section.id+'-'+section.active:undefined"><p v-for="(line,i) in section.description" :key="i">{{ line }}</p></div>
      <slot :name="section.id" :section="section"/>
      <dl v-if="section.facts&&section.facts.length" class="review-facts"><div v-for="fact in section.facts" :key="fact[0]"><dt>{{ fact[0] }}</dt><dd>{{ fact[1] }}</dd></div></dl>
      <ol v-if="section.events&&section.events.length" class="review-event-log" aria-label="最近付费墙事件"><li v-for="event in section.events" :key="event.id"><strong>{{ event.label }}</strong><span>{{ event.detail }}</span></li></ol>
      <button v-for="action in section.actions||[]" :key="action.id" type="button" class="review-document-action" :disabled="section.disabled" @click="$emit('action',action.id)">{{ action.label }}<span aria-hidden="true">↗</span></button>
    </section>
    <footer class="review-document__footer"><a v-if="source" :href="source" target="_blank" rel="noopener noreferrer">设计来源 ↗</a><button type="button" @click="$emit('preview')">打开纯页面预览 ↗</button></footer>
  </aside>
</template>
<script>
import ReviewTabs from './ReviewTabs'
import OperationsCopyEditor from './OperationsCopyEditor'
import {groupsForPage} from '@/copy/copy-model.cjs'
import {copyDirty} from '@/copy/operations-copy'
export default {components:{ReviewTabs,OperationsCopyEditor},props:{model:{type:Object,required:true},source:String,screen:String},data(){return {editing:false}},computed:{copyEnabled(){return groupsForPage(this.screen).length>0},copyDirty},watch:{screen(){this.editing=false}}}
</script>
<style scoped>.review-copy-toggle{display:flex;align-items:center;gap:6px;margin:-14px 0 24px;padding:7px 10px;min-height:34px;background:#fff7f6;border:1px solid #f3d7d3;border-radius:6px;color:#c53634;font-family:inherit;font-size:11px;line-height:18px;font-weight:500;cursor:pointer}.review-copy-toggle span{color:#b8794b;font-size:10px}</style>
