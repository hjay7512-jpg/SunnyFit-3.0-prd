<template>
  <sf-sheet class="store-subscription" :open="true" contained :resizable="false" :title="platform==='android'?'Google Play':'App Store'" :busy="checking" @input="$emit('close')">
    <div class="store-subscription__app"><span><sf-icon name="membership" :size="30"/></span><div><small>SunnyFit</small><h3>SunnyFit Premium</h3></div></div>
    <div class="store-subscription__plan"><strong>{{ annual?'Yearly':'Monthly' }}</strong><span>{{ price }} / {{ annual?'year':'month' }}</span></div>
    <p>{{ member.state==='canceled'?'Expires on ':'Renews on ' }}{{ date(member.expiry) }}</p>
    <p v-if="member.state==='canceled'">Your subscription won’t renew. Premium is available until this date.</p>
    <p v-else>If you cancel, your Premium access continues until the end of your current billing period.</p>
    <p class="store-subscription__provider">{{ platform==='android'?'Managed by Google Play':'Managed by the App Store' }}</p>
    <div v-if="checking" class="store-subscription__checking" role="status"><sf-icon name="refresh" :size="18"/>Checking subscription…</div>
    <template #footer><sf-button appearance="glass" :disabled="checking" @click="changeRenewal">{{ checking?'Checking subscription…':member.state==='canceled'?(platform==='android'?'Resubscribe':'Renew Subscription'):'Cancel Subscription' }}</sf-button><button type="button" class="store-subscription__done" :disabled="checking" @click="$emit('close')">Done</button></template>
  </sf-sheet>
</template>
<script>
import {SfSheet,SfButton,SfIcon} from '@/design-system'
import {membershipDate} from './membership-view'
// Browser prototype of the store-owned sheet. No store transaction is performed.
// Native clients use StoreKit / Play subscription management and verified status.
export default {
  components:{SfSheet,SfButton,SfIcon},props:{member:Object,offer:Object,platform:String,status:String},
  data(){return {pending:false,timer:null}},
  computed:{checking(){return this.pending||this.status==='refreshing'},annual(){return this.offer?.sku.billingPeriod==='annual'},price(){return this.offer?new Intl.NumberFormat('en-US',{style:'currency',currency:this.offer.sku.currency}).format(this.offer.sku.priceCents/100):'—'}},
  beforeDestroy(){clearTimeout(this.timer)},
  methods:{date:membershipDate,changeRenewal(){if(this.checking)return;this.pending=true;const autoRenew=this.member.state==='canceled';this.$emit('checking');this.timer=setTimeout(()=>this.$emit('verified',{autoRenew}),650)}}
}
</script>
<style scoped>
.store-subscription >>> .sf-modal{background:#fff;border-radius:25px 25px 0 0;max-height:90%}.store-subscription >>> .sf-modal__header h2{font-size:17px}.store-subscription >>> .sf-modal__footer{border-top:1px solid #e5e8ed;background:#fff}.store-subscription__app{display:flex;align-items:center;gap:13px;margin:12px 0 27px}.store-subscription__app>span{display:grid;place-items:center;width:56px;height:56px;border:1px solid #eee0d4;background:var(--sf-beige);color:var(--sf-action);border-radius:15px}.store-subscription__app small{font-size:12px;color:var(--sf-text-secondary)}.store-subscription h3{font-size:21px;line-height:28px;margin:3px 0 0;color:var(--sf-brand-blue)}.store-subscription__plan{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:17px 0;border-top:1px solid #e5e8ed;border-bottom:1px solid #e5e8ed;font-size:15px;color:var(--sf-brand-blue)}.store-subscription p{font-size:13px;line-height:21px;color:var(--sf-text-secondary);margin:15px 0}.store-subscription__provider{font-size:11px!important;margin-top:24px!important}.store-subscription__checking{display:flex;align-items:center;gap:8px;font-size:12px;line-height:20px;color:var(--sf-brand-blue);margin:15px 0}.store-subscription__done{border:0;background:none;min-height:44px;width:100%;font:500 13px var(--sf-font-family);color:var(--sf-brand-blue);cursor:pointer}
</style>
