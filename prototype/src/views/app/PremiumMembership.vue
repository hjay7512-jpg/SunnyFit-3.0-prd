<template>
  <div class="membership-usage premium-page premium-hub" :data-membership-state="member.state">
    <section class="premium-account-overview" aria-label="Membership & Usage overview">
      <div class="premium-current"><span><span class="premium-status-dot" :class="{'is-active':member.active}"/>{{ member.active?'SunnyFit Premium':$copy('profile.status.free') }}</span><sf-badge v-if="member.active||member.state==='expired'" :tone="member.active?'success':'neutral'">{{ member.active?member.label:$copy('profile.status.expired') }}</sf-badge></div>
      <p v-if="member.expiry" class="premium-status-date">{{ member.state==='expired'?'Premium ended on ':member.state==='canceled'?'Premium access until ':'Next renewal on ' }}{{ date(member.expiry) }}</p>
      <coach-allowance :view="member" @go="go" @upgrade="openOffers('quick')" @retry="$emit('retry')"/>
    </section>

    <section v-if="!member.active" class="membership-discovery" aria-label="Discover Premium">
      <div class="membership-discovery__art" aria-hidden="true"><img src="/assets/figma/restored/source_course_current/imgPexelsAndreaPiacquadio3757944.webp" alt=""/><img src="/assets/figma/restored/source_workout_banner/imgRectangle1771.webp" alt=""/><span><sf-icon name="membership" :size="15"/>{{ $copy('membership.preview.eyebrow') }}</span></div>
      <div class="membership-discovery__body"><h2>{{ $copy(member.state==='expired'?'membership.preview.expiredTitle':'membership.preview.title') }}</h2><p>{{ $copy('membership.preview.description') }}</p><div class="membership-discovery__points"><span v-for="(icon,index) in ['calendar','play','spark']" :key="icon"><sf-icon :name="icon" :size="18"/>{{ $copy('membership.preview.point'+(index+1)) }}</span></div>
        <sf-button class="membership-explore" :disabled="busy" @click="openOffers('benefits')">{{ $copy('membership.preview.explore') }}<sf-icon name="arrow" :size="15"/></sf-button>
        <button type="button" class="membership-view-plans" :disabled="busy" @click="openOffers('quick')">{{ $copy('membership.preview.plans') }} <span aria-hidden="true">→</span></button>
      </div>
    </section>
    <p v-if="member.state==='expired'" class="membership-retained">{{ $copy('membership.preview.retention') }}</p>

    <section v-if="member.active" class="membership-included"><h2>{{ $copy('membership.active.title') }}</h2><p>{{ $copy('membership.active.description') }}</p><div class="membership-shortcuts"><button v-for="item in shortcuts" :key="item.screen" type="button" @click="go(item.screen)"><sf-icon :name="item.icon" :size="22"/><span>{{ item.title }}</span><small>{{ item.label }}</small></button></div><sf-button class="membership-manage" appearance="glass" :disabled="busy" @click="panel='manage'">{{ $copy('membership.manage.button') }}</sf-button></section>
    <div class="premium-footer-links"><button type="button" :disabled="busy" @click="$emit('restore')">{{ $copy('membership.utility.restore') }}</button><span>·</span><button type="button" @click="go('billing',{parent:'membership'})">{{ $copy('membership.utility.history') }}</button></div>

    <sf-sheet :open="!!panel" contained :resizable="false" :title="panel==='manage'?'Your subscription':'Renewal updated'" @input="closePanel">
      <template v-if="panel==='manage'"><div class="premium-manage-summary"><sf-icon name="membership" :size="30"/><h3>SunnyFit Premium</h3><sf-badge tone="success">Active</sf-badge><p>{{ member.state==='canceled'?'Renewal is off. Your access continues until ':'Your membership renews on ' }}{{ date(member.expiry)||'the date shown by your store' }}.</p></div><p class="premium-sheet-lead">{{ member.state==='canceled'?'You can turn renewal back on whenever you’re ready.':'Turning off renewal keeps all your Premium benefits until your current period ends.' }}</p></template>
      <div v-else class="premium-success"><span>✓</span><h3>You’re in control.</h3><p>{{ member.state==='canceled'?'Renewal is off. Enjoy Premium until '+date(member.expiry)+'.':'Renewal is back on. Your Premium benefits continue.' }}</p></div>
      <template #footer><sf-button v-if="panel==='manage'" appearance="glass" @click="toggleRenewal">{{ member.state==='canceled'?'Turn renewal back on':'Turn off renewal' }}</sf-button><sf-button v-else @click="closePanel">Done</sf-button></template>
    </sf-sheet>
  </div>
