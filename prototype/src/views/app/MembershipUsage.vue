<template>
  <div class="membership-usage v3-membership" data-business-reference="249:2183">
    <section class="usage-plan-card">
      <p class="membership-eyebrow">YOUR MEMBERSHIP</p>
      <div class="usage-plan-heading"><h2>{{ data.effective.membershipActive?'SunnyFit Premium':'SunnyFit Free' }}</h2><sf-badge tone="accent">Current plan</sf-badge></div>
      <p class="usage-caption">{{ typedModel?'Your access and monthly credit gifts':'AI Coach' }}</p>
      <p v-if="typedModel" class="usage-caption">Content and features in your plan are separate from Credits you can spend.</p>
      <template v-else-if="chatAllowance">
        <sf-usage-meter :remaining="chatAllowance.remaining" :total="chatAllowance.amount" label="Included coach replies remaining" />
        <div class="usage-caption-row"><strong>{{ chatAllowance.remaining }} of {{ chatAllowance.amount }} replies left</strong><span>Resets {{ shortDate(chatAllowance.resetAt) }}</span></div>
        <p v-if="chatAllowance.reserved" class="usage-caption">{{ chatAllowance.reserved }} reply in progress</p>
      </template>
      <p v-if="!typedModel&&!chatAllowance" class="usage-caption">No included replies. {{ chatService?chatService.credits:0 }} Credits per text reply.</p>
      <p v-if="subscription" class="usage-caption">{{ subscription.autoRenew?'Renews':'Active until' }} {{ shortDate(subscription.grant.expiresAt) }}<template v-if="subscription.autoRenew"> · {{ money(nextSku.priceCents,nextSku.currency) }}</template></p>
      <p v-if="subscription&&subscription.pendingChange" class="usage-caption">{{ subscription.pendingChange.product.name }} starts {{ shortDate(subscription.pendingChange.startsAt) }}. No charge today.</p>
      <p v-if="data.effective.additional.length" class="usage-caption">{{ data.effective.additional.map(g=>g.name).join(', ') }} active</p>
    </section>
    <sf-button class="usage-main-action" :disabled="busy" @click="$emit('go','plans')">{{ subscription?'Manage membership':primaryLabel }}</sf-button>
    <section class="usage-menu">
      <sf-menu-row label="Plan &amp; Benefits" description="See what is included" @click="$emit('go','plans')" />
      <sf-menu-row label="Billing History" description="Subscription purchases &amp; renewals" @click="$emit('go','billing',{parent:'membership'})" />
      <sf-menu-row label="Restore Purchase" :disabled="busy" @click="$emit('restore')" />
    </section>
    <section v-if="typedModel" class="usage-detail-card membership-access"><h3>Your access</h3><p v-if="!features.length">Your basic workouts and complete workout statistics stay free.</p><div v-for="feature in features" :key="feature.code" class="membership-access-row"><span>{{ feature.name }}</span><sf-badge tone="success">Included</sf-badge></div><p v-if="features.length" class="usage-caption">Automatic workout and weekly AI insights use no Credits.</p><div v-for="item in contentAccess" :key="item.code" class="membership-content-row"><strong>{{ item.name }}</strong><span>{{ item.scopes.map(scopeName).join(' · ') }}</span></div></section>
    <section v-for="account in typedAccounts" :key="account.code" class="usage-detail-card" :data-credit-type="account.code"><h3>{{ account.name }}</h3><strong class="membership-credit-value">{{ account.available }}<span> available</span></strong><div class="membership-wallet-breakdown"><span>{{ gifted(account.code) }} membership</span><span>{{ account.purchased }} purchased</span></div><p v-if="account.reserved">{{ account.reserved }} in progress</p><p v-if="refresh(account.code)" class="usage-caption">Monthly gift refreshes {{ shortDate(refresh(account.code)) }}. Unused gifts don’t roll over.</p><p class="usage-caption">Purchased Credits never expire.</p><sf-button appearance="glass" :disabled="busy" @click="$emit('go','wallet',{parent:'membership',creditType:account.code})">Add {{ account.code==='AI_COACH_CREDIT'?'AI Coach':'Content' }} Credits</sf-button></section>
    <section v-if="otherAllowances.length" class="usage-detail-card"><h3>Other included services</h3><div v-for="rule in otherAllowances" :key="rule.bucketId" class="usage-detail-row"><strong>{{ serviceName(rule.serviceId) }}</strong><span>{{ rule.remaining }} of {{ rule.amount }} left</span><small>Resets {{ shortDate(rule.resetAt) }}</small></div></section>
    <section v-if="!typedModel||data.wallet.batches.some(batch=>batch.creditType==='LEGACY_CREDIT')" class="usage-detail-card usage-credit-summary"><div><h3>{{ typedModel?'Legacy Credits':'Extra Credits' }}</h3><strong class="membership-credit-value">{{ data.wallet.available }}<span> available</span></strong><p>Existing balances keep their original rules.</p></div><sf-button appearance="glass" :disabled="busy" @click="$emit('go','wallet',{parent:'membership'})">Add Credits</sf-button></section>
    <section class="usage-note"><strong>Your basic workouts stay free</strong><p>{{ typedModel?'AI Coach conversations use AI Coach Credits. Featured content unlocks use Content Credits once. Buying Credits does not change your membership.':'Included services are used first. Extra usage asks for your confirmation in AI Coach or the original service.' }}</p></section>
  </div>
