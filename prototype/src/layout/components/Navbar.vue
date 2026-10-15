<template>
  <header class="navbar">
    <button class="hamburger-container" aria-label="Toggle sidebar" @click="$store.dispatch('app/toggleSideBar')"><i :class="opened ? 'el-icon-s-fold' : 'el-icon-s-unfold'" /></button>
    <el-breadcrumb separator="/" class="breadcrumb-container">
      <el-breadcrumb-item v-for="(entry,index) in breadcrumbs" :key="entry.path" :to="index === breadcrumbs.length - 1 ? undefined : { path: entry.redirect || entry.path }">{{ entry.meta.title }}</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="navbar-right"><el-tag type="info" effect="plain" size="mini">Demo data</el-tag><span class="admin-name"><i class="el-icon-user" /> Admin</span></div>
  </header>
</template>
<script>
export default { name: 'Navbar', computed: { opened() { return this.$store.state.app.sidebar.opened }, breadcrumbs() { return this.$route.matched.filter(entry => entry.meta && entry.meta.title) } } }
</script>
