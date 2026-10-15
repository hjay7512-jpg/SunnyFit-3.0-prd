const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..'),base=process.env.HOME_UI_BASE_URL||'http://127.0.0.1:3012';
const dir=path.join(root,'docs/home-ui-validation',new Date().toISOString().replace(/[:.]/g,'-'));
const report={checks:[],errors:[],geometry:[]};let browser,page;
async function ready(screen){await page.goto(base+'/?motion=full#/app/'+screen+'?user=DEMO-1003&review=0');await page.locator('.phone-frame[aria-busy=false]').waitFor();}
const pass=name=>{report.checks.push(name);console.log('PASS '+name)};
(async()=>{
  fs.mkdirSync(dir,{recursive:true});browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:390,height:900}});page.on('pageerror',e=>report.errors.push(e.message));
  for(const width of [375,390,430]){
    await page.setViewportSize({width,height:900});
    for(const screen of ['membership','plans','billing','wallet']){
      await ready(screen);const header=page.locator('.mobile-header.sf-header');
      const style=await header.evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,border:s.borderTopWidth,radius:s.borderRadius,shadow:s.boxShadow,blur:s.backdropFilter,display:s.display}});
      assert.deepEqual(style,{background:'rgba(0, 0, 0, 0)',border:'0px',radius:'0px',shadow:'none',blur:'none',display:'grid'});
      const box=await header.boundingBox(),title=await header.locator('h1').boundingBox(),back=await header.getByRole('button',{name:'Back',exact:true}).boundingBox(),body=await page.locator('.mobile-scroll').boundingBox();
      assert.ok(Math.abs(title.x+title.width/2-(box.x+box.width/2))<1,'Page title must stay centered');assert.ok(back.width>=44&&back.height>=44);assert.ok(box.y+box.height<=body.y+1,'Header must not overlap body');
      report.geometry.push({width,screen,style,box,title,back});await page.locator('.phone-frame').screenshot({path:path.join(dir,width+'-'+screen+'.png')});
      if(screen==='membership'){
        await header.locator('h1').evaluate(e=>e.style.fontSize='26px');const largeHeader=await header.boundingBox(),largeBody=await page.locator('.mobile-scroll').boundingBox();assert.ok(largeHeader.y+largeHeader.height<=largeBody.y+1,'Large navigation title must move content down');
      }
    }
    pass(width+' px account headers have individual controls, centered titles and clear content');
    await ready('home');await page.waitForFunction(()=>[...document.querySelectorAll('.v3-home img')].every(i=>i.complete&&i.naturalWidth>0));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.locator('.v3-home__navigation nav button').count(),4);assert.equal(await page.locator('.v3-home__coach .sf-ai-ball').count(),1);
    const coach=page.locator('.v3-home__coach'),coachBox=await coach.boundingBox();assert.equal(coachBox.width,56);assert.equal(coachBox.height,56);
    await page.locator('.phone-frame').screenshot({path:path.join(dir,width+'-home.png')});
    await page.locator('.v3-home__scroll').evaluate(e=>e.scrollTop=e.scrollHeight);assert.deepEqual(await coach.boundingBox(),coachBox,'AI entrance must remain fixed during scrolling');assert.ok(await page.getByRole('button',{name:'Browse Courses',exact:true}).isVisible());
    await page.locator('.phone-frame').screenshot({path:path.join(dir,width+'-home-bottom.png')});pass(width+' px formal Home loads all assets and keeps AI/navigation outside scrolling content');
  }
  await ready('home');await page.getByRole('button',{name:'Workout',exact:true}).click();await page.waitForURL(/\/app\/workout/);await page.locator('[data-action=home]').click();await page.waitForURL(/\/app\/home/);pass('shared navigation keeps Home → Workout → Home behavior');
  await page.getByRole('button',{name:'Challenge',exact:true}).click();await page.getByRole('status').filter({hasText:"This section isn't available"}).waitFor();assert.ok(page.url().includes('/app/home'));await page.getByRole('button',{name:'Dismiss notification'}).click();pass('existing unexpanded destination gives feedback without creating a route');
  await page.locator('.v3-home__coach').focus();await page.keyboard.press('Enter');await page.getByLabel('Message AI',{exact:true}).waitFor();pass('AI entry is keyboard accessible after component migration');
  await page.setViewportSize({width:1280,height:1000});await page.goto(base+'/#/demo/lab?tab=components');await page.locator('.home-components-showcase').waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('.home-components-showcase img')].every(i=>i.complete&&i.naturalWidth>0));
  await page.locator('.home-components-showcase').screenshot({path:path.join(dir,'formal-home-and-plan-states.png')});
  const hero=page.locator('.home-components-showcase .sf-course-card__poster');assert.equal(await hero.evaluate(e=>e.offsetHeight),245);
  const formalAssets=await page.locator('.home-components-showcase img').evaluateAll(items=>items.map(i=>({src:i.getAttribute('src'),natural:[i.naturalWidth,i.naturalHeight],layout:[i.offsetWidth,i.offsetHeight],box:[i.getBoundingClientRect().width,i.getBoundingClientRect().height],transform:getComputedStyle(i).transform})));
  report.assets=formalAssets;assert.ok(formalAssets.every(i=>i.src.startsWith('/assets/figma/')&&i.natural.every(v=>v>0)));
  for(const item of formalAssets){const file=path.join(root,'public',item.src);assert.ok(fs.statSync(file).size>0);if(item.src.endsWith('.svg')){const tag=fs.readFileSync(file,'utf8').match(/<svg[^>]*>/)[0],width=Number(tag.match(/\bwidth="([\d.]+)"/)[1]),height=Number(tag.match(/\bheight="([\d.]+)"/)[1]);assert.ok(Math.abs(item.layout[0]-width)<=.51&&Math.abs(item.layout[1]-height)<=.51,'Static SVG must keep source dimensions before the original layer transform: '+item.src);}}
  for(const ring of await page.locator('.home-components-showcase__states .sf-plan-card__ring img').all()){const image=await ring.boundingBox();assert.ok(image.width<=120&&image.height<=120,'Plan ring layers must stay inside the 120px source slot');}
  pass('formal Home and plan variants retain local asset slots and intrinsic SVG geometry');
  assert.deepEqual(report.errors,[]);report.status='passed';
})().catch(async e=>{report.status='failed';report.error=e.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});}).finally(async()=>{if(browser)await browser.close();fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence:dir,error:report.error}));});
