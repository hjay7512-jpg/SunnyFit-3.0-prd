<template>
  <div class="bulk-bar" data-testid="content-bulk-tools">
    <span>{{ selection.length }} selected</span>
    <el-button type="primary" :disabled="!selection.length || busy" @click="open()">Set Content Scope</el-button>
    <el-button type="success" :disabled="!selection.length || selection.some(r=>!r.hasDraft) || busy" @click="publish">Publish Selected Drafts</el-button>
    <span class="muted">Scope is assigned per content type. Review each draft before publishing.</span>
    <el-dialog :title="singleRow ? 'Set Content Scope' : 'Bulk Content Scope'" :visible.sync="visible" width="700px" :close-on-click-modal="false">
      <el-alert title="Choose which fields to change. Unchecked fields and all other draft fields are preserved." type="info" :closable="false"/>
      <p>{{ selectedRows.map(r=>(r.draft||r.published||r).name).join(', ') }}</p>
      <el-form label-width="155px" :disabled="busy">
        <el-form-item label="Commercial Label">
          <el-switch v-model="applyTier" active-text="Also update the commercial label"/>
          <el-radio-group v-if="applyTier" v-model="tier" class="bulk-option-value">
            <el-radio-button label="free">Free</el-radio-button><el-radio-button label="premium">Premium</el-radio-button><el-radio-button label="featured">Independent unlock · P3</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Content Scope">
          <el-switch v-model="applyScopes" :disabled="loadingScopes" active-text="Set scope by content type" @change="onScopeToggle"/>
          <div v-if="applyScopes" class="bulk-scope-groups">
            <div v-for="group in scopeGroups" :key="group.entitlementCode" class="bulk-scope-row">
              <label>{{ group.label }} <span>({{ group.count }} selected)</span></label>
              <el-select v-model="scopeAssignments[group.entitlementCode]" :loading="loadingScopes" :disabled="busy || loadingScopes" placeholder="Select one scope">
                <el-option v-for="scope in group.options" :key="scope.code" :label="scope.name" :value="scope.code"/>
              </el-select>
              <small v-if="!group.options.length">No active scopes are configured for this content type.</small>
            </div>
          </div>
        </el-form-item>
        <template v-if="applyTier && tier==='featured'">
          <el-form-item label="Redemption Credits"><admin-number v-model="credits" :min="1" :max="1000000" :precision="0"/></el-form-item>
          <el-form-item label="Validity"><el-switch v-model="noExpiry" active-text="No expiry"/><div v-if="!noExpiry"><admin-number v-model="days" :min="1" :max="3650" :precision="0"/> days</div></el-form-item>
        </template>
      </el-form>
      <p class="field-help">Save creates drafts only; App access changes after publishing. Choose a scope separately for each content type. Unchanged items are skipped.</p>
      <el-alert v-if="scopeError" :title="scopeError" type="error" :closable="false"/>
      <span slot="footer"><el-button @click="visible=false">Cancel</el-button><el-button type="primary" :disabled="loadingScopes || !hasChanges || !validScopes" :loading="busy" @click="save">{{ singleRow ? 'Save Draft' : 'Save '+changedRows.length+' Drafts' }}</el-button></span>
    </el-dialog>
  </div>
