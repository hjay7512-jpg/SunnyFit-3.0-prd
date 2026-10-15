import {fitnessGoals} from '@/views/app/profile-menu'

const prefix='sunnyfit-demo:profile-preferences:v1:'
const defaults=()=>({units:null,goal:null})
function validated(value){return {units:['metric','imperial'].includes(value&&value.units)?value.units:null,goal:fitnessGoals.includes(value&&value.goal)?value.goal:null}}
export function readProfilePreferences(userId){
  try{return validated(JSON.parse(localStorage.getItem(prefix+userId)))}catch(_){return defaults()}
}
export function saveProfilePreferences(userId,value){
  const preferences=validated(value)
  localStorage.setItem(prefix+userId,JSON.stringify(preferences))
  return preferences
}
