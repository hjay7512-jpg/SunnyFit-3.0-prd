<template>
  <div class="movement-experience" :class="['movement-experience--'+stage,{'movement-experience--landscape':landscape,'movement-experience--immersive':immersive&&['training','countdown','rest'].includes(stage)}]">
    <movement-detail v-if="stage==='detail'" :content="content" :training="training" :media="media" :poster="poster" @prepare="$emit('prepare')" @exit="$emit('exit')"/>
    <movement-preparation v-else-if="stage==='prepare'" :content="content" :training="training" :vision-available="visionAvailable" :media="media" :poster="poster" :busy="busy" @start="start" @exit="$emit('exit')"/>

    <template v-else-if="stage==='setup'||stage==='training'||stage==='countdown'||stage==='rest'">
      <header class="movement-live-header">
        <div class="movement-player-status" aria-hidden="true"><b>9:41</b><img :src="homeAsset('imgRightSide')" alt=""/></div>
        <button type="button" class="movement-glass-button" :aria-label="stage==='setup'?'Back to preparation':'Exit workout'" @click="requestExit"><training-icon :name="stage==='setup'?'back':'close'"/></button>
        <div><span class="movement-live-kicker">{{ stage==='setup'?'VISION RECOGNITION':(stage==='rest'?'REST':phaseLabel(current.phase).toUpperCase())+' \u00b7 '+(session.index+1)+' / '+training.steps.length }}</span><strong>{{ stage==='setup'?'Camera Setup':mode==='vision'?'Vision Recognition':'Follow Along' }}</strong></div>
        <div class="movement-header-actions"><button v-if="stage!=='setup'&&mode==='regular'" type="button" class="movement-glass-button movement-orientation" :aria-label="landscape?'Portrait':'Landscape'" @click="toggleOrientation"><training-icon name="rotate" :size="20"/></button><button v-if="stage!=='setup'" type="button" class="movement-glass-button" :aria-label="muted?'Unmute exercise video':'Mute exercise video'" @click="toggleAudio"><training-icon :name="muted?'muted':'volume'" :size="20"/></button></div>
      </header>
      <div class="movement-live" :class="{'movement-live--teacher':!cameraMain||mode==='regular','movement-live--setup':stage==='setup'}">
        <div v-if="mode==='vision'" ref="cameraViewport" class="movement-camera" :class="{'is-pip':!cameraMain&&stage!=='setup'}">
          <video v-if="reviewSource==='demo'" key="sample-camera" ref="sampleVideo" :src="sampleMedia" autoplay loop muted playsinline :poster="poster(current)" class="movement-camera__video" @loadedmetadata="updateCameraBox"/>
          <video v-else key="live-camera" ref="cameraVideo" autoplay playsinline muted class="movement-camera__video" @loadedmetadata="updateCameraBox"/>
          <div v-if="cameraReady&&stage==='setup'" class="movement-framing-box" :style="cameraBox"><framing-guide :framing="framing" :valid="bodyVisible"/></div>
          <button v-if="!cameraMain&&stage!=='setup'" class="movement-pip-hit" aria-label="Make camera full screen" @click="swap"><span>You <training-icon name="swap" :size="14"/></span></button>
        </div>
        <div v-if="stage!=='setup'" class="movement-teacher" :class="{'is-pip':mode==='vision'&&cameraMain}">
          <img v-if="exercise(current).imageOnly" class="movement-reference-image" :src="poster(current)" alt="Movement image reference"/>
          <video v-else ref="teacherVideo" :key="session.index" :src="media(current)" :poster="poster(current)" autoplay :muted="muted" loop playsinline @error="mediaError=true"/>
          <span v-if="mediaError" class="movement-media-error">Video unavailable. You can skip this movement.</span>
          <button v-if="mode==='vision'&&cameraMain" class="movement-pip-hit" aria-label="Make trainer full screen" @click="swap"><span>Trainer <training-icon name="swap" :size="14"/></span></button>
        </div>
        <span v-if="reviewSource==='demo'&&mode==='vision'" class="movement-demo-label">Demo preview</span>
        <div v-if="stage==='setup'&&cameraReady" class="movement-setup-status" :class="{'is-ready':bodyVisible}" role="status"><span class="movement-status-dot"/>{{ recognitionHint }}</div>
        <div v-else-if="stage==='training'&&mode==='vision'" class="movement-live-badge"><span class="movement-status-dot" :class="{'is-inactive':current.kind==='time'}"/>{{ current.kind==='time'?'Timer only \u00b7 recognition off':bodyVisible?'Counting your reps':'Step into view to count' }}</div>
        <div v-if="stage==='setup'&&!cameraReady" class="movement-camera-empty"><training-icon name="camera" :size="42"/><strong>{{ cameraStarting?cameraPhase==='model'?'Getting your camera ready':'Allow camera access':'Let\u2019s get you in view' }}</strong><p>{{ cameraError||(cameraStarting?cameraPhase==='model'?'Your camera is on. Loading recognition.':'Choose Allow in your browser to continue.':'Place your phone upright on a stable surface.') }}</p><sf-button v-if="!cameraStarting" @click="enableCamera">{{ cameraError?'Try camera again':'Enable camera' }}</sf-button><button type="button" class="movement-light-link" @click="fallback">Use Follow along</button></div>
        <div v-if="stage==='countdown'" class="movement-countdown"><strong>{{ countdown }}</strong></div>
      </div>

      <section v-if="stage==='setup'" class="movement-setup-panel">
        <h1>Step into view</h1><p>Place your phone upright and make sure you can see yourself in the camera.</p>
        <div class="movement-stability" :class="{'is-ready':bodyVisible}"><span class="movement-stability__ring" :style="{'--progress':stability/3*100+'%'}"><training-icon v-if="stability>=3" name="check" :size="18"/><b v-else>{{ Math.max(1,Math.ceil(3-stability)) }}</b></span><div><strong>{{ bodyVisible?'You\u2019re in view. Starting soon...':'Looking for you...' }}</strong><small>Stay in view for 3 seconds to start.</small></div></div>
        <button class="movement-text-button" type="button" @click="fallback">Switch to Follow Along</button>
      </section>

      <section v-else-if="stage==='rest'" class="movement-training-panel movement-rest-panel">
        <div class="movement-panel-heading"><div class="movement-current-overview"><div class="movement-current-title"><p>UP NEXT</p><h1>{{ exercise(current).name }}</h1><p>{{ current.target }} {{ current.kind==='time'?'sec':'reps' }}</p></div><div class="movement-counter"><strong>{{ session.phaseRemaining }}</strong><span>sec</span></div></div><button type="button" class="movement-pause" :aria-label="session.status==='paused'?'Resume workout':'Pause workout'" @click="togglePause"><training-icon :name="session.status==='paused'?'play':'pause'" :size="22"/></button></div>
        <button type="button" class="movement-skip movement-skip-rest" :disabled="session.status!=='active'" @click="skipRest">Skip Rest<training-icon name="skip" :size="18"/></button>
      </section>
      <section v-else class="movement-training-panel" :class="{'is-expanded':!immersive}">
        <button type="button" class="movement-panel-toggle" :aria-label="immersive?'Expand workout panel':'Collapse workout panel'" :aria-expanded="!immersive?'true':'false'" aria-controls="movement-workout-details" @click="togglePanel" @pointerdown="startPanelDrag" @pointerup="endPanelDrag" @pointercancel="panelDragStart=null"><span aria-hidden="true"/></button>
        <div class="movement-panel-heading"><div class="movement-current-overview"><div class="movement-current-title"><h1>{{ exercise(current).name }}</h1><p>{{ current.kind==='time'?'Time remaining':mode==='vision'?'Recognized reps':'Guided reps' }}</p></div><div class="movement-counter" aria-live="off"><strong>{{ current.kind==='time'?Math.max(0,Math.ceil(current.target-session.seconds)):session.reps }}</strong><span>{{ current.kind==='time'?'sec':'/ '+current.target }}</span></div></div><button type="button" class="movement-pause" :aria-label="session.status==='paused'?'Resume workout':'Pause workout'" @click="togglePause"><training-icon :name="session.status==='paused'?'play':'pause'" :size="22"/></button></div>
        <div v-show="!immersive" id="movement-workout-details" class="movement-workout-details">
          <div class="movement-step-track" :aria-label="'Movement progress '+Math.round(stepProgress)+' percent'"><span :style="{width:Math.min(100,stepProgress)+'%'}"/></div>
          <div class="movement-controls"><button type="button" class="movement-skip" :disabled="session.status!=='active'||session.phase!=='exercise'" @click="skip"><span>{{ current.kind==='reps'?'Skip remaining '+(current.target-session.reps)+' reps':'Skip movement' }}</span><training-icon name="skip" :size="18"/></button></div>
          <div v-if="nextStep" class="movement-next"><img :src="poster(nextStep)" alt=""/><div><span>UP NEXT</span><strong>{{ exercise(nextStep).name }}</strong></div><span>{{ nextStep.target }} {{ nextStep.kind==='time'?'sec':'reps' }}</span></div>
          <div v-else class="movement-next movement-next--last"><training-icon name="check" :size="20"/><strong>Last movement</strong></div>
        </div>
      </section>
      <sf-dialog :open="session.status==='paused'&&['training','countdown','rest'].includes(stage)&&!exitOpen&&!runtimeSlow" title="Take your time." description="Your workout is paused." contained :dismissible="false" confirm-label="Resume workout" cancel-label="End workout" @confirm="togglePause" @close="end"><span class="movement-pause-orb"><training-icon name="pause" :size="35"/></span></sf-dialog>
    </template>

    <sf-page-layout v-else-if="stage==='summary'" :title="session.status==='complete'?'Workout complete':'Workout ended'" extended @back="$emit('exit')"><div class="movement-summary-hero"><span class="movement-summary-check"><training-icon name="check" :size="38"/></span><span class="movement-eyebrow movement-eyebrow--red">{{ recognizedReps&&mode==='regular'?'TRAINING SUMMARY':mode==='vision'?'VISION RECOGNITION':'FOLLOW ALONG' }}</span><h1>{{ session.status==='complete'?'Every move counts.':'Good work showing up.' }}</h1><p>{{ content.name }}</p></div><div class="movement-summary-stats"><div><strong>{{ formatTime(session.elapsed) }}</strong><span>Time moving</span></div><div><strong>{{ totalReps }}</strong><span>{{ repLabel }}</span></div></div><p v-if="recognizedReps&&guidedReps" class="movement-summary-sources">{{ recognizedReps }} recognized <span>·</span> {{ guidedReps }} guided</p><section class="movement-summary-list"><h2>Your movements</h2><div v-for="(result,i) in summaryRows" :key="i" class="movement-summary-row"><span class="movement-summary-dot" :class="{'is-skipped':result.skipped||result.unfinished}"><training-icon :name="result.skipped||result.unfinished?'minus':'check'" :size="15"/></span><div><strong>{{ exercise(training.steps[i]).name }}</strong><small>{{ result.unfinished?'Not completed':result.skipped?'Remaining '+Math.ceil(result.remaining)+' '+(result.kind==='reps'?'reps':'sec')+' skipped': 'Target reached' }}</small></div><span>{{ result.kind==='reps'?result.reps:Math.floor(result.seconds) }} / {{ result.target }}<small>{{ result.kind==='reps'?'reps':'sec' }}</small></span></div></section><template #footer><div class="movement-start-footer"><sf-button block @click="$emit('complete')">Done</sf-button></div></template></sf-page-layout>
    <sf-dialog v-model="exitOpen" title="End this workout?" contained destructive confirm-label="End workout" cancel-label="Keep going" @confirm="end" @close="cancelExit"><p>Your completed repetitions will stay in this session summary. You can also take a break and resume.</p></sf-dialog>
    <sf-dialog :open="runtimeSlow" :title="runtimeMessage?'Body recognition interrupted':'Let\u2019s keep your workout smooth'" contained :dismissible="false" confirm-label="Continue with Follow along" cancel-label="End workout" @confirm="continueRegular" @close="end"><p>{{ runtimeMessage||'Vision recognition is running too slowly on this device. Continue with Follow along at the guided pace.' }}</p></sf-dialog>
  </div>
