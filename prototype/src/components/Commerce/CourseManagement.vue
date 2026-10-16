<template>
  <div class="app-container course-management" data-testid="content-page">
    <div class="course-heading">
      <div><h1>Course Management</h1><p>Courses, World Tour and Training Programs</p></div>
      <div class="course-heading-actions"><el-button @click="$router.push({path:'/commercialization/content-management',query:{type:contentType}})">Manage Access Scopes</el-button><el-button icon="el-icon-refresh" :loading="loading" @click="load">Refresh</el-button></div>
    </div>

    <div class="course-filters filter-container">
      <div class="course-filter-row"><label>Content Type :</label><el-radio-group v-model="contentType" size="small" data-testid="content-type-filter"><el-radio-button v-for="type in contentTypes" :key="type" :label="type">{{ typeLabel(type) }}<span v-if="type==='limited_challenge'" class="later-phase">P3</span></el-radio-button></el-radio-group></div>
      <div class="course-filter-row"><label>Content Scope :</label><el-select v-model="contentScope" clearable placeholder="ALL" size="small" data-testid="content-scope-filter"><el-option v-for="scope in scopeOptions" :key="scope.entitlementCode+':'+scope.code" :value="scope.entitlementCode+':'+scope.code" :label="scope.name+(contentType?'':' · '+scopeType(scope.entitlementCode))"/></el-select><el-tag size="mini" :type="contentType==='limited_challenge'?'info':'success'">{{ contentType==='limited_challenge'?'P3':'MVP' }}</el-tag></div>
      <div class="course-filter-row"><label>Status :</label><el-radio-group v-model="status" size="small"><el-radio-button label="">ALL</el-radio-button><el-radio-button label="active">Active</el-radio-button><el-radio-button label="disabled">Disabled</el-radio-button><el-radio-button label="draft">Draft pending</el-radio-button></el-radio-group></div>
      <el-form inline class="course-search" @submit.native.prevent="page=1"><el-form-item><el-input v-model="search" placeholder="Course ID / name" clearable size="small" data-testid="content-search"/></el-form-item><el-form-item><el-button type="primary" size="small" icon="el-icon-search" @click="page=1">Search</el-button><el-button size="small" @click="reset">Reset</el-button></el-form-item></el-form>
    </div>

    <el-alert v-if="error" :title="error" type="error" :closable="false"/>
    <el-table ref="table" v-loading="loading" :data="pageItems" row-key="id" border size="small" empty-text="No matching courses.">
      <el-table-column label="Course ID" width="180"><template slot-scope="s"><span class="course-id">{{ s.row.id }}</span></template></el-table-column>
      <el-table-column label="Thumbnail" width="85" align="center"><template slot-scope="s"><div class="course-thumbnail"><img v-if="thumbnail(s.row)" :src="thumbnail(s.row)" alt=""/><i v-else class="el-icon-picture-outline"/></div></template></el-table-column>
      <el-table-column :label="contentType==='training_program'?'Training Program Name':'Course Name'" min-width="230"><template slot-scope="s"><el-button type="text" class="course-name" @click="edit(s.row)">{{ current(s.row).name }}</el-button><div class="item-code">{{ s.row.code }}</div></template></el-table-column>
      <el-table-column label="Content Type" width="155"><template slot-scope="s">{{ typeLabel(current(s.row).contentType) }}</template></el-table-column>
      <el-table-column label="Duration" width="100"><template slot-scope="s">{{ current(s.row).durationMinutes ? current(s.row).durationMinutes+' min' : '—' }}</template></el-table-column>
      <el-table-column min-width="215" class-name="scope-column"><template slot="header">Content Scope <el-tag size="mini" type="success">MVP</el-tag></template><template slot-scope="s"><div class="published-scope">{{ scopeName(s.row.published || current(s.row)) }}</div><div v-if="scopeChanged(s.row)" class="pending-scope"><el-tag size="mini" type="warning">Draft</el-tag> {{ scopeName(s.row.draft) }}</div><span v-if="priority(s.row)==='P3'" class="scope-phase">P3 · independent unlock / Challenge</span></template></el-table-column>
      <el-table-column label="Status" width="125"><template slot-scope="s"><el-tag size="mini" :type="s.row.status==='active'?'success':'info'">{{ typeLabel(s.row.status) }}</el-tag><div v-if="s.row.hasDraft" class="draft-indicator">Draft pending</div></template></el-table-column>
      <el-table-column label="Updated" width="175"><template slot-scope="s">{{ dateTime(s.row.updatedAt) }}</template></el-table-column>
      <el-table-column label="Actions" width="185" fixed="right"><template slot-scope="s"><el-button type="text" @click="edit(s.row)">Edit</el-button></template></el-table-column>
    </el-table>
    <div class="pagination-container"><el-pagination :current-page.sync="page" :page-size="pageSize" :total="filtered.length" layout="total, prev, pager, next"/></div>
    <div class="course-footer"><span>Scope labels and content associations are maintained in Entitlement Management → Content Management.</span><router-link to="/commercialization/redemptions">Redemption records <el-tag size="mini" type="info">P3</el-tag></router-link></div>
  </div>
</template>

<script>
import { listConfigs, getContentScopes } from '@/api/commerce'
import { typeLabel } from '@/views/commercialization/commerce-definitions'
import { dateTime } from '@/utils/format'

