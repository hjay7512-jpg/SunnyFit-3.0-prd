import base from '../../../public/assets/figma/v3/home/manifest.json'
import ai from '../../../public/assets/figma/v3/home-ai-plan/manifest.json'
import schedule from '../../../public/assets/figma/v3/home-schedule/manifest.json'
import program from '../../../public/assets/figma/v3/home-course-plan/manifest.json'

const scenes={default:base,ai,schedule,program}
const directories={default:'home',ai:'home-ai-plan',schedule:'home-schedule',program:'home-course-plan'}
export function homeStateAsset(scene,name){const key=scenes[scene]&&scenes[scene][name]?scene:'default',entry=scenes[key][name];if(!entry)throw Error('Unknown formal Home state asset: '+scene+'/'+name);return '/assets/figma/v3/'+directories[key]+'/'+entry.file}
// Source snapshots for visual comparison only. The storefront has no personal plan/history API.
export const homeStates=[{value:'default',label:'No plan',title:'Quick Start',nodeId:'7590:5619'},{value:'ai',label:'AI Plan',title:'Dynamic Plan',nodeId:'7591:7185'},{value:'schedule',label:'Schedule',title:'Custom Schedule',nodeId:'7618:8349'},{value:'program',label:'Program',title:'Training Program',nodeId:'7618:8832'}]
export function homeReferenceState(key){
  const scene=homeStates.find(s=>s.value===key)||homeStates[0],asset=name=>homeStateAsset(scene.value,name)
  if(scene.value==='default')return {key:scene.value,nodeId:scene.nodeId,title:'Quick Start',plans:[],history:[]}
  const percentage=(title,valueSize)=>({id:title,title,mode:'percentage',layers:['img8','img9','img10'].map(asset),progressText:'75%',progressCaption:'Progress',progressLabel:'Reference progress 75 percent',valueSize,details:[{label:'Completed',value:'20'},{label:'Remaining',value:'5'}]})
  const plans=scene.value==='ai'?[{id:'dynamic',title:'Dynamic Plan',mode:'stage',layers:['imgEllipse1010','imgEllipse1011','imgEllipse1012','imgEllipse1013'].map(asset),progressText:'1/4',progressCaption:'Stage',progressLabel:'Reference stage 1 of 4',valueSize:'body',details:[{label:'Current Stage',value:'Body Awake'},{label:'Day 2',value:'Cardio Focus'}]},percentage('Training Program','body')]:[percentage(scene.value==='schedule'?'AI Plan':'Training Program',scene.value==='schedule'?'body':'emphasis')]
  return {key:scene.value,nodeId:scene.nodeId,title:scene.title,detail:scene.value==='ai'?'Cardio • 100/200 kcal':'2/4 workouts',plans,notificationCount:19,quickActions:scene.value==='program'?[{id:'program-next',label:'Course2',emoji:'💪'}]:undefined,history:[{id:'reference-history-1',name:'6 Best Exercise Equipment for Small Spaces and Apartments',durationMinutes:15,level:'Advanced',coverUrl:asset('img1'),avatars:['img2','img3','img4'].map(asset),participantBadge:asset('img5'),participants:'99+'},{id:'reference-history-2',name:'6 Best Exercise Equipment for Small Spaces and Apartments',durationMinutes:15,level:'Advanced',coverUrl:asset('img6')}]}
}
