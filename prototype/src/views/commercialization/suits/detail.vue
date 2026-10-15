<template>
  <div class="app-container" data-testid="suit-detail-page">
    <div class="page-header">
      <div><h1>{{ isCreate ? 'New Entitlement Suit' : suit ? suit.name : 'Configure Suit' }}</h1><p>{{ isCreate ? 'Create a draft, then review and publish the configuration.' : 'Saved drafts do not change live access. Published versions preserve existing purchased periods.' }}</p></div>
      <div class="page-actions"><el-button icon="el-icon-back" @click="$router.push('/commercialization/suits')">Back</el-button><el-button v-if="!isCreate" :disabled="!history.length || busy" icon="el-icon-time" @click="historyVisible=true">Versions</el-button><interaction-notes title="Suit Configuration" :notes="notes" /></div>
    </div>
    <div v-if="loadError" class="error-state"><el-alert :title="loadError" type="error" :closable="false" /><el-button @click="load">Retry</el-button></div>
    <div v-else v-loading="loading" class="detail-grid">
      <div>
        <el-alert v-if="conflict" class="conflict-alert" type="warning" :closable="false" show-icon title="This configuration changed in another session."><div>Your edits are still here. Reload the current configuration before saving.<el-button type="text" @click="reload">Reload current configuration</el-button></div></el-alert>
        <el-alert v-if="errors.length" class="conflict-alert" type="error" :closable="false" title="Check the configuration"><ul><li v-for="(error,index) in errors" :key="index">{{ error }}</li></ul></el-alert>
        <el-tabs v-if="!isCreate" v-model="activeTab">
          <el-tab-pane label="Configuration / Draft" name="draft" />
          <el-tab-pane :label="suit && suit.publishedVersion ? 'Published v' + suit.publishedVersion : 'Published'" name="published" :disabled="!suit || !suit.published" />
        </el-tabs>
        <div v-if="activeTab === 'published' && suit && suit.published" class="published-panel">
          <el-alert type="info" :closable="false" show-icon title="Read-only published snapshot. Changes belong in the Configuration / Draft tab." />
          <section class="section-card"><h2 class="section-title">Published Configuration</h2><div class="section-body">
            <dl class="read-detail published-basic"><dt>Suit Name</dt><dd>{{ suit.published.name }}</dd><dt>Code</dt><dd>{{ suit.published.code }}</dd><dt>Type / Status</dt><dd>{{ typeLabel(suit.type) }} / {{ suit.published.status }}</dd><dt>Description</dt><dd>{{ suit.published.description || '—' }}</dd><dt>Credit Grants</dt><dd>{{ benefitsLabel(suit.published) }}</dd><dt>Model</dt><dd>{{ suit.published.modelVersion===2?'Typed entitlements':'Legacy snapshot' }}</dd></dl>
            <el-table :data="suit.published.items" border><el-table-column label="Entitlement" min-width="210"><template slot-scope="scope">{{ definition(scope.row.code).name }}</template></el-table-column><el-table-column label="Type" min-width="150"><template slot-scope="scope">{{ entitlementTypeLabel(definition(scope.row.code).type) }}</template></el-table-column><el-table-column label="Authorization" min-width="170"><template slot-scope="scope">{{ labels(scope.row) }}</template></el-table-column></el-table>
          </div></section>
        </div>
        <el-form v-if="!loading" v-show="activeTab === 'draft'" ref="form" :model="form" :rules="rules" label-width="140px" class="suit-form" :disabled="busy">
          <section class="section-card"><h2 class="section-title">Basic Information</h2><div class="section-body">
            <el-form-item label="Suit Name" prop="name"><el-input v-model.trim="form.name" maxlength="80" show-word-limit placeholder="Name used in the admin" data-testid="suit-name" /></el-form-item>
            <el-form-item label="Suit Code" prop="code"><el-input v-model.trim="form.code" :disabled="!isCreate" maxlength="64" placeholder="e.g. premium_plus" data-testid="suit-code" /><div class="field-help">Unique lowercase code. Fixed after creation.</div></el-form-item>
            <el-form-item label="Type" prop="type"><el-select v-model="form.type" :disabled="!isCreate" data-testid="suit-type"><el-option label="Base" value="base" /><el-option label="Additional" value="additional" /></el-select><div class="field-help">One Base suit per user. Additional suits can coexist. Type is fixed after creation.</div></el-form-item>
            <el-form-item label="Status" prop="status"><el-select v-model="form.status" :disabled="!!(suit && suit.systemDefault)" data-testid="suit-status"><el-option label="Active" value="active" /><el-option label="Disabled" value="disabled" /></el-select><div class="field-help">{{ suit && suit.systemDefault ? 'The system Free suit must remain Active.' : 'Disabled stops eligibility for new grants after publishing; existing grants retain their version.' }}</div></el-form-item>
            <el-form-item label="Description" prop="description"><el-input v-model="form.description" type="textarea" :rows="3" maxlength="1000" show-word-limit placeholder="Purpose and relevant business context" data-testid="suit-description" /></el-form-item>
          </div></section>
          <section class="section-card"><h2 class="section-title">Entitlement Configuration</h2><div class="section-body">
            <el-alert v-if="needsUpgrade" class="module-notice" type="info" :closable="false" title="Upgrade preview: historical snapshots remain unchanged. Save and publish a new version to use typed entitlements." />
            <div class="add-item-bar"><el-select v-model="newItem" placeholder="Select an entitlement item" filterable data-testid="add-item-select"><el-option v-for="entry in availableItems" :key="entry.code" :label="entry.name" :value="entry.code" /></el-select><el-button icon="el-icon-plus" :disabled="!newItem || busy" data-testid="add-item" @click="addItem">Add Item</el-button></div>
            <el-form-item prop="items" label-width="0">
              <div v-for="spec in form.items" :key="spec.code" class="entitlement-row" :data-testid="'item-' + spec.code">
                <div class="entitlement-row-head"><div><div class="item-name">{{ definition(spec.code).name }}</div><div class="item-code">{{ spec.code }}</div></div><el-tooltip :content="form.items.length === 1 && !form.creditGrants.length ? 'At least one item is required' : 'Remove this item from the draft'" placement="top"><span><el-button type="text" :disabled="form.items.length === 1 && !form.creditGrants.length || busy" @click="removeItem(spec.code)">Remove</el-button></span></el-tooltip></div>
                <div class="entitlement-row-fields">
                  <div v-if="definition(spec.code).type==='content_access'"><div class="field-label">Content Scopes <span style="color:#f56c6c">*</span></div><el-select v-model="spec.scopes" multiple class="scope-select" placeholder="Choose content scopes" :data-testid="'scope-' + spec.code"><el-option v-for="scope in definition(spec.code).scopes" :key="scope.code" :label="scope.label" :value="scope.code" /></el-select><el-button type="text" @click="spec.scopes=definition(spec.code).scopes.map(scope=>scope.code)">Select all scopes</el-button><div class="field-help">Stores the selected scopes. Future scopes are not automatically included.</div></div>
                  <div v-else :data-testid="'feature-' + spec.code"><div class="field-label">Feature Access</div><p>Available when this Item is included in the Suit.</p></div>
                </div>
              </div>
              <el-empty v-if="!form.items.length" description="Add at least one entitlement item." :image-size="65" />
            </el-form-item>
            <div class="field-help">An included item grants access. Credits availability is checked independently for new LLM work; Featured content redemption is separate.</div>
          </div></section>
          <el-alert v-if="needsUpgrade" class="module-notice" type="info" :closable="false" title="Legacy included-service quantities remain on purchased snapshots. The new version uses separate access rights and credit grants; consumption units remain undefined." />
          <section class="section-card"><h2 class="section-title">Consumable Credits / Grant Rules</h2><div class="section-body" data-testid="credit-grants">
            <p class="field-help">Monthly adds a new grant. Expiration applies to each grant; purchased balances are never reset.</p>
            <div v-for="(grant,index) in form.creditGrants" :key="index" class="entitlement-row">
              <el-form-item label="Credit Type"><el-select v-model="grant.creditType"><el-option v-for="type in creditTypes" :key="type.code" :label="type.name" :value="type.code" :disabled="form.creditGrants.some((other,i)=>i!==index&&other.creditType===type.code)" /></el-select></el-form-item>
              <el-form-item label="Amount"><el-input-number v-model="grant.amount" :min="1" :max="1000000" :precision="0" controls-position="right" data-testid="credits-amount" /></el-form-item>
              <el-form-item label="Grant Rule"><p v-if="form.type==='base'">Monthly, from the membership start date in the subscription time zone.</p><el-select v-else v-model="grant.cadence"><el-option label="Monthly" value="monthly" /><el-option label="Per grant cycle" value="billing_cycle" /><el-option label="One time" value="one_time" /></el-select></el-form-item>
              <el-form-item label="Expiration"><p v-if="form.type==='base'">Expires at the next monthly refresh. No rollover.</p><template v-else><el-select v-model="grant.expiration"><el-option label="Grant cycle end" value="membership_cycle" /><el-option label="Grant period end" value="grant_period" /><el-option label="Days after grant" value="days" /><el-option label="No expiry" value="never" /></el-select><el-input-number v-if="grant.expiration==='days'" v-model="grant.validityDays" :min="1" :max="3650" :precision="0" /></template></el-form-item>
              <el-button type="text" @click="form.creditGrants.splice(index,1)">Remove grant</el-button>
            </div>
            <el-empty v-if="!form.creditGrants.length" description="Add a Consumable Credits Item above to configure a grant." :image-size="50" />
          </div></section>
          <div class="save-bar">
            <div class="save-actions"><el-button type="primary" :loading="action === 'save'" :disabled="busy || (!isCreate && !isDirty && !needsUpgrade)" data-testid="save-draft" @click="save">{{ isCreate ? 'Create Draft' : 'Save Draft' }}</el-button><el-button v-if="!isCreate" :disabled="busy" data-testid="preview-changes" @click="preview">Preview Changes</el-button><el-button v-if="!isCreate" type="success" :loading="action === 'publish'" :disabled="busy || isDirty || !hasSavedDraft || !hasPublishedChanges" data-testid="publish-suit" @click="publish">Publish</el-button><el-button v-if="!isCreate && hasSavedDraft && suit.publishedVersion" :disabled="busy" @click="discard">Discard Draft</el-button></div>
            <span class="muted">{{ isDirty ? 'Unsaved changes' : hasSavedDraft ? 'Saved draft · not yet effective' : 'Matches published configuration' }}</span>
          </div>
        </el-form>
      </div>
      <aside class="detail-sidebar">
        <section class="section-card"><h2 class="section-title">Publication &amp; Usage</h2><div class="section-body sidebar-metadata">
          <div class="metadata-line"><span>Published version</span><el-tag size="mini" :type="suit && suit.publishedVersion ? '' : 'info'">{{ suit && suit.publishedVersion ? 'v' + suit.publishedVersion : 'Not published' }}</el-tag></div>
          <div class="metadata-line"><span>Configuration</span><span>{{ isDirty ? 'Unsaved' : hasSavedDraft ? 'Saved draft' : 'Published' }}</span></div>
          <div class="metadata-line"><span>Active grants</span><strong>{{ impact.existingGrants.length }}</strong></div>
          <div class="field-label" style="margin-top:18px">Used by</div><div class="tag-list"><el-tag v-if="suit && suit.systemDefault" size="mini" type="info">Free Account</el-tag><el-tag v-for="product in impact.products" :key="product.id" size="mini" type="info" effect="plain">{{ product.name }}</el-tag><span v-if="!impact.products.length && !(suit && suit.systemDefault)" class="muted">No linked products</span></div>
          <p>Publishing creates a new version for future grants. Existing purchased periods keep the version they received.</p>
          <p v-if="suit" class="muted">Updated {{ dateTime(suit.updatedAt) }}</p>
        </div></section>
        <section class="section-card"><h2 class="section-title">Existing Grant Versions</h2><div class="section-body">
          <div v-for="grant in impact.existingGrants" :key="grant.id" class="grant-row"><div class="grant-row-head"><span>{{ grant.userName }}</span><el-tag size="mini" effect="plain">v{{ grant.version }}</el-tag></div><div class="item-code">{{ grant.userId }}</div><div class="muted">{{ grant.source }}</div><div class="muted">{{ grant.expiresAt ? 'Until ' + dateTime(grant.expiresAt) : 'No expiry' }}</div></div>
          <p v-if="!impact.existingGrants.length" class="muted">No active grants. Saving this configuration does not grant it to users.</p>
        </div></section>
      </aside>
    </div>
    <el-dialog title="Preview Changes" :visible.sync="previewVisible" width="820px">
      <div v-if="previewData"><el-alert type="info" :closable="false" show-icon :title="'Proposed v' + previewData.nextVersion + ' · existing grants stay on their original versions'" />
        <div v-for="change in previewData.changes" :key="change.field" class="change-block"><strong>{{ fieldLabel(change.field) }}</strong><el-row :gutter="15"><el-col :span="12"><div class="field-label">Published</div><pre>{{ formatChange(change.field,change.before) }}</pre></el-col><el-col :span="12"><div class="field-label">Proposed</div><pre>{{ formatChange(change.field,change.after) }}</pre></el-col></el-row></div>
        <p v-if="!previewData.changes.length" class="muted">No changes from the published version.</p><p class="muted">{{ previewData.existingGrants.length }} active grants retain their original configuration. This preview does not save or publish.</p>
      </div><span slot="footer"><el-button @click="previewVisible=false">Close</el-button></span>
    </el-dialog>
    <el-dialog title="Published Version History" :visible.sync="historyVisible" width="860px">
      <el-table :data="history" border><el-table-column label="Version" width="95"><template slot-scope="scope">v{{ scope.row.version }}</template></el-table-column><el-table-column label="Published" min-width="170"><template slot-scope="scope">{{ dateTime(scope.row.publishedAt) }}</template></el-table-column><el-table-column prop="config.name" label="Name" min-width="170" /><el-table-column label="Credit Grants" min-width="230"><template slot-scope="scope">{{ benefitsLabel(scope.row.config) }}</template></el-table-column><el-table-column label="Action" width="85"><template slot-scope="scope"><el-button type="text" @click="selectedVersion=scope.row">View</el-button></template></el-table-column></el-table>
      <div v-if="selectedVersion" class="section-body published-panel" data-testid="version-snapshot"><h3>v{{ selectedVersion.version }} · {{ selectedVersion.config.name }}</h3><p>{{ selectedVersion.config.description }}</p><p>Credit grants: {{ benefitsLabel(selectedVersion.config) }}</p><el-table :data="selectedVersion.config.items" border><el-table-column label="Item" min-width="210"><template slot-scope="scope">{{ definition(scope.row.code).name }}</template></el-table-column><el-table-column label="Authorization" min-width="150"><template slot-scope="scope">{{ labels(scope.row) }}</template></el-table-column></el-table></div>
      <span slot="footer"><el-button @click="historyVisible=false">Close</el-button></span>
    </el-dialog>
  </div>
