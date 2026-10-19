import {safeWallEvent} from './subscription-wall.cjs'
let adapter=null
export function setPaywallAnalyticsAdapter(value){adapter=typeof value==='function'?value:null}
export function recordPaywallEvent(input){
  const event=safeWallEvent({...input,eventId:crypto.randomUUID(),at:new Date().toISOString()})
  try{const key='sunnyfit:paywall-events:v2',prior=JSON.parse(sessionStorage.getItem(key)||'[]');sessionStorage.setItem(key,JSON.stringify([...prior,event].slice(-100)))}catch(_){}
  window.dispatchEvent(new CustomEvent('sunnyfit:paywall',{detail:event}))
  try{if(adapter)adapter(event)}catch(_){}
  return event
}
