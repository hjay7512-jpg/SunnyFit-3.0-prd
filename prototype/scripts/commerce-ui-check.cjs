const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..'),base=process.env.COMMERCE_UI_BASE_URL||'http://127.0.0.1:3012',dir=path.join(root,'docs/commerce-ui-validation',new Date().toISOString().replace(/[:.]/g,'-')),report={checks:[],errors:[]};let browser,page;
const pass=name=>{report.checks.push(name);console.log('PASS '+name)};
async function open(screen,user='DEMO-1003'){await page.goto(base+'/#/app/'+screen+'?'+new URLSearchParams({user,review:'0'}));await page.locator('.phone-frame[aria-busy=false]').waitFor();await page.locator('.consumer-pages').waitFor()}
(async()=>{
  fs.mkdirSync(dir,{recursive:true});browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:375,height:900}});page.on('pageerror',e=>report.errors.push(e.message));
  for(const width of [375,390,430]){
    await page.setViewportSize({width,height:900});for(const screen of ['plans','billing','wallet']){
      await open(screen);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.locator('.mobile-header.sf-header').evaluate(e=>getComputedStyle(e).borderRadius),'0px');
      assert.equal(await page.locator('.consumer-pages .mobile-primary,.consumer-pages .mobile-secondary').count(),0);
      for(const button of await page.locator('.consumer-pages .sf-button').all()){const size=await button.boundingBox();assert.ok(size.height>=48&&size.width>=44)}
      for(const card of await page.locator('.consumer-card').all()){assert.ok(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert.equal(await card.evaluate(e=>e.classList.contains('sf-card')),true)}
      if(screen==='plans')for(const offer of await page.locator('.offer-card').all()){const info=await offer.locator('.consumer-offer__info').boundingBox(),price=await offer.locator('b').boundingBox();assert.ok(info.y+info.height<=price.y+1)}
      await page.locator('.phone-frame').screenshot({path:path.join(dir,width+'-'+screen+'.png')});pass(width+'px '+screen+' uses shared controls with readable prices and no overflow');
    }
  }
  await open('wallet');const toggle=page.getByRole('button',{name:'Balance details',exact:true});assert.equal(await toggle.getAttribute('aria-expanded'),'false');await toggle.focus();await page.keyboard.press('Enter');assert.equal(await page.getByRole('button',{name:'Hide details',exact:true}).getAttribute('aria-expanded'),'true');await page.locator('#credit-balance-details.sf-card').waitFor();await page.getByRole('button',{name:'Hide details',exact:true}).click();assert.equal(await page.locator('#credit-balance-details').count(),0);pass('balance details keyboard toggle exposes accurate expanded state');
  const users=await(await fetch(base+'/api/commercialization/users')).json();const list=Array.isArray(users.data)?users.data:users.data.items||[];let emptyUser;
  for(const user of list){const r=await(await fetch(base+'/api/commercialization/storefront/'+user.id)).json();if(r.data&&!r.data.orders.length){emptyUser=user.id;break}}
  assert.ok(emptyUser,'Seed accounts include empty purchase history');await open('billing',emptyUser);await page.getByRole('heading',{name:'No purchases yet.'}).waitFor();assert.equal(await page.locator('.consumer-pages .sf-feedback').count(),1);await page.locator('.phone-frame').screenshot({path:path.join(dir,'billing-empty.png')});pass('empty purchase history uses shared feedback and live account data');
  assert.deepEqual(report.errors,[]);report.status='passed';
})().catch(async e=>{report.status='failed';report.error=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{})}).finally(async()=>{if(browser)await browser.close();fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence:dir,error:report.error}))});
