<template>
  <header class="navbar">
    <button class="hamburger-container" aria-label="Toggle sidebar" @click="$store.dispatch('app/toggleSideBar')"><i :class="opened ? 'el-icon-s-fold' : 'el-icon-s-unfold'" /></button>
    <el-breadcrumb separator="/" class="breadcrumb-container">
      <el-breadcrumb-item v-for="(entry,index) in breadcrumbs" :key="entry.path" :to="index === breadcrumbs.length - 1 ? undefined : { path: entry.redirect || entry.path }">{{ entry.meta.title }}</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="navbar-right"><router-link class="business-rules-entry" :to="businessRulesTarget"><i class="el-icon-connection"/><span>Business rules</span></router-link><el-tag type="info" effect="plain" size="mini">Demo data</el-tag><span class="admin-name"><i class="el-icon-user" /> Admin</span></div>
  </header>
</template>
<script>
import { scopeForPath } from '@/router/modules/commercialization-scope'
export default {
  name: 'Navbar',
  computed: {
    opened() { return this.$store.state.app.sidebar.opened },
    breadcrumbs() { const entitlementModule = ['catalog','suits','content-management'].includes(this.$route.path.split('/')[2]); return this.$route.matched.filter(entry => entry.meta && entry.meta.title).map(entry => entitlementModule && entry.path === '/commercialization' ? { ...entry, meta: { ...entry.meta, title: 'Entitlement Management' } } : entry) },
    businessRulesTarget() {
      const activePath = this.$route.meta.activeMenu || this.$route.path
      const module = activePath.split('/')[2] || 'overview'
      const scope = scopeForPath('/commercialization/' + module) || scopeForPath('/commercialization/overview')
      const query = { module, topic: scope.businessTopic || 'relations', node: scope.businessNode || 'entitlement', from: this.$route.fullPath }
      return { path: '/business-rules', query }
    }
  }
}
</script>
<style scoped>
.business-rules-entry { display: inline-flex; align-items: center; gap: 6px; color: #44627f; font-size: 13px; white-space: nowrap; }
.business-rules-entry:hover { color: #409eff; }
</style>
