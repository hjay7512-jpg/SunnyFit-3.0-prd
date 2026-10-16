<template>
  <div class="app-container content-access" data-testid="content-management-page">
    <header class="page-header"><div><h1>Content Management</h1><p>Manage scope labels and their associated content within each content type.</p></div><el-button icon="el-icon-refresh" :loading="loading" @click="load">Refresh</el-button></header>
    <el-alert v-if="error" :title="error" type="error" :closable="false"/>
    <el-tabs v-model="contentType" data-testid="managed-content-types"><el-tab-pane v-for="type in types" :key="type.value" :name="type.value"><span slot="label">{{ type.label }} <span class="type-count">{{ typeCount(type.value) }}</span><el-tag v-if="type.value==='limited_challenge'" size="mini" type="info">P3</el-tag></span></el-tab-pane></el-tabs>

    <div v-loading="loading" class="scope-workspace">
      <aside class="scope-list" aria-label="Scope labels">
        <div class="scope-list-heading"><strong>Scope Labels</strong><el-button type="text" icon="el-icon-plus" data-testid="new-scope" @click="editScope(null)">New</el-button></div>
        <button v-for="scope in typeScopes" :key="scope.code" type="button" class="scope-list-item" :class="{selected:scope.code===scopeCode}" :aria-pressed="String(scope.code===scopeCode)" :data-testid="'scope-label-'+scope.code" @click="scopeCode=scope.code"><span><strong>{{ scope.name }}</strong><small>{{ scope.code }}<span v-if="scope.status==='disabled'"> · Disabled</span></small></span><span class="scope-count">{{ membersOf(scope.code).length }}</span></button>
        <p v-if="!typeScopes.length && !loading" class="empty-scopes">No scopes for this content type. Create a label to begin.</p>
      </aside>

      <section class="scope-contents" aria-label="Associated content">
        <template v-if="selectedScope">
          <div class="selected-scope-heading"><div><span class="scope-breadcrumb">{{ selectedType.label }} / Scope</span><h2>{{ selectedScope.name }} <el-tag v-if="selectedScope.status==='disabled'" size="mini" type="info">Disabled</el-tag></h2><p>{{ members.length }} associated {{ members.length===1?'item':'items' }} · Each content item belongs to one scope.</p></div><div class="scope-actions"><el-button size="small" @click="editScope(selectedScope)">Edit Label</el-button><el-button type="primary" size="small" icon="el-icon-plus" :disabled="loading || selectedScope.status!=='active'" data-testid="add-library-content" @click="openLibrary">Add from {{ selectedType.library }}</el-button></div></div>
          <el-alert v-if="selectedScope.status==='disabled'" type="info" :closable="false" title="This scope is disabled. Existing associations remain; new content cannot be added."/>
          <el-input v-model="memberSearch" placeholder="Search associated content by ID or name" clearable class="member-search"/>
          <el-table :data="memberPage" border size="small" data-testid="scope-members" empty-text="No content is associated with this scope. Add items from the matching content library.">
            <el-table-column prop="name" label="Content Name" min-width="200"/><el-table-column prop="id" label="Content ID" min-width="180" show-overflow-tooltip/>
            <el-table-column label="Status" width="105"><template slot-scope="s"><el-tag size="mini" :type="s.row.status==='active'?'success':'info'">{{ s.row.status==='active'?'Active':'Disabled' }}</el-tag></template></el-table-column>
            <el-table-column label="Actions" width="160"><template slot-scope="s"><el-button type="text" :disabled="!moveTargets.length" :data-testid="'move-content-'+s.row.id" @click="openMove(s.row)">Move</el-button><el-button type="text" @click="$router.push('/commercialization/content/'+s.row.id)">View</el-button></template></el-table-column>
          </el-table>
          <div class="pagination-container"><el-pagination :current-page.sync="memberPageNumber" :page-size="10" :total="filteredMembers.length" layout="total, prev, pager, next"/></div>
        </template>
        <div v-else class="scope-empty"><i class="el-icon-collection"/><p>Select a scope label for {{ selectedType.label }}.</p></div>
      </section>
    </div>

    <el-dialog :title="'Add from '+selectedType.library" :visible.sync="libraryVisible" width="920px" :close-on-click-modal="false" custom-class="content-library-dialog">
      <div v-if="selectedScope" class="library-target"><span>{{ selectedType.label }}</span><i class="el-icon-arrow-right"/><strong>{{ selectedScope.name }}</strong></div>
      <p class="library-explanation">Select content from this library. Content already in this scope is unavailable for selection. Adding content from another scope moves its association.</p>
      <div class="library-tools"><el-input v-model="librarySearch" placeholder="Search library by ID or name" clearable data-testid="library-search"/><el-select v-model="libraryFilter" aria-label="Library association filter"><el-option label="All content in this library" value="all"/><el-option label="Not in this scope" value="other"/></el-select></div>
      <el-alert v-if="dialogError" type="error" :title="dialogError" :closable="false"/>
      <el-table ref="libraryTable" v-loading="busy" :data="libraryPage" row-key="id" border size="small" max-height="370" data-testid="scope-library" @selection-change="librarySelection=$event"><el-table-column type="selection" width="45" :selectable="canSelect"/><el-table-column prop="name" label="Content Name" min-width="205"/><el-table-column prop="id" label="Content ID" min-width="160" show-overflow-tooltip/><el-table-column label="Current Scope" min-width="170"><template slot-scope="s"><el-tag size="mini" :type="s.row.scope===scopeCode?'info':'warning'">{{ scopeName(s.row.scope) }}</el-tag><small v-if="s.row.scope===scopeCode" class="already-associated">Already associated</small></template></el-table-column></el-table>
      <div class="library-pagination"><span>{{ librarySelection.length }} selected</span><el-pagination :current-page.sync="libraryPageNumber" :page-size="10" :total="filteredLibrary.length" layout="total, prev, pager, next"/></div>
      <span slot="footer"><el-button :disabled="busy" @click="libraryVisible=false">Cancel</el-button><el-button :disabled="busy" @click="refreshLibrary">Refresh Library</el-button><el-button type="primary" :disabled="!librarySelection.length || busy" :loading="busy" data-testid="confirm-library-add" @click="addSelected">Add {{ librarySelection.length }} {{ librarySelection.length===1?'Item':'Items' }}</el-button></span>
    </el-dialog>

    <el-dialog title="Move Content" :visible.sync="moveVisible" width="500px" :close-on-click-modal="false"><template v-if="moving"><p><strong>{{ moving.name }}</strong></p><p>Current scope: {{ scopeName(moving.scope) }}</p><el-select v-model="moveTarget" placeholder="Choose a scope for this content type" class="move-target"><el-option v-for="scope in moveTargets" :key="scope.code" :value="scope.code" :label="scope.name"/></el-select><p class="field-help">The old association will be replaced. The content will belong only to the selected scope.</p><el-alert v-if="dialogError" type="error" :title="dialogError" :closable="false"/></template><span slot="footer"><el-button :disabled="busy" @click="moveVisible=false">Cancel</el-button><el-button type="primary" :disabled="!moveTarget" :loading="busy" @click="moveContent">Move Content</el-button></span></el-dialog>

    <el-dialog :title="originalScope?'Edit Scope Label':'New Scope Label'" :visible.sync="scopeVisible" width="510px" :close-on-click-modal="false"><p class="scope-form-type">Content type: <strong>{{ selectedType.label }}</strong></p><el-form ref="scopeForm" :model="scopeForm" label-width="110px" :disabled="busy"><el-form-item label="Scope Name" prop="name" :rules="[{required:true,message:'Enter a scope name.',trigger:'blur'}]"><el-input v-model.trim="scopeForm.name" maxlength="80" data-testid="scope-name"/></el-form-item><el-form-item label="Scope Code" prop="code" :rules="[{required:true,pattern:/^[a-z][a-z0-9_]{2,63}$/,message:'Use 3–64 lowercase letters, numbers or underscores.',trigger:'blur'}]"><el-input v-model.trim="scopeForm.code" :disabled="!!originalScope" placeholder="e.g. strength_series" data-testid="scope-code"/></el-form-item><el-form-item label="Status"><el-select v-model="scopeForm.status"><el-option label="Active" value="active"/><el-option label="Disabled" value="disabled"/></el-select></el-form-item></el-form><p class="field-help">This label belongs to {{ selectedType.label }}. New labels are not automatically authorized in existing Suits.</p><el-alert v-if="dialogError" type="error" :title="dialogError" :closable="false"/><span slot="footer"><el-button :disabled="busy" @click="scopeVisible=false">Cancel</el-button><el-button type="primary" :loading="busy" @click="saveScope">Save Label</el-button></span></el-dialog>
  </div>
