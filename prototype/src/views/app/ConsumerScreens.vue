<template>
  <div class="consumer-pages" :data-screen="screen">
    <order-center v-if="screen==='billing'" :data="data" :tab="orderTab" :mode="orderMode" :locale="locale" @tab="$emit('order-tab',$event)" @detail="$emit('order-detail',$event)"/>
    <template v-if="screen==='plans'">
      <sf-card v-if="subscription" class="consumer-card membership-current" :title="subscription.productName">
        <p>{{ subscription.autoRenew?'Renews':'Active until' }} {{ shortDate(subscription.grant.expiresAt) }}</p>
        <p v-if="subscription.autoRenew">Next payment: {{ money((subscription.pendingChange?subscription.pendingChange.sku:subscription.sku).priceCents,(subscription.pendingChange?subscription.pendingChange.sku:subscription.sku).currency) }}</p>
        <p v-if="subscription.pendingChange" class="consumer-caption">Switching to {{ subscription.pendingChange.product.name }} on {{ shortDate(subscription.pendingChange.startsAt) }}. No charge today.</p>
        <template #footer><sf-button appearance="glass" :disabled="busy" @click="$emit('renew',subscription)">{{ subscription.autoRenew?'Cancel renewal':'Resume renewal' }}</sf-button></template>
      </sf-card>
      <sf-card v-if="data.effective.membershipActive" class="consumer-card benefit-list" title="Your current benefits">
        <div v-for="benefit in benefits(data.effective.base.config)" :key="benefit">✓ {{ benefit }}</div>
        <div v-for="rule in usableRules(data.effective.base.config)" :key="rule.serviceId">✓ {{ rule.amount }} {{ serviceName(rule.serviceId) }} {{ rule.period==='weekly'?'each week':'each month' }}</div>
        <template v-if="data.policyVersion===20261014"><p class="consumer-caption">Your workout and weekly AI insights use no Credits. AI Coach conversations and featured content unlocks use separate credit types.</p><div v-for="grant in data.effective.base.config.creditGrants||[]" :key="grant.creditType" class="benefit-credit-rule">{{ grant.amount }} {{ creditTypeLabel(grant.creditType) }} each month</div><p class="consumer-caption">Monthly gifts refresh from your membership start date. Unused gifts expire at the next refresh.</p></template><p v-else class="consumer-caption">Your purchased benefits remain unchanged for this period. Extra use and independent content unlocks are priced separately.</p>
      </sf-card>
      <p class="mobile-section-label">AVAILABLE PLANS</p>
      <sf-card v-for="product in membershipProducts" :key="product.id" class="consumer-card offer-card" :data-product-id="product.id">
        <div class="consumer-offer__info"><strong>{{ product.name }}</strong><span>{{ sku(product).billingPeriod==='annual'?'Billed annually':'Billed monthly' }}</span><small v-for="rule in usableRules(product.benefits)" :key="rule.serviceId">{{ rule.amount }} {{ serviceName(rule.serviceId) }} / {{ rule.period==='weekly'?'week':'month' }}</small><template v-if="product.benefits.creditGrants"><small v-for="grant in product.benefits.creditGrants" :key="grant.creditType">{{ creditGrantLabel(grant) }}</small></template><small v-else-if="product.benefits.creditBenefit&&product.benefits.creditBenefit.amount">{{ product.benefits.creditBenefit.amount }} bonus Credits / {{ product.benefits.creditBenefit.cadence==='monthly'?'month':'billing period' }} · valid {{ product.benefits.creditBenefit.validityDays }} days</small></div>
        <b>{{ money(sku(product).priceCents,sku(product).currency) }} / {{ sku(product).billingPeriod==='annual'?'year':'month' }}</b>
        <sf-button :disabled="busy || !!(subscription && subscription.productId===product.id)" @click="$emit('checkout',product,sku(product))">{{ subscription?(subscription.productId===product.id?'Current plan':'Switch plan'):'Subscribe' }}</sf-button>
      </sf-card>
      <p class="consumer-caption">Your subscription renews until canceled. Independent unlocks and extra Credits remain after cancellation.</p>
    </template>
    <template v-if="screen==='wallet'">
      <sf-card v-for="account in typedAccounts" :key="account.code" class="consumer-card credits-hero" :data-credit-type="account.code"><span>{{ account.name }}</span><strong>{{ account.available }}</strong><p>{{ account.purchased }} purchased · {{ account.reserved }} reserved</p><p>Purchased credits never expire. Each grant keeps its own expiration.</p></sf-card>
      <sf-card v-if="data.policyVersion!==20261014||data.wallet.batches.some(batch=>batch.creditType==='LEGACY_CREDIT')" class="consumer-card credits-hero"><span>{{ typedAccounts.length?'Legacy Credits available':'Credits available' }}</span><strong>{{ data.wallet.available }}</strong><p>{{ data.wallet.purchased }} purchased Credits</p><p>Existing balances keep their original validity.</p><div v-if="nextExpiry" class="expiry-chip">{{ nextExpiry.available }} {{ nextExpiry.source==='purchase'?'legacy purchased':'bonus' }} Credits expire {{ shortDate(nextExpiry.expiresAt) }}</div></sf-card>
      <p class="mobile-section-label">BUY EXTRA CREDITS</p>
      <sf-card v-for="product in creditProducts" :key="product.id" :data-product-id="product.id" class="consumer-card consumer-credits-offer"><div class="consumer-offer__info"><strong>{{ product.credits.amount }} {{ product.credits.creditType?creditTypeLabel(product.credits.creditType):'Credits' }}</strong><span>No expiry</span><span v-if="!product.credits.creditType||product.credits.creditType==='LEGACY_CREDIT'">Up to {{ Math.floor(product.credits.amount/chatPrice) }} text replies at the current rate</span><span v-else>{{ product.credits.creditType==='AI_COACH_CREDIT'?'For your conversations with AI Coach':'For one-time featured content unlocks' }}</span></div><sf-button appearance="glass" :block="false" :disabled="busy" @click="$emit('checkout',product,sku(product))">{{ money(sku(product).priceCents,sku(product).currency) }}</sf-button></sf-card>
      <p class="consumer-caption">Credits with the earliest expiry are used first. Purchased Credits never expire. Buying Credits does not unlock member-only features.</p>
      <sf-button appearance="glass" class="consumer-secondary" :aria-expanded="showSources?'true':'false'" aria-controls="credit-balance-details" @click="showSources=!showSources">{{ showSources?'Hide details':'Balance details' }}</sf-button>
      <sf-card v-if="showSources" id="credit-balance-details" class="consumer-card"><div v-for="batch in data.wallet.batches.filter(batch=>!creditType||batch.creditType===creditType)" :key="batch.id" class="mobile-batch"><div><strong>{{ sourceName(batch.source) }} · {{ creditTypeLabel(batch.creditType) }}</strong><span>{{ batch.neverExpires?'Never expires':batch.status==='expired'?'Expired':'Expires '+shortDate(batch.expiresAt) }}</span></div><b>{{ batch.available }}</b></div></sf-card>
      <sf-button v-if="data.effective.base.config.modelVersion!==2" appearance="glass" class="consumer-secondary" @click="$emit('ledger')">View Credit Activity</sf-button>
    </template>
  </div>
