<template>
  <div class="home-components-showcase">
    <div><p class="catalog-source">正式首页浅色基线 · 参考数据用于视觉对照，按钮只输出预览事件</p><sf-segmented-control v-model="scene" :items="states" label="Formal Home state"/><div class="home-components-showcase__viewport"><div class="home-components-showcase__phone"><v3-home :key="scene" reference :snapshot="snapshot" @action="$emit('action',$event)"/></div></div></div>
    <div class="home-components-showcase__states"><p class="catalog-source">同一计划组件的原稿状态 · AI 计划 / 课程计划</p>
      <sf-plan-card title="Dynamic Plan" :arrow="asset('img')" action="plan" progress-text="1/4" progress-caption="Stage" progress-label="Reference stage 1 of 4" :details="[{label:'Current Stage',value:'Body Awake'},{label:'Day 2',value:'Cardio Focus'}]" @action="$emit('action','plan')"><template #progress><div class="home-components-showcase__stage" aria-hidden="true"><div v-for="(name,i) in ['imgEllipse1010','imgEllipse1011','imgEllipse1012','imgEllipse1013']" :key="name" :style="{transform:'rotate('+i*90+'deg)'}"><img :src="planAsset(name)" alt="" data-source-asset="true"></div></div></template></sf-plan-card>
      <sf-plan-card v-for="title in ['AI Plan','Training Program']" :key="title" :title="title" :arrow="asset('img')" action="plan" progress-text="75%" progress-label="Reference progress 75 percent" :details="[{label:'Completed',value:'20'},{label:'Remaining',value:'5'}]" @action="$emit('action','plan')"><template #progress><img v-for="name in ['img8','img9','img10']" :key="name" :src="courseAsset(name)" :style="name==='img10'?{width:'119.728px',height:'119.728px',left:'.272px',top:'.272px'}:null" alt="" data-source-asset="true"></template></sf-plan-card>
      <p class="catalog-source">原稿将 75% 与完成 20 / 剩余 5 放在一起；这里保留视觉参考。接入真实进度时须按业务口径计算，不能复制这组不一致的示例数值。</p>
    </div>
  </div>
</template>
<script>
import V3Home from '@/views/app/V3Home'
import {SfPlanCard,SfSegmentedControl} from '@/design-system'
import {homeAsset} from '@/design-system/assets/v3-home'
import aiPlan from '../../../public/assets/figma/v3/home-ai-plan/manifest.json'
import coursePlan from '../../../public/assets/figma/v3/home-course-plan/manifest.json'
import {homeStates,homeReferenceState} from '@/design-system/assets/home-states'
export default {name:'HomeComponentsShowcase',components:{V3Home,SfPlanCard,SfSegmentedControl},data(){return {scene:homeStates.some(s=>s.value===this.$route.query.homeState)?this.$route.query.homeState:'default',states:homeStates}},computed:{snapshot(){return homeReferenceState(this.scene)}},watch:{'$route.query.homeState'(value){if(homeStates.some(s=>s.value===value))this.scene=value}},methods:{asset:homeAsset,planAsset(name){return '/assets/figma/v3/home-ai-plan/'+aiPlan[name].file},courseAsset(name){return '/assets/figma/v3/home-course-plan/'+coursePlan[name].file}}}
</script>
<style>
.home-components-showcase{display:grid;grid-template-columns:minmax(0,375px) minmax(0,343px);gap:24px;justify-content:center}.home-components-showcase__viewport{max-width:100%;overflow-x:auto}.home-components-showcase__phone{box-sizing:content-box;height:812px;width:375px;max-width:none;border:1px solid var(--sf-content-edge);border-radius:24px;overflow:hidden}.home-components-showcase__states{display:flex;flex-direction:column;gap:16px;min-width:0}.home-components-showcase__states>.catalog-source{margin:0}.home-components-showcase__stage{position:absolute;inset:0}.home-components-showcase__stage>div{position:absolute;inset:0}.home-components-showcase__stage img{position:absolute;left:60px;top:60px;display:block;max-width:none}.home-components-showcase__states>.sf-plan-card:first-of-type dd{font-size:calc(16px * var(--sf-scale));line-height:calc(24px * var(--sf-scale))}.catalog-example--home{grid-column:1/-1}@media(max-width:850px){.home-components-showcase{grid-template-columns:minmax(0,375px)}}
</style>
