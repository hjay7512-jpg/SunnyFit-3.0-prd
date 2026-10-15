<template>
  <div class="profile-secondary-page" :data-profile-screen="screen" :data-profile-item="item||null">
    <template v-if="screen==='invite'">
      <sf-card title="Invite Friends"><template #accessory><sf-icon name="user-round-plus"/></template><p>Share SunnyFit with friends and family.</p><sf-button block @click="copyInvite">Copy app link</sf-button><p class="profile-secondary-caption">Reward eligibility and amounts are not connected in this demo.</p></sf-card>
      <sf-card title="Rewards"><strong class="profile-secondary-value">{{ data.user.rewards===undefined?'—':data.user.rewards }}</strong></sf-card>
      <sf-field v-if="manualCopy" label="App link" :value="resources.app" readonly/>
    </template>
    <template v-else-if="screen==='equipment-shop'">
      <sf-card title="Sunny Health &amp; Fitness"><template #accessory><sf-icon name="shopping-bag"/></template><p>Browse Sunny equipment in the official store.</p><sf-menu-row label="Shop Sunny Equipment" description="Opens in your browser" :href="resources.shop" target="_blank"/></sf-card>
    </template>
    <template v-else-if="!item">
      <div class="profile-secondary-menu">
        <sf-menu-row v-for="row in menu" :key="row.id" :label="row.label" :data-menu-id="row.id" :data-business-reference="row.nodeId" @click="open(row)"><template v-if="value(row.id)" #accessory>{{ value(row.id) }}</template></sf-menu-row>
      </div>
      <template v-if="screen==='settings'&&!section"><sf-button appearance="glass" block disabled data-business-reference="6977:11271">Log Out</sf-button><p class="profile-secondary-caption">Sign-in and sign-out are not connected in this demo.</p></template>
      <p v-if="section==='preferences'" class="profile-secondary-caption">Choices saved here apply only to this local preview.</p>
    </template>
    <template v-else>
      <sf-card v-if="['my-profile','my-account'].includes(item)" :title="data.user.name"><template #accessory><sf-avatar :name="data.user.name" :src="data.user.avatarUrl" :size="48"/></template><p v-if="item==='my-account'">{{ data.user.id }}</p><p class="profile-secondary-caption">Profile editing and account actions are not connected in this demo.</p></sf-card>
      <sf-card v-else-if="item==='units'" title="Unit System" data-business-reference="410:7304">
        <fieldset class="profile-secondary-choices"><legend class="sf-visually-hidden">Unit System</legend><sf-choice v-model="draftUnits" type="radio" name="profile-units" option="metric" label="Metric" description="kg / cm / km"/><sf-choice v-model="draftUnits" type="radio" name="profile-units" option="imperial" label="Imperial" description="lb / ft / mi"/></fieldset>
        <p class="profile-secondary-caption">Saved for this local preview. Device units and account data remain unavailable.</p><sf-button block :disabled="!draftUnits" @click="save('units',draftUnits)">Save preview</sf-button>
      </sf-card>
      <sf-card v-else-if="item==='fitness-goal'" title="My Fitness Goal" data-business-reference="6977:11285"><fieldset class="profile-secondary-choices"><legend class="sf-visually-hidden">My Fitness Goal</legend><sf-choice v-for="goal in goals" :key="goal" v-model="draftGoal" type="radio" name="profile-goal" :option="goal" :label="goal"/></fieldset><p class="profile-secondary-caption">This preview choice does not generate or change a training plan.</p><sf-button block :disabled="!draftGoal" @click="save('goal',draftGoal)">Save preview</sf-button></sf-card>
      <sf-card v-else-if="item==='language'" title="Language"><p>English</p><p class="profile-secondary-caption">This demo currently supports English. Account language settings are not connected.</p></sf-card>
      <sf-card v-else-if="item==='legal'" title="User Agreement and Privacy Policy"><sf-menu-row label="Terms of Use" description="Official website · opens in your browser" :href="resources.terms" target="_blank"/><sf-menu-row label="Privacy Policy" description="Official website · opens in your browser" :href="resources.privacy" target="_blank"/></sf-card>
      <sf-card v-else-if="item==='contact'" title="Contact Us"><p>support@sunnyfit.com</p><sf-menu-row label="Email SunnyFit support" description="Opens your email app" :href="resources.contact"/><p class="profile-secondary-caption">Opening an email does not send it.</p></sf-card>
      <sf-card v-else-if="resourcesForItem" :title="activeRow.label"><sf-menu-row :label="resourcesForItem.label" description="Official website · opens in your browser" :href="resourcesForItem.href" target="_blank"/></sf-card>
      <sf-card v-else-if="item==='about'" title="SunnyFit"><p>V3.0 local demo</p><sf-menu-row label="About SunnyFit" description="Official website · opens in your browser" :href="resources.app" target="_blank"/></sf-card>
      <sf-feedback v-else tone="info" :title="activeRow.label" :description="unavailableCopy"/>
    </template>
    <sf-feedback v-if="error" tone="error" title="Couldn’t save this preview" :description="error"/>
    <sf-toast :open="!!feedback" :message="feedback" @input="feedback=''"/>
  </div>
