<template>
  <div class="app-wrapper" :class="{ hideSidebar: !opened }">
    <sidebar />
    <div class="main-container">
      <navbar />
      <tags-view />
      <main class="app-main"><implementation-scope /><router-view :key="$route.fullPath" /></main>
    </div>
  </div>
</template>
<script>
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import TagsView from './components/TagsView'
import ImplementationScope from '@/components/ImplementationScope'
export default { name: 'Layout', components: { Sidebar, Navbar, TagsView, ImplementationScope }, computed: { opened() { return this.$store.state.app.sidebar.opened } } }
</script>
