<template>
  <div class="context-subscription">
    <coach-credits-purchase v-if="gate&&gate.kind==='credits'" :gate="gate" :offers="creditOffers" @close="$emit('close')" @select="$emit('select',$event)" @purchase="$emit('purchase',$event)" @resume="$emit('resume')" @retry="$emit('retry')" @check="$emit('check')"/>
    <sf-paywall v-else-if="showWall" :open="!!gate" :wall="wall" :draft="gate.context.draft" :selected-id="selectedId" :view="gate.view||'quick'" :benefit-id="gate.benefitTab" :positions="readingPositions" :processing="processing" :processing-label="gate.stage==='restoring'?'Restoring purchases…':'Confirming purchase…'" :disclosure="disclosure" :feedback="gate.feedback" :terms-url="resources.terms" :privacy-url="resources.privacy" @close="$emit('close',selectedOffer)" @select="selectOffer" @purchase="$emit('purchase',$event)" @restore="$emit('restore')" @reload="$emit('reload')" @view="$emit('view',{view:$event,offer:selectedOffer})" @benefit="$emit('benefit',$event)" @position="saveReading"/>
    <coach-allowance-sheet v-else-if="gate&&['usage','unknown'].includes(gate.kind)&&['offer','refreshing'].includes(gate.stage)" :member="member" :unknown="gate.kind==='unknown'" :busy="processing" :draft="gate.context.draft" @close="$emit('close')" @refresh="$emit('refresh')" @usage="$emit('usage')"/>
    <sf-sheet v-else class="paywall-receipt" :open="!!gate" contained :resizable="false" :title="heading" :busy="processing" @input="$emit('close')">
      <template v-if="gate">
        <span class="paywall-receipt__symbol" :class="'is-'+gate.stage"><sf-icon :name="gate.stage==='success'?'check':gate.kind==='usage'||gate.kind==='unknown'?'coach':gate.stage==='pending'?'refresh':'membership'" :size="30"/></span>
        <p class="paywall-receipt__message">{{ message }}</p>
        <div class="paywall-receipt__resource"><small>{{ gate.context.label }}</small><strong>{{ gate.context.resourceName }}</strong><span v-if="gate.context.detail">{{ gate.context.detail }}</span></div>
        <div v-if="gate.context.draft" class="paywall-receipt__draft"><small>YOUR SAVED MESSAGE</small><p>{{ gate.context.draft }}</p></div>
        <p v-if="gate.stage==='success'" class="paywall-receipt__hint">{{ gate.context.action==='send-message'?'Your message hasn’t been sent yet.':'Your activity will start when you continue.' }}</p>
        <p v-else-if="gate.stage==='pending'" class="paywall-receipt__hint">No need to buy again. Check the status when you’re ready.</p>
      </template>
      <template #footer>
        <sf-button v-if="gate&&gate.stage==='success'" @click="$emit('resume')">{{ gate.context.continueLabel }}</sf-button>
        <sf-button v-else-if="gate&&['failure','cancelled'].includes(gate.stage)" @click="$emit('retry')">Back to plans</sf-button>
        <sf-button v-else-if="gate&&gate.stage==='pending'" @click="$emit('check')">Check purchase status</sf-button>
        <sf-button v-else-if="gate&&['access-error','event-closed'].includes(gate.stage)" @click="$emit('close')">Back to your activity</sf-button>
        <sf-button v-else-if="gate&&gate.kind==='unknown'" :disabled="processing" @click="$emit('refresh')">{{ processing?'Checking allowance…':'Check allowance again' }}</sf-button>
        <sf-button v-else @click="$emit('close')">Back to conversation</sf-button>
        <button v-if="gate&&!processing" type="button" class="paywall-receipt__dismiss" @click="gate.kind==='usage'&&member.active?$emit('usage'):$emit('close')">{{ gate.kind==='usage'&&member.active?'View Membership & Usage':gate.stage==='success'?'Stay here':gate.stage==='pending'?'Return while we confirm':gate.context.cancelLabel }}</button>
      </template>
    </sf-sheet>
  </div>
