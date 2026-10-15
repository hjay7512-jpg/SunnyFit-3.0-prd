<template>
  <div class="app-container" :data-testid="entity+'-page'">
    <div class="page-header"><div><h1>{{ module.title }}</h1><p>{{ module.description }}</p></div><div class="page-actions"><content-scope-manager v-if="entity==='content'" @changed="load"/><interaction-notes :title="module.title" :notes="module.notes"/><el-button v-if="entity!=='content'" type="primary" icon="el-icon-plus" @click="open('create')">New {{ module.singular }}</el-button></div></div>
    <el-form inline class="filter-container" @submit.native.prevent="page=1"><el-form-item><el-input v-model="search" class="search-input" placeholder="Name / code" clearable prefix-icon="el-icon-search"/></el-form-item><el-form-item><el-select v-model="status" class="filter-select" clearable placeholder="All statuses"><el-option label="Active" value="active"/><el-option label="Disabled" value="disabled"/><el-option label="Draft" value="draft"/></el-select></el-form-item><el-form-item v-if="entity==='content'"><el-select v-model="contentType" clearable placeholder="All content types"><el-option v-for="type in contentTypes" :key="type" :value="type" :label="typeLabel(type)"/></el-select></el-form-item><el-form-item v-if="entity==='content'"><el-select v-model="tier" class="filter-select" clearable placeholder="All labels"><el-option v-for="type in ['free','premium','featured']" :key="type" :value="type" :label="typeLabel(type)"/></el-select></el-form-item><el-form-item><el-button icon="el-icon-refresh" @click="reset">Reset</el-button></el-form-item></el-form>
    <div v-if="error" class="error-state"><el-alert :title="error" type="error" :closable="false"/><el-button @click="load">Retry</el-button></div>
    <content-bulk v-if="entity==='content'" :selection="selection" @changed="load"/>
    <el-table v-if="!error" v-loading="loading" :data="pageItems" row-key="id" border empty-text="No matching configurations." @selection-change="selection=$event">
      <el-table-column v-if="entity==='content'" type="selection" width="48"/>
      <el-table-column label="Name" min-width="240"><template slot-scope="s"><div class="item-name">{{ s.row.name }}</div><div class="item-code">{{ s.row.code }}</div></template></el-table-column>
      <el-table-column v-if="entity==='products'" label="Kind" width="110"><template slot-scope="s"><el-tag size="mini" effect="plain">{{ typeLabel(display(s.row).kind) }}</el-tag></template></el-table-column>
      <el-table-column v-if="entity==='products'" label="Fulfillment" min-width="200"><template slot-scope="s">{{ display(s.row).kind==='membership' ? references[display(s.row).suitId] : display(s.row).credits.amount+' '+creditTypeLabel(display(s.row).credits.creditType||'LEGACY_CREDIT')+' · '+(display(s.row).credits.validityDays===null?'No expiry':display(s.row).credits.validityDays+' days') }}</template></el-table-column>
      <el-table-column v-if="entity==='products'" label="SKUs" width="70"><template slot-scope="s">{{ display(s.row).skus.length }}</template></el-table-column>
      <el-table-column v-if="entity==='content'" label="Type" width="160"><template slot-scope="s">{{ typeLabel(display(s.row).contentType) }}</template></el-table-column>
      <el-table-column v-if="entity==='content'" label="Content Scope" min-width="150"><template slot-scope="s">{{ display(s.row).contentScope||'Legacy mapping' }}</template></el-table-column>
      <el-table-column v-if="entity==='content'" label="Label" width="105"><template slot-scope="s"><el-tag size="mini" :type="display(s.row).tier==='featured'?'warning':display(s.row).tier==='premium'?'':'success'">{{ typeLabel(display(s.row).tier) }}</el-tag></template></el-table-column>
      <el-table-column v-if="entity==='content'" label="Redemption" min-width="185"><template slot-scope="s">{{ display(s.row).tier!=='featured'?'—':display(s.row).redemptionCredits===null?'Amount not configured':display(s.row).redemptionCredits+' '+creditTypeLabel(display(s.row).redemptionCreditType||'LEGACY_CREDIT') }}<div class="muted" v-if="display(s.row).tier==='featured'">{{ display(s.row).redemptionValidityDays ? display(s.row).redemptionValidityDays+' days (historical)' : 'Permanent unlock' }}</div></template></el-table-column>
      <el-table-column v-if="entity==='pricing'" label="Authorization / Unit" min-width="235"><template slot-scope="s"><div>{{ display(s.row).billingModel==='feature'?display(s.row).entitlementCode:display(s.row).creditType?creditTypeLabel(display(s.row).creditType):display(s.row).entitlementCode }}</div><div class="muted">{{ display(s.row).policyVersion===20261014?display(s.row).billingModel==='feature'?'Feature access · no Credits':'Per User Turn':'Historical service policy' }}</div></template></el-table-column>
      <el-table-column v-if="entity==='pricing'" label="Consumption" min-width="145"><template slot-scope="s">{{ display(s.row).billingModel==='feature'?'No Credits used':display(s.row).credits===null?'Amount not configured':display(s.row).credits+' Credits' }}</template></el-table-column>
      <el-table-column v-if="entity==='campaigns'" label="Kind" width="135"><template slot-scope="s">{{ typeLabel(display(s.row).kind) }}</template></el-table-column>
      <el-table-column v-if="entity==='campaigns'" label="Benefit" min-width="225"><template slot-scope="s"><div>{{ display(s.row).suitId ? references[display(s.row).suitId] : 'Credits only' }}</div><div class="muted">{{ display(s.row).creditAmount }} extra Credits · {{ display(s.row).creditValidityDays }} days</div></template></el-table-column>
      <el-table-column label="Version" width="125"><template slot-scope="s">{{ s.row.publishedVersion ? 'v'+s.row.publishedVersion : 'Not published' }}<div v-if="s.row.hasDraft" class="muted">Draft pending</div></template></el-table-column>
      <el-table-column label="Status" width="100"><template slot-scope="s"><el-tag size="mini" :type="s.row.status==='active'?'success':s.row.status==='draft'?'warning':'info'">{{ typeLabel(s.row.status) }}</el-tag></template></el-table-column>
      <el-table-column label="Updated" min-width="165"><template slot-scope="s"><span class="quota-text">{{ dateTime(s.row.updatedAt) }}</span></template></el-table-column>
      <el-table-column label="Action" width="150" fixed="right"><template slot-scope="s"><el-button type="text" @click="open(s.row.id)">Configure</el-button><el-button v-if="!s.row.publishedVersion" type="text" class="danger-text" @click="remove(s.row)">Delete</el-button></template></el-table-column>
    </el-table>
    <div class="pagination-container"><el-pagination :current-page.sync="page" :page-size="10" :total="filtered.length" layout="total, prev, pager, next"/></div>
    <div v-if="entity==='content'" class="module-links"><el-button type="text" @click="$router.push('/commercialization/redemptions')">View redemption records</el-button><span class="muted">Program selection and included workout starts are checked separately.</span></div>
    <div v-if="entity==='campaigns'" class="module-links"><el-button type="text" @click="$router.push('/commercialization/campaign-runs')">View delivery records</el-button></div>
  </div>
