const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),{chromium}=require('playwright-core')
const root=path.resolve(__dirname,'..'),port='3044',base='http://127.0.0.1:'+port,dir=path.join(root,'docs/review-workspace-validation',new Date().toISOString().replace(/[:.]/g,'-'))
const report={checks:[],errors:[],writes:[]};let server,browser,page
const pass=name=>{report.checks.push(name);console.log('PASS '+name)}
const scope=id=>page.locator(id==='page'?'[data-review-scope="page"]':'[data-review-component="'+id+'"]')
const tab=async(id,value)=>{const button=scope(id).locator('[role=tab][data-state="'+value+'"]');await button.click();await page.waitForFunction(({id,value})=>{const root=document.querySelector(id==='page'?'[data-review-scope="page"]':'[data-review-component="'+id+'"]');return root&&root.querySelector('[role=tab][data-state="'+value+'"][aria-selected="true"]')},{id,value})}
const shot=name=>page.screenshot({path:path.join(dir,name+'.png'),fullPage:true})
async function open(screen,query={}){await page.goto(base+'/#/app/'+screen+'?'+new URLSearchParams({review:'1',...query}));await page.locator('.phone-frame[aria-busy=false]').waitFor();await page.locator('.review-document').waitFor()}
async function navigate(label){await page.locator('.review-pages').getByRole('button',{name:label,exact:true}).click();await page.locator('.phone-frame[aria-busy=false]').waitFor()}
async function vm(){await page.waitForFunction(()=>{const v=document.querySelector('.app-review')?.__vue__;return v&&v.data&&!v.loading&&v.mvpMember});return page.evaluate(()=>{const v=document.querySelector('.app-review').__vue__;return{user:v.userId,reply:v.mvpReplyState,plan:v.mvpPlanState,insight:v.mvpInsightState,page:v.reviewPageState,member:v.mvpMember.state,percent:v.mvpMember.percent,stage:v.movementView.stage}})}
;(async()=>{
  fs.mkdirSync(dir,{recursive:true})
  server=spawn(process.execPath,['server/index.cjs'],{cwd:root,windowsHide:true,env:{...process.env,API_PORT:port,DEMO_DB_PATH:path.join(root,'runtime','review-workspace-'+Date.now()+'.sqlite')},stdio:'ignore'})
  for(let i=0;i<80;i++){try{if((await fetch(base+'/api/health')).ok)break}catch(_){}await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(10000)
  page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/')&&r.method()!=='GET')report.writes.push({method:r.method(),url:r.url()})})
  await open('profile')
  assert.equal(await page.locator('#scenario-user,#membership-preview-state,.membership-review-controls').count(),0)
  const left=await page.locator('.review-module-nav').boundingBox(),middle=await page.locator('.phone-stage').boundingBox(),right=await page.locator('.review-document').boundingBox()
  assert.ok(left.x+left.width<=middle.x+1&&middle.x+middle.width<=right.x+1)
  assert.equal(await page.locator('.review-pages [aria-current=page]').count(),1);await shot('01-three-columns')
  pass('Module navigation, interactive prototype and documentation occupy three columns without identity selectors')
  await tab('page','active');await page.locator('.profile-membership[data-membership-state=active]').waitFor();await tab('quota','low');await page.locator('.profile-membership[data-allowance-state=low]').waitFor()
  assert.match(await scope('quota').innerText(),/10%/);await tab('quota','campaign');await page.getByLabel('Unlimited conversations',{exact:true}).waitFor()
  await tab('page','expired');assert.equal((await vm()).member,'expired');assert.equal(await page.getByLabel('Unlimited conversations',{exact:true}).count(),1)
  await tab('quota','available');assert.equal((await vm()).percent,65);assert.equal((await vm()).user,'DEMO-2002');await shot('02-component-state')
  pass('Page membership and component quota tabs update both preview and description independently without changing users')
  await navigate('课程详情');await tab('content','content-premium');await tab('access','locked');await tab('purchase','failure')
  await page.getByRole('dialog',{name:'Purchase not completed',exact:true}).waitFor();assert.match(await scope('purchase').innerText(),/付款失败/)
  await tab('purchase','closed');await page.getByRole('dialog').waitFor({state:'hidden'});await tab('purchase','offer');await page.getByRole('dialog').getByRole('button',{name:/^(Continue with Premium|Start \d+-day free trial)$/}).click();await scope('purchase').locator('[data-state=processing][aria-selected=true]').waitFor();await page.getByRole('dialog',{name:'You’re ready to continue',exact:true}).waitFor();await scope('purchase').locator('[data-state=success][aria-selected=true]').waitFor();await tab('purchase','closed');await tab('page','loading');await page.getByLabel('Loading page',{exact:true}).waitFor()
  assert.equal(await scope('content').locator('[role=tab]:disabled').count(),2)
  assert.equal(await scope('page').locator('[data-state=error]').count(),0);await tab('page','default');await page.locator('.v3-course').waitFor();await shot('03-course-states')
  pass('Page loading replaces the page, disable component controls and restore the content; purchase states display the matching sheet')
  await navigate('训练 Program');await tab('workouts','empty');await page.locator('.v3-program__identity').waitFor();await page.getByText('No workouts available',{exact:true}).waitFor();assert.equal(await page.locator('.mvp-page-feedback').count(),0)
  pass('An empty Program workout list remains a component state inside the full detail page')
  await navigate('每周报告');await tab('insight','insight-loading');await page.getByText('Looking at your week…',{exact:true}).waitFor();assert.equal(await scope('insight').locator('[data-state=insight-error]').count(),0)
  await tab('insight','saved-insight');await page.getByText('Saved AI insight',{exact:true}).waitFor();await tab('page','empty');await page.getByText('Your next weekly report',{exact:true}).waitFor();await tab('page','default');await page.getByText('Saved AI insight',{exact:true}).waitFor()
  await tab('page','loading');await tab('page','default');await page.getByText('Saved AI insight',{exact:true}).waitFor();assert.equal((await vm()).insight,'saved-insight')
  pass('Weekly page and insight states are independent, including saved content after recovering from an empty page')
  await navigate('AI Coach');await tab('plan','plan-preview');await tab('reply','thinking');await page.locator('.mvp-dynamic-preview').waitFor();await page.locator('.mvp-coach-thinking').waitFor()
  assert.equal(await scope('reply').locator('[data-state=chat-error]').count(),0);assert.equal((await vm()).plan,'plan-preview');assert.equal(await page.locator('.mvp-dynamic-preview').count(),1)
  await tab('quota','campaign');await page.reload();await page.locator('.phone-frame[aria-busy=false]').waitFor();assert.deepEqual([(await vm()).reply,(await vm()).plan],['thinking','plan-preview']);await shot('04-independent-chat-components')
  pass('Chat reply, plan card and allowance states coexist and survive reload')
  await navigate('课程详情');await tab('page','loading');const stored=page.url();await navigate('个人中心');await page.goBack();await page.locator('.review-document').waitFor();assert.equal(page.url(),stored);await page.getByLabel('Loading page',{exact:true}).waitFor()
  pass('Browser back restores the page state, preview and matching documentation')
  await navigate('运动结果');await tab('rpe','reported');await tab('insight','ready');await page.locator('.app-review').evaluate(e=>e.__vue__.handleAction('generate-insight'));await scope('insight').locator('[data-state=saved-insight][aria-selected=true]').waitFor();await page.locator('.app-review').evaluate(e=>e.__vue__.handleAction('generate-insight'));await tab('insight','ready');await page.waitForTimeout(1100);assert.equal((await vm()).insight,'ready')
  pass('Changing a component state cancels an earlier generation timer so stale completion cannot overwrite the selected tab')
  await navigate('动作训练过程');await tab('page','setup');await page.locator('.movement-experience--setup').waitFor();await page.locator('.movement-framing-box').waitFor();await page.waitForTimeout(3300);assert.equal((await vm()).stage,'setup')
  await tab('page','training');await page.locator('.movement-experience--training').waitFor();assert.ok(await page.evaluate(()=>{const v=document.querySelector('.movement-experience').__vue__;return v.session.results.length===v.session.index&&v.session.results.every((result,i)=>result.exerciseId===v.training.steps[i].exerciseId)}));await tab('windows','trainer');assert.equal(await page.getByRole('button',{name:'Make camera full screen',exact:true}).count(),1)
  await tab('panel','collapsed');await page.getByRole('button',{name:'Expand workout panel',exact:true}).waitFor();await page.getByRole('button',{name:'Expand workout panel',exact:true}).click();await scope('panel').locator('[data-state=expanded][aria-selected=true]').waitFor();assert.ok(page.url().includes('reviewPanel=expanded'))
  await page.getByRole('button',{name:'运行此流程',exact:true}).click();await page.getByRole('button',{name:'模拟识别 +1 次',exact:true}).click();const before=await page.evaluate(()=>{const v=document.querySelector('.movement-experience').__vue__;return {index:v.session.index,reps:v.session.reps}});await tab('windows','camera');await tab('panel','collapsed');assert.deepEqual(await page.evaluate(()=>{const v=document.querySelector('.movement-experience').__vue__;return {index:v.session.index,reps:v.session.reps}}),before);assert.equal(await page.evaluate(()=>document.querySelector('.app-review').__vue__.movementReview.pinned),false)
  await tab('page','rest');await page.locator('.movement-experience--rest').waitFor();await tab('page','summary');await page.locator('.movement-experience--summary').waitFor();await shot('05-movement-states')
  pass('Movement stage tabs preview framing, training, rest and summary; window and panel controls stay synchronized in both directions')
  await page.getByRole('button',{name:'打开纯页面预览 ↗',exact:true}).click();await page.locator('.movement-experience--prepare').waitFor();await page.getByRole('button',{name:'Start follow along',exact:true}).click();await page.locator('.movement-experience--training').waitFor({timeout:6000});await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>document.querySelector('.movement-experience').__vue__.session.seconds>0));pass('Pure movement preview starts a clean interactive session instead of carrying a fixed camera snapshot')
  for(const size of [{width:1280,height:720},{width:1024,height:768},{width:390,height:844}]){
    await page.setViewportSize(size);await open('profile');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    if(size.width>760){const rect=await page.locator('.phone-frame').boundingBox();assert.ok(rect.y>=0&&rect.y+rect.height<=size.height+1)}
    else{assert.ok((await page.locator('.review-document').boundingBox()).y>(await page.locator('.phone-stage').boundingBox()).y);await tab('page','active');await page.locator('.profile-membership[data-membership-state=active]').waitFor()}
    await shot('06-responsive-'+size.width)
  }
  pass('Desktop columns and mobile stacked navigation, prototype and document remain usable without horizontal overflow')
  await page.setViewportSize({width:1360,height:1000});await open('membership');const selected=scope('page').locator('[data-state=free]');await selected.focus();await selected.press('ArrowRight');await scope('page').locator('[data-state=active][aria-selected=true]').waitFor()
  await page.getByRole('button',{name:'打开纯页面预览 ↗',exact:true}).click();await page.locator('.customer-mode').waitFor();assert.equal(await page.locator('.review-module-nav,.review-document').count(),0)
  pass('Tabs support keyboard navigation and pure preview hides the entire review workspace')
  assert.deepEqual(report.writes,[]);assert.deepEqual(report.errors,[]);pass('State review creates no API writes and no browser exceptions');report.status='passed'
})().catch(async e=>{report.status='failed';report.error=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(dir,'failure.png'),fullPage:true}).catch(()=>{})}).finally(async()=>{if(browser)await browser.close();if(server)server.kill();fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence:dir,error:report.error}))})
