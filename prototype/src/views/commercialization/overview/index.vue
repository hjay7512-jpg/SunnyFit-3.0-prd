<template>
  <div class="app-container" data-testid="demo-overview">
    <div class="page-header"><div><h1>Demo Overview</h1><p>查看样例数据与现有场景走查。全局业务定义和关系图请从右上角的 Business rules 独立入口进入。</p></div><div class="page-actions"><el-button icon="el-icon-refresh" @click="refresh">Refresh</el-button><el-button type="primary" @click="$router.push('/commercialization/operations')">Open Flow Preview</el-button><el-button @click="$router.push('/app/home')">App Samples</el-button></div></div>
    <scenario-overview ref="scenarioOverview"/>
  </div>
</template>
<script>
import ScenarioOverview from './ScenarioOverview'
export default {
  name:'CommercializationOverview',components:{ScenarioOverview},
  methods:{refresh(){if(this.$refs.scenarioOverview)this.$refs.scenarioOverview.load()}}
}
</script>