</template>
<script>
import { listConfigs, deleteConfig } from '@/api/commerce'
import { getSuits } from '@/api/commercialization'
import { modules, typeLabel } from '../commerce-definitions'
import { dateTime } from '@/utils/format'
import {creditTypeLabel} from '@/utils/entitlements'
import InteractionNotes from '@/components/InteractionNotes'
import ContentBulk from '@/components/Commerce/ContentBulk'
import ContentScopeManager from '@/components/Commerce/ContentScopeManager'
export default {
  name: 'CommerceConfigurations', components: { InteractionNotes, ContentBulk, ContentScopeManager }, props: { entity: { type: String, required: true } },
  data() { return { items: [], selection: [], references: {}, search: '', status: '', contentType: '', tier: '', page: 1, loading: false, error: '', contentTypes: ['course','world_tour','training_program','movement','limited_challenge'] } },
  computed: {
    module() { return modules[this.entity] },
    filtered() { const term=this.search.trim().toLowerCase(); return this.items.filter(row => (!this.status || row.status===this.status) && (!this.contentType || this.display(row).contentType===this.contentType) && (!this.tier || this.display(row).tier===this.tier) && `${row.name} ${row.code}`.toLowerCase().includes(term)) },
    pageItems() { return this.filtered.slice((this.page-1)*10,this.page*10) }
  },
  watch: { search() { this.page=1 }, status() { this.page=1 }, contentType() { this.page=1 }, tier() { this.page=1 } },
  created() { this.load() },
  methods: {
    typeLabel, dateTime, creditTypeLabel, display(row) { return row.published || row.draft },
    open(id) { this.$router.push(`/commercialization/${this.entity}/${id}`) },
    async load() { this.loading=true;this.error='';try { const [items,suits]=await Promise.all([listConfigs(this.entity),getSuits()]);this.items=items;this.references=Object.fromEntries(suits.map(row=>[row.id,row.name])) } catch(error){this.error=error.message} finally{this.loading=false} },
    reset() { this.search='';this.status='';this.contentType='';this.tier='';this.page=1 },
    async remove(row) { try { await this.$confirm('Delete this unpublished draft?', 'Delete Draft', { type:'warning',confirmButtonText:'Delete' }) } catch(_){return} try{await deleteConfig(this.entity,row.id,row.revision);this.$message.success('Draft deleted.');this.load()}catch(_){} }
  }
}
</script>