</template>
<script>
import {SfCard,SfButton,SfBadge} from '@/design-system'
import OrderCenter from './OrderCenter'
import {creditTypeLabel,creditGrantLabel} from '@/utils/entitlements'
export default {
  components:{SfCard,SfButton,SfBadge,OrderCenter},
  props:{orderTab:String,orderMode:String,data:Object,screen:String,locale:String,busy:Boolean,creditType:String},
  data(){return{showSources:false}},
  computed:{
    subscription(){return this.data.subscriptions.find(s=>s.grant.status==='active')},
    membershipProducts(){return this.data.products.filter(p=>p.kind==='membership'&&p.skus.some(s=>s.status==='active'))},
    creditProducts(){return this.data.products.filter(p=>p.kind==='credits'&&p.credits.validityDays===null&&p.skus.some(s=>s.status==='active')&&(!this.creditType||p.credits.creditType===this.creditType))},
    typedAccounts(){return (this.data.wallet.accounts||[]).filter(account=>!account.legacy&&!account.future&&(!this.creditType||account.code===this.creditType)&&(this.data.policyVersion===20261014||this.data.wallet.batches.some(batch=>batch.creditType===account.code)||this.creditProducts.some(product=>product.credits.creditType===account.code)))},
    nextExpiry(){return this.data.wallet.batches.find(b=>b.available>0&&b.expiresAt)},
    chatPrice(){return (this.data.services.find(s=>s.id==='ai_chat')||{credits:2}).credits||1},
  },
  methods:{
    creditTypeLabel,creditGrantLabel,
    orderTone(order){return order.status==='failed'?'danger':order.status==='scheduled'||order.fulfillment==='pending'?'warning':order.status==='paid'||order.status==='applied'?'success':'neutral'},
    orderStatus(order){return{scheduled:'Plan change scheduled',paid:order.fulfillment==='completed'?'Paid':'Payment received · delivery pending',failed:'Payment failed',canceled:'Canceled',applied:'Plan change applied'}[order.status]||order.status},
    usableRules(config){if(config.modelVersion===2)return [];return (config.includedServices||[]).filter(rule=>{const service=this.data.services.find(s=>s.id===rule.serviceId);return service&&config.items.some(item=>item.code===service.entitlementCode&&item.scopes&&(item.scopes.includes('all')||item.scopes.includes(service.scope)))})},
    sku(p){const channel=this.subscription&&p.kind==='membership'?this.subscription.channel:'web_demo';return p.skus.find(s=>s.status==='active'&&s.channel===channel)||p.skus.find(s=>s.status==='active')},
    money(cents,currency){return new Intl.NumberFormat(this.locale||'en-US',{style:'currency',currency}).format(cents/100)},
    shortDate(value){return value?new Intl.DateTimeFormat(this.locale||'en-US',{dateStyle:'medium'}).format(new Date(value)):'No expiry'},
    serviceName(id){return({ai_chat:'coach replies',deep_analysis:'workout insights',weekly_insight:'weekly reports',plan_preview:'plan previews'})[id]||id},
    sourceName(id){return({membership:'Membership bonus',purchase:'Purchased Credits',device:'Device bonus',campaign:'Activity bonus',compensation:'Support credit'})[id]||id},
    benefits(config){const names={course_access:'Courses',world_tour_access:'World Tours',training_program_access:'Training Programs',movement_access:'Movements',challenge_access:'Limited Challenges',dynamic_plan:'Dynamic plans',ai_coach_chat:'AI Coach',workout_result_ai_insight:'Workout insights · no Credits used',weekly_report_ai_insight:'Weekly reports · no Credits used'};const scopes={free_content:'Free content',premium_content:'Premium content',limited_challenge:'Limited Challenges',youtube:'YouTube',text:'Text',image:'Image',live:'Live'};return config.items.map(item=>names[item.code]&&(names[item.code]+(!item.scopes||item.scopes.includes('all')?'': ' · '+item.scopes.map(scope=>scopes[scope]||scope).join(', ')))).filter(Boolean)}
  }
}
</script>
