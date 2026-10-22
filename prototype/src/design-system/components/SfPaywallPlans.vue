<template>
  <section class="sf-paywall-plans" aria-label="Premium plans">
    <h2 v-copy-block="{id:'paywall',fields:['paywall.plansTitle']}">{{ $copy('paywall.plansTitle') }}</h2>
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
.sf-paywall-plans{margin-top:23px}
.sf-paywall-plans h2{margin:0 0 12px;font-size:15px;font-weight:650;color:var(--sf-brand-blue)}
.context-purchase-offers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.context-purchase-offers button{display:flex;flex-direction:column;align-items:flex-start;gap:5px;min-height:109px;min-width:0;padding:13px 12px;border:1px solid #cfd5df;border-radius:16px;background:#fff;text-align:left;color:var(--sf-brand-blue);cursor:pointer;font:inherit}
.context-purchase-offers button[aria-checked=true]{border-color:var(--sf-brand-blue);box-shadow:inset 0 0 0 1px var(--sf-brand-blue);background:#edf2f8}
.context-purchase-offers button:disabled{cursor:default}
.sf-paywall-plans__period{display:flex;align-items:center;gap:8px;font-size:14px;line-height:22px}
.sf-paywall-plans__period strong{font-weight:600}
.sf-paywall-plans__period i{width:16px;height:16px;border:1px solid #aab3c3;border-radius:50%;box-sizing:border-box;flex:none}
.context-purchase-offers button[aria-checked=true] i{border:4px solid var(--sf-brand-blue);background:#fff}
.sf-paywall-plans__price{display:flex;gap:3px;align-items:baseline;white-space:nowrap;margin-top:2px}
.sf-paywall-plans__price b{font-size:22px;line-height:26px;font-weight:700;letter-spacing:-.5px}
.sf-paywall-plans__price small{font-size:11px;color:var(--sf-text-secondary)}
.sf-paywall-plans__badge,.sf-paywall-plans__regular{font-size:12px;line-height:18px}
.sf-paywall-plans__badge{color:var(--sf-brand-blue);font-weight:600}.sf-paywall-plans__regular{color:var(--sf-text-secondary)}
.sf-paywall-plans__unavailable{padding:16px;background:#f3f5f8;border-radius:14px;font-size:13px;color:var(--sf-text-secondary)}
.sf-paywall-plans__unavailable button{border:0;background:none;color:var(--sf-brand-blue);min-height:44px;font:inherit}
</style>
