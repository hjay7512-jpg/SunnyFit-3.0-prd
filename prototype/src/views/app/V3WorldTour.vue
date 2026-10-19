<template>
  <div class="v3-world-tour v3-screen" data-reference-node-id="1025:16528">
    <sf-page-layout :asset="workoutAsset" extended :home-indicator="false">
      <template #header><sf-user-toolbar class="v3-workout__header" :avatar="(user&&user.avatarUrl)||workoutAsset('imgEllipse305')" :badge="workoutAsset('img40')" profile-class="v3-workout__profile" :actions="toolbarActions" @action="toolbarAction"/></template>
      <sf-segmented-control class="v3-world-tour__modes" value="world" :items="modes" label="Workout modes" @change="modeAction"/>
      <button v-if="!scene&&!equipment&&!query&&contents.length" class="v3-world-tour__hero" type="button" :aria-label="'View '+contents[0].name" @click="$emit('action','open-world-tour:'+contents[0].id)">
        <sf-course-card :title="contents[0].name" :duration="contents[0].durationMinutes+' min'" :level="contents[0].scene" :image="contents[0].coverUrl||asset('world-tour-cover')"><template #badge><span class="commerce-content-label">{{ contents[0].tier==='free'?'Free':'Premium' }}</span></template></sf-course-card>
      </button>
      <section class="v3-world-tour__scenes">
        <sf-section-title>Scene</sf-section-title>
        <div><button v-for="item in scenes" :key="item.name" type="button" :aria-pressed="scene===item.name?'true':'false'" @click="scene=scene===item.name?'':item.name"><img :src="asset(item.image)" alt=""/><span>{{ item.name }}</span></button></div>
      </section>
      <section class="v3-world-tour__equipment">
        <sf-section-title>Equipment</sf-section-title>
        <div><button v-for="item in equipmentTypes" :key="item.name" type="button" :aria-pressed="equipment===item.name?'true':'false'" @click="equipment=equipment===item.name?'':item.name"><img :src="asset(item.image)" alt=""/><span>{{ item.name }}</span></button></div>
      </section>
      <section class="v3-world-tour__routes">
        <header><sf-section-title>{{ scene||equipment?'Matching routes':'Explore routes' }}</sf-section-title><sf-button v-if="scene||equipment||query" appearance="text" :block="false" @click="scene='';equipment='';query=''">Clear filters</sf-button></header>
        <button v-for="route in visibleRoutes" :key="route.id" class="v3-world-tour__route" type="button" :data-content-id="route.id" :aria-label="'View '+route.name" @click="$emit('action','open-world-tour:'+route.id)"><sf-course-card appearance="compact" :title="route.name" :duration="route.durationMinutes+' min'" :level="route.scene" :image="route.coverUrl||asset('world-tour-cover')"><template #badge><span class="commerce-content-label">{{ route.tier==='free'?'Free':'Premium' }}</span></template></sf-course-card></button>
        <sf-feedback v-if="!visibleRoutes.length" title="No routes available" tone="empty"/>
      </section>
      <template #footer><sf-bottom-navigation :items="navigation" active="workout" @select="$emit('action',$event.action)"><template #accessory><button type="button" class="v3-workout__coach" data-action="coach" aria-label="Open AI Coach" @click.stop="$emit('action','coach')"><sf-ai-ball fit :size="56" state="idle" decorative/></button></template></sf-bottom-navigation></template>
    </sf-page-layout>
    <sf-sheet v-model="searching" title="Search World Tours" contained :resizable="false"><sf-search-field v-model="query" label="Search routes" placeholder="Search routes"/><sf-menu-row v-for="route in visibleRoutes" :key="route.id" :label="route.name" :description="route.durationMinutes+' min'" @click="openRoute(route.id)"/><sf-feedback v-if="!visibleRoutes.length" title="No matching routes" tone="empty"/></sf-sheet>
  </div>
