<template>
  <aside v-if="scope" class="implementation-scope" aria-label="原型实施位置说明">
    <div class="scope-summary">
      <el-tag :type="tagType" size="small" effect="plain">{{ scope.label }}</el-tag>
      <el-tag :type="priorityType" size="small" effect="dark" :title="scope.priorityNote">{{ scope.priority }}</el-tag>
      <strong>{{ scope.title }}</strong>
      <el-button class="scope-caption" type="text" size="mini" :aria-expanded="String(expanded)" @click="expanded=!expanded">{{ expanded ? '收起范围说明' : '范围说明' }} <i :class="expanded?'el-icon-arrow-up':'el-icon-arrow-down'"/></el-button>
    </div>
    <p v-if="expanded">{{ scope.description }}</p>
    <p v-if="expanded && scope.priorityNote" class="priority-note"><strong>Roadmap:</strong> {{ scope.priorityNote }}</p>
    <div v-if="expanded && scope.links" class="scope-links">
      <router-link v-for="link in scope.links" :key="link.path" :to="'/commercialization/'+link.path">{{ link.title }}</router-link>
    </div>
  </aside>
</template>
<script>
import { scopeForPath } from '@/router/modules/commercialization-scope'
export default {
  name: 'ImplementationScope',
  data() { return { expanded: false } },
  watch: { '$route.path'() { this.expanded = false } },
  computed: {
    scope() { return scopeForPath(this.$route.path) },
    tagType() { return { new: '', extension: 'success', optional: 'warning', support: 'info', prototype: 'warning' }[this.scope.kind] },
    priorityType() { return { MVP: 'success', P1: 'warning', P2: 'info', P3: 'info', Review: '', Demo: 'info' }[this.scope.priority] || '' }
  }
}
</script>
<style scoped>
.implementation-scope { margin: 16px 20px 0; padding: 12px 16px; border: 1px solid #dce3eb; border-left: 3px solid #909399; border-radius: 4px; background: #f8fafc; color: #606266; font-size: 13px; line-height: 1.6; }
.scope-summary { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.scope-summary strong { color: #303133; }
.scope-caption { color: #909399; font-size: 12px; margin-left: auto; }
.implementation-scope p { margin: 8px 0 0; }
.implementation-scope .priority-note { color: #536b83; }
.implementation-scope .priority-note strong { color: #40546d; }
.scope-links { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 8px; }
.scope-links a { color: #409eff; }
</style>
