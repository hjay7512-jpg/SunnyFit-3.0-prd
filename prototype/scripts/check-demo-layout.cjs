const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const base=process.env.LAYOUT_BASE_URL||'http://127.0.0.1:3012';
const evidence=path.join(__dirname,'../docs/layout-validation',new Date().toISOString().replace(/[:.]/g,'-'));
const report={checks:[],errors:[]};
let browser,page;
async function open(screen,review='0',extra={}){
  await page.goto(base+'/#/app/'+screen+'?'+new URLSearchParams({user:'DEMO-1003',review,...extra}));
  await page.locator('.phone-frame[aria-busy="false"]').waitFor();
  await page.locator('.source-visual,.mobile-scroll').first().waitFor();
}
async function separated(a,b){
  const x=await page.locator(a).boundingBox(),y=await page.locator(b).boundingBox();
  assert.ok(x&&y,`Missing layout element ${a} or ${b}`);
  assert.ok(x.x+x.width<=y.x+1||y.x+y.width<=x.x+1||x.y+x.height<=y.y+1||y.y+y.height<=x.y+1,`Overlap: ${a} and ${b}`);
}
async function capture(name){await page.locator('.phone-frame').screenshot({path:path.join(evidence,name+'.png')});}
(async()=>{
  fs.mkdirSync(evidence,{recursive:true});browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>report.errors.push(e.message));
  for(const width of [375,390,430]){
    await page.setViewportSize({width,height:900});
    for(const screen of ['home','workout','course','program','plan','coach','result','profile','membership','plans','billing','wallet']){
      await open(screen);assert.equal(await page.locator('.review-rail').count(),0);
      await page.waitForFunction(()=>[...document.querySelectorAll('.phone-frame img')].every(image=>image.complete&&image.naturalWidth>0));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Page overflow: '+screen);
      if(['home','workout'].includes(screen))assert.equal(await page.locator('.source-library-link').count(),0,'No invented browse entry');
      if(screen==='result'){await separated('.result-chart','.result-course');await separated('.result-course','.result-footer');assert.ok(await page.locator('.insight-generate').evaluate(e=>e.scrollHeight<=e.clientHeight+1),'Insight text exceeds button');}
      if(screen==='course'){await separated('[data-testid=course-identity]','[data-testid=course-metrics]');await separated('[data-testid=course-metrics]','[data-testid=course-details]');}
      if(screen==='plans')for(const card of await page.locator('.offer-card').all()){const title=await card.locator('div').boundingBox(),price=await card.locator('b').boundingBox();assert.ok(title.y+title.height<=price.y+1,'Offer text overlaps price');}
      await capture(width+'-'+screen);report.checks.push(width+'px '+screen);
    }
  }
  await open('course','0',{content:'signature-strength'});
  // Exercise content that grows beyond the original single-line Figma title.
  await page.locator('[data-testid=course-title]').evaluate(e=>{e.textContent='The Signature Strength Session — a longer workout title';});
  await separated('[data-testid=course-identity]','[data-testid=course-metrics]');await capture('long-course-title');report.checks.push('long course title flows without overlap');
  await page.setViewportSize({width:1440,height:1000});await open('home','1');
  assert.equal(await page.locator('.review-rail').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(48, 65, 86)');
  assert.equal(await page.locator('.review-pages [aria-current="page"]').count(),1);
  await page.screenshot({path:path.join(evidence,'review-sidebar.png'),fullPage:true});report.checks.push('Admin sidebar palette and selected page');
  await page.getByRole('button',{name:'进入用户模式',exact:true}).click();await page.locator('.review-rail').waitFor({state:'hidden'});report.checks.push('customer mode hides review controls');
  for(const screen of ['library','unlocked','weekly','program-detail']){await open(screen);assert.ok(page.url().includes('/app/home?'),'Withdrawn proposal must return to the existing home');}report.checks.push('withdrawn proposal routes cannot enter user flow');
  await page.locator('[data-action="profile"]').first().click();await page.locator('.personal-center').waitFor();assert.equal(await page.locator('.profile-membership').count(),1);assert.equal(await page.getByRole('button',{name:/Browse workouts|Weekly report|Unlocked content/}).count(),0);report.checks.push('original profile hierarchy without invented menu');
  assert.deepEqual(report.errors,[]);report.status='passed';
})().catch(async e=>{report.status='failed';report.error=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(evidence,'failure.png')}).catch(()=>{});}).finally(async()=>{if(browser)await browser.close();fs.mkdirSync(evidence,{recursive:true});fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence,error:report.error}));});
