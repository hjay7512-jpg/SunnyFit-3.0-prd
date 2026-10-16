import Layout from '@/layout'
import { scopeForPath } from './commercialization-scope'

// Same route-module and meta.perms convention as the published SunnyFit admin.
const commercialization = {
  path: '/commercialization',
  component: Layout,
  redirect: '/commercialization/overview',
  name: 'Commercialization',
  meta: { title: 'Commercialization', icon: 'el-icon-money' },
  children: [
    { path: 'overview', name: 'CommercializationOverview', component: () => import('@/views/commercialization/overview'), meta: { title: 'Demo Overview', perms: ['GET /commercialization/overview'] } },
    ...['products','content','pricing','campaigns'].flatMap(entity => [
      { path: entity, name: 'Commerce'+entity, component: () => import('@/views/commercialization/configurations'), props: { entity }, meta: { title: {products:'Products',content:'Course Management',pricing:'Service Pricing',campaigns:'Campaigns & Compensation'}[entity], perms: ['GET /commercialization/'+entity] } },
      { path: entity+'/:id', name: 'Commerce'+entity+'Detail', hidden: true, component: () => import('@/views/commercialization/configurations/detail'), props: { entity }, meta: { title: 'Configure '+entity, activeMenu: '/commercialization/'+entity, perms: ['PUT /commercialization/'+entity+'/{id}'] } }
    ]),
    { path:'users',name:'CommerceUsers',component:()=>import('@/views/commercialization/users'),meta:{title:'User Rights',perms:['GET /commercialization/users']} },
    { path:'users/:id',name:'CommerceUserDetail',hidden:true,component:()=>import('@/views/commercialization/users/detail'),meta:{title:'User Detail',activeMenu:'/commercialization/users',perms:['GET /commercialization/users/{id}']} },
    { path:'wallets',name:'CommerceWallets',component:()=>import('@/views/commercialization/users'),props:{walletOnly:true},meta:{title:'Credits Wallets',perms:['GET /commercialization/users']} },
    ...['ledger','orders','subscriptions','redemptions','usage','campaign-runs','audit'].map(kind=>({path:kind,name:'CommerceRecords'+kind,component:()=>import('@/views/commercialization/records'),props:{kind},meta:{title:{ledger:'Credits Ledger',orders:'Orders',subscriptions:'Subscriptions',redemptions:'Redemptions',usage:'Service Requests','campaign-runs':'Delivery Records',audit:'Audit Log'}[kind],perms:['GET /commercialization/'+kind]}})),
    {path:'operations',name:'CommerceOperations',component:()=>import('@/views/commercialization/operations'),meta:{title:'Flow Preview',perms:['POST /commercialization/demo'] }},
    {
      path: 'catalog', name: 'EntitlementCatalog',
      component: () => import('@/views/commercialization/catalog'),
      meta: { title: 'Entitlement Catalog', perms: ['GET /commercialization/catalog'], noCache: true }
    },
    {
      path: 'suits', name: 'EntitlementSuits',
      component: () => import('@/views/commercialization/suits'),
      meta: { title: 'Entitlement Suits', perms: ['GET /commercialization/suits'], noCache: true }
    },
    {
      path: 'suits/create', name: 'EntitlementSuitCreate', hidden: true,
      component: () => import('@/views/commercialization/suits/detail'),
      meta: { title: 'New Entitlement Suit', activeMenu: '/commercialization/suits', perms: ['POST /commercialization/suits'], noCache: true }
    },
    {
      path: 'suits/:id', name: 'EntitlementSuitConfigure', hidden: true,
      component: () => import('@/views/commercialization/suits/detail'),
      meta: { title: 'Configure Suit', activeMenu: '/commercialization/suits', perms: ['PUT /commercialization/suits/{id}'], noCache: true }
    }
  ]
}

const supportingParents = {
  wallets: 'users', ledger: 'users', redemptions: 'content', usage: 'users',
  'campaign-runs': 'campaigns', audit: 'overview'
}
commercialization.children.forEach(route => {
  const scope = scopeForPath('/commercialization/' + route.path)
  if (!scope) return
  route.meta.implementation = scope.kind
  route.meta.prototypeOnly = scope.kind === 'prototype'
  if (supportingParents[route.path]) {
    route.hidden = true
    route.meta.activeMenu = '/commercialization/' + supportingParents[route.path]
  }
})
export default commercialization
