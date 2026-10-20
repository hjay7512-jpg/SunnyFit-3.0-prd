const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright-core')
const base=process.env.MVP_PAGES_BASE_URL||'http://127.0.0.1:3012',dir=path.resolve(__dirname,'../docs/mvp-page-states-preview')
const report={checks:[],errors:[],writes:[],status:'running'};let browser,page
const pass=name=>{report.checks.push(name);console.log('PASS '+name)}
async function open(screen,state='default',member='free',percent=65,mode='standard',review='0'){
  await page.goto(base+'/#/app/'+screen+'?'+new URLSearchParams({user:'DEMO-2002',review,membershipState:member,chatRemaining:String(percent),allowanceMode:mode,mvpState:state}))
  await page.locator('.phone-frame[aria-busy=false]').waitFor();await page.locator('.phone-frame .sf-page-layout,.phone-frame .visual-coach,.phone-frame .personal-center,.phone-frame .premium-page').first().waitFor()
}
async function capture(name){await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.locator('.phone-frame').screenshot({path:path.join(dir,name+'.png')})}
async function layout(){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Document overflow');const bad=await page.locator('.phone-frame').evaluate(e=>[...e.querySelectorAll('.mvp-access-note,.weekly-upgrade,.mvp-coach-state,.mvp-dynamic-preview')].filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.className));assert.deepEqual(bad,[])}
;(async()=>{
  fs.mkdirSync(dir,{recursive:true});browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'})
  page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/')&&r.method()!=='GET')report.writes.push(r.method()+' '+r.url())})
  const matrix={course:['content-free','content-premium','loading','unavailable'],'world-tour':['content-free','content-premium','loading','empty'],program:['content-free','content-premium','empty'],weekly:['default','saved-insight','insight-loading','empty'],coach:['default','plan-preview','plan-active','thinking'],plan:['plan-active','loading']}
  for(const width of [375,390,430]){
    await page.setViewportSize({width,height:900})
    for(const [screen,states]of Object.entries(matrix))for(const state of states){
      const member=screen==='weekly'&&state.startsWith('insight-')?'active':state==='plan-active'?'active':'free'
      await open(screen,state,member);await layout()
      if(width===390)await capture(screen+'-'+state)
    }
    pass(width+'px: original six pages cover loading/access/empty/AI states without horizontal overflow')
  }
  await page.setViewportSize({width:390,height:900});
  await open('course','content-free','free',0);await page.locator('[data-action=start-course]').click();await page.getByRole('heading',{name:'Ready to train',exact:true}).waitFor();pass('Free training remains available at zero conversation allowance');
  await open('course','content-premium','free',0);await page.locator('[data-action=start-course]').click();await page.getByRole('dialog').getByRole('radio',{name:/Monthly/}).waitFor();assert.ok(page.url().includes('/course?'));await capture('course-contextual-offer');await page.getByRole('button',{name:'Close',exact:true}).click();pass('Contextual paywall presents plans without leaving the original course');
  await open('weekly','saved-insight','expired');assert.match(await page.locator('[data-testid=weekly-ai-insight]').innerText(),/Saved AI insight/);
  await open('weekly','insight-loading','active');await page.locator('[data-testid=weekly-ai-insight]').waitFor();pass('Saved Insight survives expiry and loading does not hide free stats');
  await page.setViewportSize({width:1440,height:1000});await open('coach','plan-preview','free',65,'standard','1');await page.locator('.review-pages').getByRole('button',{name:'个人中心',exact:true}).click();await page.locator('.personal-center').waitFor();assert.equal(await page.locator('.review-pages [aria-current=page]').count(),1);await page.screenshot({path:path.join(dir,'original-app-review.png'),fullPage:true});pass('Original App sidebar continues to organize all page states');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.writes,[]);pass('No browser errors and no API mutations in review fixtures');report.status='passed'
})().catch(async error=>{report.status='failed';report.error=error.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{})}).finally(async()=>{if(browser)await browser.close();fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence:dir,error:report.error}))})
