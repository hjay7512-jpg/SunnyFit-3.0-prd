<template>
  <nav class="tags-view-container" aria-label="Open pages">
    <div v-for="view in views" :key="view.fullPath" class="tags-view-item" :class="{ active: view.fullPath === $route.fullPath }">
      <router-link :to="view.fullPath">{{ view.title }}</router-link>
      <button v-if="views.length > 1" class="tag-close" :aria-label="'Close ' + view.title" @click="close(view)"><i class="el-icon-close" /></button>
    </div>
  </nav>
</template>
<script>
export default {
  name: 'TagsView', computed: { views() { return this.$store.state.tagsView.visitedViews } },
  methods: { close(view) {
    const active = view.fullPath === this.$route.fullPath
    if (!active) return this.$store.dispatch('tagsView/deleteView', view)
    const remaining = this.views.filter(entry => entry.fullPath !== view.fullPath)
    const target = remaining.length ? remaining[remaining.length - 1].fullPath : '/commercialization/catalog'
    // Remove the active tag only after its page has allowed navigation.
    // Choosing Stay in the unsaved-changes dialog retains both page and tag.
    this.$router.push(target, () => this.$store.dispatch('tagsView/deleteView', view))
  } }
}
</script>
