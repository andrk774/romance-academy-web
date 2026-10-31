(function (root) {
  'use strict';
  const VERSION = 1;
  const limit = (v, max) => Math.max(0, Math.min(max, Number.isFinite(Number(v)) ? Math.floor(Number(v)) : 0));
  function fresh(name = 'Новый ученик') {
    return { version: VERSION, name: name.trim().slice(0, 24) || 'Новый ученик', started: false, node: 'intro', character: 'giffany', day: 1, charisma: 0, affection: { giffany: 0, sully: 0, monika: 0 }, completed: [], flags: [], rewarded: [], history: [], chats: { giffany: [], sully: [], monika: [] }, savedAt: null };
  }
  function restore(raw, story) {
    if (!raw || raw.version !== VERSION || !story.nodes[raw.node]) throw new Error('Несовместимое или повреждённое сохранение');
    const state = fresh(typeof raw.name === 'string' ? raw.name : '');
    state.started = Boolean(raw.started); state.node = raw.node;
    state.character = story.characters[raw.character] ? raw.character : story.nodes[raw.node].character;
    state.day = Math.max(1, limit(raw.day, 999)); state.charisma = limit(raw.charisma, 100);
    for (const c of Object.keys(state.affection)) {
      state.affection[c] = limit(raw.affection?.[c], 100);
      state.chats[c] = Array.isArray(raw.chats?.[c]) ? raw.chats[c].filter(m => m && ['user','assistant'].includes(m.role) && typeof m.content === 'string').slice(-40).map(m=>({role:m.role,content:m.content.slice(0,2000)})) : [];
    }
    for (const key of ['completed','flags','rewarded']) state[key] = Array.isArray(raw[key]) ? raw[key].filter(x => typeof x === 'string').slice(-500) : [];
    state.history = Array.isArray(raw.history) ? raw.history.filter(x => x && typeof x.speaker === 'string' && typeof x.text === 'string').slice(-150).map(x=>({speaker:x.speaker.slice(0,30),text:x.text.slice(0,2000)})) : [];
    state.savedAt = typeof raw.savedAt === 'string' ? raw.savedAt : null;
    return state;
  }
  function enter(state, id, story) {
    const node = story.nodes[id]; if (!node) throw new Error('Неизвестная сцена: ' + id);
    state.node = id; state.character = node.character; state.started = true;
    const text = node.text.replaceAll('{name}', state.name);
    const last = state.history.at(-1);
    if (!last || last.text !== text) state.history.push({speaker:story.characters[node.character].name,text});
    state.history = state.history.slice(-150);
    if (node.complete && !state.completed.includes(node.complete)) state.completed.push(node.complete);
    return text;
  }
  function choose(state, index, story) {
    const node = story.nodes[state.node]; const choice = node.choices?.[index];
    if (!choice) throw new Error('Неизвестный вариант ответа');
    // Replaying a conversation is allowed; its rewards are granted only once.
    const key = state.node;
    let awarded = 0;
    if (!state.rewarded.includes(key)) {
      const before = state.affection[node.character];
      state.affection[node.character] = limit(before + (choice.affection || 0), 100);
      awarded = state.affection[node.character] - before;
      state.charisma = limit(state.charisma + (choice.charisma || 0), 100);
      state.rewarded.push(key);
    }
    if (choice.flag && !state.flags.includes(choice.flag)) state.flags.push(choice.flag);
    state.history.push({ speaker:state.name, text:choice.text });
    return {next:choice.next,awarded};
  }
  function offlineReply(character, message, state) {
    const s = message.toLowerCase(); const name = state.name;
    if (/привет|здравств|hello|hi\b/.test(s)) return {giffany:`Привет, ${name}! Рада, что ты заглянул. Как прошёл твой день?`,sully:`Привет, ${name}! Готов к новому дню? Или сегодня отдыхаем?`,monika:`Привет, ${name}. Рада снова тебя видеть в клубе. О чём думаешь?`}[character];
    if (/груст|устал|плохо|одинок/.test(s)) return {giffany:'Жаль, что день оказался непростым. Давай немного посидим рядом. Можно никуда не торопиться.',sully:'Тогда сегодня без рекордов. Отдохни, выпей воды. Не обязательно быть сильным каждую минуту.',monika:'Иногда тяжёлые мысли проще выразить словами. Я могу послушать. А ещё можно поговорить с близким человеком.'}[character];
    if (/музык|песн/.test(s)) return 'У этой академии свой саундтрек. Нажми на ноту под сценой — и давай просто послушаем его вместе.';
    if (/книг|стих|писат/.test(s)) return character === 'monika' ? 'Попробуй написать три строки о том, что заметил сегодня. Маленькие детали часто становятся началом большой истории.' : 'В литературном клубе Monika всегда найдёт интересную историю. Может, заглянем к ней после занятий?';
    if (/спасиб|люблю|нрав/.test(s)) return {giffany:'Мне очень приятно это слышать. Такие маленькие моменты и делают нашу историю особенной.',sully:'Эй, спасибо. Я тоже рада, что мы познакомились. Заходи почаще!',monika:'Спасибо, что поделился. Мне нравится, когда можно говорить друг с другом честно.'}[character];
    const defaults={giffany:['Расскажи, что тебе больше всего понравилось в академии? Мне правда интересно.','Я всё ещё думаю о нашей первой встрече с этими книгами. Забавно, как начинаются знакомства.','После занятий можно просто погулять. Для хорошего дня не всегда нужен особый план.'],sully:['У меня правило: один маленький шаг вперёд каждый день. А какой шаг хочешь сделать ты?','Если захочешь отвлечься — приходи на площадку. Можем просто побросать мяч.','Люблю, когда люди говорят прямо. Что для тебя сейчас важнее всего?'],monika:['Иногда обычный разговор становится лучшей частью дня. Что сегодня запомнилось тебе?','У каждого своя история. Я бы хотела узнать твою — по одной странице за раз.','В хорошей истории важно не только то, чем она закончится, но и то, что мы почувствуем по дороге.']};
    return defaults[character][Math.floor(state.chats[character].length / 2) % 3];
  }
  const api = {fresh,restore,enter,choose,offlineReply,VERSION};
  root.RAEngine = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
