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
          <div class="section-heading"><div><h2>Feature paywall introductions</h2><p>Each existing entitlement has a separate Banner, title and description. No store pricing or eligibility is configured here.</p></div></div>
          <div class="scene-picker">
            <el-input v-model="search" clearable size="small" prefix-icon="el-icon-search" placeholder="Find an entitlement" />
            <button v-for="item in filteredCatalog" :key="item.code" type="button" class="scene-item" :class="{active:sceneId===item.code}" @click="sceneId=item.code">
              <strong>{{ item.name }}</strong><small>{{ item.code }}</small>
            </button>
            <p v-if="!filteredCatalog.length" class="muted">No matching entitlements</p>
          </div>
          <section v-if="currentScene" class="edit-panel">
            <div class="edit-panel-heading"><h3>{{ sceneName }}</h3><el-tag size="small" type="info">Entitlement linked</el-tag></div>
            <p class="field-help">Shown when this entitlement's corresponding feature entry opens the subscription paywall. Effective access and offers remain decided by the server and store.</p>
            <label>Banner · 750 × 320 · required (no overlaid copy)
              <div class="asset-upload"><img v-if="currentScene.banner" :src="currentScene.banner.src" alt="Paywall banner"/><span v-else>No banner</span><div><input type="file" accept="image/png,image/jpeg,image/webp" @change="upload($event,currentScene,'banner','banner')"/><small v-if="currentScene.banner && currentScene.banner.demo">Example image · replace before production</small></div></div>
            </label>
            <label>Main title · max 30<el-input v-model="currentScene.title[locale]" maxlength="30" show-word-limit/></label>
            <label>Description · max 120<el-input v-model="currentScene.description[locale]" type="textarea" :rows="3" maxlength="120" show-word-limit/></label>
          </section>
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
  data() { return { draft:null, published:null, catalog:[], catalogError:'', workspace:'membership', sectionId:'comparison', sceneId:'', locale:'en', search:'', referenceOpen:false, errors:[], errorsVisible:false, meta:{version:0,publishedAt:null}, savedDraft:'' } },
  computed: {
    languages() { return model.LOCALES },
    enabledLocales() { return this.draft ? this.draft.enabledLocales : ['en'] },
    availableLocales() { return this.languages.filter(lang => this.enabledLocales.includes(lang.code)) },
    sectionIds() { return model.SECTION_IDS },
    currentSection() { return this.draft.membership[this.sectionId] },
    currentScene() { return this.draft.scenes[this.sceneId] || null },
    filteredCatalog() { const term=this.search.toLowerCase();const items=model.CORE_SCENES.concat(this.catalog.filter(item=>!model.CORE_SCENES.some(known=>known.code===item.code)));return items.filter(item => this.draft.scenes[item.code] && (item.name+' '+item.code).toLowerCase().includes(term)) },
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
    this.sceneId=Object.keys(this.draft.scenes)[0]||''
  },
  beforeRouteLeave(to,from,next) {
    if (!this.dirty) return next()
    this.$confirm('Discard unsaved edits? Saved drafts will remain.', 'Unsaved changes', {confirmButtonText:'Leave',cancelButtonText:'Stay',type:'warning'}).then(()=>next()).catch(()=>next(false))
  },
  methods: {
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
    resetDraft() { this.$confirm('Discard current edits and reload the last saved draft?', 'Discard changes', {type:'warning'}).then(()=>{this.draft=model.reconcile(safeRead(DRAFT_KEY),this.catalog);this.savedDraft=snapshot(this.draft)}).catch(()=>{}) },
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
</style>
