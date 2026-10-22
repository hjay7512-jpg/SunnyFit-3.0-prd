<template>
  <section class="coach-allowance" :class="{'coach-allowance--low':!view.unlimited&&view.percent!==null&&view.percent<=20}" aria-label="AI Coach conversation allowance">
    <div class="coach-allowance__top"><span class="coach-allowance__icon"><sf-icon name="coach" :size="22"/></span><div><h3>AI Coach</h3><p v-copy-block="{id:'actions.allowance',fields:[view.active?'actions.allowance.member':'actions.allowance.free']}">{{ view.unlimited?'Limited-time unlimited event':$copy(view.active?'actions.allowance.member':'actions.allowance.free') }}</p></div><span v-if="view.unlimited" class="coach-unlimited" aria-label="Unlimited conversations">∞</span><strong v-else-if="view.percent!==null" class="coach-percent">{{ view.percent }}<small>% left</small></strong></div>
    <p v-if="view.unlimited" class="coach-allowance__detail"><span class="coach-included-dot"></span>Unlimited until {{ date(view.campaignEndsAt) }}. Your regular allowance applies after the event.</p>
    <template v-else-if="view.percent!==null"><div class="coach-allowance__track" role="progressbar" aria-label="Conversation allowance remaining" :aria-valuenow="view.percent" aria-valuemin="0" aria-valuemax="100"><span :style="{width:view.percent+'%'}"></span></div><p v-if="view.percent<=20||view.resetAt" class="coach-allowance__detail">{{ view.percent===0?'You’ve used your conversation allowance.':view.percent<=20?'Your conversation allowance is running low.':'' }}<span v-if="view.resetAt"> Resets {{ date(view.resetAt) }}.</span></p></template>
    <p v-else class="coach-allowance__detail">Your conversation allowance is temporarily unavailable.</p>
    <p v-if="view.campaignEnded" class="coach-allowance__detail">The unlimited event has ended. Your regular allowance now applies.</p>
    <p v-if="view.purchasedCredits>0" class="coach-allowance__detail">{{ view.purchasedCredits }} purchased AI Coach Credits</p>
    <button v-if="view.percent===null" type="button" class="coach-allowance__action" @click="$emit('retry')">Refresh balance <sf-icon name="refresh" :size="16"/></button>
    <button v-else-if="!view.unlimited&&view.percent===0" type="button" v-copy-block="{id:'actions.allowance',fields:[view.active?'actions.allowance.topup':'actions.allowance.upgrade']}" class="coach-allowance__action" @click="view.active?$emit('go','wallet',{creditType:'AI_COACH_CREDIT'}):$emit('upgrade')">{{ $copy(view.active?'actions.allowance.topup':'actions.allowance.upgrade') }} <span aria-hidden="true">↗</span></button>
  </section>
</template>
<script>
import {SfIcon} from '@/design-system'
import {membershipDate} from './membership-view'
export default {components:{SfIcon},props:{view:{type:Object,required:true}},methods:{date:membershipDate}}
</script>
