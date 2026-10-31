const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
async function run(){
  const {chromium}=require(process.env.PLAYWRIGHT_PATH||path.join(process.env.APPDATA,'npm/node_modules/playwright/node_modules/playwright-core'));
  const {createApp}=await import('../server.mjs');
  const server=createApp({});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}`;
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);await page.waitForFunction(()=>!!window.RAEngine);
    const output=path.join(__dirname,'../.qa');fs.mkdirSync(output,{recursive:true});
    await page.screenshot({path:path.join(output,'desktop-menu.png'),fullPage:true});
    await page.locator('#start-button').click();await page.locator('input[autocomplete="nickname"]').fill('Тест');await page.getByText('Приятно познакомиться ↗',{exact:true}).click();
    await page.locator('#next-button').click();await page.locator('#choices button').first().click();
    assert.match(await page.locator('#dialogue-text').textContent(),/Спасибо/);
    for(let i=0;i<20;i++){
      if(await page.locator('#modal').evaluate(n=>n.open))break;
      const choices=page.locator('#choices button');if(await choices.count())await choices.first().click();else await page.locator('#next-button').click();
    }
    assert.match(await page.locator('#modal-title').textContent(),/Карта/);
    let save=await page.evaluate(()=>JSON.parse(localStorage.getItem('ra7.web.save.v1')));
    assert.equal(save.affection.giffany,40);assert.ok(save.completed.includes('giffanyIntro'));
    await page.getByText('Спортивный зал',{exact:true}).click();await page.locator('#choices button').first().click();
    await page.screenshot({path:path.join(output,'desktop-story.png'),fullPage:true});
    save=await page.evaluate(()=>JSON.parse(localStorage.getItem('ra7.web.save.v1')));assert.equal(save.affection.sully,12);
    await page.reload();await page.locator('#continue-button').click();assert.match(await page.locator('#speaker').textContent(),/SULLY/);
    await page.locator('#chat-button').click();await page.locator('.chat-input').fill('<img src=x onerror=alert(1)>');await page.locator('.chat-form button').click();
    await page.waitForFunction(()=>document.querySelectorAll('.bubble').length===2);
    assert.equal(await page.locator('.chat-log img').count(),0);
    await page.locator('#close-modal').click();await page.locator('#settings-button').click();
    const downloadPromise=page.waitForEvent('download');await page.getByText('Экспорт сохранения',{exact:true}).click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'romance-academy-save.json');
    await page.locator('#close-modal').click();
    await page.setViewportSize({width:390,height:844});await page.locator('#home-button').click();
    await page.screenshot({path:path.join(output,'mobile-menu.png'),fullPage:true});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.locator('#continue-button').click();await page.screenshot({path:path.join(output,'mobile-story.png'),fullPage:true});
    await page.locator('#map-button').click();await page.getByText('Литературный клуб',{exact:true}).click();
    await page.locator('#next-button').click();await page.locator('#choices button').nth(1).click();
    assert.ok((await page.locator('#dialogue-text').textContent()).includes('Первый текст'));
    assert.deepEqual(errors,[]);
    const broken=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));assert.deepEqual(broken,[]);
    console.log('Browser QA passed: story, choices, save/reload, map, offline chat, safe text, export, mobile layout.');
  }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
}
module.exports=run;
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