</template>
<script>
import { bulkContent, getContentScopes } from '@/api/commerce'
import AdminNumber from '@/components/AdminNumber'
const typeDetails = {
  course: ['Course', 'course_access'], world_tour: ['World Tour', 'world_tour_access'],
  training_program: ['Training Program', 'training_program_access'], movement: ['Movement', 'movement_access'],
  limited_challenge: ['Limited Challenge', 'challenge_access']
}
export default {
  components: { AdminNumber },
  props: { selection: { type: Array, required: true } },
  data() { return { visible: false, busy: false, singleRow: null, loadingScopes: false, scopeError: '', scopes: [], scopeAssignments: {}, applyTier: false, applyScopes: false, tier: 'free', credits: 30, noExpiry: true, days: 365 } },
  computed: {
    selectedRows() { return this.singleRow ? [this.singleRow] : this.selection },
    scopeGroups() {
      const grouped = new Map()
      this.selectedRows.forEach(row => {
        const config = row.draft || row.published || {}
        const detail = typeDetails[config.contentType] || [config.contentType || 'Content', config.entitlementCode]
        const entitlementCode = config.entitlementCode || detail[1]
        if (!entitlementCode) return
        if (!grouped.has(entitlementCode)) grouped.set(entitlementCode, { entitlementCode, label: detail[0], rows: [] })
        grouped.get(entitlementCode).rows.push(row)
      })
      return [...grouped.values()].map(group => ({ ...group, count: group.rows.length, options: this.scopes.filter(scope => scope.entitlementCode === group.entitlementCode && scope.status === 'active') }))
    },
    changedRows() { return this.selectedRows.filter(row => { const config = row.draft || row.published || {}; const scope = config.contentScope || (config.tier === 'free' ? config.freeScope || 'free_content' : 'premium_content'); return (this.applyScopes && this.scopeAssignments[config.entitlementCode] && this.scopeAssignments[config.entitlementCode] !== scope) || (this.applyTier && (config.tier !== this.tier || (this.tier === 'featured' && (config.redemptionCredits !== this.credits || config.redemptionValidityDays !== (this.noExpiry ? null : this.days))))) }) },
    hasChanges() { return this.changedRows.length > 0 },
    validScopes() { return !this.applyScopes || (this.scopeGroups.length > 0 && this.scopeGroups.every(group => group.options.some(scope => scope.code === this.scopeAssignments[group.entitlementCode]))) }
  },
  methods: {
    async open(row) {
      this.singleRow = row && row.id ? row : null
      this.visible = true; this.applyTier = false; this.applyScopes = true; this.scopeError = ''; this.scopeAssignments = {}; this.loadingScopes = true
      try {
        this.scopes = await getContentScopes()
        this.scopeGroups.forEach(group => {
          const current = [...new Set(group.rows.map(row => { const config = row.draft || row.published || {}; return config.contentScope || (config.tier === 'free' ? (config.freeScope || 'free_content') : 'premium_content') }))]
          this.$set(this.scopeAssignments, group.entitlementCode, current.length === 1 ? current[0] : '')
        })
      } catch (error) { this.scopeError = error.message || 'Unable to load content scopes.' } finally { this.loadingScopes = false }
    },
    onScopeToggle(enabled) { if (enabled && !this.loadingScopes && !Object.keys(this.scopeAssignments).length) this.openScopesFromCurrent() },
    openScopesFromCurrent() {
      this.scopeGroups.forEach(group => {
        const current = [...new Set(group.rows.map(row => { const config = row.draft || row.published || {}; return config.contentScope || (config.tier === 'free' ? (config.freeScope || 'free_content') : 'premium_content') }))]
        this.$set(this.scopeAssignments, group.entitlementCode, current.length === 1 ? current[0] : '')
      })
    },
    items(rows = this.selectedRows) { return rows.map(row => ({ id: row.id, revision: row.revision })) },
    async save() {
      if (!this.hasChanges || !this.validScopes || this.loadingScopes) return
      this.busy = true
      try {
        const affectedTypes = new Set(this.changedRows.map(row => (row.draft || row.published || {}).entitlementCode))
        const assignments = Object.fromEntries(Object.entries(this.scopeAssignments).filter(([code]) => affectedTypes.has(code)))
        await bulkContent({ action: 'save', items: this.items(this.changedRows), ...(this.applyTier ? { tier: this.tier, redemptionCredits: this.tier === 'featured' ? this.credits : undefined, redemptionValidityDays: this.tier === 'featured' ? (this.noExpiry ? null : this.days) : undefined } : {}), ...(this.applyScopes ? { contentScopes: assignments } : {}) })
        this.visible = false; this.$message.success('Drafts saved. Review before publishing.'); this.$emit('changed')
      } catch (_) {} finally { this.busy = false }
    },
    async publish() {
      try { await this.$confirm(`Publish ALL saved draft fields on ${this.selection.length} selected records? New starts use the published scopes; existing access snapshots remain unchanged.`, 'Publish Content Drafts', { confirmButtonText: 'Publish', type: 'warning' }) } catch (_) { return }
      this.busy = true
      try { await bulkContent({ action: 'publish', items: this.items(this.selection) }); this.$emit('changed'); this.$message.success('Selected versions published.') } catch (_) {} finally { this.busy = false }
    }
  }
}
</script>
<style scoped>
.bulk-option-value { display: block; margin-top: 10px; }
.bulk-bar >>> .el-dialog { width: min(700px, calc(100vw - 32px)) !important; }
.bulk-scope-groups { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px; }
.bulk-scope-row { display: flex; flex-direction: column; gap: 7px; }
.bulk-scope-row label { color: #53687f; font-size: 12px; }
.bulk-scope-row label span,.bulk-scope-row small { color: #909399; }
@media(max-width: 650px) { .bulk-scope-groups { grid-template-columns: 1fr; } }
</style>
