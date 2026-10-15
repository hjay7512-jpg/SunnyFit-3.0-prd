<template>
  <span class="sf-ai-ball" :class="['sf-ai-ball--'+state,'sf-ai-ball--'+variant,{'sf-ai-ball--paused':!active||!visible||!inView,'sf-ai-ball--still':motionReduced,'sf-ai-ball--forced':effectiveMotion==='full'&&!reduceMotion,'sf-ai-ball--small':size<40,'sf-ai-ball--blink':manualBlink}]" :style="{width:fit?'100%':size+'px',height:fit?'100%':size+'px'}" :role="decorative?null:'img'" :aria-hidden="decorative?'true':null" :aria-label="decorative?null:accessibleLabel" :data-state="state" :data-motion="effectiveMotion" :data-head-yaw="head.yaw" :data-head-pitch="head.pitch" @pointerenter="previewBlink">
    <svg viewBox="0 0 56 56" :width="fit?'100%':size" :height="fit?'100%':size" fill="none" aria-hidden="true" @animationend="settled">
      <defs>
        <clipPath :id="id+'-clip'"><circle cx="28" cy="28" r="16"/></clipPath>
        <radialGradient :id="id+'-base'" cx=".34" cy=".26" r=".85"><stop stop-color="#fff9ec" stop-opacity=".08"/><stop offset=".62" stop-color="#e3e9e4" stop-opacity=".08"/><stop offset="1" stop-color="#9aafa8" stop-opacity=".25"/></radialGradient>
        <radialGradient :id="id+'-shine'" cx=".3" cy=".2" r=".8"><stop stop-color="#fff" stop-opacity=".17"/><stop offset=".48" stop-color="#fff" stop-opacity=".015"/><stop offset=".8" stop-color="#dceae4" stop-opacity=".035"/><stop offset="1" stop-color="#829b91" stop-opacity=".18"/></radialGradient>
        <linearGradient :id="id+'-rim'" x1="14" y1="10" x2="42" y2="47" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" stop-opacity=".96"/><stop offset=".46" stop-color="#fff7e8" stop-opacity=".7"/><stop offset="1" stop-color="#97aaa5" stop-opacity=".42"/></linearGradient>
        <filter :id="id+'-blur'" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="2.8"/></filter>
        <filter :id="id+'-soft'" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.5"/></filter>
      </defs>
      <g :filter="variant==='soft'?'url(#'+id+'-soft)':null">
        <circle class="sf-ai-ball__body" cx="28" cy="28" r="20" :fill="'url(#'+id+'-base)'"/>
        <g :clip-path="'url(#'+id+'-clip)'">
          <g class="sf-ai-ball__face-track" data-face-track="colours" :transform="colourTransform"><g class="sf-ai-ball__colours" :filter="'url(#'+id+'-blur)'"><circle class="sf-ai-ball__warm" cx="24" cy="22" r="11.5" fill="#ffe0a5" opacity=".96"/><circle class="sf-ai-ball__accent" cx="28" cy="33" r="12.3" fill="#ff747f" opacity=".94"/><circle class="sf-ai-ball__depth" cx="36" cy="26" r="8" fill="#aabeb7" opacity=".22"/></g></g>
        </g>
        <g class="sf-ai-ball__glass" data-layer="glass-cover"><circle cx="28" cy="28" r="20" :fill="'url(#'+id+'-shine)'"/><circle v-if="variant==='glass'" cx="28" cy="28" r="19.6" :stroke="'url(#'+id+'-rim)'" stroke-width=".8"/><path v-if="variant==='glass'" d="M12.5 25.5C13.7 17.6 18 13.4 24.7 12.6" stroke="white" stroke-opacity=".65" stroke-width=".65" stroke-linecap="round"/></g>
      </g>
      <g data-face-track="eyes" data-layer="eyes-outside-glass"><g class="sf-ai-ball__eyes" :key="blinkSequence"><g v-for="(eye,index) in face.eyes" :key="index" class="sf-ai-ball__eye" :transform="eyeTransform(eye)"><g class="sf-ai-ball__lid" :data-eye="index"><rect x="-2" y="-4.5" width="4" height="9" rx="2" fill="white"/></g></g></g></g>
    </svg>
  </span>
