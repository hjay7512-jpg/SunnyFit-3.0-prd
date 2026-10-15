<template>
  <div class="app-container" data-testid="suits-page">
    <div class="page-header">
      <div><h1>Entitlement Suits</h1><p>Configure feature access and Credits benefits with versioned publishing.</p></div>
      <div class="page-actions"><interaction-notes title="Entitlement Suits" :notes="notes" /><el-button type="primary" icon="el-icon-plus" data-testid="new-suit" @click="$router.push('/commercialization/suits/create')">New Suit</el-button></div>
    </div>
    <el-form inline class="filter-container" @submit.native.prevent="search">
      <el-form-item><el-input v-model="filters.search" class="search-input" placeholder="Suit name / code" prefix-icon="el-icon-search" clearable @keyup.enter.native="search" /></el-form-item>
      <el-form-item><el-select v-model="filters.type" class="filter-select" placeholder="All types" clearable @change="search"><el-option label="Base" value="base" /><el-option label="Additional" value="additional" /></el-select></el-form-item>
      <el-form-item><el-select v-model="filters.status" class="filter-select" placeholder="All statuses" clearable @change="search"><el-option label="Active" value="active" /><el-option label="Disabled" value="disabled" /><el-option label="Unpublished draft" value="draft" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" icon="el-icon-search" @click="search">Search</el-button><el-button icon="el-icon-refresh-left" @click="reset">Reset</el-button></el-form-item>
    </el-form>
    <div v-if="error" class="error-state"><el-alert :title="error" type="error" :closable="false" /><el-button @click="load">Retry</el-button></div>
    <el-table v-else v-loading="loading" :data="pageItems" row-key="id" border empty-text="No suits match your filters." data-testid="suits-table">
      <el-table-column label="Suit" min-width="225"><template slot-scope="scope"><div class="item-name">{{ scope.row.name }} <el-tag v-if="scope.row.systemDefault" type="info" size="mini" effect="plain">System default</el-tag></div><div class="item-code">{{ scope.row.code }}</div></template></el-table-column>
      <el-table-column label="Type" width="110"><template slot-scope="scope"><el-tag :type="scope.row.type === 'base' ? '' : 'warning'" size="mini" effect="plain">{{ scope.row.type === 'base' ? 'Base' : 'Additional' }}</el-tag></template></el-table-column>
      <el-table-column prop="itemCount" label="Items" width="70" align="center" />
      <el-table-column label="Used By" min-width="225"><template slot-scope="scope"><div class="tag-list"><el-tag v-for="name in scope.row.usedBy" :key="name" size="mini" type="info" effect="plain">{{ name }}</el-tag></div><span class="muted">{{ scope.row.activeGrantCount }} active grants</span></template></el-table-column>
      <el-table-column label="Version" min-width="125"><template slot-scope="scope"><span>{{ scope.row.publishedVersion ? 'v' + scope.row.publishedVersion : 'Not published' }}</span><div v-if="scope.row.hasDraft" class="muted">Draft pending</div></template></el-table-column>
      <el-table-column label="Status" width="95"><template slot-scope="scope"><el-tag :type="scope.row.status === 'active' ? 'success' : scope.row.status === 'draft' ? 'warning' : 'info'" size="mini">{{ statusLabel(scope.row.status) }}</el-tag></template></el-table-column>
      <el-table-column label="Updated" min-width="170"><template slot-scope="scope"><span class="quota-text">{{ dateTime(scope.row.updatedAt) }}</span></template></el-table-column>
      <el-table-column label="Action" width="145" fixed="right"><template slot-scope="scope"><el-button type="text" @click="$router.push('/commercialization/suits/' + scope.row.id)">Configure</el-button><el-tooltip :content="scope.row.deletable ? 'Delete unused suit' : 'System default or referenced suit cannot be deleted'" placement="top"><span><el-button type="text" :disabled="!scope.row.deletable || deleting === scope.row.id" class="delete-action" @click="remove(scope.row)">Delete</el-button></span></el-tooltip></template></el-table-column>
    </el-table>
    <div class="pagination-container"><el-pagination :current-page.sync="page" :page-size.sync="size" :page-sizes="[5,10,20]" :total="items.length" layout="total, sizes, prev, pager, next" @size-change="page=1" /></div>
  </div>
</template>
<script>
import { getSuits, deleteSuit } from '@/api/commercialization'
import { dateTime } from '@/utils/format'
import InteractionNotes from '@/components/InteractionNotes'
import { suitListNotes } from '../notes'
export default {
  name: 'EntitlementSuits', components: { InteractionNotes },
  data() { return { items: [], filters: { search: '', type: '', status: '' }, page: 1, size: 10, loading: false, deleting: '', error: '', notes: suitListNotes } },
  computed: { pageItems() { return this.items.slice((this.page - 1) * this.size, this.page * this.size) } },
  created() { this.load() },
  methods: {
    dateTime,
    statusLabel(status) { return { active: 'Active', disabled: 'Disabled', draft: 'Draft' }[status] },
    async load() { this.loading = true; this.error = ''; try { this.items = await getSuits(this.filters) } catch (error) { this.error = error.message } finally { this.loading = false } },
    search() { this.page = 1; this.load() },
    reset() { this.filters = { search: '', type: '', status: '' }; this.search() },
    async remove(row) {
      try { await this.$confirm(`Delete "${row.name}"? This unused suit and its configuration history will be removed.`, 'Delete Entitlement Suit', { type: 'warning', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' }) } catch (_) { return }
      this.deleting = row.id
      try { await deleteSuit(row.id, row.revision); this.$message.success('Unused suit deleted.'); await this.load() } catch (_) {} finally { this.deleting = '' }
    }
  }
}
</script>
<style scoped>.delete-action { margin-left: 12px; color: #f56c6c; }.delete-action.is-disabled { color: #c0c4cc; }</style>