</template>
<script>
import {SfMenuRow,SfButton,SfCard,SfIcon,SfAvatar,SfFeedback,SfToast,SfChoice,SfField} from '@/design-system'
import {profileMenus,profileResources,fitnessGoals} from './profile-menu'
import {readProfilePreferences,saveProfilePreferences} from '@/demo/profile-preferences'
export default {
  name:'ProfileSecondary',components:{SfMenuRow,SfButton,SfCard,SfIcon,SfAvatar,SfFeedback,SfToast,SfChoice,SfField},
  props:{screen:String,section:String,item:String,parent:String,data:Object},
  data(){const preferences=readProfilePreferences(this.data.user.id);return {preferences,draftUnits:preferences.units,draftGoal:preferences.goal,feedback:'',error:'',manualCopy:false,resources:profileResources,goals:fitnessGoals}},
  computed:{
    menu(){return profileMenus[this.section==='preferences'?'preferences':this.screen]||[]},
    activeRow(){return this.menu.find(row=>row.id===this.item)||{label:'Unavailable section'}},
    resourcesForItem(){return {guide:{label:'SunnyFit guides',href:this.resources.guide},faq:{label:'SunnyFit FAQs',href:this.resources.faq},'supported-equipment':{label:'Compatible Sunny equipment',href:this.resources.equipment}}[this.item]},
    unavailableCopy(){return ({'my-equipment':'Account equipment data and Bluetooth pairing are not connected in this demo.','health-app':'Apple Health and Google Fit access are not connected in this browser preview.',snaps:'Your Snaps are not connected in this demo.',ranking:'Account rankings are not connected in this demo.',privacy:'Account privacy settings are not connected. No sharing permission has been changed.',notifications:'App notification settings are not connected. This preview does not request notification permission.',cache:'Download cache management is not connected in this demo. No saved conversations, orders or preferences have been removed.',update:'App updates are not connected. This is a local V3.0 demo.','max-heart-rate':'Age and maximum heart rate are not provided by the demo account. No value has been estimated or saved.'})[this.item]||'This existing section is not connected in the local demo.'}
  },
  methods:{
    value(id){return id==='units'?(this.preferences.units?this.preferences.units==='metric'?'Metric':'Imperial':''):id==='fitness-goal'?this.preferences.goal:''},
    open(row){
      if(row.target){this.$emit('go',row.target,{profileParent:this.screen});return}
      if(row.id==='preferences'){this.$emit('go','settings',{profileSection:'preferences'});return}
      if(this.screen==='community'&&row.id==='privacy'){this.$emit('go','settings',{profileItem:'privacy',profileParent:'community'});return}
      this.$emit('go',this.screen,{profileItem:row.id,profileSection:this.section||undefined,profileParent:this.parent||undefined})
    },
    save(key,value){try{this.preferences=saveProfilePreferences(this.data.user.id,{...this.preferences,[key]:value});this.error='';this.feedback='Saved for this local preview.'}catch(_){this.error='Browser storage is unavailable. Your choice has not been saved.'}},
    async copyInvite(){try{if(!navigator.clipboard)throw Error();await navigator.clipboard.writeText(this.resources.app);this.feedback='App link copied.'}catch(_){this.manualCopy=true;this.feedback='Select and copy the app link below.'}}
  }
}
</script>