</template>
<script>
import {SfPageLayout,SfButton,SfDialog} from '@/design-system'
import TrainingIcon from './TrainingIcon'
import FramingGuide from './FramingGuide'
import MovementPreparation from './MovementPreparation'
import MovementDetail from './MovementDetail'
import {homeAsset} from '@/design-system/assets/v3-home'
import runtimeAssets from '../../../public/assets/vision-runtime/manifest.json'
import {exercises,defaultTraining} from '../../../config/movement-training.cjs'
import {TrainingSession,StabilityGate,deviceCapability,assessPerson,RecognitionPerformance} from './session.cjs'
const samplePose=()=>Array.from({length:33},(_,i)=>({x:i===11?.39:i===12?.61:i%2?.4:.6,y:i===0?.13:[11,12].includes(i)?.3:[23,24].includes(i)?.62:[27,28].includes(i)?.9:.5,z:0,visibility:1}))
function inspectDevice(){let webgl=false;try{const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2')||canvas.getContext('webgl');webgl=!!gl;if(gl){const debug=gl.getExtension('WEBGL_debug_renderer_info');const renderer=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):'';webgl=/SwiftShader|Software|llvmpipe/i.test(renderer)?'software':true;const ext=gl.getExtension('WEBGL_lose_context');if(ext)ext.loseContext()}}catch(_){}return {...deviceCapability(navigator,webgl),delegate:webgl==='software'?'CPU':'GPU'}}
function within(promise,ms){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Body recognition took too long to load. Retry the camera or use Follow along.')),ms)})]).finally(()=>clearTimeout(timer))}
let runtimePromise
function loadRuntime(){if(window.SunnyVision)return Promise.resolve(window.SunnyVision);if(!runtimePromise)runtimePromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=process.env.BASE_URL+'assets/vision-runtime/'+(runtimeAssets.engineFile||'engine.js');script.onload=()=>resolve(window.SunnyVision);script.onerror=()=>{runtimePromise=null;reject(new Error('Recognition could not load. Please retry or use Follow along.'))};document.head.appendChild(script)});return runtimePromise}
export default {
  name:'MovementExperience',components:{SfPageLayout,SfButton,SfDialog,TrainingIcon,FramingGuide,MovementPreparation,MovementDetail},
  props:{content:{type:Object,required:true},initialStage:{type:String,default:'prepare'},busy:Boolean,review:Boolean,reviewOptions:{type:Object,default:()=>({})}},
  data(){return {stage:this.initialStage,mode:'regular',immersive:false,landscape:false,cameraMain:true,capability:inspectDevice(),session:new TrainingSession([], 'regular'),stability:0,bodyVisible:false,cameraReady:false,cameraStarting:false,cameraError:'',cameraPhase:'off',recognitionHint:'Step into view.',runtimeMessage:'',exitOpen:false,runtimeWasPaused:false,runtimeSlow:false,muted:true,mediaError:false,cameraBox:{},runtimeToken:0,panelDragStart:null,panelGestureUntil:0}},
  computed:{countdown(){return this.session.phaseRemaining},training(){return this.content.training||defaultTraining('regular')},framing(){return this.training.vision.framing},hasWeights(){return this.training.steps.some(s=>s.exerciseId.includes('dumbbell'))},reviewSource(){return this.review&&this.reviewOptions.source==='demo'?'demo':'camera'},visionAvailable(){return this.capability.supported&&!(this.review&&this.reviewOptions.performance==='low')},current(){return this.session.current||this.training.steps[0]},nextStep(){return this.training.steps[this.session.index+1]},sampleMedia(){return process.env.BASE_URL+'assets/movement/media/'+(this.framing==='full_body'?'squat':'curl')+'.mp4'},stepProgress(){return this.current.kind==='time'?this.session.seconds/this.current.target*100:this.session.reps/this.current.target*100},totalReps(){return this.summaryRows.reduce((sum,r)=>sum+(r.kind==='reps'?r.reps:0),0)},recognizedReps(){return this.summaryRows.reduce((sum,r)=>sum+(r.recognizedReps||0),0)},guidedReps(){return this.summaryRows.reduce((sum,r)=>sum+(r.guidedReps||0),0)},repLabel(){return this.recognizedReps&&this.guidedReps?'Total reps':this.recognizedReps||this.mode==='vision'?'Recognized reps':'Guided reps'},summaryRows(){return this.training.steps.map((s,i)=>this.session.results[i]||{...s,reps:i===this.session.index?this.session.reps:0,recognizedReps:i===this.session.index?this.session.recognizedReps:0,guidedReps:i===this.session.index?this.session.guidedReps:0,seconds:i===this.session.index?this.session.seconds:0,unfinished:true})}},
  watch:{'reviewOptions.performance'(){if(!this.visionAvailable){this.capability={...this.capability,reason:'This device works best with Follow along. Vision recognition is unavailable.'};if(this.stage==='prepare')this.mode='regular';else if(this.mode==='vision'&&['setup','training','countdown','rest'].includes(this.stage)){this.runtimeWasPaused=this.session.status==='paused';this.pauseSession();this.runtimeSlow=true;this.stability=0;this.gate.reset()}}},reviewSource(){if(['prepare','detail','summary'].includes(this.stage))return;this.cleanupCamera();this.runtimeSlow=false;this.runtimeMessage='';if(this.stage==='setup')this.$nextTick(()=>this.enableCamera());else if(this.mode==='vision'&&['training','countdown','rest'].includes(this.stage)){this.pauseSession();this.$nextTick(()=>this.enableCamera())}}},
  mounted(){this.gate=new StabilityGate();this.performanceMonitor=new RecognitionPerformance();this.lastTick=performance.now();this.timer=setInterval(this.tick,100);this.onVisibility=()=>{if(document.hidden){this.gate.reset();this.stability=0;if(['training','countdown','rest'].includes(this.stage))this.pauseSession();else this.syncVideos()}this.lastTick=performance.now()};document.addEventListener('visibilitychange',this.onVisibility);this.onResize=()=>this.updateCameraBox();window.addEventListener('resize',this.onResize);this.resizeObserver=new ResizeObserver(this.onResize);this.$nextTick(()=>{if(this.$refs.cameraViewport)this.resizeObserver.observe(this.$refs.cameraViewport)});this.$emit('view-state',{stage:this.stage,landscape:false})},
  beforeDestroy(){clearInterval(this.timer);this.cleanupCamera();document.removeEventListener('visibilitychange',this.onVisibility);window.removeEventListener('resize',this.onResize);this.resizeObserver.disconnect();this.$emit('view-state',{stage:'prepare',landscape:false})},
  methods:{
    homeAsset,
    exercise(step){return exercises.find(e=>e.id===step.exerciseId)||{name:'Movement',hint:'Follow the movement guide.'}},
    media(step){if(this.exercise(step).imageOnly)return '';if(step.videoUrl)return /^\/assets\//.test(step.videoUrl)?process.env.BASE_URL+step.videoUrl.slice(1):step.videoUrl;return process.env.BASE_URL+'assets/movement/'+(this.exercise(step).real?'real/':'media/')+this.exercise(step).video+(this.exercise(step).real?'-preview.mp4':'.mp4')},
    poster(step){const e=this.exercise(step);return process.env.BASE_URL+'assets/movement/'+(e.real?'real/':'media/')+e.video+(e.real&&!e.imageOnly?'.jpg':'.png')},
    phaseLabel(phase){return {warmup:'Warm-up',main:'Workout',cooldown:'Cooldown'}[phase]||'Workout'},
    formatTime(value){return String(Math.floor(value/60)).padStart(2,'0')+':'+String(Math.floor(value%60)).padStart(2,'0')},
    setStage(stage){this.stage=stage;this.lastTick=performance.now();this.$emit('view-state',{stage,landscape:this.landscape});this.$nextTick(()=>{if(this.$refs.cameraViewport){this.resizeObserver.observe(this.$refs.cameraViewport);this.updateCameraBox()}})},
    start(mode){this.mode=mode==='vision'&&this.training.vision.supported&&this.visionAvailable?'vision':'regular';this.$emit('start')},
    begin(){if(this.mode==='vision'&&!this.visionAvailable)this.mode='regular';this.session=new TrainingSession(this.training.steps,this.mode);this.immersive=false;this.runtimeMessage='';this.cameraMain=true;this.gate.reset();if(this.mode==='vision'){this.setStage('setup');this.$nextTick(()=>this.enableCamera())}else{this.session.start();this.afterStep(-1)}},
    fallback(){this.cleanupCamera();this.mode='regular';this.landscape=false;this.setStage('prepare')},
    async enableCamera(){
      if(this.cameraStarting)return
      if(this.reviewSource==='demo'){this.cameraReady=true;this.cameraPhase='ready';this.bodyVisible=false;this.$nextTick(this.updateCameraBox);return}
      const token=++this.runtimeToken;this.cameraStarting=true;this.cameraError='';this.cameraPhase='permission';this.recognitionHint='Allow camera access in your browser.'
      try{
        if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera access needs a secure browser connection. Use Follow along to continue.')
        const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:960}},audio:false})
        if(token!==this.runtimeToken){stream.getTracks().forEach(t=>t.stop());return}
        this.cameraStream=stream;this.$refs.cameraVideo.srcObject=stream;await this.$refs.cameraVideo.play()
        this.cameraPhase='model';this.recognitionHint='Camera is on. Loading body recognition...';const runtime=await loadRuntime();if(token!==this.runtimeToken)return
        const engine=new runtime.PoseEngine();this.poseEngine=engine
        await within(engine.initialize({wasmBase:process.env.BASE_URL+'assets/vision-runtime/wasm',modelPath:process.env.BASE_URL+'assets/vision-runtime/pose_landmarker_lite.task',delegate:this.capability.delegate,strictErrors:true}),25000)
        if(token!==this.runtimeToken){engine.dispose();return}
        this.runtime=runtime;this.filter=new runtime.SmoothingFilter(3);this.cameraReady=true;this.cameraPhase='ready';this.recognitionHint='Step into the guide.';this.performanceMonitor=new RecognitionPerformance();this.frameTime=0;this.detectLoop();this.updateCameraBox()
      }catch(error){if(token===this.runtimeToken){this.cameraError=error.name==='NotAllowedError'?'Camera permission was not granted. Allow access in your browser, then try again.':error.name==='NotFoundError'?'No camera was found. Connect a camera or use Follow along.':error.message;this.cleanupCamera()}}finally{if(token===this.runtimeToken)this.cameraStarting=false}
    },
    cleanupCamera(){const video=this.$refs.cameraVideo;if(video)video.srcObject=null;this.runtimeToken++;this.cameraStarting=false;cancelAnimationFrame(this.raf);if(this.cameraStream)this.cameraStream.getTracks().forEach(t=>t.stop());this.cameraStream=null;if(this.poseEngine){this.poseEngine.dispose();this.poseEngine=null}this.detector=null;this.detectorIndex=-1;this.cameraReady=false;this.cameraPhase='off';this.bodyVisible=false;this.stability=0;if(this.gate)this.gate.reset()},
    detectLoop(){
      if(!this.poseEngine)return
      const now=performance.now(),recognizing=this.stage==='setup'||this.stage==='training'&&this.current.kind==='reps'&&this.session.status==='active'
      if(!document.hidden&&recognizing&&now-this.frameTime>80){
        this.frameTime=now
        try{
          const pose=this.poseEngine.detectPose(this.$refs.cameraVideo,now),finished=performance.now(),cost=finished-now
          if(this.performanceMonitor.record(cost,finished)){this.runtimeWasPaused=this.session.status==='paused';this.pauseSession();this.gate.reset();this.stability=0;this.runtimeSlow=true;this.recognitionHint='Recognition is running too slowly on this device.';this.syncVideos();return}
          this.receivePose(pose?{...pose,landmarks:this.filter.push(pose.landmarks)}:null,finished)
        }catch(error){this.runtimeWasPaused=this.session.status==='paused';this.pauseSession();this.runtimeMessage=error.message;this.runtimeSlow=true;this.gate.reset();this.stability=0;this.syncVideos();return}
      }
      this.raf=requestAnimationFrame(this.detectLoop)
    },
    receivePose(pose,now){
      const assessment=assessPerson(pose&&pose.landmarks);this.bodyVisible=assessment.valid;this.recognitionHint=assessment.reason
      if(this.stage==='setup'){this.stability=this.gate.update(this.bodyVisible,null,now);if(this.stability>=3){this.resetRecognition();this.session.start();this.afterStep(-1)}}
      else if(this.stage==='training'&&this.current.kind==='reps'&&this.session.status==='active'){
        if(!this.bodyVisible){if(this.detector)this.detector.reset();this.detectorCount=0;return}
        if(this.reviewSource==='demo')return
        if(!this.detector||this.detectorIndex!==this.session.index){this.detector=this.runtime.createDetector(this.current.exerciseId);this.detectorIndex=this.session.index;this.detectorCount=0}
        if(this.detector){const index=this.session.index;this.detector.updatePose(pose);const count=this.detector.getRepCount();if(count>this.detectorCount){this.detectorCount=count;this.session.recognizeRep();this.afterStep(index)}}
      }
    },
    tick(){
      const now=performance.now(),delta=Math.min(.5,(now-this.lastTick)/1000);this.lastTick=now;this.syncVideos();if(document.hidden||this.runtimeSlow)return
      const phaseBefore=this.stage,indexBefore=this.session.index
      if(this.mode==='vision'&&this.cameraReady&&this.reviewSource==='demo'&&['setup','training'].includes(this.stage))this.receivePose(this.reviewOptions.framed?{landmarks:samplePose(),confidence:1}:null,now)
      if(this.stage!==phaseBefore||this.session.index!==indexBefore)return
      if(['training','countdown','rest'].includes(this.stage)){const index=this.session.index;this.session.tick(delta);this.afterStep(index)}
    },
    afterStep(previous){if(this.session.status==='complete'){this.landscape=false;this.setStage('summary');this.cleanupCamera();return}if(previous!==this.session.index){this.detector=null;this.detectorIndex=-1;this.mediaError=false}const stage={exercise:'training',countdown:'countdown',rest:'rest'}[this.session.phase];if(stage&&stage!==this.stage){this.resetRecognition();this.setStage(stage);if(stage==='training')this.$nextTick(()=>{if(this.$refs.teacherVideo)this.$refs.teacherVideo.currentTime=0})}},
    updateCameraBox(){const el=this.$refs.cameraViewport,video=this.$refs.cameraVideo||this.$refs.sampleVideo;if(!el||!video)return;const vw=video.videoWidth||400,vh=video.videoHeight||600,scale=Math.min(el.clientWidth/vw,el.clientHeight/vh),width=vw*scale,height=vh*scale;this.cameraBox={left:((el.clientWidth-width)/2+width*.08)+'px',top:((el.clientHeight-height)/2+height*.04)+'px',width:width*.84+'px',height:height*.92+'px'}},
    swap(){this.cameraMain=!this.cameraMain;this.$nextTick(this.updateCameraBox)},
    togglePanel(event){if(event&&event.detail&&performance.now()<(this.panelGestureUntil||0))return;this.immersive=!this.immersive;this.$nextTick(this.updateCameraBox)},
    startPanelDrag(event){if(event.button!==0)return;this.panelGestureUntil=0;this.panelDragStart=event.clientY;event.currentTarget.setPointerCapture(event.pointerId)},
    endPanelDrag(event){if(this.panelDragStart===null||this.panelDragStart===undefined)return;const delta=event.clientY-this.panelDragStart;this.panelDragStart=null;if(Math.abs(delta)<24)return;this.immersive=delta>0;this.panelGestureUntil=performance.now()+500;this.$nextTick(this.updateCameraBox)},
    toggleOrientation(){if(this.mode==='vision')return;this.landscape=!this.landscape;this.$emit('view-state',{stage:this.stage,landscape:this.landscape})},
    toggleAudio(){this.muted=!this.muted;if(this.$refs.teacherVideo)this.$refs.teacherVideo.muted=this.muted},
    syncVideos(){const paused=document.hidden||this.runtimeSlow||this.session.status==='paused';for(const video of [this.$refs.teacherVideo,this.$refs.sampleVideo]){if(!video)continue;if(paused&&!video.paused)video.pause();else if(!paused&&video.paused)video.play().catch(()=>{})}},
    resetRecognition(){if(this.detector)this.detector.reset();this.detectorCount=0;if(this.filter)this.filter.reset()},
    pauseSession(){this.session.pause();this.resetRecognition();this.syncVideos()},
    resumeSession(){this.resetRecognition();this.session.resume();this.lastTick=performance.now();this.syncVideos()},
    togglePause(){if(this.session.status==='paused')this.resumeSession();else this.pauseSession()},
    skip(){const index=this.session.index;this.session.skip();this.afterStep(index)},
    skipRest(){this.session.skipRest();this.afterStep(this.session.index)},
    requestExit(){if(this.stage==='setup'){this.fallback();return}this.wasPaused=this.session.status==='paused';this.pauseSession();this.exitOpen=true},
    cancelExit(){this.exitOpen=false;if(!this.wasPaused)this.resumeSession()},
    end(){this.exitOpen=false;this.runtimeSlow=false;this.session.end();this.landscape=false;this.setStage('summary');this.cleanupCamera()},
    continueRegular(){this.runtimeSlow=false;this.cleanupCamera();this.mode='regular';this.session.mode='regular';this.landscape=false;if(this.stage==='setup'){this.setStage('prepare');return}if(!this.runtimeWasPaused)this.resumeSession()},
    simulate(event){if(!this.review||this.reviewSource!=='demo'||this.stage!=='training'||this.session.status!=='active')return;const index=this.session.index;if(event==='rep'&&this.bodyVisible)this.session.recognizeRep();if(event==='target'&&this.bodyVisible&&this.current.kind==='reps'){const remaining=this.current.target-this.session.reps;for(let i=0;i<remaining;i++)this.session.recognizeRep()}if(event==='timer'&&this.current.kind==='time')this.session.seconds=Math.max(0,this.current.target-1);this.afterStep(index)}
  }
}
</script>
<style src="./movement.css"></style>
