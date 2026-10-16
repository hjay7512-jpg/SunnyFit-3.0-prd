<template>
  <main class="business-rules-page" data-testid="business-rules-page">
    <div class="business-rules-shell">
      <header class="business-rules-page-header">
        <div>
          <span class="business-rules-eyebrow">SUNNYFIT · COMMERCIALIZATION REVIEW</span>
          <h1>Global business rules</h1>
          <p>权益类型、业务关系、权益组合、套餐与订单的统一定义。此处集中维护跨模块规则，后台菜单只保留操作原型。</p>
        </div>
        <el-button icon="el-icon-back" @click="backToAdmin">{{ backLabel }}</el-button>
      </header>

      <section id="module-business-description" class="module-business-card" data-testid="module-business-description">
        <div class="module-business-heading">
          <div><span class="module-business-kicker">当前模块的业务说明</span><h2>{{ scope.title }}</h2></div>
          <el-tag :type="priorityType" effect="dark">{{ scope.priority }}</el-tag>
        </div>
        <p class="module-business-description">{{ scope.description }}</p>
        <div class="module-business-context">
          <span class="module-context-label">迭代优先级</span>
          <span>{{ scope.priorityNote }}</span>
        </div>
        <div class="module-business-footer">
          <span><i class="el-icon-connection"/> 已定位规则：{{ topicName }} · {{ nodeName }}</span>
          <router-link :to="moduleTarget">打开对应原型 <i class="el-icon-arrow-right"/></router-link>
        </div>
      </section>

      <div class="business-rules-source">
        <i class="el-icon-info"/>
        <span>业务定义参考 Entitlement Item List v10（2026-10-14）；交付优先级参考 <a href="https://sunnyfit.atlassian.net/wiki/pages/resumedraft.action?draftId=2013822999&amp;draftShareId=4798d139-4752-4063-b79b-e2a7c29ba497" target="_blank" rel="noopener noreferrer">MVP Scope and Upcoming Plan（2026-10-16）</a>。MVP 是当前交付范围，P1–P3 为后续阶段；页面操作为评审原型。</span>
      </div>

      <business-review />
    </div>
  </main>
</template>

<script>
import BusinessReview from '@/components/BusinessReview'
import { implementationScopes } from '@/router/modules/commercialization-scope'
import { topics, entities } from '@/components/BusinessReview/model.cjs'

export default {
  name: 'BusinessRulesPage',
  components: { BusinessReview },
  computed: {
    moduleKey() { return Object.prototype.hasOwnProperty.call(implementationScopes, this.$route.query.module) ? this.$route.query.module : 'overview' },
    scope() { return implementationScopes[this.moduleKey] },
    topic() { return topics.find(item => item.id === (this.$route.query.topic || this.scope.businessTopic)) || topics[0] },
    topicName() { return this.topic.name },
    nodeName() {
      const node = this.topic.nodes.find(item => item.id === this.$route.query.node) || this.topic.nodes.find(item => item.id === this.scope.businessNode) || this.topic.nodes[0]
      return node.title || (node.entity && entities[node.entity].name) || node.id
    },
    priorityType() { return { MVP: 'success', P1: 'warning', P2: 'info', P3: 'info', Review: '', Demo: 'info' }[this.scope.priority] || '' },
    backLabel() { return this.validReturnPath ? '返回后台模块' : '返回后台概览' },
    validReturnPath() { return typeof this.$route.query.from === 'string' && this.$route.query.from.indexOf('/commercialization/') === 0 },
    moduleTarget() { return '/commercialization/' + (this.moduleKey === 'overview' || this.moduleKey === 'operations' ? 'overview' : this.moduleKey) }
  },
  mounted() {
    this.$nextTick(() => {
      const section = document.getElementById('module-business-description')
      if (section && this.$route.query.module) section.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
  },
  methods: {
    backToAdmin() { this.$router.push(this.validReturnPath ? this.$route.query.from : this.moduleTarget) }
  }
}
</script>

<style scoped>
.business-rules-page { min-height: 100vh; padding: 34px 28px 56px; background: #f4f6f9; color: #263449; }
.business-rules-shell { width: min(1440px, 100%); margin: 0 auto; }
.business-rules-page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 22px; }
.business-rules-eyebrow { color: #7a8899; font-size: 11px; letter-spacing: 1px; }
.business-rules-page-header h1 { margin: 8px 0; font-size: 26px; font-weight: 600; }
.business-rules-page-header p { max-width: 850px; margin: 0; color: #65758b; font-size: 14px; line-height: 1.7; }
.module-business-card { scroll-margin-top: 56px; margin-bottom: 16px; padding: 21px 24px; border: 1px solid #dce4ef; border-left: 4px solid #4b8acb; border-radius: 8px; background: #fff; box-shadow: 0 3px 12px rgba(30, 54, 83, .04); }
.module-business-heading { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.module-business-kicker { color: #7a8899; font-size: 11px; letter-spacing: .4px; }
.module-business-heading h2 { margin: 5px 0 0; font-size: 18px; font-weight: 600; line-height: 1.45; }
.module-business-description { margin: 14px 0; color: #40546d; font-size: 14px; line-height: 1.75; }
.module-business-context { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 12px; padding: 12px 14px; border-radius: 6px; background: #f4f8fd; color: #526a85; font-size: 13px; line-height: 1.65; }
.module-context-label { color: #73869d; }
.module-business-footer { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 15px; color: #63778d; font-size: 12px; }
.module-business-footer a { color: #216bae; white-space: nowrap; }
.business-rules-source { display: flex; align-items: flex-start; gap: 9px; margin: 0 0 22px; color: #6b7d91; font-size: 12px; line-height: 1.65; }
.business-rules-source i { margin-top: 2px; color: #7c9abd; }
@media(max-width: 700px) {
  .business-rules-page { padding: 22px 14px 36px; }
  .business-rules-page-header { flex-direction: column; gap: 14px; }
  .business-rules-page-header h1 { font-size: 22px; }
  .module-business-card { padding: 17px; }
  .module-business-context { grid-template-columns: 1fr; gap: 4px; }
  .module-business-footer { align-items: flex-start; flex-direction: column; gap: 10px; }
}
</style>
