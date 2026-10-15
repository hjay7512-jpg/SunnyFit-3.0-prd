<template>
  <div class="app-container" data-testid="demo-overview">
    <div class="page-header"><div><h1>Demo Overview</h1><p>业务定义、关系评审与现有场景走查。</p></div><div class="page-actions"><el-button icon="el-icon-refresh" @click="refresh">{{ tab==='logic'?'刷新配置参考':'Refresh' }}</el-button><el-button type="primary" @click="$router.push('/commercialization/operations')">Open Flow Preview</el-button><el-button @click="$router.push('/app/home')">App Samples</el-button></div></div>
    <el-tabs v-model="tab" data-testid="overview-tabs"><el-tab-pane label="业务关系图" name="logic"/><el-tab-pane label="场景与数据" name="data"/></el-tabs>
    <keep-alive><business-review v-if="tab==='logic'" ref="businessReview"/><scenario-overview v-else ref="scenarioOverview"/></keep-alive>
  </div>
</template>
<script>
import BusinessReview from '@/components/BusinessReview'
import ScenarioOverview from './ScenarioOverview'
export default {
  name:'CommercializationOverview',components:{BusinessReview,ScenarioOverview},
  data(){return{tab:this.$route.query.tab==='data'?'data':'logic'}},
  methods:{refresh(){if(this.tab==='logic'&&this.$refs.businessReview)this.$refs.businessReview.reload();else if(this.$refs.scenarioOverview)this.$refs.scenarioOverview.load()}}
}
</script>
