<template>
  <div class="app-container subscription-guides" data-testid="subscription-guides">
    <header class="page-header">
      <div>
        <h1>Subscription Guidance</h1>
        <p>Membership benefits and entitlement-based paywall introductions · V3.0.0 §4.1</p>
      </div>
      <div class="page-actions">
        <el-tag size="small" type="warning" effect="plain">Browser prototype · Local only</el-tag>
        <el-button size="small" :disabled="!dirty" @click="resetDraft">Discard changes</el-button>
        <el-button size="small" :disabled="!draft" @click="saveDraft">Save Draft</el-button>
        <el-button type="primary" size="small" :disabled="!draft" @click="publish">Publish preview version</el-button>
      </div>
    </header>
    <el-alert title="Prototype storage only" description="Drafts and published snapshots are saved in this browser. This does not update the production backend or the live SunnyFit app. Images are example assets until replaced." type="info" :closable="false" show-icon class="module-notice"/>
    <el-alert v-if="catalogError" type="warning" :closable="false" :title="catalogError" class="module-notice"/>
    <div class="guide-bar">
      <el-radio-group v-model="workspace" size="small" data-testid="guide-workspace">
        <el-radio-button label="membership">Membership Detail</el-radio-button>
        <el-radio-button label="scenes">Feature Paywalls</el-radio-button>
      </el-radio-group>
      <div class="guide-bar-right">
        <span class="muted">Editing language</span>
        <el-select v-model="locale" size="small" style="width:155px" data-testid="guide-locale">
          <el-option v-for="lang in availableLocales" :key="lang.code" :label="lang.label" :value="lang.code"/>
        </el-select>
        <el-popover placement="bottom-end" width="260" trigger="click">
          <div class="locale-menu"><div class="muted">Enable translations before publishing. English is the required fallback.</div>
            <el-checkbox v-for="lang in languages" :key="lang.code" :value="enabledLocales.includes(lang.code)" :disabled="lang.code==='en'" @change="toggleLocale(lang.code,$event)">{{ lang.label }}</el-checkbox>
          </div>
          <el-button slot="reference" size="small" icon="el-icon-s-tools">Languages</el-button>
        </el-popover>
        <el-button size="small" :type="referenceOpen?'primary':'default'" :icon="referenceOpen?'el-icon-arrow-right':'el-icon-picture-outline'" data-testid="toggle-ui-reference" :aria-expanded="String(referenceOpen)" @click="referenceOpen=!referenceOpen">{{ referenceOpen?'Hide UI reference':'Show UI reference' }}</el-button>
        <el-tag v-if="dirty" size="small" type="warning">Unsaved</el-tag>
        <el-tag v-else-if="meta.version" size="small" type="success">Published v{{ meta.version }}</el-tag>
        <el-tag v-else size="small" type="info">Unpublished</el-tag>
      </div>
    </div>
    <div v-if="draft" class="guide-layout" :class="{'reference-expanded':referenceOpen}">
      <div class="guide-editor">
        <template v-if="workspace==='membership'">
          <div class="section-heading"><div><h2>Membership page sections</h2><p>Three fixed sections. Enabled sections appear in descending Sort order.</p></div></div>
          <div class="section-select">
            <button v-for="id in sectionIds" :key="id" type="button" class="section-pill" :class="{active:sectionId===id}" @click="sectionId=id">
              <strong>{{ sectionName(id) }}</strong><small>{{ draft.membership[id].enabled?'On':'Off' }} · Sort {{ draft.membership[id].sort }}</small>
            </button>
          </div>
          <section class="edit-panel">
            <div class="edit-panel-heading"><h3>{{ sectionName(sectionId) }}</h3><div><span class="muted">Enable</span><el-switch v-model="currentSection.enabled" data-testid="guide-section-toggle"/></div></div>
            <div class="two-fields">
              <label><span>Sort <small>(larger first)</small></span><el-input-number v-model="currentSection.sort" :precision="0" :step="10" size="small" controls-position="right" data-testid="guide-sort"/></label>
              <label><span>Section title <small>max 30{{ sectionId==='faq'?' · optional':'' }}</small></span><el-input v-model="currentSection.title[locale]" maxlength="30" show-word-limit size="small"/></label>
            </div>
            <template v-if="sectionId==='comparison'">
              <div class="subheading"><h4>Benefits comparison</h4><el-button size="mini" icon="el-icon-plus" @click="addComparison">Add benefit</el-button></div>
              <article v-for="(row,index) in currentSection.rows" :key="row.id" class="entry-card">
                <div class="entry-title"><strong>Benefit {{ index+1 }}</strong><el-button type="text" size="mini" @click="currentSection.rows.splice(index,1)">Remove</el-button></div>
                <label>Benefit name · max 20<el-input v-model="row.name[locale]" maxlength="20" show-word-limit size="small"/></label>
                <div class="tier-grid">
                  <div v-for="tier in ['free','premium']" :key="tier"><div class="tier-heading"><b>{{ tier==='free'?'Free':'Premium' }}</b><el-switch v-model="row[tier].enabled" size="small"/></div>
                    <label>Description · optional<el-input v-model="row[tier].description[locale]" type="textarea" :rows="2" size="small" placeholder="Returned only when provided"/></label>
                  </div>
                </div>
              </article>
            </template>
            <template v-if="sectionId==='details'">
              <p class="field-help">Four fixed benefit categories. These cannot be removed or reordered independently.</p>
              <article v-for="(benefit,index) in currentSection.benefits" :key="benefit.id" class="entry-card">
                <div class="entry-title"><strong>{{ benefitLabel(benefit.id) }}</strong><el-tag size="mini" effect="plain">Fixed</el-tag></div>
                <div class="two-fields">
                  <label>Benefit name · max 20<el-input v-model="benefit.name[locale]" maxlength="20" show-word-limit size="small"/></label>
                  <label>Headline · max 30<el-input v-model="benefit.headline[locale]" maxlength="30" show-word-limit size="small"/></label>
                </div>
                <label>Description · max 120<el-input v-model="benefit.description[locale]" type="textarea" :rows="2" maxlength="120" show-word-limit/></label>
                <label>Artwork · 750 × 375 · required
                  <div class="asset-upload"><img v-if="benefit.image && benefit.image.src" :src="benefit.image.src" alt="Benefit artwork"/><span v-else>No image</span><div><input type="file" accept="image/png,image/jpeg,image/webp" @change="upload($event,benefit,'image','detail')"/><small v-if="benefit.image && benefit.image.demo">Example image · replace before production</small><small v-else-if="benefit.image">{{ benefit.image.width }} × {{ benefit.image.height }}</small></div></div>
                </label>
              </article>
            </template>
            <template v-if="sectionId==='faq'">
              <div class="subheading"><h4>Questions & Answers</h4><el-button icon="el-icon-plus" size="mini" @click="addFAQ">Add Q&A</el-button></div>
              <article v-for="(row,index) in currentSection.rows" :key="row.id" class="entry-card">
                <div class="entry-title"><strong>Question {{ index+1 }}</strong><el-button type="text" size="mini" @click="currentSection.rows.splice(index,1)">Remove</el-button></div>
                <label>Question · max 50<el-input v-model="row.question[locale]" maxlength="50" show-word-limit/></label>
                <label>Answer · max 300<el-input v-model="row.answer[locale]" type="textarea" :rows="3" maxlength="300" show-word-limit/></label>
              </article>
            </template>
          </section>
        </template>
        <template v-else>
          <div class="section-heading">
            <div><h2>Feature Paywalls</h2><p>Configure each entry separately. Membership is a general upgrade entry; feature entries use their existing entitlement codes.</p></div>
          </div>
          <div class="scene-picker" data-testid="feature-paywall-picker">
            <el-input v-model="search" clearable size="small" prefix-icon="el-icon-search" placeholder="Search paywall entries" />
            <button v-for="item in filteredCatalog" :key="item.code" type="button" class="scene-item" :class="{active:sceneId===item.code}" :data-testid="'paywall-entry-'+item.code" @click="selectScene(item.code)">
              <div class="scene-item-head"><strong>{{ item.name }}</strong><el-tag v-if="item.code==='membership'" size="mini" type="success">Page Entry</el-tag><el-tag v-else-if="draft.scenes[item.code].enabled" size="mini" type="warning">A/B On</el-tag></div>
              <small>{{ item.code }} · {{ draft.scenes[item.code].variants.length }} {{ draft.scenes[item.code].variants.length===1?'group':'groups' }}</small>
            </button>
            <p v-if="!filteredCatalog.length" class="muted">No matching paywall entries</p>
          </div>
          <template v-if="currentScene">
            <section class="experiment-panel" data-testid="paywall-ab-editor">
              <div class="experiment-header">
                <div><h3>{{ sceneName }}</h3><p>{{ sceneId==='membership'?'Membership & Usage → subscription CTA → default Paywall. No Entitlement Item required.':'Triggered by the matching entitlement gate. Purchase eligibility is checked separately.' }}</p></div>
                <div class="experiment-switch"><small>A/B Test</small><el-switch v-model="currentScene.enabled" :disabled="currentVariants.length<2" active-text="On" inactive-text="Off" data-testid="ab-enable"/></div>
              </div>
              <div class="experiment-fields">
                <label><span>Experiment name <small>(max 60)</small></span><el-input v-model="currentScene.experimentName" maxlength="60" show-word-limit size="small" data-testid="ab-name"/></label>
                <div class="experiment-key"><span>Experiment ID</span><code>{{ currentScene.experimentId }}</code></div>
              </div>
              <div class="variant-title">
                <div><h4>Creative groups</h4><p>Each group has its own Banner, title and description in every enabled language.</p></div>
                <el-button size="small" icon="el-icon-document-copy" :disabled="currentVariants.length>=maxVariants" data-testid="ab-duplicate" @click="duplicateGroup">Duplicate selected group</el-button>
              </div>
              <div class="variant-cards">
                <button v-for="variant in currentVariants" :key="variant.id" type="button" :class="{active:currentVariant && currentVariant.id===variant.id}" class="variant-card" :data-testid="'ab-group-'+variant.id" @click="activeVariantId=variant.id">
                  <div class="variant-card-top"><span class="variant-letter">{{ variant.id }}</span><strong>{{ variant.name }}</strong></div>
                  <div class="variant-card-copy">{{ previewCopy(variant) }}</div>
                  <div class="variant-card-footer"><small>{{ variant.id==='A'?'Control':'Variation' }}</small><b>{{ variant.traffic }}%</b></div>
                </button>
              </div>
              <div v-if="currentVariants.length>1" class="traffic-section">
                <div class="traffic-header"><strong>Traffic allocation <span :class="{invalid:trafficTotal!==100}">{{ trafficTotal }}% / 100%</span></strong><el-button size="mini" type="text" @click="equalSplit">Equal split</el-button></div>
                <div class="traffic-items">
                  <label v-for="variant in currentVariants" :key="variant.id" class="traffic-item"><span>{{ variant.id }} · {{ variant.name }}</span><el-input-number v-model="variant.traffic" size="small" :min="0" :max="100" :step="5" :precision="0" controls-position="right" :data-testid="'ab-traffic-'+variant.id"/><span>%</span></label>
                </div>
                <el-alert v-if="currentScene.enabled && (trafficTotal!==100||currentVariants.some(group=>group.traffic<=0))" title="Enabled A/B experiments require 100% total traffic and a positive share for every group." type="error" :closable="false" show-icon/>
              </div>
              <div class="assignment-demo">
                <div><strong>Assignment simulator</strong><p>Local preview only · same test key + experiment ID gives a consistent group</p></div>
                <div class="assignment-demo-fields"><el-input v-model="sampleUserKey" size="small" placeholder="Sample user key" data-testid="ab-sample-user"/><span v-if="sampleAssignment" class="assignment-chip" data-testid="ab-assignment">{{ sampleAssignment.variantId }} · {{ sampleAssignment.name }}</span></div>
              </div>
              <p class="field-help">This is an operations prototype, not a live traffic experiment. Production assignment, audience eligibility, sticky groups, exposure events and experiment reporting require backend integration.</p>
            </section>
            <section v-if="currentVariant" class="edit-panel variant-editor" data-testid="ab-creative-editor">
              <div class="edit-panel-heading">
                <div><h3>Group {{ currentVariant.id }} · Creative</h3><p class="field-help">Edit {{ locale }} copy for this group. Only the selected group is changed.</p></div>
                <el-button v-if="currentVariant.id!=='A'" size="mini" type="danger" plain icon="el-icon-delete" @click="deleteGroup">Delete group</el-button>
              </div>
              <label>Group name · max 40<el-input v-model="currentVariant.name" maxlength="40" show-word-limit size="small" data-testid="ab-group-name"/></label>
              <label>Banner · 750 × 320 · required (no overlaid copy)
                <div class="asset-upload"><img v-if="currentVariant.banner" :src="currentVariant.banner.src" alt="Paywall banner"/><span v-else>No banner</span><div><input type="file" accept="image/png,image/jpeg,image/webp" @change="upload($event,currentVariant,'banner','banner')"/><small v-if="currentVariant.banner && currentVariant.banner.demo">Example image · replace before production</small></div></div>
              </label>
              <label>Main title · max 30<el-input v-model="currentVariant.title[locale]" maxlength="30" show-word-limit data-testid="ab-title"/></label>
              <label>Description · max 120<el-input v-model="currentVariant.description[locale]" type="textarea" :rows="3" maxlength="120" show-word-limit data-testid="ab-description"/></label>
            </section>
          </template>
        </template>
      </div>
      <aside v-if="referenceOpen" class="guide-preview" data-testid="annotated-ui-reference">
        <div class="preview-heading">
          <div><strong>UI Reference · Figma</strong><small>Annotated design screenshot</small></div>
          <el-button size="mini" icon="el-icon-arrow-right" @click="referenceOpen=false">Collapse</el-button>
        </div>
        <div class="reference-intro">
          <span>{{ workspace==='membership'?'Membership & Usage · Free state':'Contextual purchase · Course entry' }}</span>
          <a :href="referenceFigmaUrl" target="_blank" rel="noopener noreferrer">View in Figma <i class="el-icon-top-right"/></a>
        </div>
        <div class="reference-scroll">
          <div class="reference-screenshot">
            <img :src="referenceScreenshot" :alt="workspace==='membership'?'Figma Membership & Usage screen':'Figma contextual subscription sheet'" loading="lazy"/>
            <div v-for="mark in referenceAnnotations" :key="mark.number" class="reference-outline"
              :class="{'is-selected':mark.section&&sectionId===mark.section,'is-external':mark.external}"
              :style="{top:mark.top,left:mark.left,width:mark.width,height:mark.height}">
              <span class="reference-pin">{{ mark.number }}</span>
            </div>
          </div>
        </div>
        <div class="reference-legend">
          <div v-for="mark in referenceAnnotations" :key="mark.number" class="reference-legend-row">
            <span class="reference-legend-number" :class="{'is-external':mark.external}">{{ mark.number }}</span>
            <div class="reference-legend-copy">
              <strong>{{ mark.label }}</strong>
              <small>{{ mark.description }}</small>
              <el-button v-if="mark.section" size="mini" type="text" @click="sectionId=mark.section">Edit this section</el-button>
            </div>
          </div>
        </div>
        <p class="reference-disclaimer">Reference screenshot only. Markers identify corresponding requirements; they do not modify the original Figma design. Store prices, offers and purchase CTA are outside this configuration.</p>
      </aside>
    </div>
    <el-dialog title="Publication validation" :visible.sync="errorsVisible" width="680px"><p>Resolve these issues before publishing:</p><ul class="error-list"><li v-for="(error,index) in errors" :key="index">{{ error }}</li></ul><span slot="footer"><el-button @click="errorsVisible=false">Close</el-button></span></el-dialog>
  </div>