</template>
<script>
import {SfIcon,SfBadge,SfButton,SfSheet} from '@/design-system'
import CoachAllowance from './CoachAllowance'
import {membershipView,membershipDate} from './membership-view'
import './membership-mvp.css'
export default {
  components:{SfIcon,SfBadge,SfButton,SfSheet,CoachAllowance},props:{data:Object,locale:String,busy:Boolean},
  data(){return {panel:'',shortcuts:[{screen:'workout',icon:'play',title:'Workouts',label:'Find your next session'},{screen:'world-tour',icon:'spark',title:'World Tours',label:'Explore a new route'},{screen:'program',icon:'calendar',title:'Programs',label:'Follow a routine'},{screen:'coach',icon:'coach',title:'AI Coach',label:'Talk through your plan'},{screen:'plan',icon:'check',title:'Your Plan',label:'View upcoming training'},{screen:'weekly',icon:'eye',title:'Insights',label:'Reflect on your week'}]}},
  computed:{member(){return membershipView(this.data,this.$route.query)}},
  watch:{'$route.query.membershipState'(){if(this.panel!=='renewal')this.panel=''}},
  methods:{date:membershipDate,go(screen,extra){this.$emit('go',screen,extra)},closePanel(){this.panel=''},openOffers(view='benefits'){this.$emit('subscribe',view)},async toggleRenewal(){const next=this.member.state==='canceled'?'active':'canceled';await new Promise(resolve=>this.$router.replace({path:this.$route.path,query:{...this.$route.query,membershipState:next}},resolve,resolve));this.panel='renewal'}}
}
</script>
<style scoped>
.premium-page.premium-hub{padding-bottom:18px}.membership-discovery{margin-top:18px;border-radius:20px;overflow:hidden;border:1px solid var(--sf-content-edge);background:var(--sf-content-surface);box-shadow:var(--sf-content-shadow)}.membership-discovery__art{height:132px;display:grid;grid-template-columns:1.55fr 1fr;gap:3px;position:relative;overflow:hidden}.membership-discovery__art>img{width:100%;height:100%;object-fit:cover;object-position:center 30%;min-width:0}.membership-discovery__art>span{position:absolute;left:12px;bottom:10px;display:flex;gap:5px;align-items:center;padding:6px 9px;border-radius:7px;background:#ffffffed;color:#7f5b32;font-size:9px;line-height:15px;letter-spacing:.45px}.membership-discovery__body{padding:20px 18px 10px}.membership-discovery h2{white-space:pre-line;font-size:27px;line-height:32px;letter-spacing:-.7px;font-weight:650;margin:0;color:var(--sf-text);overflow-wrap:anywhere}.membership-discovery__body>p{margin:10px 0 0;font-size:13px;line-height:21px;color:var(--sf-text-secondary)}.membership-discovery__points{display:grid;gap:9px;margin:19px 0 21px}.membership-discovery__points>span{display:flex;align-items:center;gap:9px;font-size:12px;line-height:19px;color:var(--sf-text-secondary)}.membership-discovery__points .sf-icon{color:#a3825b;flex:none}.membership-explore{min-height:48px;font-size:14px;line-height:21px;padding:12px;border-radius:14px}.membership-view-plans{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;min-height:44px;border:0;background:transparent;color:var(--sf-text-secondary);font:500 12px/19px var(--sf-font-family);padding:8px;cursor:pointer}.premium-hub .premium-footer-links{margin:20px 0 0;padding-bottom:6px}.membership-retained{font-size:11px;line-height:19px;margin:14px 6px;color:var(--sf-text-secondary)}.membership-included{margin-top:24px}.membership-included>h2{font-size:21px;line-height:28px;margin:0;font-weight:600}.membership-included>p{font-size:12px;line-height:20px;color:var(--sf-text-secondary);margin:8px 0 16px}.membership-shortcuts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.membership-shortcuts button{display:grid;align-content:start;justify-items:start;gap:7px;min-width:0;border:1px solid var(--sf-content-edge);border-radius:15px;background:var(--sf-content-surface);padding:16px;text-align:left;color:var(--sf-text);font:500 14px/21px var(--sf-font-family);cursor:pointer}.membership-shortcuts .sf-icon{color:#9b7b53;margin-bottom:5px}.membership-shortcuts small{font-size:10px;line-height:16px;font-weight:400;color:var(--sf-text-secondary)}.membership-manage{margin-top:20px;min-height:48px}
</style>
