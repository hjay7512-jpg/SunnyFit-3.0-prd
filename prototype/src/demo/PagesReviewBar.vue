<template>
  <aside class="pages-review-bar" aria-label="Prototype review environment">
    <span><strong>SunnyFit 3.0</strong><span class="pages-review-detail"> · 评审原型 · 数据仅保存在当前浏览器</span></span>
    <nav aria-label="Review shortcuts">
      <router-link to="/app/home?user=DEMO-2002&review=1">前台</router-link>
      <router-link to="/commercialization/overview">后台</router-link>
      <router-link to="/commercialization/overview?tab=logic">业务关系</router-link>
      <router-link to="/demo/lab?tab=components">组件</router-link>
      <button type="button" :disabled="resetting" @click="reset">{{ resetting ? '重置中…' : '重置演示' }}</button>
    </nav>
  </aside>
</template>
<script>
import { runtime } from './pages-adapter'
export default {
  data: () => ({ resetting: false }),
  methods: {
    async reset() {
      try { await this.$confirm('恢复初始演示数据？当前浏览器中的订单、配置和余额改动将被清除。', '重置演示', { confirmButtonText: '重置', cancelButtonText: '保留', type: 'warning' }) } catch (_) { return }
      this.resetting = true
      try { await (await runtime()).reset(); window.location.reload() } catch (error) { this.$message.error(error.message); this.resetting = false }
    }
  }
}
</script>
<style>
:root { --pages-review-height: 40px; }
body { padding-top: var(--pages-review-height); }
.pages-review-bar { position: fixed; inset: 0 0 auto; height: var(--pages-review-height); z-index: 5000; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 16px; background: #252d3c; color: #fff; font: 12px/1.4 system-ui, sans-serif; }
.pages-review-bar nav { display: flex; align-items: center; gap: 14px; white-space: nowrap; }
.pages-review-bar a { color: #e2e7ef; text-decoration: none; }
.pages-review-bar a:hover, .pages-review-bar a.router-link-exact-active { color: #ffbc44; }
.pages-review-bar button { border: 1px solid #687385; border-radius: 6px; color: #fff; background: transparent; cursor: pointer; padding: 3px 8px; font: inherit; }
.sidebar-container { top: var(--pages-review-height); height: calc(100% - var(--pages-review-height)); }
.main-container { min-height: calc(100vh - var(--pages-review-height)); }
.pages-review-host .app-review, .pages-review-host .customer-mode.app-review { height: calc(100dvh - var(--pages-review-height)); min-height: 0; }
@media (max-width: 700px) { .pages-review-host .customer-mode .phone-frame.native-frame { height: calc(100dvh - var(--pages-review-height)); min-height: 0; } }
@media (max-width: 700px) { .pages-review-detail { display: none; } .pages-review-bar { padding: 0 8px; font-size: 11px; } .pages-review-bar nav { gap: 9px; } }
</style>
