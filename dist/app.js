(() => {
  'use strict';
  const $ = id => document.getElementById(id), story = RA_STORY, E = RAEngine;
  const SAVE = 'ra7.web.save.v1', SETTINGS = 'ra7.web.settings.v1';
  let state = E.fresh(), settings = {sound:false,volume:.3,speed:25,reduced:false}, saved = false;
  let typingTimer, autoTimer, toastTimer, rewardTimer, fullText = '', typing = false, home = true, auto = false, frame = 0, modalKind = '', chatBusy = false, chatRequest = 0;
  let apiReady = false, apiChecked = false, activeChat = 'giffany';
  const modal = $('modal'), content = $('modal-content');
  function toast(message) { $('toast').textContent=message; $('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3400); }
  try {
    const raw = localStorage.getItem(SAVE);
    if (raw) { state = E.restore(JSON.parse(raw),story);saved = state.started; }
    const s = JSON.parse(localStorage.getItem(SETTINGS) || '{}');
    settings={sound:s.sound===true,volume:Math.max(0,Math.min(1,Number(s.volume)||0)),speed:[0,15,25,45].includes(s.speed)?s.speed:25,reduced:s.reduced===true};
    if (!localStorage.getItem(SETTINGS)) settings.volume=.3;
  } catch { toast('Сохранение не удалось прочитать. Можно начать новую историю или импортировать копию.'); }
  function save(silent = true) {
    try {state.savedAt=new Date().toISOString();localStorage.setItem(SAVE,JSON.stringify(state));saved=state.started;$('save-status').textContent='ПРОГРЕСС СОХРАНЁН';if(!silent)toast('Игра сохранена в этом браузере.');}
    catch {$('save-status').textContent='СОХРАНЕНИЕ НЕДОСТУПНО';toast('Браузер запретил сохранение. Экспортируйте прогресс в настройках.');}
  }
  function saveSettings(){try{localStorage.setItem(SETTINGS,JSON.stringify(settings));}catch{toast('Настройки действуют до закрытия вкладки.');}applySettings();}
  function applySettings(){document.body.classList.toggle('reduce-motion',settings.reduced);$('music').volume=settings.volume;$('chime').volume=settings.volume*.4;$('sound-button').textContent=settings.sound?'♫ ON':'♫ OFF';$('sound-button').setAttribute('aria-pressed',settings.sound);$('sound-button').setAttribute('aria-label',settings.sound?'Выключить музыку':'Включить музыку');if(!settings.sound)$('music').pause();}
  function playMusic(){const audio=$('music'),file=home?'menutheme.mp3':story.characters[state.character].music;if(!audio.src.endsWith('/'+file))audio.src='assets/'+file;if(settings.sound)audio.play().catch(()=>{});}
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
  function button(text,handler,cls='secondary'){const n=el('button',cls,text);n.type='button';n.addEventListener('click',handler);return n;}
  function relationshipStatus(score){return score>=60?'Особенная связь':score>=30?'Хорошие друзья':score>0?'Знакомство началось':'Ещё не знакомы';}
  function renderStats(){
    $('player-name').textContent=state.name;$('player-subtitle').textContent=state.started?'Ученик Romantsu Maho Academy':'Твоя история ещё впереди';
    $('day-stat').textContent=String(state.day).padStart(2,'0');$('charisma-stat').textContent=String(state.charisma).padStart(2,'0');$('scene-stat').textContent=String(state.completed.length).padStart(2,'0');
    $('clock-label').textContent=`DAY ${String(state.day).padStart(2,'0')} / ${String(9 + state.completed.length % 8).padStart(2,'0')}:00`;
    $('relationships').replaceChildren();
    for(const [id,c] of Object.entries(story.characters)){
      const b=button('',()=>showCharacter(id),'relationship'),portrait=el('span','portrait'),img=el('img');img.src='assets/'+c.portrait;img.alt='';portrait.append(img);
      const info=el('span'),name=el('span','relationship-name',c.name),score=el('small','',`${state.affection[id]} / 100`);name.append(score);
      const meter=el('span','meter'),fill=el('i');fill.style.width=state.affection[id]+'%';meter.append(fill);info.append(name,meter,el('span','relationship-status',relationshipStatus(state.affection[id])));b.append(portrait,info);b.setAttribute('aria-label',`${c.name}: ${state.affection[id]} очков. Открыть профиль`);$('relationships').append(b);
    }
    const all=['giffanyIntro','sullyIntro','monikaIntro'].every(x=>state.completed.includes(x));
    $('quest-text').textContent=all?'Ты познакомился со всеми. Возвращайся к друзьям и создавай новые воспоминания.':state.completed.includes('giffanyIntro')?'Загляни в спортзал и литературный клуб. У каждого здесь своя история.':'Каждая история начинается с простого «привет».';
    $('continue-button').hidden=!saved;
  }
  function stopTimers(){clearInterval(typingTimer);clearTimeout(autoTimer);typing=false;}
  function resetSprite(){const c=story.characters[home?'giffany':state.character];$('character-sprite').src='assets/'+c.idle;$('character-sprite').alt=c.name;}
  function showHome(){stopTimers();home=true;auto=false;updateAuto();$('welcome').hidden=false;$('dialogue-panel').hidden=true;$('stage').classList.remove('playing');$('window-title').textContent='ROMANCE_ACADEMY.exe';$('location-label').textContent='ROMANTSU MAHO ACADEMY';resetSprite();renderStats();playMusic();}
  function finishTyping(){clearInterval(typingTimer);typing=false;$('dialogue-text').textContent=fullText;resetSprite();renderActions();scheduleAuto();}
  function scheduleAuto(){clearTimeout(autoTimer);const node=story.nodes[state.node];if(auto&&!typing&&!node.choices&&!home&&!modal.open)autoTimer=setTimeout(next,Math.max(2200,fullText.length*40));}
  function updateAuto(){$('auto-button').setAttribute('aria-pressed',auto);$('auto-button').textContent=auto?'AUTO ON':'AUTO';}
  function renderActions(){
    const node=story.nodes[state.node];$('choices').replaceChildren();$('next-button').hidden=!!node.choices&&!typing;
    if(node.choices&&!typing)node.choices.forEach((choice,i)=>$('choices').append(button(choice.text,()=>{
      const result=E.choose(state,i,story);if(result.awarded){$('reward').textContent=`♥ +${result.awarded}`;$('reward').classList.add('visible');clearTimeout(rewardTimer);rewardTimer=setTimeout(()=>$('reward').classList.remove('visible'),1700);if(settings.sound)$('chime').play().catch(()=>{});}route(result.next);
    },'')));
  }
  function renderNode(animate = true){
    stopTimers();home=false;$('welcome').hidden=true;$('dialogue-panel').hidden=false;$('stage').classList.add('playing');
    const c=story.characters[state.character];$('speaker').replaceChildren(document.createTextNode(c.name.toUpperCase()),el('span','','♥'));
    $('speaker').style.background=c.color;$('speaker').style.borderColor=c.color;$('window-title').textContent='STORY_MODE / '+c.name.toUpperCase();$('location-label').textContent=c.location.toUpperCase();
    fullText=story.nodes[state.node].text.replaceAll('{name}',state.name);resetSprite();renderStats();playMusic();$('choices').replaceChildren();$('next-button').hidden=false;
    if(!animate||settings.speed===0||settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches){finishTyping();return;}
    typing=true;$('dialogue-text').textContent='';let index=0;const chars=Array.from(fullText);
    typingTimer=setInterval(()=>{index++;$('dialogue-text').textContent=chars.slice(0,index).join('');if(index>=chars.length)finishTyping();},settings.speed);
  }
  function enter(id){E.enter(state,id,story);renderNode();save();}
  function route(nextId){save();renderStats();if(nextId==='@map'){showMap();return;}if(nextId==='@chat'){showChat(state.character);return;}enter(nextId);}
  function next(){if(home||modal.open)return;if(typing){finishTyping();return;}const node=story.nodes[state.node];if(!node.choices)route(node.next);}
  function openModal(title,kind){clearTimeout(autoTimer);if(typing)finishTyping();modalKind=kind;$('modal-title').textContent=title;content.replaceChildren();if(!modal.open)modal.showModal();}
  function closeModal(){modal.close();modalKind='';scheduleAuto();}
  function confirmAction(title,description,action){openModal(title,'confirm');content.append(el('p','modal-intro',description));const row=el('div','button-row');row.append(button('Отмена',closeModal),button('Продолжить',()=>{closeModal();action();},'primary'));content.append(row);}
  function begin(){const run=()=>{chatRequest++;chatBusy=false;const name=state.name;state=E.fresh(name);saved=false;enter('intro');};if(saved)confirmAction('Начать новую историю?','Текущее автосохранение будет заменено. Его можно предварительно экспортировать в настройках.',run);else showProfile(run);}
  function visit(character){closeModal();const id=state.completed.includes(character+'Intro')?character+'Return':story.characters[character].intro;enter(id);}
  function showMap(){openModal('Карта академии','map');content.append(el('p','modal-intro',`День ${state.day}. Куда отправимся, ${state.name}? Встречи можно проходить в любом порядке.`));const grid=el('div','map-grid');
    const labels={giffany:['Учебный класс','Книги, первые встречи и Giffany.'],sully:['Спортивный зал','Немного смелости. И никакой скуки.'],monika:['Литературный клуб','Истории между строк.']};
    for(const [id,c] of Object.entries(story.characters)){const card=button('',()=>visit(id),'map-card'),img=el('img');img.src='assets/'+c.portrait;img.alt='';const text=el('div');text.append(el('strong','',labels[id][0]),el('small','',labels[id][1]));card.append(img,text,el('span','',state.completed.includes(id+'Intro')?'ВЕРНУТЬСЯ ↗':'ПОЗНАКОМИТЬСЯ ↗'));grid.append(card);}
    const rest=button('',()=>{state.day=Math.min(999,state.day+1);save();renderStats();showMap();toast('Наступил новый день. Друзья ждут тебя в академии.');},'map-card');rest.append(el('strong','','☾ Новый день'),el('p','modal-intro','Отдохнуть и вернуться завтра.'));grid.append(rest);content.append(grid);
  }
  function showCharacter(id){const c=story.characters[id];openModal(c.name,'character');content.append(el('p','modal-intro',`${relationshipStatus(state.affection[id])} · ${state.affection[id]} / 100 очков`));const row=el('div','button-row');row.append(button('Встретиться',()=>visit(id),'primary'),button('Написать сообщение',()=>showChat(id)));content.append(row);}
  function showProfile(after){openModal('Как тебя зовут?','profile');const form=el('form'),label=el('label','field','Имя в академии'),input=el('input');input.maxLength=24;input.required=true;input.value=state.name==='Новый ученик'?'':state.name;input.placeholder='Твоё имя';input.autocomplete='nickname';label.append(input);const submit=el('button','primary','Приятно познакомиться ↗');submit.type='submit';form.append(label,submit);form.addEventListener('submit',e=>{e.preventDefault();state.name=input.value.trim().slice(0,24)||'Новый ученик';save();renderStats();closeModal();if(after)after();else if(!home)renderNode(false);});content.append(form);input.focus();}
  function showJournal(historyOnly=false){openModal(historyOnly?'История диалога':'Твой дневник','journal');if(!historyOnly){content.append(el('p','modal-intro',`День ${state.day} · Завершено встреч: ${state.completed.length} · Харизма: ${state.charisma}/100`));const interests={music:'Любишь музыку',code:'Интересуешься программированием',books:'Любишь книги и театр',date:'Договорился встретиться с Giffany после занятий'};for(const flag of state.flags)if(interests[flag])content.append(el('p','entry','✧ '+interests[flag]));}
    if(!state.history.length)content.append(el('p','modal-intro','Здесь появятся ваши разговоры. Начни историю — первая встреча уже ждёт.'));
    for(const entry of state.history){const n=el('div','entry');n.append(el('b','',entry.speaker),document.createTextNode(entry.text));content.append(n);}
  }
  function showSettings(){openModal('Настройки','settings');const volume=el('label','field','Громкость музыки'),slider=el('input');slider.type='range';slider.min=0;slider.max=1;slider.step=.05;slider.value=settings.volume;slider.addEventListener('input',()=>{settings.volume=Number(slider.value);saveSettings();});volume.append(slider);content.append(volume);
    const speed=el('label','field','Скорость текста'),select=el('select');for(const [value,label] of [[45,'Медленно'],[25,'Обычно'],[15,'Быстро'],[0,'Мгновенно']]){const option=el('option','',label);option.value=value;select.append(option);}select.value=settings.speed;select.onchange=()=>{settings.speed=Number(select.value);saveSettings();};speed.append(select);content.append(speed);
    for(const [key,label] of [['sound','Музыка и звуки'],['reduced','Уменьшить анимацию']]){const l=el('label','settings-row'),input=el('input');input.type='checkbox';input.checked=settings[key];input.onchange=()=>{settings[key]=input.checked;saveSettings();playMusic();};l.append(input,document.createTextNode(label));content.append(l);}
    content.append(el('p','modal-intro','Прогресс хранится только в этом браузере. Экспортируй файл, чтобы перенести его на другое устройство.'));
    const row=el('div','button-row');row.append(button('Экспорт сохранения',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='romance-academy-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}),button('Импорт сохранения',()=>file.click()));
    const file=el('input');file.type='file';file.accept='.json,application/json';file.hidden=true;file.onchange=async()=>{try{if(!file.files[0])return;if(file.files[0].size>300000)throw Error('Слишком большой файл сохранения');const restored=E.restore(JSON.parse(await file.files[0].text()),story);confirmAction('Загрузить сохранение?','Текущий прогресс будет заменён содержимым выбранного файла.',()=>{chatRequest++;chatBusy=false;state=restored;save();renderStats();if(state.started)renderNode(false);else showHome();toast('Сохранение загружено.');});}catch(e){toast(e.message||'Не удалось загрузить сохранение.');}};content.append(row,file,el('p','modal-intro','Веб-адаптация Romance Academy 7 / Rokko System. Графика и музыка — из исходного проекта. Сценарии адаптированы на русский язык.'));
  }
  async function checkAPI(){if(apiChecked)return;apiChecked=true;try{const r=await fetch('/api/status',{signal:AbortSignal.timeout(3000)});if(r.ok){const data=await r.json();apiReady=data.ai===true;}}catch{} }
  function renderChatLog(id,log){log.replaceChildren();const messages=state.chats[id];if(!messages.length){const bubble=el('div','bubble','Привет! Напиши мне что-нибудь. Можно поговорить о музыке, книгах или о том, как прошёл день.');log.append(bubble);}for(const message of messages){const bubble=el('div','bubble'+(message.role==='user'?' user':''));bubble.append(el('small','',message.role==='user'?state.name:story.characters[id].name),document.createTextNode(message.content));log.append(bubble);}log.scrollTop=log.scrollHeight;}
  async function showChat(id='giffany'){
    const c=story.characters[id];openModal('Сообщения · '+c.name,'chat');const status=el('p','chat-state','Проверяем режим чата…'),log=el('div','chat-log');log.setAttribute('role','log');log.setAttribute('aria-live','polite');const form=el('form','chat-form'),input=el('input','chat-input'),send=el('button','','↗');input.maxLength=500;input.placeholder='Напиши сообщение…';input.setAttribute('aria-label','Сообщение персонажу');input.required=true;send.type='submit';send.setAttribute('aria-label','Отправить сообщение');send.disabled=true;input.disabled=true;form.append(input,send);content.append(status,log,form);renderChatLog(id,log);
    await checkAPI();if(!status.isConnected)return;send.disabled=chatBusy;input.disabled=chatBusy;status.textContent=apiReady?'ИИ подключён · сообщения обрабатывает настроенный сервер':'Автономный диалог · ответы по сценариям, без ИИ';input.focus();
    form.addEventListener('submit',async e=>{e.preventDefault();const message=input.value.trim();if(!message||chatBusy)return;chatBusy=true;const request=++chatRequest,conversation=state.chats[id];conversation.push({role:'user',content:message});input.value='';send.disabled=true;input.disabled=true;renderChatLog(id,log);save();status.textContent=c.name+' печатает…';
      let reply;
      try{if(apiReady){const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character:id,name:state.name,messages:conversation.slice(-12)}),signal:AbortSignal.timeout(35000)});if(!r.ok)throw Error('Сервер временно недоступен');const data=await r.json();if(typeof data.reply!=='string'||!data.reply.trim())throw Error('Пустой ответ');reply=data.reply.slice(0,2000);}else{await new Promise(resolve=>setTimeout(resolve,500));reply=E.offlineReply(id,message,state);}}
      catch{reply='Сейчас не получается связаться с ИИ. Попробуй немного позже.';toast('Не удалось получить ответ сервера. Сообщение сохранено.');}
      if(request!==chatRequest)return;
      conversation.push({role:'assistant',content:reply});state.chats[id]=conversation.slice(-40);chatBusy=false;save();if(log.isConnected){renderChatLog(id,log);send.disabled=false;input.disabled=false;status.textContent=apiReady?'ИИ подключён':'Автономный диалог · ответы по сценариям, без ИИ';input.focus();}
      else if(modalKind==='chat')showChat(activeChat);
    });
  }
  $('start-button').onclick=begin;$('continue-button').onclick=()=>{renderNode(false);playMusic();};$('home-button').onclick=showHome;$('map-button').onclick=showMap;$('journal-button').onclick=()=>showJournal();$('history-button').onclick=()=>showJournal(true);$('settings-button').onclick=showSettings;$('profile-button').onclick=()=>showProfile();$('chat-button').onclick=()=>showChat('giffany');$('close-modal').onclick=closeModal;$('next-button').onclick=next;$('save-button').onclick=()=>save(false);
  $('sound-button').onclick=()=>{settings.sound=!settings.sound;saveSettings();playMusic();};$('auto-button').onclick=()=>{auto=!auto;updateAuto();scheduleAuto();};$('fullscreen-button').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.game-window').requestFullscreen();}catch{toast('Полноэкранный режим недоступен в этом браузере.');}};
  $('dialogue-text').onclick=()=>{if(typing)finishTyping();};modal.addEventListener('close',()=>{modalKind='';scheduleAuto();});modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&!modal.open&&!['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();next();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(autoTimer);$('music').pause();}else{playMusic();scheduleAuto();}});
  setInterval(()=>{if(home||!typing||settings.reduced||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const c=story.characters[state.character],happy=story.nodes[state.node].pose==='happy';const frames=happy&&state.character==='giffany'?['carryingamused_1.png','carryingamused_2.png','carryingamused_3.png','carryingamused_4.png','carryingamused_5.png']:c.frames;$('character-sprite').src='assets/'+frames[frame++%frames.length];},180);
  applySettings();showHome();
})();
