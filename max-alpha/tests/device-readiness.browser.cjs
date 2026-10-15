// Isolated local UI check. Blocks external requests and uses a fresh profile.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.MAX_ALPHA_PLAYWRIGHT_PATH||'playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.MAX_ALPHA_BROWSER_EXECUTABLE});
  const results=[];
  try{for(const width of [1365,393]){
    const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
    await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:8791'?route.continue():route.abort());
    try{
      const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto('http://127.0.0.1:8791/max-alpha/');
      await page.locator('body[data-maxg-ready="true"]').waitFor({state:'attached'});
      if(width<700)await page.locator('#sidebarToggle').click();
      await page.locator('#settingsBtn').click();await page.locator('[data-tab="extensions"]').click();
      const panel=page.locator('.extensions-panel');
      assert.equal(await panel.locator('.ext-card').count(),6);
      assert.match(await panel.innerText(),/Mac companion required/);
      await page.getByRole('button',{name:'Check again',exact:true}).click();
      assert.equal(await panel.locator('.ext-card').count(),6);
      const box=await panel.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      assert.deepEqual(errors,[]);
      await page.screenshot({path:`device-readiness-${width}.png`,fullPage:true});
      results.push({width,cards:6,recheck:true,noOverflow:true,noPageErrors:true});
    }finally{await context.close();}
  }}finally{await browser.close();}
  console.log(JSON.stringify({passed:true,results}));
})().catch(error=>{console.error(error);process.exitCode=1;});
