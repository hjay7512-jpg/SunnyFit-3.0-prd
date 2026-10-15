<template>
  <div class="app-container" data-testid="catalog-page">
    <div class="page-header">
      <div><h1>Entitlement Catalog</h1><p>System-supported capabilities and their configuration boundaries.</p></div>
      <div class="page-actions"><el-tag type="info" effect="plain">Read only</el-tag><interaction-notes title="Entitlement Catalog" :notes="notes" /></div>
    </div>
    <el-alert class="module-notice" title="Catalog items are initialized by the server. Configure scopes and benefits in Entitlement Suits." type="info" :closable="false" show-icon />
    <el-form inline class="filter-container" @submit.native.prevent="search">
      <el-form-item><el-input v-model="keyword" class="search-input" placeholder="Item name / code" clearable prefix-icon="el-icon-search" data-testid="catalog-search" @keyup.enter.native="search" /></el-form-item>
      <el-form-item><el-select v-model="category" class="filter-select" placeholder="All entitlement types" clearable @change="search"><el-option label="Content Access" value="Content Access" /><el-option label="Feature Access" value="Feature Access" /><el-option label="Consumable Credits" value="Consumable Credits" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" icon="el-icon-search" @click="search">Search</el-button><el-button icon="el-icon-refresh-left" @click="reset">Reset</el-button></el-form-item>
    </el-form>
    <div v-if="error" class="error-state"><el-alert :title="error" type="error" :closable="false" /><el-button @click="load">Retry</el-button></div>
    <el-table v-else v-loading="loading" :data="pageItems" row-key="code" border empty-text="No entitlement items match your filters." data-testid="catalog-table">
      <el-table-column label="Item" min-width="230"><template slot-scope="scope"><div class="item-name">{{ scope.row.name }}</div><div class="item-code">{{ scope.row.code }}</div></template></el-table-column>
      <el-table-column prop="category" label="Entitlement Type" min-width="160" />
      <el-table-column label="Configuration" min-width="260"><template slot-scope="scope"><div v-if="scope.row.type==='content_access'" class="tag-list"><el-tag v-for="option in catalogScopeOptions(scope.row)" :key="option.code" :title="option.description" size="mini" effect="plain">{{ option.label }}</el-tag></div><span v-else-if="scope.row.type==='feature_access'">Available when included in a Suit</span><span v-else>{{ scope.row.creditType }}</span></template></el-table-column>
      <el-table-column label="Policy" min-width="220"><template slot-scope="scope">{{ scope.row.type==='content_access'?'Select content scopes':scope.row.type==='feature_access'?'Feature access; no Scope or Quota':'Amount · Grant rule · Expiration' }}</template></el-table-column>
      <el-table-column label="Status" width="100"><template slot-scope="scope"><el-tag size="mini" type="success">{{ scope.row.status === 'supported' ? 'Supported' : scope.row.status }}</el-tag></template></el-table-column>
      <el-table-column label="Action" width="85" fixed="right"><template slot-scope="scope"><el-button type="text" @click="view(scope.row)">View</el-button></template></el-table-column>
    </el-table>
    <div class="pagination-container"><el-pagination :current-page.sync="page" :page-size.sync="size" :page-sizes="[5,10,20]" :total="filtered.length" layout="total, sizes, prev, pager, next" @size-change="page=1" /></div>
    <el-dialog :title="selected ? selected.name : 'Entitlement Item'" :visible.sync="dialog" width="660px">
      <div v-loading="detailLoading" style="min-height:120px">
        <el-alert v-if="detailError" :title="detailError" type="error" :closable="false" />
        <dl v-if="selected && !detailError" class="read-detail">
          <dt>Item Code</dt><dd class="item-code">{{ selected.code }}</dd>
          <dt>Entitlement Type</dt><dd>{{ selected.category }}</dd>
          <dt>Status</dt><dd><el-tag size="mini" type="success">Supported</el-tag></dd>
          <dt>Description</dt><dd>{{ selected.description }}</dd>
          <template v-if="selected.type==='content_access'"><dt>Content Scopes</dt><dd><div class="tag-list"><el-tag v-for="option in catalogScopeOptions(selected)" :key="option.code" :title="option.description" size="mini" effect="plain">{{ option.label }}</el-tag></div></dd></template>
          <template v-else-if="selected.type==='feature_access'"><dt>Authorization</dt><dd>Adding this Item to a Suit grants feature access. Scope and Quota are not configured.</dd></template>
          <template v-else><dt>Credit Type</dt><dd>{{ selected.creditType }}</dd><dt>Grant Configuration</dt><dd>Amount, Grant rule and Expiration. Balance is maintained in the corresponding wallet.</dd></template>
          <dt>Checked At</dt><dd>{{ selected.checkAt }}</dd>
          <dt>Consumption</dt><dd>{{ selected.type==='consumable_credits'?'Credit types have independent balances. Service consumption units are not defined yet.':'Access rights and consumable assets are managed separately.' }}</dd>
        </dl>
      </div>
      <span slot="footer"><el-button @click="dialog=false">Close</el-button></span>
    </el-dialog>
  </div>
</template>
<script>
import { getCatalog, getCatalogItem } from '@/api/commercialization'
import InteractionNotes from '@/components/InteractionNotes'
import {catalogScopeOptions} from '@/utils/format'
import { catalogNotes } from '../notes'
export default {
  name: 'EntitlementCatalog', components: { InteractionNotes },
  data() { return { items: [], keyword: '', appliedKeyword: '', category: '', page: 1, size: 10, loading: false, error: '', dialog: false, selected: null, detailLoading: false, detailError: '', notes: catalogNotes } },
  computed: {
    filtered() { const term = this.appliedKeyword.toLowerCase(); return this.items.filter(item => (!this.category || item.category === this.category) && `${item.name} ${item.code}`.toLowerCase().includes(term)) },
    pageItems() { return this.filtered.slice((this.page - 1) * this.size, this.page * this.size) }
  },
  created() { this.load() },
  methods: {
    catalogScopeOptions,
    async load() { this.loading = true; this.error = ''; try { this.items = await getCatalog() } catch (error) { this.error = error.message } finally { this.loading = false } },
    search() { this.appliedKeyword = this.keyword.trim(); this.page = 1 },
    reset() { this.keyword = ''; this.appliedKeyword = ''; this.category = ''; this.page = 1 },
    async view(row) { this.dialog = true; this.selected = null; this.detailError = ''; this.detailLoading = true; try { this.selected = await getCatalogItem(row.code) } catch (error) { this.detailError = error.message } finally { this.detailLoading = false } }
  }
}
</script>