</template>
<script>
import {aiMotionPolicy} from '../motion-policy'
import {activityHead,blendHead,projectHead} from '../ai-ball-motion'
let sequence=0
const labels={idle:'AI Coach is ready',listening:'AI Coach is listening',thinking:'AI Coach is thinking',responding:'AI Coach is responding',success:'AI Coach has completed the task',error:'AI Coach needs you to retry'}
export default {
  name:'SfAiBall',props:{state:{type:String,default:'idle',validator:v=>Object.keys(labels).includes(v)},size:{type:Number,default:56},gaze:{type:String,default:'auto',validator:v=>['auto','center','left','right','up','down'].includes(v)},variant:{type:String,default:'glass',validator:v=>['glass','soft'].includes(v)},motionPolicy:{type:String,default:'inherit',validator:v=>['inherit','system','full','reduce'].includes(v)},label:String,decorative:Boolean,reduceMotion:Boolean,fit:Boolean,blinkToken:{type:Number,default:0}},
  data(){return {id:'sf-ai-ball-'+(++sequence),active:true,visible:typeof document==='undefined'||document.visibilityState!=='hidden',inView:true,manualBlink:false,blinkSequence:0,head:{yaw:0,pitch:0},systemReduced:typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches}},
  computed:{
    effectiveMotion(){return this.motionPolicy==='inherit'?aiMotionPolicy.value:this.motionPolicy},
    motionReduced(){return this.reduceMotion||this.effectiveMotion==='reduce'||(this.systemReduced&&this.effectiveMotion!=='full')},
    animating(){return this.active&&this.visible&&this.inView&&!this.motionReduced&&this.size>=40},
    accessibleLabel(){return this.label||labels[this.state]},
    face(){return projectHead(this.head.yaw,this.head.pitch)},
    colourTransform(){return 'translate('+this.face.colours.x+' '+this.face.colours.y+')'}
  },
  watch:{blinkToken(){this.previewBlink()},state(){this.activityChanged()},gaze(){this.activityChanged()},motionReduced(value){if(value){this.manualBlink=false;this.head=activityHead(this.state,this.gaze,0)}},animating(value){if(value)this.startMotion();else this.stopMotion()}},
  mounted(){
    this.clock=0;this.activityAt=0;this.fromHead={...this.head}
    document.addEventListener('visibilitychange',this.visibility)
    this.motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');this.motionQuery.addEventListener('change',this.motionChange)
    if(typeof IntersectionObserver!=='undefined'){this.observer=new IntersectionObserver(entries=>{this.inView=entries[0].isIntersecting});this.observer.observe(this.$el)}
    if(this.motionReduced)this.head=activityHead(this.state,this.gaze,0)
    this.startMotion()
  },
  beforeDestroy(){this.stopMotion();document.removeEventListener('visibilitychange',this.visibility);if(this.motionQuery)this.motionQuery.removeEventListener('change',this.motionChange);if(this.observer)this.observer.disconnect()},
  activated(){this.active=true},deactivated(){this.active=false},
  methods:{
    eyeTransform(eye){return 'translate('+eye.x+' '+eye.y+') rotate('+eye.angle+')'},
    activityChanged(){this.manualBlink=false;this.fromHead={...this.head};this.activityAt=this.clock||0;if(this.motionReduced)this.head=activityHead(this.state,this.gaze,0)},
    startMotion(){if(!this.animating||this.motionFrame)return;this.lastFrame=null;this.motionFrame=requestAnimationFrame(this.tick)},
    stopMotion(){if(this.motionFrame)cancelAnimationFrame(this.motionFrame);this.motionFrame=null;this.lastFrame=null},
    tick(time){
      this.motionFrame=null;if(!this.animating)return
      if(this.lastFrame!==null)this.clock+=time-this.lastFrame
      this.lastFrame=time
      const elapsed=this.clock-this.activityAt,target=activityHead(this.state,this.gaze,elapsed),head=blendHead(this.fromHead,target,elapsed)
      if(head.yaw!==this.head.yaw||head.pitch!==this.head.pitch)this.head=head
      this.motionFrame=requestAnimationFrame(this.tick)
    },
    previewBlink(){if(this.motionReduced||!this.visible||!this.inView)return;this.blinkSequence++;this.manualBlink=true},
    visibility(){this.visible=document.visibilityState!=='hidden'},motionChange(event){this.systemReduced=event.matches},
    settled(event){if(event.target.dataset.eye!=='0')return;if(event.animationName==='sf-ball-manual-blink'){this.manualBlink=false;this.$emit('blink')}if(this.state==='success'&&event.animationName==='sf-ball-confirm-blink')this.$emit('settled','success')}
  }
}
</script>
<style>
.sf-ai-ball{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;vertical-align:middle;isolation:isolate}.sf-ai-ball svg{display:block;overflow:visible}.sf-ai-ball__lid{transform-box:fill-box;transform-origin:center;animation:sf-ball-blink 12s linear infinite}
.sf-ai-ball--error .sf-ai-ball__lid{animation:none}.sf-ai-ball--paused *{animation-play-state:paused!important}.sf-ai-ball--still *,.sf-ai-ball--small .sf-ai-ball__lid{animation:none!important;transition:none!important}.sf-ui[data-reduce-motion=true] .sf-ai-ball *{animation:none!important;transition:none!important}
@keyframes sf-ball-blink{0%,8%,11%,100%{transform:scaleY(1)}9%,10%{transform:scaleY(.08)}}
.sf-ai-ball--listening .sf-ai-ball__lid{animation:sf-ball-blink 8s linear infinite}.sf-ai-ball--thinking .sf-ai-ball__lid{animation:sf-ball-blink 12s linear infinite}.sf-ai-ball--success .sf-ai-ball__lid{animation:sf-ball-confirm-blink 480ms ease-out 1}
@keyframes sf-ball-confirm-blink{0%,35%,65%,100%{transform:scaleY(1)}50%{transform:scaleY(.16)}}
.sf-ai-ball--blink .sf-ai-ball__lid{animation:sf-ball-manual-blink 180ms ease-in-out 1}
@keyframes sf-ball-manual-blink{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.16)}}
@media(prefers-reduced-motion:reduce){.sf-ai-ball:not(.sf-ai-ball--forced) *{animation:none!important;transition:none!important}}
</style>
