import {copyState,currentWallCopy,canEdit,previewCopyLocation} from '@/copy/operations-copy'
import {contentAction} from '../content-presentation.cjs'
import {placementFor,resolveSubscriptionWall,reviewPromotion} from '../subscription-wall.cjs'

// Isolated rendering adapter: never calls purchase, resume, training or route methods.
export default {
  computed:{
    copyPreviewActive(){return this.reviewMode&&!!copyState.preview&&!!copyState.selected&&canEdit('entry-'+copyState.preview.kind)},
    copyPreviewInput(){return {configuration:currentWallCopy(),member:{active:false},offers:this.mvpOffers,channel:this.data?.subscriptionOffer?.channel||'web_demo',...reviewPromotion(copyState.preview?.offer||'standard',Date.now())}},
    copyPreviewResource(){
      const kind=copyState.preview?.kind
      if(this.mvpGate?.context.kind===kind){const context=this.mvpGate.context;return {id:context.resourceId,name:context.resourceName,detail:context.detail,image:context.image}}
      const content=kind==='world_tour'?this.selectedWorldTour:kind==='training_program'?this.selectedProgram:this.displayContent
      return content?{id:content.id,name:content.name,detail:content.durationMinutes?content.durationMinutes+' min':'',image:content.coverUrl||''}:{}
    },
    copyPreviewWall(){return this.copyPreviewActive?resolveSubscriptionWall({...this.copyPreviewInput,kind:copyState.preview.kind,resource:this.copyPreviewResource}):null},
    copyPreviewGate(){
      if(!this.copyPreviewActive||copyState.preview.stage==='detail')return null
      const preview=copyState.preview,wall=this.copyPreviewWall,copy=placementFor(preview.kind,currentWallCopy())
      return {kind:'membership',stage:preview.stage,view:preview.view||'quick',benefitTab:preview.benefitId,title:copy.title,offer:wall.offers.find(offer=>offer.offerId===preview.offerId)||wall.offers.find(offer=>offer.offerId===wall.defaultOfferId),context:{key:'copy-preview:'+preview.kind,kind:preview.kind,label:copy.label,resourceId:wall.resource.id,resourceName:wall.resource.name,detail:wall.resource.detail,success:copy.success,continueLabel:copy.continueLabel,cancelLabel:copy.cancelLabel}}
    }
  },
  methods:{
    previewContentAction(content){
      if(this.copyPreviewActive&&content?.contentType===copyState.preview.kind)return contentAction({...content,tier:'premium',access:{...content.access,allowed:false}},this.copyPreviewInput)
      return this.contentStartAction(content)
    },
    handleCopyPreviewAction(action){
      if(!this.copyPreviewActive)return this.handleAction(action)
      if(typeof action==='string'&&/^start-(course|content|program)/.test(action))previewCopyLocation('quick',copyState.preview.kind)
    },
    handleCopyFlowEvent(type,...args){
      if(!this.copyPreviewActive){
        if(type==='close')return this.cancelMvpPurchase('dismiss',args[0])
        const handlers={select:'selectWallOffer',view:'changeWallView',benefit:'changeWallBenefit',restore:'restoreWallPurchases',reload:'reloadWallOffers',purchase:'purchaseMvpOffer',resume:'resumeMvpPurchase',retry:'retryMvpPurchase',check:'checkMvpPurchase',usage:'viewMvpUsage',refresh:'refreshMvpAllowance'}
        if(handlers[type])return this[handlers[type]](...args)
        return
      }
      if(type==='select'){
        const offer=args[0],mode=copyState.preview.offer,location=offer.trialDays?'subscribe-trial':'subscribe-standard'
        previewCopyLocation(location,copyState.preview.kind);copyState.preview={...copyState.preview,offer:mode,offerId:offer.offerId};return
      }
      if(type==='benefit'){copyState.preview={...copyState.preview,benefitId:args[0]};return}
      if(type==='view'){previewCopyLocation(args[0].view==='benefits'?'benefits':'quick',copyState.preview.kind);return}
      if(['purchase','restore','check'].includes(type)){previewCopyLocation('success',copyState.preview.kind);return}
      if(['close','resume','usage'].includes(type)){
        const hasDetail=['course','world_tour','training_program'].includes(copyState.preview.kind)
        previewCopyLocation(hasDetail?'detail-standard':'quick',copyState.preview.kind);return
      }
      if(type==='retry')previewCopyLocation('quick',copyState.preview.kind)
    }
  }
}
