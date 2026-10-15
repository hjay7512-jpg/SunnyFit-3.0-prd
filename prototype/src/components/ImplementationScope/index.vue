<template>
  <aside v-if="scope" class="implementation-scope" aria-label="原型实施位置说明">
    <div class="scope-summary">
      <el-tag :type="tagType" size="small" effect="plain">{{ scope.label }}</el-tag>
      <strong>{{ scope.title }}</strong>
      <span class="scope-caption">评审注释，正式产品不展示</span>
    </div>
    <p>{{ scope.description }}</p>
    <div v-if="scope.links" class="scope-links">
      <router-link v-for="link in scope.links" :key="link.path" :to="'/commercialization/'+link.path">{{ link.title }}</router-link>
    </div>
  </aside>
</template>
<script>
import { scopeForPath } from '@/router/modules/commercialization-scope'
export default {
  name: 'ImplementationScope',
  computed: {
    scope() { return scopeForPath(this.$route.path) },
    tagType() { return { new: '', extension: 'success', optional: 'warning', support: 'info', prototype: 'warning' }[this.scope.kind] }
  }
}
</script>
<style scoped>
.implementation-scope { margin: 16px 20px 0; padding: 12px 16px; border: 1px solid #dce3eb; border-left: 3px solid #909399; border-radius: 4px; background: #f8fafc; color: #606266; font-size: 13px; line-height: 1.6; }
.scope-summary { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.scope-summary strong { color: #303133; }
.scope-caption { color: #909399; font-size: 12px; margin-left: auto; }
.implementation-scope p { margin: 8px 0 0; }
.scope-links { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 8px; }
.scope-links a { color: #409eff; }
</style>