</template>

<script>
import { listConfigs, getContentScopes, createContentScope, saveContentScope, assignScopeContents } from '@/api/commerce'
const types = [
  { value: 'course', code: 'course_access', label: 'Course', library: 'Course Library' },
  { value: 'world_tour', code: 'world_tour_access', label: 'World Tour', library: 'World Tour Library' },
  { value: 'training_program', code: 'training_program_access', label: 'Training Program', library: 'Training Program Library' },
  { value: 'movement', code: 'movement_access', label: 'Movement', library: 'Movement Library' },
  { value: 'limited_challenge', code: 'challenge_access', label: 'Limited Challenge', library: 'Challenge Library' }
]
export default {
  name: 'EntitlementContentManagement',
  data() { return { types, contentType: types.some(type => type.value === this.$route.query.type) ? this.$route.query.type : 'course', scopeCode: this.$route.query.scope || '', items: [], scopes: [], loading: false, busy: false, error: '', dialogError: '', memberSearch: '', memberPageNumber: 1, libraryVisible: false, librarySearch: '', libraryFilter: 'all', libraryPageNumber: 1, librarySelection: [], moveVisible: false, moving: null, moveTarget: '', scopeVisible: false, originalScope: null, scopeForm: { name: '', code: '', status: 'active' } } },
  computed: {
    selectedType() { return types.find(type => type.value === this.contentType) },
    typeScopes() { return this.scopes.filter(scope => scope.entitlementCode === this.selectedType.code) },
    selectedScope() { return this.typeScopes.find(scope => scope.code === this.scopeCode) },
    library() { return this.items.filter(row => row.published && row.published.contentType === this.contentType).map(row => ({ id: row.id, revision: row.revision, name: row.published.name, status: row.published.status, scope: this.mapping(row.published) })) },
    members() { return this.membersOf(this.scopeCode) },
    filteredMembers() { return this.members.filter(row => this.matches(row, this.memberSearch)) },
    memberPage() { return this.filteredMembers.slice((this.memberPageNumber - 1) * 10, this.memberPageNumber * 10) },
    filteredLibrary() { return this.library.filter(row => this.matches(row, this.librarySearch) && (this.libraryFilter === 'all' || row.scope !== this.scopeCode)) },
    libraryPage() { return this.filteredLibrary.slice((this.libraryPageNumber - 1) * 10, this.libraryPageNumber * 10) },
    moveTargets() { return this.typeScopes.filter(scope => scope.status === 'active' && scope.code !== this.scopeCode) }
  },
  watch: {
    contentType() { this.scopeCode = this.typeScopes.find(scope => scope.status === 'active')?.code || this.typeScopes[0]?.code || ''; this.memberSearch = ''; this.memberPageNumber = 1; this.libraryVisible = false; this.moveVisible = false; this.scopeVisible = false },
    scopeCode() { this.memberSearch = ''; this.memberPageNumber = 1 }, memberSearch() { this.memberPageNumber = 1 },
    librarySearch() { this.libraryPageNumber = 1; this.clearLibrarySelection() }, libraryFilter() { this.libraryPageNumber = 1; this.clearLibrarySelection() }, libraryPageNumber() { this.clearLibrarySelection() }
  },
  created() { this.load() },
  methods: {
    mapping(config) { return config.contentScope || (config.tier === 'free' ? config.freeScope || 'free_content' : 'premium_content') },
    typeCount(type) { return this.items.filter(row => row.published?.contentType === type).length },
    membersOf(code) { return this.library.filter(row => row.scope === code) },
    scopeName(code) { return this.typeScopes.find(scope => scope.code === code)?.name || code },
    matches(row, value) { return `${row.id} ${row.name}`.toLowerCase().includes(value.trim().toLowerCase()) },
    canSelect(row) { return row.scope !== this.scopeCode && !this.busy },
    clearLibrarySelection() { this.librarySelection = []; if (this.$refs.libraryTable) this.$refs.libraryTable.clearSelection() },
    async load() { this.loading = true; this.error = ''; try { const [items, scopes] = await Promise.all([listConfigs('content'), getContentScopes()]); this.items = items; this.scopes = scopes; if (!this.selectedScope) this.scopeCode = this.typeScopes.find(scope => scope.status === 'active')?.code || this.typeScopes[0]?.code || '' } catch (error) { this.error = error.message } finally { this.loading = false } },
    openLibrary() { this.librarySearch = ''; this.libraryFilter = 'all'; this.libraryPageNumber = 1; this.dialogError = ''; this.libraryVisible = true; this.$nextTick(this.clearLibrarySelection) },
    async refreshLibrary() { this.busy = true; await this.load(); this.clearLibrarySelection(); this.dialogError = this.error; this.busy = false },
    payload(rows, scope) { return { contentType: this.contentType, scope: scope.code, scopeRevision: scope.revision, confirmReassignment: true, items: rows.map(row => ({ id: row.id, revision: row.revision, fromScope: row.scope })) } },
    async addSelected() {
      if (!this.librarySelection.length || !this.selectedScope || this.busy) return
      try { await this.$confirm(`Move ${this.librarySelection.length} selected item(s) to “${this.selectedScope.name}”? Their current scope associations will be replaced. Each item will belong only to this scope.`, 'Confirm Scope Associations', { confirmButtonText: 'Confirm and Add', type: 'warning' }) } catch (_) { return }
      this.busy = true; this.dialogError = ''
      try { const result = await assignScopeContents(this.payload(this.librarySelection, this.selectedScope)); this.libraryVisible = false; await this.load(); this.$message.success(`${result.changed} content association(s) updated.`) } catch (error) { this.dialogError = error.message + ' Refresh the library before retrying.' } finally { this.busy = false }
    },
    openMove(row) { this.moving = row; this.moveTarget = ''; this.dialogError = ''; this.moveVisible = true },
    async moveContent() { const target = this.moveTargets.find(scope => scope.code === this.moveTarget); if (!target || !this.moving || this.busy) return; this.busy = true; this.dialogError = ''; try { await assignScopeContents(this.payload([this.moving], target)); this.moveVisible = false; await this.load(); this.$message.success(`Content moved to ${target.name}.`) } catch (error) { this.dialogError = error.message } finally { this.busy = false } },
    editScope(scope) { this.originalScope = scope; this.scopeForm = scope ? { ...scope } : { name: '', code: '', status: 'active', entitlementCode: this.selectedType.code }; this.dialogError = ''; this.scopeVisible = true; this.$nextTick(() => this.$refs.scopeForm?.clearValidate()) },
    async saveScope() { try { await this.$refs.scopeForm.validate() } catch (_) { return } this.busy = true; this.dialogError = ''; try { const scope = this.originalScope ? await saveContentScope(this.scopeForm, this.originalScope.revision) : await createContentScope(this.scopeForm); await this.load(); this.scopeCode = scope.code; this.scopeVisible = false; this.$message.success('Scope label saved.') } catch (error) { this.dialogError = error.message } finally { this.busy = false } }
  }
}
</script>

