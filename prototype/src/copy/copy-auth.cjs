// Only an authenticated, structured API response can establish edit permission.
function validSession(value,now=Date.now()){
  return !!value&&['editor','reviewer'].includes(value.role)&&Array.isArray(value.scopes)&&value.scopes.length>0&&value.scopes.every(scope=>typeof scope==='string')&&((value.authType==='password'&&value.persistent===true)||(typeof value.expiresAt==='string'&&Date.parse(value.expiresAt)>now))
}
function capabilityRejected(status,result,isJson){
  return status===401&&isJson&&!!result&&['请使用有效的协作链接。','协作链接已失效，请联系原型维护者。'].includes(result.message)
}
module.exports={validSession,capabilityRejected}