</template>
<script>
import {SfButton,SfMenuRow,SfUsageMeter,SfBadge} from '@/design-system'
export default {
  components:{SfButton,SfMenuRow,SfUsageMeter,SfBadge},
  props:{data:Object,locale:String,busy:Boolean,primaryLabel:{type:String,default:'Explore Premium'}},
  computed:{
    typedModel(){return this.data.effective.base.config.modelVersion===2},
    typedAccounts(){return (this.data.wallet.accounts||[]).filter(account=>!account.legacy&&!account.future&&(this.typedModel||this.data.wallet.batches.some(batch=>batch.creditType===account.code)))},
    features(){return this.data.effective.items.filter(item=>item.type==='feature_access'&&['dynamic_plan','workout_result_ai_insight','weekly_report_ai_insight'].includes(item.code))},
    contentAccess(){return this.data.effective.items.filter(item=>item.type==='content_access')},
    subscription(){return this.data.subscriptions.find(s=>s.grant.status==='active')},
    nextSku(){return this.subscription.pendingChange?this.subscription.pendingChange.sku:this.subscription.sku},
    usableAllowances(){return this.typedModel?[]:this.data.wallet.includedUsage.filter(rule=>this.data.services.some(s=>s.id===rule.serviceId&&s.access.entitlementAllowed))},
    chatAllowance(){return this.usableAllowances.find(r=>r.serviceId==='ai_chat')},
    chatService(){return this.data.services.find(s=>s.id==='ai_chat')},
    otherAllowances(){return this.usableAllowances.filter(r=>r.serviceId!=='ai_chat')}
  },
  methods:{scopeName(code){return {free_content:'Free content',premium_content:'Premium content',limited_challenge:'Limited Challenges',youtube:'YouTube'}[code]||code.replace(/_/g,' ')},gifted(type){return this.data.wallet.batches.filter(batch=>batch.creditType===type&&batch.source==='membership').reduce((sum,batch)=>sum+batch.available,0)},refresh(type){const next=this.data.wallet.scheduled.find(row=>row.source==='membership'&&row.benefit.creditType===type);if(next)return next.dueAt;if(this.subscription&&this.subscription.autoRenew){const gift=this.data.wallet.batches.find(row=>row.source==='membership'&&row.creditType===type&&row.status!=='expired');return gift&&gift.expiresAt}return null},shortDate(v){return new Intl.DateTimeFormat(this.locale||'en-US',{month:'short',day:'numeric',year:'numeric',timeZone:this.subscription?.subscriptionTimeZone||undefined}).format(new Date(v))},money(v,currency){return new Intl.NumberFormat(this.locale||'en-US',{style:'currency',currency}).format(v/100)},serviceName(id){return{deep_analysis:'Workout insights',weekly_insight:'Weekly reports',plan_preview:'Plan previews'}[id]||id}}
}
</script>
<style scoped>.membership-access-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:12px 0;font-size:14px;line-height:22px}.membership-content-row{display:flex;flex-direction:column;gap:3px;margin-top:14px;font-size:13px;line-height:20px}.membership-content-row>span{color:var(--sf-text-secondary)}.membership-wallet-breakdown{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:13px;line-height:22px;color:var(--sf-text-secondary);margin:8px 0}.usage-detail-card>.sf-button{margin-top:14px}</style>
