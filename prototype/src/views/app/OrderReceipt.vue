<template>
  <sf-sheet :open="!!order" title="Order details" contained :resizable="false" @input="!$event&&$emit('close')">
    <div v-if="order" class="order-receipt">
      <div class="order-receipt__summary"><span>{{ order.status }}</span><h3>{{ order.title }}</h3><p>{{ order.subtitle }}</p><strong>{{ amount }}<small v-if="!['money','legacy'].includes(order.unit)"> {{ order.unit }}</small></strong></div>
      <dl><div><dt>Order ID</dt><dd>{{ order.id }}</dd></div><div><dt>{{ order.category==='points-exchange'?'Exchange date':'Order date' }}</dt><dd>{{ date(order.date) }}</dd></div><div v-if="order.quantity"><dt>Quantity</dt><dd>{{ order.quantity }}</dd></div><div v-if="order.startsAt"><dt>Starts on</dt><dd>{{ date(order.startsAt) }}</dd></div><div v-if="order.category==='star-content'"><dt>Access</dt><dd>{{ order.expiresAt?'Until '+date(order.expiresAt):'No expiry' }}</dd></div></dl>
      <p v-if="order.note" class="order-receipt__note">{{ order.note }}</p>
    </div>
  </sf-sheet>
</template>
<script>
import {SfSheet} from '@/design-system'
export default {components:{SfSheet},props:{order:Object,locale:String},computed:{amount(){const o=this.order;if(!o)return '';return o.unit==='legacy'?'Legacy unlock':o.unit==='money'?new Intl.NumberFormat(this.locale||'en-US',{style:'currency',currency:o.currency}).format(o.amount/100):new Intl.NumberFormat(this.locale||'en-US').format(o.amount)}},methods:{date(v){return new Intl.DateTimeFormat(this.locale||'en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(v))}}}
</script>
<style scoped>
.order-receipt{padding-bottom:16px}.order-receipt__summary{text-align:center;padding:4px 8px 26px}.order-receipt__summary>span{font-size:12px;line-height:18px;color:#3d7857}.order-receipt__summary h3{font-size:21px;line-height:28px;font-weight:600;margin:12px 0 6px}.order-receipt__summary p{font-size:12px;line-height:18px;color:var(--sf-text-secondary);margin:0}.order-receipt__summary>strong{display:block;font-size:30px;line-height:38px;font-weight:600;margin-top:18px}.order-receipt__summary small{font-size:12px;line-height:18px;font-weight:400;color:var(--sf-text-secondary)}.order-receipt dl{margin:0;border-top:1px solid var(--sf-content-edge)}.order-receipt dl>div{display:flex;align-items:baseline;justify-content:space-between;gap:18px;padding:13px 0;border-bottom:1px solid var(--sf-content-edge);font-size:12px;line-height:19px}.order-receipt dt{color:var(--sf-text-secondary);flex:none}.order-receipt dd{margin:0;text-align:right;overflow-wrap:anywhere;min-width:0}.order-receipt__note{font-size:12px;line-height:20px;color:var(--sf-text-secondary);margin:16px 0 0}
</style>
