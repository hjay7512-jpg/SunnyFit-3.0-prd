import {workoutRecap} from './workout-recap.cjs'
// Local prototype feedback is isolated by account and workout; it never writes a training record.
export default {
  data(){return {resultFeedback:null,resultRecapSeen:false}},
  computed:{
    resultFeedbackKey(){return 'sunnyfit-result-rpe:'+this.userId+':'+this.objectKey},
    resultWorkout(){return workoutRecap(this.$route.query.reviewAchievement||'personal-best')},
    resultStage(){const stage=this.$route.query.reviewResultStage;return ['complete','effort','summary'].includes(stage)?stage:this.resultRpe!==null||this.resultRecapSeen?'summary':'complete'},
    resultRpe(){
      if(this.isMvpPreview&&this.$route.query.reviewRpe==='unreported')return null
      if(this.isMvpPreview&&this.$route.query.reviewRpe==='reported'){
        const value=Number(this.$route.query.reviewRpeValue)
        return Number.isInteger(value)&&value>=1&&value<=10?value:this.resultFeedback?.rpe||4
      }
      return this.resultFeedback?.rpe||null
    },
    resultAnalysisBody(){return !this.isMvpPreview&&this.hasInsight?this.insightBody:'You rode '+this.resultWorkout.distance+' mi in '+this.resultWorkout.duration+' — 0.5 mi farther than your last 40-minute ride. Your average heart rate was 126 BPM, compared with 122 BPM last time.\n\nYou rated this workout '+this.resultRpe+' out of 10. Keep that effort rating with this session when discussing your next ride with AI Coach.'},
    resultHasInsight(){return this.resultRpe!==null&&(this.mvpHasInsight||this.isMvpPreview&&this.mvpMember.active&&!['locked','insight-loading'].includes(this.mvpInsightState))}
  },
  watch:{resultFeedbackKey:{immediate:true,handler(){
    this.resultFeedback=null;this.resultRecapSeen=false
    try{const record=JSON.parse(localStorage.getItem(this.resultFeedbackKey)||'null');if(Number.isInteger(record?.rpe)&&record.rpe>=1&&record.rpe<=10)this.resultFeedback=record;this.resultRecapSeen=localStorage.getItem(this.resultFeedbackKey+':seen')==='1'}catch(_){}
  }}},
  methods:{
    async submitResultRpe(rpe){
      if(!Number.isInteger(rpe)||rpe<1||rpe>10||this.screen!=='result')return
      const record={rpe,recordedAt:new Date().toISOString()}
      try{localStorage.setItem(this.resultFeedbackKey,JSON.stringify(record));localStorage.setItem(this.resultFeedbackKey+':seen','1')}catch(_){}
      this.resultFeedback=record;this.resultRecapSeen=true
      if(this.isMvpPreview)await this.replaceReviewQuery({reviewRpe:'reported',reviewRpeValue:String(rpe),reviewResultStage:'summary',reviewInsight:undefined,mvpState:undefined})
      if(this.mvpMember.active)await this.handleAction('generate-insight')
    },
    setResultPanel(value){if(this.isMvpPreview)this.replaceReviewQuery({reviewResultPanel:value})},
    setResultStage(value){if(!['complete','effort','summary'].includes(value))return;if(value==='summary'){this.resultRecapSeen=true;try{localStorage.setItem(this.resultFeedbackKey+':seen','1')}catch(_){}}this.replaceReviewQuery({reviewResultStage:value})}
  }
}
