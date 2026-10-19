<template>
  <section class="sf-paywall-plans" aria-label="Premium plans">
    <h2>Choose your plan</h2>
    <div v-if="offers.length" class="context-purchase-offers" role="radiogroup" aria-label="Subscription billing period">
      <button v-for="offer in offers" :key="offer.offerId" type="button" role="radio" :aria-checked="selectedId===offer.offerId?'true':'false'" :disabled="disabled" :data-offer-id="offer.offerId" :data-sku-id="offer.sku.id" @click="$emit('select',offer)">
        <span class="sf-paywall-plans__period"><i/><strong>{{ offer.sku.billingPeriod==='annual'?'Yearly':'Monthly' }}</strong></span>
        <span class="sf-paywall-plans__price"><b>{{ money(offer.sku.priceCents,offer.sku.currency) }}</b><small>/ {{ offer.sku.billingPeriod==='annual'?'year':'month' }}</small></span>
        <small v-if="offer.trialDays" class="sf-paywall-plans__badge">{{ offer.trialDays }} days free</small>
        <small v-else-if="saving(offer)>0" class="sf-paywall-plans__badge">Save {{ saving(offer) }}%</small>
        <small v-else class="sf-paywall-plans__regular">Billed monthly</small>
      </button>
    </div>
    <div v-else class="sf-paywall-plans__unavailable" role="status"><strong>Plans aren’t available right now.</strong><p>Your activity is saved.</p><button type="button" @click="$emit('reload')">Try again</button></div>
  </section>
</template>
<script>
export default {
  props:{offers:{type:Array,default:()=>[]},selectedId:String,disabled:Boolean},
  methods:{
    money(cents,currency){return new Intl.NumberFormat('en-US',{style:'currency',currency}).format(cents/100)},
    saving(offer){const monthly=this.offers.find(item=>item.sku.billingPeriod==='monthly'&&item.sku.currency===offer.sku.currency);return offer.sku.billingPeriod==='annual'&&monthly&&monthly.sku.priceCents>0?Math.max(0,Math.floor((1-offer.sku.priceCents/(12*monthly.sku.priceCents))*100)):0}
  }
}
</script>
<style scoped>
.sf-paywall-plans{margin-top:21px}.sf-paywall-plans h2{margin:0 0 10px;font-size:12px;font-weight:600;color:#625b68}.context-purchase-offers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.context-purchase-offers button{min-height:93px;min-width:0;padding:11px 12px;border:1px solid #e8e3e8;border-radius:14px;background:#fff;text-align:left;color:#5a515f;cursor:pointer;font:inherit}.context-purchase-offers button[aria-checked=true]{border-color:#d77161;box-shadow:inset 0 0 0 .5px #d77161;background:#fff8f5}.context-purchase-offers button:disabled{cursor:default}.sf-paywall-plans__period{display:flex;align-items:center;gap:6px;font-size:12px;line-height:18px}.sf-paywall-plans__period strong{font-weight:600}.sf-paywall-plans__period i{width:12px;height:12px;border:1px solid #d8d0db;border-radius:50%;box-sizing:border-box}.context-purchase-offers button[aria-checked=true] i{border:3.5px solid #d77161}.sf-paywall-plans__price{display:flex;gap:4px;align-items:baseline;margin:5px 0 2px;white-space:nowrap}.sf-paywall-plans__price b{font-size:19px;line-height:24px;font-weight:600;letter-spacing:-.4px}.sf-paywall-plans__price small{font-size:10px;color:#827887}.sf-paywall-plans__badge,.sf-paywall-plans__regular{font-size:10px;line-height:15px}.sf-paywall-plans__badge{color:#927044}.sf-paywall-plans__regular{color:#8d8191}
.sf-paywall-plans__unavailable{padding:15px;border-radius:12px;background:#faf6fb}.sf-paywall-plans__unavailable strong{font-size:12px;color:#8f7998}.sf-paywall-plans__unavailable p{font-size:11px;color:#a691b0}.sf-paywall-plans__unavailable button{border:0;padding:4px 0;background:none;color:#bc8d79;font:11px var(--sf-font-family);cursor:pointer}
</style>
