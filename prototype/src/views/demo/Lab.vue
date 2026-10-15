<template>
  <main class="demo-lab sf-ui">
    <header class="lab-header"><div><p>SunnyFit V3.0 · 本地迭代</p><h1>{{ tab==='components'?'基础组件与设计来源':tab==='ai-ball'?'AI Ball 动效与场景':'A/B 场景实验' }}</h1></div><nav aria-label="开发工具"><router-link :to="tabLink('experiment')">场景与 A/B</router-link><router-link :to="tabLink('components')">组件与基线</router-link><router-link :to="tabLink('ai-ball')">AI Ball 动效</router-link><router-link to="/app/home?user=DEMO-1003&review=0">打开现有 Demo</router-link></nav></header>
    <p class="lab-intro">开发评审工具。原产品入口继续保持原层级。正式 V3.0 首页的资源还原待完成；本批组件先迁移已有商业化页面。</p>
    <template v-if="tab==='components'">
      <component-catalog />
      <section class="lab-panel"><h2>已接入页面的基础组件</h2><p>组件视觉依据正式 V3.0 与 Apple 材质规范。Alpha 会员内容仅作为业务结构参考。</p>
        <div class="lab-component-grid">
          <article><h3>按钮</h3><sf-button @click="componentFeedback='按钮点击事件已触发'">Explore Premium</sf-button><sf-button disabled>Disabled</sf-button><sf-button loading>Preparing…</sf-button></article>
          <article><h3>菜单行</h3><sf-menu-row icon="membership" label="Plan &amp; Benefits" description="See what is included" @click="componentFeedback='菜单行点击事件已触发'" /><sf-menu-row label="Long label stays readable across narrow viewports" description="Long descriptions wrap without overlapping the chevron." @click="componentFeedback='长文案菜单行点击事件已触发'" /><sf-menu-row static-row icon="settings" label="Settings" description="原模块尚未接入" /></article>
          <article><h3>剩余用量</h3><p>8 of 30 replies left</p><sf-usage-meter :remaining="8" :total="30" label="Sample remaining replies" /><p>0 of 30 replies left</p><sf-usage-meter :remaining="0" :total="30" label="Sample exhausted replies" /><p>无额度</p><sf-usage-meter :remaining="0" :total="0" label="Sample no allowance" /></article>
          <article><h3>正式标题</h3><sf-section-title>Quick Start</sf-section-title><p>20 / 28，Semibold。SF Pro 在 Windows 上使用系统回退，字体还原仍需验收。</p></article>
          <article><h3>正式通栏按钮</h3><sf-button appearance="v3-full" @click="componentFeedback='正式通栏按钮点击事件已触发'">Browse Courses</sf-button><p>来自 Alpha 内复制的正式首页。48 px、12 px 圆角、18 / 26 字体；原稿 Glass Effect 的视觉表现仍需验收。</p></article>
        </div><p class="lab-feedback" role="status">{{ componentFeedback }}</p>
      </section>
      <section class="lab-panel"><h2>组件来源</h2><div class="lab-table"><table><thead><tr><th>组件</th><th>设计节点</th><th>说明</th></tr></thead><tbody><tr v-for="item in sources.components" :key="item.name"><td>{{ item.name }}</td><td><a :href="figmaLink(item)" target="_blank" rel="noopener">{{ item.nodeId||'V3 + HIG 补全' }}</a></td><td>{{ item.note }}</td></tr></tbody></table></div></section>
      <section class="lab-panel"><h2>页面迁移基线</h2><div class="lab-table"><table><thead><tr><th>页面</th><th>设计节点</th><th>进度</th></tr></thead><tbody><tr v-for="item in sources.pages" :key="item.name"><td>{{ item.name }}</td><td><a v-if="item.nodeId" :href="figmaLink(item)" target="_blank" rel="noopener">{{ item.nodeId }}</a><span v-else>既有业务结构 · V3 材质适配</span></td><td>{{ sourceStatus(item.status) }}</td></tr></tbody></table></div></section>
      <section class="lab-panel"><h2>正式稿与 Alpha 副本</h2><p>副本首页的 Create My Plan 按钮为蓝色，原文件截图为红色。复制后仍须逐项核对组件映射，当前整页视觉尚未验收。</p><div class="lab-table"><table><thead><tr><th>页面</th><th>正式节点</th><th>副本节点</th></tr></thead><tbody><tr v-for="item in sources.copies" :key="item.nodeId"><td>{{ item.name }}</td><td>{{ item.originalNodeId }}</td><td><a :href="figmaLink(item)" target="_blank" rel="noopener">{{ item.nodeId }}</a></td></tr></tbody></table></div></section>
    </template>
    <ai-ball-showcase v-else-if="tab==='ai-ball'"/>
    <template v-else>
      <section class="lab-panel lab-controls">
        <div class="lab-field"><label for="lab-scenario">业务场景</label><select id="lab-scenario" v-model="scenarioId" :disabled="loading" @change="newSnapshot"><option v-for="item in scenarios" :key="item.id" :value="item.id">{{ item.name }}</option></select></div>
        <div class="lab-field"><label for="lab-variant">方案</label><select id="lab-variant" :value="variant" @change="switchVariant($event.target.value)"><option value="A">A · Alpha 原稿</option><option value="B">B · 文案提案</option></select></div>
        <div class="lab-field"><label for="lab-width">预览宽度</label><select id="lab-width" v-model.number="previewWidth"><option :value="375">375 px</option><option :value="390">390 px</option><option :value="430">430 px</option></select></div>
        <button type="button" :disabled="loading||!run" @click="newSnapshot">读取当前数据为新一轮</button>
        <button type="button" :disabled="!run" @click="exportEvents">导出本轮记录</button>
      </section>
      <p v-if="error" class="lab-error" role="alert">{{ error }} <button type="button" @click="newSnapshot">重试读取快照</button></p>
      <p v-if="loading" role="status">读取本地账户快照…</p>
      <section v-if="run" class="lab-experiment">
        <aside class="lab-panel lab-task"><h2>{{ experiment.title }}</h2><p>{{ experiment.difference }}</p><p class="lab-task-text">任务：{{ experiment.task }}</p><p>本轮快照：{{ snapshotDate }}<br>账户：{{ run.storefront.user.name }}<br>当前方案：{{ variant }} · {{ experiment.variants[variant].source }}</p>
          <button type="button" class="lab-start" :disabled="!!attempt" @click="startTask">{{ attempt?'任务进行中…':'开始任务' }}</button><button v-if="attempt" type="button" @click="abortTask('user')">结束本次任务</button>
          <p v-if="!hasVisibleDifference" class="lab-feedback">该场景已有有效订阅，A/B 都显示 Manage membership。请选 Free 场景比较本次文案。</p>
          <p class="lab-feedback" role="status">{{ feedback }}</p><p>快照浏览仅记录导航，不执行付款、恢复购买或额度消耗。任务完成指进入 Plan &amp; Benefits，不表示购买成功。</p>
          <div class="lab-links"><router-link :to="variantLink('A')" target="_blank">打开同一快照的 A</router-link><router-link :to="variantLink('B')" target="_blank">打开同一快照的 B</router-link></div><p class="lab-small">链接在当前浏览器及同一本地站点下共享快照。</p>
        </aside>
        <div class="lab-preview-wrap"><p class="lab-preview-label">{{ screen==='plans'?'Plan & Benefits':'Membership & Usage' }} · {{ previewWidth }} px</p>
          <div class="lab-phone" :style="{width:previewWidth+'px'}" data-testid="lab-phone"><sf-header class="lab-phone-header" :title="screen==='plans'?'Plan & Benefits':'Membership & Usage'" glass @back="back"/><div class="lab-phone-content">
            <membership-usage v-if="screen==='membership'" :data="run.storefront" locale="en-US" :primary-label="experiment.variants[variant].label" @go="navigate" @restore="unavailable('restore')" />
            <consumer-screens v-else :data="run.storefront" screen="plans" locale="en-US" :busy="true" />
          </div></div>
        </div>
      </section>
      <section v-if="run" class="lab-panel"><h2>本轮观察记录</h2><p>每次任务由点击“开始任务”计时。同一人重复测试不能当作独立用户样本；切换、重载或关闭页面会记为中止，避免混入完成耗时。</p><div class="lab-table"><table><thead><tr><th>方案</th><th>开始</th><th>完成</th><th>中止</th><th>进行中</th><th>完成耗时中位数</th></tr></thead><tbody><tr v-for="item in summary" :key="item.variant"><td>{{ item.variant }}</td><td>{{ item.started }}</td><td>{{ item.completed }}</td><td>{{ item.aborted }}</td><td>{{ item.pending }}</td><td>{{ item.medianMs===null?'—':(item.medianMs/1000).toFixed(2)+' s' }}</td></tr></tbody></table></div><button type="button" :disabled="!!attempt" @click="clearCurrentEvents">清空本轮观察记录</button><p class="lab-small">仅清除这一轮的实验记录，业务账户快照、订单和额度保持不变。</p></section>
    </template>
  </main>
