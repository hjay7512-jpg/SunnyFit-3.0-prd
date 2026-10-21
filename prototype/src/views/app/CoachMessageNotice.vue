<template>
  <div v-copy-block="'actions.chat'" class="coach-message-notice" :class="{'is-failed':failed,'is-urgent':!failed&&item.quotaReminder.threshold===5}" :role="failed?'alert':'status'" :data-threshold="item.quotaReminder&&item.quotaReminder.threshold">
    <span v-if="failed" class="coach-message-notice__status"><span :title="failureDescription">{{ item.failure==='unknown'?'Allowance unavailable':$copy('actions.chat.empty') }}</span></span>
    <p v-else>{{ $copy('actions.chat.low',{percent:item.quotaReminder.percent}) }}</p>
    <span class="coach-message-notice__separator" aria-hidden="true">·</span>
    <button v-if="item.failure==='unknown'||item.failure==='network'" type="button" aria-label="Try again" @click.stop="$emit('action','chat-retry:'+item.id)">{{ $copy('actions.chat.check') }}</button>
    <button v-else-if="failed&&canSend" type="button" :aria-label="$copy('actions.chat.resendMessage')" @click.stop="$emit('action','chat-retry:'+item.id)">{{ $copy('actions.chat.resend') }}</button>
    <button v-else type="button" :aria-label="member.active?($copy('actions.chat.add')+(failed?' to send':'')):$copy(failed?'actions.chat.upgradeSend':'membership.preview.explore')" @click.stop="$emit('action','chat-pay:'+item.id)">{{ $copy(member.active?'actions.chat.add':'actions.chat.upgrade') }}</button>
  </div>
</template>
<script>
export default {props:{item:Object,member:Object,canSend:Boolean},computed:{failed(){return this.item.delivery==='failed'},failureDescription(){return this.item.failure==='unknown'?'Couldn’t check your conversation allowance.':'Your conversation allowance is used up.'}}}
</script>
<style scoped>
.coach-message-notice{display:flex;align-items:center;align-self:flex-end;gap:6px;max-width:calc(100% - 52px);min-width:0;min-height:24px;margin-right:8px;font-size:12px;line-height:18px;color:var(--sf-text-secondary);white-space:nowrap;box-sizing:border-box}.coach-message-notice p{min-width:0;overflow:hidden;text-overflow:ellipsis;font-size:12px;line-height:18px;margin:0}.coach-message-notice__status{display:flex;align-items:center;gap:5px;min-width:0}.coach-message-notice__status>span{min-width:0;overflow:hidden;text-overflow:ellipsis}.coach-message-notice__status .sf-icon{flex-shrink:0;color:var(--sf-action)}.coach-message-notice__separator{flex-shrink:0;color:var(--sf-chevron)}.coach-message-notice button{position:relative;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;min-width:44px;min-height:24px;padding:0;border:0;background:none;color:var(--sf-action);font:500 12px/18px var(--sf-font-family);white-space:nowrap;cursor:pointer}.coach-message-notice button:after{content:'';position:absolute;left:0;right:0;top:50%;height:44px;transform:translateY(-50%)}.coach-message-notice.is-urgent p{color:var(--sf-text)}.coach-message-notice button:focus-visible{outline:2px solid var(--sf-action);outline-offset:3px;border-radius:4px}
</style>
