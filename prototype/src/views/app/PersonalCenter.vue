<template>
  <div class="personal-center" data-node-id="249:2123">
    <section class="profile-identity-card" data-node-id="249:2125">
      <button type="button" class="profile-identity-top" @click="$emit('go','settings',{profileItem:'my-profile',profileParent:'profile'})"><sf-avatar :name="data.user.name" :src="data.user.avatarUrl" :size="48"/><div class="profile-identity-copy"><h2 data-node-id="249:2130">{{ data.user.name }}</h2><p>View profile</p></div><span aria-hidden="true">›</span></button>
      <div class="profile-rewards" data-node-id="249:2133"><div><strong>{{ data.user.rewards===undefined?'—':data.user.rewards }}</strong><small>Rewards</small></div><div><strong>{{ data.user.badges===undefined?'—':data.user.badges }}</strong><small>Badges</small></div></div>
    </section>
    <button type="button" class="profile-membership" data-node-id="249:2140" @click="$emit('go','membership')"><span class="profile-membership__icon" aria-hidden="true"><sf-icon name="membership" :size="22" /></span><div class="profile-membership__copy"><div class="profile-membership__heading"><strong>Membership &amp; Usage</strong><sf-badge :tone="data.effective.membershipActive?'accent':'neutral'">{{ data.effective.membershipActive?'Premium':'Free' }}</sf-badge></div><p>{{ data.policyVersion===20261014?aiBalance+' AI Coach Credits available':chatAllowance?'AI Coach · '+chatAllowance.remaining+' of '+chatAllowance.amount+' replies left':'AI Coach · extra Credits usage' }}</p></div><span class="profile-membership__chevron" aria-hidden="true">›</span></button>
    <section class="profile-existing-menu" data-node-id="249:2148">
      <sf-menu-row icon="heart-pulse" label="Devices &amp; Health" description="My Equipment · Health App" @click="$emit('go','devices')" />
      <sf-menu-row data-node-id="249:2154" icon="receipt-text" label="My Orders" description="Purchases &amp; subscription history" @click="$emit('go','billing',{parent:'profile'})" />
      <sf-menu-row icon="users-round" label="Community &amp; Privacy" description="Snaps · Ranking · Privacy" @click="$emit('go','community')" />
      <sf-menu-row icon="settings" label="Settings" description="Account · Preferences · Legal" @click="$emit('go','settings')" />
      <sf-menu-row icon="circle-question-mark" label="Help &amp; Support" description="Guide · FAQs · Contact" @click="$emit('go','support')" />
    </section>
    <div class="profile-secondary-group"><sf-menu-row data-node-id="249:2174" icon="user-round-plus" label="Invite friends, earn rewards" description="Limited-time reward" @click="$emit('go','invite')"/><sf-menu-row data-node-id="249:2179" icon="shopping-bag" label="Shop Sunny Equipment" @click="$emit('go','equipment-shop')"/></div>
  </div>
</template>
<script>
import {SfMenuRow,SfAvatar,SfIcon,SfBadge} from '@/design-system'
export default {components:{SfMenuRow,SfAvatar,SfIcon,SfBadge},props:{data:Object},computed:{aiBalance(){return (this.data.wallet.accounts.find(account=>account.code==='AI_COACH_CREDIT')||{available:0}).available},chatAllowance(){return this.data.wallet.includedUsage.find(r=>r.serviceId==='ai_chat'&&this.data.services.some(s=>s.id===r.serviceId&&s.access.entitlementAllowed))}}}
</script>
