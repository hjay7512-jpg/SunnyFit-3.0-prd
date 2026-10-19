const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright-core');
const base=process.env.MEMBERSHIP_BASE_URL||'http://127.0.0.1:3012',dir=path.resolve(__dirname,'../docs/membership-mvp-preview');
const report={checks:[],errors:[],writes:[],status:'running'};let browser,page;
const pass=label=>{report.checks.push(label);console.log('PASS '+label)};
async function open(screen,state='free',remaining=65,mode='standard',review='0'){
  await page.goto(base+'/#/app/'+screen+'?'+new URLSearchParams({user:'DEMO-2002',review,membershipState:state,chatRemaining:String(remaining),allowanceMode:mode}));
  await page.locator('.phone-frame[aria-busy=false]').waitFor();await page.locator(screen==='profile'?'.personal-center':'.premium-page').waitFor();
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
}
async function capture(name){await page.locator('.phone-frame').screenshot({path:path.join(dir,name+'.png')})}
async function layout(){
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Document overflow');
  assert.deepEqual(await page.locator('.phone-frame').evaluate(frame=>[...frame.querySelectorAll('.coach-allowance,.premium-current,.premium-compare,.profile-membership')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.className)),[]);
}
(async()=>{
  fs.mkdirSync(dir,{recursive:true});browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/')&&r.method()!=='GET')report.writes.push(r.method()+' '+r.url())});
  const cases=[['free',0],['free',65],['free',100],['active',0],['active',10],['active',65],['active',100],['canceled',65],['expired',0],['expired',65],['active',65,'campaign'],['active',65,'ended']];
  for(const width of [320,375,390,430]){
    await page.setViewportSize({width,height:900});
    for(const screen of ['profile','membership'])for(const [state,remaining,mode='standard'] of cases){
      await open(screen,state,remaining,mode);await layout();const root=page.locator(screen==='profile'?'.personal-center':'.premium-page');
      if(screen==='profile'){
        assert.equal(await root.locator('.profile-membership').count(),1);
        assert.equal(await root.locator('.coach-allowance').count(),0,'No separate usage entry');
        assert.match(await root.locator('.profile-membership').innerText(),/Membership & Usage/);
      }else assert.equal(await root.locator('.premium-account-overview .coach-allowance').count(),1);
      if(mode==='campaign'){
        assert.equal(await root.getByRole('progressbar').count(),0);
        assert.ok(await root.getByLabel('Unlimited conversations',{exact:true}).isVisible());
        assert.match(await root.innerText(),/Oct 23, 2026/);
      }else{
        assert.equal(await root.getByRole('progressbar').getAttribute('aria-valuenow'),String(remaining));
        assert.equal(await root.getByLabel('Unlimited conversations',{exact:true}).count(),0);
        if(mode==='ended')assert.match(await root.innerText(),/event.*ended/i);
      }
      if(state==='expired')assert.match(await root.innerText(),/Premium expired/);
      if(width===390)await capture(screen+'-'+state+'-'+remaining+(mode==='standard'?'':'-'+mode));
    }
    pass(width+'px: 24 combinations; integrated entry and finite Premium allowance');
  }
  await page.setViewportSize({width:390,height:900});await open('profile','active',65,'campaign');await page.locator('.profile-usage-summary').click();await page.locator('.premium-account-overview').waitFor();
  assert.ok(page.url().includes('allowanceMode=campaign'));assert.match(await page.locator('.premium-status-date').innerText(),/Nov 16, 2026/);
  await page.evaluate(()=>{const q=new URLSearchParams(location.hash.split('?')[1]);q.set('allowanceMode','ended');location.hash=location.hash.split('?')[0]+'?'+q});
  await page.getByRole('progressbar').waitFor();assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'65');
  assert.equal(await page.locator('.premium-page').getAttribute('data-membership-state'),'active');assert.match(await page.locator('.premium-status-date').innerText(),/Nov 16, 2026/);
  await page.getByRole('button',{name:'Back',exact:true}).click();await page.locator('.personal-center').waitFor();assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'65');
  pass('Event expiry restores quota without changing membership or its expiry; unified navigation preserves both');
  await open('membership','free',0);await page.getByRole('button',{name:'Get Premium allowance',exact:true}).click();const offers=page.getByRole('dialog',{name:'Choose your Premium plan'});await offers.waitFor();
  assert.equal(await offers.getByRole('radio').count(),2);assert.equal(await offers.getByRole('radio',{name:/Monthly/}).getAttribute('aria-checked'),'true');
  await offers.getByRole('button',{name:/^Subscribe ·/}).click();await page.getByRole('dialog',{name:'You’re ready to continue'}).waitFor();await page.getByRole('button',{name:'View membership & usage',exact:true}).click();
  assert.equal(await page.getByLabel('Unlimited conversations',{exact:true}).count(),0);assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'100');
  await page.getByRole('button',{name:'Manage subscription',exact:true}).click();await page.getByRole('button',{name:'Turn off renewal',exact:true}).click();await page.getByRole('button',{name:'Done',exact:true}).click();
  assert.ok(page.url().includes('membershipState=canceled'));assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'100');
  pass('First subscription grants a fresh finite allowance; turning off renewal preserves it');
  await open('membership','free',65);await page.getByRole('button',{name:'Explore Premium',exact:true}).click();await page.getByRole('radio',{name:/Yearly/}).click();await page.getByRole('button',{name:/^Subscribe ·/}).click();await page.getByRole('button',{name:'View membership & usage',exact:true}).click();
  assert.match(await page.locator('.premium-status-date').innerText(),/2027/);assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'100');pass('Annual subscription shares checkout and grants a fresh finite allowance');
  await page.setViewportSize({width:1440,height:1000});await open('profile','active',10,'standard','1');
  await page.getByLabel('用量／活动状态（独立于会员）').selectOption('campaign');await page.getByLabel('Unlimited conversations',{exact:true}).waitFor();
  await page.getByLabel('用量／活动状态（独立于会员）').selectOption('ended');await page.getByRole('progressbar').waitFor();assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'10');
  assert.equal(await page.locator('.profile-membership').getAttribute('data-membership-state'),'active');pass('Review controls change campaign state independently of membership');
  await page.goto(base+'/membership-review.html');await page.locator('.review-rail').waitFor();await page.locator('.personal-center').waitFor();assert.ok(page.url().includes('/app/profile?'));assert.equal(await page.locator('iframe').count(),0);
  await page.getByLabel('身份与有效状态').selectOption('active');await page.getByRole('progressbar').waitFor();assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'65');
  await page.getByLabel('用量／活动状态（独立于会员）').selectOption('campaign');await page.getByLabel('Unlimited conversations',{exact:true}).waitFor();
  await page.getByLabel('用量／活动状态（独立于会员）').selectOption('ended');await page.getByRole('progressbar').waitFor();
  await page.screenshot({path:path.join(dir,'original-app-review.png'),fullPage:true});pass('Original App sidebar organizes membership and campaign independently');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.writes,[]);pass('No browser errors or API writes');report.status='passed';
})().catch(async e=>{report.status='failed';report.error=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{})}).finally(async()=>{if(browser)await browser.close();fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence:dir,error:report.error}))});
