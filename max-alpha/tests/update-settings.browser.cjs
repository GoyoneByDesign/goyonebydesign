// Isolated developer UI test. Uses no personal browser profile or live provider.
// Supply existing Playwright and browser executable paths; no dependency download.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.MAX_ALPHA_PLAYWRIGHT_PATH||'playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,chromiumSandbox:true,executablePath:process.env.MAX_ALPHA_BROWSER_EXECUTABLE});
  const results=[];
  try{
    for(const width of [1365,393]){
      const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
      const external=[];
      await context.route('**/*',route=>{
        const url=new URL(route.request().url());
        if(url.origin==='http://127.0.0.1:8791')return route.continue();
        external.push(url.origin);return route.abort();
      });
      try{
        const page=await context.newPage();
        await page.goto('http://127.0.0.1:8791/max-alpha/');
        await page.locator('body[data-maxg-ready="true"]').waitFor({state:'attached'});
        await page.locator('#quickCheckUpdatesBtn').click();
        const choice=page.getByRole('checkbox',{name:'Check for updates automatically when online'});
        await choice.waitFor();assert.equal(await choice.isChecked(),false);
        await choice.check();await page.waitForFunction(()=>!document.querySelector('.update-opt-in input').disabled);
        assert.equal(await choice.isChecked(),true);
        await page.reload();await page.locator('body[data-maxg-ready="true"]').waitFor({state:'attached'});
        await page.locator('#quickCheckUpdatesBtn').click();assert.equal(await choice.isChecked(),true);
        await choice.uncheck();await page.waitForFunction(()=>!document.querySelector('.update-opt-in input').disabled);
        await page.reload();await page.locator('body[data-maxg-ready="true"]').waitFor({state:'attached'});
        await page.locator('#quickCheckUpdatesBtn').click();assert.equal(await choice.isChecked(),false);
        assert.match(await page.locator('.update-settings').innerText(),/signed automatic installation channel is not configured/);
        const box=await page.locator('.update-opt-in').boundingBox();assert.ok(box.height>=44);assert.ok(box.x>=0&&box.x+box.width<=width+1);
        await page.locator('#closeSettingsBtn').click();
        await page.locator('#messageInput').fill('sk-placeholder-only');await page.locator('#sendBtn').click();
        assert.match(await page.locator('#toast').innerText(),/Provider keys cannot be sent/);
        assert.equal(await page.locator('#messageInput').inputValue(),'sk-placeholder-only');
        await page.locator('#messageInput').fill('Synthetic unsent draft');
        await context.setOffline(true);await page.locator('#quickCheckUpdatesBtn').click();
        assert.match(await page.locator('#toast').innerText(),/Reconnect to the internet/);
        assert.equal(await page.locator('#messageInput').inputValue(),'Synthetic unsent draft');
        results.push({width,defaultOff:true,persistedEnableDisable:true,trustDisclosure:true,touchTarget:true,
          pastedKeyRejectedBeforeRequest:true,unsentDraftPreserved:true,offlineFailureHonest:true,externalRequestsBlocked:external.length,
          serviceWorkerLifecycle:'blocked for isolated UI test; covered separately by manager tests'});
      }finally{await context.close();}
    }
  }finally{await browser.close();}
  console.log(JSON.stringify({passed:true,results},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
