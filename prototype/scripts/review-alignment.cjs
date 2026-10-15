// Review evidence only: live browser reads and isolated in-memory domain scenarios.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
const {createStore}=require('../server/store.cjs');
const {randomUUID}=require('node:crypto');
const evidence=path.join(__dirname,'../docs/alignment-review',new Date().toISOString().replace(/[:.]/g,'-'));
const report={scope:'Review evidence; no live purchases or published configuration changes',findings:[]};
let browser;
(async()=>{
  fs.mkdirSync(evidence,{recursive:true});
  const store=createStore(':memory:',()=> '2026-10-12T00:00:00.000Z');
  try{
    const c=store.commerce;
    const product=c.configDetail('products','credits_starter');
    const changed=structuredClone(product.published);changed.credits.validityDays=30;
    const draft=c.configSave('products',product.id,changed,product.revision);c.configPublish('products',product.id,draft.revision);
    const quote=c.quotePurchase({userId:'DEMO-1001',productId:product.id,skuId:'credits_starter_web'});
    const order=c.purchase({userId:'DEMO-1001',quoteId:quote.id,requestKey:randomUUID()});
    report.findings.push({id:'new-purchased-credits-can-expire',verified:!!order.batch.expiresAt,expiresAt:order.batch.expiresAt});
    const suit=store.detail('premium'),config=structuredClone(suit.published);
    config.items=config.items.filter(item=>item.code!=='workout_result_ai_insight');
    const saved=store.save('premium',config,suit.revision);store.publish('premium',saved.revision);
    const membership=c.quotePurchase({userId:'DEMO-1001',productId:'premium_monthly',skuId:'premium_monthly_web'});c.purchase({userId:'DEMO-1001',quoteId:membership.id,requestKey:randomUUID()});
    const detail=c.userDetail('DEMO-1001');
    report.findings.push({id:'included-service-can-lack-access',advertised:detail.wallet.includedUsage.find(r=>r.serviceId==='deep_analysis'),decision:c.access({userId:'DEMO-1001',serviceId:'deep_analysis'})});
  }finally{store.close()}
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:390,height:844}});
  async function open(screen,user='DEMO-1003',extra={}){await page.goto('http://127.0.0.1:3012/#/app/'+screen+'?'+new URLSearchParams({user,review:'0',...extra}));await page.locator('.phone-frame[aria-busy="false"]').waitFor();}
  await open('home');const cardTitle=await page.locator('[data-node-id="151:7710"]').count()?await page.locator('[data-node-id="151:7710"]').innerText():await page.locator('.source-visual').innerText();
  await page.locator('[data-action="start-course"]').first().click();await page.locator('.mobile-sheet').waitFor();report.findings.push({id:'home-content-binding',visibleHome:cardTitle,startConfirmation:await page.locator('.mobile-sheet').innerText()});await page.locator('.phone-frame').screenshot({path:path.join(evidence,'home-start-object.png')});
  await open('coach');await page.getByLabel('Message AI',{exact:true}).fill('Review context without sending');await page.locator('.coach-credit-hint').click();await page.locator('.mobile-scroll').waitFor();const walletUrl=page.url();await page.getByRole('button',{name:'Back',exact:true}).click();report.findings.push({id:'coach-usage-back-target',walletUrl,backUrl:page.url()});
  await open('home');await page.locator('[data-action="profile"]').first().click();report.findings.push({id:'existing-profile-entry-disconnected',urlAfterClick:page.url(),accountPageVisible:await page.locator('.mobile-scroll').count()});
  report.execution='completed';
})().catch(e=>{report.execution='failed';report.error=e.stack;process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();fs.mkdirSync(evidence,{recursive:true});fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({evidence,...report}));});
