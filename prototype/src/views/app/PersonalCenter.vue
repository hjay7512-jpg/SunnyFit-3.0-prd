<template>
  <div class="personal-center" data-node-id="249:2123">
    <section class="profile-identity-card" data-node-id="249:2125">
      <button type="button" class="profile-identity-top" @click="$emit('go','settings',{profileItem:'my-profile',profileParent:'profile'})"><sf-avatar :name="data.user.name" :src="data.user.avatarUrl" :size="48"/><div class="profile-identity-copy"><h2 data-node-id="249:2130">{{ data.user.name }}</h2><p>View profile</p></div><span aria-hidden="true">›</span></button>
      <div class="profile-rewards" data-node-id="249:2133"><div><strong>{{ data.user.rewards===undefined?'—':data.user.rewards }}</strong><small>Rewards</small></div><div><strong>{{ data.user.badges===undefined?'—':data.user.badges }}</strong><small>Badges</small></div></div>
    </section>
    <button type="button" class="profile-membership mvp-membership-card mvp-unified-entry" :class="['profile-membership--'+member.state,'profile-membership--quota-'+allowanceState,{'mvp-membership-card--active':member.active}]" :data-membership-state="member.state" :data-allowance-state="allowanceState" data-node-id="249:2140" @click="$emit('go','membership')">
      <span class="profile-membership__top"><span class="profile-membership__icon" aria-hidden="true"><sf-icon name="membership" :size="18"/></span><span class="profile-membership__heading"><strong>{{ $copy('profile.card.title') }}</strong></span><span class="profile-membership__chevron" aria-hidden="true">›</span></span>
      <span class="profile-membership__status"><sf-badge :tone="member.state==='expired'||member.state==='canceled'?'warning':member.active?'success':'neutral'">{{ statusLabel }}</sf-badge><span v-if="statusDetail" class="profile-membership__date">{{ statusDetail }}</span></span>
      <span class="profile-usage-summary"><span>{{ $copy(allowanceState==='low'?'profile.allowance.low':'profile.allowance.label') }}</span><strong v-if="member.unlimited" aria-label="Unlimited conversations">∞ <small>Limited-time</small></strong><strong v-else-if="member.percent!==null">{{ member.percent }}% <small>left</small></strong><span v-else>Unavailable</span></span>
      <span v-if="!member.unlimited&&member.percent!==null" class="coach-allowance__track" role="progressbar" aria-label="Conversation allowance remaining" :aria-valuenow="member.percent" aria-valuemin="0" aria-valuemax="100"><span :style="{width:member.percent+'%'}"></span></span>
      <span v-if="allowanceMessage" class="profile-membership__allowance-note">{{ allowanceMessage }}</span>
    </button>
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
import {membershipView,membershipDate} from './membership-view'
import './membership-mvp.css'
export default {
  components:{SfMenuRow,SfAvatar,SfIcon,SfBadge},props:{data:Object},
  computed:{
    member(){return membershipView(this.data,this.$route.query)},
    allowanceState(){return this.member.unlimited?'campaign':this.member.percent===null?'unavailable':this.member.percent===0?'empty':this.member.percent<=20?'low':'available'},
    statusLabel(){return this.$copy('profile.status.'+this.member.state)},
    statusDetail(){
      const m=this.member,expiry=this.shortDate(m.expiry)
      if(m.state==='free')return this.$copy('profile.card.freePrompt')
      if(m.state==='expired')return expiry?'Ended '+expiry:this.$copy('profile.card.expiredPrompt')
      if(!expiry)return 'Date unavailable'
      if(m.state==='active')return 'Renews '+expiry
      const remaining=Math.max(0,Math.ceil((Date.parse(m.expiry)-Date.now())/86400000))
      return 'Until '+expiry+' · '+remaining+'d left'
    },
    allowanceMessage(){
      const m=this.member
      if(m.unlimited)return 'Unlimited event · Until '+membershipDate(m.campaignEndsAt)
      if(m.percent===null)return this.$copy('profile.allowance.unknown')
      if(m.campaignEnded)return 'Unlimited event ended · Regular allowance applies'
      if(m.percent===0)return this.$copy(m.active?'profile.allowance.emptyMember':m.state==='expired'?'profile.allowance.emptyExpired':'profile.allowance.emptyFree')
      return ''
    }
  },
  methods:{shortDate(value){if(!value)return '';const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',...(date.getUTCFullYear()!==new Date().getUTCFullYear()?{year:'numeric'}:{}),timeZone:'UTC'}).format(date)}}
}
</script>
