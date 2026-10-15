export function dateTime(value) {
  return value ? new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : 'No expiry'
}
export function scopeLabel(item, scopes) {
  const options=scopeOptions(item)
  return scopes.map(code => { const scope = options.find(entry => entry.code === code); return scope ? scope.label : code }).join(', ')
}
export function scopeOptions(item) {
  const options=item&&Array.isArray(item.scopes)?item.scopes:[]
  return options.map(scope=>({...scope,label:options.length===1?'Default':scope.label}))
}
export function catalogScopeOptions(item) {
  const options=item&&Array.isArray(item.scopes)?item.scopes:[]
  const specific=options.filter(scope=>scope.code!=='all')
  const displayed=specific.length?specific:options
  return displayed.map(scope=>({
    ...scope,
    label:displayed.length===1?'Default':scope.label,
    description:scope.code==='all'?'Default scope':scope.label
  }))
}