</template>
<script>
import {getStorefront} from '@/api/commerce'
import {SfButton,SfMenuRow,SfUsageMeter,SfSectionTitle,SfHeader} from '@/design-system'
import MembershipUsage from '@/views/app/MembershipUsage'
import ConsumerScreens from '@/views/app/ConsumerScreens'
import ComponentCatalog from './ComponentCatalog'
import AiBallShowcase from './AiBallShowcase'
import sources from '@/design-system/sources.cjs'
import {scenarios,experiment,scenarioById,resolveVariant} from '@/demo/scenarios/registry.cjs'
import {createRun,saveRun,readRun,appendEvent,readEvents,clearEvents,labQuery,summarize} from '@/demo/runtime.cjs'
import '@/views/app/account.css'
import './lab.css'
export default {
  name:'DemoLab',components:{SfButton,SfMenuRow,SfUsageMeter,SfSectionTitle,SfHeader,MembershipUsage,ConsumerScreens,ComponentCatalog,AiBallShowcase},
  data(){return {sources,scenarios,experiment,run:null,events:[],scenarioId:scenarioById(this.$route.query.scenario).id,loading:false,error:'',feedback:'',attempt:null,previewWidth:375,componentFeedback:'',requestSequence:0}},
  computed:{tab(){return ['components','ai-ball'].includes(this.$route.query.tab)?this.$route.query.tab:'experiment'},variant(){return resolveVariant(this.$route.query.variant)},screen(){return this.$route.query.screen==='plans'?'plans':'membership'},summary(){return summarize(this.events)},snapshotDate(){return this.run?new Date(this.run.createdAt).toLocaleString():''},hasVisibleDifference(){return this.run&&!this.run.storefront.subscriptions.some(s=>s.grant.status==='active')}},
  watch:{'$route.fullPath'(){this.abortTask('navigation');this.reconcileRoute()}},
  created(){this.reconcileRoute();window.addEventListener('storage',this.syncEvents);window.addEventListener('pagehide',this.onPageHide)},
  beforeDestroy(){this.abortTask('leave');window.removeEventListener('storage',this.syncEvents);window.removeEventListener('pagehide',this.onPageHide)},
  methods:{
    async reconcileRoute(){
      if(this.tab!=='experiment')return
      const incoming=readRun(localStorage,this.$route.query.run)
      if(incoming){if(!this.run||this.run.id!==incoming.id){this.run=incoming;this.scenarioId=incoming.scenarioId;this.syncEvents()}return}
      if(this.$route.query.run){this.error='当前浏览器没有这份快照，或快照格式已变更。请读取当前数据为新一轮。';this.run=null;return}
      await this.newSnapshot()
    },
    async newSnapshot(){
      this.abortTask('new_snapshot');this.loading=true;this.error='';const sequence=++this.requestSequence;const scenario=scenarioById(this.scenarioId)
      try{const storefront=await getStorefront(scenario.userId);if(sequence!==this.requestSequence)return;const run=createRun({id:crypto.randomUUID(),scenarioId:scenario.id,storefront,createdAt:new Date().toISOString()});saveRun(localStorage,run);this.run=run;this.events=[];this.feedback='新快照已固定，A/B 使用相同账户数据。';this.replaceQuery(labQuery(run,this.variant,{screen:'membership'}))}catch(e){if(sequence===this.requestSequence){this.error=e.message;this.run=null}}finally{if(sequence===this.requestSequence)this.loading=false}
    },
    replaceQuery(query){this.$router.replace({path:'/demo/lab',query},()=>{})},
    tabLink(tab){return {path:'/demo/lab',query:{...this.$route.query,tab:tab==='experiment'?undefined:tab}}},
    variantLink(variant){return {path:'/demo/lab',query:labQuery(this.run,variant)}},
    switchVariant(variant){this.abortTask('variant_switch');this.feedback='已切换方案，账户快照保持一致。';this.replaceQuery(this.run?labQuery(this.run,variant):{scenario:this.scenarioId,variant})},
    record(type,details={}){if(!this.run)return;this.events=appendEvent(localStorage,{id:crypto.randomUUID(),runId:this.run.id,experimentId:experiment.id,experimentVersion:experiment.version,scenarioId:this.run.scenarioId,variant:this.attempt?this.attempt.variant:this.variant,attemptId:this.attempt?this.attempt.id:undefined,type,screen:this.screen,at:new Date().toISOString(),...details})},
    startTask(){if(this.attempt||!this.run)return;if(this.screen!=='membership'){this.replaceQuery(labQuery(this.run,this.variant));this.feedback='已回到任务起点，请再次点击开始任务。';return}this.feedback='任务开始，请在手机预览中查找权益入口。';this.attempt={id:crypto.randomUUID(),variant:this.variant,startedAt:performance.now()};this.record('task_started')},
    navigate(target){this.record('navigation',{target});if(target!=='plans'){this.feedback='当前实验只覆盖查找权益入口；其他任务请在现有 Demo 验证。';return}if(this.attempt){const elapsedMs=Math.round(performance.now()-this.attempt.startedAt);this.record('task_completed',{target,elapsedMs});this.attempt=null;this.feedback='已找到权益页面，本次耗时 '+(elapsedMs/1000).toFixed(2)+' 秒。'}this.replaceQuery(labQuery(this.run,this.variant,{screen:'plans'}))},
    back(){this.abortTask('back');this.replaceQuery(labQuery(this.run,this.variant))},
    abortTask(reason){if(!this.attempt)return;this.record('task_aborted',{target:reason,elapsedMs:Math.round(performance.now()-this.attempt.startedAt)});this.attempt=null},
    unavailable(action){this.record('unsupported_action',{target:action});this.feedback='快照实验只浏览权益，'+action+' 请在现有 Demo 中执行。'},
    syncEvents(){if(this.run)this.events=readEvents(localStorage,this.run.id)},
    onPageHide(){this.abortTask('page_closed')},
    clearCurrentEvents(){if(this.attempt)return;clearEvents(localStorage,this.run.id);this.events=[];this.feedback='本轮观察记录已清空。'},
    exportEvents(){this.syncEvents();const payload={schemaVersion:1,experiment,run:{id:this.run.id,scenarioId:this.run.scenarioId,createdAt:this.run.createdAt},scope:'Local usability observations; no random assignment or conversion inference.',summary:summarize(this.events),events:this.events};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='sunnyfit-'+this.run.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)},
    figmaLink(item){if(item.url)return item.url;if(!item.fileKey||!item.nodeId)return undefined;return 'https://www.figma.com/design/'+item.fileKey+'/V3.0?node-id='+item.nodeId.replace(':','-')},
    sourceStatus(status){return {'assets-blocked':'截图已取得，原资源下载受限','metadata-only':'已定位节点，尚未实现','component-migration':'共用组件已接入，整页视觉待验收','partial-component-migration':'部分组件已接入，正式整页仍待迁移','context-read':'上下文与资源已读取，整页尚未迁移','extended-v3':'沿用既有结构，以 V3 控件补全','redesigned-from-prototype':'业务原型已按 V3 材质重新设计','avatar-blocked':'菜单组件已接入，头像资源待补齐'}[status]||status}
  }
}
</script>
