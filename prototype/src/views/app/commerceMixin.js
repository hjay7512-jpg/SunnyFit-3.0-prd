import { listUsers, getStorefront, quotePurchase, purchase, quoteService, startService, finishService, quoteRedemption, redeem, access, setRenewal, restorePurchases, requestKey, money,readWeeklyReport,joinChallenge } from '@/api/commerce';
import {creditTypeLabel} from '@/utils/entitlements';

// Shared local commerce flows: quotes, checkout, redemption and ledger.
export default {
  methods: {
    money(cents, currency='USD') { return new Intl.NumberFormat(this.locale || 'en-US', {style:'currency',currency}).format(cents/100); },
    cadenceLabel(value) {
      return {
        billing_cycle: 'Per period',
        monthly: 'Monthly',
        one_time: 'Once'
      }[value] || value;
    },
    shortDate(value) {
      return value ? new Intl.DateTimeFormat(this.locale || 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date(value)) : 'No expiry';
    },
    sourceLabel(source) {
      return {
        membership: 'Membership benefit',
        purchase: 'Purchased Credits',
        device: 'Device benefit',
        campaign: 'Campaign benefit',
        compensation: 'Support compensation'
      }[source] || source;
    },
    eventLabel(type) {
      return {
        GRANT: 'Credits added',
        SPEND: 'Credits spent',
        RESERVE: 'Credits reserved',
        RELEASE: 'Reservation released',
        EXPIRE: 'Credits expired'
      }[type] || type;
    },
    firstSku(product) {
      return product.skus.find(s => s.status === 'active');
    },
    async load() {
      const selected = this.userId;
      this.loading = true;
      try {
        const data = await getStorefront(selected);
        if (selected === this.userId) {
          this.data = data;
          if(!this.isMvpPreview&&this.screen==='weekly'&&data.weeklyReport?.available&&!data.weeklyReport.read){await readWeeklyReport(selected,data.weeklyReport.id);if(selected===this.userId)data.weeklyReport.read=true;}
          if(data.policyVersion===20261014){
            if(!data.contents.some(row=>row.id===this.contentId))this.contentId=(data.contents.find(row=>row.contentType==='course'&&row.tier==='premium')||data.contents.find(row=>row.contentType==='course')||{}).id;
            if(!data.contents.some(row=>row.id===this.programId))this.programId=(data.contents.find(row=>row.contentType==='training_program')||{}).id;
          }
          this.error = '';
        }
      } catch (e) {
        if (selected === this.userId) this.error = e.message;
      } finally {
        if (selected === this.userId) this.loading = false;
      }
    },
    go(screen, extra = {}) {
      if (this.busy) return;
      const path = '/app/' + screen;
      const query = {
        user: this.userId,
        ...extra
      };
      if (this.$route.path === path && JSON.stringify(this.$route.query) === JSON.stringify(query)) return;
      this.$router.push({
        path,
        query
      }, () => {});
    },
    back() {
      this.go('profile');
    },
    changeUser() {
      sessionStorage.setItem('sunnyfit-demo-user', this.userId);
      this.sessionResults = [];
      this.restoreDraft();
      this.closeSheet();
      this.go(this.screen);
      this.load();
    },
    restoreDraft() {
      this.message = sessionStorage.getItem('sunnyfit-draft-' + this.userId) || '';
      this.serviceId = sessionStorage.getItem('sunnyfit-service-' + this.userId) || 'ai_chat';
    },
    persistDraft() {
      sessionStorage.setItem('sunnyfit-draft-' + this.userId, this.message);
    },
    selectService(id) {
      this.serviceId = id;
      this.serviceQuote = null;
    },
    closeSheet() {
      if (this.busy) return;
      this.gate = null;
      this.quote = null;
      this.serviceQuote = null;
      this.pendingService = null;
      this.redemptionQuote = null;
      this.notice = null;
      this.showAssets = false;
      this.showLedger = false;
      this.savedAsset = null;
      this.program = null;
      this.renewalTarget = null;
    },
    escape(event) {
      if (event.key === 'Escape') this.closeSheet();
    },
    inform(body) {
      this.notice = {
        title: 'Your SunnyFit journey',
        body
      };
    },
    resolveGate() {
      const target = this.gate.reason === 'ENTITLEMENT_REQUIRED' ? 'membership' : 'wallet';
      const returnTo = this.screen;
      const creditType=this.gate.creditType||undefined;
      this.closeSheet();
      this.go(target, {
        returnTo, object:this.objectKey, intent:this.serviceId,creditType
      });
    },
    returnToFlow() {
      this.go(this.returnTo || 'profile');
    },
    finishNotice() {
      this.closeSheet();
      if (this.returnTo) this.returnToFlow();
    },
    async checkout(product, selectedSku) {
      this.busy = true;
      this.error = '';
      try {
        this.quote = await quotePurchase({
          userId: this.userId,
          productId: product.id,
          skuId: (selectedSku || product.skus.find(s=>s.status==='active'&&s.channel==='web_demo') || this.firstSku(product)).id,
          subscriptionTimeZone:Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        this.key = requestKey();
      } catch (e) {
        this.error = e.message;
      } finally {
        this.busy = false;
      }
    },
    async confirmPurchase() {
      this.busy = true;
      try {
        const result = await purchase({
          userId: this.userId,
          quoteId: this.quote.id,
          requestKey: this.key
        });
        this.quote = null;
        await this.load();
        this.notice = {
          title: result.status === 'scheduled' ? 'Plan change scheduled' : result.fulfillment === 'completed' ? 'Purchase complete' : 'Purchase processing',
          body: result.status === 'scheduled' ? 'Your current plan remains active until ' + this.shortDate(result.startsAt) + '. No payment is taken now. The new plan is billed when it starts.' : result.fulfillment !== 'completed' ? 'Payment and benefit delivery are being confirmed. Your current access remains available.' : result.product.kind === 'credits' ? result.product.credits.amount + ' '+creditTypeLabel(result.credits.creditType||'LEGACY_CREDIT')+' added. ' + (result.credits.validityDays === null ? 'They do not expire.' : 'Your purchased validity is preserved.') : 'Your membership starts ' + this.shortDate(result.startsAt) + '.'
        };
        this.error = '';
      } catch (e) {
        this.error = e.message;
        if (['QUOTE_STALE', 'QUOTE_EXPIRED'].includes(e.reason)) this.quote = null;
      } finally {
        this.busy = false;
      }
    },
    async reviewService() {
      if (this.busy || this.serviceQuote) return;
      this.busy = true;
      this.error = '';
      const snapshot={userId:this.userId,serviceId:this.serviceId,objectKey:this.objectKey,message:this.message,context:this.coachContext||'',rpe:this.resultRpe,routePath:this.$route.fullPath};
      this.pendingService=snapshot;
      try {
        const result = await quoteService({
          userId: snapshot.userId,
          serviceId: snapshot.serviceId,
          objectKey: ['deep_analysis','weekly_insight'].includes(snapshot.serviceId) ? snapshot.objectKey : null
          ,assetId:snapshot.serviceId==='plan_activate'?(this.data.assets.find(asset=>asset.type==='plan')||{}).id:undefined
        });
        if (this.pendingService !== snapshot || snapshot.userId !== this.userId || snapshot.routePath !== this.$route.fullPath) return;
        if (result.quote) {
          this.serviceQuote = result.quote;
          this.key = requestKey();
          if (result.quote.billingSource==='feature'||snapshot.serviceId === 'ai_chat' && result.quote.billingSource === 'included') await this.runService();
        } else {
          this.pendingService=null; this.busy=false;
          if(this.data.policyVersion===20261014&&result.decision?.reason==='ENTITLEMENT_REQUIRED'&&['plan_activate','weekly_insight','deep_analysis'].includes(snapshot.serviceId))this.mvpUpgrade({plan_activate:'dynamic_plan',weekly_insight:'weekly_insight',deep_analysis:'workout_insight'}[snapshot.serviceId]);
          else this.gate = result.decision;
        }
      } catch (e) {
        if (this.pendingService === snapshot && snapshot.routePath === this.$route.fullPath) {
          this.pendingService=null;
          this.busy=false;
          this.error = e.message;
        }
      } finally {
        if (this.pendingService === snapshot) this.busy = false;
      }
    },
    async runService() {
      this.busy = true;
      let request;
      try {
        request = await startService({
          userId: this.userId,
          quoteId: this.serviceQuote.id,
          message: this.message,
          requestKey: this.key
        });
        request = await finishService(request.id, this.simulateFailure ? 'failed' : 'succeeded');
        this.serviceQuote = null;
        await this.load();
        if (request.status === 'completed') {
          const saved = this.data.assets.find(a => a.id === request.assetId);
          this.sessionResults.push({
            ...saved,
            message: this.message,
            credits: request.credits
          });
          this.message = '';
          this.persistDraft();
        } else this.notice = {
          title: 'Let’s try again',
          body: 'We couldn’t complete your request. Reserved Credits have been released, and your message is still here.'
        };
      } catch (e) {
        this.error = e.message;
        if (request && request.status === 'reserved') {
          try {
            await finishService(request.id, 'failed');
            await this.load();
          } catch (_) {}
        }
        if (['QUOTE_STALE', 'QUOTE_EXPIRED'].includes(e.reason)) this.serviceQuote = null;
      } finally {
        this.busy = false;
      }
    },
    async openContent(content) {
      this.busy = true;
      this.error = '';
      try {
        const decision = await access({
          userId: this.userId,
          contentId: content.id
        });
        this.program = null;
        if (decision.allowed) {
          if (content.contentType === 'training_program') this.program = content;else this.notice = {
            title: 'Ready to move',
            body: content.name + ' is available. Your existing access requires no new redemption charge.'
          };
        } else if (decision.reason === 'REDEMPTION_REQUIRED') {
          const result = await quoteRedemption({
            userId: this.userId,
            contentId: content.id
          });
          if (result.quote) {
            this.redemptionQuote = result.quote;
            this.key = requestKey();
          } else if (result.alreadyRedeemed) {
            await this.load();
            this.notice = {
              title: 'Already unlocked',
              body: 'Your existing redemption is still valid. No additional Credits used.'
            };
          } else this.gate = {reason:result.reason||'CREDITS_INSUFFICIENT',credits:result.credits,creditType:result.creditType,available:result.available,message:result.message};
        } else if (decision.reason === 'ENTITLEMENT_REQUIRED'&&this.data.policyVersion===20261014&&['course','world_tour','training_program'].includes(content.contentType)) this.mvpUpgrade(content.contentType,content);
        else if (decision.reason === 'ENTITLEMENT_REQUIRED') this.gate = {
          ...decision,
          credits: 0
        };else this.error = decision.message;
      } catch (e) {
        this.error = e.message;
      } finally {
        this.busy = false;
      }
    },
    async confirmRedemption() {
      this.busy = true;
      try {
        const result = await redeem({
          userId: this.userId,
          quoteId: this.redemptionQuote.id,
          requestKey: this.key
        });
        this.redemptionQuote = null;
        await this.load();
        this.notice = {
          title: 'Content unlocked',
          body: result.name + ' is yours ' + (result.expiresAt ? 'until ' + this.shortDate(result.expiresAt) : 'with no expiry') + '. Membership expiry does not change this access.'
        };
      } catch (e) {
        this.error = e.message;
        if (['QUOTE_STALE', 'QUOTE_EXPIRED'].includes(e.reason)) this.redemptionQuote = null;
      } finally {
        this.busy = false;
      }
    },
    async openProgramWorkout(member) {
      const parent = this.program;
      if (!parent.access.allowed) {
        this.error = 'Select or unlock this Program before starting its workouts.';
        return;
      }
      const content = this.data.contents.find(c => c.id === member.id);
      if (content) await this.openContent(content);
    },
    async renew(subscription) {
      if (!this.busy) this.renewalTarget = subscription;
    },
    async applyRenewal() {
      const subscription = this.renewalTarget;
      this.busy = true;
      try {
        await setRenewal(subscription.id, !subscription.autoRenew, 'User changed renewal in App sample');
        await this.load();
        this.renewalTarget = null;
        this.notice = {title:subscription.autoRenew?'Renewal canceled':'Renewal resumed',body:subscription.autoRenew?'Your membership remains active until '+this.shortDate(subscription.grant.expiresAt)+'. Saved results, independent unlocks and extra Credits remain. Any scheduled plan change is canceled.':'Your next renewal is scheduled for '+this.shortDate(subscription.grant.expiresAt)+'.'};
      } catch (e) {
        this.error = e.message;
      } finally {
        this.busy = false;
      }
    },
    async restore() {
      this.busy=true;
      try { await restorePurchases(this.userId); await this.load(); this.notice={title:'Purchases restored',body:'Your existing account purchases have been checked. Nothing was charged or issued twice.'}; } catch(e) { this.error=e.message; } finally { this.busy=false; }
    }
  }
};
