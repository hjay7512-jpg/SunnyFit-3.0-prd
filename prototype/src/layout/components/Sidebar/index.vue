<template>
  <aside class="sidebar-container">
    <router-link class="sidebar-logo" to="/commercialization/overview"><span class="logo-symbol">S</span><span v-if="opened">SunnyFit Admin</span></router-link>
    <el-scrollbar class="sidebar-scrollbar">
      <el-menu :default-active="activeMenu" :default-openeds="openGroups" :collapse="!opened" :collapse-transition="false" background-color="#304156" text-color="#bfcbd9" active-text-color="#409eff" @select="navigate">
        <el-submenu v-for="group in groups" :key="group.key" :index="group.key">
          <template slot="title"><i :class="group.icon" /><span>{{ group.title }}</span></template>
          <el-menu-item v-for="item in group.items" :key="item.path" :index="item.path"><i :class="item.icon"/><span slot="title" class="sidebar-menu-label"><span class="sidebar-menu-text">{{ item.title }}</span><el-tag v-if="item.priority" size="mini" :type="priorityType(item.priority)" effect="dark" :title="priorityNote(item.path)">{{ item.priority }}</el-tag></span></el-menu-item>
        </el-submenu>
      </el-menu>
    </el-scrollbar>
  </aside>
</template>
<script>
import { sidebarGroups, priorityForPath } from '@/router/modules/commercialization-scope'
export default {
  name: 'Sidebar',
  data() { return { groups: sidebarGroups } },
  computed: {
    opened() { return this.$store.state.app.sidebar.opened },
    activeMenu() { return this.$route.meta.activeMenu || this.$route.path },
    openGroups() { return this.groups.filter(group => group.key === 'commerce' || group.items.some(item => item.path === this.activeMenu)).map(group => group.key) }
  },
  methods: {
    priorityType(priority) { return { MVP: 'success', P1: 'warning', P2: 'info', P3: 'info', Review: '', Demo: 'info' }[priority] || '' },
    priorityNote(path) { return priorityForPath(path).note },
    navigate(path) { if (path !== this.$route.path) this.$router.push(path, () => {}) }
  }
}
</script>
<style scoped>
.sidebar-container >>> .el-submenu__title { font-size: 12px; padding-left: 12px !important; }
.sidebar-container >>> .el-menu-item { font-size: 12px; padding-left: 24px !important; }
.sidebar-menu-label { display: inline-flex; align-items: center; gap: 5px; width: 145px; vertical-align: middle; }
.sidebar-menu-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sidebar-menu-label >>> .el-tag { flex: 0 0 auto; padding: 0 4px; border: 0; line-height: 16px; height: 16px; font-size: 9px; }
.sidebar-container >>> .el-menu--collapse .sidebar-menu-label { display: none; }
</style>
