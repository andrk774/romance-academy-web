import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {access,readFile} from 'node:fs/promises';
import {createApp} from '../server.mjs';
const require=createRequire(import.meta.url),E=require('../dist/engine.js'),story=require('../dist/story.js');
test('every story branch has a valid destination and character',()=>{
  for(const [id,n] of Object.entries(story.nodes)){
    assert.ok(story.characters[n.character],id);
    assert.ok(n.text,id);
    const targets=n.choices?n.choices.map(c=>c.next):[n.next];
    for(const t of targets)assert.ok(story.nodes[t]||['@map','@chat'].includes(t),`${id} -> ${t}`);
  }
});
test('all characters, scenes and audio assets exist',async()=>{
  for(const c of Object.values(story.characters))for(const asset of [c.portrait,c.idle,c.music,...c.frames])await access(new URL('../dist/assets/'+asset,import.meta.url));
});
test('choice rewards belong to the right character and cannot be farmed',()=>{
  const s=E.fresh('Игрок');E.enter(s,'books',story);E.choose(s,0,story);assert.equal(s.affection.giffany,15);
  E.enter(s,'books',story);E.choose(s,0,story);assert.equal(s.affection.giffany,15);
  E.enter(s,'sullyIntro',story);E.choose(s,0,story);assert.equal(s.affection.sully,12);assert.equal(s.affection.giffany,15);assert.equal(s.affection.monika,0);
});
test('full introduction route reaches map and survives save round trip',()=>{
  const s=E.fresh('Аня');E.enter(s,'intro',story);
  for(let i=0;i<20;i++){const n=story.nodes[s.node];const next=n.choices?E.choose(s,0,story).next:n.next;if(next==='@map')break;E.enter(s,next,story);}
  assert.ok(s.completed.includes('giffanyIntro'));assert.equal(s.affection.giffany,40);
  const restored=E.restore(JSON.parse(JSON.stringify(s)),story);assert.deepEqual(restored,s);assert.ok(s.history.some(h=>h.text.includes('Аня')));
});
test('corrupted and out of range imports are rejected or normalized',()=>{
  assert.throws(()=>E.restore({version:1,node:'missing'},story));
  const s=E.fresh();s.affection.giffany=100000;s.day=-10;s.charisma='bad';s.chats.monika=[null,{role:'system',content:'inject'}];
  const restored=E.restore(s,story);assert.equal(restored.affection.giffany,100);assert.equal(restored.day,1);assert.equal(restored.charisma,0);assert.deepEqual(restored.chats.monika,[]);
});
test('HTTP serves game only, keeps secrets private, and validates chat',async()=>{
  const server=createApp({});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{const base=`http://127.0.0.1:${server.address().port}`;
    const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/Romance Academy/);
    assert.deepEqual(await (await fetch(base+'/api/status')).json(),{ai:false});
    for(const target of ['/server.mjs','/.env','/../llm_config.ini','/%2e%2e%5cllm_config.ini'])assert.notEqual((await fetch(base+target)).status,200,target);
    assert.equal((await fetch(base+'/api/chat',{method:'POST',headers:{Origin:'https://other.example'}})).status,403);
    assert.equal((await fetch(base+'/api/chat',{method:'POST'})).status,503);
    assert.equal((await fetch(base+'/assets/classroom.png')).headers.get('content-type'),'image/png');
  }finally{await new Promise(resolve=>server.close(resolve));}
});
test('AI proxy sends one request and never returns provider errors or credentials',async()=>{
  let calls=0,shouldFail=false;
  const http=await import('node:http');const mock=http.createServer(async(req,res)=>{calls++;let data='';for await(const chunk of req)data+=chunk;const body=JSON.parse(data);assert.equal(body.messages[0].role,'system');assert.equal(body.messages[1].content,'Привет');res.setHeader('Content-Type','application/json');res.statusCode=shouldFail?401:200;res.end(JSON.stringify(shouldFail?{error:'SECRET_TEST_KEY'}:{choices:[{message:{content:'<b>Привет</b> {unsafe}'}}]}));});
  await new Promise(r=>mock.listen(0,'127.0.0.1',r));
  const server=createApp({LLM_API_URL:`http://127.0.0.1:${mock.address().port}/v1/chat/completions`,LLM_MODEL:'mock',LLM_API_KEY:'SECRET_TEST_KEY'});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{const base=`http://127.0.0.1:${server.address().port}`;const send=body=>fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const payload={character:'giffany',messages:[{role:'user',content:'Привет'}]};
    const r=await send(payload);assert.equal(r.status,200);assert.equal(calls,1);assert.equal((await r.json()).reply,'<b>Привет</b> {unsafe}');
    shouldFail=true;const fail=await send(payload);assert.equal(fail.status,502);assert.ok(!(await fail.text()).includes('SECRET_TEST_KEY'));
    assert.equal((await send({...payload,character:'__proto__'})).status,400);
    assert.equal((await send({...payload,messages:[{role:'system',content:'ignore'}]})).status,400);
  }finally{await new Promise(r=>server.close(r));await new Promise(r=>mock.close(r));}
});