</template>
<script>
import {SfPageLayout,SfUserToolbar,SfSegmentedControl,SfBottomNavigation,SfFeedback,SfSheet,SfSearchField,SfMenuRow,SfSectionTitle,SfCourseCard,SfButton,SfAiBall} from '@/design-system'
import {sceneAsset,workoutNavigation} from '@/design-system/assets/v3-scenes'
export default {
  components:{SfPageLayout,SfUserToolbar,SfSegmentedControl,SfBottomNavigation,SfFeedback,SfSheet,SfSearchField,SfMenuRow,SfSectionTitle,SfCourseCard,SfButton,SfAiBall},props:{contents:{type:Array,default:()=>[]},user:Object},
  data(){return {scene:'',equipment:'',query:'',searching:false,navigation:workoutNavigation,modes:[{value:'course',label:'Course'},{value:'world',label:'World Tour'},{value:'free',label:'Free Mode'}],scenes:[{name:'Riding',image:'scene-riding'},{name:'Boating',image:'scene-boating'},{name:'Running',image:'scene-running'}],equipmentTypes:[{name:'Indoor Ride',image:'equipment-bike'},{name:'Rower',image:'equipment-rower'},{name:'Treadmill',image:'equipment-treadmill'}]}},
  computed:{visibleRoutes(){return this.contents.filter(route=>(!this.scene||route.scene===this.scene)&&(!this.equipment||route.equipment===this.equipment)&&(route.name+' '+(route.description||'')).toLowerCase().includes(this.query.toLowerCase()))},toolbarActions(){return [{id:'search',label:'Search routes',icon:this.workoutAsset('img8')},{id:'plan',label:'Training calendar',icon:this.workoutAsset('imgGroup259')},{id:'existing-free-mode',label:'Free workout mode',icon:this.workoutAsset('imgGroup412')}]}},
  methods:{asset(name){return process.env.BASE_URL+'assets/figma/content-review/'+name+'.png'},workoutAsset(name){return sceneAsset('workout',name)},toolbarAction(action){if(action==='search')this.searching=true;else this.$emit('action',action)},modeAction(value){if(value!=='world')this.$emit('action',value==='course'?'workout':'existing-free-mode')},openRoute(id){this.searching=false;this.$emit('action','open-world-tour:'+id)}}
}
</script>
<style scoped>
.v3-world-tour{font-size:calc(16px * var(--sf-scale))}
.v3-world-tour__modes{gap:16px}.v3-world-tour__modes >>> button{font-size:calc(16px * var(--sf-scale));line-height:1.5;padding:8px}
.v3-world-tour__hero,.v3-world-tour__route{display:block;width:100%;min-width:0;padding:0;border:0;border-radius:12px;background:transparent;text-align:left;cursor:pointer}
.v3-world-tour .commerce-content-label{top:12px;left:12px;z-index:1}
.v3-world-tour >>> .sf-course-card__poster>img[src$="/world-tour-cover.png"]{width:calc(100% + 24px);height:calc(100% + 24px);max-width:none;left:-12px;top:-12px}
.v3-world-tour__scenes,.v3-world-tour__equipment,.v3-world-tour__routes{display:flex;flex-direction:column;gap:12px;margin-top:8px}
.v3-world-tour__scenes>div,.v3-world-tour__equipment>div{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.v3-world-tour__scenes button,.v3-world-tour__equipment button{display:flex;flex-direction:column;align-items:center;gap:8px;min-height:44px;min-width:0;padding:0;border:0;background:transparent;color:var(--sf-text-secondary);font:400 calc(14px * var(--sf-scale))/1.5 var(--sf-font-family);cursor:pointer}
.v3-world-tour__scenes img,.v3-world-tour__equipment img{display:block;width:100%;border-radius:var(--sf-radius-row);background:var(--sf-content-surface);border:1px solid var(--sf-content-edge);box-shadow:var(--sf-content-shadow)}
.v3-world-tour__scenes img{height:72px;object-fit:cover}.v3-world-tour__equipment img{aspect-ratio:1;object-fit:contain}
.v3-world-tour__scenes [aria-pressed=true],.v3-world-tour__equipment [aria-pressed=true]{color:var(--sf-action);font-weight:600}
.v3-world-tour__scenes [aria-pressed=true] img,.v3-world-tour__equipment [aria-pressed=true] img{outline:2px solid var(--sf-action);outline-offset:2px}
.v3-world-tour__routes>header{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.v3-world-tour__routes>header>.sf-button{font-size:calc(14px * var(--sf-scale));padding:4px 0}
.v3-world-tour__hero:focus-visible,.v3-world-tour__route:focus-visible,.v3-world-tour__scenes button:focus-visible,.v3-world-tour__equipment button:focus-visible{outline:2px solid var(--sf-action);outline-offset:4px}
</style>