</template>
<script>
import {SfSheet,SfButton,SfIcon,SfPaywall} from '@/design-system'
import {wallDisclosure} from './subscription-wall.cjs'
import {profileResources} from './profile-menu'
import CoachAllowanceSheet from './CoachAllowanceSheet'
import CoachCreditsPurchase from './CoachCreditsPurchase'
export default {
  components:{CoachCreditsPurchase,CoachAllowanceSheet,SfSheet,SfButton,SfIcon,SfPaywall},props:{creditOffers:Array,gate:Object,member:Object,wall:Object},data(){return{readingPositions:{quick:0,benefits:0},resources:profileResources}},
  computed:{
    showWall(){return this.gate&&this.wall&&this.gate.kind==='membership'&&['offer','processing','restoring'].includes(this.gate.stage)},
    processing(){return ['processing','refreshing','restoring'].includes(this.gate?.stage)},
    selectedId(){const stored=this.gate?.offer;return this.wall?.offers.find(offer=>stored&&offer.offerId===stored.offerId)?.offerId||this.wall?.defaultOfferId||''},
    selectedOffer(){return this.wall?.offers.find(offer=>offer.offerId===this.selectedId)},
    disclosure(){return wallDisclosure(this.selectedOffer)},
    heading(){if(!this.gate)return '';return {success:'You’re ready to continue',failure:'Purchase not completed',cancelled:'Purchase canceled',pending:'Confirming your purchase','access-error':'This item is unavailable','event-closed':'Challenge registration is closed'}[this.gate.stage]||this.gate.title},
    message(){if(!this.gate)return '';const stage=this.gate.stage;if(stage==='success')return this.gate.context.success;if(stage==='failure')return 'Your purchase didn’t go through. Your plan and allowance haven’t changed.';if(stage==='cancelled')return 'Nothing was charged. Your activity is still here.';if(stage==='pending')return 'We’re waiting for purchase confirmation before unlocking Premium.';if(stage==='access-error')return 'Premium is active. Return to check this activity’s availability.';if(stage==='event-closed')return 'This challenge is no longer open. Your Premium membership is still active.';if(this.gate.kind==='unknown')return 'Your draft is saved. Check your allowance before sending.';return 'Your Premium is still active. Your conversation allowance is used up.'}
  },
  watch:{'gate.context.key'(){this.readingPositions={quick:0,benefits:0}}},
  methods:{
    saveReading(position){this.readingPositions={...this.readingPositions,[position.view]:position.top}},
    selectOffer(offer){if(this.selectedId!==offer.offerId)this.$emit('select',offer)}
  }
}
</script>
<style scoped>
.paywall-receipt >>> .sf-modal{max-height:90%;border-radius:25px 25px 0 0}.paywall-receipt >>> .sf-modal__header h2{font-size:23px;line-height:29px;letter-spacing:-.4px}.paywall-receipt >>> .sf-modal__body{padding-top:15px}.paywall-receipt >>> .sf-modal__footer{border-top:0}.paywall-receipt__symbol{width:62px;height:62px;border-radius:21px;display:grid;place-items:center;background:#f8f0e8;color:#b28a5c;margin:8px 0 18px}.paywall-receipt__symbol.is-success{background:#edf6ef;color:#6e9d7a}.paywall-receipt__symbol.is-failure{background:#fbf1ef;color:#c38274}.paywall-receipt__message{font-size:15px;line-height:24px;color:#706975;margin:0 0 22px}.paywall-receipt__resource{display:grid;gap:5px;border-radius:15px;background:#f8f6f9;padding:14px 16px}.paywall-receipt__resource small,.paywall-receipt__draft small{font-size:9px;letter-spacing:.5px;color:#a69bab}.paywall-receipt__resource strong{font-size:15px;line-height:22px;font-weight:600;color:#59505d}.paywall-receipt__resource>span{font-size:11px;color:#9b8fa2}.paywall-receipt__draft{margin-top:16px;padding:13px 16px;border:1px solid #eee8ef;border-radius:15px}.paywall-receipt__draft p{font-size:13px;line-height:21px;color:#827489;max-height:84px;overflow:auto;margin:7px 0 0;white-space:pre-wrap}.paywall-receipt__hint{font-size:11px;line-height:18px;color:#a295a8;margin:15px 0 0}.paywall-receipt__dismiss{min-height:44px;width:100%;padding:10px;border:0;background:none;color:#9c8fa3;font:12px/19px var(--sf-font-family);cursor:pointer}
</style>
