<template>
  <span>
    <el-button plain icon="el-icon-document" data-testid="interaction-notes" @click="visible=true">交互说明</el-button>
    <el-drawer :visible.sync="visible" :title="title + ' · 功能逻辑与交互说明'" size="480px" append-to-body>
      <div class="notes-content">
        <p class="notes-intro">供原型评审及开发交付使用。字段提示和操作反馈在实际页面中保留。</p>
        <section v-for="(note,index) in notes" :key="index" class="note-block">
          <h3><span class="note-number">{{ index + 1 }}</span>{{ note.title }}</h3>
          <p>{{ note.rule }}</p>
          <p v-if="note.interaction"><strong>交互：</strong>{{ note.interaction }}</p>
          <code v-if="note.api">{{ note.api }}</code>
        </section>
      </div>
    </el-drawer>
  </span>
</template>
<script>export default { name: 'InteractionNotes', props: { title: { type: String, required: true }, notes: { type: Array, required: true } }, data() { return { visible: false } } }</script>
