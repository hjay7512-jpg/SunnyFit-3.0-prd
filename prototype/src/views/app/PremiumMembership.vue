<template>
  <div class="membership-usage premium-page premium-hub" :data-membership-state="member.state">
    <section class="premium-account-overview" aria-label="Your membership">
      <div v-copy-block="{id:'profile.membership',fields:['profile.status.'+member.state]}" class="premium-current"><span><span class="premium-status-dot" :class="{'is-active':member.active}"/>{{ member.active?'SunnyFit Premium':'SunnyFit' }}</span><sf-badge :tone="member.active?'success':'neutral'">{{ $copy('profile.status.'+member.state) }}</sf-badge></div>
      <div v-if="member.active" class="membership-plan-summary">
        <div><strong>{{ annual?'Yearly':'Monthly' }}</strong><span>{{ planPrice }} / {{ annual?'year':'month' }}</span></div>
        <p>{{ member.state==='canceled'?'Available until ':'Next renewal: ' }}{{ date(member.expiry) }}</p>
        <button v-copy-block="{id:'membership.active',fields:['membership.manage.button']}" type="button" class="membership-store-link" :disabled="busy" @click="setStorePanel('store')"><span>{{ $copy('membership.manage.button') }}</span><small>{{ platform==='android'?'Google Play':'App Store' }}</small><sf-icon name="arrow" :size="16"/></button>
      </div>
      <div v-else v-copy-block="{id:'membership.discovery',fields:['membership.preview.freeWorkouts','membership.preview.freeTracking']}" class="membership-free-included"><span>{{ $copy('membership.preview.freeWorkouts') }}</span><span aria-hidden="true">·</span><span>{{ $copy('membership.preview.freeTracking') }}</span></div>
    </section>

    <div class="membership-usage-card"><coach-allowance :view="member" @go="go" @upgrade="openOffers('plans')" @retry="$emit('retry')"/></div>

    <section v-if="!member.active" class="membership-discovery" aria-label="Discover Premium">
      <header v-copy-block="{id:'membership.discovery',fields:['membership.preview.eyebrow',member.state==='expired'?'membership.preview.expiredTitle':'membership.preview.title','membership.preview.description']}" class="membership-discovery__intro"><span class="membership-discovery__eyebrow"><sf-icon name="membership" :size="16"/>{{ $copy('membership.preview.eyebrow') }}</span><h2>{{ $copy(member.state==='expired'?'membership.preview.expiredTitle':'membership.preview.title') }}</h2><p>{{ $copy('membership.preview.description') }}</p></header>
      <div class="membership-plan-example" v-copy-block="{id:'membership.discovery',fields:exampleFields}">
        <span class="membership-plan-example__label" data-copy-key="membership.preview.exampleLabel">{{ $copy('membership.preview.exampleLabel') }}</span>
        <ol aria-label="Illustrative training week"><li v-for="(day,i) in exampleDays" :key="day"><span class="membership-plan-example__day">{{ day }}</span><strong :data-copy-key="'membership.preview.example'+(i+1)">{{ $copy('membership.preview.example'+(i+1)) }}</strong></li></ol>
        <div class="membership-plan-example__access"><span data-copy-key="membership.preview.freeStep">{{ $copy('membership.preview.freeStep') }}</span><sf-icon name="arrow" :size="14"/><strong data-copy-key="membership.preview.premiumStep">{{ $copy('membership.preview.premiumStep') }}</strong></div>
      </div>
      <ul class="membership-discovery__also" v-copy-block="{id:'membership.discovery',fields:['membership.preview.point1','membership.preview.point3']}"><li><sf-icon name="check" :size="15"/><span data-copy-key="membership.preview.point1">{{ $copy('membership.preview.point1') }}</span></li><li><sf-icon name="check" :size="15"/><span data-copy-key="membership.preview.point3">{{ $copy('membership.preview.point3') }}</span></li></ul>
      <div class="membership-discovery__actions"><sf-button v-copy-block="{id:'membership.discovery',fields:['membership.preview.explore']}" class="membership-explore" :disabled="busy" @click="openOffers('benefits')">{{ $copy('membership.preview.explore') }}<sf-icon name="arrow" :size="16"/></sf-button><button v-copy-block="{id:'membership.discovery',fields:['membership.preview.plans']}" type="button" class="membership-view-plans" :disabled="busy" @click="openOffers('plans')">{{ $copy('membership.preview.plans') }}<sf-icon name="arrow" :size="15"/></button></div>
    </section>
    <p v-if="member.state==='expired'" v-copy-block="{id:'membership.discovery',fields:['membership.preview.retention']}" class="membership-retained">{{ $copy('membership.preview.retention') }}</p>

    <section v-if="member.active" class="membership-included" aria-label="Included Premium benefits">
      <h2 v-copy-block="{id:'membership.active',fields:['membership.active.title']}">{{ $copy('membership.active.title') }}</h2>
      <ul><li v-for="(icon,i) in includedIcons" :key="icon" v-copy-block="{id:'membership.active',fields:['membership.active.benefit'+(i+1)]}"><sf-icon :name="icon" :size="19"/><span>{{ $copy('membership.active.benefit'+(i+1)) }}</span><sf-icon name="check" :size="15"/></li></ul>
    </section>

    <div class="membership-account-tools">
      <div v-if="!member.active" v-copy-block="{id:'membership.utilities',fields:['membership.utility.already','membership.utility.restore']}" class="membership-restore"><span data-copy-key="membership.utility.already">{{ $copy('membership.utility.already') }}</span><button type="button" :disabled="busy" data-copy-key="membership.utility.restore" @click="$emit('restore')">{{ $copy('membership.utility.restore') }}</button></div>
      <button v-copy-block="{id:'membership.utilities',fields:['membership.utility.history']}" type="button" class="membership-billing" @click="go('billing',{parent:'membership'})"><sf-icon name="receipt-text" :size="18"/><span>{{ $copy('membership.utility.history') }}</span><sf-icon name="arrow" :size="15"/></button>
    </div>
    <store-subscription-preview v-if="member.active&&['store','refreshing'].includes(storePanel)" :member="member" :offer="currentOffer" :platform="platform" :status="storePanel" @close="setStorePanel()" @checking="setStorePanel('refreshing')" @verified="applyStoreResult"/>
  </div>
