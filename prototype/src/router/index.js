import Vue from 'vue'
import Router from 'vue-router'
import commercialization from './modules/commercialization'
import store from '@/store'

Vue.use(Router)
function previewSelector(to) {
  if(to.path!=='/demo/lab'||to.query.tab!=='components')return null
  if(to.query.component==='home')return '.home-components-showcase'
  const state=(to.query.component||'').replace(/^plan-/,'')
  return ['training','recovery','completed','paused'].includes(state)?'#page-preview-'+state:null
}
function scrollToPreview(to,selector) {
  // The catalog is inside a lazy view, so its target can mount after Router's tick.
  return new Promise(resolve => {
    let observer,timer
    const finish=position=>{if(observer)observer.disconnect();clearTimeout(timer);resolve(position)}
    const locate=()=>{
      if(router.currentRoute.fullPath!==to.fullPath){finish();return}
      if(document.querySelector(selector))finish({selector,offset:{y:64}})
    }
    observer=new MutationObserver(locate)
    observer.observe(document.body,{childList:true,subtree:true})
    timer=setTimeout(()=>finish(),3000)
    locate()
  })
}
const router = new Router({
  mode: 'hash',
  scrollBehavior: to => {
    const selector=previewSelector(to)
    return selector?scrollToPreview(to,selector):{y:0}
  },
  routes: [
    { path: '/', redirect: '/commercialization/overview', hidden: true },
    commercialization,
    { path: '/business-rules', name: 'BusinessRules', component: () => import('@/views/business-rules'), hidden: true, meta: { title: 'Business Rules', app: true, noCache: true } },
    { path: '/demo/lab', component: () => import('@/views/demo/Lab'), hidden: true, meta: { title: 'V3.0 Demo Lab', app: true } },
    { path: '/app', redirect: '/app/home', hidden: true },
    { path: '/app/:screen(home|workout|course|program|result|plan|history|profile|membership|plans|billing|wallet|coach|weekly|challenge|movement|movement-detail|movement-training|world-tour|world-tour-detail|devices|community|settings|support|invite|equipment-shop)', component: () => import('@/views/app'), hidden: true, meta: { title: 'App Samples', app: true } },
    { path: '/app/:withdrawn(content|library|unlocked|program-detail)', redirect: to => ({path:'/app/home',query:to.query}), hidden:true },
    { path: '*', redirect: '/commercialization/overview', hidden: true }
  ]
})
// Keep previously shared review links working while moving the global rules out of the admin menu.
router.beforeEach((to, from, next) => {
  if (to.path === '/commercialization/overview' && to.query.tab === 'logic') {
    const query = { ...to.query }
    delete query.tab
    next({ path: '/business-rules', query, replace: true })
    return
  }
  next()
})
// Vue Router 3.1 does not call scrollBehavior for the first Hash navigation.
router.onReady(()=>{
  const to=router.currentRoute,selector=previewSelector(to)
  if(!selector)return
  Vue.nextTick(()=>scrollToPreview(to,selector).then(position=>{
    if(!position||router.currentRoute.fullPath!==to.fullPath)return
    const target=document.querySelector(selector)
    if(target)window.scrollTo(0,target.getBoundingClientRect().top+window.pageYOffset-position.offset.y)
  }))
})
router.afterEach(to => {
  document.title = `${to.meta.title || 'Commercialization'} - SunnyFit`
  if (!to.meta.app) store.dispatch('tagsView/addView', to)
})
export default router
