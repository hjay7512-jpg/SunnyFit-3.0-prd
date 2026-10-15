import {aiMotionPolicy, setAiMotionPolicy} from '@/design-system/motion-policy'

const key = 'sunnyfit-demo:ai-motion'
export {aiMotionPolicy}
export function chooseDemoAiMotion(value) {
  setAiMotionPolicy(value)
  try {localStorage.setItem(key, aiMotionPolicy.value)} catch (_) {}
}
export function initializeDemoAiMotion() {
  const search = new URLSearchParams(location.search)
  const hashSearch = new URLSearchParams(location.hash.split('?')[1] || '')
  const explicit = search.get('motion') || hashSearch.get('motion')
  try {setAiMotionPolicy(localStorage.getItem(key))} catch (_) {}
  if (['system', 'full', 'reduce'].includes(explicit)) chooseDemoAiMotion(explicit)
  window.addEventListener('storage', event => {if (event.key === key) setAiMotionPolicy(event.newValue)})
}
