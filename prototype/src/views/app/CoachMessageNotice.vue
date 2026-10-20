<template>
  <div class="coach-message-notice" :class="{'is-failed':failed,'is-urgent':!failed&&item.quotaReminder.threshold===5}" :role="failed?'alert':'status'" :data-threshold="item.quotaReminder&&item.quotaReminder.threshold">
    <span class="coach-message-notice__status" v-if="failed"><sf-icon name="alert" :size="14"/><span>{{ item.failure==='unknown'?'Not sent · Couldn’t check your allowance':item.failure==='network'?'Not sent · Please try again':'Not sent · No conversation allowance left' }}</span></span>
    <p v-else>{{ item.quotaReminder.percent }}% of your conversation allowance remains.</p>
    <button v-if="item.failure==='unknown'||item.failure==='network'" type="button" @click.stop="$emit('action','chat-retry:'+item.id)">Try again</button>
    <button v-else-if="failed&&canSend" type="button" @click.stop="$emit('action','chat-retry:'+item.id)">Resend message<sf-icon name="arrow" :size="13"/></button>
    <button v-else type="button" @click.stop="$emit('action','chat-pay:'+item.id)">{{ member.active?(failed?'Add credits to send':'Add credits'):(failed?'Upgrade to send':'Explore Premium') }}<sf-icon name="arrow" :size="13"/></button>
  </div>
</template>
<script>
import {SfIcon} from '@/design-system'
export default {components:{SfIcon},props:{item:Object,member:Object,canSend:Boolean},computed:{failed(){return this.item.delivery==='failed'}}}
</script>
<style scoped>
.coach-message-notice{align-self:flex-end;width:calc(100% - 44px);font-size:12px;line-height:18px;color:var(--sf-text-secondary);padding:0 6px 0 8px;box-sizing:border-box}.coach-message-notice p{font-size:12px;line-height:18px;margin:0}.coach-message-notice__status{display:flex;gap:5px;align-items:flex-start;color:var(--sf-action)}.coach-message-notice__status .sf-icon{flex-shrink:0;margin-top:2px}.coach-message-notice button{display:flex;align-items:center;gap:6px;min-height:44px;padding:5px 0;border:0;background:none;color:var(--sf-action);font:500 12px/18px var(--sf-font-family);cursor:pointer}.coach-message-notice.is-urgent p{color:var(--sf-text)}.coach-message-notice button:focus-visible{outline:2px solid var(--sf-action);outline-offset:3px;border-radius:4px}
</style>