export default {
  name: 'CourseManagement',
  data() { return { items: [], scopes: [], selection: [], search: '', contentType: ['course','world_tour','training_program','movement','limited_challenge'].includes(this.$route.query.type) ? this.$route.query.type : 'course', contentScope: '', status: '', page: 1, pageSize: 10, loading: false, error: '' } },
  computed: {
    contentTypes() { const present = new Set(this.items.map(row => this.current(row).contentType)); return ['course', 'world_tour', 'training_program', 'movement', 'limited_challenge'].filter(type => present.has(type)) },
    scopeOptions() { const codes = new Set(this.items.filter(row => !this.contentType || this.current(row).contentType === this.contentType).map(row => this.current(row).entitlementCode)); return this.scopes.filter(scope => codes.has(scope.entitlementCode)) },
    filtered() { const term = this.search.trim().toLowerCase(); return this.items.filter(row => { const item = this.current(row); return (!this.contentType || item.contentType === this.contentType) && (!this.contentScope || item.entitlementCode+':'+this.scopeCode(item) === this.contentScope) && (!this.status || (this.status === 'draft' ? row.hasDraft : row.status === this.status)) && (!term || `${row.id} ${item.name} ${row.code}`.toLowerCase().includes(term)) }) },
    pageItems() { return this.filtered.slice((this.page - 1) * this.pageSize, this.page * this.pageSize) }
  },
  watch: {
    search() { this.resetPage() }, status() { this.resetPage() }, contentScope() { this.resetPage() },
    contentType() { this.contentScope = ''; this.resetPage() },
    page() { this.clearSelection() }
  },
  created() { this.load() },
  methods: {
    typeLabel, dateTime,
    current(row) { return row.draft || row.published || {} },
    scopeType(code) { return { course_access: 'Course', world_tour_access: 'World Tour', training_program_access: 'Training Program', movement_access: 'Movement', challenge_access: 'Challenge' }[code] || code },
    scopeCode(config) { return config.contentScope || (config.tier === 'free' ? config.freeScope || 'free_content' : 'premium_content') },
    scopeName(config) { const code = this.scopeCode(config); const scope = this.scopes.find(item => item.entitlementCode === config.entitlementCode && item.code === code); return scope ? scope.name : code },
    scopeChanged(row) { return row.draft && (!row.published || this.scopeCode(row.draft) !== this.scopeCode(row.published)) },
    thumbnail(row) { const item = this.current(row); return typeof item.thumbnail === 'string' ? item.thumbnail : item.thumb && item.thumb.origin || '' },
    priority(row) { const item = this.current(row); return item.contentType === 'limited_challenge' || item.tier === 'featured' ? 'P3' : 'MVP' },
    edit(row) { this.$router.push('/commercialization/content/' + row.id) },
    clearSelection() { this.selection = []; if (this.$refs.table) this.$refs.table.clearSelection() },
    resetPage() { this.page = 1; this.clearSelection() },
    reset() { this.search = ''; this.contentType = 'course'; this.contentScope = ''; this.status = ''; this.resetPage() },
    async load() { this.loading = true; this.error = ''; this.clearSelection(); try { [this.items, this.scopes] = await Promise.all([listConfigs('content'), getContentScopes()]); this.page = Math.min(this.page, Math.max(1, Math.ceil(this.filtered.length / this.pageSize))) } catch (error) { this.error = error.message } finally { this.loading = false } }
  }
}
</script>

<style scoped>
.course-management { color: #606266; }
.course-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.course-heading h1 { margin: 0 0 7px; font-size: 20px; font-weight: 500; color: #303133; }
.course-heading p { margin: 0; color: #909399; font-size: 13px; }
.course-heading-actions { display: flex; gap: 10px; }
.course-filters { padding: 0 0 12px; margin-bottom: 12px; border-bottom: 1px solid #ebeef5; }
.course-filter-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.course-filter-row > label { flex: 0 0 115px; line-height: 32px; color: #606266; font-size: 13px; }
.course-filter-row .el-radio-group { display: flex; flex-wrap: wrap; row-gap: 8px; }
.course-filter-row > .el-tag { margin-top: 6px; }
.course-filter-row .el-select { width: 230px; }
.course-search { margin: 20px 0 0 127px; }
.course-search >>> .el-form-item { margin-bottom: 0; }
.course-search .el-input { width: 245px; }
.later-phase { margin-left: 7px; font-size: 10px; opacity: .7; }
.course-thumbnail { width: 48px; height: 36px; margin: 0 auto; display: grid; place-items: center; background: #f5f7fa; border: 1px solid #ebeef5; border-radius: 2px; color: #c0c4cc; font-size: 22px; overflow: hidden; }
.course-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
.course-id { color: #606266; font-size: 12px; overflow-wrap: anywhere; }
.course-name { padding: 0; text-align: left; white-space: normal; line-height: 1.5; }
.published-scope { color: #303133; }
.pending-scope { margin-top: 5px; color: #a36d16; }
.draft-indicator,.scope-phase { display: block; margin-top: 5px; color: #909399; font-size: 11px; line-height: 1.5; }
.course-footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; color: #909399; font-size: 12px; line-height: 1.7; }
.course-footer a { color: #409eff; }
@media (max-width: 760px) { .course-heading { flex-direction: column; } .course-filter-row > label { flex-basis: 98px; } .course-search { margin-left: 0; } .course-search >>> .el-form-item { margin-bottom: 8px; } }
</style>