<style scoped>
.content-access .page-header p { max-width: 850px; }
.type-count { color: #909399; margin-left: 5px; font-size: 12px; font-weight: 400; }
.scope-workspace { display: grid; grid-template-columns: 230px minmax(0, 1fr); min-height: 440px; border: 1px solid #e4e7ed; border-radius: 4px; overflow: hidden; }
.scope-list { background: #fafbfc; border-right: 1px solid #e4e7ed; padding: 14px 0; }
.scope-list-heading { padding: 0 16px 10px; display: flex; justify-content: space-between; align-items: center; color: #606266; }
.scope-list-item { display: flex; justify-content: space-between; align-items: center; gap: 12px; width: 100%; padding: 15px 16px; background: transparent; border: 0; border-left: 3px solid transparent; color: #606266; text-align: left; cursor: pointer; }
.scope-list-item:hover { background: #f0f4f9; }
.scope-list-item.selected { background: #ecf5ff; border-left-color: #409eff; color: #1678ca; }
.scope-list-item strong { display: block; font-size: 13px; font-weight: 500; }
.scope-list-item small { display: block; margin-top: 6px; font-size: 11px; color: #909399; overflow-wrap: anywhere; }
.scope-count { flex-shrink: 0; padding: 2px 7px; border-radius: 8px; background: #e9eef5; font-size: 11px; }
.scope-contents { min-width: 0; padding: 22px; }
.selected-scope-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; flex-wrap: wrap; margin-bottom: 20px; }
.scope-breadcrumb { font-size: 12px; color: #909399; }
.selected-scope-heading h2 { margin: 7px 0; font-size: 20px; font-weight: 500; color: #303133; }
.selected-scope-heading p { margin: 0; font-size: 12px; color: #909399; line-height: 1.6; }
.scope-actions { display: flex; gap: 8px; }
.scope-actions .el-button + .el-button { margin-left: 0; }
.member-search { max-width: 350px; margin: 0 0 15px; }
.scope-empty { padding: 90px 10px; text-align: center; color: #909399; }
.scope-empty i { font-size: 35px; }
.empty-scopes { padding: 15px; font-size: 12px; color: #909399; line-height: 1.7; }
.library-target { display: flex; gap: 12px; align-items: center; padding: 12px 15px; background: #f1f7fd; border-radius: 4px; color: #53687f; }
.library-explanation { color: #909399; font-size: 12px; line-height: 1.7; }
.library-tools { display: flex; gap: 12px; margin: 15px 0; }
.library-tools .el-input { flex: 1; }
.library-tools .el-select { width: 230px; }
.already-associated { display: block; margin-top: 4px; color: #909399; }
.library-pagination { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; font-size: 12px; color: #909399; }
.move-target { width: 100%; }
.scope-form-type { margin: 0 0 20px; color: #606266; }
.content-access >>> .el-dialog { max-width: calc(100vw - 32px); }
@media(max-width: 1000px) { .scope-workspace { grid-template-columns: 195px minmax(0, 1fr); } .scope-contents { padding: 16px; } }
@media(max-width: 720px) { .scope-workspace { grid-template-columns: 1fr; } .scope-list { border-right: 0; border-bottom: 1px solid #e4e7ed; } .scope-list-item { padding: 10px 16px; } .library-tools { flex-direction: column; } .library-tools .el-select { width: 100%; } }
</style>
