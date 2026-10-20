import {createDynamicPlan,readDynamicPlans} from './dynamic-plan.cjs'

export default {
  data(){return {dynamicPlanDraft:null,dynamicPlanActive:null}},
  computed:{
    dynamicPlanStorageKey(){return 'sunnyfit-dynamic-plans:'+this.userId},
    dynamicPlanFixture(){return createDynamicPlan({goal:'weight-loss',days:4,minutes:30},{id:'review-plan-'+this.userId,ownerId:this.userId,messageId:'review-plan',createdAt:'2026-01-01T00:00:00.000Z'})},
    currentDynamicPlan(){
      if(this.screen==='plan'||this.mvpPlanState==='plan-active')return this.dynamicPlanActive||this.dynamicPlanFixture
      return this.dynamicPlanDraft||this.dynamicPlanFixture
    }
  },
  watch:{dynamicPlanStorageKey:{immediate:true,handler(){
    this.dynamicPlanDraft=null;this.dynamicPlanActive=null
    try{const saved=readDynamicPlans(JSON.parse(localStorage.getItem(this.dynamicPlanStorageKey)||'null'),this.userId);this.dynamicPlanDraft=saved.draft;this.dynamicPlanActive=saved.active}catch(_){}
  }}},
  methods:{
    findDynamicPlan(id){return [this.dynamicPlanDraft,this.dynamicPlanActive,this.dynamicPlanFixture].find(plan=>plan&&plan.id===id&&plan.ownerId===this.userId)||null},
    persistDynamicPlans(){try{localStorage.setItem(this.dynamicPlanStorageKey,JSON.stringify({schemaVersion:1,ownerId:this.userId,draft:this.dynamicPlanDraft,active:this.dynamicPlanActive}))}catch(_){}},
    rememberGeneratedPlan(item){
      const plan=createDynamicPlan(item.planRequest,{id:'plan-'+item.id,ownerId:this.userId,messageId:item.id})
      if(!plan)return
      if(this.dynamicPlanDraft?.id===plan.id)return this.dynamicPlanDraft
      if(this.dynamicPlanActive?.id===plan.id)return this.dynamicPlanActive
      this.dynamicPlanDraft=plan;this.persistDynamicPlans();return plan
    },
    activateDynamicPlan(planId){
      const plan=this.findDynamicPlan(planId)
      if(!plan||plan.ownerId!==this.userId||plan.id!==planId)return false
      this.dynamicPlanActive={...plan,status:'active',activatedAt:plan.activatedAt||new Date().toISOString()}
      if(this.dynamicPlanDraft?.id===plan.id)this.dynamicPlanDraft=null
      this.persistDynamicPlans();this.setMvpPageState('plan-active');return true
    }
  }
}
