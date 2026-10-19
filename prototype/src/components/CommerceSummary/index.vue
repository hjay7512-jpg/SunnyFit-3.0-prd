<template>
  <div class="commerce-summary">
    <dl class="read-detail"><template v-for="entry in rows"><dt :key="entry.key+'-label'">{{ entry.label }}</dt><dd :key="entry.key">{{ entry.value }}</dd></template></dl>
    <el-table v-if="config.skus" :data="config.skus" row-key="id" border><el-table-column prop="id" label="SKU" min-width="170"/><el-table-column prop="channel" label="Channel" width="110"/><el-table-column prop="storeCode" label="Store Code" min-width="210"/><el-table-column label="Price" width="110"><template slot-scope="s">{{ money(s.row.priceCents,s.row.currency) }}</template></el-table-column><el-table-column label="Period" width="90"><template slot-scope="s">{{ config.kind==='membership' ? (s.row.billingPeriod?(s.row.billingPeriod==='annual'?'Calendar year':'Calendar month'):s.row.durationDays+' days') : '—' }}</template></el-table-column><el-table-column prop="status" label="Status" width="100"/></el-table>
  </div>
</template>
<script>
import { money } from '@/api/commerce'
import { labels, typeLabel } from '@/views/commercialization/commerce-definitions'
import { dateTime,scopeLabel } from '@/utils/format'
import {creditTypeLabel,creditGrantLabel} from '@/utils/entitlements'
import {describeTraining} from '../../../config/movement-training.cjs'
export default {
  name: 'CommerceSummary', props: { config: { type: Object, required: true }, references: { type: Object, default: () => ({}) },catalog:{type:Array,default:()=>[]} },
  computed: { rows() { return Object.entries(this.config).filter(([key]) => !['id','version','skus'].includes(key)).map(([key,value]) => ({ key, label: labels[key] || key, value: this.format(key,value) })) } },
  methods: {
    money,
    format(key,value) {
      if (value === null || value === '') return key === 'redemptionValidityDays' ? 'No expiry' : '—'
      if (key === 'suitId') return this.references[value] || value
      if (key === 'scope') return scopeLabel(this.definition(this.config.entitlementCode),[value])
      if (key === 'members') return value.map(id => this.references[id] || id).join(', ') || '—'
      if (key === 'training') return describeTraining(value)
      if (key === 'challengeRules') return `${dateTime(value.startsAt)} → ${dateTime(value.endsAt)} · ${value.target}`
      if (key === 'policyVersion') return value===20261014?'Current MVP definition · 2026-10-14':value
      if (key === 'credits' && typeof value === 'object') return `${value.amount} ${creditTypeLabel(value.creditType||'LEGACY_CREDIT')} · ${value.validityDays===null?'No expiry':value.validityDays+' days'}`
      if (key === 'creditGrants') return value.map(creditGrantLabel).join('; ')||'None'
      if (key === 'creditBenefit') return `${value.amount} Credits · ${typeLabel(value.cadence)} · ${value.validityDays} days`
      if (key === 'items') return value.map(item => `${item.code}: ${item.scopes?scopeLabel(this.definition(item.code),item.scopes):'Feature available'}`).join('; ')
      if (key === 'includedServices') return value.map(rule=>`${rule.serviceId}: ${rule.amount}/${rule.period} · ${rule.allowOverage?'confirmed overage allowed':'wait for reset'}`).join('; ') || 'None'
      if (['startsAt','endsAt'].includes(key)) return dateTime(value)
      if (['redemptionCredits','creditAmount','credits'].includes(key)) return value + ' Credits'
      if (['validityDays','redemptionValidityDays','grantDurationDays','creditValidityDays'].includes(key)) return value + ' days'
      if (key === 'durationMinutes') return value + ' min'
      return typeLabel(value)
    },
    definition(code){return this.catalog.find(item=>item.code===code)||{scopes:[]}}
  }
}
</script>