</template>
<script>
import {getCatalog} from '@/api/commercialization'
import model from './model.cjs'
const DRAFT_KEY = 'sunnyfit:subscription-guides:draft:v1'
const PUBLISHED_KEY = 'sunnyfit:subscription-guides:published:v1'
const META_KEY = 'sunnyfit:subscription-guides:meta:v1'
const safeRead = (key) => { try { return JSON.parse(localStorage.getItem(key)||'null') } catch (_) { return null } }
const snapshot = value => JSON.stringify(value)
export default {
  name: 'SubscriptionGuidanceConfiguration',
  data() { return { draft:null, published:null, catalog:[], catalogError:'', workspace:'membership', sectionId:'comparison', sceneId:'membership', activeVariantId:'A', sampleUserKey:'demo-user-001', locale:'en', search:'', referenceOpen:false, errors:[], errorsVisible:false, meta:{version:0,publishedAt:null}, savedDraft:'' } },
  computed: {
    languages() { return model.LOCALES },
    enabledLocales() { return this.draft ? this.draft.enabledLocales : ['en'] },
    availableLocales() { return this.languages.filter(lang => this.enabledLocales.includes(lang.code)) },
    sectionIds() { return model.SECTION_IDS },
    currentSection() { return this.draft.membership[this.sectionId] },
    currentScene() { return this.draft && this.draft.scenes[this.sceneId] || null },
    currentVariants() { return this.currentScene ? this.currentScene.variants : [] },
    currentVariant() { return this.currentVariants.find(variant=>variant.id===this.activeVariantId)||this.currentVariants[0]||null },
    maxVariants() { return model.MAX_VARIANTS },
    trafficTotal() { return this.currentVariants.reduce((sum,variant)=>sum+(Number.isInteger(variant.traffic)?variant.traffic:0),0) },
    sampleAssignment() { return this.draft ? model.assignVariant(this.draft,this.sceneId,this.sampleUserKey) : null },
    filteredCatalog() { const term=this.search.toLowerCase();const items=model.CORE_SCENES.concat(this.catalog.filter(item=>!model.CORE_SCENES.some(known=>known.code===item.code) && !model.UNAVAILABLE_SCENE_CODES.includes(item.code)));return items.filter(item => this.draft.scenes[item.code] && !model.UNAVAILABLE_SCENE_CODES.includes(item.code) && (item.name+' '+item.code).toLowerCase().includes(term)) },
    sceneName() { return (this.filteredCatalog.find(item=>item.code===this.sceneId)||this.catalog.find(item=>item.code===this.sceneId)||model.CORE_SCENES.find(item=>item.code===this.sceneId)||{}).name || this.sceneId },
    dirty() { return this.draft && snapshot(this.draft)!==this.savedDraft },
    referenceFigmaUrl() { return this.workspace==='membership'
      ? 'https://www.figma.com/design/2AT0tm9mkFhes8T81YzA2L/V3.0?node-id=9128-2550'
      : 'https://www.figma.com/design/2AT0tm9mkFhes8T81YzA2L/V3.0?node-id=9156-3283' },
    referenceScreenshot() { const name=this.workspace==='membership'?'membership-ui.png':'paywall-ui.png';return process.env.BASE_URL+'assets/figma/subscription-guidance/'+name },
    referenceAnnotations() {
      return this.workspace==='membership' ? [
        { number:1, label:'权益对比表 / Benefit Comparison', description:'按 Free / Premium 设置权益项开关和描述；支持模块启停与 Sort。', section:'comparison', top:'20.2%', left:'3.5%', width:'93%', height:'16.1%' },
        { number:2, label:'四类权益详情 / Benefit Details', description:'固定 Content、Plan、AI Insights、AI Chat 四类权益；配置文字及配图。', section:'details', top:'40.4%', left:'3.5%', width:'93%', height:'27.0%' },
        { number:3, label:'Q&A / Common Questions', description:'多条问题和回答，可维护对应的多语言文案。', section:'faq', top:'69.2%', left:'3.5%', width:'93%', height:'13.9%' },
        { number:4, label:'Choose your plan · SDK', description:'套餐、优惠、价格与购买 CTA 按 §4.2 商店 SDK 规则处理，不在此配置。', external:true, top:'84.8%', left:'3.5%', width:'93%', height:'13.0%' }
      ] : [
        { number:1, label:'场景 Banner · 750 × 320', description:'后台配置的横幅图片，原图不包含叠加文案。', top:'32.3%', left:'1%', width:'98%', height:'27.0%' },
        { number:2, label:'主标题 · max 30', description:'按对应的 Entitlement Item 维护多语言主标题。', top:'40.0%', left:'4%', width:'92%', height:'8.7%' },
        { number:3, label:'描述 · max 120', description:'对应功能的订阅引导文案，可独立编辑。', top:'48.8%', left:'4%', width:'92%', height:'8.6%' },
        { number:4, label:'Choose your plan · SDK', description:'计划选项、商店价格和优惠资格来自 §4.2，不由 Banner 配置决定。', external:true, top:'59.1%', left:'4%', width:'92%', height:'19.3%' },
        { number:5, label:'购买 CTA · SDK', description:'扣费与自动续费文案按选中商店 Offer 计算，不在此配置。', external:true, top:'84.5%', left:'4%', width:'92%', height:'9.5%' }
      ]
    }
  },
  async created() {
    try { this.catalog=await getCatalog() } catch (error) { this.catalogError='Entitlement catalog unavailable: '+error.message+'. Existing saved scenes remain editable.' }
    this.draft=model.reconcile(safeRead(DRAFT_KEY),this.catalog)
    this.published=safeRead(PUBLISHED_KEY)
    this.meta=safeRead(META_KEY)||{version:0,publishedAt:null}
    this.savedDraft=snapshot(this.draft)
    this.sceneId=this.draft.scenes.membership?'membership':Object.keys(this.draft.scenes)[0]||''
    this.activeVariantId='A'
  },
  beforeRouteLeave(to,from,next) {
    if (!this.dirty) return next()
    this.$confirm('Discard unsaved edits? Saved drafts will remain.', 'Unsaved changes', {confirmButtonText:'Leave',cancelButtonText:'Stay',type:'warning'}).then(()=>next()).catch(()=>next(false))
  },
  methods: {
    selectScene(code) { this.sceneId=code;this.activeVariantId='A' },
    previewCopy(variant) { return model.languageText(variant.title,this.locale)||'Untitled creative' },
    duplicateGroup() {
      const added=model.addVariant(this.currentScene,this.currentVariant && this.currentVariant.id)
      if(!added){this.$message.warning('Maximum '+model.MAX_VARIANTS+' creative groups per entry.');return}
      this.activeVariantId=added.id
      this.$message.success('Group '+added.id+' created from the selected group. Review its copy before publishing.')
    },
    deleteGroup() {
      const id=this.currentVariant && this.currentVariant.id
      if(!id||id==='A')return
      this.$confirm('Remove group '+id+'? The traffic allocation will be redistributed.', 'Delete creative group', {type:'warning'}).then(()=>{
        model.removeVariant(this.currentScene,id)
        this.activeVariantId='A'
      }).catch(()=>{})
    },
    equalSplit() { if(this.currentScene)model.rebalanceTraffic(this.currentScene) },
    sectionName(id) { return {comparison:'Benefit Comparison',details:'Benefit Details',faq:'Q&A'}[id] },
    benefitLabel(id) { return (model.BENEFITS.find(item=>item.id===id)||{}).label||id },
    toggleLocale(code,enabled) {
      if (code==='en') return
      if (enabled && !this.draft.enabledLocales.includes(code)) {
        const walk = item => {
          if (!item || typeof item!=='object') return
          if (!Array.isArray(item) && Object.prototype.hasOwnProperty.call(item,'en') && typeof item.en==='string' && !Object.prototype.hasOwnProperty.call(item,code)) this.$set(item,code,'')
          else Object.values(item).forEach(walk)
        }
        walk(this.draft)
        this.draft.enabledLocales.push(code)
      }
      else if (!enabled) { this.draft.enabledLocales=this.draft.enabledLocales.filter(item=>item!==code);if(this.locale===code)this.locale='en' }
    },
    addComparison() {
      const localized=()=>Object.fromEntries(this.enabledLocales.map(code=>[code,'']))
      this.currentSection.rows.push({id:'row_'+Date.now(),name:localized(),free:{enabled:false,description:localized()},premium:{enabled:true,description:localized()}})
    },
    addFAQ() {
      const localized=()=>Object.fromEntries(this.enabledLocales.map(code=>[code,'']))
      this.currentSection.rows.push({id:'faq_'+Date.now(),question:localized(),answer:localized()})
    },
    resetDraft() { this.$confirm('Discard current edits and reload the last saved draft?', 'Discard changes', {type:'warning'}).then(()=>{this.draft=model.reconcile(safeRead(DRAFT_KEY),this.catalog);this.savedDraft=snapshot(this.draft);this.activeVariantId='A'}).catch(()=>{}) },
    persist(key,data) { try { localStorage.setItem(key,snapshot(data));return true } catch(error) { this.$message.error('Browser storage is full or unavailable. Try smaller image assets.');return false } },
    saveDraft() { if (this.persist(DRAFT_KEY,this.draft)) { this.savedDraft=snapshot(this.draft);this.$message.success('Draft saved in this browser. Published preview unchanged.') } },
    publish() {
      this.errors=model.validate(this.draft)
      if (this.errors.length) { this.errorsVisible=true;return }
      this.$confirm('Publish this version to the browser prototype? Production users will not be affected.', 'Publish configuration', {type:'warning',confirmButtonText:'Publish'}).then(()=>{
        const nextMeta={version:(this.meta.version||0)+1,publishedAt:new Date().toISOString()}
        if (!this.persist(PUBLISHED_KEY,this.draft)) return
        if (!this.persist(META_KEY,nextMeta)) return
        if (!this.persist(DRAFT_KEY,this.draft)) return
        this.published=model.clone(this.draft);this.meta=nextMeta;this.savedDraft=snapshot(this.draft)
        window.dispatchEvent(new CustomEvent('sunnyfit:subscription-guides:published',{detail:{version:nextMeta.version}}))
        this.$message.success('Prototype published v'+nextMeta.version)
      }).catch(()=>{})
    },
    upload(event,target,key,kind) {
      const file=event.target.files && event.target.files[0];event.target.value=''
      if (!file) return
      if (!['image/png','image/jpeg','image/webp'].includes(file.type)) { this.$message.error('Use PNG, JPG or WebP.');return }
      if (file.size>350000) { this.$message.error('Prototype image limit: 350 KB (browser storage).');return }
      const reader=new FileReader()
      reader.onload=()=>{
        const img=new Image()
        img.onload=()=>{
          const expected=model.IMAGE_SIZES[kind]
          if (img.width!==expected.width||img.height!==expected.height) { this.$message.error('Image must be exactly '+expected.width+' × '+expected.height+' px.');return }
          this.$set(target,key,{src:reader.result,width:img.width,height:img.height,demo:false,name:file.name})
          this.$message.success('Image ready. Save or publish to keep this change.')
        }
        img.onerror=()=>this.$message.error('Image could not be read.')
        img.src=reader.result
      }
      reader.onerror=()=>this.$message.error('File could not be read.')
      reader.readAsDataURL(file)
    }
  }
}
</script>
<style scoped>
.subscription-guides{max-width:1750px;margin:auto}.guide-bar,.guide-bar-right,.edit-panel-heading,.subheading,.section-heading,.preview-heading,.entry-title,.tier-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.guide-bar{padding:14px 16px;border:1px solid #e4e8ef;background:#fff;border-radius:9px;margin-bottom:16px}.guide-bar-right{flex-wrap:wrap}.guide-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:18px;align-items:start}.guide-layout.reference-expanded{grid-template-columns:minmax(0,1fr) 430px}.guide-editor{min-width:0}.section-heading{margin-bottom:12px}.section-heading h2{font-size:17px;font-weight:600;margin:0 0 4px}.section-heading p{font-size:12px;color:#909399;margin:0}.section-select{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}.section-pill{text-align:left;display:flex;flex-direction:column;gap:5px;padding:12px 16px;min-width:165px;background:white;border:1px solid #dce3ed;border-radius:8px;cursor:pointer}.section-pill.active{border-color:#409eff;background:#edf6ff}.section-pill small{font-size:11px;color:#7b8794}.edit-panel{padding:20px;border:1px solid #e4e8ef;border-radius:10px;background:white}.edit-panel h3{font-size:16px;margin:0}.edit-panel h4{font-size:14px;margin:0}.edit-panel-heading{padding-bottom:16px;border-bottom:1px solid #edf0f4;margin-bottom:16px}.edit-panel-heading>div{display:flex;align-items:center;gap:9px}.edit-panel label,.entry-card label{display:flex;flex-direction:column;gap:7px;font-size:12px;color:#606b77;margin-bottom:15px}.two-fields,.tier-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.two-fields label{min-width:0}.two-fields>>>.el-input-number{width:100%}.entry-card{margin:14px 0;border:1px solid #e6eaf0;border-radius:9px;padding:16px;background:#fcfdff}.entry-title{margin-bottom:14px}.subheading{margin:22px 0 10px}.tier-grid>div{padding:13px;border-radius:7px;background:#f3f6fa}.tier-heading{margin-bottom:10px;font-size:12px}.field-help{font-size:12px;color:#8b96a5;line-height:1.6}.asset-upload{display:grid;grid-template-columns:minmax(140px,235px) 1fr;gap:14px;border:1px dashed #cbd5e1;padding:12px;border-radius:7px;align-items:center}.asset-upload img{display:block;width:100%;aspect-ratio:2;object-fit:cover;border-radius:6px;background:#ebeff5}.asset-upload input{max-width:100%;font-size:12px}.asset-upload small{display:block;color:#8b96a5;margin-top:8px}.scene-picker{max-height:260px;overflow:auto;border:1px solid #e5eaf0;background:#fff;border-radius:8px;padding:10px;margin-bottom:14px}.scene-picker>.el-input{margin-bottom:10px}.scene-item{display:inline-flex;flex-direction:column;text-align:left;padding:9px 12px;margin:3px;background:#fff;border:1px solid #dee5ed;border-radius:7px;cursor:pointer;max-width:240px}.scene-item.active{background:#ebf5ff;border-color:#409eff}.scene-item small{font-size:10px;color:#8492a6;overflow-wrap:anywhere}.guide-preview{position:sticky;top:12px;border:1px solid #e1e7ee;background:#f8fafc;border-radius:12px;padding:14px;min-width:0}
.preview-heading{margin-bottom:12px}
.preview-heading>div{display:grid;gap:4px}
.preview-heading strong{font-size:14px;color:#354258}
.preview-heading small{font-size:11px;color:#8a96a8}
.reference-intro{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:11px;font-size:11px;color:#606d7e}
.reference-intro a{color:#409eff;font-weight:600;white-space:nowrap}
.reference-scroll{max-height:570px;overflow:auto;border:1px solid #dbe3ee;border-radius:11px;background:#fff;scrollbar-width:thin}
.reference-screenshot{width:100%;position:relative;line-height:0}
.reference-screenshot img{display:block;width:100%;height:auto}
.reference-outline{position:absolute;border:2px solid #409eff;border-radius:8px;background:rgba(64,158,255,.04);box-shadow:inset 0 0 0 1px #ffffff50;pointer-events:none}
.reference-outline.is-selected{border-color:#1e67bd;background:rgba(64,158,255,.11)}
.reference-outline.is-external{border-color:#a0aab9;border-style:dashed;background:rgba(153,164,178,.07)}
.reference-pin{position:absolute;top:-12px;right:-10px;display:grid;place-items:center;width:26px;height:26px;background:#2274d1;border:2px solid #fff;border-radius:50%;color:#fff;font:bold 12px/1 Arial,sans-serif;box-shadow:0 2px 6px #172b4d50}
.reference-outline.is-external .reference-pin{background:#8997a8}
.reference-legend{display:grid;gap:0;margin-top:12px;border:1px solid #e5eaf1;border-radius:9px;background:#fff}
.reference-legend-row{display:flex;align-items:flex-start;gap:10px;padding:12px 11px;border-top:1px solid #edf1f5}
.reference-legend-row:first-child{border-top:0}
.reference-legend-number{display:grid;place-items:center;flex:0 0 23px;height:23px;border-radius:50%;color:white;background:#2274d1;font-weight:700;font-size:11px}
.reference-legend-number.is-external{background:#8997a8}
.reference-legend-copy{display:flex;flex-direction:column;gap:3px;min-width:0}
.reference-legend-copy strong{font-size:12px;line-height:17px;color:#334155}
.reference-legend-copy small{font-size:11px;line-height:17px;color:#68788c}
.reference-legend-copy .el-button{align-self:flex-start;margin-top:2px;padding:4px 0}
.reference-disclaimer{font-size:11px;line-height:1.6;color:#8492a6;margin:12px 0 0}
.locale-menu{display:flex;flex-direction:column;gap:10px}.locale-menu .muted{margin-bottom:8px;line-height:1.5}.error-list{max-height:340px;overflow:auto;color:#a94442;font-size:12px;line-height:1.8;padding-left:20px}@media(max-width:1050px){.guide-layout,.guide-layout.reference-expanded{grid-template-columns:1fr}.guide-preview{position:static}.guide-bar{flex-wrap:wrap}}@media(max-width:650px){.two-fields,.tier-grid{grid-template-columns:1fr}.guide-bar-right{justify-content:flex-start}.asset-upload{grid-template-columns:1fr}.page-header{flex-wrap:wrap}}

/* Scene-specific A/B groups are a review-only configuration surface. */
.scene-item{max-width:initial;min-width:215px;max-width:310px;gap:4px}
.scene-item-head{display:flex;align-items:center;gap:8px;justify-content:space-between}
.scene-item-head strong{line-height:19px}
.scene-item.active{background:#edf6ff;border-color:#409eff}
.scene-item small{color:#8390a3;font-size:11px;line-height:17px}
.experiment-panel{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:15px}
.experiment-header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding-bottom:15px;border-bottom:1px solid #e9edf3}
.experiment-header h3{font-size:17px;line-height:24px;margin:0 0 6px;font-weight:650}
.experiment-header p{color:#8793a3;margin:0;font-size:12px;line-height:19px;max-width:620px}
.experiment-switch{flex:none;display:flex;align-items:center;gap:10px}
.experiment-switch small{font-size:12px;color:#627085;font-weight:600}
.experiment-fields{display:grid;grid-template-columns:minmax(0,1fr) minmax(190px,280px);gap:14px;margin:16px 0 24px;align-items:end}
.experiment-fields label{display:flex;flex-direction:column;gap:7px;font-size:12px;color:#637083}
.experiment-key{display:flex;flex-direction:column;gap:7px;font-size:12px;color:#637083}
.experiment-key code{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;border-radius:5px;border:1px solid #e7eaf0;background:#f8fafd;font-size:12px;padding:8px 10px;color:#6e8096}
.variant-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 12px}
.variant-title h4{font-size:14px;margin:0 0 4px}
.variant-title p{color:#8c9aaa;font-size:12px;margin:0}
.variant-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px}
.variant-card{text-align:left;display:flex;flex-direction:column;min-width:0;gap:12px;padding:13px;background:#fafbfd;border:1.5px solid #e0e7ef;border-radius:10px;cursor:pointer}
.variant-card.active{background:#f0f7ff;border-color:#409eff;box-shadow:0 0 0 1px rgba(64,158,255,.15)}
.variant-card-top{display:flex;align-items:center;gap:8px;min-width:0}
.variant-card-top strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
.variant-letter{border-radius:7px;background:#e0e9f5;color:#2e5c8b;font-size:14px;font-weight:700;display:grid;place-items:center;flex:none;width:28px;height:28px}
.variant-card.active .variant-letter{color:#fff;background:#409eff}
.variant-card-copy{white-space:nowrap;text-overflow:ellipsis;overflow:hidden;font-size:12px;line-height:17px;color:#6f7b89}
.variant-card-footer{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#7f8c9e}
.variant-card-footer b{font-size:15px;color:#334a62}
.traffic-section{background:#f8fafc;border:1px solid #e5eaf1;border-radius:9px;padding:13px;margin-top:15px}
.traffic-header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px;font-size:12px}
.traffic-header span{color:#16835b;padding-left:4px}.traffic-header span.invalid{color:#d33c3c}
.traffic-items{display:flex;flex-wrap:wrap;gap:10px}
.traffic-item{display:flex;flex-direction:row;align-items:center;gap:7px;padding:6px 8px;background:#fff;border:1px solid #edf0f3;border-radius:8px;font-size:11px;color:#596a7d}
.traffic-item span:first-child{max-width:110px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.traffic-item >>> .el-input-number{width:83px}
.traffic-section .el-alert{margin-top:12px}
.assignment-demo{margin-top:15px;display:flex;align-items:center;justify-content:space-between;gap:10px;background:#f5f8fc;padding:13px;border-radius:9px}
.assignment-demo strong{font-size:12px}
.assignment-demo p{margin:5px 0 0;color:#7b8a9c;font-size:11px;line-height:17px}
.assignment-demo-fields{display:flex;align-items:center;gap:10px}
.assignment-demo-fields .el-input{width:160px}
.assignment-chip{white-space:nowrap;font-size:12px;color:#2563a0;background:#e2f2ff;border:1px solid #c6e6fb;border-radius:6px;padding:8px}
.variant-editor .edit-panel-heading{align-items:flex-start}
.variant-editor .edit-panel-heading h3{margin:0 0 5px}
@media(max-width:850px){.experiment-fields{grid-template-columns:1fr}.variant-title,.experiment-header,.assignment-demo{flex-wrap:wrap}.variant-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