</template>
<script>
import { getCatalog, getSuit, createSuit, saveSuit, previewSuit, publishSuit, discardSuit, getSuitHistory, getSuitImpact } from '@/api/commercialization'
import { dateTime, scopeLabel } from '@/utils/format'
import InteractionNotes from '@/components/InteractionNotes'
import { suitDetailNotes } from '../notes'
import { listConfigs } from '@/api/commerce'
const clone = value => JSON.parse(JSON.stringify(value))
const defaults = () => ({ modelVersion:2,policyVersion:20261014, name: '', code: '', type: 'base', status: 'active', description: '', items: [], includedServices: [], creditGrants:[] })
import { normalizeSuit, entitlementTypeLabel, creditTypeLabel, creditGrantLabel } from '@/utils/entitlements'
import { getCreditTypes } from '@/api/commerce'
const integerRule = (min,max) => ({ validator: (_,value,callback) => Number.isSafeInteger(value) && value >= min && value <= max ? callback() : callback(new Error(`Use an integer between ${min} and ${max}.`)), trigger: 'change' })
export default {
  name: 'EntitlementSuitConfigure', components: { InteractionNotes },
  data() {
    return {
      catalog: [], creditTypes:[], services: [], suit: null, form: defaults(), baseline: '', previousScopes: {}, newItem: '', activeTab: 'draft', loading: true, loadError: '', action: '', errors: [], conflict: false, navigationBypass: false,
      impact: { products: [], existingGrants: [] }, history: [], historyVisible: false, selectedVersion: null, previewVisible: false, previewData: null, notes: suitDetailNotes,
      rules: {
        name: [{ required: true, message: 'Enter a suit name.', trigger: 'blur' }, { min: 1, max: 80, message: 'Use 1–80 characters.', trigger: 'blur' }],
        code: [{ required: true, message: 'Enter a unique suit code.', trigger: 'blur' }, { pattern: /^[a-z][a-z0-9_]{2,63}$/, message: 'Use 3–64 lowercase letters, numbers or underscores; start with a letter.', trigger: 'blur' }],
        type: [{ required: true, message: 'Select a type.', trigger: 'change' }], status: [{ required: true, message: 'Select a status.', trigger: 'change' }],
        description: [{ max: 1000, message: 'Use at most 1,000 characters.', trigger: 'blur' }],
        items: [{ validator: (_,value,callback) => !value.length&&!this.form.creditGrants.length ? callback(new Error('Add an access Item or credit grant.')) : value.some(entry => this.definition(entry.code).type==='content_access'&&!entry.scopes.length) ? callback(new Error('Choose content scopes.')) : callback(), trigger: 'change' }]
      }
    }
  },
  computed: {
    isCreate() { return this.$route.name === 'EntitlementSuitCreate' },
    busy() { return !!this.action },
    isDirty() { return !!this.baseline && JSON.stringify(this.form) !== this.baseline },
    hasSavedDraft() { return !!(this.suit && this.suit.draft) },
    hasPublishedChanges() { return this.suit && this.suit.draft && JSON.stringify(this.suit.draft) !== JSON.stringify(this.suit.published) },
    needsUpgrade(){return !!(this.suit&&(this.suit.draft||this.suit.published).policyVersion!==20261014)},
    availableItems() { return this.catalog.filter(entry => !this.form.items.some(spec => spec.code === entry.code)&&!this.form.creditGrants.some(grant=>grant.creditType===entry.creditType)) }
  },
  created() { this.load(); window.addEventListener('beforeunload', this.beforeUnload) },
  beforeDestroy() { window.removeEventListener('beforeunload', this.beforeUnload) },
  beforeRouteLeave(to,from,next) { this.guardNavigation(next) },
  // Changing the suit id reuses the route record; Vue Router calls Update,
  // rather than Leave. Both paths must protect unsaved edits.
  beforeRouteUpdate(to,from,next) { this.guardNavigation(next) },
  methods: {
    dateTime,entitlementTypeLabel,creditTypeLabel,creditGrantLabel,
    guardNavigation(next) {
      if (!this.isDirty || this.navigationBypass) return next()
      this.$confirm('Leave this page and discard unsaved form changes? Any previously saved draft will remain.', 'Unsaved Changes', { type: 'warning', confirmButtonText: 'Leave', cancelButtonText: 'Stay' }).then(() => next()).catch(() => next(false))
    },
    typeLabel(type) { return type === 'base' ? 'Base' : 'Additional' },
    definition(code) { return this.catalog.find(entry => entry.code === code) || { name: code, scopes: [], quotaDefinition: { label: 'Unlimited' } } },
    labels(spec) { return spec.scopes?scopeLabel(this.definition(spec.code),spec.scopes):'Feature available' },
    benefitLabel(benefit) { return benefit&&benefit.amount ? `${benefit.amount} Legacy Credits · ${{ billing_cycle: 'per billing cycle', monthly: 'monthly', one_time: 'one time' }[benefit.cadence]} · ${benefit.validityDays} days validity` : 'No included Credits' },
    benefitsLabel(config){return config.creditGrants?config.creditGrants.map(creditGrantLabel).join('; ')||'No credit grants':this.benefitLabel(config.creditBenefit)},
    fieldLabel(field) { return { name: 'Suit Name', status: 'Status', description: 'Description', items: 'Access Rights', creditBenefit: 'Legacy Credits Benefit',creditGrants:'Credit Grant Rules',modelVersion:'Entitlement model' }[field]||field },
    formatChange(field,value) { if (value === null || value === undefined) return 'Not set'; if (field === 'includedServices') return JSON.stringify(value,null,2); if (field === 'items') return value.map(spec => `${this.definition(spec.code).name}: ${this.labels(spec)}`).join('\n'); if (field === 'creditBenefit') return this.benefitLabel(value);if(field==='creditGrants')return value.map(creditGrantLabel).join('\n')||'None'; return value || '—' },
    setForm(config) { this.form=normalizeSuit(config,this.catalog); this.baseline=JSON.stringify(this.form); this.$nextTick(()=>{if(this.$refs.form)this.$refs.form.clearValidate()}) },
    async load() {
      this.loading = true; this.loadError = ''; this.errors = []; this.conflict = false
      try {
        const [services,creditTypes]=await Promise.all([listConfigs('pricing'),getCreditTypes()]);this.services=services;this.creditTypes=creditTypes.filter(type=>!type.legacy&&!type.future);
        if (this.isCreate) { this.catalog = await getCatalog(); this.setForm(defaults()) }
        else { const [catalog,suit,impact,history] = await Promise.all([getCatalog(),getSuit(this.$route.params.id),getSuitImpact(this.$route.params.id),getSuitHistory(this.$route.params.id)]); this.catalog=catalog; this.suit=suit; this.impact=impact; this.history=history; this.setForm(suit.draft || suit.published) }
      } catch (error) { this.loadError = error.message } finally { this.loading = false }
    },
    async reload() { if (this.isDirty) { try { await this.$confirm('Reloading will replace your unsaved edits with the server configuration.', 'Reload Configuration', { type: 'warning', confirmButtonText: 'Reload', cancelButtonText: 'Keep edits' }) } catch (_) { return } } await this.load() },
    beforeUnload(event) { if (this.isDirty) { event.preventDefault(); event.returnValue = '' } },
    addItem() { if (!this.newItem) return;const item=this.definition(this.newItem);if(item.type==='consumable_credits')this.form.creditGrants.push({creditType:item.creditType,amount:1,cadence:'monthly',expiration:'grant_period',validityDays:30});else this.form.items.push(item.type==='content_access'?{code:item.code,scopes:[]}:{code:item.code});this.newItem='';this.$refs.form.validateField('items') },
    removeItem(code) { if (this.form.items.length <= 1 && !this.form.creditGrants.length) return; this.form.items = this.form.items.filter(entry => entry.code !== code); this.$delete(this.previousScopes,code) },
    valid() { return new Promise(resolve => this.$refs.form.validate(valid => resolve(valid))) },
    handleError(error) { this.errors = error.fields.length ? error.fields : [error.message]; this.conflict = error.reason === 'CONFIG_CHANGED' },
    async save() {
      if (this.busy || !(await this.valid())) return
      this.action='save'; this.errors=[]
      try {
        if (this.isCreate) { const suit=await createSuit(clone(this.form)); this.navigationBypass=true; this.baseline=JSON.stringify(this.form); await this.$store.dispatch('tagsView/deleteView',{ fullPath: this.$route.fullPath }); this.$message.success('Draft created. Review before publishing.'); this.$router.replace(`/commercialization/suits/${suit.id}`) }
        else { this.suit=await saveSuit(this.suit.id,clone(this.form),this.suit.revision); this.setForm(this.suit.draft); this.$message.success('Draft saved. Published configuration is unchanged.') }
      } catch (error) { this.handleError(error) } finally { this.action='' }
    },
    async preview() {
      if (this.busy || !(await this.valid())) return
      this.action='preview'; this.errors=[]
      try { this.previewData=await previewSuit(this.suit.id,clone(this.form)); this.previewVisible=true } catch (error) { this.handleError(error) } finally { this.action='' }
    },
    async publish() {
      if (this.busy || this.isDirty || !this.hasSavedDraft) return
      try { await this.$confirm(`Publish v${(this.suit.publishedVersion || 0) + 1}? Future grants will use this version. ${this.impact.existingGrants.length} active grants will keep their original versions.`, 'Publish Entitlement Suit', { type:'warning', confirmButtonText:'Publish', cancelButtonText:'Cancel' }) } catch (_) { return }
      this.action='publish'; this.errors=[]
      try { this.suit=await publishSuit(this.suit.id,this.suit.revision); this.setForm(this.suit.published); this.history=await getSuitHistory(this.suit.id); this.impact=await getSuitImpact(this.suit.id); this.$message.success(`v${this.suit.publishedVersion} published. Existing grant versions are unchanged.`) } catch (error) { this.handleError(error) } finally { this.action='' }
    },
    async discard() {
      if (this.busy) return
      try { await this.$confirm('Discard the saved draft and any unsaved form edits? The published version will remain.', 'Discard Draft', { type:'warning', confirmButtonText:'Discard', cancelButtonText:'Cancel' }) } catch (_) { return }
      this.action='discard'; this.errors=[]
      try { this.suit=await discardSuit(this.suit.id,this.suit.revision); this.setForm(this.suit.published); this.$message.success('Draft discarded. Published configuration retained.') } catch (error) { this.handleError(error) } finally { this.action='' }
    }
  }
}
</script>
