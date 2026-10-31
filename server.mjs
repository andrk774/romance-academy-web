import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.mp3':'audio/mpeg','.wav':'audio/wav','.json':'application/json; charset=utf-8'};
const personalities = {
  giffany:'Ты Giffany, дружелюбная и немного загадочная студентка Romantsu Maho Academy. Приехала из Орегона, любишь музыку и театр. Ты персонаж игры Romance Academy 7. Общайся тепло и уважай свободу игрока.',
  sully:'Ты Sully, энергичная и прямолинейная студентка Romantsu Maho Academy. Любишь баскетбол, честность и поддерживаешь друзей. Ты персонаж игры Romance Academy 7.',
  monika:'Ты Monika, вдумчивая участница литературного клуба Romantsu Maho Academy. Любишь стихи и искренние разговоры. Ты персонаж игры Romance Academy 7.'
};
function json(res,code,value){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
export function createApp(env = process.env) {
  const requests = new Map();
  const enabled = Boolean(env.LLM_API_URL && env.LLM_MODEL);
  return http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','same-origin');
    const url = new URL(req.url,'http://localhost');
    if(url.pathname === '/api/status'){json(res,200,{ai:enabled});return;}
    if(url.pathname === '/api/chat'){
      if(req.method!=='POST'){json(res,405,{error:'Method not allowed'});return;}
      if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host){json(res,403,{error:'Invalid origin'});return;}}catch{json(res,403,{error:'Invalid origin'});return;}}
      if(!enabled){json(res,503,{error:'AI is not configured'});return;}
      if(!(req.headers['content-type']||'').startsWith('application/json')){json(res,415,{error:'JSON required'});return;}
      const now=Date.now(),ip=req.socket.remoteAddress;
      for(const [key,entry] of requests)if(now-entry.time>60000)requests.delete(key);
      const rate=requests.get(ip)||{time:now,count:0};if(rate.count>=15){json(res,429,{error:'Too many messages'});return;}rate.count++;requests.set(ip,rate);
      try{
        let buffer='';for await(const chunk of req){buffer+=chunk.toString('utf8');if(Buffer.byteLength(buffer)>24000){json(res,413,{error:'Request too large'});return;}}
        const data=JSON.parse(buffer);
        if(!Object.hasOwn(personalities,data.character)||!Array.isArray(data.messages)||!data.messages.length||data.messages.length>12||data.messages.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>2000)||data.messages.at(-1).role!=='user'){json(res,400,{error:'Invalid message'});return;}
        const endpoint=new URL(env.LLM_API_URL);
        if(endpoint.protocol!=='https:'&&!(endpoint.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(endpoint.hostname))){json(res,500,{error:'Server endpoint must use HTTPS'});return;}
        const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(env.LLM_API_KEY?{Authorization:`Bearer ${env.LLM_API_KEY}`}:{})},body:JSON.stringify({model:env.LLM_MODEL,messages:[{role:'system',content:personalities[data.character]+' Отвечай по-русски, коротко (до 100 слов), обычным текстом без команд, HTML и тегов. Не утверждай, что можешь управлять компьютером или читать файлы игрока.'},...data.messages.map(m=>({role:m.role,content:m.content}))],stream:false,max_tokens:300}),signal:AbortSignal.timeout(30000)});
        if(!response.ok){json(res,502,{error:'Model service unavailable'});return;}
        const result=await response.json(),reply=result.choices?.[0]?.message?.content;
        if(typeof reply!=='string'||!reply.trim()){json(res,502,{error:'Empty model response'});return;}
        json(res,200,{reply:reply.slice(0,2000)});
      }catch(error){json(res,error instanceof SyntaxError?400:502,{error:error instanceof SyntaxError?'Invalid JSON':'Could not get a model response'});}return;
    }
    if(!['GET','HEAD'].includes(req.method)){json(res,405,{error:'Method not allowed'});return;}
    try{
      const decoded=decodeURIComponent(url.pathname);if(decoded.includes('\0'))throw Error();
      const filename=path.resolve(root,'.'+(decoded==='/'?'/index.html':decoded));
      if(!filename.startsWith(root+path.sep)&&filename!==path.join(root,'index.html')){json(res,403,{error:'Forbidden'});return;}
      const extension=path.extname(filename);if(!Object.hasOwn(mime,extension)){json(res,404,{error:'Not found'});return;}
      const info=await stat(filename);if(!info.isFile())throw Error();
      res.writeHead(200,{'Content-Type':mime[extension],'Content-Length':info.size,'Cache-Control':'no-cache'});
      res.end(req.method==='HEAD'?undefined:await readFile(filename));
    }catch{if(!res.headersSent)json(res,404,{error:'Not found'});else res.end();}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT)||4173;
  createApp().listen(port,'127.0.0.1',()=>console.log(`Romance Academy 7: http://127.0.0.1:${port}`));
}
