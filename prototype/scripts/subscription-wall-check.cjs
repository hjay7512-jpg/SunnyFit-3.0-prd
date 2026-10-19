const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),{chromium}=require('playwright-core')
const root=path.resolve(__dirname,'..'),port='3046',base=process.env.WALL_BASE_URL||'http://127.0.0.1:'+port,dir=path.join(root,'docs/subscription-wall-validation')
const report={checks:[],errors:[],writes:[]};let server,browser,page,sequence=0
const pass=name=>{report.checks.push(name);console.log('PASS '+name)}
const dialog=()=>page.getByRole('dialog'),scope=id=>page.locator('[data-review-component="'+id+'"]')
async function tab(id,value){await scope(id).locator('[data-state="'+value+'"]').click();await scope(id).locator('[data-state="'+value+'"][aria-selected=true]').waitFor()}
async function open(screen='course',extra={}){await page.goto(base+'/?wall='+ ++sequence+'#/app/'+screen+'?'+new URLSearchParams({user:'DEMO-2001',review:'1',membershipState:'free',chatRemaining:'0',reviewContent:'content-premium',...extra}));await page.waitForFunction(()=>{const v=document.querySelector('.app-review')?.__vue__;return v&&v.data&&!v.loading&&v.mvpMember});if(extra.review!=='0')await page.locator('.review-document').waitFor()}
const state=()=>page.evaluate(()=>{const v=document.querySelector('.app-review').__vue__;return {context:v.mvpGate?.context,offer:v.mvpGate?.offer,wall:v.mvpWall,events:v.paywallEvents,stage:v.mvpGate?.stage,member:v.mvpMember.state}})
const shot=name=>page.locator('.phone-frame').screenshot({path:path.join(dir,name+'.png')})
;(async()=>{
  fs.mkdirSync(dir,{recursive:true})
  if(!process.env.WALL_BASE_URL){server=spawn(process.execPath,['server/index.cjs'],{cwd:root,windowsHide:true,env:{...process.env,API_PORT:port,DEMO_DB_PATH:path.join(root,'runtime','subscription-wall-'+Date.now()+'.sqlite')},stdio:'ignore'});for(let i=0;i<80;i++){try{if((await fetch(base+'/api/health')).ok)break}catch(_){}await new Promise(r=>setTimeout(r,100))}}
  browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});page.setDefaultTimeout(10000)
  page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/')&&r.method()!=='GET')report.writes.push(r.method()+' '+r.url())})
  const placements=new Set()
  for(const screen of ['course','world-tour-detail','program','plan','weekly','result','coach','challenge','membership']){
    await open(screen);await tab('purchase','offer');await dialog().getByRole('radio').first().waitFor()
    const data=await state();assert.equal(data.wall.id,'sunnyfit-premium');assert.equal(data.wall.version,3);placements.add(data.wall.placementId)
    assert.equal(await dialog().locator('.sf-premium-paywall__resource strong').innerText(),data.context.resourceName);assert.equal(await dialog().locator('[data-purchase-view=benefits]').isVisible(),screen==='membership')
    assert.equal(await dialog().locator('.sf-modal__footer .context-purchase-offers').count(),0)
    if(['course','coach','weekly','program','world-tour'].includes(screen))await shot('entry-'+screen)
  }
  assert.equal(placements.size,9);pass('Nine entitlement entries reuse the same base with distinct story, focused benefits and placement attribution')
  await open('course',{reviewOffer:'trial'});await dialog().getByRole('button',{name:'Start 30-day free trial',exact:true}).waitFor()
  assert.equal(await dialog().getByRole('radio',{name:/Yearly/}).getAttribute('aria-checked'),'true');assert.match(await dialog().locator('.sf-premium-paywall__disclosure').innerText(),/\$0\.00 today.*30 days, \$79\.99\/year/)
  const initial=await state();await shot('trial-annual')
  await dialog().getByRole('radio',{name:/Monthly/}).click();assert.equal(await dialog().getByRole('button',{name:'Continue with Premium',exact:true}).count(),1);assert.match(await dialog().locator('.sf-premium-paywall__disclosure').innerText(),/\$9\.99\/month, starting today/)
  await dialog().getByRole('radio',{name:/Yearly/}).click();pass('Verified trial preselects the eligible annual SKU; changing billing synchronizes CTA and full charge disclosure')
  for(const variant of ['ineligible','unknown','expired','standard']){
    await tab('offer',variant);await dialog().getByRole('button',{name:'Continue with Premium',exact:true}).waitFor()
    const data=await state();assert.equal(data.context.flowId,initial.context.flowId);assert.equal(data.context.resourceId,initial.context.resourceId);assert.equal(data.wall.campaignId,null)
    assert.equal(await dialog().getByRole('button',{name:/free trial/}).count(),0);assert.equal(await dialog().getByText('30 days free',{exact:true}).count(),0)
  }
  await shot('standard-course');pass('Ineligible, unknown and expired offers safely fall back while preserving the original task and flow')
  await tab('offer','unavailable');assert.equal(await dialog().getByRole('button',{name:'Plans unavailable',exact:true}).isDisabled(),true)
  await dialog().getByRole('button',{name:'Try again',exact:true}).click();await dialog().getByRole('button',{name:'Continue with Premium',exact:true}).waitFor();assert.equal((await state()).context.flowId,initial.context.flowId)
  pass('Unavailable catalog blocks payment and retry restores plans without dropping the selected resource')
  await dialog().getByRole('button',{name:'Restore purchases',exact:true}).click();await dialog().getByText('No active subscription was found for this account.',{exact:true}).waitFor();assert.equal((await state()).member,'free')
  pass('Restore checks existing ownership and reports no active subscription without granting demo membership')
  await dialog().getByRole('button',{name:'See what Premium includes',exact:true}).click();await dialog().getByRole('region',{name:'Before you decide'}).getByText('Is AI Coach unlimited?',{exact:true}).click();assert.match(await dialog().locator('details[open]').innerText(),/finite conversation allowance/)
  await dialog().getByRole('radio',{name:/Yearly/}).click();await dialog().getByRole('button',{name:'Close',exact:true}).click();await dialog().waitFor({state:'hidden'})
  const events=(await state()).events;for(const type of ['paywall_view','paywall_offer_selected','paywall_details_view','paywall_dismissed','paywall_restore_result'])assert.ok(events.some(e=>e.type===type))
  assert.equal(new Set(events.filter(e=>e.type==='paywall_view').map(e=>[e.flowId,e.eligibilityReason,e.offerId].join('|'))).size,events.filter(e=>e.type==='paywall_view').length)
  assert.equal(events.findLast(e=>e.type==='paywall_dismissed').billingPeriod,'annual');assert.match(await scope('paywall-events').innerText(),/关闭付费墙/)
  pass('Exposure is deduplicated; selections, expansion, restore and dismissal retain the same funnel attribution in the review document')
  await open('coach');await page.locator('textarea').fill('Private saved training question');await page.getByRole('button',{name:'See Premium options',exact:true}).click();const draftFlow=(await state()).context.flowId
  assert.equal(await dialog().getByText('Message saved',{exact:true}).count(),1);await tab('offer','trial');assert.equal((await state()).context.flowId,draftFlow)
  await dialog().getByRole('button',{name:'Start 30-day free trial',exact:true}).click();await page.getByRole('dialog',{name:'You’re ready to continue',exact:true}).waitFor()
  assert.equal(await page.locator('.actual-conversation .user-bubble').count(),0);assert.equal(await page.locator('textarea').inputValue(),'Private saved training question')
  const success=await state();assert.equal(success.offer.trialDays,30);assert.equal(success.member,'active');assert.equal(JSON.stringify(success.events).includes('Private saved'),false)
  await dialog().getByRole('button',{name:'Send saved message',exact:true}).click();await page.locator('.actual-conversation .user-bubble').waitFor()
  assert.ok((await state()).events.some(e=>e.type==='paywall_continue'));pass('Trial success keeps the draft private and waits for explicit continuation before sending it')
  await open('coach',{membershipState:'active'});await page.locator('textarea').fill('Keep my message');await page.getByRole('button',{name:'View allowance',exact:true}).click();assert.equal(await dialog().getByRole('radio').count(),0)
  pass('Existing Premium with empty chat allowance receives a usage explanation rather than another subscription wall')
  for(const [width,height] of [[320,640],[375,667],[390,844],[430,932]]){
    await page.setViewportSize({width,height});await open('course',{review:'0'});await page.locator('[data-action=start-course]').click();await dialog().getByRole('radio').first().waitFor()
    await dialog().locator('.sf-modal__body').evaluate(e=>e.scrollTop=e.scrollHeight)
    assert.ok(await page.evaluate(()=>{const d=document.querySelector('.sf-modal'),f=d.querySelector('.sf-modal__footer').getBoundingClientRect(),p=d.querySelector('.context-purchase-offers').getBoundingClientRect();return d.scrollWidth<=d.clientWidth+1&&p.bottom<=f.top+1&&document.documentElement.scrollWidth<=innerWidth+1}))
    const cta=await dialog().getByRole('button',{name:'Continue with Premium',exact:true}).boundingBox();assert.ok(cta.height>=44)
    await dialog().locator('.sf-modal__body').evaluate(e=>e.scrollTop=0);await shot('mobile-'+width);pass(width+'×'+height+' wall scrolls benefits and plans above an accessible fixed CTA without overlap')
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.writes,[]);pass('All review interactions are read-only and produce no browser errors');report.status='passed'
})().catch(async e=>{report.status='failed';report.error=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(dir,'failure.png'),fullPage:true}).catch(()=>{})}).finally(async()=>{if(browser)await browser.close();if(server)server.kill();fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence:dir,error:report.error}))})