</template>
<script>
import {SfIcon,SfBadge,SfButton} from '@/design-system'
import CoachAllowance from './CoachAllowance'
import StoreSubscriptionPreview from './StoreSubscriptionPreview'
import {membershipView,membershipDate} from './membership-view'
import {premiumOffers} from './premium-offers'
import './membership-mvp.css'
export default {
  components:{SfIcon,SfBadge,SfButton,CoachAllowance,StoreSubscriptionPreview},props:{data:Object,locale:String,busy:Boolean},
  data:()=>({exampleDays:['Mon','Wed','Fri'],includedIcons:['play','calendar','spark','coach']}),
  computed:{member(){return membershipView(this.data,this.$route.query)},annual(){return this.$route.query.membershipCycle==='annual'},currentOffer(){return premiumOffers(this.data).find(offer=>offer.sku.billingPeriod===(this.annual?'annual':'monthly'))},planPrice(){return this.currentOffer?new Intl.NumberFormat('en-US',{style:'currency',currency:this.currentOffer.sku.currency}).format(this.currentOffer.sku.priceCents/100):'—'},platform(){return this.$route.query.reviewStore==='android'?'android':'ios'},storePanel(){return this.$route.query.reviewSubscriptionPanel||''},exampleFields(){return ['exampleLabel','example1','example2','example3','freeStep','premiumStep'].map(key=>'membership.preview.'+key)}},
  methods:{date:membershipDate,go(screen,extra){this.$emit('go',screen,extra)},openOffers(view='benefits'){this.$emit('subscribe',view)},async setStorePanel(value){await this.replaceQuery({reviewSubscriptionPanel:value||undefined})},async replaceQuery(patch){const query={...this.$route.query,...patch};for(const key of Object.keys(query))if(query[key]===undefined)delete query[key];await new Promise(resolve=>this.$router.replace({path:this.$route.path,query},resolve,resolve))},async applyStoreResult(result){await this.replaceQuery({membershipState:result.autoRenew?'active':'canceled',reviewSubscriptionPanel:undefined})}}
}
</script>
<style scoped>
.premium-page.premium-hub{padding-bottom:24px}
.premium-account-overview{box-shadow:none;padding:16px}.premium-current{gap:12px}
.membership-plan-summary{margin-top:15px;padding-top:15px;border-top:1px solid #e3e7ee}.membership-plan-summary>div{display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--sf-brand-blue);font-size:14px}.membership-plan-summary>div>strong{font-weight:600}.membership-plan-summary>p{font-size:12px;line-height:19px;margin:7px 0 0;color:var(--sf-text-secondary)}
.membership-store-link{display:flex;align-items:center;gap:8px;min-height:46px;width:100%;border:0;background:none;padding:10px 0 0;color:var(--sf-brand-blue);font:500 13px/19px var(--sf-font-family);cursor:pointer}.membership-store-link small{margin-left:auto;font-size:11px;font-weight:400;color:var(--sf-text-secondary)}
.membership-free-included{display:flex;flex-wrap:wrap;gap:3px 5px;padding-top:10px;font-size:11px;line-height:17px;color:var(--sf-text-secondary)}
.membership-usage-card{margin-top:12px;border:1px solid #e1e5ec;border-radius:18px;background:#fff;padding:0 16px}.membership-usage-card >>> .coach-allowance{margin:0;padding:14px 0;border:0;box-shadow:none}.membership-usage-card >>> .coach-allowance__track{margin-top:11px}
.membership-discovery{margin-top:20px;border:1px solid #e3e6ed;background:#fff;border-radius:20px;padding:19px 18px 8px}.membership-discovery__eyebrow{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:650;letter-spacing:1px;color:var(--sf-brand-blue)}.membership-discovery__eyebrow .sf-icon{color:var(--sf-action)}.membership-discovery h2{font-size:24px;line-height:29px;font-weight:650;letter-spacing:-.5px;margin:11px 0 7px;color:var(--sf-brand-blue)}.membership-discovery__intro>p{font-size:12px;line-height:19px;color:var(--sf-text-secondary);margin:0}
.membership-plan-example{margin-top:15px;background:var(--sf-beige);padding:12px;border:1px solid #eee3d7;border-radius:14px}.membership-plan-example__label{font-size:9px;line-height:14px;letter-spacing:.8px;color:var(--sf-text-secondary);font-weight:600}.membership-plan-example ol{list-style:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:9px 0 12px;padding:0}.membership-plan-example li{display:grid;justify-items:start;gap:6px;padding:9px;background:#fffcf9;border:1px solid #f0e7dc;border-radius:9px;min-width:0}.membership-plan-example__day{font-size:10px;color:var(--sf-text-secondary)}.membership-plan-example li>.sf-icon{color:var(--sf-brand-blue)}.membership-plan-example li>strong{font-size:11px;line-height:16px;font-weight:600;color:var(--sf-brand-blue);overflow-wrap:anywhere}.membership-plan-example__access{display:flex;align-items:center;justify-content:space-between;gap:6px;border-top:1px solid #e5d9cc;padding-top:10px;font-size:10px;line-height:16px;color:var(--sf-text-secondary)}.membership-plan-example__access>.sf-icon{flex:none;color:var(--sf-brand-blue)}.membership-plan-example__access>strong{font-weight:600;color:var(--sf-brand-blue)}
.membership-discovery__also{list-style:none;display:grid;gap:8px;padding:0;margin:14px 0}.membership-discovery__also>li{display:flex;align-items:flex-start;gap:7px;font-size:12px;line-height:18px;color:var(--sf-brand-blue)}.membership-discovery__also .sf-icon{flex:none;margin-top:1px}
.membership-discovery__actions{display:grid;gap:0;margin-top:15px}.membership-explore{min-height:46px;width:100%;border-radius:13px;font-size:13px}.membership-explore .sf-icon{margin-left:7px}.membership-view-plans{display:flex;align-items:center;justify-content:center;gap:7px;border:0;background:none;color:var(--sf-brand-blue);font:500 12px/18px var(--sf-font-family);padding:9px;min-height:44px;width:100%;cursor:pointer}
.membership-retained{font-size:12px;line-height:19px;margin:13px 4px;color:var(--sf-text-secondary)}.membership-included{margin-top:22px}.membership-included>h2{font-size:17px;line-height:24px;margin:0;font-weight:600;color:var(--sf-brand-blue)}.membership-included ul{padding:5px 14px;margin:12px 0 0;list-style:none;border:1px solid #e3e6ed;border-radius:16px;background:#fff}.membership-included li{display:flex;align-items:center;gap:11px;min-height:52px;border-bottom:1px solid #edf0f4;font-size:12px;line-height:19px;color:var(--sf-brand-blue);padding:7px 0;box-sizing:border-box}.membership-included li:last-child{border:0}.membership-included li>.sf-icon{flex:none}.membership-included li>span{flex:1}.membership-included li>.sf-icon:last-child{color:#5a8069}
.membership-account-tools{margin-top:18px}.membership-restore{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:0 6px;font-size:11px;line-height:17px;color:var(--sf-text-secondary)}.membership-restore>button{min-height:44px;border:0;padding:6px 0;background:none;color:var(--sf-brand-blue);font:500 11px/17px var(--sf-font-family);cursor:pointer}.membership-billing{display:flex;align-items:center;gap:10px;width:100%;min-height:48px;border:0;border-top:1px solid #e3e6ed;background:none;padding:10px 2px;color:var(--sf-brand-blue);font:400 12px/19px var(--sf-font-family);text-align:left;cursor:pointer}.membership-billing>span{flex:1}
.premium-hub :is(button):focus-visible{outline:2px solid var(--sf-brand-blue);outline-offset:3px}
@media(max-width:350px){.membership-discovery{padding:17px 14px 6px}.membership-discovery h2{font-size:22px;line-height:27px}.membership-plan-example{padding:10px}.membership-plan-example li{padding:7px}}
</style>
