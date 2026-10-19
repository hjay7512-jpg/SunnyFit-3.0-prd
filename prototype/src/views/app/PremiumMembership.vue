<template>
  <div class="membership-usage premium-page" :data-membership-state="member.state">
    <section class="premium-account-overview" aria-label="Membership & Usage overview"><p class="premium-eyebrow">YOUR MEMBERSHIP &amp; USAGE</p><div class="premium-current"><span><span class="premium-status-dot" :class="{'is-active':member.active}"></span>{{ member.active?'SunnyFit Premium':'SunnyFit Free' }}</span><sf-badge :tone="member.active?'success':member.state==='expired'?'warning':'neutral'">{{ member.label }}</sf-badge></div>
    <p v-if="member.expiry" class="premium-status-date">{{ member.state==='expired'?'Premium ended on ':member.state==='canceled'?'Premium access until ':'Next renewal on ' }}{{ date(member.expiry) }}</p>
    <coach-allowance :view="member" @go="go" @upgrade="openOffers" @retry="$emit('retry')"/></section>
    <section v-if="!member.active" class="premium-hero">
      <div class="premium-brand"><sf-icon name="membership" :size="17"/> SUNNYFIT <strong>PREMIUM</strong></div>
      <h2>{{ member.state==='expired'?'Pick up your\ntraining rhythm.':'A plan to follow.\nMore ways to move.' }}</h2>
      <p>Find your next trainer-led workout, explore a new route, and turn your goals into a training plan.</p>
      <div class="premium-photo-grid" aria-hidden="true"><div class="premium-photo-grid__main"><img src="/assets/figma/restored/source_course_current/imgPexelsAndreaPiacquadio3757944.webp" alt=""><span>Move with purpose</span></div><div class="premium-photo-grid__side"><img src="/assets/figma/restored/source_workout_banner/imgRectangle1771.webp" alt=""><span>Explore more</span></div><span class="premium-photo-grid__tag"><sf-icon name="spark" :size="14"/> Made for your momentum</span></div>
    </section>
    <div v-if="member.state==='expired'" class="premium-retention"><sf-icon name="check" :size="18"/><p>Your workout history and saved conversations are still here. Pick up where you left off.</p></div>
    <section class="premium-benefits"><div class="premium-section-heading"><p class="premium-eyebrow">{{ member.active?'INCLUDED WITH YOUR MEMBERSHIP':'WHAT PREMIUM ADDS' }}</p><h3>{{ member.active?'Make time for your next move.':'Build a routine you look forward to.' }}</h3><p v-if="member.active" class="premium-benefits-intro">Your training benefits are ready, even when your conversation allowance runs out.</p></div>
      <article v-for="(benefit,index) in benefits" :key="benefit.title" class="premium-benefit"><span class="premium-benefit__icon" :class="'premium-benefit__icon--'+index"><sf-icon :name="benefit.icon" :size="21"/></span><div><h4>{{ benefit.title }}</h4><p>{{ benefit.description }}</p><button v-if="member.active" type="button" class="premium-benefit-link" @click="go(benefit.screen)">{{ benefit.action }} <span aria-hidden="true">→</span></button></div></article>
    </section>
    <section v-if="!member.active" class="premium-compare"><p class="premium-eyebrow">CHOOSE WHAT FITS YOUR ROUTINE</p><h3>Start free.<br>Add more with Premium.</h3><p class="premium-compare__intro">Keep your free workouts, training records and basic weekly stats on either plan.</p><table><caption class="sf-visually-hidden">Free and Premium benefits comparison</caption><thead><tr><th scope="col">What’s included</th><th scope="col">Free</th><th scope="col">Premium</th></tr></thead><tbody><tr v-for="row in comparison" :key="row[0]"><th scope="row">{{ row[0] }}</th><td>{{ row[1] }}</td><td>{{ row[2] }}</td></tr></tbody></table></section>
    <section class="premium-help"><h3>A few things to know</h3><details><summary>How does AI Coach allowance work?</summary><p>Free and Premium both have a finite conversation allowance. Your first Premium subscription gives you new allowance immediately. Unlimited conversations apply only during eligible limited-time events; regular allowance applies when the event ends.</p></details><details><summary>Will I still have free workouts?</summary><p>Yes. Free courses, free World Tours and free Training Programs remain available, along with your workout records and basic weekly stats.</p></details><details><summary>What happens if my membership expires?</summary><p>Your account returns to Free. Your training history and saved conversations remain available. Starting Premium content or activating a new Dynamic Plan requires an active membership.</p></details><details><summary>Can I cancel my subscription?</summary><p>You can turn off renewal in subscription settings. Your Premium access continues until the end of the current paid period.</p></details></section>
    <div class="premium-footer-links"><button type="button" :disabled="busy" @click="$emit('restore')">Restore purchases</button><span>·</span><button type="button" @click="go('billing',{parent:'membership'})">Billing history</button></div>
    <div class="premium-cta"><p v-if="!member.active&&priceSummary" class="premium-price-summary">{{ priceSummary }}</p><sf-button :appearance="member.active?'glass':'v3-full'" :disabled="busy" @click="member.active?panel='manage':openOffers()">{{ member.active?'Manage subscription':member.state==='expired'?'Rejoin Premium':'Explore Premium' }}</sf-button><small>{{ member.active?(member.state==='canceled'?'Renewal off · Access until '+date(member.expiry):'Next renewal · '+date(member.expiry)):'One Premium tier. Choose your billing period next.' }}</small></div>

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
import {premiumOffers} from './premium-offers'
import './membership-mvp.css'
export default {
  components:{SfIcon,SfBadge,SfButton,SfSheet,CoachAllowance},props:{data:Object,locale:String,busy:Boolean},
  data(){return {panel:'',benefits:[
    {icon:'play',title:'Premium workouts',description:'Find a trainer-led session for your day, with more ways to move at home.',screen:'workout',action:'Find a workout'},
    {icon:'spark',title:'Premium World Tours',description:'Make your next session a change of scenery with real-world routes.',screen:'world-tour',action:'Explore routes'},
    {icon:'calendar',title:'Premium Training Programs',description:'Follow a sequence of workouts so you know what comes next.',screen:'program',action:'Browse your Program'},
    {icon:'check',title:'Dynamic Plans',description:'Turn a plan you preview with AI Coach into your active training routine.',screen:'plan',action:'Open your plan'},
    {icon:'eye',title:'Workout & weekly AI insights',description:'Reflect on each session and your weekly workout mix, beyond the basic stats.',screen:'weekly',action:'View your week'},
    {icon:'coach',title:'AI Coach conversation allowance',description:'Get support for your training questions with a finite allowance. Your first subscription adds new allowance immediately.',screen:'coach',action:'Open AI Coach'},
    {icon:'calendar',title:'Limited Challenges',description:'Join eligible challenges while registration is open. Event dates and rules apply.',screen:'challenge',action:'Explore challenges'}
  ],comparison:[['Courses & World Tours','Free selection','Free + Premium'],['Training Programs','Free selection','Free + Premium'],['Records & basic stats','Included','Included'],['Workout & weekly insights','—','Included'],['Activate Dynamic Plans','—','Included'],['AI Coach','Free allowance','Member allowance'],['Limited Challenges','—','Eligible events']] }},
  computed:{member(){return membershipView(this.data,this.$route.query)},priceSummary(){return premiumOffers(this.data).map(({sku})=>new Intl.NumberFormat('en-US',{style:'currency',currency:sku.currency}).format(sku.priceCents/100)+(sku.billingPeriod==='annual'?' / year':' / month')).join(' · ')}},
  watch:{'$route.query.membershipState'(){if(this.panel!=='renewal')this.panel=''}},
  methods:{
    date:membershipDate,
    go(screen,extra){this.$emit('go',screen,extra)},
    closePanel(){this.panel=''},
    openOffers(){this.$emit('subscribe')},
    async toggleRenewal(){
      const next=this.member.state==='canceled'?'active':'canceled';
      await new Promise(resolve=>this.$router.replace({path:this.$route.path,query:{...this.$route.query,membershipState:next}},resolve,resolve));
      this.panel='renewal';
    }
  }
}
</script>
