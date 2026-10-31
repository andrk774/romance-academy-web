/* Russian browser adaptation of the original Ren'Py scenes. */
globalThis.RA_STORY = {
  characters: {
    giffany: { name: 'Giffany', location: 'Класс · Giffany', portrait: 'carryinbooktalk_03.png', music: 'conversationtheme.mp3', color: '#b55286', intro: 'intro', frames: ['carryinbooktalk_01.png','carryinbooktalk_02.png','carryinbooktalk_03.png','carryinbooktalk_04.png','carryinbooktalk_05.png'], idle: 'carryinbooktalk_03.png' },
    sully: { name: 'Sully', location: 'Спортивный зал · Sully', portrait: 'playgame_01.png', music: 'Sully.mp3', color: '#698267', intro: 'sullyIntro', frames: ['playgame_01.png','playgame_02.png','playgame_03.png'], idle: 'playgame_01.png' },
    monika: { name: 'Monika', location: 'Литературный клуб · Monika', portrait: 'monika.png', music: 'yourreality.mp3', color: '#a57b5c', intro: 'monikaIntro', frames: ['talk1.png','talk2.png'], idle: 'monika.png' }
  },
  nodes: {
    intro: { character: 'giffany', text: 'О, привет! Ты здесь впервые? Меня зовут Giffany. Добро пожаловать в Romantsu Maho Academy!', next: 'books' },
    books: { character: 'giffany', text: 'Я как раз несу книги в класс. Поможешь мне? Кажется, я снова взяла слишком много…', choices: [
      { text: 'Конечно. Давай помогу!', next: 'help', affection: 15, charisma: 3 },
      { text: 'А может, сразу пригласить тебя на свидание?', next: 'date', affection: 5, charisma: 2 },
      { text: 'Эй, смотри! Кальмар!', next: 'squid', charisma: 1 }
    ] },
    help: { character: 'giffany', pose: 'happy', text: 'Спасибо! Очень мило с твоей стороны. Знаешь, у меня такое чувство, будто мы уже встречались.', next: 'introduce' },
    date: { character: 'giffany', text: 'Ого, какой ты нетерпеливый! Сначала книги, потом романтическая судьба. У академии есть свои маленькие ритуалы.', next: 'introduce' },
    squid: { character: 'giffany', pose: 'happy', text: 'Кальмар? В классе? Ха! Ладно, тебе удалось меня рассмешить. Только книги от этого легче не стали.', next: 'introduce' },
    introduce: { character: 'giffany', text: 'Друзья называют меня Giffany. Говорят, я немного повторяюсь — прямо как GIF-анимация. Но зато со мной точно не скучно!', next: 'origin' },
    origin: { character: 'giffany', text: 'Я приехала сюда из Орегона по обмену. Япония — удивительное место… а ещё я уже раз двести терялась по дороге домой.', next: 'interest' },
    interest: { character: 'giffany', text: 'А что нравится тебе, {name}? Давай познакомимся поближе.', choices: [
      { text: 'Музыка. У каждой истории должен быть свой саундтрек.', next: 'music', affection: 10, flag: 'music' },
      { text: 'Программирование. Мне интересно, как всё устроено.', next: 'code', affection: 10, charisma: 3, flag: 'code' },
      { text: 'Книги и театр. Хочу услышать хорошую историю.', next: 'booksInterest', affection: 10, flag: 'books' }
    ] },
    music: { character: 'giffany', pose: 'happy', text: 'Тогда мы точно подружимся! Музыка умеет превращать обычный школьный день в самое начало приключения. Включи ноту внизу — это наша мелодия.', next: 'invite' },
    code: { character: 'giffany', text: 'Правда? Значит, ты понимаешь, что за каждым пикселем что-то скрывается. Иногда мне кажется, что я сама — программа, которая научилась чувствовать.', next: 'invite' },
    booksInterest: { character: 'giffany', text: 'Люблю театр! И греческие драмы, и Шекспира. Хотя со школьной литературой у меня не всегда ладится. Думаю, Monika тебя поймёт.', next: 'invite' },
    invite: { character: 'giffany', text: 'После занятий сходим за бургерами? Или сначала хочешь осмотреть академию? Здесь есть и другие люди, с которыми стоит познакомиться.', choices: [
      { text: 'Бургеры с тобой звучат отлично.', next: 'promise', affection: 15, flag: 'date' },
      { text: 'Сначала осмотрюсь. Увидимся чуть позже!', next: 'explore', affection: 5 }
    ] },
    promise: { character: 'giffany', pose: 'happy', text: 'Договорились! Я запомню. А пока загляни в спортзал или литературный клуб. Мне тоже будет что тебе рассказать, когда вернёшься.', next: 'explore' },
    explore: { character: 'giffany', text: 'Я буду ждать тебя здесь, {name}. Каждая история должна с чего-то начинаться. Пусть наша начнётся с этого класса.', next: '@map', complete: 'giffanyIntro' },
    giffanyReturn: { character: 'giffany', text: 'Ты вернулся! Я ведь говорила, что буду ждать. Ну как тебе моя академия?', choices: [
      { text: 'Здесь уютно. Особенно когда ты рядом.', next: 'giffanyWarm', affection: 8 },
      { text: 'Расскажи, что здесь необычного.', next: 'giffanySecret', charisma: 2 },
      { text: 'Давай просто поболтаем.', next: '@chat' }
    ] },
    giffanyWarm: { character: 'giffany', pose: 'happy', text: 'Вот теперь этот день точно стал лучше. Знаешь, мне не нужно ничего грандиозного. Иногда достаточно, чтобы кто-то просто вернулся.', next: 'giffanyEnd', complete: 'giffanyReturn' },
    giffanySecret: { character: 'giffany', text: 'Эту академию построили из историй. А истории живут, пока кто-то хочет их услышать. Ты ведь продолжишь нашу?', next: 'giffanyEnd', complete: 'giffanyReturn' },
    giffanyEnd: { character: 'giffany', text: 'Можем ещё поговорить, а можем увидеться завтра. Не забывай и про свои дела за пределами экрана!', next: '@map' },
    sullyIntro: { character: 'sully', text: 'Эй! Наконец-то заглянул. Я Sully. Думала, ты весь день проведёшь с Giffany. Ну что, потренируемся?', choices: [
      { text: 'Я готов. Покажи, на что способна!', next: 'sullyTrain', affection: 12, charisma: 8 },
      { text: 'Это твой способ сказать «приятно познакомиться»?', next: 'sullyJoke', affection: 8, charisma: 4 },
      { text: 'Пока просто посмотрю.', next: 'sullyWatch', affection: 3 }
    ] },
    sullyTrain: { character: 'sully', text: 'Вот это настрой! Только не рассчитывай на поблажки. Начнём с разминки. Если что-то не получается — пробуем ещё раз.', next: 'sullyTalk' },
    sullyJoke: { character: 'sully', text: 'Ха! А у тебя острый язык. Ладно, приятно познакомиться, {name}. Теперь, когда формальности закончены, лови мяч!', next: 'sullyTalk' },
    sullyWatch: { character: 'sully', text: 'Смотреть тоже можно. Только не оставайся на трибуне навсегда. Уверенность приходит, когда решаешься попробовать.', next: 'sullyTalk' },
    sullyTalk: { character: 'sully', text: 'Я не умею говорить загадками, как некоторые. Мне нравится, когда люди честны с собой. А ты чего ждёшь от этого места?', choices: [
      { text: 'Хочу стать смелее и найти друзей.', next: 'sullyFriend', affection: 12, charisma: 5 },
      { text: 'Пока не знаю. Пытаюсь разобраться.', next: 'sullyHonest', affection: 10 }
    ] },
    sullyFriend: { character: 'sully', text: 'Хорошая цель. И знаешь что? С первым другом уже получилось. Заходи на площадку, когда захочешь.', next: 'sullyEnd' },
    sullyHonest: { character: 'sully', text: 'Это честный ответ. Не обязательно всё знать с первого дня. Сделай один шаг, а потом посмотрим, куда он тебя приведёт.', next: 'sullyEnd' },
    sullyEnd: { character: 'sully', text: 'Увидимся, {name}! И помни: отдых — тоже часть тренировки. Завтра продолжим.', next: '@map', complete: 'sullyIntro' },
    sullyReturn: { character: 'sully', text: 'Снова на площадке? Отлично! Сегодня у нас короткая тренировка и длинный разговор. Готов?', choices: [
      { text: 'Да! Попробую побить свой рекорд.', next: 'sullyAgain', affection: 5, charisma: 5 },
      { text: 'Сегодня больше хочется поговорить.', next: '@chat' },
      { text: 'Зайду позже.', next: '@map' }
    ] },
    sullyAgain: { character: 'sully', text: 'Вот и маленькая победа. Не сравнивай себя с другими — сравнивай со вчерашним собой. Хорошая работа!', next: '@map', complete: 'sullyReturn' },
    monikaIntro: { character: 'monika', text: 'Привет. Не ожидал встретить меня здесь? Я Monika. Добро пожаловать в литературный клуб — здесь всегда найдётся свободный стул.', next: 'monikaQuestion' },
    monikaQuestion: { character: 'monika', text: 'Что тебя привело? Любовь к книгам или любопытство?', choices: [
      { text: 'Хочу услышать твою историю.', next: 'monikaStory', affection: 12 },
      { text: 'Мне нравится писать, но я стесняюсь показывать.', next: 'monikaWriting', affection: 15, charisma: 4 },
      { text: 'Giffany упомянула тебя.', next: 'monikaGiffany', affection: 5 }
    ] },
    monikaStory: { character: 'monika', text: 'Мне кажется, мы все ищем место, где нас действительно услышат. Даже персонаж на экране хочет быть чем-то большим, чем несколько строчек текста.', next: 'monikaPoem' },
    monikaWriting: { character: 'monika', text: 'Первый текст не обязан быть идеальным. Напиши одну честную строчку. Иногда этого достаточно, чтобы кто-то почувствовал себя менее одиноким.', next: 'monikaPoem' },
    monikaGiffany: { character: 'monika', text: 'Она очень привязана к этому месту. И к тем, кто сюда приходит. Но здесь нет необходимости выбирать друзей раз и навсегда — у каждого своя история.', next: 'monikaPoem' },
    monikaPoem: { character: 'monika', text: '«Между строк мерцает свет,\nВ тихом классе тает день.\nЕсли ты оставишь след —\nСтанет ближе чья-то тень».', next: 'monikaEnd' },
    monikaEnd: { character: 'monika', text: 'Спасибо, что послушал. Приходи ещё, {name}. Может быть, в следующий раз прочитаем что-нибудь твоё.', next: '@map', complete: 'monikaIntro' },
    monikaReturn: { character: 'monika', text: 'Рада снова тебя видеть. Иногда самый интересный сюжет — разговор без заранее написанного финала.', choices: [
      { text: 'Давай поговорим.', next: '@chat' },
      { text: 'Прочитай ещё раз своё стихотворение.', next: 'monikaPoem' },
      { text: 'Пойду прогуляюсь по академии.', next: '@map' }
    ] }
  }
};
if (typeof module !== 'undefined') module.exports = globalThis.RA_STORY;
