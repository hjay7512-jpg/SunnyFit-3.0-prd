<template>
  <section id="coach-allowance-status" class="coach-quota" :class="{'is-blocked':blocked,'is-low':low}" aria-label="Conversation allowance" :data-quota="status">
    <template v-if="blocked">
      <div class="coach-quota__summary"><span class="coach-quota__icon"><sf-icon :name="unknown?'refresh':member.active?'coach':'spark'" :size="20"/></span><div><h3>{{ title }}</h3><p>{{ detail }}</p></div></div>
      <button type="button" class="coach-quota__action" @click.stop="$emit('action','quota-options')">{{ action }}<sf-icon name="arrow" :size="16"/></button>
    </template>
    <template v-else>
      <button type="button" class="coach-quota__meter" @click.stop="$emit('action','allowance-details')"><i :class="{'is-event':member.unlimited}"/><span>{{ member.unlimited?'Unlimited until '+date(member.campaignEndsAt):member.campaignEnded?'Event ended · '+member.percent+'% left':member.percent+'% allowance left' }}</span><sf-icon name="arrow" :size="13"/></button>
      <button v-if="low&&!member.active" type="button" class="coach-quota__more" aria-label="See Premium options" @click.stop="$emit('action','quota-options')">Explore Premium</button>
    </template>
  </section>
</template>
<script>
import {SfIcon} from '@/design-system'
import {membershipDate} from './membership-view'
export default {
  components:{SfIcon},props:{member:{type:Object,required:true}},
  computed:{
    unknown(){return this.member.percent===null&&!this.member.unlimited},
    blocked(){return !this.member.unlimited&&(this.unknown||this.member.percent===0)},
    low(){return !this.member.unlimited&&this.member.percent>0&&this.member.percent<=20},
    status(){return this.member.unlimited?'campaign':this.unknown?'unknown':this.blocked?'empty':this.low?'low':'available'},
    title(){return this.unknown?'Can’t check your allowance':this.member.active?'Conversation allowance used up':'Keep the conversation going'},
    detail(){if(this.unknown)return 'Your draft is safe. Try checking again.';if(this.member.active)return this.member.resetAt?'Refreshes '+this.date(this.member.resetAt)+'. Premium is still active.':'Your Premium benefits are still available.';return this.member.campaignEnded?'Your unlimited event has ended.':this.member.state==='expired'?'Renew Premium for a fresh allowance.':'You’ve used your free conversation allowance.'},
    action(){return this.unknown?'Check allowance':this.member.active?'View allowance':'See Premium options'}
  },methods:{date:membershipDate}
}
</script>
<style scoped>
.coach-quota{width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 4px;color:var(--sf-text-secondary)}.coach-quota button{font-family:var(--sf-font-family);cursor:pointer;border:0;background:none}.coach-quota__meter{display:flex;align-items:center;gap:7px;min-height:44px;padding:0;color:var(--sf-text-secondary);font-size:12px;line-height:18px}.coach-quota__meter i{width:5px;height:5px;border-radius:50%;background:var(--sf-chevron)}.coach-quota.is-low .coach-quota__meter i{background:var(--sf-action)}.coach-quota__meter i.is-event{background:#4f8568}.coach-quota__meter .sf-icon{color:var(--sf-chevron)}.coach-quota__more{color:var(--sf-action);font-size:12px;line-height:18px;min-height:44px;padding:0}.coach-quota.is-blocked{display:block;padding:13px 14px 5px;border:1px solid var(--sf-content-edge);border-radius:var(--sf-radius-card);background:var(--sf-content-surface);box-shadow:var(--sf-content-shadow)}.coach-quota__summary{display:flex;align-items:flex-start;gap:10px}.coach-quota__icon{width:32px;height:32px;display:grid;place-items:center;flex-shrink:0;border-radius:11px;background:rgba(232,29,29,.06);color:var(--sf-action)}.coach-quota h3{font-size:14px;line-height:20px;font-weight:600;color:var(--sf-text);margin:0 0 3px}.coach-quota p{font-size:12px;line-height:18px;margin:0;color:var(--sf-text-secondary)}.coach-quota__action{display:flex;align-items:center;justify-content:flex-end;gap:8px;min-height:44px;width:100%;padding:5px 0 0;color:var(--sf-action);font-size:13px;font-weight:600;line-height:20px}.coach-quota button:focus-visible{outline:2px solid var(--sf-action);outline-offset:3px;border-radius:5px}
</style>
