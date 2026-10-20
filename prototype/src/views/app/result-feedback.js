// Local prototype feedback is isolated by account and workout; it never writes a training record.
export default {
  data(){return {resultFeedback:null}},
  computed:{
    resultFeedbackKey(){return 'sunnyfit-result-rpe:'+this.userId+':'+this.objectKey},
    resultRpe(){
      if(this.isMvpPreview&&this.$route.query.reviewRpe==='unreported')return null
      if(this.isMvpPreview&&this.$route.query.reviewRpe==='reported'){
        const value=Number(this.$route.query.reviewRpeValue)
        return Number.isInteger(value)&&value>=1&&value<=10?value:this.resultFeedback?.rpe||4
      }
      return this.resultFeedback?.rpe||null
    },
    resultAnalysisBody(){return !this.isMvpPreview&&this.hasInsight?this.insightBody:'You completed a 40-minute session and rated your effort '+this.resultRpe+' out of 10. Review your heart rate alongside that effort, and use how you feel after this session to plan your next workout.'},
    resultHasInsight(){return this.resultRpe!==null&&(this.mvpHasInsight||this.isMvpPreview&&this.mvpMember.active&&!['locked','insight-loading'].includes(this.mvpInsightState))}
  },
  watch:{resultFeedbackKey:{immediate:true,handler(){
    this.resultFeedback=null
    try{const record=JSON.parse(localStorage.getItem(this.resultFeedbackKey)||'null');if(Number.isInteger(record?.rpe)&&record.rpe>=1&&record.rpe<=10)this.resultFeedback=record}catch(_){}
  }}},
  methods:{
    async submitResultRpe(rpe){
      if(!Number.isInteger(rpe)||rpe<1||rpe>10||this.screen!=='result')return
      const record={rpe,recordedAt:new Date().toISOString()}
      localStorage.setItem(this.resultFeedbackKey,JSON.stringify(record));this.resultFeedback=record
      if(this.isMvpPreview)await this.replaceReviewQuery({reviewRpe:'reported',reviewRpeValue:String(rpe),reviewInsight:undefined,mvpState:undefined})
      if(this.mvpMember.active)await this.handleAction('generate-insight')
    },
    setResultPanel(value){if(this.isMvpPreview)this.replaceReviewQuery({reviewResultPanel:value})}
  }
}
