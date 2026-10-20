import { listUsers, finishService, startService, requestKey, getAsset, access,readWeeklyReport,joinChallenge } from '@/api/commerce';
import commerceMixin from './commerceMixin';
import mvpPreview from './mvp-preview';
import reviewController,{reviewQueryKeys} from './review/review-controller';
import resultFeedback from './result-feedback';
import AppIcon from './AppIcon';
import SourceCanvas from './SourceCanvas';
import ConsumerScreens from './ConsumerScreens';
import MembershipUsage from './PremiumMembership';
import PersonalCenter from './PersonalCenter';
import ProfileSecondary from './ProfileSecondary';
import V3WeeklyReport from './V3WeeklyReport';
import V3Challenge from './V3Challenge';
import V3ContentCollection from './V3ContentCollection';
import V3WorldTour from './V3WorldTour';
import V3Course from './V3Course';
import V3WorkoutResult from './V3WorkoutResult';
import MovementExperience from '@/features/movement/MovementExperience';
import {profileScreens,profileTitle} from './profile-menu';
import { pages, titles, notes } from './references';
import './style.css';
import './fidelity.css';
import './consumer.css';
import './layout-repair.css';
import './account.css';
import './profile-secondary.css';
import './native-screens.css';
import './preview-fit.css';
import './review/review.css';
function accountScrollKey(fullPath,userId){
  const [path,search='']=fullPath.split('?'),query=new URLSearchParams(search);
  return [query.get('user')||userId,path,query.get('profileSection')||'',query.get('profileItem')||''].join(':');
}
function withoutMembershipPreview(fullPath){
  const [path,search='']=fullPath.split('?'),query=new URLSearchParams(search);
  for(const key of ['membershipState','chatRemaining','membershipCycle','allowanceMode','mvpState',...reviewQueryKeys])query.delete(key);query.sort();
  return path+'?'+query.toString();
}
export default {
  components: {
    AppIcon,
    SourceCanvas, ConsumerScreens, MembershipUsage, PersonalCenter, ProfileSecondary,V3WeeklyReport,V3Challenge,V3ContentCollection,V3WorldTour,V3Course,V3WorkoutResult,MovementExperience
  },
  mixins: [commerceMixin,mvpPreview,reviewController,resultFeedback],
  data() {
    return {
      users: [],
      userId: this.$route.query.user || sessionStorage.getItem('sunnyfit-demo-user') || 'DEMO-2002',
      data: null,
      loading: false,
      busy: false,
      error: '',
      aiActivity: 'idle',
      message: '',
      serviceId: 'ai_chat',
      contentId: this.$route.query.content || 'course_premium',
      programId: this.$route.query.program || 'program_featured',
      gate: null,
      quote: null,
      serviceQuote: null,
      pendingService: null,
      serviceRunning: false,
      redemptionQuote: null,
      notice: null,
      showAssets: false,
      showLedger: false,
      savedAsset: null,
      program: null,
      key: '',
      sessionResults: [],
      simulateFailure: false,
      commercial: true,
      sampleConversation: false,
      openedConversation: null,
      coachContext: '',
      sourceGap: '',
      flowState: '',
      appToast:'',
      renewalTarget: null,
      locale: sessionStorage.getItem('sunnyfit-locale') || 'en-US',
      pages,
      accountScrollPositions: {},
      movementView:{stage:'prepare',landscape:false},movementReview:{source:'camera',performance:'auto',framed:false}
    };
  },
  computed: {
    screen() {
      const s = this.$route.params.screen;
      return s || 'home';
    },
    screenTitle() {
      if(this.screen==='world-tour-detail')return 'World Tour';
      if(this.screen==='movement-detail')return 'Workout details';
      if(this.screen==='movement-training')return this.movementView.stage==='prepare'?'Get ready':this.movementView.stage==='setup'?'Camera setup':this.movementView.stage==='summary'?'Workout summary':'Movement training';
      if(profileScreens.includes(this.screen))return profileTitle(this.screen,this.$route.query.profileSection,this.$route.query.profileItem);
      return titles[this.screen];
    },
    isProfileSecondary(){return profileScreens.includes(this.screen);},
    movementContent(){return this.collectionMovementContents.find(c=>c.id===this.contentId)||this.collectionMovementContents.find(c=>c.code==='vision_studio_workout')||this.collectionMovementContents[0]},
    collectionMovementContents(){return (this.presentationData?.contents||[]).filter(c=>c.contentType==='movement')},
    reviewMode() { return this.$route.query.review !== '0'; },
    objectKey() { return this.$route.query.object || (this.screen === 'weekly' ? 'demo-current-week' : 'demo-workout-01'); },
    hasInsight() { return !!(this.data && this.data.assets.some(a => a.type === 'report' && !a.locked && a.serviceCode === 'deep_analysis' && a.objectKey === this.objectKey)); },
    chatInputLocked() { return this.busy || !!this.serviceQuote; },
    activeSubscription() { return this.data.subscriptions.find(s => s.grant.status === 'active') || null; },
    canvasHeight() {
      return {
        result: 876

      }[this.screen] || 812;
    },
    isSourceScreen() {
      return ['home', 'workout', 'course', 'program', 'coach', 'result', 'plan'].includes(this.screen);
    },
    note() {
      return notes[this.screen] || notes.home;
    },
    membershipProducts() {
      return this.data.products.filter(p => p.kind === 'membership' && p.skus.some(s => s.status === 'active'));
    },
    creditProducts() {
      return this.data.products.filter(p => p.kind === 'credits' && p.skus.some(s => s.status === 'active'));
    },
    nextBatch() {
      return this.data.wallet.batches.find(b => b.available > 0 && b.expiresAt);
    },
    selectedService() {
      return this.data.services.find(s => s.id === this.serviceId);
    },
    courseContents() {
      const list=this.presentationData ? this.presentationData.contents.filter(c => c.contentType === 'course') : [];
      return this.screen==='workout'&&['content-free','content-premium'].includes(this.mvpContentState)?list.filter(c=>c.tier===(this.mvpContentState==='content-free'?'free':'premium')):list;
    },
    programContents() {
      return this.presentationData ? this.presentationData.contents.filter(c => c.contentType === 'training_program') : [];
    },
    selectedContent() {
      if(this.screen==='course'&&['content-free','content-premium'].includes(this.mvpContentState))return this.courseContents.find(c=>c.tier===(this.mvpContentState==='content-free'?'free':'premium'))||this.courseContents[0];
      return this.presentationData.contents.find(c => c.id === this.contentId) || this.courseContents[0];
    },
    selectedWorldTour(){const list=(this.presentationData?.contents||[]).filter(c=>c.contentType==='world_tour');if(['content-free','content-premium'].includes(this.mvpContentState))return list.find(c=>c.tier===(this.mvpContentState==='content-free'?'free':'premium'))||list[0];return list.find(c=>c.id===this.contentId)||list[0]},
    selectedProgram() {
      const selected=this.screen==='program'&&['content-free','content-premium'].includes(this.mvpContentState)?this.programContents.find(c=>c.tier===(this.mvpContentState==='content-free'?'free':'premium'))||this.programContents[0]:this.presentationData.contents.find(c => c.id === this.programId) || this.programContents[0];
      return this.isMvpPreview&&this.$route.query.reviewWorkouts==='empty'&&selected?{...selected,membersPreview:[]}:selected;
    },
    programWorkout() {
      const members=(this.selectedProgram&&this.selectedProgram.membersPreview)||[];
      const member=members.find(m=>m.id===this.contentId)||members[0];
      return member&&this.presentationData.contents.find(c=>c.id===member.id);
    },
    nextProgramWorkout() {
      const members=(this.selectedProgram&&this.selectedProgram.membersPreview)||[];
      const index=members.findIndex(m=>this.programWorkout&&m.id===this.programWorkout.id);
      const member=members[(index+1)%members.length];
      return member&&this.presentationData.contents.find(c=>c.id===member.id);
    },
    displayContent() {
      if (this.screen==='course' && this.$route.query.fromProgram) {
        const program=this.presentationData.contents.find(c=>c.id===this.$route.query.fromProgram);
        const member=program&&(program.membersPreview||[]).find(m=>m.id===this.contentId);
        if(member&&member.access.allowed&&program.access.allowed) return {...this.selectedContent,access:member.access};
      }
      return (this.screen === 'program' ? this.selectedProgram : this.selectedContent) || {
        tier: 'free'
      };
    },
    conversations() {
      return this.data.assets.filter(a => a.type === 'conversation');
    },
    returnTo() {
      return this.$route.query.returnTo || '';
    },
    returnTitle() {
      return titles[this.returnTo] || titles.home;
    },
    insightBody() {
      const report = this.data.assets.find(a => a.type === 'report' && a.serviceCode === 'deep_analysis' && a.objectKey === this.objectKey);
      return report&&!report.locked ? report.body : '';
    },
    memberBenefits() {
      const config = this.data.effective.membershipActive ? this.data.effective.base.config : (this.membershipProducts[0] || {}).benefits;
      return config ? config.items.map(item => ({
        course_access: 'Courses',
        world_tour_access: 'World Tours',
        training_program_access: 'Training Programs',
        dynamic_plan: 'Dynamic Plans',
        ai_coach_chat: 'AI Coach',
        workout_result_ai_insight: 'Workout AI Insights',
        weekly_report_ai_insight: 'Weekly AI Insights'
      }[item.code] || item.code) + (item.scopes?' · ':'') + (item.scopes||[]).map(s => ({
        all: 'All',
        free_content: 'Free content',
        text: 'Text',
        image: 'Image',
        live: 'Live'
      })[s] || s).join(', ')) : ['See available membership benefits'];
    },
    sheetTitle() {
      return this.gate ? 'Feature access' : this.quote ? 'Purchase confirmation' : this.redemptionQuote ? 'Content redemption' : this.serviceQuote ? 'Request confirmation' : 'SunnyFit';
    }
  },
  watch: {
    '$route.fullPath'(toPath,fromPath) {
      if(fromPath&&withoutMembershipPreview(toPath)===withoutMembershipPreview(fromPath)){
        if(toPath!==this.mvpInternalRoute){this.mvpRequestToken++;clearTimeout(this.mvpTimer)}this.mvpInternalRoute='';
        if(!this.mvpCheckoutApplying){this.cancelMvpPurchase();this.mvpPendingPurchase=null;this.closeSheet()}return;
      }
      if(!this.mvpCheckoutApplying)this.cancelMvpPurchase();this.mvpRequestToken++;clearTimeout(this.mvpTimer);
      if(this.$refs.accountScroll&&fromPath)this.accountScrollPositions[accountScrollKey(fromPath,this.userId)]=this.$refs.accountScroll.scrollTop;
      // Browser navigation can bypass go(). A quote belongs to the page that requested it.
      if (this.pendingService && !this.serviceRunning) this.busy = false;
      this.serviceQuote = null;
      this.pendingService = null;
      this.closeSheet();
      this.error = '';
      this.flowState = '';
      this.appToast = '';
      this.aiActivity = 'idle';
      const incoming = this.$route.query.user;
      if (incoming && incoming !== this.userId) {
        this.mvpPendingPurchase=null;
        this.userId = incoming;
        this.data = null;
        this.sessionResults = [];
        this.openedConversation = null;
        this.restoreUserState();
      }
      if (this.$route.query.content) this.contentId = this.$route.query.content;
      if (this.$route.query.program) this.programId = this.$route.query.program;
      this.$nextTick(() => {
        if (this.$refs.sourceViewport) this.$refs.sourceViewport.scrollTop = 0;
        if (this.$refs.accountScroll) this.$refs.accountScroll.scrollTop = this.accountScrollPositions[accountScrollKey(toPath,this.userId)]||0;
      });
      this.load();
    }
  },
  async created() {
    try { this.users = await listUsers(); this.restoreUserState(); await this.load(); } catch(e) { this.error=e.message; }
  },
  methods: {
    async authorizeMovement(){
      const content=this.movementContent;if(!content||this.busy)return
      this.busy=true;this.error=''
      try{const decision=this.isMvpPreview?content.access:await access({userId:this.userId,contentId:content.id});if(decision.allowed){this.$refs.movement.begin()}else this.mvpUpgrade('movement',content)}catch(error){this.error=error.message}finally{this.busy=false}
    },
    go(screen, extra = {}) {
      if (this.busy) return;
      const path = '/app/' + screen;
      const query = {
        user: this.userId,
        content: this.contentId,
        program: this.programId,
        object: this.$route.query.object || 'demo-workout-01',
        review: this.reviewMode ? '1' : '0',
        ...Object.fromEntries(reviewQueryKeys.map(key=>[key,key==='reviewFixture'||screen===this.screen?this.$route.query[key]:undefined])),
        membershipState: this.$route.query.membershipState || undefined,
        chatRemaining: this.$route.query.chatRemaining,
        membershipCycle: this.$route.query.membershipCycle,
        allowanceMode: this.$route.query.allowanceMode,
        mvpState: screen===this.screen?this.$route.query.mvpState:screen===this.returnTo?this.$route.query.resumeState:undefined,
        resumeState:this.$route.query.resumeState,
        fromProgram: this.$route.query.fromProgram || undefined,
        courseOrigin: this.$route.query.courseOrigin || undefined,
        returnTo: this.$route.query.returnTo || undefined,
        intent: this.$route.query.intent || undefined,
        parent: undefined,
        profileItem: undefined,
        profileSection: undefined,
        profileParent: undefined,
        ...extra
      };
      if(['home','workout','program','plan','profile'].includes(screen)&&!extra.fromProgram)delete query.fromProgram;
      if(['home','workout','program','plan','profile'].includes(screen))delete query.courseOrigin;
      if (this.$route.path === path && JSON.stringify(this.$route.query) === JSON.stringify(query)) return;
      this.$router.push({
        path,
        query
      }, () => {});
    },
    back() {
      if(this.screen==='plan'&&this.returnTo==='coach'){this.go('coach',{returnTo:undefined,reviewPlan:'plan-active'});return;}
      if(['movement','world-tour'].includes(this.screen)&&['home','workout','plan','program'].includes(this.$route.query.collectionOrigin)){this.go(this.$route.query.collectionOrigin,{collectionOrigin:undefined,returnTo:undefined,intent:undefined});return;}
      if(this.isProfileSecondary){
        const {profileItem,profileSection,profileParent}=this.$route.query;
        if(profileItem){this.go(profileParent||this.screen,{profileItem:undefined,profileSection:profileParent?undefined:profileSection});return;}
        if(profileSection){this.go(this.screen);return;}
        this.go(profileParent||'profile');return;
      }
      if(this.screen==='world-tour-detail'){this.go('world-tour',{collectionOrigin:this.$route.query.collectionOrigin||'workout'});return;}
      if(this.screen==='course'&&['home','workout','program','plan'].includes(this.$route.query.courseOrigin)){this.go(this.$route.query.courseOrigin,{returnTo:undefined,intent:undefined});return;}
      if(['plans','billing'].includes(this.screen)){this.go(this.screen==='billing'&&this.$route.query.parent==='profile'?'profile':'membership',{parent:undefined});return;}
      if(this.screen==='wallet'&&this.$route.query.parent==='membership'){this.go('membership',{parent:undefined});return;}
      const parent={profile:'home',membership:'profile',plans:'membership',billing:'membership',wallet:'membership'}[this.screen]||'home';
      this.go(this.returnTo||parent,{returnTo:undefined,intent:undefined});
    },
    returnToFlow() {
      this.go(this.returnTo || 'membership',{returnTo:undefined,intent:undefined});
    },
    changeUser() {
      sessionStorage.setItem('sunnyfit-demo-user', this.userId);
      this.sessionResults = [];
      this.openedConversation = null;
      this.restoreUserState();
      this.closeSheet();
      this.go(this.screen);
      this.load();
    },
    restoreUserState() {
      this.restoreDraft();
      this.serviceId = 'ai_chat';
      this.coachContext = sessionStorage.getItem('sunnyfit-context-' + this.userId) || '';
    },
    serviceLabel(id) { return ({ai_chat:'Coach conversations',deep_analysis:'Workout insights',weekly_insight:'Weekly reports',plan_preview:'Plan previews'})[id] || id; },
    costLabel(id) { const s = this.data.services.find(s => s.id === id); return !s ? '' : s.access.reason==='ENTITLEMENT_REQUIRED'&&s.access.billingSource==='feature'?'Premium feature · No Credits used':s.access.reason==='CONSUMPTION_POLICY_UNDEFINED'?'Price not configured':s.access.billingSource==='feature'?'Included in your plan · No Credits used':s.access.creditType==='AI_COACH_CREDIT'?s.access.credits+' AI Coach Credits / turn':s.access.billingSource === 'included' ? 'Included with your membership' : s.access.reason === 'INCLUDED_USAGE_EXHAUSTED' ? 'Available after reset' : s.credits ? s.credits + ' extra Credits' : 'Included'; },
    setLocale(locale) { this.locale = locale; sessionStorage.setItem('sunnyfit-locale', locale); },
    setMessage(value) {
      if (this.chatInputLocked) return;
      this.message = value;
      if(!this.busy)this.aiActivity=value.trim()?'listening':'idle';
      this.persistDraft();
    },
    updateBinding() {
      this.closeSheet();
      this.go(this.screen);
    },
    serviceCost(id) {
      const s = this.data.services.find(s => s.id === id);
      return s&&s.access.reason!=='CONSUMPTION_POLICY_UNDEFINED' ? s.credits : null;
    },
    async handleAction(action) {
      if (this.busy) return;
      try {
        if(action.startsWith('open-movement:')){this.contentId=action.slice(14);this.go('movement-detail');return;}
        if(action.startsWith('program-panel:')){if(this.reviewMode)await this.replaceReviewQuery({reviewProgramPanel:action.slice(14)});return;}
        if(action.startsWith('open-world-tour:')){this.contentId=action.slice(16);this.go('world-tour-detail',{collectionOrigin:this.$route.query.collectionOrigin||'workout'});return;}
        if(action.startsWith('start-content:')){const content=this.presentationData.contents.find(c=>c.id===action.slice(14));if(content?.contentType==='movement'){this.contentId=content.id;this.go('movement-training');return;}}
        if(await this.handleMvpAction(action))return;
        if (action === 'back') { this.back(); return; }
        if(['existing-challenge','existing-challenges'].includes(action)){this.go('challenge');return;}
        if(action==='existing-world-tour'){this.go('world-tour',{collectionOrigin:this.screen});return;}
        if(action==='movement-picker'){this.go('movement',{collectionOrigin:this.screen});return;}
        if(action==='activate-plan'){this.serviceId='plan_activate';await this.reviewService();return;}
        if(action==='open-weekly'){if(this.data.weeklyReport?.available){await readWeeklyReport(this.userId,this.data.weeklyReport.id);this.go('weekly',{object:this.data.weeklyReport.id});}return;}
        if(action==='weekly-later'){if(this.data.weeklyReport?.available){await readWeeklyReport(this.userId,this.data.weeklyReport.id);await this.load();this.appToast='We’ll keep your report for you.';}return;}
        if(action==='weekly-upgrade'){this.mvpUpgrade('weekly_insight');return;}
        if(action.startsWith('start-content:')){const content=this.data.contents.find(row=>row.id===action.slice(14));if(content)await this.openContent(content);return;}
        if(action.startsWith('join-challenge:')){
          this.busy=true;try{const contentId=action.slice(15);const result=await joinChallenge({userId:this.userId,contentId,requestKey:'join-'+this.userId+'-'+contentId});await this.load();this.appToast='You joined the Challenge. Follow its workouts during the event.';this.flowState='Joined '+result.contentId;}catch(error){if(error.reason==='ENTITLEMENT_REQUIRED')this.mvpUpgrade('limited_challenge',this.data.contents.find(c=>c.id===action.slice(15)));else this.error=error.message;}finally{this.busy=false;}return;
        }
        if (action.startsWith('open-course:') || action.startsWith('start-course:')) {
          const id=action.slice(action.indexOf(':')+1);
          const course=this.courseContents.find(c=>c.id===id);
          if(!course)throw new Error('This course is no longer available.');
          this.contentId=id;
          if(action.startsWith('start-course:')){await this.startCourse();return;}
          const parent=this.screen==='program'&&this.selectedProgram;
          const member=parent&&(parent.membersPreview||[]).some(m=>m.id===id);
          this.go('course',{courseOrigin:this.screen,fromProgram:member?parent.id:undefined});
          return;
        }
        if (action === 'send') {
          if (!this.message.trim()) return;
          this.serviceId = 'ai_chat';
          await this.reviewService();
          return;
        }
        if (action === 'generate-insight') {
          if(this.screen==='result'&&this.resultRpe===null)return;
          this.serviceId = 'deep_analysis';
          await this.reviewService();
          return;
        }
        if (action === 'generate-weekly') { this.serviceId = 'weekly_insight'; await this.reviewService(); return; }
        if (action === 'new-chat') {
          this.openedConversation = null;
          this.sessionResults = [];
          this.sampleConversation = false;
          this.coachContext = '';
          sessionStorage.removeItem('sunnyfit-context-' + this.userId);
          this.setMessage('');
          return;
        }
        if (action === 'coach-workout') {
          this.coachContext = 'Workout · 40:23'+(this.resultRpe===null?'':' · RPE '+this.resultRpe+'/10');
          sessionStorage.setItem('sunnyfit-context-' + this.userId, this.coachContext);
          this.openedConversation = null;
          this.go('coach');
          return;
        }
        if (action === 'start-course') {
          await this.startCourse();
          return;
        }
        if (action === 'start-program') {
          await this.startProgram();
          return;
        }
        if (action === 'program-next') {
          if(this.nextProgramWorkout)this.contentId=this.nextProgramWorkout.id;
          this.go('program',{fromProgram:undefined});
          return;
        }
        if (action === 'adjust-plan' || action === 'create-plan') {
          const decision = this.data.policyVersion===20261014?{entitlementAllowed:true}:await access({
            userId: this.userId,
            serviceId: 'plan_activate'
          });
          if (!decision.entitlementAllowed) {
            this.gate = {
              ...decision,
              reason: 'ENTITLEMENT_REQUIRED'
            };
            return;
          }
          this.coachContext = action === 'create-plan' ? 'Create my personalized training plan' : 'Adjust today · Stage I / Awakening · Day 4';
          sessionStorage.setItem('sunnyfit-context-' + this.userId, this.coachContext);
          this.go('coach');
          return;
        }
        if(action==='profile'){this.go('profile',{returnTo:undefined,fromProgram:undefined});return;}
        if(action==='usage'){this.go('membership',{returnTo:this.screen});return;}
        if (action === 'world-tour') {
          this.go('world-tour',{collectionOrigin:this.screen});
          return;
        }
        if (action.startsWith('existing-')) {
          this.sourceGap = '该入口属于现有 ' + action.slice(9) + ' 模块，本次尚未扩展页面。';
          return;
        }
        if (['home', 'workout', 'course', 'coach', 'history', 'wallet', 'plan','membership'].includes(action)) this.go(action);
      } catch (e) {
        this.error = e.message;
      }
    },
    async readConversation(asset) {
      try {
        this.openedConversation = await getAsset(this.userId, asset.id);
        this.go('coach');
      } catch (e) {
        this.error = e.message;
      }
    },
    async startCourse() {
      if (!this.selectedContent) return;
      const decision = await access({
        userId: this.userId,
        contentId: this.selectedContent.id,
        programId: this.$route.query.fromProgram || undefined
      });
      if (decision.allowed) {
        this.flowState = 'Start 授权通过。实际 App 下一步进入现有播放器；本样稿展示入口校验，不模拟产生训练记录。运动结果页可从评审目录打开。';
        this.notice = {title:'Ready to train',body:this.selectedContent.name + ' is available with your current access.'};
        return;
      }
      await this.openContent(this.selectedContent);
    },
    async startProgram() {
      if (!this.selectedProgram) return;
      const decision = await access({
        userId: this.userId,
        contentId: this.selectedProgram.id
      });
      if (!decision.allowed) {
        await this.openContent(this.selectedProgram);
        return;
      }
      const members = this.selectedProgram.membersPreview || [];
      const member = members.find(m => m.id === this.contentId) || members[0];
      if (!member) {
        this.error = 'This Program has no workouts.';
        return;
      }
      this.contentId = member.id;
      this.go('course', {fromProgram:this.selectedProgram.id,courseOrigin:'program'});
    },
    openProgramWorkout(member) { const parent=this.program.id; this.contentId=member.id; this.closeSheet(); this.go('course',{fromProgram:parent,courseOrigin:'program'}); },
    async runService() {
      if (this.serviceRunning || !this.serviceQuote) return;
      this.serviceRunning = true;
      this.aiActivity = 'thinking';
      this.busy = true;
      this.error = '';
      let request;
      const quote = this.serviceQuote;
      const snapshot = this.pendingService || {userId:this.userId,serviceId:this.serviceId,objectKey:this.objectKey,message:this.message,context:this.coachContext,rpe:this.resultRpe,routePath:this.$route.fullPath};
      const isCurrentPage = () => snapshot.userId === this.userId && snapshot.routePath === this.$route.fullPath;
      const serviceId = snapshot.serviceId;
      const displayMessage = snapshot.message;
      const requestMessage = serviceId === 'deep_analysis' ? 'Analyze this workout · duration 40:23'+(snapshot.rpe==null?'':' · RPE '+snapshot.rpe+'/10') : (snapshot.context ? snapshot.context + '\n\n' : '') + displayMessage;
      try {
        request = await startService({
          userId: snapshot.userId,
          quoteId: quote.id,
          message: requestMessage,
          requestKey: this.key,
          acceptOverage: quote.requiresOverageConsent === true
        });
        request = await finishService(request.id, this.simulateFailure ? 'failed' : 'succeeded');
        this.serviceQuote = null;
        this.pendingService = null;
        if (snapshot.userId !== this.userId) return;
        await this.load();
        if (!isCurrentPage()) return;
        this.aiActivity = request.status === 'completed' ? 'success' : 'error';
        if (request.status === 'completed') {
          const saved = this.data.assets.find(a => a.id === request.assetId);
          if (serviceId === 'deep_analysis' || serviceId === 'weekly_insight') {
            if (snapshot.objectKey !== this.objectKey) { this.aiActivity=this.message?'listening':'idle'; return; }
            this.notice = {
              title: 'Insight saved',
              body: request.billingSource==='feature'?'Your AI insight is ready. No Credits were used.':(request.billingSource === 'included' ? 'Included with your membership. No extra Credits used.' : request.credits + ' Credits used.') + ' Your saved result keeps its original access rules.'
            };
          } else if(serviceId==='plan_activate'){
            this.notice={title:'Plan activated',body:'Your saved plan is ready to follow. No Credits were used.'};
          } else {
            this.openedConversation = null;
            this.sampleConversation = false;
            this.sessionResults.push({
              ...saved,
              message: displayMessage,
              credits: request.credits,
              quotaReminder: this.chatReminderFor(this.mvpMember),
              type: 'conversation'
            });
            if (this.message === displayMessage) this.message = '';
            this.persistDraft();
          }
        } else this.notice = {
          title: 'Let’s try again',
          body: 'The request failed. Reserved Credits have been released. Your input is still here.'
        };
      } catch (e) {
        if (request && request.status === 'reserved') {
          try {
            await finishService(request.id, 'failed');
            if (snapshot.userId === this.userId) await this.load();
          } catch (_) {}
        }
        if (isCurrentPage()) {
          this.error = e.message;
          this.aiActivity = 'error';
          if (['QUOTE_STALE', 'QUOTE_EXPIRED'].includes(e.reason)) this.serviceQuote = null;
        }
      } finally {
        this.serviceRunning = false;
        this.busy = false;
      }
    }
  }
};
