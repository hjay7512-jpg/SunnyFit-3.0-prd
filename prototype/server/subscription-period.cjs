// Calendar boundaries use the original subscription anchor, including month-end
// clamping and the IANA time zone recorded when the user subscribes.
const formatters = new Map()
function validateTimeZone(timeZone) {
  try { new Intl.DateTimeFormat('en-US',{timeZone}).format(); return true } catch (_) { return false }
}
function civil(date,timeZone) {
  if(!formatters.has(timeZone))formatters.set(timeZone,new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}))
  const result={};for(const part of formatters.get(timeZone).formatToParts(new Date(date)))if(part.type!=='literal')result[part.type]=Number(part.value)
  return result
}
function civilEpoch(parts){return Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second)}
function monthBoundary(anchor,monthIndex,timeZone='UTC') {
  if(!validateTimeZone(timeZone)||!Number.isInteger(monthIndex)||monthIndex<0||!Number.isFinite(Date.parse(anchor)))throw new Error('Invalid subscription anchor, month index or time zone')
  if(monthIndex===0)return new Date(anchor).toISOString()
  const origin=civil(anchor,timeZone),month=new Date(Date.UTC(origin.year,origin.month-1+monthIndex,1))
  const last=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate()
  const desired=civilEpoch({...origin,year:month.getUTCFullYear(),month:month.getUTCMonth()+1,day:Math.min(origin.day,last)})
  let guess=desired;const seen=[]
  for(let attempt=0;attempt<8;attempt++){
    const offset=civilEpoch(civil(guess,timeZone))-guess,next=desired-offset
    if(next===guess)return new Date(next+new Date(anchor).getUTCMilliseconds()).toISOString()
    if(seen.includes(next))return new Date(Math.max(next,guess)+new Date(anchor).getUTCMilliseconds()).toISOString()
    seen.push(guess);guess=next
  }
  throw new Error('Could not resolve subscription calendar boundary')
}
module.exports={monthBoundary,validateTimeZone,civil}
