'use strict';

const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_MOBILE = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
const STORAGE = {
  lang: 'snk_lang',
  saved: 'snk_saved',
  custom: 'snk_custom',
  lastRound: 'snk_last_round',
  notes: 'snk_notes',
  events: 'snk_events',
  history: 'snk_history',
  theme: 'snk_theme',
};

function readText(key, fallback = '') {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeText(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function removeStored(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

// ── STARS + SHOOTING STARS ──
(function () {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas || REDUCE_MOTION || IS_MOBILE) return;
  const ctx    = canvas.getContext('2d');
  let W, H, stars = [], shooters = [];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }

  function mkStars() {
    stars = Array.from({ length: 260 }, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H * 0.72,
      r: Math.random() * 1.3 + 0.12,
      a: Math.random() * 0.8 + 0.15,
      sp: Math.random() * 0.003 + 0.0008,
      ph: Math.random() * Math.PI * 2,
      fadeIn: 0,
      fadeDelay: i * 8,
    }));
  }

  function mkShooter() {
    const x = Math.random() * W * 0.8 + W * 0.1;
    const y = Math.random() * H * 0.35;
    const angle = Math.PI / 6 + Math.random() * 0.3;
    shooters.push({ x, y, vx: Math.cos(angle) * 9, vy: Math.sin(angle) * 9, life: 1, maxLen: 60 + Math.random() * 100, trail: [] });
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      if (t > s.fadeDelay && s.fadeIn < 1) s.fadeIn = Math.min(1, s.fadeIn + 0.015);
      const a = s.fadeIn * s.a * (0.4 + 0.6 * Math.sin(t * s.sp + s.ph));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210,228,255,${a})`; ctx.fill();
    });
    if (Math.random() < 0.003 && shooters.length < 2) mkShooter();
    shooters = shooters.filter(s => s.life > 0);
    shooters.forEach(s => {
      s.trail.push({ x: s.x, y: s.y });
      if (s.trail.length > 20) s.trail.shift();
      s.x += s.vx; s.y += s.vy; s.life -= 0.018;
      ctx.save();
      s.trail.forEach((pt, i) => {
        const ratio = i / s.trail.length;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 1.2 * ratio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,240,255,${ratio * s.life * 0.8})`; ctx.fill();
      });
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 3);
      grad.addColorStop(0, `rgba(255,255,255,${s.life})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();
      ctx.restore();
    });
    requestAnimationFrame(draw);
  }

  resize(); mkStars(); requestAnimationFrame(draw);
  window.addEventListener('resize', () => { resize(); mkStars(); });
}());

// ── EMBER PARTICLES ──
(function () {
  const canvas = document.getElementById('emberCanvas');
  if (!canvas || REDUCE_MOTION || IS_MOBILE) return;
  const ctx    = canvas.getContext('2d');
  let W, H, embers = [];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }

  function getFirePos() {
    const campfire = document.getElementById('campfire');
    if (!campfire) return { x: W / 2, y: H * 0.62 };
    const r = campfire.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.3 };
  }

  function mkEmber(pos) {
    return {
      x: pos.x + (Math.random() - 0.5) * 14,
      y: pos.y,
      vx: (Math.random() - 0.5) * 1.4,
      vy: -(Math.random() * 2.5 + 1.0),
      life: 1,
      decay: Math.random() * 0.012 + 0.008,
      r: Math.random() * 1.8 + 0.6,
      hue: 20 + Math.random() * 30,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const pos = getFirePos();
    if (Math.random() < 0.35) embers.push(mkEmber(pos));
    if (embers.length > 80) embers.splice(0, embers.length - 80);
    embers = embers.filter(e => e.life > 0);
    embers.forEach(e => {
      e.x  += e.vx + Math.sin(e.life * 8) * 0.4;
      e.y  += e.vy;
      e.vy *= 0.98;
      e.life -= e.decay;
      const a = e.life * 0.9;
      const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 2.5);
      grad.addColorStop(0, `hsla(${e.hue},100%,80%,${a})`);
      grad.addColorStop(1, `hsla(${e.hue},100%,60%,0)`);
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize(); draw();
  window.addEventListener('resize', resize);
}());

// ── PARALLAX ──
(function () {
  if (REDUCE_MOTION) return;
  const moon = document.getElementById('moonWrap');
  const mts  = document.getElementById('mountainsWrap');
  const mtnLayers = mts ? Array.from(mts.querySelectorAll('.mtn')) : [];
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (moon) moon.style.transform = `translateY(${y * 0.18}px)`;
    mtnLayers.forEach((layer, i) => {
      const speed = 0.02 + (i * 0.02);
      layer.style.transform = `translateY(${y * speed}px)`;
    });
  }, { passive: true });
}());

// ── CAMPFIRE SOUND (Web Audio — brown noise crackling) ──
const fireAudio = (function () {
  let ctx, gain, running = false, inited = false;

  function init() {
    if (inited) return;
    inited = true;
    ctx  = new (window.AudioContext || window.webkitAudioContext)();
    gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    const len  = ctx.sampleRate * 4;
    const buf  = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const wh = Math.random() * 2 - 1;
      data[i]  = (last + 0.02 * wh) / 1.02;
      last     = data[i];
      data[i] *= 3.8;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true; src.start(0);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';  lp.frequency.value = 1100; lp.Q.value = 0.4;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 350;  bp.Q.value = 0.25;
    src.connect(lp); lp.connect(bp); bp.connect(gain);
  }

  function crackle() {
    if (!running) return;
    gain.gain.setTargetAtTime(0.28 + Math.random() * 0.14, ctx.currentTime, 0.08);
    setTimeout(crackle, 80 + Math.random() * 180);
  }

  return {
    start() {
      init(); ctx.resume();
      running = true;
      gain.gain.setTargetAtTime(0.28, ctx.currentTime, 0.6);
      crackle();
    },
    stop() {
      if (!inited) return;
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      running = false;
    },
    toggle() { running ? this.stop() : this.start(); return running; },
    isRunning() { return running; }
  };
}());

let syncFireButton = function () {};
const fireBtn = document.getElementById('fireBtn');
if (fireBtn) {
  fireBtn.addEventListener('click', function () {
    fireAudio.toggle();
    syncFireButton();
    track('campfire_toggled', { enabled: fireAudio.isRunning() });
  });
}

// ── DATA ──
const CARDS = [
  { id: 1, category:'light', en:'What was your favourite toy as a child?', no:'Hva var favorittleken din som barn?', ru:'Какая у тебя была любимая игрушка в детстве?' },
  { id: 2, category:'light', en:'What could you do for hours as a child?', no:'Hva kunne du holde på med i timevis som barn?', ru:'Чем ты мог(ла) заниматься часами, когда был(а) ребёнком?' },
  { id: 3, category:'light', en:'Which cartoon or film did you watch over and over again?', no:'Hvilken tegnefilm eller film så du om og om igjen?', ru:'Какой мультик или фильм ты пересматривал(а) много раз?' },
  { id: 4, category:'light', en:'Who did you dream of becoming when you grew up?', no:'Hvem drømte du om å bli da du ble stor?', ru:'Кем ты хотел(а) стать в детстве?' },
  { id: 5, category:'light', en:'What smell is firmly linked to the feeling of home for you?', no:'Hvilken lukt forbinder du sterkt med hjemfølelsen?', ru:'Какой запах у тебя стойко ассоциируется с домом?' },
  { id: 6, category:'light', en:'What made you happiest as a child?', no:'Hva gledet deg mest som barn?', ru:'Что тебя больше всего радовало в детстве?' },
  { id: 7, category:'light', en:'Did you have your own imaginary world or fantasy you loved to escape into?', no:'Hadde du din egen fantasiverden du elsket å flykte til?', ru:'Был ли у тебя «свой мир» или фантазия, куда ты любил(а) сбегать?' },
  { id: 8, category:'light', en:'What was your strangest or funniest childhood habit?', no:'Hva var din merkeligste eller morsomste barndomsvane?', ru:'Какая у тебя была самая странная или забавная детская привычка?' },
  { id: 9, category:'light', en:'Were you more of a calm child or an active rebel?', no:'Var du mer et rolig barn eller en aktiv opprører?', ru:'Ты был(а) больше спокойным ребёнком или активным бунтарем?' },
  { id: 10, category:'light', en:'What achievements were you most often praised for in your family?', no:'Hva ble du oftest rost for i familien din?', ru:'За какие достижения тебя чаще всего хвалили в семье?' },
  { id: 11, category:'light', en:'And what did you get scolded for most often?', no:'Og hva ble du oftest kjeftet på for?', ru:'А за какие проступки чаще всего ругали?' },
  { id: 12, category:'light', en:'What did your perfect day look like as a child?', no:'Hvordan så den perfekte dagen din ut som barn?', ru:'Как выглядел твой самый идеальный день в детстве?' },
  { id: 13, category:'light', en:'Who was your idol or hero during your school years?', no:'Hvem var idolet eller helten din i skoletiden?', ru:'Кто был твоим кумиром или героем в школьные годы?' },
  { id: 14, category:'light', en:'Did you enjoy spending time alone as a child?', no:'Likte du å tilbringe tid alene som barn?', ru:'Любил(а) ли ты проводить время в одиночестве, будучи ребенком?' },
  { id: 15, category:'light', en:'Did you prefer playing with ready-made toys or inventing your own rules?', no:'Foretrakk du å leke med ferdige leker eller finne på egne regler?', ru:'Что ты больше любил(а): играть с готовыми игрушками или придумывать свои правила?' },
  { id: 16, category:'light', en:'Did you have a favourite object or a secret spot in the house?', no:'Hadde du en favorittkjenning eller et hemmelig sted i huset?', ru:'Был ли у тебя любимый предмет или секретное место в доме?' },
  { id: 17, category:'light', en:'As a child, did you tend to follow the rules or break them?', no:'Som barn, pleide du å følge reglene eller bryte dem?', ru:'В детстве ты больше следовал(а) правилам или нарушал(а) их?' },
  { id: 18, category:'light', en:'How did you usually make up with friends after arguments in the yard?', no:'Hvordan forlikte du deg vanligvis med venner etter krangler ute?', ru:'Как ты обычно мирился(лась) с друзьями после дворовых ссор?' },
  { id: 19, category:'light', en:'What were you most afraid of in the dark or when alone?', no:'Hva var du mest redd for i mørket eller når du var alene?', ru:'Чего ты больше всего боялся(лась) в темноте или в одиночестве?' },
  { id: 20, category:'light', en:'What truly made you happy as a child?', no:'Hva gjorde deg virkelig lykkelig som barn?', ru:'Что делало тебя по-настоящему счастливым(ой) ребенком?' },
  { id: 21, category:'light', en:'Did you have a childhood secret you never told anyone?', no:'Hadde du en barndomshemmelighet du aldri fortalte noen?', ru:'Был ли у тебя детский секрет, который ты никому так и не рассказал(а)?' },
  { id: 22, category:'light', en:'Since childhood, have you been more of a morning or an evening person?', no:'Har du helt siden barndommen vært mer en morgen- eller kveldsperson?', ru:'Ты с детства больше любишь раннее утро или поздний вечер?' },
  { id: 23, category:'light', en:'How did you show care for loved ones even at a young age?', no:'Hvordan viste du omsorg for de nærmeste allerede i ung alder?', ru:'Как ты еще в раннем возрасте проявлял(а) заботу о близких?' },
  { id: 24, category:'light', en:'What object from your past did you consider your greatest treasure?', no:'Hvilken gjenstand fra fortiden din anså du som din største skatt?', ru:'Какую вещь из прошлого ты считал(а) своей самой большой ценностью?' },
  { id: 25, category:'light', en:'Is there something from childhood — a habit, fear, or joy — that has stayed with you?', no:'Er det noe fra barndommen — en vane, frykt eller glede — som har blitt med deg?', ru:'Есть ли что-то из детства (привычка, страх, радость), что осталось с тобой до сих пор?' },
  { id: 26, category:'light', en:'If you had to choose just one drink for the rest of your life, what would it be?', no:'Hvis du måtte velge bare én drikk for resten av livet, hva ville det vært?', ru:'Какой напиток ты бы выбрал(а) пить всю жизнь, если бы пришлось оставить только один?' },
  { id: 27, category:'light', en:'Which food or ingredient would be hardest for you to live without?', no:'Hvilken mat eller ingrediens ville det vært vanskeligst for deg å leve uten?', ru:'Без какого блюда или продукта тебе было бы физически сложно обойтись?' },
  { id: 28, category:'light', en:'Do you prefer complete silence or background sound?', no:'Foretrekker du fullstendig stillhet eller bakgrunnslyd?', ru:'Ты больше любишь полную тишину или когда на фоне что-то играет?' },
  { id: 29, category:'light', en:'What does your ideal, unhurried breakfast look like?', no:'Hvordan ser din ideelle, rolige frokost ut?', ru:'Как выглядит твой идеальный, неспешный завтрак?' },
  { id: 30, category:'light', en:'In daily life, do you tend to plan ahead or go with the mood?', no:'I hverdagen, pleier du å planlegge eller gå etter humøret?', ru:'В повседневной жизни ты больше «планируешь» или действуешь «по настроению»?' },
  { id: 31, category:'light', en:'What feels more comfortable to you — spontaneity or predictable stability?', no:'Hva føles mer behagelig for deg — spontanitet eller forutsigbar stabilitet?', ru:'Что для тебя комфортнее: спонтанность или предсказуемая стабильность?' },
  { id: 32, category:'light', en:'How do you spend your perfect day off when you have nothing to do?', no:'Hvordan tilbringer du den perfekte fridagen når du ikke har noe å gjøre?', ru:'Как ты проводишь свой идеальный выходной, если нет никаких дел?' },
  { id: 33, category:'light', en:'Are you more of a homebody, or do you prefer relaxing outside?', no:'Er du mer et hjemmenneske, eller foretrekker du å slappe av utenfor?', ru:'Ты больше «домашний» человек или предпочитаешь отдыхать вне дома?' },
  { id: 34, category:'light', en:'Which film could you watch endlessly without ever getting tired of it?', no:'Hvilken film kan du se om og om igjen uten å bli lei?', ru:'Какой фильм ты можешь пересматривать бесконечно, и он не надоест?' },
  { id: 35, category:'light', en:'Is there a song that always lifts your mood?', no:'Er det en sang som alltid løfter humøret ditt?', ru:'Есть ли песня, которая всегда поднимает тебе настроение?' },
  { id: 36, category:'light', en:'What is your ideal time to fall asleep and wake up?', no:'Hva er din ideelle tid for å sovne og stå opp?', ru:'Во сколько тебе идеальнее всего ложиться спать и просыпаться?' },
  { id: 37, category:'light', en:'What is your favourite and most effective way to rest physically?', no:'Hva er din favoritt og mest effektive måte å hvile fysisk på?', ru:'Какой твой любимый и самый действенный способ физически отдохнуть?' },
  { id: 38, category:'light', en:'Which season best reflects your inner state?', no:'Hvilken årstid gjenspeiler din indre tilstand best?', ru:'Какое время года отражает твое внутреннее состояние?' },
  { id: 39, category:'light', en:'If choosing a getaway right now — a lively sea or a secluded mountain?', no:'Hvis du skulle velge rekreasjon akkurat nå — brusende hav eller avsides fjell?', ru:'Если выбирать отдых прямо сейчас: шумное море или уединенные горы?' },
  { id: 40, category:'light', en:'How much do you need solitude during the week?', no:'Hvor mye trenger du å være alene i løpet av uken?', ru:'Насколько сильно ты нуждаешься в одиночестве в течение недели?' },
  { id: 41, category:'light', en:'What is your comforting daily ritual?', no:'Hva er ditt beroligende daglige ritual?', ru:'Какой у тебя есть «комфортный» ежедневный ритуал?' },
  { id: 42, category:'light', en:'Do you prefer trying new hobbies or returning to familiar ones?', no:'Foretrekker du å prøve nye hobbyer eller gå tilbake til kjente?', ru:'Ты больше любишь пробовать новые хобби или возвращаться к знакомым?' },
  { id: 43, category:'light', en:'Do you have a \'mood item\' (a piece of clothing, a mug, a blanket)?', no:'Har du en \'stemningsgjenstand\' (et plagg, en kopp, et pledd)?', ru:'Есть ли у тебя какая-то «вещь для настроения» (одежда, кружка, плед)?' },
  { id: 44, category:'light', en:'What can quickly help you unwind after a hard day at work?', no:'Hva kan raskt hjelpe deg å slappe av etter en tøff arbeidsdag?', ru:'Что может быстро расслабить тебя после тяжелого рабочего дня?' },
  { id: 45, category:'light', en:'Which activities energise you the most?', no:'Hvilke aktiviteter gir deg mest energi?', ru:'Какие занятия заряжают тебя энергией лучше всего?' },
  { id: 46, category:'light', en:'In a group, do you prefer listening to others\' stories or sharing your own?', no:'I selskap, foretrekker du å høre andres historier eller dele dine egne?', ru:'В компании ты больше любишь слушать чужие истории или рассказывать свои?' },
  { id: 47, category:'light', en:'What food do you associate with absolute comfort and safety?', no:'Hvilken mat forbinder du med absolutt komfort og trygghet?', ru:'Какая еда у тебя ассоциируется с абсолютным уютом и безопасностью?' },
  { id: 48, category:'light', en:'How do you like to spend Friday evenings?', no:'Hvordan liker du å tilbringe fredagskvelden?', ru:'Как ты любишь проводить вечер пятницы?' },
  { id: 49, category:'light', en:'When going on holiday, do you plan an itinerary or improvise on the spot?', no:'Når du reiser på ferie, planlegger du reiseruta eller improviserer du underveis?', ru:'Собираясь в отпуск, ты составляешь маршрут или импровизируешь на месте?' },
  { id: 50, category:'light', en:'What does the word \'comfort\' truly mean to you personally?', no:'Hva betyr ordet «komfort» egentlig for deg personlig?', ru:'Что лично для тебя скрывается за словом «комфорт»?' },
  { id: 51, category:'light', en:'What would be the very first thing you\'d buy for our shared home?', no:'Hva ville du kjøpe aller først til vårt felles hjem?', ru:'Что бы ты самым первым купил(а) в наш общий дом?' },
  { id: 52, category:'light', en:'What does a place where you truly feel good look like visually?', no:'Hvordan ser et sted ut der du virkelig har det bra, visuelt sett?', ru:'Как визуально выглядит место, где тебе по-настоящему хорошо?' },
  { id: 53, category:'light', en:'In everyday life, are you more about strict order or creative chaos?', no:'I hverdagen, er du mer for streng orden eller kreativt kaos?', ru:'В быту ты больше про строгий порядок или про творческий хаос?' },
  { id: 54, category:'light', en:'What is most important to you in organising your living space?', no:'Hva er viktigst for deg når det gjelder å organisere hjemmet?', ru:'Что для тебя самое важное в организации домашнего пространства?' },
  { id: 55, category:'light', en:'How do you feel about uninvited or frequent guests at home?', no:'Hvordan stiller du deg til ubedte eller hyppige gjester hjemme?', ru:'Как ты относишься к незваным или частым гостям в доме?' },
  { id: 56, category:'light', en:'What do you do — light candles, adjust the lighting — to create a sense of cosiness?', no:'Hva gjør du — tenner lys, justerer belysningen — for å skape koselig stemning?', ru:'Что ты делаешь (зажигаешь свечи, включаешь свет), чтобы почувствовать уют?' },
  { id: 57, category:'light', en:'Do you relate more to the rhythm of a big city or the calm of the countryside?', no:'Identifiserer du deg mer med storbyens rytme eller landlivets ro?', ru:'Тебе ближе ритм большого мегаполиса или спокойствие загорода?' },
  { id: 58, category:'light', en:'Where on the planet — or in what state of mind — do you feel most at home?', no:'Hvor på planeten — eller i hvilken sinnstemning — føler du deg mest hjemme?', ru:'В какой точке планеты (или в каком состоянии) ты чувствуешь себя «на своём месте»?' },
  { id: 59, category:'light', en:'When choosing furniture or clothing, which wins — comfort or aesthetics?', no:'Når du velger møbler eller klær, hva vinner — komfort eller estetikk?', ru:'При выборе мебели или одежды, что победит: удобство или эстетика?' },
  { id: 60, category:'light', en:'How often do you feel like rearranging or changing your surroundings?', no:'Hvor ofte har du lyst til å flytte om på ting eller forandre omgivelsene?', ru:'Как часто тебе хочется делать перестановку или менять обстановку вокруг?' },
  { id: 61, category:'light', en:'What role do travel and journeys play in your life?', no:'Hvilken rolle spiller reiser i livet ditt?', ru:'Какое значение в твоей жизни имеют путешествия?' },
  { id: 62, category:'light', en:'Do you prefer the feeling of returning home from a trip or the moment of leaving?', no:'Liker du best følelsen av å komme hjem fra en reise eller øyeblikket du drar?', ru:'Ты больше любишь возвращаться домой из поездки или уезжать?' },
  { id: 63, category:'light', en:'Is there a place on earth you want to return to again and again?', no:'Er det et sted på jord du vil tilbake til igjen og igjen?', ru:'Есть ли место на земле, куда тебе хочется возвращаться снова и снова?' },
  { id: 64, category:'light', en:'Do you prefer a quiet home or one with a lively, bustling atmosphere?', no:'Liker du best at det er stille hjemme, eller at det er liv og røre?', ru:'Тебе нравится, когда дома тихо, или когда кипит живая атмосфера?' },
  { id: 65, category:'light', en:'What does your ideal evening at home together with me look like?', no:'Hvordan ser din ideelle hjemkveld sammen med meg ut?', ru:'Как выглядит твой идеальный совместный вечер дома со мной?' },
  { id: 66, category:'light', en:'Do you lean towards minimalism or do you love accumulating meaningful objects?', no:'Er du mer for minimalisme, eller elsker du å samle på meningsfulle ting?', ru:'Ты склонен(на) к минимализму или любишь обрастать памятными вещами?' },
  { id: 67, category:'light', en:'How important is the view from your window to you?', no:'Hvor viktig er utsikten fra vinduet for deg?', ru:'Насколько для тебя важен вид из окна?' },
  { id: 68, category:'light', en:'Would you rather live at the centre of things or far from the hustle?', no:'Ville du heller bo midt i begivenhetene eller langt fra travelheten?', ru:'Хотел(а) бы ты жить в эпицентре событий или подальше от суеты?' },
  { id: 69, category:'light', en:'What small details make an unfamiliar place feel truly your own?', no:'Hva gjør et ukjent sted til et ekte hjemsted?', ru:'Какие мелочи делают чужое место по-настоящему «своим»?' },
  { id: 70, category:'light', en:'How easily do you adapt to moving to a new place?', no:'Hvor lett tilpasser du deg å flytte til et nytt sted?', ru:'Как легко ты адаптируешься к переезду в новое место?' },
  { id: 71, category:'light', en:'How quickly do you get used to changes in your schedule?', no:'Hvor fort venner du deg til forandringer i timeplanen din?', ru:'Насколько быстро ты привыкаешь к изменениям в графике?' },
  { id: 72, category:'light', en:'What does \'stability\' in life mean to you?', no:'Hva betyr «stabilitet» i livet for deg?', ru:'Что в твоем понимании означает жизненная «стабильность»?' },
  { id: 73, category:'light', en:'At this stage of life, do you choose calm comfort or active growth?', no:'På dette stadiet i livet, velger du rolig komfort eller aktiv vekst?', ru:'На данном этапе жизни ты выбираешь спокойный комфорт или активный рост?' },
  { id: 74, category:'light', en:'If you could describe your ideal life in 10 years in one sentence, what would it be?', no:'Hvis du kunne beskrive ditt ideelle liv om 10 år i én setning, hva ville det vært?', ru:'Если бы ты мог(ла) описать свою идеальную жизнь через 10 лет одним предложением, каким бы оно было?' },
  { id: 75, category:'light', en:'Which of your choices make your life genuinely your own?', no:'Hvilke av valgene dine gjør livet ditt genuint «ditt»?', ru:'Какие твои решения делают твою жизнь по-настоящему «твоей»?' },
  { id: 76, category:'light', en:'What does it mean for you to be completely happy in the moment?', no:'Hva betyr det for deg å være helt lykkelig i øyeblikket?', ru:'Что для тебя значит быть абсолютно счастливым(ой) в моменте?' },
  { id: 77, category:'light', en:'In difficult situations, do you listen to reason or intuition?', no:'I vanskelige situasjoner, hører du på fornuften eller intuisjonen?', ru:'В сложных ситуациях ты слушаешь голос разума или интуицию?' },
  { id: 78, category:'light', en:'What is more fundamental to you — personal freedom or a sense of security?', no:'Hva er viktigere for deg — personlig frihet eller en følelse av trygghet?', ru:'Что для тебя фундаментальнее: личная свобода или чувство безопасности?' },
  { id: 79, category:'light', en:'How long do you think over important life decisions?', no:'Hvor lenge tenker du over viktige livsvalg?', ru:'Как долго ты обдумываешь важные жизненные решения?' },
  { id: 80, category:'light', en:'What do you fear more — doing something and regretting it, or never trying at all?', no:'Hva frykter du mest — å gjøre noe og angre, eller aldri å prøve?', ru:'Чего ты боишься больше: сделать и пожалеть, или не попробовать вообще?' },
  { id: 81, category:'light', en:'What gets you out of bed each morning and keeps you moving?', no:'Hva får deg opp av sengen hver morgen og holder deg i gang?', ru:'Что заставляет тебя вставать по утрам и двигаться вперёд?' },
  { id: 82, category:'light', en:'Do you prefer everything going to plan, or do you love life\'s surprises?', no:'Foretrekker du at alt går etter planen, eller elsker du livets overraskelser?', ru:'Ты предпочитаешь, чтобы всё шло по плану, или любишь сюрпризы судьбы?' },
  { id: 83, category:'light', en:'Which qualities do you value most in friends?', no:'Hvilke egenskaper setter du mest pris på hos venner?', ru:'Какие качества ты ценишь в друзьях больше всего?' },
  { id: 84, category:'light', en:'How do you sense that a new acquaintance could become someone close?', no:'Hvordan kjenner du at en ny bekjent kan bli nær deg?', ru:'По какому признаку ты понимаешь, что новый знакомый может стать тебе близок?' },
  { id: 85, category:'light', en:'Do you easily let new people into your life?', no:'Slipper du lett nye mennesker inn i livet ditt?', ru:'Легко ли ты впускаешь новых людей в свою жизнь?' },
  { id: 86, category:'light', en:'Who would you call \'your kind of person\'?', no:'Hvem ville du kalle «din type person»?', ru:'Кого ты можешь назвать «своим человеком»?' },
  { id: 87, category:'light', en:'With people you don\'t know well, are you the initiator or the listener?', no:'Med mennesker du ikke kjenner godt, er du initiativtakeren eller lytteren?', ru:'В диалоге с малознакомыми людьми ты инициатор или слушатель?' },
  { id: 88, category:'light', en:'How does your stress show outwardly — do you rush, freeze, or get angry?', no:'Hvordan viser stresset ditt seg utvendig — stresser du, fryser du eller blir du sint?', ru:'Как внешне проявляется твой стресс (суетишься, замираешь, злишься)?' },
  { id: 89, category:'light', en:'Who or what helps you best cope with everyday difficulties?', no:'Hvem eller hva hjelper deg best med å takle hverdagslige utfordringer?', ru:'Кто или что лучше всего помогает тебе справляться с бытовыми трудностями?' },
  { id: 90, category:'light', en:'Do you consider yourself an optimist or a tough realist?', no:'Anser du deg selv som optimist eller streng realist?', ru:'Считаешь ли ты себя оптимистом или суровым реалистом?' },
  { id: 91, category:'light', en:'If you could describe love with a single action, what would that action be?', no:'Hvis du kunne beskrive kjærlighet med én handling, hva ville den vært?', ru:'Если описать любовь одним действием, что это будет за действие?' },
  { id: 92, category:'light', en:'Do you believe everything is predetermined, or that we create our own fate?', no:'Tror du alt er forutbestemt, eller at vi skaper vår egen skjebne?', ru:'Ты веришь в то, что всё предрешено, или в то, что мы сами строим судьбу?' },
  { id: 93, category:'light', en:'In any endeavour, is the process or the final result more important to you?', no:'I ethvert prosjekt, er prosessen eller sluttresultatet viktigere for deg?', ru:'В любом деле для тебя важнее процесс или финальный результат?' },
  { id: 94, category:'light', en:'Do your thoughts dwell most in the past, present, or future?', no:'Befinner tankene dine seg oftest i fortiden, nåtiden eller fremtiden?', ru:'Твои мысли чаще находятся в прошлом, настоящем или будущем?' },
  { id: 95, category:'light', en:'In which situations is it hardest for you to be yourself?', no:'I hvilke situasjoner er det vanskeligst for deg å være deg selv?', ru:'В каких ситуациях тебе сложнее всего «быть собой»?' },
  { id: 96, category:'light', en:'Which trait of your character do you value most?', no:'Hvilken egenskap ved karakteren din setter du mest pris på?', ru:'Какую свою черту характера ты ценишь больше всего?' },
  { id: 97, category:'light', en:'In conversation, do you value deep meaning or lightness and humour more?', no:'I samtale, setter du mer pris på dyp mening eller letthet og humor?', ru:'В общении тебе важнее глубокий философский смысл или легкость и юмор?' },
  { id: 98, category:'light', en:'Which hobby makes your life truly interesting?', no:'Hvilken hobby gjør livet ditt genuint interessant?', ru:'Какое увлечение делает твою жизнь по-настоящему интересной?' },
  { id: 99, category:'light', en:'Which of your character traits would you most like to keep into old age?', no:'Hvilken egenskap ved deg selv ønsker du å beholde inn i alderdommen?', ru:'Какую черту своего характера ты хотел(а) бы сохранить до старости?' },
  { id: 100, category:'light', en:'Which quality in a partner do you consider most essential for everyday compatibility?', no:'Hvilken egenskap hos en partner anser du som mest nødvendig for hverdagslig kompatibilitet?', ru:'Какое качество партнера ты считаешь самым необходимым для бытовой совместимости?' },
  { id: 101, category:'light', en:'What is the funniest or most awkward thing that happened on a date before me?', no:'Hva er det morsomste eller mest pinlige som skjedde på en date før meg?', ru:'Какой самый смешной или нелепый случай произошел с тобой на свиданиях до меня?' },
  { id: 102, category:'light', en:'If we could teleport anywhere in the world right now for just one day, where would we go?', no:'Hvis vi kunne teleportere oss til et sted i verden akkurat nå for én dag, hvor ville vi dratt?', ru:'Если бы мы могли прямо сейчас телепортироваться куда угодно на один день, куда бы мы отправились?' },
  { id: 103, category:'deep', en:'What in your childhood has most shaped the way you now build closeness?', no:'Hva i barndommen din har påvirket mest hvordan du nå bygger nærhet?', ru:'Что в твоем детстве сильнее всего повлияло на то, как ты теперь строишь близость?' },
  { id: 104, category:'deep', en:'What did you want to say at the start of our relationship but kept quiet for fear of scaring me off?', no:'Hva ville du si i begynnelsen av forholdet, men holdt tilbake av frykt for å skremme meg?', ru:'Какое воспоминание о нас ты чаще всего прокручиваешь в голове, пытаясь понять, можно ли было поступить иначе?' },
  { id: 105, category:'deep', en:'When did you first realise our connection had become truly significant to you?', no:'Når innså du første gang at forbindelsen vår hadde blitt virkelig viktig for deg?', ru:'Когда ты впервые осознал(а), что наша связь стала для тебя по-настоящему значимой?' },
  { id: 106, category:'deep', en:'Which role — rescuer, victim, parent, child — do you most often notice yourself playing with me?', no:'Hvilken rolle — redningsmann, offer, forelder, barn — merker du oftest at du spiller med meg?', ru:'Есть ли какой-то наш прошлый конфликт, который формально исчерпан, но внутри тебя всё еще «фонит»?' },
  { id: 107, category:'deep', en:'Recall the moment you first started doubting where we were headed.', no:'Husk øyeblikket da du første gang begynte å tvile på hvor vi var på vei.', ru:'Что ты хотел(а) сказать мне в начале отношений, но промолчал(а), боясь спугнуть?' },
  { id: 108, category:'deep', en:'What accidental word or action of mine touched an old wound from your past?', no:'Hvilket tilfeldig ord eller handling fra meg berørte et gammelt sår fra fortiden din?', ru:'Какую поведенческую роль (спасатель, жертва, родитель, ребенок) ты чаще всего ловишь за собой рядом со мной?' },
  { id: 109, category:'deep', en:'At what point in our relationship did you feel you could stop filtering your thoughts around me?', no:'På hvilket tidspunkt i forholdet følte du at du kunne slutte å filtrere tankene dine rundt meg?', ru:'Вспомни момент, когда ты впервые начал(а) сомневаться в том, куда мы движемся?' },
  { id: 110, category:'deep', en:'Which of your flaws did you try to hide from me in the first year we knew each other?', no:'Hvilke av dine feil prøvde du å skjule for meg i det første året vi kjente hverandre?', ru:'Какое мое случайное слово или действие задело твои старые травмы из прошлого?' },
  { id: 111, category:'deep', en:'Is there something small for which you still hold a quiet, unspoken grudge against me?', no:'Er det noe lite du fortsatt bærer et stille, uuttalt nag mot meg for?', ru:'Есть ли мелочь, за которую ты до сих пор держишь на меня неочевидную обиду?' },
  { id: 112, category:'deep', en:'Has it happened that you felt misunderstood but chose not to start an argument over it?', no:'Har det skjedd at du følte deg misforstått, men valgte å ikke starte en krangel?', ru:'В какой момент наших отношений ты почувствовал(а), что можешь не фильтровать свои мысли при мне?' },
  { id: 113, category:'deep', en:'How has your experience in past relationships changed how you express love to me now?', no:'Hvordan har erfaringene dine fra tidligere forhold endret måten du uttrykker kjærlighet til meg?', ru:'Какие свои недостатки ты пытался(лась) скрыть от меня в первый год знакомства?' },
  { id: 114, category:'deep', en:'When did you realise that a part of me had become part of your own identity?', no:'Når innså du at en del av meg hadde blitt en del av din egen identitet?', ru:'Случалось ли так, что ты чувствовал(а) себя непонятым(ой), но решил(а) не поднимать из-за этого ссору?' },
  { id: 115, category:'deep', en:'Have you ever compared our relationship to your parents\'? In whose favour?', no:'Har du noen gang sammenlignet forholdet vårt med foreldrenes? I hvems favør?', ru:'Как твой опыт прошлых отношений изменил то, как ты выражаешь любовь ко мне сейчас?' },
  { id: 116, category:'deep', en:'Is there a mistake you made in our relationship that still gnaws at you?', no:'Er det en feil du har gjort i forholdet som fortsatt gnager deg?', ru:'Когда пришло осознание, что часть меня стала частью твоей собственной идентичности?' },
  { id: 117, category:'deep', en:'What patterns or beliefs from your family did you unconsciously bring into our life together?', no:'Hvilke mønstre eller overbevisninger fra familien din tok du ubevisst med inn i livet vårt?', ru:'Какие установки из своей семьи ты бессознательно перенёс(ла) в наш дом?' },
  { id: 118, category:'deep', en:'Recall a time when you agreed with me for the sake of peace, though you disagreed inside.', no:'Husk en gang da du sa deg enig med meg for fredens skyld, selv om du var uenig inni deg.', ru:'Сравнивал(а) ли ты когда-нибудь наши отношения с отношениями своих родителей? В чью пользу?' },
  { id: 119, category:'deep', en:'Which of your main life fears do you most often project onto our shared future?', no:'Hvilken av dine største livsfrykter projiserer du oftest over på vår felles fremtid?', ru:'Есть ли твоя собственная ошибка в наших отношениях, за которую ты до сих пор себя грызешь?' },
  { id: 120, category:'deep', en:'In which moments do you feel the weight of my expectations on your shoulders?', no:'I hvilke øyeblikk kjenner du tyngden av mine forventninger på skuldrene dine?', ru:'Вспомни ситуацию, когда ты выбрал(а) согласиться со мной ради спокойствия, хотя внутри был(а) против.' },
  { id: 121, category:'deep', en:'Which trait of mine did you idealise at first but now perceive completely differently?', no:'Hvilken egenskap ved meg idealiserte du i begynnelsen, men oppfatter nå helt annerledes?', ru:'Какой свой главный жизненный страх ты чаще всего проецируешь на наше общее будущее?' },
  { id: 122, category:'deep', en:'Was there a time you thought of leaving, but something made you stay? What was it?', no:'Var det en gang du tenkte på å gå, men noe fikk deg til å bli? Hva var det?', ru:'В какие моменты ты чувствуешь груз моих ожиданий на своих плечах?' },
  { id: 123, category:'deep', en:'What did you need from me in the first year that you never fully received?', no:'Hva trengte du fra meg det første året som du aldri fikk fullt ut?', ru:'Какую мою черту ты в начале идеализировал(а), а теперь воспринимаешь совершенно иначе?' },
  { id: 124, category:'deep', en:'If you could erase and rewrite one day from our shared history, which would it be?', no:'Hvis du kunne slette og skrive om én dag fra vår felles historie, hvilken dag ville det vært?', ru:'Был ли трудный период, когда ты думал(а) об уходе, но что-то заставило тебя остаться? Что именно?' },
  { id: 125, category:'deep', en:'When have you had to act unnaturally to smooth over rough edges between us?', no:'Når har du måttet opptre unaturlig for å jevne ut skarpe kanter mellom oss?', ru:'В чем ты нуждался(лась) от меня в первый год, но так и не получил(а) в полной мере?' },
  { id: 126, category:'deep', en:'Which belief about \'how relationships should work\' prevents us from relaxing?', no:'Hvilken overbevisning om «hvordan forhold bør fungere» hindrer oss i å slappe av?', ru:'Если бы можно было стереть и переписать один день из нашей истории, какой бы это был день?' },
  { id: 127, category:'deep', en:'Have you ever used me simply as a safe haven to hide from the outside world?', no:'Har du noen gang brukt meg bare som en trygg havn for å gjemme deg fra omverdenen?', ru:'Когда тебе приходилось вести себя неестественно, чтобы сгладить острые углы между нами?' },
  { id: 128, category:'deep', en:'For which action of mine did you say \'I forgive you\' but emotionally never let it go?', no:'For hvilken handling fra meg sa du «jeg tilgir deg», men slapp aldri taket følelsesmessig?', ru:'Какое твое убеждение о том, «как должны строиться отношения», мешает нам расслабиться?' },
  { id: 129, category:'deep', en:'Which decision you made early in our relationship do you now consider a mistake?', no:'Hvilken beslutning du tok tidlig i forholdet anser du nå som en feil?', ru:'Использовал(а) ли ты когда-нибудь меня просто как безопасную гавань, чтобы спрятаться от внешнего мира?' },
  { id: 130, category:'deep', en:'In which moments with me did you feel truly unseen and unheard?', no:'I hvilke øyeblikk med meg følte du deg virkelig usett og uhørt?', ru:'За какой мой поступок ты сказал(а) «прощаю», но на уровне эмоций так и не отпустил(а)?' },
  { id: 131, category:'deep', en:'What did you desperately want me to understand from your eyes, without a single word?', no:'Hva ønsket du desperat at jeg skulle forstå fra blikket ditt, uten ett eneste ord?', ru:'Какое свое решение, принятое в начале наших отношений, ты сейчас считаешь ошибкой?' },
  { id: 132, category:'deep', en:'Was there a moment you chose your own interests over ours, and you still wonder if it was right?', no:'Var det et øyeblikk da du valgte dine egne interesser over våre, og du fortsatt lurer på om det var riktig?', ru:'В какие моменты рядом со мной ты чувствовал(а), что тебя не видят и не слышат по-настоящему?' },
  { id: 133, category:'deep', en:'Which part of your inner world is still a mystery to me?', no:'Hvilken del av din indre verden er fortsatt et mysterium for meg?', ru:'Что ты тогда отчаянно хотел(а), чтобы я понял(а) по твоим глазам, без единого слова?' },
  { id: 134, category:'deep', en:'How do you see yourself in relation to me right now — as a partner, a friend, a mentor, or a follower?', no:'Hvordan ser du deg selv i forhold til meg akkurat nå — som partner, venn, mentor eller en som følger etter?', ru:'Был ли момент, когда ты выбрал(а) свои интересы в ущерб нашим, и до сих пор сомневаешься, правильно ли поступил(а)?' },
  { id: 135, category:'deep', en:'What thought or news are you afraid to voice to me right this moment?', no:'Hvilken tanke eller nyhet er du redd for å si til meg akkurat nå?', ru:'Какая часть твоего внутреннего мира до сих пор остается для меня загадкой?' },
  { id: 136, category:'deep', en:'In what area of our life together are you not fully honest with me right now?', no:'På hvilket område av livet vårt er du ikke fullt ut ærlig med meg akkurat nå?', ru:'В какой сфере нашей жизни ты сейчас не до конца откровенен(на) со мной?' },
  { id: 137, category:'deep', en:'What habit of mine do you tolerate — but in your heart have never truly accepted?', no:'Hvilken vane av mine tolererer du — men i ditt hjerte aldri virkelig har akseptert?', ru:'Какую мою привычку ты терпишь, но в глубине души так и не принял(а)?' },
  { id: 138, category:'deep', en:'In which moments do you feel the need to build an emotional wall between us?', no:'I hvilke øyeblikk føler du behovet for å bygge en emosjonell vegg mellom oss?', ru:'Кем ты себя чувствуешь рядом со мной прямо сейчас: партнером, другом, наставником или ведомым?' },
  { id: 139, category:'deep', en:'What do you usually do when the fear of being rejected by me awakens inside you?', no:'Hva gjør du vanligvis når frykten for å bli avvist av meg vekkes i deg?', ru:'Какую новость или мысль ты боишься озвучить мне прямо в эту минуту?' },
  { id: 140, category:'deep', en:'How do you privately check how much I love you on any given day?', no:'Hvordan sjekker du privat hvor mye jeg elsker deg på en gitt dag?', ru:'Как ты внутренне проверяешь, насколько сильно я тебя люблю сегодня?' },
  { id: 141, category:'deep', en:'In what non-obvious situations does a desire to control me quietly awaken in you?', no:'I hvilke ikke-åpenbare situasjoner våkner et stille ønske om å kontrollere meg i deg?', ru:'В каких неочевидных ситуациях в тебе просыпается желание контролировать меня?' },
  { id: 142, category:'deep', en:'Which important need of yours — attention, quiet, or tenderness — is not fully being met right now?', no:'Hvilket viktig behov ditt — for oppmerksomhet, stillhet eller ømhet — blir ikke fullt ut dekket akkurat nå?', ru:'В чем именно ты прямо сейчас жертвуешь своим комфортом ради нашего общего блага?' },
  { id: 143, category:'deep', en:'Do moments happen when we are in the same room, but you feel lonely?', no:'Hender det at vi er i samme rom, men du føler deg ensom?', ru:'Случаются ли моменты, когда мы находимся в одной комнате, но ты чувствуешь себя одиноким(ой)?' },
  { id: 144, category:'deep', en:'How do you react when you feel a situation slipping out of your control?', no:'Hvordan reagerer du når du føler at en situasjon glir ut av kontrollen din?', ru:'Какое мое повседневное поведение вызывает у тебя фоновое, невысказанное напряжение?' },
  { id: 145, category:'deep', en:'What do you prefer to keep silent about just to avoid starting an argument out of nowhere?', no:'Hva foretrekker du å holde tyst om bare for å unngå å utløse en krangel?', ru:'Где ты продолжаешь носить маску «идеального партнера», вместо того чтобы просто расслабиться?' },
  { id: 146, category:'deep', en:'In which area of our relationship is your trust in me most fragile?', no:'I hvilken del av forholdet er tilliten din til meg mest skjør?', ru:'Какое мое конкретное действие говорит тебе: «Я тебя люблю» лучше всяких слов?' },
  { id: 147, category:'deep', en:'What do you expect from me day after day, but pride won\'t let you ask directly?', no:'Hva forventer du av meg dag etter dag, men stoltheten hindrer deg i å be om det direkte?', ru:'Чего ты ждешь от меня изо дня в день, но гордость не позволяет тебе попросить об этом прямо?' },
  { id: 148, category:'deep', en:'What happens inside you when I completely fail to meet your expectations?', no:'Hva skjer inni deg når jeg totalt ikke lever opp til forventningene dine?', ru:'Замечаешь ли ты за собой моменты, когда ты неосознанно обесцениваешь мои проблемы?' },
  { id: 149, category:'deep', en:'In which matters do you think you use hidden manipulation to get what you want from me?', no:'I hvilke saker tror du at du bruker skjulte manipulasjoner for å få det du vil fra meg?', ru:'В какие моменты ты чувствуешь необходимость выстроить между нами эмоциональную стену?' },
  { id: 150, category:'deep', en:'When I genuinely don\'t understand your emotions, what do you feel — anger, helplessness, or hurt?', no:'Når jeg genuint ikke forstår følelsene dine, hva kjenner du — sinne, hjelpeløshet eller sår?', ru:'Что ты обычно делаешь, когда внутри просыпается страх быть отвергнутым(ой) мной?' },
  { id: 151, category:'deep', en:'What levers do you use to maintain the balance of power in our relationship?', no:'Hvilke grep bruker du for å opprettholde maktbalansen i forholdet?', ru:'Какая твоя важная потребность (внимании, тишине, ласке) сейчас удовлетворяется не до конца?' },
  { id: 152, category:'deep', en:'Where do you artificially suppress your emotions — both positive and negative — around me?', no:'Hvor undertrykker du kunstig følelsene dine — både positive og negative — rundt meg?', ru:'Как ты реагируешь, когда чувствуешь, что ситуация выходит из-под твоего контроля?' },
  { id: 153, category:'deep', en:'At what point does an ordinary conversation turn into an attack you feel you must defend against?', no:'På hvilket punkt blir en vanlig samtale til et angrep du føler du må forsvare deg mot?', ru:'Что ты предпочитаешь умалчивать, лишь бы не спровоцировать ссору на пустом месте?' },
  { id: 154, category:'deep', en:'Do we know how to assert our personal boundaries without hurting each other?', no:'Klarer vi å hevde våre personlige grenser uten å såre hverandre?', ru:'В какой зоне наших отношений твое доверие ко мне самое хрупкое?' },
  { id: 155, category:'deep', en:'What do you fear more — that the relationship might end, or that you\'ll lose yourself in it?', no:'Hva frykter du mest — at forholdet tar slutt, eller at du mister deg selv i det?', ru:'Что происходит внутри тебя, когда я категорически не оправдываю твои ожидания?' },
  { id: 156, category:'deep', en:'In which ways do you — possibly unconsciously — limit my freedom to be myself?', no:'På hvilke måter begrenser du — muligens ubevisst — min frihet til å være meg selv?', ru:'Как ты думаешь, в каких вопросах ты используешь скрытые манипуляции, чтобы добиться от меня своего?' },
  { id: 157, category:'deep', en:'Do you often feel that your contribution to the relationship is greater than mine?', no:'Tenker du ofte at ditt bidrag til forholdet er større enn mitt?', ru:'Когда я искренне не понимаю твоих эмоций, что ты чувствуешь: злость, бессилие или обиду?' },
  { id: 158, category:'deep', en:'What would you change about me if you had a magic wand, but you\'re afraid to admit it?', no:'Hva ville du endret med meg hvis du hadde en tryllestav, men er redd for å innrømme det?', ru:'Какие рычаги ты используешь, чтобы сохранить баланс власти в наших отношениях?' },
  { id: 159, category:'deep', en:'Don\'t you sometimes feel that we act out of habit rather than genuine desire?', no:'Virker det ikke noen ganger som at vi handler av vane snarere enn av ekte ønske?', ru:'Где ты искусственно сдерживаешь свои эмоции (как позитивные, так и негативные) рядом со мной?' },
  { id: 160, category:'deep', en:'Recall the last time you felt absolute, resonant closeness with me.', no:'Husk siste gang du følte absolutt, dypt gjenklangsfull nærhet med meg.', ru:'В какой момент обычный разговор превращается для тебя в нападение, от которого нужно защищаться?' },
  { id: 161, category:'deep', en:'How do you see us as a couple in 5 years — and is there anything in that picture that worries you?', no:'Hvordan ser du oss som par om 5 år — og er det noe i det bildet som bekymrer deg?', ru:'Умеем ли мы экологично отстаивать свои личные границы, не раня друг друга?' },
  { id: 162, category:'deep', en:'What behaviour of mine, if it became regular, would make you consider leaving?', no:'Hva av min atferd, hvis det ble regelmessig, ville fått deg til å vurdere å gå?', ru:'Чего ты боишься больше: что отношения однажды закончатся, или что ты потеряешь в них свою личность?' },
  { id: 163, category:'deep', en:'Which personal fears prevent you from looking at our future with complete confidence?', no:'Hvilke personlige frykter hindrer deg i å se på vår fremtid med absolutt trygghet?', ru:'В каких аспектах ты (возможно, неосознанно) ограничиваешь мою свободу быть собой?' },
  { id: 164, category:'deep', en:'In which moments do you catch yourself thinking \'What if we really are too different\'?', no:'I hvilke øyeblikk tar du deg selv i å tenke «Hva om vi faktisk er for forskjellige»?', ru:'Часто ли тебя посещает мысль, что твой вклад в отношения больше, чем мой?' },
  { id: 165, category:'deep', en:'Which negative scenario from your past are you afraid of repeating with me?', no:'Hvilket negativt scenario fra din fortid er du redd for å gjenta med meg?', ru:'Что бы ты хотел(а) во мне изменить, если бы у тебя была волшебная палочка, но ты боишься мне в этом признаться?' },
  { id: 166, category:'deep', en:'Which life challenges — financial hardship, illness, or relocation — would you not be ready to face with me?', no:'Hvilke livsprøvelser — pengeproblemer, sykdom eller flytting — ville du ikke vært klar for å gjennomgå med meg?', ru:'Не кажется ли тебе, что иногда мы выбираем действовать по привычке, а не из искреннего желания?' },
  { id: 167, category:'deep', en:'Which hidden trait of yours could destroy the harmony we are building?', no:'Hvilken skjult egenskap ved deg kan ødelegge harmonien vi bygger?', ru:'Вспомни последний раз, когда ты ощущал(а) со мной абсолютную, звенящую близость.' },
  { id: 168, category:'deep', en:'What will you lose if our relationship becomes even more serious and deep?', no:'Hva vil du miste hvis forholdet vårt blir enda mer seriøst og dypere?', ru:'Как ты видишь нашу пару через 5 лет, и есть ли в этой картинке что-то, что тебя настораживает?' },
  { id: 169, category:'deep', en:'In which hypothetical situation would you choose yourself even if it meant the end for us?', no:'I hvilken hypotetisk situasjon ville du velge deg selv selv om det betydde slutten for oss?', ru:'Что в моем поведении должно стать регулярным, чтобы ты задумался(лась) об уходе?' },
  { id: 170, category:'deep', en:'What is the absolute, unforgivable \'point of no return\' for you in any relationship?', no:'Hva er det absolutte, uforgivelige «punktet uten tilbakevending» for deg i ethvert forhold?', ru:'Какие твои личные страхи мешают тебе смотреть в наше будущее с абсолютной уверенностью?' },
  { id: 171, category:'deep', en:'How do you envision the ideal emotional distance between us in the future — closer or further?', no:'Hvordan ser du for deg den ideelle emosjonelle avstanden mellom oss i fremtiden — nærmere eller lengre?', ru:'В какие моменты ты ловишь себя на мысли: «А вдруг мы всё-таки слишком разные»?' },
  { id: 172, category:'deep', en:'What in our relationship is the value you would defend at any cost?', no:'Hva i forholdet er den verdien du vil forsvare for enhver pris?', ru:'Какой негативный сценарий из своей прошлой жизни ты боишься повторить со мной?' },
  { id: 173, category:'deep', en:'If the relationship becomes maximally stable and predictable, will you get bored?', no:'Hvis forholdet blir maksimalt stabilt og forutsigbart, vil du bli lei?', ru:'Какие жизненные испытания (безденежье, болезни, переезды) ты не готов(а) был(а) бы со мной проходить?' },
  { id: 174, category:'deep', en:'Which \'shadow side\' of yours — which I haven\'t seen yet — might emerge over the years?', no:'Hvilken «skyggeside» av deg — som jeg ennå ikke har sett — kan dukke opp over tid?', ru:'Какая твоя скрытая черта характера способна разрушить ту гармонию, которую мы строим?' },
  { id: 175, category:'deep', en:'If passion transforms into routine over time, how will you handle that?', no:'Hvis lidenskap omdannes til rutine over tid, hvordan vil du håndtere det?', ru:'Чего ты лишишься, если наши отношения станут еще более серьезными и глубокими?' },
  { id: 176, category:'deep', en:'Under what circumstances would you give up fighting to restore our connection?', no:'Under hvilke omstendigheter ville du gi opp å kjempe for å gjenopprette forbindelsen vår?', ru:'В какой гипотетической ситуации ты выберешь себя, даже если это будет означать конец для нас?' },
  { id: 177, category:'deep', en:'In a crisis, do we tend to come together or drift apart?', no:'I en krise, pleier vi å samle oss eller fjerne oss fra hverandre?', ru:'Что для тебя является абсолютной, непростительной «точкой невозврата» в любых отношениях?' },
  { id: 178, category:'deep', en:'Where do you most fear repeating the same mistakes as in your previous relationships?', no:'Hvor er du mest redd for å gjøre de samme feilene som i tidligere forhold?', ru:'Как ты представляешь себе нормальную эмоциональную дистанцию между нами в будущем (ближе или дальше)?' },
  { id: 179, category:'deep', en:'What topic do you consider absolutely taboo, even after years together?', no:'Hvilket tema anser du som absolutt tabu, selv etter år sammen?', ru:'Что в наших отношениях является той ценностью, которую ты будешь защищать любой ценой?' },
  { id: 180, category:'deep', en:'If you ever become disappointed in me as a person, will you say so or quietly leave?', no:'Hvis du noen gang blir skuffet i meg som person, vil du si det eller stille gå?', ru:'Если отношения станут максимально стабильными и предсказуемыми, не станет ли тебе скучно?' },
  { id: 181, category:'deep', en:'Which aspects of our future life would you like to control entirely yourself?', no:'Hvilke aspekter av vår fremtidige liv ville du ønske å kontrollere helt selv?', ru:'Какая твоя "теневая" сторона, которую я еще не видел(а), может проявиться спустя годы?' },
  { id: 182, category:'deep', en:'What might cause you to start emotionally withdrawing from me while still living together?', no:'Hva kan føre til at du begynner å trekke deg emosjonelt fra meg mens dere bor sammen?', ru:'Если страсть и яркие чувства со временем трансформируются в привычку, как ты будешь с этим справляться?' },
  { id: 183, category:'deep', en:'What is your biggest fear when you think of the phrase \'together forever\'?', no:'Hva er din største frykt når du tenker på frasen «for alltid sammen»?', ru:'При каком раскладе ты опустишь руки и перестанешь бороться за восстановление нашей связи?' },
  { id: 184, category:'deep', en:'If our values diverge drastically in 10 years, what will keep us together?', no:'Hvis verdiene våre skiller seg drastisk om 10 år, hva vil holde oss sammen?', ru:'Как мы обычно ведем себя в кризисных ситуациях: объединяемся или отдаляемся?' },
  { id: 185, category:'deep', en:'At what point does a person in a couple stop feeling part of \'we\' and become only \'I\' again?', no:'På hvilket tidspunkt slutter en person i et par å føle seg som «vi» og blir bare «jeg» igjen?', ru:'Где ты больше всего боишься наступить на те же грабли, что и в предыдущих отношениях?' },
  { id: 186, category:'deep', en:'If our relationship were to end, what would that ending look like in your mind?', no:'Hvis forholdet vårt skulle ta slutt, hvordan ville du forestille deg den avslutningen?', ru:'Какую тему ты считаешь абсолютным табу для обсуждения, даже спустя годы совместной жизни?' },
  { id: 187, category:'deep', en:'What fact from your life do you want me to never, under any circumstances, find out?', no:'Hvilken fakta fra livet ditt ønsker du at jeg aldri, under noen omstendigheter, skal finne ut?', ru:'Если ты когда-нибудь разочаруешься во мне как в личности, ты скажешь это или молча уйдешь?' },
  { id: 188, category:'deep', en:'Is there a truth about you that could completely overturn my perception of you?', no:'Er det en sannhet om deg som kan snu oppfatningen min av deg helt på hodet?', ru:'Какие аспекты нашей жизни в будущем ты хотел(а) бы полностью контролировать сам(а)?' },
  { id: 189, category:'deep', en:'What must be present in our relationship every day for you to want to stay for life?', no:'Hva må være til stede i forholdet vårt hver dag for at du skal ønske å bli i det hele livet?', ru:'Из-за чего ты можешь начать эмоционально отдаляться от меня, даже продолжая жить вместе?' },
  { id: 190, category:'deep', en:'In which moments do you doubt whether you are a good enough partner for me?', no:'I hvilke øyeblikk tviler du på om du er god nok partner for meg?', ru:'В чем заключается твой самый большой страх, когда ты думаешь о фразе «вместе навсегда»?' },
  { id: 191, category:'deep', en:'Which part of yourself or your energy are you afraid to give me fully?', no:'Hvilken del av deg selv eller din energi er du redd for å gi meg fullt ut?', ru:'Если через 10 лет наши интересы и ценности кардинально разойдутся, что нас удержит вместе?' },
  { id: 192, category:'deep', en:'By what inner feeling will you know that love in your heart has ended?', no:'Hvilken indre følelse vil fortelle deg at kjærligheten i hjertet ditt er over?', ru:'В какой момент человек в паре перестает чувствовать себя частью «мы» и снова становится только «я»?' },
  { id: 193, category:'deep', en:'If we could relive our relationship from the start with the knowledge we have now, what would you do differently?', no:'Hvis vi kunne leve forholdet om igjen fra begynnelsen med dagens kunnskap, hva ville du gjort annerledes?', ru:'Если бы наши отношения подошли к концу, как бы выглядел этот финал в твоем представлении?' },
  { id: 194, category:'deep', en:'When you are deeply tired physically and emotionally, how does your attitude towards me change?', no:'Når du er dypt sliten fysisk og følelsesmessig, hvordan endres holdningen din til meg?', ru:'О каком факте из твоей жизни ты хочешь, чтобы я никогда, ни при каких обстоятельствах не узнал(а)?' },
  { id: 195, category:'deep', en:'If our plans suddenly fall apart through no fault of ours, who usually panics first?', no:'Hvis planene våre plutselig faller fra hverandre uten vår skyld, hvem panikker vanligvis først?', ru:'Существует ли правда о тебе, способная перевернуть мое представление о тебе на 180 градусов?' },
  { id: 196, category:'deep', en:'When you are criticised — even fairly — what do you feel inside in the very first seconds?', no:'Når du kritiseres — selv rettferdig — hva kjenner du inni deg de aller første sekundene?', ru:'Что должно ежедневно присутствовать в наших отношениях, чтобы ты хотел(а) оставаться в них всю жизнь?' },
  { id: 197, category:'deep', en:'After making a mistake, do you tend to dwell in self-criticism or forgive yourself quickly?', no:'Etter å ha gjort en feil, pleier du å gruble på selvkritikk eller tilgi deg selv raskt?', ru:'В какие моменты ты сомневаешься, достаточно ли ты хороший партнер для меня?' },
  { id: 198, category:'deep', en:'Which memory of us do you most often replay, wondering if things could have been different?', no:'Hvilket minne om oss gjenspiller du oftest, og lurer på om ting kunne vært annerledes?', ru:'Какую часть себя или своей энергии ты боишься отдавать мне на 100%?' },
  { id: 199, category:'deep', en:'Is there a past conflict between us that is formally resolved but still lingers inside you?', no:'Er det en tidligere konflikt mellom oss som formelt er løst, men som fortsatt ulmer i deg?', ru:'По какому внутреннему ощущению ты поймешь, что любовь в твоем сердце закончилась?' },
  { id: 200, category:'deep', en:'Which specific action of mine tells you \'I love you\' better than any words?', no:'Hvilken konkret handling fra meg sier deg «Jeg elsker deg» bedre enn noen ord?', ru:'Если бы мы могли прожить наши отношения с самого начала, имея нынешний опыт — что бы ты сделал(а) иначе?' },
  { id: 201, category:'deep', en:'Do you notice moments when you unconsciously dismiss or minimise my problems?', no:'Merker du øyeblikk der du ubevisst avviser eller bagatelliserer problemene mine?', ru:'Когда ты сильно устаёшь физически и морально — как меняется твое отношение ко мне?' },
  { id: 202, category:'deep', en:'In which moments do you feel the need to put up an emotional wall between us?', no:'I hvilke øyeblikk føler du behovet for å sette opp en emosjonell vegg mellom oss?', ru:'Если наши планы резко рушатся не по нашей вине — кто из нас обычно паникует первым?' },
  { id: 203, category:'deep', en:'What do you do when you sense I might misunderstand the most vulnerable part of you?', no:'Hva gjør du når du kjenner at jeg kan misforstå den mest sårbare delen av deg?', ru:'Когда тебя критикуют (даже справедливо), что ты чувствуешь внутри в самые первые секунды?' },
  { id: 204, category:'deep', en:'What do you hope for from our relationship in the next six months that you don\'t dare say aloud?', no:'Hva håper du på fra forholdet de neste seks månedene som du ikke tør si høyt?', ru:'Совершив ошибку, ты склонен(на) заниматься самоедством или быстро себя прощаешь?' },
  { id: 205, category:'bold', en:'Was there a period when you stayed with me not out of love, but out of fear of loneliness or losing comfort?', no:'Var det en periode da du ble hos meg ikke av kjærlighet, men av frykt for ensomhet eller tap av komfort?', ru:'Был ли период, когда ты оставался(лась) со мной не из-за любви, а из страха одиночества или потери комфорта?' },
  { id: 206, category:'bold', en:'What truth about us do you so carefully hide even from yourself, so as not to hurt yourself?', no:'Hvilken sannhet om oss skjuler du så nøye selv for deg selv, for ikke å gjøre deg selv vondt?', ru:'Какую правду о нас ты так тщательно скрываешь от самого(ой) себя, чтобы не делать себе больно?' },
  { id: 207, category:'bold', en:'Do you admit that you sometimes use me as a tool to fill your inner void and insecurity?', no:'Innrømmer du at du av og til bruker meg som et verktøy for å fylle din indre tomhet og usikkerhet?', ru:'Признайся, используешь ли ты меня иногда как инструмент, чтобы закрыть свою внутреннюю пустоту и неуверенность?' },
  { id: 208, category:'bold', en:'In which specific situations do you deliberately press my weak spots to control me?', no:'I hvilke konkrete situasjoner presser du bevisst på svake punktene mine for å styre meg?', ru:'В каких конкретно ситуациях ты намеренно давишь на мои слабые места, чтобы управлять мной?' },
  { id: 209, category:'bold', en:'Does it happen that I cause you strong irritation, but you put on a smile and endure it?', no:'Hender det at jeg vekker sterk irritasjon i deg, men du setter på et smil og holder det inne?', ru:'Бывает ли так, что я вызываю у тебя сильное раздражение, но ты натягиваешь улыбку и терпишь?' },
  { id: 210, category:'bold', en:'How strongly does your mood and self-esteem depend on my approval and praise?', no:'Hvor sterkt avhenger humøret og selvtilliten din av min godkjenning og ros?', ru:'Насколько сильно твое настроение и самооценка зависят от моего одобрения и похвалы?' },
  { id: 211, category:'bold', en:'What do you fear more — that I\'ll see you as you truly are and be disappointed, or that you\'ll be disappointed in me?', no:'Hva frykter du mest — at jeg ser deg som du virkelig er og blir skuffet, eller at du blir skuffet i meg?', ru:'Чего ты боишься больше: что я увижу тебя настоящим(ей) и разочаруюсь, или что ты разочаруешься во мне?' },
  { id: 212, category:'bold', en:'What do you continue to tolerate in my character purely out of fear that we\'d break up otherwise?', no:'Hva fortsetter du å tolerere ved min karakter utelukkende av frykt for at vi ellers ville brutt opp?', ru:'Что ты продолжаешь терпеть в моем характере исключительно из страха, что иначе мы расстанемся?' },
  { id: 213, category:'bold', en:'In which moments do you belittle my achievements or feelings just to assert yourself?', no:'I hvilke øyeblikk bagatelliserer du prestasjonene eller følelsene mine bare for å hevde deg?', ru:'В какие моменты ты обесцениваешь мои достижения или чувства просто для того, чтобы самоутвердиться?' },
  { id: 214, category:'bold', en:'Which of your acquaintances or exes do you most often compare me to — and in whose favour?', no:'Hvilke bekjente eller eks sammenligner du meg oftest med — og i hvems favør?', ru:'С кем из своих знакомых или бывших ты чаще всего сравниваешь меня в своей голове (и в чью пользу)?' },
  { id: 215, category:'bold', en:'What methods do you resort to when you feel me emotionally distancing or losing interest in you?', no:'Hvilke metoder tar du i bruk når du føler at jeg trekker meg emosjonelt eller mister interesse for deg?', ru:'К каким методам ты прибегаешь, если чувствуешь, что я эмоционально отдаляюсь или теряю к тебе интерес?' },
  { id: 216, category:'bold', en:'Was there a moment when you had already decided inside to leave, but physically kept staying?', no:'Var det et øyeblikk da du allerede inni deg hadde bestemt deg for å gå, men fysisk fortsatte å bli?', ru:'Был ли момент, когда ты уже принял(а) решение уйти внутри себя, но физически продолжал(а) находиться рядом?' },
  { id: 217, category:'bold', en:'In which aspects do you systematically and consciously violate or ignore my personal boundaries?', no:'I hvilke aspekter bryter du systematisk og bevisst mine personlige grenser?', ru:'В каких аспектах ты систематически и осознанно нарушаешь или игнорируешь мои личные границы?' },
  { id: 218, category:'bold', en:'What desire towards me feels too bold or far-fetched to say out loud?', no:'Hvilken lengsel etter meg føles for dristig eller urealistisk til å si høyt?', ru:'Какое твое желание ко мне кажется тебе «слишком наглым» или масштабным, чтобы произнести его вслух?' },
  { id: 219, category:'bold', en:'Where in our relationship are you right now playing a role, imitating emotions that don\'t actually exist?', no:'Hvor i forholdet spiller du akkurat nå en rolle og later som om du har følelser som egentlig ikke finnes?', ru:'Где прямо сейчас в наших отношениях ты отыгрываешь роль, имитируя эмоции, которых на самом деле нет?' },
  { id: 220, category:'bold', en:'Are there moments when instead of warmth you feel absolute, icy coldness towards me?', no:'Er det øyeblikk der du i stedet for varme kjenner absolutt, iskald kulde overfor meg?', ru:'Случаются ли моменты, когда вместо тепла ты испытываешь ко мне абсолютный, ледяной холод?' },
  { id: 221, category:'bold', en:'What phrase from me do you fear hearing more than anything in the world?', no:'Hvilken frase fra meg frykter du å høre mer enn noe annet i verden?', ru:'Какую фразу из моих уст ты боишься услышать больше всего на свете?' },
  { id: 222, category:'bold', en:'How do you manipulate my sense of guilt or compassion when it suits you?', no:'Hvordan manipulerer du skyldfølelsen eller medfølelsen min når det passer deg?', ru:'Как именно ты манипулируешь моим чувством вины или жалостью, когда тебе это выгодно?' },
  { id: 223, category:'bold', en:'In which moments do you feel that my love is \'smothering\' you or hindering your development?', no:'I hvilke øyeblikk føler du at min kjærlighet «kveler» deg eller hindrer utviklingen din?', ru:'В какие моменты ты чувствуешь, что моя любовь тебя «душит» или мешает твоему развитию?' },
  { id: 224, category:'bold', en:'About what do you suppress your anger toward me, afraid that if you let it out there will be an explosion?', no:'Hva holder du tilbake aggresjon mot meg for, redd for at hvis du slipper den løs, blir det en eksplosjon?', ru:'По какому поводу ты подавляешь в себе агрессию на меня, боясь, что если выпустишь её — будет взрыв?' },
  { id: 225, category:'bold', en:'What part of our relationship is held together only by habit and fear of change, not by a living feeling?', no:'Hvilken del av forholdet vårt holdes oppe utelukkende av vane og endringsangst, ikke av levende følelser?', ru:'Какая часть наших отношений держится исключительно на привычке и страхе перемен, а не на живом чувстве?' },
  { id: 226, category:'bold', en:'Have you ever felt trapped being with me?', no:'Har du noen gang følt deg fanget ved å være sammen med meg?', ru:'Чувствовал(а) ли ты когда-нибудь себя в ловушке, находясь рядом со мной?' },
  { id: 227, category:'bold', en:'Which facet of your character do you deliberately hide from me to maintain the image of a \'convenient\' partner?', no:'Hvilken side av karakteren din skjuler du bevisst for meg for å opprettholde bildet av en «bekvem» partner?', ru:'Какую грань своего характера ты намеренно прячешь от меня, создавая образ «удобного» партнера?' },
  { id: 228, category:'bold', en:'How do you secretly \'test\' me to confirm my faithfulness?', no:'Hvordan «tester» du meg hemmelig for å bekrefte min troskap?', ru:'Как именно ты устраиваешь мне скрытые «проверки на прочность», чтобы убедиться в моей верности?' },
  { id: 229, category:'bold', en:'In which situations do you exercise total control over my life because you don\'t trust me?', no:'I hvilke situasjoner utøver du total kontroll over livet mitt fordi du ikke stoler på meg?', ru:'В каких ситуациях ты выбираешь тотальный контроль над моей жизнью, потому что не доверяешь мне?' },
  { id: 230, category:'bold', en:'If you are completely honest — what about me infuriates you but you have never said it?', no:'Hvis du er helt ærlig — hva ved meg gjør deg rasende, men som du aldri har sagt?', ru:'Если говорить максимально честно: что тебя во мне бесит, но ты никогда этого не говорил(а)?' },
  { id: 231, category:'bold', en:'Were there moments when you dissolved into me so completely that you forgot who you were outside this relationship?', no:'Var det øyeblikk da du smeltet så helt inn i meg at du glemte hvem du var utenfor dette forholdet?', ru:'Были ли моменты, когда ты растворялся(лась) во мне настолько, что забывал(а), кто ты есть вне этих отношений?' },
  { id: 232, category:'bold', en:'How often do you build invisible distance just to protect yourself from potential pain?', no:'Hvor ofte bygger du usynlig avstand bare for å beskytte deg mot potensiell smerte?', ru:'Как часто ты выстраиваешь между нами невидимую дистанцию, просто чтобы обезопасить себя от потенциальной боли?' },
  { id: 233, category:'bold', en:'Setting aside romance and feelings: what practical or material benefit do you get from our union?', no:'Ser vi bort fra romantikk og følelser: hvilken praktisk eller materiell fordel får du av partnerskapet vårt?', ru:'Если отбросить романтику и чувства: какую практическую или материальную выгоду ты получаешь от нашего союза?' },
  { id: 234, category:'bold', en:'In which moments do you look at me and think: \'You owe me\'?', no:'I hvilke øyeblikk ser du på meg og tenker: «Du skylder meg»?', ru:'В какие моменты ты смотришь на меня и думаешь: «Ты мне должен/должна»?' },
  { id: 235, category:'bold', en:'How often do you talk not to the real me, but to an illusory image you have made up yourself?', no:'Hvor ofte snakker du ikke med det virkelige meg, men med et illusorisk bilde du selv har skapt?', ru:'Как часто ты общаешься не с реальным(ой) мной, а с иллюзорным образом, который сам(а) себе придумал(а)?' },
  { id: 236, category:'bold', en:'What fundamental things between us are already broken, but we carefully pretend not to notice?', no:'Hvilke grunnleggende ting mellom oss er allerede ødelagt, men vi later nøye som om vi ikke merker det?', ru:'Какие фундаментальные вещи между нами уже сломаны, но мы старательно закрываем на это глаза?' },
  { id: 237, category:'bold', en:'If you knew for certain I would never find out about an infidelity, would you give in to temptation?', no:'Hvis du visste med sikkerhet at jeg aldri ville finne ut om en utroskap, ville du gitt etter for fristelsen?', ru:'Если бы ты точно знал(а), что я никогда не узнаю об измене (физической или эмоциональной), ты бы поддался(лась) соблазну?' },
  { id: 238, category:'bold', en:'What in your behaviour or thinking is a time bomb for our relationship?', no:'Hva ved din atferd eller tankegang er en tidsbombe for forholdet vårt?', ru:'Что в твоем поведении или образе мышления является бомбой замедленного действия для нашей пары?' },
  { id: 239, category:'bold', en:'In which future situation would you definitely choose your fear and flee rather than move towards closeness?', no:'I hvilken fremtidig situasjon ville du definitivt velge frykten og flykte snarere enn å nærme deg?', ru:'В какой ситуации в будущем ты гарантированно выберешь свой страх и сбежишь, вместо того чтобы пойти в сближение?' },
  { id: 240, category:'bold', en:'By which scenario would you slowly push me out of your life if your feelings began to fade?', no:'Etter hvilket scenario ville du sakte skyve meg ut av livet ditt hvis følelsene begynte å falme?', ru:'По какому сценарию ты начнешь медленно вытеснять меня из своей жизни, если чувства начнут угасать?' },
  { id: 241, category:'bold', en:'How would you justify to yourself your reluctance to work on the relationship when a crisis begins?', no:'Hvordan ville du rettferdiggjøre for deg selv din motvilje mot å jobbe med forholdet når en krise begynner?', ru:'Как ты будешь оправдывать перед собой свое нежелание работать над отношениями, когда начнется кризис?' },
  { id: 242, category:'bold', en:'What would you be fatally missing with me for you to start seeking comfort elsewhere?', no:'Hva ville du savne fatalt med meg for å begynne å søke trøst andre steder?', ru:'Чего тебе должно фатально не хватать со мной, чтобы ты начал(а) искать утешение на стороне?' },
  { id: 243, category:'bold', en:'In what area do you categorically refuse to change or grow, even knowing it is destroying us?', no:'I hvilken sone nekter du kategorisk å endre deg eller vokse, selv om du vet at det ødelegger oss?', ru:'В чем ты категорически отказываешься меняться или расти, даже если понимаешь, что это разрушает нас?' },
  { id: 244, category:'bold', en:'After which word or action of mine would you forever stop fighting for us?', no:'Etter hvilket ord eller handling fra meg ville du for alltid slutte å kjempe for oss?', ru:'После какого моего слова или действия ты навсегда перестанешь за нас бороться?' },
  { id: 245, category:'bold', en:'What dark need of yours — for dominance, humiliation, or submission — frightens even you?', no:'Hvilket mørkt behov ditt — for dominans, ydmykelse eller underkastelse — skremmer selv deg?', ru:'Какая твоя темная потребность (в доминировании, унижении, подчинении) пугает тебя самого(у)?' },
  { id: 246, category:'bold', en:'If we have a big fight, how soon do you start devaluing all the good that existed between us?', no:'Hvis vi krangler mye, hvor snart begynner du å avverdige alt det gode som fantes mellom oss?', ru:'Если мы сильно поругаемся, как скоро ты начнешь обесценивать всё хорошее, что между нами было?' },
  { id: 247, category:'bold', en:'At what point are you ready to sacrifice my interests for the sake of your ego or career?', no:'På hvilket punkt er du klar til å ofre mine interesser til fordel for egoet eller karrieren din?', ru:'В какой момент ты готов(а) пожертвовать моими интересами ради своего эго или карьеры?' },
  { id: 248, category:'bold', en:'What will you be lying to me about in 10 years to preserve the appearance of an ideal family?', no:'Hva vil du lyve til meg om om 10 år for å bevare fasaden av en ideell familie?', ru:'О чем ты будешь врать мне через 10 лет, чтобы сохранить видимость идеальной семьи?' },
  { id: 249, category:'bold', en:'What must happen for you to look at me and know you have lost all respect for me forever?', no:'Hva må skje for at du ser på meg og vet at du har mistet all respekt for meg for alltid?', ru:'Что должно произойти, чтобы ты посмотрел(а) на меня и понял(а), что навсегда потерял(а) ко мне уважение?' },
  { id: 250, category:'bold', en:'How exactly will you create a chasm between us, hiding behind excuses like \'I\'m just tired from work\'?', no:'Nøyaktig hvordan vil du skape en avgrunn mellom oss, gjemt bak unnskyldninger som «jeg er bare sliten fra jobb»?', ru:'Как именно ты будешь создавать пропасть между нами, прикрываясь отговорками типа «я просто устал(а) на работе»?' },
  { id: 251, category:'bold', en:'For what act will you never forgive me, even if you say out loud: \'Everything is fine\'?', no:'For hvilken handling vil du aldri tilgi meg, selv om du sier høyt: «Alt er bra»?', ru:'За какой поступок ты не простишь меня никогда, даже если на словах скажу: «Всё в порядке»?' },
  { id: 252, category:'bold', en:'When will you start seeking new sensations outside our relationship — out of boredom or out of pain?', no:'Når vil du begynne å søke nye opplevelser utenfor forholdet vårt — av kjedsomhet eller smerte?', ru:'Когда ты начнешь искать новых эмоций вне наших отношений: от скуки или от боли?' },
  { id: 253, category:'bold', en:'Do you realise which micro-actions of yours are right now eroding our trust?', no:'Er du klar over hvilke mikro-handlinger av deg som akkurat nå undergraver tilliten vår?', ru:'Осознаешь ли ты, какими именно своими микро-действиями ты прямо сейчас разрушаешь наше доверие?' },
  { id: 254, category:'bold', en:'Which important and honest conversations with me do you avoid most often?', no:'Hvilke viktige og ærlige samtaler med meg unngår du oftest?', ru:'От каких важных и честных разговоров со мной ты уклоняешься чаще всего?' },
  { id: 255, category:'bold', en:'Has there already been a moment in our history when you chose the \'convenience\' of being with me over genuine love?', no:'Har det allerede vært et øyeblikk i vår felles historie der du valgte «bekvemmeligheten» av å være med meg fremfor ekte kjærlighet?', ru:'Был ли уже в нашей истории момент, когда ты выбрал(а) «удобство» быть со мной вместо искренней любви?' },
  { id: 256, category:'bold', en:'What inner mantra or excuse will you use to justify your departure?', no:'Hvilken indre mantra eller unnskyldning vil du bruke for å rettferdiggjøre avreisen din?', ru:'Какую внутреннюю мантру или отговорку ты будешь использовать, чтобы оправдать свой уход?' },
  { id: 257, category:'bold', en:'In which area of our life have you stopped being honest — not only with me, but with yourself?', no:'I hvilken sone av livet vårt har du sluttet å være ærlig — ikke bare med meg, men med deg selv?', ru:'В какой сфере нашей жизни ты перестал(а) быть честным(ой) не только со мной, но и с собой?' },
  { id: 258, category:'bold', en:'Under what circumstances would you begin living a \'parallel life\', hiding your true interests from me?', no:'Under hvilke omstendigheter ville du begynne å leve et «parallelt liv» og skjule dine sanne interesser fra meg?', ru:'При каком раскладе ты начнешь жить «параллельной жизнью», скрывая от меня свои истинные интересы?' },
  { id: 259, category:'bold', en:'How long can you accumulate dissatisfaction and endure before you explode and destroy everything around you?', no:'Hvor lenge kan du samle misnøye og holde ut før du eksploderer og ødelegger alt rundt deg?', ru:'Как долго ты способен(на) копить в себе недовольство и терпеть, прежде чем взорвешься и уничтожишь всё вокруг?' },
  { id: 260, category:'bold', en:'Where do you store your grievances against me, and how do they slowly poison your daily life?', no:'Hvor lagrer du klagene dine mot meg, og hvordan forgifter de sakte hverdagen din?', ru:'Куда ты складываешь свои обиды на меня, и как они потом отравляют наши будни?' },
  { id: 261, category:'bold', en:'If one day you wake up and realise love is gone, how long will you drag things out before saying so?', no:'Hvis du en dag våkner og innser at kjærligheten er borte, hvor lenge vil du dra ting ut før du sier det?', ru:'Если однажды ты проснешься и поймешь, что любви больше нет, как долго ты будешь тянуть время перед тем, как сказать об этом?' },
  { id: 262, category:'bold', en:'What will you do if in a few years I change radically and no longer match the image in your head?', no:'Hva vil du gjøre hvis jeg om noen år endrer meg radikalt og ikke lenger matcher bildet i hodet ditt?', ru:'Что ты сделаешь, если через пару лет я кардинально изменюсь и перестану соответствовать картинке в твоей голове?' },
  { id: 263, category:'bold', en:'How quickly will you pretend \'everything is fine\' if we are actually on the verge of a break-up?', no:'Hvor raskt vil du late som «alt er bra» hvis vi faktisk er på randen av et brudd?', ru:'Как быстро ты начнешь притворяться, что «всё нормально», если на самом деле мы будем на грани разрыва?' },
  { id: 264, category:'bold', en:'In what devious way will you punish me with the absence of closeness for my wrongdoings?', no:'På hvilken utspekulert måte vil du straffe meg med mangel på nærhet for mine feiltrinn?', ru:'Каким изощренным способом ты будешь наказывать меня отсутствием близости за мои проступки?' },
  { id: 265, category:'bold', en:'Can you imagine a situation where you stay with me out of pity or a sense of duty?', no:'Kan du se for deg en situasjon der du blir hos meg av medlidenhet eller pliktfølelse?', ru:'Можешь ли ты представить ситуацию, в которой останешься со мной из жалости или из чувства долга?' },
  { id: 266, category:'bold', en:'What must break in me — loss of ambition, weakness, illness — for you to be definitively disappointed in me?', no:'Hva må bryte i meg — tap av ambisjoner, svakhet, sykdom — for at du skal bli endelig skuffet i meg?', ru:'Что должно сломаться во мне (потеря амбиций, слабость, болезнь), чтобы ты окончательно во мне разочаровался(лась)?' },
  { id: 267, category:'bold', en:'To what extent are you ready to betray and destroy yourself just so I don\'t leave?', no:'I hvilken grad er du klar til å forråde og ødelegge deg selv bare for at jeg ikke skal gå?', ru:'В чем ты готов(а) предать и разрушить самого(у) себя, только чтобы я не ушел(ла)?' },
  { id: 268, category:'bold', en:'What betrayal of mine — apart from physical infidelity — would be the point of no return?', no:'Hvilken svik fra meg — bortsett fra fysisk utroskap — ville vært punktet uten tilbakevending?', ru:'Какое мое предательство (помимо измены) станет точкой, откуда не будет пути назад?' },
  { id: 269, category:'bold', en:'How would you explain your lies to yourself if you decided to lead a double life?', no:'Hvordan ville du forklare løgnene dine for deg selv hvis du bestemte deg for å leve et dobbeltliv?', ru:'Как ты будешь объяснять самому(ой) себе свою ложь, если решишь вести двойную жизнь?' },
  { id: 270, category:'bold', en:'If today were our last day together before a final separation — what is the bitterest truth you would tell me?', no:'Hvis i dag var vår siste dag sammen før endelig brudd — hvilken bitterste sannhet ville du ha sagt til meg?', ru:'Если бы сегодня был наш последний день вместе перед окончательным расставанием — какую самую горькую правду ты бы мне высказал(а)?' },
  { id: 271, category:'bold', en:'If you knew you were seriously ill and had little time — how would you allocate that time for us?', no:'Hvis du visste at du var alvorlig syk og hadde lite tid — hvordan ville du fordelt den tiden for oss?', ru:'Если со мной случится беда и я навсегда потеряю способность ухаживать за собой, как долго ты сможешь быть сиделкой без ненависти ко мне?' },
  { id: 272, category:'bold', en:'Would you have the courage to admit it if caring for me became an unbearable burden?', no:'Ville du ha mot til å innrømme det hvis det å ta vare på meg ble en uutholdelig byrde?', ru:'Если врачи дадут мне месяц жизни, как бы ты распределил(а) это время и принимал(а) решения за нас двоих?' },
  { id: 273, category:'bold', en:'If my personality changed due to trauma or depression, what would help you still see the old me?', no:'Hvis personligheten min endret seg på grunn av traumer eller depresjon, hva ville hjelpe deg med å fortsatt se meg fra før?', ru:'Хватит ли у тебя смелости признаться, если уход за мной станет для тебя непосильной ношей?' },
  { id: 274, category:'bold', en:'Is there a clear internal line where you would say: \'I can no longer cope — I\'m leaving to save myself\'?', no:'Er det en klar indre grense der du ville sagt: «Jeg klarer ikke mer — jeg drar for å redde meg selv»?', ru:'Если моя личность изменится из-за травмы или депрессии, что поможет тебе видеть во мне прежнего человека?' },
  { id: 275, category:'bold', en:'If I lost the ability to earn and my ambitions permanently, would you start to look down on me for weakness?', no:'Hvis jeg permanent mistet evnen til å tjene penger og ambisjonene mine, ville du begynt å se ned på meg for svakhet?', ru:'Есть ли у тебя четкая внутренняя граница, где ты скажешь: «Я больше не справляюсь, я ухожу ради своего спасения»?' },
  { id: 276, category:'bold', en:'How quickly will you burn out if I need your total emotional support every day?', no:'Hvor raskt vil du brenne ut hvis jeg trenger din totale følelsesmessige støtte hver dag?', ru:'Если я навсегда потеряю способность зарабатывать и амбиции, станешь ли ты презирать меня за слабость?' },
  { id: 277, category:'bold', en:'If our roles reversed — breadwinner or stay-at-home — what would hurt your ego the most?', no:'Hvis rollene våre byttet — forsørger eller hjemmeværende — hva ville såret egoet ditt mest?', ru:'Насколько быстро ты выгоришь, если мне ежедневно будет нужна твоя тотальная эмоциональная поддержка?' },
  { id: 278, category:'bold', en:'If I changed beyond recognition physically — through trauma, ageing, or illness — would your physical attraction remain?', no:'Hvis jeg endret meg fysisk til det ugjenkjennelige — gjennom traumer, aldring eller sykdom — ville den fysiske tiltrekningen din bli?', ru:'Если наши роли перевернутся (добытчик/домохозяйка), что ударит по твоему эго больнее всего?' },
  { id: 279, category:'bold', en:'Could you stay close if I fell into deep apathy and stopped giving you any response?', no:'Kunne du bli nær hvis jeg falt inn i dyp apati og sluttet å gi deg noen respons?', ru:'Если я изменюсь внешне до неузнаваемости (травма, старение, болезнь), останется ли твое физическое влечение ко мне?' },
  { id: 280, category:'bold', en:'Where in your value system is the thin line between \'love at any cost\' and foolish self-sacrifice?', no:'Hvor i verdisystemet ditt er den tynne linjen mellom «kjærlighet for enhver pris» og tåpelig selvofring?', ru:'Сможешь ли ты оставаться рядом, если я впаду в глубокую апатию и перестану давать тебе обратную связь?' },
  { id: 281, category:'bold', en:'If I made a decision that goes against your moral principles, would you step away from me or from your principles?', no:'Hvis jeg tok en beslutning som strider mot dine moralske prinsipper, ville du fjerne deg fra meg eller fra prinsippene dine?', ru:'Где в твоей системе ценностей проходит тонкая грань между «любовью любой ценой» и глупым самопожертвованием?' },
  { id: 282, category:'bold', en:'If someone gives you an ultimatum — \'your dream or me\' — what would you actually choose?', no:'Hvis noen gir deg et ultimatum — «drømmen din eller meg» — hva ville du faktisk velge?', ru:'Если я приму решение, которое идет вразрез с твоими моральными принципами, ты отступишься от меня или от принципов?' },
  { id: 283, category:'bold', en:'If our relationship brings you more tears and pain than joy — how many years are you prepared to endure that?', no:'Hvis forholdet vårt gir deg mer tårer og smerte enn glede — hvor mange år er du klar til å holde ut det?', ru:'Если тебе жестко поставят ультиматум: «Или твоя мечта/карьера, или я» — что ты выберешь на самом деле?' },
  { id: 284, category:'bold', en:'How do you personally define the difference: where is the crisis to be weathered, and where is the agony to be ended?', no:'Hvordan definerer du personlig forskjellen: hvor er krisen som skal overvinnes, og hvor er agonien som skal avsluttes?', ru:'Если наши отношения будут приносить тебе больше слез и боли, чем радости — сколько лет ты готов(а) это терпеть?' },
  { id: 285, category:'bold', en:'If you start growing and I remain at the same level, how soon will you start to feel ashamed of me in front of friends?', no:'Hvis du begynner å vokse og jeg forblir på samme nivå, hvor snart vil du begynne å skamme deg over meg overfor venner?', ru:'Как ты для себя определяешь разницу: где кризис, который нужно пережить, а где агония, которую нужно прекратить?' },
  { id: 286, category:'bold', en:'If you start growing and I stay at the same level, how soon would you start feeling ashamed of me in front of friends?', no:'Hvis du begynner å vokse og jeg forblir på samme nivå, hvor snart ville du begynne å skamme deg over meg foran venner?', ru:'Если ты начнешь расти, а я останусь на прежнем уровне развития, как скоро ты начнешь стыдиться меня перед друзьями?' },
  { id: 287, category:'bold', en:'If I commit a terrible, destructive mistake — a crime or bankruptcy — will you stay on my side against the whole world?', no:'Hvis jeg begår en forferdelig, destruktiv feil — en forbrytelse eller konkurs — vil du bli på min side mot hele verden?', ru:'Если я совершу ужасную, разрушительную ошибку (преступление, банкротство), ты останешься на моей стороне против всего мира?' },
  { id: 288, category:'bold', en:'Can you truly forgive a betrayal, or will you remind me of it in every argument until the end of time?', no:'Kan du virkelig tilgi et svik, eller vil du minne meg på det i enhver krangel til evig tid?', ru:'Сможешь ли ты искренне простить предательство, или будешь напоминать мне о нем при каждой ссоре до конца жизни?' },
  { id: 289, category:'bold', en:'How do you behave when you want to hurt me back as much as I hurt you?', no:'Hvordan oppfører du deg når du vil gjøre meg like vondt som jeg gjorde deg?', ru:'Как ты ведешь себя, когда хочешь сделать мне так же больно, как сделал(а) я тебе?' },
  { id: 290, category:'bold', en:'If my parents or friends are openly against you, would that make you doubt us?', no:'Hvis foreldrene mine eller vennene mine er åpent imot deg, ville det fått deg til å tvile på oss?', ru:'Если мои родители или друзья будут откровенно против тебя, заставит ли это тебя сомневаться в нас?' },
  { id: 291, category:'bold', en:'Would you have the courage to look me in the eyes and say: \'I no longer see a future with you\', without making excuses?', no:'Ville du ha mot til å se meg i øynene og si: «Jeg ser ikke lenger en fremtid med deg», uten å unnskylde deg?', ru:'Хватит ли тебе смелости посмотреть мне в глаза и сказать: «Я больше не вижу с тобой будущего», не ища отговорок?' },
  { id: 292, category:'bold', en:'If we face the impossibility of having children — or disagreement on the topic — would that be the end?', no:'Hvis vi møter umuligheten av å få barn — eller uenighet om emnet — ville det vært slutten?', ru:'Если мы столкнемся с невозможностью иметь детей (или с расхождением во взглядах на это), станет ли это концом?' },
  { id: 293, category:'bold', en:'Does it happen that you agree to sex not out of desire, but to avoid my discontent or suspicions?', no:'Hender det at du samtykker til sex ikke av lyst, men for å unngå min misnøye eller mistanker?', ru:'Бывает ли так, что ты соглашаешься на секс не из желания, а чтобы избежать моего недовольства или подозрений?' },
  { id: 294, category:'bold', en:'If I could read your thoughts during our harshest arguments, would I be horrified by what you think of me?', no:'Hvis jeg kunne lese tankene dine under de hardeste krangene våre, ville jeg blitt skremt av hva du tenker om meg?', ru:'Если бы я мог(ла) читать твои мысли в моменты наших самых жестоких ссор, ужаснулся(лась) бы я тому, что ты обо мне думаешь?' },
  { id: 295, category:'bold', en:'What do you consider your most unattractive psychological trait, with which I must put up?', no:'Hva anser du som din mest uattraktive psykologiske egenskap, som jeg må leve med?', ru:'Что ты считаешь своей самой непривлекательной психологической чертой, с которой мне приходится мириться?' },
  { id: 296, category:'bold', en:'Which of us do you think loves more deeply — and which allows themselves to be loved?', no:'Hvem av oss tror du elsker dypere — og hvem lar seg bli elsket?', ru:'Как ты считаешь, кто из нас двоих любит сильнее, а кто позволяет себя любить?' },
  { id: 297, category:'bold', en:'Could you take revenge on me for infidelity with infidelity of your own?', no:'Kunne du ta hevn på meg for utroskap med din egen utroskap?', ru:'Способен(на) ли ты отомстить мне за измену другой изменой?' },
  { id: 298, category:'bold', en:'If I lose interest in sex for a long time, how will you solve this — within the couple or secretly outside?', no:'Hvis jeg mister interessen for sex over lengre tid, hvordan vil du løse det — innenfor paret eller hemmelig utenfor?', ru:'Если я потеряю интерес к сексу на долгое время, как ты будешь решать эту проблему: внутри пары или тайно вне её?' },
  { id: 299, category:'bold', en:'Deep down, do you believe we will live together for the rest of our lives, or do you give us a certain timeframe?', no:'Innerst inne, tror du at vi vil leve sammen resten av livet, eller gir du oss en bestemt tidsramme?', ru:'В глубине души ты веришь, что мы проживем вместе всю жизнь, или даешь нам какой-то определенный срок?' },
  { id: 300, category:'bold', en:'Answering all these questions — in how many of them did you soften the truth to seem better?', no:'Svarte du på alle disse spørsmålene — i hvor mange av dem myket du opp sannheten for å fremstå bedre?', ru:'Отвечая на все эти вопросы, в скольких из них ты смягчил(а) правду, чтобы казаться лучше?' },
  { id: 301, category:'bold', en:'And one last question: what do you feel for me right now, after all this truth?', no:'Og ett siste spørsmål: hva føler du for meg akkurat nå, etter all denne sannheten?', ru:'И последний: что ты сейчас чувствуешь ко мне после всей этой правды?' },
  { id: 302, category:'light', en:'In what moments do you feel we are completely united against the world?', no:'I hvilke øyeblikk føler du at vi er helt samlet mot verden?', ru:'В какие моменты ты чувствуешь, что мы — одно целое против всего мира?' },
  { id: 303, category:'light', en:'What in my voice or gaze tells you that you are safe?', no:'Hva i stemmen min eller blikket mitt forteller deg at du er trygg?', ru:'Что в моем голосе или взгляде дает тебе понять, что ты в безопасности?' },
  { id: 304, category:'light', en:'What action of mine helps you feel that I\'m always on your side?', no:'Hvilken handling fra meg hjelper deg med å føle at jeg alltid er på din side?', ru:'Какое мое действие помогает тебе почувствовать, что я всегда на твоей стороне?' },
  { id: 305, category:'light', en:'How do you know when I am emotionally available for you right now?', no:'Hvordan vet du når jeg er følelsesmessig tilgjengelig for deg akkurat nå?', ru:'Как ты понимаешь, что я эмоционально доступен(на) для тебя сейчас?' },
  { id: 306, category:'light', en:'What does \'being under protection\' mean to you in our relationship?', no:'Hva betyr «å være under beskyttelse» for deg i forholdet vårt?', ru:'Что для тебя значит «быть под защитой» в наших отношениях?' },
  { id: 307, category:'light', en:'When do you feel most fully \'accepted\' by me?', no:'Når føler du deg mest fullt «akseptert» av meg?', ru:'Когда ты чувствуешь себя максимально «принятым(ой)» мной?' },
  { id: 308, category:'light', en:'What is your warmest sensation from our physical contact?', no:'Hva er din varmeste fornemmelse fra den fysiske kontakten vår?', ru:'Какое твое самое теплое ощущение от нашего физического контакта?' },
  { id: 309, category:'light', en:'How do you know that you are my number one priority?', no:'Hvordan vet du at du er min høyeste prioritet?', ru:'Как ты понимаешь, что ты для меня — приоритет номер один?' },
  { id: 310, category:'light', en:'What helps you relax in my arms after a hard day?', no:'Hva hjelper deg med å slappe av i armene mine etter en tøff dag?', ru:'Что помогает тебе расслабиться в моих объятиях после тяжелого дня?' },
  { id: 311, category:'light', en:'When do you feel I am genuinely proud of you?', no:'Når føler du at jeg virkelig er stolt av deg?', ru:'Когда ты чувствуешь, что я искренне горжусь тобой?' },
  { id: 312, category:'light', en:'What gesture from me makes you feel the most loved?', no:'Hvilken gest fra meg får deg til å føle deg mest elsket?', ru:'Какой жест с моей стороны заставляет тебя чувствовать себя самым(ой) любимым(ой)?' },
  { id: 313, category:'light', en:'How do you understand that I hear not just your words, but your pain or joy?', no:'Hvordan forstår du at jeg hører ikke bare ordene dine, men smerten eller gleden din?', ru:'Как ты понимаешь, что я слышу не просто слова, а твою боль или радость?' },
  { id: 314, category:'light', en:'In which moments do you feel that I am your \'safe harbour\'?', no:'I hvilke øyeblikk føler du at jeg er din «trygge havn»?', ru:'В какие моменты ты чувствуешь, что я — твоя «безопасная гавань»?' },
  { id: 315, category:'light', en:'What in our home creates a sense of emotional warmth for you?', no:'Hva i hjemmet vårt skaper en følelse av emosjonell varme for deg?', ru:'Что в нашем доме создает для тебя ощущение эмоционального тепла?' },
  { id: 316, category:'light', en:'What word of support from me is most valuable to you?', no:'Hvilket støtteord fra meg er mest verdifullt for deg?', ru:'Какое слово поддержки от меня для тебя самое ценное?' },
  { id: 317, category:'light', en:'When do you feel that I truly \'see\' your soul?', no:'Når føler du at jeg virkelig «ser» sjelen din?', ru:'Когда ты чувствуешь, что я действительно «вижу» твою душу?' },
  { id: 318, category:'light', en:'Who is your greatest ally outside our relationship right now?', no:'Hvem er din største allierte utenfor forholdet vårt akkurat nå?', ru:'Кто сейчас является твоим самым большим союзником вне нашей семьи?' },
  { id: 319, category:'light', en:'What event this week made you smile the most?', no:'Hvilken hendelse denne uken fikk deg til å smile mest?', ru:'Какое событие на этой неделе заставило тебя улыбнуться больше всего?' },
  { id: 320, category:'light', en:'What bothers you most about your current work right now?', no:'Hva plager deg mest med arbeidet ditt akkurat nå?', ru:'Что тебя больше всего раздражает в твоей текущей работе прямо сейчас?' },
  { id: 321, category:'light', en:'What is your favourite way to \'reboot\' your mind after stress?', no:'Hva er din favorittemåte å «nullstille» tankene på etter stress?', ru:'Какой твой самый любимый способ «перезагрузить» мозг после стресса?' },
  { id: 322, category:'light', en:'Is there a dream you think about every day lately?', no:'Er det en drøm du tenker på hver dag i det siste?', ru:'Есть ли какая-то мечта, о которой ты думаешь каждый день в последнее время?' },
  { id: 323, category:'light', en:'Which film or series would you like to watch together next weekend?', no:'Hvilken film eller serie vil du gjerne se sammen neste helg?', ru:'Какой фильм или сериал ты бы хотел(а) посмотреть вместе со мной в следующие выходные?' },
  { id: 324, category:'light', en:'Which character trait do you consider your greatest strength right now?', no:'Hvilken karakteregenskap anser du som din største styrke akkurat nå?', ru:'Какую черту своего характера ты считаешь своей главной силой на данный момент?' },
  { id: 325, category:'light', en:'What in your to-do list for the week causes you the most anxiety?', no:'Hva på gjørelisten din for uken gir deg mest angst?', ru:'Что в твоем списке дел на неделю вызывает у тебя наибольшую тревогу?' },
  { id: 326, category:'light', en:'Who among our mutual friends do you trust the most right now?', no:'Hvem blant de felles vennene våre stoler du mest på akkurat nå?', ru:'Кто из наших общих друзей вызывает у тебя сейчас наибольшее доверие?' },
  { id: 327, category:'light', en:'What journey — even an impossible one — are you dreaming of today?', no:'Hvilken reise — selv en umulig en — drømmer du om i dag?', ru:'О каком путешествии (пусть даже нереальном) ты грезишь сегодня?' },
  { id: 328, category:'light', en:'What gift — not necessarily material — would you most like to receive \'just because\'?', no:'Hvilken gave — ikke nødvendigvis materiell — ville du aller mest like å motta «bare fordi»?', ru:'Какой подарок (не обязательно материальный) ты бы хотел(а) получить «просто так»?' },
  { id: 329, category:'light', en:'What achievement from the past month makes you proud of yourself?', no:'Hvilken prestasjon fra den siste måneden gjør deg stolt av deg selv?', ru:'Какое достижение за последний месяц заставляет тебя гордиться собой?' },
  { id: 330, category:'light', en:'What about my appearance today do you like the most?', no:'Hva ved mitt utseende i dag liker du best?', ru:'Что в моем облике сегодня тебе нравится больше всего?' },
  { id: 331, category:'light', en:'What new habit would you like to develop this year?', no:'Hvilken ny vane vil du gjerne utvikle i år?', ru:'Какую новую привычку ты бы хотел(а) развить в этом году?' },
  { id: 332, category:'light', en:'If you could change one thing about your work schedule, what would it be?', no:'Hvis du kunne endre én ting ved arbeidstimeplanen din, hva ville det vært?', ru:'Если бы ты мог(ла) поменять одну вещь в своем рабочем графике, что бы это было?' },
  { id: 333, category:'light', en:'What dish always reminds you of a celebration?', no:'Hvilken rett minner deg alltid om en feiring?', ru:'Какое блюдо всегда напоминает тебе о празднике?' },
  { id: 334, category:'light', en:'Which trait of mine reminds you of someone who cared for you as a child?', no:'Hvilken egenskap ved meg minner deg om noen som tok vare på deg som barn?', ru:'Какая моя черта напоминает тебе кого-то, кто заботился о тебе в детстве?' },
  { id: 335, category:'light', en:'In which situations do you feel that I \'reflect\' your best qualities back at you?', no:'I hvilke situasjoner føler du at jeg «speiler» de beste sidene dine tilbake til deg?', ru:'В каких ситуациях ты чувствуешь, что я «отражаю» твои лучшие качества?' },
  { id: 336, category:'light', en:'Which of my behaviours makes you feel \'at home\'?', no:'Hvilken av mine atferder får deg til å føle deg «hjemme»?', ru:'Какое мое поведение дает тебе почувствовать себя «как дома»?' },
  { id: 337, category:'light', en:'Which of my words makes you feel that I truly understand you?', no:'Hvilke ord fra meg får deg til å føle at jeg virkelig forstår deg?', ru:'Что из моих слов заставляет тебя чувствовать, что я тебя действительно понимаю?' },
  { id: 338, category:'light', en:'Which quality of yours do you think I value the most?', no:'Hvilken egenskap ved deg tror du jeg setter mest pris på?', ru:'Какое качество в тебе я ценю больше всего, по твоему мнению?' },
  { id: 339, category:'light', en:'What do you think you could teach me in this life?', no:'Hva tror du at du kan lære meg i dette livet?', ru:'Как ты думаешь, чему ты можешь научить меня в этой жизни?' },
  { id: 340, category:'light', en:'What in our relationship feels most \'healing\' to you?', no:'Hva i forholdet vårt føles mest «helende» for deg?', ru:'Что в наших отношениях кажется тебе самым «исцеляющим»?' },
  { id: 341, category:'light', en:'What action of mine helps you cope with your self-doubt?', no:'Hvilken handling fra meg hjelper deg å takle din usikkerhet på deg selv?', ru:'Какое мое действие помогает тебе справиться с твоей неуверенностью?' },
  { id: 342, category:'light', en:'In what ways are you and I more alike than it seems at first glance?', no:'På hvilke måter ligner vi hverandre mer enn det ser ut ved første øyekast?', ru:'В чем мы с тобой похожи больше, чем кажется на первый взгляд?' },
  { id: 343, category:'light', en:'Which expression of my tenderness feels most genuine to you?', no:'Hvilket uttrykk for min ømhet føles mest genuint for deg?', ru:'Какое мое проявление нежности кажется тебе самым искренним?' },
  { id: 344, category:'light', en:'What wound of mine do you think you help me heal?', no:'Hvilken sår ved meg tror du at du hjelper meg å lege?', ru:'Как ты думаешь, какую мою «рану» ты помогаешь мне залечить?' },
  { id: 345, category:'light', en:'What in our communication makes you feel \'whole\'?', no:'Hva i kommunikasjonen vår får deg til å føle deg «hel»?', ru:'Что в нашем общении заставляет тебя чувствовать себя «целостным(ой)»?' },
  { id: 346, category:'light', en:'Which character trait of mine would you like to \'borrow\' for yourself?', no:'Hvilken karakteregenskap ved meg ville du gjerne «låne» til deg selv?', ru:'Какую черту моего характера ты бы хотел(а) «позаимствовать» себе?' },
  { id: 347, category:'light', en:'How do you know that I accept you with all your \'shadows\'?', no:'Hvordan forstår du at jeg aksepterer deg med alle dine \'skygger\'?', ru:'Как ты понимаешь, что я принимаю тебя со всеми твоими «тенями»?' },
  { id: 348, category:'light', en:'What word of approval from me do you most long for?', no:'Hvilke ord av godkjenning fra meg lengter du mest etter?', ru:'Какое слово одобрения от меня ты ждешь больше всего?' },
  { id: 349, category:'light', en:'What do you see as the magic of our first encounter, looking back now?', no:'Hva ser du som magien i vår første møte, sett i ettertid?', ru:'В чем ты видишь магию нашей первой встречи сейчас?' },
  { id: 350, category:'light', en:'What do you feel in your body right now, looking into my eyes?', no:'Hva kjenner du i kroppen din akkurat nå, mens du ser meg i øynene?', ru:'Что ты чувствуешь в своем теле прямо сейчас, глядя мне в глаза?' },
  { id: 351, category:'light', en:'What sounds or scents right now make our conversation feel cosy?', no:'Hvilke lyder eller dufter gjør samtalen vår hyggelig akkurat nå?', ru:'Какие звуки или запахи прямо сейчас делают наш разговор уютным?' },
  { id: 352, category:'light', en:'If your current state were a color, which would it be?', no:'Hvis din nåværende tilstand var en farge, hvilken ville det vært?', ru:'Если бы твое текущее состояние было цветом, то каким?' },
  { id: 353, category:'light', en:'How do you breathe when I touch your hand?', no:'Hvordan puster du når jeg tar hånden din?', ru:'Как ты дышишь, когда я прикасаюсь к твоей руке?' },
  { id: 354, category:'light', en:'What do you notice in my face right now that you hadn\'t noticed before?', no:'Hva legger du merke til i ansiktet mitt akkurat nå, som du ikke hadde sett før?', ru:'Что ты замечаешь в моем лице прямо в эту секунду, чего не видел(а) раньше?' },
  { id: 355, category:'light', en:'What desire do you have right now — to embrace, to pull away, or to stay still?', no:'Hvilket ønske har du akkurat nå — å omfavne, å trekke deg tilbake, eller å stå stille?', ru:'Какое желание у тебя возникает прямо сейчас: обнять, отодвинуться или замереть?' },
  { id: 356, category:'light', en:'What does your body want to tell me right now that you hesitate to put into words?', no:'Hva vil kroppen din fortelle meg akkurat nå som du nøler med å sette ord på?', ru:'О чем твое тело хочет мне сообщить, но ты не решаешься сказать словами?' },
  { id: 357, category:'light', en:'How do you experience the space between us right now? Is it warm or cool?', no:'Hvordan opplever du rommet mellom oss akkurat nå? Er det varmt eller kjølig?', ru:'Как ты ощущаешь пространство между нами прямо сейчас? Оно теплое или прохладное?' },
  { id: 358, category:'light', en:'Which emotion dominates in you right now — interest, anxiety, or calm?', no:'Hvilken følelse dominerer i deg akkurat nå — interesse, angst eller ro?', ru:'Какая эмоция сейчас доминирует в тебе: интерес, тревога или спокойствие?' },
  { id: 359, category:'light', en:'What in my voice right now calms you, and what makes you cautious?', no:'Hva i stemmen min akkurat nå roer deg, og hva gjør deg forsiktig?', ru:'Что в моем голосе сейчас тебя успокаивает, а что настораживает?' },
  { id: 360, category:'light', en:'If you could express our current state in one gesture, what would it be?', no:'Hvis du kunne uttrykke vår nåværende tilstand med én gest, hva ville det vært?', ru:'Если бы ты мог(ла) выразить наше состояние сейчас одним жестом, что бы это было?' },
  { id: 361, category:'light', en:'How present do you feel right now in this conversation?', no:'Hvor til stede føler du deg akkurat nå i denne samtalen?', ru:'Насколько ты сейчас чувствуешь себя «присутствующим(ей)» в этом разговоре?' },
  { id: 362, category:'light', en:'What in the surroundings right now is distracting you from me?', no:'Hva i omgivelsene distraherer deg fra meg akkurat nå?', ru:'Что в окружающей обстановке сейчас отвлекает тебя от меня?' },
  { id: 363, category:'light', en:'What need do you become aware of in yourself right in this moment?', no:'Hvilket behov blir du bevisst på i deg selv akkurat i dette øyeblikket?', ru:'Какую потребность ты осознаешь в себе прямо в этот момент?' },
  { id: 364, category:'light', en:'How do you feel your boundaries right now — are they open or closed?', no:'Hvordan føler du grensene dine akkurat nå — er de åpne eller lukket?', ru:'Как ты чувствуешь свои границы прямо сейчас: они открыты или закрыты?' },
  { id: 365, category:'light', en:'What would you like to do right now to make our closeness more tangible?', no:'Hva vil du gjerne gjøre akkurat nå for å gjøre nærheten vår mer håndgripelig?', ru:'Что тебе хочется сделать прямо сейчас, чтобы наша близость стала ощутимее?' },
  { id: 366, category:'light', en:'If our love were a book, what genre would it be?', no:'Hvis kjærligheten vår var en bok, hvilken sjanger ville den tilhøre?', ru:'Если бы наша любовь была книгой, в каком жанре она была бы написана?' },
  { id: 367, category:'light', en:'What title would you give to the chapter about our first year together?', no:'Hvilken tittel ville du gitt til kapittelet om det første året vårt sammen?', ru:'Какое название ты бы дал(а) главе о нашем первом совместном годе?' },
  { id: 368, category:'light', en:'Who is the main hero in our story, and who is the wise helper?', no:'Hvem er hovedhelten i vår felles historie, og hvem er den vise hjelperen?', ru:'Кто в нашей истории — главный герой, а кто — мудрый помощник?' },
  { id: 369, category:'light', en:'What moment in the past would you call the \'turning point\' of our relationship?', no:'Hvilket øyeblikk i fortiden ville du kalt «vendepunktet» i forholdet vårt?', ru:'Какой момент в прошлом ты бы назвал(а) «точкой сборки» нашей пары?' },
  { id: 370, category:'light', en:'If our relationship were a fairy tale, what magical object would help us?', no:'Hvis forholdet vårt var et eventyr, hvilken magisk gjenstand ville hjelpe oss?', ru:'Если бы наши отношения были сказкой, какой магический предмет нам бы помогал?' },
  { id: 371, category:'light', en:'What story about us do you most often tell friends or acquaintances?', no:'Hvilken historie om oss forteller du oftest til venner eller bekjente?', ru:'Какую историю о нас ты чаще всего рассказываешь друзьям или знакомым?' },
  { id: 372, category:'light', en:'What musical theme best describes our current life period?', no:'Hvilken musikalsk tone beskriver vår nåværende livsfase best?', ru:'Какая музыкальная тема лучше всего описывает наш текущий период жизни?' },
  { id: 373, category:'light', en:'What obstacles have we already successfully overcome in our shared legend?', no:'Hvilke hindringer har vi allerede overvunnet i vår felles legende?', ru:'Какие «препятствия» мы уже успешно преодолели в нашей совместной легенде?' },
  { id: 374, category:'light', en:'If you were a biographer of our couple, what would you emphasise most?', no:'Hvis du var biograf for paret vårt, hva ville du lagt størst vekt på?', ru:'Если бы ты был(а) биографом нашей пары, на чем бы ты сделал(а) главный акцент?' },
  { id: 375, category:'light', en:'Which adventure of ours would you like to repeat in the next chapter?', no:'Hvilket eventyr av oss vil du gjerne gjenta i neste kapittel?', ru:'Какое наше приключение ты бы хотел(а) повторить в следующей главе?' },
  { id: 376, category:'light', en:'What is the title of the film we are \'making\' right now?', no:'Hva er tittelen på filmen vi «lager» akkurat nå?', ru:'Как называется фильм, который мы «снимаем» прямо сейчас?' },
  { id: 377, category:'light', en:'Which historical or literary couple inspires our story?', no:'Hvilket historisk eller litterært par inspirerer historien vår?', ru:'Кто из исторических или литературных пар вдохновляет нашу историю?' },
  { id: 378, category:'light', en:'Which quality of our couple do you consider \'legendary\'?', no:'Hvilken egenskap ved paret vårt anser du som «legendarisk»?', ru:'Какое качество нашей пары ты считаешь «легендарным»?' },
  { id: 379, category:'light', en:'If our story had an epigraph, what would it be?', no:'Hvis historien vår hadde et epigraf, hva ville det vært?', ru:'Если бы у нашей истории был эпиграф, каким бы он был?' },
  { id: 380, category:'light', en:'How has the \'plot\' of your life changed since I entered it?', no:'Hvordan har «handlingen» i livet ditt endret seg siden jeg entret det?', ru:'Как изменился «сюжет» твоей жизни после того, как в нем появился(лась) я?' },
  { id: 381, category:'light', en:'What \'plot twist\' in our relationship was the most unexpected for you?', no:'Hvilken «plottvis» i forholdet vårt var den mest uventede for deg?', ru:'Какой «поворот сюжета» в наших отношениях стал для тебя самым неожиданным?' },
  { id: 382, category:'deep', en:'When we argue, do you feel that I am pulling away from you forever?', no:'Når vi krangler, føler du at jeg trekker meg bort fra deg for alltid?', ru:'Когда мы ссоримся, чувствуешь ли ты, что я отдаляюсь от тебя навсегда?' },
  { id: 383, category:'deep', en:'What do you do when you\'re afraid I\'ll stop needing you?', no:'Hva gjør du når du er redd for at jeg slutter å trenge deg?', ru:'Что ты делаешь, когда боишься, что я перестану в тебе нуждаться?' },
  { id: 384, category:'deep', en:'Which reaction of mine makes you \'withdraw into your shell\'?', no:'Hvilken reaksjon fra meg får deg til å «trekke deg inn i skallet ditt»?', ru:'Какая моя реакция заставляет тебя «закрыться в раковине»?' },
  { id: 385, category:'deep', en:'When I criticise you, do you hear the message: \'You\'re not good enough for me\'?', no:'Når jeg kritiserer deg, hører du budskapet: «Du er ikke god nok for meg»?', ru:'Когда я критикую тебя, слышишь ли ты в этом сообщение: «Ты недостаточно хорош(а) для меня»?' },
  { id: 386, category:'deep', en:'Do you ever get angry at me to hide your sadness or fear?', no:'Hender det at du blir sint på meg for å skjule din sorg eller frykt?', ru:'Бывает ли так, что ты злишься на меня, чтобы скрыть свою грусть или страх?' },
  { id: 387, category:'deep', en:'How do you react when you feel me becoming cold?', no:'Hvordan reagerer du når du føler at jeg blir kald?', ru:'Как ты реагируешь, когда чувствуешь, что я становлюсь холодным(ой)?' },
  { id: 388, category:'deep', en:'What do you feel when I don\'t respond to your emotional call?', no:'Hva kjenner du når jeg ikke svarer på det følelsesmessige signalet ditt?', ru:'Что ты чувствуешь, когда я не отвечаю на твой эмоциональный призыв?' },
  { id: 389, category:'deep', en:'Are there moments when you fear that I am \'too much\' for you, or you are \'too much\' for me?', no:'Er det øyeblikk da du frykter at jeg er «for mye» for deg, eller du er «for mye» for meg?', ru:'Есть ли моменты, когда ты боишься, что я «слишком много» для тебя, или ты «слишком много» для меня?' },
  { id: 390, category:'deep', en:'When you feel lonely, do you come to me or retreat into yourself? Why?', no:'Når du føler deg ensom, kommer du til meg eller trekker du deg inn i deg selv? Hvorfor?', ru:'Когда ты чувствуешь себя одиноко, ты идешь ко мне или уходишь в себя? Почему?' },
  { id: 391, category:'deep', en:'What action of mine could make you doubt my reliability as a partner?', no:'Hvilken handling fra meg kan få deg til å tvile på påliteligheten min som partner?', ru:'Какой мой поступок может заставить тебя усомниться в моей надежности как партнера?' },
  { id: 392, category:'deep', en:'What do you feel when I don\'t notice your attempt to draw closer?', no:'Hva kjenner du når jeg ikke legger merke til forsøket ditt på å nærme deg?', ru:'Что ты чувствуешь, когда я не замечаю твою попытку сблизиться?' },
  { id: 393, category:'deep', en:'What \'pain point\' in our relationship makes you feel helpless?', no:'Hvilken «smertespot» i forholdet vårt får deg til å føle deg hjelpeløs?', ru:'Какая «болевая точка» в наших отношениях заставляет тебя чувствовать себя беспомощным(ой)?' },
  { id: 394, category:'deep', en:'How do you know that I am losing emotional connection with you?', no:'Hvordan forstår du at jeg mister den emosjonelle forbindelsen med deg?', ru:'Как ты понимаешь, что я теряю с тобой эмоциональную связь?' },
  { id: 395, category:'deep', en:'Are you ever scared to show me your weakness? What exactly frightens you?', no:'Er du noen gang redd for å vise meg svakheten din? Hva er det som skremmer deg nøyaktig?', ru:'Бывает ли тебе страшно показывать мне свою слабость? Что именно пугает?' },
  { id: 396, category:'deep', en:'When you feel that I\'m rejecting you, how does it show in your body?', no:'Når du føler at jeg avviser deg, hvordan viser det seg i kroppen din?', ru:'Когда ты чувствуешь, что я тебя отвергаю, как это отражается на твоем теле?' },
  { id: 397, category:'deep', en:'In which moments do you feel that I am your enemy rather than your ally?', no:'I hvilke øyeblikk føler du at jeg er din fiende snarere enn din allierte?', ru:'В какие моменты ты чувствуешь, что я — твой враг, а не союзник?' },
  { id: 398, category:'deep', en:'How do you express your \'emotional hunger\' for me?', no:'Hvordan uttrykker du din «emosjonelle sult» etter meg?', ru:'Как ты проявляешь свой «эмоциональный голод» по мне?' },
  { id: 399, category:'deep', en:'For which quality do you respect me most, even during an argument?', no:'For hvilken egenskap respekterer du meg mest, selv under en krangel?', ru:'За какое качество ты уважаешь меня больше всего, даже когда мы в ссоре?' },
  { id: 400, category:'deep', en:'In what way do you think I have become better during our relationship?', no:'På hvilken måte synes du at jeg har blitt bedre i løpet av forholdet vårt?', ru:'Как ты считаешь, в чем я стал(а) лучше за время наших отношений?' },
  { id: 401, category:'deep', en:'Which talent of mine do you feel the world underestimates?', no:'Hvilket talent ved meg føler du at verden undervurderer?', ru:'Какой мой талант ты считаешь недооцененным миром?' },
  { id: 402, category:'deep', en:'In which situations do you feel we are an ideal team?', no:'I hvilke situasjoner føler du at vi er et ideelt team?', ru:'В каких ситуациях ты чувствуешь, что мы — идеальная команда?' },
  { id: 403, category:'deep', en:'Which trait of my character helps you become better?', no:'Hvilken egenskap ved karakteren min hjelper deg med å bli bedre?', ru:'Что в моем характере помогает тебе становиться лучше?' },
  { id: 404, category:'deep', en:'Which decision of mine in the past genuinely impressed you?', no:'Hvilken beslutning av meg i fortiden imponerte deg genuint?', ru:'Какое мое решение в прошлом вызвало у тебя искреннее восхищение?' },
  { id: 405, category:'deep', en:'How do you show your gratitude to me when I don\'t notice it?', no:'Hvordan viser du takknemlighet overfor meg når jeg ikke legger merke til det?', ru:'Как ты проявляешь свою благодарность мне, когда я этого не замечаю?' },
  { id: 406, category:'deep', en:'Which of our shared rituals — morning coffee, walks — means the most to you?', no:'Hvilke av våre felles ritualer — morgenkaffe, turer — betyr mest for deg?', ru:'Какие наши общие ритуалы (утренний кофе, прогулки) значат для тебя больше всего?' },
  { id: 407, category:'deep', en:'How can we support each other\'s dreams more actively?', no:'Hvordan kan vi støtte hverandres drømmer mer aktivt?', ru:'Как мы можем поддержать мечты друг друга более активно?' },
  { id: 408, category:'deep', en:'What in our relationship makes you more confident in yourself?', no:'Hva i forholdet vårt gjør deg mer trygg på deg selv?', ru:'Что в наших отношениях делает тебя более уверенным(ой) в себе?' },
  { id: 409, category:'deep', en:'Which action of mine this week made you feel valued?', no:'Hvilken handling fra meg denne uken fikk deg til å føle deg verdsatt?', ru:'Какой мой поступок на этой неделе заставил тебя почувствовать, что я тебя ценю?' },
  { id: 410, category:'deep', en:'How do you relate to my quirks? Which ones do you find endearing?', no:'Hvordan forholder du deg til særhetene mine? Hvilke finner du søte?', ru:'Как ты относишься к моим странностям? Какие из них тебе кажутся милыми?' },
  { id: 411, category:'deep', en:'What do you consider the main success of our relationship today?', no:'Hva anser du som den viktigste suksessen i forholdet vårt i dag?', ru:'В чем ты видишь главный успех наших отношений на сегодняшний день?' },
  { id: 412, category:'deep', en:'Which role in our couple do you consider most important for our future?', no:'Hvilken rolle i paret anser du som viktigst for fremtiden vår?', ru:'Какую роль в нашей паре ты считаешь самой важной для нашего будущего?' },
  { id: 413, category:'deep', en:'How do you cope with my shortcomings so they don\'t destroy your love?', no:'Hvordan takler du manglene mine slik at de ikke ødelegger kjærligheten din?', ru:'Как ты справляешься с моими недостатками, чтобы они не разрушали твою любовь?' },
  { id: 414, category:'deep', en:'What helps you maintain tenderness towards me in difficult periods?', no:'Hva hjelper deg med å opprettholde ømhet overfor meg i vanskelige perioder?', ru:'Что помогает тебе сохранять нежность ко мне в трудные периоды?' },
  { id: 415, category:'deep', en:'Which shared memory would you call our \'golden archive\'?', no:'Hvilket felles minne ville du kalt vår «gullfond»?', ru:'Какое наше общее воспоминание ты бы назвал(а) «золотым фондом» нашей пары?' },
  { id: 416, category:'deep', en:'In which moments do you feel you are fighting against me rather than for us?', no:'I hvilke øyeblikk føler du at du kjemper mot meg snarere enn for oss?', ru:'В какие моменты ты чувствуешь, что борешься со мной, а не за нас?' },
  { id: 417, category:'deep', en:'Which demand of mine seems \'unfair\' or \'parental\' to you?', no:'Hvilket krav fra meg virker «urettferdig» eller «forelderlig» på deg?', ru:'Какое мое требование кажется тебе «несправедливым» или «родительским»?' },
  { id: 418, category:'deep', en:'What do you do when you feel I\'m trying to \'reshape\' you?', no:'Hva gjør du når du føler at jeg forsøker å «omforme» deg?', ru:'Что ты делаешь, когда чувствуешь, что я пытаюсь тебя «переделать»?' },
  { id: 419, category:'deep', en:'What \'childhood\' need do you most often try to meet through me?', no:'Hvilken \'barnlig\' behov prøver du oftest å dekke gjennom meg?', ru:'Какую свою «детскую» потребность ты чаще всего пытаешься удовлетворить через меня?' },
  { id: 420, category:'deep', en:'In which ways do you feel your dependence on me that holds you back?', no:'På hvilke måter kjenner du din avhengighet av meg som hindrer deg?', ru:'В чем ты разочаровался(лась) во мне после первых месяцев отношений?' },
  { id: 421, category:'deep', en:'In what way did you feel disappointed in me after the first months of the relationship?', no:'På hvilken måte ble du skuffet i meg etter de første månedene av forholdet?', ru:'Как ты реагируешь, когда я веду себя как человек, который тебя когда-то ранил?' },
  { id: 422, category:'deep', en:'How do you react when I behave like someone who hurt you in the past?', no:'Hvordan reagerer du når jeg oppfører meg som noen som skadet deg i fortiden?', ru:'Какие мои слова заставляют тебя чувствовать себя «маленьким(ой)» или «виноватым(ой)»?' },
  { id: 423, category:'deep', en:'Where do you consciously limit yourself in the relationship to avoid conflict?', no:'Hvor begrenser du deg bevisst i forholdet for å unngå konflikt?', ru:'Где ты сознательно ограничиваешь себя в отношениях, чтобы не конфликтовать?' },
  { id: 424, category:'deep', en:'Which words of mine make you feel \'small\' or \'guilty\'?', no:'Hvilke ord fra meg får deg til å føle deg «liten» eller «skyldig»?', ru:'Когда ты ловишь себя на мысли: «Ты должен(на) был(а) догадаться сам(а)»?' },
  { id: 425, category:'deep', en:'When do you catch yourself thinking: \'You should have guessed yourself\'?', no:'Når tar du deg selv i å tenke: «Du burde ha gjettet det selv»?', ru:'Что в моем поведении вызывает у тебя желание «спрятаться» или «уйти в оборону»?' },
  { id: 426, category:'deep', en:'What qualities of yours do you think irritate me the most?', no:'Hvilke av dine egenskaper tror du irriterer meg mest?', ru:'Как ты думаешь, какие твои качества раздражают меня больше всего?' },
  { id: 427, category:'deep', en:'What in my behaviour makes you want to \'hide\' or \'go on the defensive\'?', no:'Hva ved min atferd gjør at du vil «gjemme deg» eller «gå i forsvar»?', ru:'Какую часть ответственности за наши конфликты тебе сложнее всего признать?' },
  { id: 428, category:'deep', en:'What qualities of yours do you think annoy me the most?', no:'Hvilke egenskaper ved deg tror du irriterer meg mest?', ru:'Бывает ли, что ты используешь свою слабость как способ манипуляции мной?' },
  { id: 429, category:'deep', en:'Which part of responsibility for our conflicts is hardest for you to acknowledge?', no:'Hvilken del av ansvaret for konfliktene våre er vanskeligst for deg å erkjenne?', ru:'Что ты чувствуешь, когда я не соответствую твоему идеальному образу партнера?' },
  { id: 430, category:'deep', en:'Does it happen that you use your weakness as a way to manipulate me?', no:'Hender det at du bruker svakheten din som en måte å manipulere meg på?', ru:'Как ты справляешься со злостью, когда я не даю тебе того, что ты просишь?' },
  { id: 431, category:'deep', en:'What do you feel when I don\'t live up to your ideal image of a partner?', no:'Hva kjenner du når jeg ikke lever opp til ditt idealbilde av en partner?', ru:'В чем проявляется твое упрямство в наших отношениях?' },
  { id: 432, category:'deep', en:'How do you handle your anger when I don\'t give you what you\'re asking for?', no:'Hvordan håndterer du sinnet ditt når jeg ikke gir deg det du ber om?', ru:'Как изменилось твое восприятие любви с момента начала наших отношений?' },
  { id: 433, category:'deep', en:'In what way does your stubbornness show itself in our relationship?', no:'På hvilken måte viser staeigenheten din seg i forholdet vårt?', ru:'За что ты берешь на себя ответственность в нашей паре, а что перекладываешь на меня?' },
  { id: 434, category:'deep', en:'How has your perception of love changed since the start of our relationship?', no:'Hvordan har oppfatningen din av kjærlighet endret seg siden begynnelsen av forholdet?', ru:'Как ты понимаешь, что ты «прерываешь» контакт со мной (уходишь в телефон, в мысли)?' },
  { id: 435, category:'deep', en:'In what situations do you say yes when you truly mean no?', no:'I hvilke situasjoner sier du ja når du egentlig mener nei?', ru:'В каких ситуациях ты говоришь «да», когда на самом деле хочешь сказать «нет»?' },
  { id: 436, category:'deep', en:'What do you take responsibility for in our couple, and what do you shift onto me?', no:'Hva tar du ansvar for i paret, og hva skyver du over på meg?', ru:'Что ты делаешь со своей злостью, когда считаешь, что её «нельзя» проявлять?' },
  { id: 437, category:'deep', en:'How do you \'swallow\' your grievances? Where do they resonate in your body?', no:'Hvordan \'svelger\' du krenkelsene dine? Hvor merker du dem i kroppen?', ru:'Как ты «глотаешь» свои обиды? Где они отзываются в твоем теле?' },
  { id: 438, category:'deep', en:'In what way do you feel your dependence on me is holding you back?', no:'På hvilken måte føler du at din avhengighet av meg hindrer deg?', ru:'В чем ты чувствуешь свою зависимость от меня, которая тебе мешает?' },
  { id: 439, category:'deep', en:'How do you notice when you\'re \'disconnecting\' from me — retreating into your phone or your thoughts?', no:'Hvordan merker du når du «kobler fra» meg — trekker deg inn i telefonen eller tankene?', ru:'Как ты проявляешь свою автономность, не раня при этом меня?' },
  { id: 440, category:'deep', en:'When do you agree outwardly even though something in you is resisting?', no:'Når sier du ja utad selv om noe i deg stritter imot?', ru:'Какую свою потребность ты ждешь, что я угадаю, не озвучивая её?' },
  { id: 441, category:'deep', en:'What do you do with your anger when you feel you \'mustn\'t\' show it?', no:'Hva gjør du med sinnet ditt når du føler at du «ikke kan» vise det?', ru:'Как ты реагируешь, когда я нарушаю твое личное пространство без спроса?' },
  { id: 442, category:'deep', en:'Where in your body do you carry your grievances? How do they make themselves known?', no:'Hvor i kroppen bærer du klagene dine? Hvordan gir de seg til kjenne?', ru:'Где ты чувствуешь «застой» в наших отношениях, который нужно проработать?' },
  { id: 443, category:'deep', en:'Where do you feel your attachment to me begins to limit your own growth?', no:'Hvor kjenner du at tilknytningen til meg begynner å begrense din egen vekst?', ru:'В каких моментах ты чувствуешь себя «слишком» ответственным(ой) за мое настроение?' },
  { id: 444, category:'deep', en:'How do you express your autonomy without hurting me?', no:'Hvordan uttrykker du din autonomi uten å såre meg?', ru:'Как ты проживаешь свое бессилие, когда не можешь мне помочь?' },
  { id: 445, category:'deep', en:'Which need of yours are you waiting for me to guess without saying it aloud?', no:'Hvilket behov ditt venter du på at jeg skal gjette uten at du sier det høyt?', ru:'Что ты делаешь, когда чувствуешь, что я «давлю» на тебя своим присутствием?' },
  { id: 446, category:'deep', en:'How do you react when I invade your personal space without asking?', no:'Hvordan reagerer du når jeg invaderer ditt personlige rom uten å spørre?', ru:'Как ты отличаешь свои желания от моих ожиданий?' },
  { id: 447, category:'deep', en:'Where do you feel \'stagnation\' in our relationship that needs to be worked on?', no:'Hvor føler du «stillstand» i forholdet som det trengs å jobbe med?', ru:'В каких ситуациях ты чувствуешь, что мы «сливаемся» в одно целое и это тебя пугает?' },
  { id: 448, category:'deep', en:'In which moments do you feel overly responsible for my mood?', no:'I hvilke øyeblikk føler du deg overdrevent ansvarlig for humøret mitt?', ru:'Как ты возвращаешь себе себя, когда чувствуешь, что потерялся(лась) в отношениях?' },
  { id: 449, category:'deep', en:'How do you live through your helplessness when you can\'t help me?', no:'Hvordan lever du gjennom hjelpeløsheten din når du ikke kan hjelpe meg?', ru:'Что помогает тебе оставаться в контакте со мной, даже когда тебе больно?' },
  { id: 450, category:'deep', en:'What do you do when you feel my presence is \'pressing\' on you?', no:'Hva gjør du når du føler at min nærvær «presser» på deg?', ru:'Если бы «Ссора» была живым существом, как бы она выглядела и как бы она входила в наш дом?' },
  { id: 451, category:'deep', en:'How do you distinguish your own desires from my expectations?', no:'Hvordan skiller du dine egne ønsker fra forventningene mine?', ru:'Каким голосом говорит наше «Недопонимание»? Оно кричит или шепчет?' },
  { id: 452, category:'deep', en:'In which situations do you feel we \'merge\' into one entity and it frightens you?', no:'I hvilke situasjoner føler du at vi «smelter» inn i ett vesen og det skremmer deg?', ru:'Когда «Ревность» или «Обида» пытаются захватить власть в нашей паре, как мы можем объединиться против них?' },
  { id: 453, category:'deep', en:'How do you return to yourself when you feel lost in the relationship?', no:'Hvordan returnerer du til deg selv når du føler deg fortapt i forholdet?', ru:'Какие уловки использует «Рутина», чтобы заставить нас забыть о близости?' },
  { id: 454, category:'deep', en:'What helps you stay in contact with me even when you are hurting?', no:'Hva hjelper deg med å forbli i kontakt med meg selv når du har det vondt?', ru:'Если бы «Стресс» был внешним врагом, как бы мы построили крепость против него?' },
  { id: 455, category:'deep', en:'If \'Conflict\' were a living creature, what would it look like and how would it enter our home?', no:'Hvis «Konflikt» var et levende vesen, hvordan ville det sett ut og kommet inn i hjemmet vårt?', ru:'Какое имя мы дадим тому состоянию, когда мы оба молчим и злимся?' },
  { id: 456, category:'deep', en:'In what voice does our \'Misunderstanding\' speak? Does it shout or whisper?', no:'I hvilken stemme taler vår «Misforståelse»? Roper den eller hvisker den?', ru:'Как «Гордость» мешает нам первым пойти на примирение?' },
  { id: 457, category:'deep', en:'When \'Jealousy\' or \'Resentment\' tries to take power in our couple, how can we unite against them?', no:'Når «Sjalusi» eller «Bitterhet» forsøker å ta makten i paret, hvordan kan vi forene oss mot dem?', ru:'Какие «союзники» (друзья, хобби, юмор) помогают нам выгонять проблемы из наших отношений?' },
  { id: 458, category:'deep', en:'What tricks does \'Routine\' use to make us forget closeness?', no:'Hvilke triks bruker «Rutinen» for å få oss til å glemme nærheten?', ru:'Если «Усталость» захватывает наш вечер, какой наш план контрнаступления?' },
  { id: 459, category:'deep', en:'If \'Stress\' were an external enemy, how would we build a fortress against it?', no:'Hvis «Stress» var en ytre fiende, hvordan ville vi bygget en festning mot den?', ru:'Что «Проблема» говорит тебе обо мне, чтобы мы поссорились? Веришь ли ты ей?' },
  { id: 460, category:'deep', en:'What name would we give to that state when we\'re both silent and angry?', no:'Hva ville vi kalt den tilstanden der vi begge er stille og sinte?', ru:'Как мы можем перехитрить «Скуку» в долгосрочных отношениях?' },
  { id: 461, category:'deep', en:'How does \'Pride\' prevent us from being the first to reach out after a conflict?', no:'Hvordan hindrer «Stolthet» oss i å rekke ut hånden først etter en konflikt?', ru:'В какие моменты мы сильнее, чем любая внешняя трудность?' },
  { id: 462, category:'deep', en:'Which \'allies\' — friends, hobbies, humour — help us drive problems out of our relationship?', no:'Hvilke «allierte» — venner, hobbyer, humor — hjelper oss med å drive problemer ut av forholdet?', ru:'Как «Прошлое» иногда пытается переписать наше «Настоящее»?' },
  { id: 463, category:'deep', en:'If \'Fatigue\' takes over our evening, what is our plan of counterattack?', no:'Hvis «Tretthet» tar over kvelden vår, hva er motangrepet vårt?', ru:'Какой «костюм» надевает на нас конфликт, когда мы перестаем видеть друг друга настоящих?' },
  { id: 464, category:'deep', en:'What does \'The Problem\' tell you about me to make us argue? Do you believe it?', no:'Hva forteller «Problemet» deg om meg for å få oss til å krangle? Tror du på det?', ru:'Как мы можем научиться смеяться над нашими типичными проблемами?' },
  { id: 465, category:'deep', en:'How can we outsmart \'Boredom\' in a long-term relationship?', no:'Hvordan kan vi overliste «Kjedsomhet» i et langvarig forhold?', ru:'Какое оружие (слово, жест) самое эффективное против нашего «семейного кризиса»?' },
  { id: 466, category:'deep', en:'In which moments are we stronger than any external difficulty?', no:'I hvilke øyeblikk er vi sterkere enn enhver ytre vanskelighet?', ru:'Что помогает нам оставаться Авторами своей жизни, а не жертвами обстоятельств?' },
  { id: 467, category:'bold', en:'If I stopped loving you, how do you think you would be the first to know?', no:'Hvis jeg sluttet å elske deg, hvordan tror du du ville bli den første til å vite det?', ru:'Если бы я перестал(а) тебя любить, как бы ты это узнал(а) первым(ой)?' },
  { id: 468, category:'bold', en:'Do you believe I would stay with you if you became a \'failure\'?', no:'Tror du jeg ville bli hos deg hvis du ble en \'taper\'?', ru:'Веришь ли ты, что я останусь с тобой, если ты станешь «неудачником(цей)»?' },
  { id: 469, category:'bold', en:'Do you trust that I will stay with you if you become a \'failure\'?', no:'Stoler du på at jeg vil bli hos deg hvis du blir en «taper»?', ru:'Какой твой самый глубокий страх, связанный с нашей эмоциональной связью?' },
  { id: 470, category:'bold', en:'What is your deepest fear connected to our emotional bond?', no:'Hva er din dypeste frykt knyttet til den følelsesmessige båndet vårt?', ru:'Если бы ты мог(ла) изменить один мой паттерн поведения в ссоре, что бы это было?' },
  { id: 471, category:'bold', en:'If you could change one pattern of my behaviour during arguments, what would it be?', no:'Hvis du kunne endre ett atferdsmønster av meg under krangler, hva ville det vært?', ru:'Когда ты чувствуешь, что я «не на твоей стороне», как сильно это тебя разрушает?' },
  { id: 472, category:'bold', en:'When you feel I\'m \'not on your side\', how deeply does that destroy you?', no:'Når du føler at jeg «ikke er på din side», hvor dypt ødelegger det deg?', ru:'Боишься ли ты, что я когда-нибудь пойму, что ты мне «не подходишь»?' },
  { id: 473, category:'bold', en:'What part of your pain do you think is too heavy for me to carry?', no:'Hvilken del av smerten din tror du er for tung for meg å bære?', ru:'Какую часть своей боли ты считаешь слишком тяжелой для меня?' },
  { id: 474, category:'bold', en:'What in my behaviour makes you feel \'invisible\'?', no:'Hva ved min atferd får deg til å føle deg «usynlig»?', ru:'Что в моем поведении заставляет тебя чувствовать себя «невидимым(ой)»?' },
  { id: 475, category:'bold', en:'If I withdraw into myself, will you fight for me or quietly step back?', no:'Hvis jeg trekker meg inn i meg selv, vil du kjempe for meg eller stille trekke deg tilbake?', ru:'Какая правда о твоих чувствах ко мне кажется тебе самой пугающей?' },
  { id: 476, category:'bold', en:'When you feel unvalued by me, how does that change your attitude towards me?', no:'Når du føler deg undervurdert av meg, hvordan endrer det holdningen din til meg?', ru:'Если я уйду в себя, будешь ли ты бороться за меня или молча отступишь?' },
  { id: 477, category:'bold', en:'How do you know when our \'We\' is under threat?', no:'Hvordan vet du når «Vi» er under trussel?', ru:'Когда ты чувствуешь, что я тебя не ценю, как это меняет твое отношение ко мне?' },
  { id: 478, category:'bold', en:'Is there something I do that makes you feel \'not enough\'?', no:'Er det noe jeg gjør som får deg til å føle deg \'ikke nok\'?', ru:'Есть ли что-то, что я делаю, что заставляет тебя чувствовать себя «недостаточным(ой)»?' },
  { id: 479, category:'bold', en:'Which emotion is hardest for you to express in my presence?', no:'Hvilken følelse er vanskeligst for deg å uttrykke i min nærvær?', ru:'Как ты понимаешь, что наше «Мы» находится под угрозой?' },
  { id: 480, category:'bold', en:'If we had one hour left to talk, which fear would you tell me about?', no:'Hvis vi hadde én time igjen til å snakke, hvilken frykt ville du fortelle meg om?', ru:'Какую эмоцию тебе сложнее всего выразить рядом со мной?' },
  { id: 481, category:'bold', en:'What about our closeness frightens you the most?', no:'Hva ved nærheten vår skremmer deg mest?', ru:'Если бы у нас остался один час на разговор, о каком страхе ты бы мне рассказал(а)?' },
  { id: 482, category:'bold', en:'What promise must I give you so that you never doubt me?', no:'Hva slags løfte må jeg gi deg for at du aldri skal tvile på meg?', ru:'Что в нашей близости пугает тебя больше всего?' },
  { id: 483, category:'bold', en:'What core value must we pass on to our children or to the world?', no:'Hvilken kjerneverdi må vi formidle til barna våre eller til verden?', ru:'Какое обещание я должен(на) дать тебе, чтобы ты никогда не сомневался(лась) во мне?' },
  { id: 484, category:'bold', en:'What, in your view, is the highest purpose of our union?', no:'Hva er, etter din mening, den høyeste hensikten med foreningen vår?', ru:'Какую главную ценность мы должны передать нашим детям или миру?' },
  { id: 485, category:'bold', en:'What does \'a dignified old age together\' look like to you?', no:'Hva ser «en verdig alderdom sammen» ut som for deg?', ru:'В чем, по-твоему, заключается высшая цель нашего союза?' },
  { id: 486, category:'bold', en:'Which spiritual or philosophical beliefs unite us the most?', no:'Hvilke åndelige eller filosofiske overbevisninger forener oss mest?', ru:'Что для тебя означает «достойная старость» вместе со мной?' },
  { id: 487, category:'bold', en:'If a film were made about our couple, what would be its central idea?', no:'Hvis det ble laget en film om paret vårt, hva ville den sentrale ideen vært?', ru:'Какие духовные или философские убеждения нас объединяют сильнее всего?' },
  { id: 488, category:'bold', en:'How can we make our home a place of strength for both of us?', no:'Hvordan kan vi gjøre hjemmet til et kraftsted for oss begge?', ru:'Если бы о нашей паре сняли фильм, какая главная идея была бы в нем заложена?' },
  { id: 489, category:'bold', en:'What legacy — material or emotional — are we creating right now?', no:'Hvilket arv — materielt eller følelsesmessig — skaper vi akkurat nå?', ru:'Как мы можем сделать наш дом местом силы для обоих?' },
  { id: 490, category:'bold', en:'What is more important to you — our shared happiness or each person\'s individual success? How do we balance that?', no:'Hva er viktigere for deg — vår felles lykke eller hvert menneskes individuelle suksess? Hvordan balanserer vi det?', ru:'Какое наследие (материальное или эмоциональное) мы создаем прямо сейчас?' },
  { id: 491, category:'bold', en:'How do you see our role in the lives of our community or loved ones in 20 years?', no:'Hvordan ser du rollen vår i livet til samfunnet eller de nærmeste om 20 år?', ru:'Что для тебя важнее: наше общее счастье или личный успех каждого? Как это сбалансировать?' },
  { id: 492, category:'bold', en:'What traditions must we create to keep our bond from weakening over time?', no:'Hvilke tradisjoner må vi skape for å hindre at båndet vårt svekkes over tid?', ru:'Как ты видишь нашу роль в жизни общества или наших близких через 20 лет?' },
  { id: 493, category:'bold', en:'What does faithfulness mean to you — not just physical, but emotional?', no:'Hva betyr troskap for deg — ikke bare fysisk, men følelsesmessig?', ru:'Какие традиции мы должны создать, чтобы наша связь не ослабела со временем?' },
  { id: 494, category:'bold', en:'How do you know that our life purposes still align?', no:'Hvordan vet du at livsformålene våre fortsatt stemmer overens?', ru:'Что для тебя значит «быть верным» не только физически, но и эмоционально?' },
  { id: 495, category:'bold', en:'If we lost all possessions, what would remain the foundation of our relationship?', no:'Hvis vi mistet alle eiendeler, hva ville forbli grunnlaget for forholdet?', ru:'Как ты понимаешь, что наши смыслы жизни всё еще совпадают?' },
  { id: 496, category:'bold', en:'What is the greatest sacrifice you are ready to make for our shared purpose?', no:'Hva er den største offeret du er klar til å bringe for vårt felles formål?', ru:'Если бы мы потеряли всё имущество, что бы осталось основой наших отношений?' },
  { id: 497, category:'bold', en:'What beauty do you see in our shared path, despite all the difficulties?', no:'Hvilken skjønnhet ser du i vår felles vei, til tross for alle vanskelighetene?', ru:'Какую самую большую жертву ради нашего общего смысла ты готов(а) принести?' },
  { id: 498, category:'bold', en:'How do you want people to remember us as a couple?', no:'Hvordan ønsker du at folk skal huske oss som par?', ru:'В чем ты видишь красоту нашего совместного пути, несмотря на все трудности?' },
  { id: 499, category:'bold', en:'What single word best describes the \'spirit\' of our family?', no:'Hvilket enkelt ord beskriver best «ånden» i familien vår?', ru:'Как ты хочешь, чтобы нас вспоминали люди как пару?' },
  { id: 500, category:'bold', en:'Which \'negative\' trait of mine did you unconsciously choose because it mirrors something from your past?', no:'Hvilken «negativ» egenskap ved meg valgte du ubevisst fordi den speiler noe fra fortiden din?', ru:'Какое слово лучше всего описывает «дух» нашей семьи?' },
  { id: 501, category:'bold', en:'Which \'negative\' trait of mine did you unconsciously choose to replay a pattern from the past?', no:'Hvilken \'negativ\' egenskap hos meg valgte du ubevisst for å gjenta et mønster fra fortiden?', ru:'Какую мою «негативную» черту ты бессознательно выбрал(а), чтобы отыграть сценарий из прошлого?' },
  { id: 502, category:'bold', en:'If you could ask me for one change that would heal your old pain, what would it be?', no:'Hvis du kunne be meg om én endring som ville lege din gamle smerte, hva ville det vært?', ru:'Если бы ты мог(ла) попросить меня об одном изменении, которое исцелит твою старую боль, что бы это было?' },
  { id: 503, category:'bold', en:'In which situations do you feel that I am your \'saviour\', and in which your \'tormentor\'?', no:'I hvilke situasjoner føler du at jeg er din «redningsmann», og i hvilke din «plageånd»?', ru:'В какой ситуации ты чувствуешь, что я — твой «спаситель», а в какой — «мучитель»?' },
  { id: 504, category:'bold', en:'What truth about yourself are you afraid to reveal to me — in case I stop respecting you?', no:'Hvilken sannhet om deg selv er du redd for å avsløre for meg — i tilfelle jeg slutter å respektere deg?', ru:'Какую правду о себе ты боишься открыть мне, чтобы я не перестал(а) тебя уважать?' },
  { id: 505, category:'bold', en:'Which part of your inner life do you work hardest to keep hidden from me?', no:'Hvilken del av ditt indre liv jobber du hardest for å skjule for meg?', ru:'Как ты думаешь, за что я могу тебя возненавидеть?' },
  { id: 506, category:'bold', en:'What do you think I could hate you for?', no:'Hva tror du at jeg kan hate deg for?', ru:'Что ты во мне «не перевариваешь», потому что это есть в тебе самом(ой)?' },
  { id: 507, category:'bold', en:'What in me do you \'not digest\', because it is actually in yourself?', no:'Hva ved meg «tåler du ikke», fordi det egentlig finnes i deg selv?', ru:'В чем ты видишь свою главную «недодачу» мне в этих отношениях?' },
  { id: 508, category:'bold', en:'In what way do you see your main \'shortcoming\' towards me in this relationship?', no:'På hvilken måte ser du din viktigste «mangel» overfor meg i dette forholdet?', ru:'Если бы мы расстались сегодня, какой главный урок об исцелении ты бы вынес(ла)?' },
  { id: 509, category:'bold', en:'If we broke up today, what would be the main lesson about healing that you would take away?', no:'Hvis vi brøt opp i dag, hva ville vært den viktigste leksjonen om helbredelse du ville tatt med deg?', ru:'Какую часть своей души ты «запер(ла) на замок» даже от меня?' },
  { id: 510, category:'bold', en:'Which part of your soul have you \'locked away\' even from me?', no:'Hvilken del av sjelen din har du «låst inne» selv fra meg?', ru:'Как ты думаешь, почему мы встретились именно в тот период жизни?' },
  { id: 511, category:'bold', en:'Why do you think we met in that particular period of life?', no:'Hvorfor tror du at vi møttes i akkurat den perioden av livet?', ru:'Какое твое самое болезненное ожидание от меня, которое я никогда не исполню?' },
  { id: 512, category:'bold', en:'What is your most painful expectation of me that I will never be able to fulfil?', no:'Hva er din mest smertefulle forventning til meg som jeg aldri vil kunne innfri?', ru:'Что ты чувствуешь, когда я становлюсь похожим(ей) на человека, которого ты не любишь?' },
  { id: 513, category:'bold', en:'What do you feel when I start behaving like someone you don\'t love?', no:'Hva kjenner du når jeg begynner å oppføre meg som noen du ikke elsker?', ru:'В чем ты видишь свою «теневую» выгоду от наших ссор?' },
  { id: 514, category:'bold', en:'What \'shadow benefit\' do you see for yourself in our arguments?', no:'Hvilken «skjult fordel» ser du for deg selv i krangene våre?', ru:'Как ты можешь помочь мне стать более «свободным(ой)» от моих страхов?' },
  { id: 515, category:'bold', en:'How can you help me become more \'free\' from my fears?', no:'Hvordan kan du hjelpe meg med å bli mer «fri» fra frykten min?', ru:'Какую свою черту ты считаешь «невыносимой» для долгой жизни?' },
  { id: 516, category:'bold', en:'Which trait of yours do you consider \'unbearable\' for a long life together?', no:'Hvilken egenskap ved deg anser du som «uutholdelig» i et langt liv sammen?', ru:'Что ты чувствуешь, когда я зеркально отражаю твою агрессию?' },
  { id: 517, category:'bold', en:'What do you feel when I mirror your aggression back at you?', no:'Hva kjenner du når jeg speiler aggresjonen din tilbake til deg?', ru:'Как мы можем превратить нашу «борьбу» в совместный рост прямо сегодня?' },
  { id: 518, category:'bold', en:'How can we turn our \'struggle\' into shared growth starting today?', no:'Hvordan kan vi gjøre «kampen» vår til felles vekst fra i dag?', ru:'Какая невысказанная фраза из прошлого до сих пор «крутится» у тебя в голове?' },
  { id: 519, category:'bold', en:'Which unspoken phrase from the past is still spinning in your head?', no:'Hvilken uuttalt frase fra fortiden spinner fortsatt rundt i hodet ditt?', ru:'Какой наш конфликт ты считаешь «незакрытым», даже если мы помирились?' },
  { id: 520, category:'bold', en:'Which conflict of ours do you consider \'unresolved\', even though we made up?', no:'Hvilken konflikt mellom oss anser du som «uløst», selv om vi forlikte oss?', ru:'Что ты не можешь мне простить, потому что мы это так и не обсудили до конца?' },
  { id: 521, category:'bold', en:'What can you not forgive me for, because we never fully discussed it?', no:'Hva kan du ikke tilgi meg for, fordi vi aldri diskuterte det fullt ut?', ru:'Если бы ты мог(ла) прямо сейчас вернуть один момент из прошлого и поступить иначе, что бы это было?' },
  { id: 522, category:'bold', en:'If you could go back and act differently in one of our hardest moments, what would you change?', no:'Hvis du kunne gå tilbake og handle annerledes i ett av de hardeste øyeblikkene våre, hva ville du endret?', ru:'О какой своей потере или боли ты мне никогда не рассказывал(а) полностью?' },
  { id: 523, category:'bold', en:'What loss or pain of yours have you never fully shared with me?', no:'Hvilke tap eller smerte din har du aldri fortalt meg fullstendig om?', ru:'Какое свое обещание мне ты считаешь невыполненным и это тебя гложет?' },
  { id: 524, category:'bold', en:'Which promise you made to me do you feel you haven\'t kept, and it gnaws at you?', no:'Hvilket løfte du ga meg føler du at du ikke har holdt, og som gnager deg?', ru:'Что ты чувствуешь, когда понимаешь, что мы «ходим по кругу» в одной и той же проблеме?' },
  { id: 525, category:'bold', en:'What question to me have you been carrying for over a year, but are afraid to ask?', no:'Hvilket spørsmål til meg har du båret på i over et år, men er redd for å stille?', ru:'Какой вопрос ко мне ты носишь в себе уже больше года, но боишься задать?' },
  { id: 526, category:'bold', en:'What do you feel when you realise we are going in circles around the same problem?', no:'Hva kjenner du når du innser at vi går i ring rundt det samme problemet?', ru:'Если бы наши отношения закончились сегодня, какой «долг» перед тобой остался бы у меня?' },
  { id: 527, category:'bold', en:'Which question about me have you been carrying for over a year but are afraid to ask?', no:'Hvilke spørsmål om meg har du båret på i over et år, men er redd for å stille?', ru:'В какой ситуации ты чувствовал(а), что я тебя «бросил(а)», хотя я был(а) рядом?' },
  { id: 528, category:'bold', en:'If our relationship ended today, what \'debt\' towards you would remain on my side?', no:'Hvis forholdet vårt tok slutt i dag, hvilken «gjeld» overfor deg ville bli igjen på min side?', ru:'Что в моем поведении напоминает тебе о твоих самых больших жизненных неудачах?' },
  { id: 529, category:'bold', en:'In which situation did you feel I \'abandoned\' you even though I was physically there?', no:'I hvilken situasjon følte du at jeg «forlot» deg selv om jeg var fysisk til stede?', ru:'Какую правду о своем прошлом ты скрываешь, потому что она «не вписывается» в нашу историю?' },
  { id: 530, category:'bold', en:'What in my behaviour reminds you of your greatest failures in life?', no:'Hva ved min atferd minner deg om de største nedturene dine i livet?', ru:'Когда ты чувствуешь, что я тебя «использую» для завершения своих личных проблем?' },
  { id: 531, category:'bold', en:'In what way do you feel \'deceived\' in our mutual expectations?', no:'På hvilken måte føler du deg \'lurt\' i de gjensidige forventningene våre?', ru:'В чем ты чувствуешь себя «обманутым(ой)» в наших ожиданиях друг от друга?' },
  { id: 532, category:'bold', en:'What truth about your past do you hide because it \'doesn\'t fit\' into our story?', no:'Hvilken sannhet om fortiden din skjuler du fordi den «ikke passer» inn i historien vår?', ru:'Какое твое «хочу» в отношениях ты подавляешь больше всего?' },
  { id: 533, category:'bold', en:'When do you feel that I\'m using you to work through my own personal issues?', no:'Når føler du at jeg bruker deg til å bearbeide mine egne personlige problemer?', ru:'Если бы ты мог(ла) сейчас выкрикнуть одну фразу мне в лицо, что бы это было?' },
  { id: 534, category:'bold', en:'In what area do you feel \'deceived\' by the expectations we had of each other?', no:'På hvilken måte føler du deg «sveket» av forventningene vi hadde til hverandre?', ru:'Как мы можем «допрожить» ту старую боль вместе прямо сейчас, чтобы она нас отпустила?' },
  { id: 535, category:'bold', en:'Which desire of yours in the relationship do you suppress the most?', no:'Hvilket ønske ditt i forholdet undertrykker du mest?', ru:'Вспомни момент, когда всё должно было закончиться провалом, но мы чудом спаслись. Как это было?' },
  { id: 536, category:'bold', en:'How can we \'live through\' that old pain together right now so it can finally release us?', no:'Hvordan kan vi «gjennomgå» den gamle smerten sammen akkurat nå slik at den endelig kan slippe oss?', ru:'Какую «тайную историю» нашей любви мы еще не открыли миру?' },
  { id: 537, category:'bold', en:'Recall a moment when everything should have ended in failure, but we miraculously saved ourselves. What was it like?', no:'Husk et øyeblikk da alt burde ha endt i fiasko, men vi mirakuløst reddet oss. Hvordan var det?', ru:'Если бы ты мог(ла) переписать концовку нашего самого тяжелого конфликта, как бы она выглядела в идеале?' },
  { id: 538, category:'bold', en:'What \'secret story\' of our love have we not yet revealed to the world?', no:'Hvilken «hemmelig historie» om kjærligheten vår har vi ennå ikke avslørt for verden?', ru:'Какой «светлый момент» этой недели мы незаслуженно забыли обсудить?' },
  { id: 539, category:'bold', en:'If you could rewrite the ending of our hardest conflict, what would it ideally look like?', no:'Hvis du kunne skrive om slutten på den hardeste konflikten vår, hvordan ville det ideelt sett ut?', ru:'Что в нашей истории делает нас уникальной парой, не похожей ни на одну другую?' },
  { id: 540, category:'bold', en:'Which \'bright moment\' of this week did we unfairly forget to discuss?', no:'Hvilke «lyse øyeblikk» fra denne uken glemte vi ufortjent å snakke om?', ru:'Если бы ты писал(а) письмо нам в будущее (через 10 лет), о чем бы ты нас предупредил(а)?' },
  { id: 541, category:'bold', en:'What in our story makes us a unique couple unlike any other?', no:'Hva i historien vår gjør oss til et unikt par som ikke ligner noe annet?', ru:'Какую часть нашей «старой истории» пора оставить в прошлом и больше к ней не возвращаться?' },
  { id: 542, category:'bold', en:'If you were writing a letter to us in the future — in 10 years — what would you warn us about?', no:'Hvis du skrev et brev til oss i fremtiden — om 10 år — hva ville du advart oss om?', ru:'В чем заключается «истинная правда» нашей любви, которую невозможно выразить словами?' },
  { id: 543, category:'bold', en:'Which part of our \'old story\' is it time to leave in the past and never return to?', no:'Hvilken del av vår «gamle historie» er det på tide å legge igjen i fortiden og aldri vende tilbake til?', ru:'Если бы мы создавали новую религию или философию на основе нашего опыта, каковы были бы её главные догмы?' },
  { id: 544, category:'bold', en:'What is the \'true truth\' of our love that cannot be expressed in words?', no:'Hva er den «sanne sannheten» om kjærligheten vår som ikke kan uttrykkes i ord?', ru:'Какой момент в нашей истории ты считаешь самым священным или неприкосновенным?' },
  { id: 545, category:'bold', en:'If we were creating a new philosophy based on our experience, what would its main principles be?', no:'Hvis vi skapte en ny filosofi basert på erfaringene våre, hva ville dens hovedprinsipper vært?', ru:'Как мы изменили судьбы друг друга, просто встретившись?' },
  { id: 546, category:'bold', en:'Which moment in our history do you consider the most sacred or untouchable?', no:'Hvilket øyeblikk i historien vår anser du som det mest hellige eller ukrenkelige?', ru:'Что в нашей паре является «вечным двигателем», который никогда не остановится?' },
  { id: 547, category:'bold', en:'How have we changed each other\'s fates simply by meeting?', no:'Hvordan har vi endret hverandres skjebner bare ved å møtes?', ru:'Если бы наша история была бесконечной, какой урок мы бы проходили снова и снова?' },
  { id: 548, category:'bold', en:'What in our couple is the \'perpetual motion\' that will never stop?', no:'Hva i paret vårt er den «evige bevegelsen» som aldri vil stoppe?', ru:'Какой твой самый смелый прогноз для главы «Наше Будущее»?' },
  { id: 549, category:'bold', en:'If our story were infinite, what lesson would we keep learning again and again?', no:'Hvis historien vår var uendelig, hvilken leksjon ville vi lære igjen og igjen?', ru:'Как мы можем сделать нашу историю более «светлой» прямо завтрашним утром?' },
  { id: 550, category:'bold', en:'What is your boldest prediction for the chapter called \'Our Future\'?', no:'Hva er din dristigste prediksjon for kapittelet kalt «Vår Fremtid»?', ru:'Что в тебе изменилось навсегда благодаря тому, что ты — герой нашей общей книги?' },
  { id: 551, category:'bold', en:'How can we make our story \'brighter\' starting from tomorrow morning?', no:'Hvordan kan vi gjøre historien vår «lysere» fra i morgen tidlig?', ru:'Если завтра наша история оборвется, какое последнее предложение ты бы в неё вписал(а)?' }
];

const TAG = {
  light:  { en:'☽ Light',     no:'☽ Lett',    ru:'☽ Лёгкий'   },
  deep:   { en:'✦ Deep',      no:'✦ Dyp',     ru:'✦ Глубокий' },
  bold:   { en:'♡ Bold',      no:'♡ Modig',   ru:'♡ Смелый'   },
  custom: { en:'✎ Mine',      no:'✎ Mine',    ru:'✎ Мои'      },
};

const PAGE_TITLE = {
  en: 'Snakke — Questions Game',
  no: 'Snakke — Spørsmålsspill',
  ru: 'Snakke — Игра с вопросами',
};

const LABELS = {
  save:         { en: 'Save card',                no: 'Lagre kort',                  ru: 'Сохранить карточку' },
  unsave:       { en: 'Remove saved card',        no: 'Fjern lagret kort',           ru: 'Убрать из сохранённых' },
  delete:       { en: 'Delete custom card',       no: 'Slett eget kort',             ru: 'Удалить свою карточку' },
  open:         { en: 'Open card',                no: 'Åpne kort',                   ru: 'Открыть карточку' },
  share:        { en: 'Share card',               no: 'Del kort',                    ru: 'Поделиться карточкой' },
  playMusic:    { en: 'Play background music',    no: 'Spill bakgrunnsmusikk',       ru: 'Включить фоновую музыку' },
  pauseMusic:   { en: 'Pause background music',   no: 'Pause bakgrunnsmusikk',       ru: 'Поставить музыку на паузу' },
  fireOn:       { en: 'Turn on campfire sound',   no: 'Slå på bålyd',                ru: 'Включить звук костра' },
  fireOff:      { en: 'Turn off campfire sound',  no: 'Slå av bålyd',                ru: 'Выключить звук костра' },
  closeRules:   { en: 'Close rules',              no: 'Lukk regler',                 ru: 'Закрыть правила' },
  closeCreate:  { en: 'Close card creator',       no: 'Lukk kortbygger',             ru: 'Закрыть создание карточки' },
  closeCard:    { en: 'Close card',               no: 'Lukk kort',                   ru: 'Закрыть карточку' },
  closeNote:    { en: 'Close round note',         no: 'Lukk rundenotat',             ru: 'Закрыть заметку о раунде' },
  prevCard:     { en: 'Previous card',            no: 'Forrige kort',                ru: 'Предыдущая карточка' },
  nextCard:     { en: 'Next card',                no: 'Neste kort',                  ru: 'Следующая карточка' },
  shuffleDeck:  { en: 'Shuffle deck',             no: 'Bland kortstokken',           ru: 'Перемешать колоду' },
  clearNotes:   { en: 'Clear saved notes',        no: 'Tøm lagrede notater',         ru: 'Очистить сохранённые заметки' },
};

const TURN = {
  a: { en: 'Partner A', no: 'Partner A', ru: 'Партнёр A' },
  b: { en: 'Partner B', no: 'Partner B', ru: 'Партнёр B' },
};

const ROUND_TITLES = {
  random:  { en: 'Random deck',         no: 'Tilfeldig kortstokk',   ru: 'Случайная колода' },
  partner: { en: 'Partner mode',        no: 'Partnermodus',          ru: 'Режим для двоих' },
  resume:  { en: 'Continue last round', no: 'Fortsett runden',       ru: 'Продолжить раунд' },
};

const TOAST = {
  copied:        { en: 'Card link copied.',            no: 'Kortlenke kopiert.',               ru: 'Ссылка на карточку скопирована.' },
  shared:        { en: 'Card shared.',                 no: 'Kort delt.',                       ru: 'Карточка отправлена.' },
  noteSaved:     { en: 'Round note saved.',            no: 'Rundenotat lagret.',              ru: 'Заметка о раунде сохранена.' },
  notesCleared:  { en: 'Saved notes cleared.',         no: 'Lagrede notater tømt.',           ru: 'Сохранённые заметки очищены.' },
  resumeMissing: { en: 'No saved round to continue.',  no: 'Ingen lagret runde å fortsette.', ru: 'Нет сохранённого раунда.' },
  shareError:    { en: 'Could not share this card.',   no: 'Kunne ikke dele kortet.',         ru: 'Не удалось поделиться карточкой.' },
};

const PLACEHOLDERS = {
  noteInput: {
    en: 'Name the moment, the truth, or what you want to return to.',
    no: 'Beskriv øyeblikket, sannheten eller det dere vil vende tilbake til.',
    ru: 'Назовите момент, мысль или правду, к которой хочется вернуться.',
  },
};

const NOTE_MOODS = {
  soft:    { en: 'Soft',    no: 'Myk',     ru: 'Мягко' },
  open:    { en: 'Open',    no: 'Åpent',   ru: 'Открыто' },
  intense: { en: 'Intense', no: 'Intenst', ru: 'Интенсивно' },
};

const SCENARIOS = [
  {
    id: 'warmup',
    tone: 'light',
    size: 6,
    kicker: { en: 'Warm', no: 'Myk', ru: 'Мягко' },
    title:  { en: 'Warm-up 6', no: 'Oppvarming 6', ru: 'Разогрев 6' },
    meta:   { en: '6 cards • 8 min', no: '6 kort • 8 min', ru: '6 карт • 8 мин' },
    mix:    { en: '6 light cards', no: '6 lette kort', ru: '6 лёгких карточек' },
    recipe: [{ category: 'light', count: 6 }],
  },
  {
    id: 'tonight',
    tone: 'mixed',
    size: 5,
    kicker: { en: 'Easy start', no: 'Lett start', ru: 'Лёгкий старт' },
    title:  { en: "Tonight's 5", no: 'Kveldens 5', ru: '5 на вечер' },
    meta:   { en: '5 cards • 10 min', no: '5 kort • 10 min', ru: '5 карт • 10 мин' },
    mix:    { en: '2 light • 2 deep • 1 bold', no: '2 lette • 2 dype • 1 modig', ru: '2 лёгкие • 2 глубокие • 1 смелая' },
    recipe: [{ category: 'light', count: 2 }, { category: 'deep', count: 2 }, { category: 'bold', count: 1 }],
  },
  {
    id: 'deepdive',
    tone: 'deep',
    size: 8,
    kicker: { en: 'Depth', no: 'Dybde', ru: 'Глубина' },
    title:  { en: 'Deep Dive', no: 'Gå dypere', ru: 'Глубже' },
    meta:   { en: '8 cards • 15 min', no: '8 kort • 15 min', ru: '8 карт • 15 мин' },
    mix:    { en: '6 deep • 2 bold', no: '6 dype • 2 modige', ru: '6 глубоких • 2 смелые' },
    recipe: [{ category: 'deep', count: 6 }, { category: 'bold', count: 2 }],
  },
  {
    id: 'brave',
    tone: 'bold',
    size: 7,
    kicker: { en: 'Brave', no: 'Modig', ru: 'Смело' },
    title:  { en: 'Brave Night', no: 'Modig kveld', ru: 'Смелый вечер' },
    meta:   { en: '7 cards • 12 min', no: '7 kort • 12 min', ru: '7 карт • 12 мин' },
    mix:    { en: '3 deep • 4 bold', no: '3 dype • 4 modige', ru: '3 глубокие • 4 смелые' },
    recipe: [{ category: 'deep', count: 3 }, { category: 'bold', count: 4 }],
  },
];

const PARTNER_RECIPE = [
  { category: 'light', count: 4 },
  { category: 'deep', count: 4 },
  { category: 'bold', count: 4 },
];

// ── STATE ──
let lang   = readText(STORAGE.lang, document.documentElement.lang || 'en');
if (!['en', 'no', 'ru'].includes(lang)) lang = 'en';
let filter = 'all', deck = [], idx = 0, session = 0;
let saved  = new Set(readJSON(STORAGE.saved, []));
let custom = readJSON(STORAGE.custom, []);
let notes  = readJSON(STORAGE.notes, []);
let cardHistory = readJSON(STORAGE.history, []);
let searchQuery = '';
let custId = Math.max(Date.now(), ...custom.map(c => c.id || 0), 0);
let lastFocusedElement = null;
let roundMeta = { source: 'random', label: t(ROUND_TITLES.random), partnerMode: false };

function t(copy) { return copy[lang] || copy.en; }
function allCards()   { return [...CARDS, ...custom]; }
function saveSaved()  { writeJSON(STORAGE.saved, [...saved]); }
function saveCustom() { writeJSON(STORAGE.custom, custom); }
function saveNotes()  { writeJSON(STORAGE.notes, notes); }
function saveHistory() { writeJSON(STORAGE.history, cardHistory.slice(0, 50)); }
function addToHistory(cardId) {
  cardHistory = cardHistory.filter(id => id !== cardId);
  cardHistory.unshift(cardId);
  saveHistory();
}
function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
function rememberFocus() { lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null; }
function restoreFocus() {
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
  lastFocusedElement = null;
}
function shuffleList(list) { return [...list].sort(() => Math.random() - 0.5); }
function takeRandom(list, count) { return shuffleList(list).slice(0, Math.min(count, list.length)); }
function formatDate(value) {
  return new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
function track(name, props = {}) {
  const payload = { name, props, ts: new Date().toISOString() };
  const recent = readJSON(STORAGE.events, []);
  recent.unshift(payload);
  writeJSON(STORAGE.events, recent.slice(0, 80));

  window.dispatchEvent(new CustomEvent('snakke:track', { detail: payload }));
  if (typeof window.plausible === 'function') window.plausible(name, { props });
  if (window.umami?.track) window.umami.track(name, props);
  if (typeof window.gtag === 'function') window.gtag('event', name, props);
  if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name, ...props });
}

window.Snakke = {
  track,
  getRecentEvents() {
    return readJSON(STORAGE.events, []);
  },
};

function buildScenarioDeck(recipe) {
  const all = allCards();
  const picked = [];
  const usedIds = new Set();
  const targetSize = recipe.reduce((sum, step) => sum + step.count, 0);

  recipe.forEach(step => {
    const pool = all.filter(card => card.category === step.category && !usedIds.has(card.id));
    takeRandom(pool, step.count).forEach(card => {
      usedIds.add(card.id);
      picked.push(card);
    });
  });

  if (picked.length < targetSize) {
    takeRandom(all.filter(card => !usedIds.has(card.id)), targetSize - picked.length).forEach(card => {
      usedIds.add(card.id);
      picked.push(card);
    });
  }

  return shuffleList(picked);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('visible'), 2200);
}

function resolveStoredDeck(cardIds = []) {
  const byId = new Map(allCards().map(card => [card.id, card]));
  return cardIds.map(id => byId.get(id)).filter(Boolean);
}

function bumpSession() {
  session++;
  document.getElementById('sessionCount').textContent = session;
  document.getElementById('sessionCounter').classList.add('visible');
}

function persistLastRound() {
  if (!deck.length) return;
  writeJSON(STORAGE.lastRound, {
    cardIds: deck.map(card => card.id),
    idx,
    roundMeta,
    savedAt: new Date().toISOString(),
  });
  syncResumeButton();
}

function readLastRound() {
  return readJSON(STORAGE.lastRound, null);
}

function syncResumeButton() {
  const btn = document.getElementById('btnResume');
  const lastRound = readLastRound();
  if (!btn) return;
  const hasRound = lastRound && Array.isArray(lastRound.cardIds) && lastRound.cardIds.length;
  btn.hidden = !hasRound;
  if (hasRound) {
    const total    = lastRound.cardIds.length;
    const progress = Math.min((lastRound.idx || 0) + 1, total);
    const badge    = document.getElementById('resumeChipCount');
    if (badge) badge.textContent = `${progress}/${total}`;
  }
}

function resumeLastRound() {
  const lastRound = readLastRound();
  if (!lastRound) {
    showToast(t(TOAST.resumeMissing));
    return;
  }

  const cards = resolveStoredDeck(lastRound.cardIds);
  if (!cards.length) {
    removeStored(STORAGE.lastRound);
    syncResumeButton();
    showToast(t(TOAST.resumeMissing));
    return;
  }

  const safeIndex = Math.min(lastRound.idx || 0, cards.length - 1);
  openDeckDirect(cards, cards[safeIndex].id, {
    ...lastRound.roundMeta,
    label: lastRound.roundMeta?.label || t(ROUND_TITLES.resume),
  });
  track('round_resumed', {
    source: lastRound.roundMeta?.source || 'resume',
    partnerMode: !!lastRound.roundMeta?.partnerMode,
    size: cards.length,
  });
}

// ── RULES ──
const RULES = {
  en: [
    {
      icon: '✦',
      title: 'How to play',
      text: 'Draw a card, read the question aloud, and answer honestly. There are no right or wrong answers — only your truth. Take turns, or let whoever feels ready go first.',
    },
    {
      icon: '🚦',
      title: 'The traffic light',
      text: 'Use the traffic light to signal your comfort level — no explanation needed.',
      lights: [
        { color: 'green',  dot: '🟢', label: 'Green', desc: { en: "I'm in. Answer openly and fully.", no: 'Jeg er med. Svarer åpent og fullt ut.', ru: 'Я в деле. Отвечаю открыто и полностью.' } },
        { color: 'yellow', dot: '🟡', label: 'Yellow', desc: { en: 'I\'d like to answer partially, or take a moment.', no: 'Vil svare delvis, eller trenger et øyeblikk.', ru: 'Хочу ответить частично или мне нужна минута.' } },
        { color: 'red',    dot: '🔴', label: 'Red', desc: { en: "I'm passing. No explanation needed.", no: 'Jeg hopper over. Ingen forklaring nødvendig.', ru: 'Пропускаю. Никаких объяснений не нужно.' } },
      ],
    },
    {
      icon: '♡',
      title: 'The only rule',
      text: 'Respect every red and yellow light without question or pressure. What is shared here, stays here.',
    },
    {
      icon: '☽',
      title: 'Tips for connection',
      text: 'Listen without planning your reply. Curiosity is kinder than advice. Silence is allowed — not every question needs words.',
    },
    {
      icon: '✧',
      title: 'Remember',
      text: 'Vulnerability is not weakness. The deeper you go together, the closer you become.',
    },
  ],
  no: [
    {
      icon: '✦',
      title: 'Slik spiller du',
      text: 'Trekk et kort, les spørsmålet høyt og svar ærlig. Det finnes ingen riktige eller gale svar — bare din sannhet. Bytt på å svare, eller la den som føler seg klar gå først.',
    },
    {
      icon: '🚦',
      title: 'Trafikklyset',
      text: 'Bruk trafikklyset til å signalisere komfortnivået ditt — ingen forklaring nødvendig.',
      lights: [
        { color: 'green',  dot: '🟢', label: 'Grønt',  desc: 'Jeg er med. Svarer åpent og fullt ut.' },
        { color: 'yellow', dot: '🟡', label: 'Gult',   desc: 'Vil svare delvis, eller trenger et øyeblikk.' },
        { color: 'red',    dot: '🔴', label: 'Rødt',   desc: 'Jeg hopper over. Ingen forklaring nødvendig.' },
      ],
    },
    {
      icon: '♡',
      title: 'Den eneste regelen',
      text: 'Respekter hvert rødt og gult lys uten spørsmål eller press. Det som deles her, forblir her.',
    },
    {
      icon: '☽',
      title: 'Tips for nærhet',
      text: 'Lytt uten å planlegge svaret ditt. Nysgjerrighet er snillere enn råd. Stillhet er lov — ikke hvert spørsmål trenger ord.',
    },
    {
      icon: '✧',
      title: 'Husk',
      text: 'Sårbarhet er ikke svakhet. Jo dypere dere går sammen, jo nærmere blir dere.',
    },
  ],
  ru: [
    {
      icon: '✦',
      title: 'Как играть',
      text: 'Возьмите карточку, прочитайте вопрос вслух и ответьте честно. Правильных и неправильных ответов нет — только твоя правда. Отвечайте по очереди или пусть начнёт тот, кто готов.',
    },
    {
      icon: '🚦',
      title: 'Система светофора',
      text: 'Используй светофор, чтобы показать уровень комфорта — никаких объяснений не нужно.',
      lights: [
        { color: 'green',  dot: '🟢', label: 'Зелёный',  desc: 'Я в деле. Отвечаю открыто и полностью.' },
        { color: 'yellow', dot: '🟡', label: 'Жёлтый',   desc: 'Хочу ответить частично или мне нужна минута.' },
        { color: 'red',    dot: '🔴', label: 'Красный',  desc: 'Пропускаю. Никаких объяснений не нужно.' },
      ],
    },
    {
      icon: '♡',
      title: 'Единственное правило',
      text: 'Уважай каждый красный и жёлтый сигнал без вопросов и давления. То, что сказано здесь, остаётся здесь.',
    },
    {
      icon: '☽',
      title: 'Советы для близости',
      text: 'Слушай, не планируя ответ. Любопытство добрее совета. Молчание — тоже ответ: не каждый вопрос требует слов.',
    },
    {
      icon: '✧',
      title: 'Помни',
      text: 'Уязвимость — не слабость. Чем глубже вы заходите вместе, тем ближе становитесь.',
    },
  ],
};

function renderRules() {
  const body = document.getElementById('rulesBody');
  if (!body) return;
  const sections = RULES[lang] || RULES.en;
  body.innerHTML = sections.map((s, i) => {
    const lightsHtml = s.lights ? `
      <div class="traffic-lights">
        ${s.lights.map(l => `
          <div class="traffic-light traffic-light--${l.color}">
            <span class="traffic-light__dot"></span>
            <div>
              <strong>${l.label}</strong> — ${typeof l.desc === 'object' ? l.desc[lang] || l.desc.en : l.desc}
            </div>
          </div>`).join('')}
      </div>` : '';
    return `
      ${i > 0 ? '<div class="rules-divider"></div>' : ''}
      <div class="rules-block">
        <div class="rules-block__icon">${s.icon}</div>
        <div>
          <div class="rules-block__title">${s.title}</div>
          <div class="rules-block__text">${s.text}</div>
          ${lightsHtml}
        </div>
      </div>`;
  }).join('');
}

const rulesOverlay = document.getElementById('rulesOverlay');
const rulesPanel = rulesOverlay.querySelector('.rules-modal');
const rulesBtn = document.getElementById('rulesBtn');
const rulesClose = document.getElementById('rulesClose');
let syncMusicButton = function () {};

function openOverlay(overlay, panel, focusTarget) {
  if (!overlay) return;
  rememberFocus();
  overlay.classList.add('open');
  syncBodyLock();
  setTimeout(() => (focusTarget || panel)?.focus(), 80);
}

function closeOverlay(overlay) {
  overlay.classList.remove('open');
  syncBodyLock();
  restoreFocus();
}

function syncBodyLock() {
  document.body.style.overflow = document.querySelector('.overlay.open') ? 'hidden' : '';
}

function renderScenarios() {
  const grid = document.getElementById('scenarioGrid');
  if (!grid) return;
  grid.innerHTML = SCENARIOS.map(scenario => `
    <button class="session-card" type="button" data-scenario="${scenario.id}" data-tone="${scenario.tone}">
      <span class="session-card__kicker">${scenario.kicker[lang] || scenario.kicker.en}</span>
      <span class="session-card__title">${scenario.title[lang] || scenario.title.en}</span>
      <span class="session-card__meta">${scenario.meta[lang] || scenario.meta.en}</span>
      <span class="session-card__mix">${scenario.mix[lang] || scenario.mix.en}</span>
    </button>`).join('');

  grid.querySelectorAll('.session-card').forEach(card => {
    const scenario = SCENARIOS.find(item => item.id === card.dataset.scenario);
    if (!scenario) return;
    card.setAttribute('aria-label', `${scenario.title[lang] || scenario.title.en}. ${scenario.meta[lang] || scenario.meta.en}.`);
    card.addEventListener('click', () => {
      const cards = buildScenarioDeck(scenario.recipe);
      if (cards.length) openDeck(cards, cards[0].id, { source: `scenario:${scenario.id}`, label: scenario.title[lang] || scenario.title.en });
    });
  });
}

function renderNotes() {
  const section = document.getElementById('journalSection');
  const grid = document.getElementById('noteGrid');
  if (!section || !grid) return;

  if (!notes.length) {
    section.hidden = true;
    grid.innerHTML = '';
    return;
  }

  section.hidden = false;
  grid.innerHTML = notes.slice(0, 6).map(note => `
    <article class="note-card">
      <div class="note-card__top">
        <span class="note-card__tone">${escapeHTML(t(NOTE_MOODS[note.mood] || NOTE_MOODS.soft))}</span>
        <span class="note-card__date">${escapeHTML(formatDate(note.createdAt))}</span>
      </div>
      <h4 class="note-card__title">${escapeHTML(note.roundLabel || t(ROUND_TITLES.random))}</h4>
      <p class="note-card__text">${escapeHTML(note.text)}</p>
      <p class="note-card__meta">${escapeHTML(note.progress)} • ${escapeHTML(note.question)}</p>
    </article>`).join('');
}

function syncStaticLabels() {
  document.title = PAGE_TITLE[lang] || PAGE_TITLE.en;
  document.documentElement.lang = lang;
  writeText(STORAGE.lang, lang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  rulesClose.setAttribute('aria-label', t(LABELS.closeRules));
  document.getElementById('createClose').setAttribute('aria-label', t(LABELS.closeCreate));
  document.getElementById('modalClose').setAttribute('aria-label', t(LABELS.closeCard));
  document.getElementById('modalPrev').setAttribute('aria-label', t(LABELS.prevCard));
  document.getElementById('modalNext').setAttribute('aria-label', t(LABELS.nextCard));
  document.getElementById('modalShuffle').setAttribute('aria-label', t(LABELS.shuffleDeck));
  document.getElementById('modalShare').setAttribute('aria-label', t(LABELS.share));
  document.getElementById('noteClose').setAttribute('aria-label', t(LABELS.closeNote));
  document.getElementById('btnClearNotes').setAttribute('aria-label', t(LABELS.clearNotes));
  document.getElementById('noteInput').placeholder = PLACEHOLDERS.noteInput[lang] || PLACEHOLDERS.noteInput.en;
  syncFireButton();
  syncMusicButton();
  syncResumeButton();
}

rulesBtn.addEventListener('click', () => {
  renderRules();
  openOverlay(rulesOverlay, rulesPanel, rulesPanel);
});
rulesClose.addEventListener('click', () => closeOverlay(rulesOverlay));
rulesOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) closeOverlay(rulesOverlay); });

// ── LANG ──
function applyLang(l) {
  lang = l;
  document.querySelectorAll('[data-en]').forEach(el => {
    if (!el.classList.contains('filt')) el.textContent = el.dataset[l] || el.dataset.en;
  });
  syncStaticLabels();
  syncFilters();
  renderScenarios();
  renderNotes();
  renderGrid();
  if (deck.length) updateModalMeta();
  if (rulesOverlay.classList.contains('open')) renderRules();
}
document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang)));

// ── FILTER ──
function syncFilters() {
  document.querySelectorAll('.filt').forEach(t => {
    if (t.dataset[lang]) t.textContent = t.dataset[lang];
    t.setAttribute('aria-pressed', String(t.dataset.filter === filter));
  });
}
document.querySelectorAll('.filt').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filt').forEach(t => t.classList.remove('active'));
    tab.classList.add('active'); filter = tab.dataset.filter; renderGrid();
    track('filter_changed', { filter });
  });
});
const cardSearch = document.getElementById('cardSearch');
if (cardSearch) {
  cardSearch.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderGrid();
  });
}

function getFiltered() {
  const all = allCards();
  let result;
  if (filter === 'saved')  result = all.filter(c => saved.has(c.id));
  else if (filter === 'custom') result = [...custom];
  else if (filter === 'history') {
    const allMap = new Map(all.map(c => [c.id, c]));
    result = cardHistory.map(id => allMap.get(id)).filter(Boolean);
  }
  else if (filter === 'all')    result = all;
  else result = all.filter(c => c.category === filter);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(c =>
      (c.en && c.en.toLowerCase().includes(q)) ||
      (c.no && c.no.toLowerCase().includes(q)) ||
      (c.ru && c.ru.toLowerCase().includes(q))
    );
  }
  return result;
}

// ── EMPTY STATE MESSAGES ──
const EMPTY = {
  saved:   { en: 'No saved cards yet. Tap ♡ on any card.', no: 'Ingen lagrede kort. Trykk ♡ på et kort.', ru: 'Нет сохранённых карточек. Нажми ♡ на любой карточке.' },
  history: { en: 'No viewed cards yet. Start a round!',  no: 'Ingen viste kort ennå. Start en runde!',  ru: 'Нет просмотренных карточек. Начните раунд!' },
  search:  { en: 'No cards match your search.',           no: 'Ingen kort matcher søket.',               ru: 'Нет карточек по вашему запросу.' },
  other:   { en: 'No cards here yet.',                     no: 'Ingen kort her ennå.',                    ru: 'Здесь пока нет карточек.' },
  open:    { en: 'Open →',                                no: 'Åpne →',                                  ru: 'Открыть →' },
};

// ── RENDER ──
function renderGrid() {
  syncFilters();
  const list = getFiltered();
  const grid = document.getElementById('cardsGrid');

  if (!list.length) {
    let msg;
    if (searchQuery.trim()) msg = EMPTY.search[lang];
    else if (filter === 'saved') msg = EMPTY.saved[lang];
    else if (filter === 'history') msg = EMPTY.history[lang];
    else msg = EMPTY.other[lang];
    grid.innerHTML = `<p style="color:var(--w30);font-size:14px;padding:48px 0">${msg}</p>`;
    return;
  }

  grid.innerHTML = list.map((card, i) => {
    const isSaved  = saved.has(card.id);
    const isCustom = !!card.custom;
    const cat      = card.category;
    const tagClass = `card-item__tag--${isCustom ? 'custom' : cat}`;
    const tagText  = (TAG[cat] || TAG.custom)[lang];
    const cls      = ['card-item', isCustom ? 'card-item--custom' : '', isSaved ? 'card-item--saved' : ''].filter(Boolean).join(' ');
    const text     = card[lang] || card.ru || card.en;
    const safeText = escapeHTML(text);
    const safeTag  = escapeHTML(tagText);
    return `<div class="${cls}" data-id="${card.id}" tabindex="0" role="button">
      <div class="card-item__top">
        <span class="card-item__num">${String(i+1).padStart(2,'0')}</span>
        <span class="card-item__tag ${tagClass}">${safeTag}</span>
      </div>
      <p class="card-item__preview">${safeText}</p>
      <div class="card-item__footer">
        <span class="card-item__cta">${EMPTY.open[lang]}</span>
        <div style="display:flex;gap:4px;align-items:center">
          ${isCustom ? `<button class="card-item__delete" type="button" data-id="${card.id}">✕</button>` : ''}
          <button class="card-item__heart${isSaved?' saved':''}" type="button" data-id="${card.id}" aria-pressed="${isSaved}">${isSaved?'♥':'♡'}</button>
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.card-item').forEach(el => {
    const card = list.find(item => item.id === parseInt(el.dataset.id, 10));
    const text = card ? (card[lang] || card.ru || card.en) : '';
    const open = () => openDeck(getFiltered(), parseInt(el.dataset.id, 10));
    el.setAttribute('aria-label', `${t(LABELS.open)}: ${text}`);
    el.addEventListener('click', e => { if (e.target.closest('.card-item__heart,.card-item__delete')) return; open(); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
  grid.querySelectorAll('.card-item__heart').forEach(b => {
    b.setAttribute('aria-label', b.classList.contains('saved') ? t(LABELS.unsave) : t(LABELS.save));
    b.addEventListener('click', e => { e.stopPropagation(); toggleSave(parseInt(b.dataset.id, 10)); });
  });
  grid.querySelectorAll('.card-item__delete').forEach(b => {
    b.setAttribute('aria-label', t(LABELS.delete));
    b.title = t(LABELS.delete);
    b.addEventListener('click', e => { e.stopPropagation(); deleteCustom(parseInt(b.dataset.id, 10)); });
  });

  // Drag-and-drop for custom cards
  if (filter === 'custom') {
    let draggedEl = null;
    grid.querySelectorAll('.card-item').forEach(el => {
      el.draggable = true;
      el.style.cursor = 'move';
      el.addEventListener('dragstart', e => {
        draggedEl = el;
        el.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
      });
      el.addEventListener('dragend', () => {
        el.style.opacity = '1';
        draggedEl = null;
      });
      el.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!draggedEl || draggedEl === el) return;
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (e.clientY < mid) {
          el.before(draggedEl);
        } else {
          el.after(draggedEl);
        }
      });
    });
    grid.addEventListener('drop', () => {
      const newOrder = Array.from(grid.querySelectorAll('.card-item')).map(el => parseInt(el.dataset.id, 10));
      const customMap = new Map(custom.map(c => [c.id, c]));
      custom = newOrder.map(id => customMap.get(id)).filter(Boolean);
      saveCustom();
      renderGrid();
    });
  }
}

function toggleSave(id) {
  saved.has(id) ? saved.delete(id) : saved.add(id);
  saveSaved(); renderGrid();
  if (deck.length && deck[idx].id === id) syncFavBtn();
  updateSavedChip();
  if (document.getElementById('savedOverlay')?.classList.contains('open')) renderSavedGrid();
  track('card_saved_toggle', { id, saved: saved.has(id) });
}

function syncFavBtn() {
  const btn = document.getElementById('modalFav');
  const is  = deck.length && saved.has(deck[idx].id);
  btn.textContent = is ? '♥' : '♡';
  btn.classList.toggle('saved', is);
  btn.setAttribute('aria-pressed', String(is));
  btn.setAttribute('aria-label', is ? t(LABELS.unsave) : t(LABELS.save));
}

// ── SAVED OVERLAY ──
function updateSavedChip() {
  const chip = document.getElementById('savedChipCount');
  if (!chip) return;
  const count = saved.size;
  chip.textContent = String(count);
  chip.hidden = count === 0;
}

function renderSavedGrid() {
  const grid = document.getElementById('savedGrid');
  if (!grid) return;
  // Re-sync from localStorage in case inline script wrote to it
  const storedIds = readJSON(STORAGE.saved, []);
  saved.clear();
  storedIds.forEach(id => saved.add(id));
  updateSavedChip();

  const list = allCards().filter(c => saved.has(c.id));
  const emptyMsg = { en: 'No saved cards yet. Tap ♡ on any card.', no: 'Ingen lagrede kort. Trykk ♡ på et kort.', ru: 'Нет сохранённых карточек. Нажми ♡ на любой карточке.' };

  if (!list.length) {
    grid.innerHTML = `<p class="saved-empty">${emptyMsg[lang] || emptyMsg.en}</p>`;
    return;
  }

  grid.innerHTML = list.map((card, i) => {
    const cat      = card.category;
    const tagClass = `card-item__tag--${cat}`;
    const tagText  = (TAG[cat] || TAG.custom)[lang];
    const text     = card[lang] || card.ru || card.en;
    const safeText = escapeHTML(text);
    const safeTag  = escapeHTML(tagText);
    return `<div class="card-item card-item--saved" data-id="${card.id}" tabindex="0" role="button" aria-label="${safeText}">
      <div class="card-item__top">
        <span class="card-item__num">${String(i + 1).padStart(2, '0')}</span>
        <span class="card-item__tag ${tagClass}">${safeTag}</span>
      </div>
      <p class="card-item__preview">${safeText}</p>
      <div class="card-item__footer">
        <span class="card-item__cta">${EMPTY.open[lang]}</span>
        <button class="card-item__heart saved" type="button" data-id="${card.id}" aria-pressed="true" aria-label="${t(LABELS.unsave)}">♥</button>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.card-item').forEach(el => {
    const id = parseInt(el.dataset.id, 10);
    el.addEventListener('click', e => {
      if (e.target.closest('.card-item__heart')) return;
      closeSavedOverlay();
      setTimeout(() => openDeck(list, id), 80);
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeSavedOverlay(); setTimeout(() => openDeck(list, id), 80); }
    });
  });
  grid.querySelectorAll('.card-item__heart').forEach(b => {
    b.addEventListener('click', e => { e.stopPropagation(); toggleSave(parseInt(b.dataset.id, 10)); });
  });
}

function openSavedOverlay() {
  renderSavedGrid();
  const ov    = document.getElementById('savedOverlay');
  const panel = ov?.querySelector('.saved-modal');
  if (ov && panel) openOverlay(ov, panel, panel);
}
function closeSavedOverlay() {
  const ov = document.getElementById('savedOverlay');
  if (ov) closeOverlay(ov);
}

document.getElementById('btnSaved')?.addEventListener('click', openSavedOverlay);
document.getElementById('savedClose')?.addEventListener('click', closeSavedOverlay);
document.getElementById('savedOverlay')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeSavedOverlay(); });

// ── CUSTOM CARDS ──
function deleteCustom(id) {
  custom = custom.filter(c => c.id !== id);
  saveCustom();
  renderGrid();
  track('custom_card_deleted', { id });
}

const createOverlay = document.getElementById('createOverlay');
const createPanel = createOverlay.querySelector('.create-modal');
const inputEN  = document.getElementById('inputEN');
const inputNO  = document.getElementById('inputNO');
const inputRU  = document.getElementById('inputRU');
const preview  = document.getElementById('createPreview');

const PH = { en: 'Your question will appear here…', no: 'Spørsmålet ditt vises her…', ru: 'Здесь появится твой вопрос…' };

document.getElementById('fabCreate').addEventListener('click', () => {
  openOverlay(createOverlay, createPanel, lang === 'ru' ? inputRU : lang === 'no' ? inputNO : inputEN);
});
document.getElementById('createClose').addEventListener('click', closeCreate);
createOverlay.addEventListener('click', e => { if (e.target===e.currentTarget) closeCreate(); });

function closeCreate() { closeOverlay(createOverlay); }

function livePreview() {
  const t = inputEN.value.trim() || inputNO.value.trim() || (inputRU ? inputRU.value.trim() : '');
  preview.innerHTML = t
    ? `<span style="font-family:var(--serif);font-size:17px;line-height:1.5;color:var(--w)">${escapeHTML(t)}</span>`
    : `<span class="create-preview__ph">${PH[lang]}</span>`;
}
inputEN.addEventListener('input', livePreview);
inputNO.addEventListener('input', livePreview);
if (inputRU) inputRU.addEventListener('input', livePreview);

document.getElementById('createSubmit').addEventListener('click', () => {
  const en = inputEN.value.trim();
  const no = inputNO.value.trim();
  const ru = inputRU ? inputRU.value.trim() : '';
  if (!en && !no && !ru) { (lang === 'ru' ? inputRU : inputEN).focus(); return; }
  const cat = document.querySelector('input[name="cat"]:checked')?.value || 'light';
  const text = en || no || ru;
  custom.push({ id: ++custId, category: cat, custom: true, en: en||text, no: no||text, ru: ru||text });
  saveCustom();
  track('card_created', { category: cat, hasTranslations: Number(Boolean(en)) + Number(Boolean(no)) + Number(Boolean(ru)) });
  inputEN.value = ''; inputNO.value = '';
  if (inputRU) inputRU.value = '';
  livePreview();
  closeCreate();
  document.querySelectorAll('.filt').forEach(t => t.classList.remove('active'));
  const customTab = document.querySelector('.filt[data-filter="custom"]');
  if (customTab) { customTab.classList.add('active'); filter = 'custom'; }
  renderGrid();
});

// ── ROUND NOTES ──
const noteOverlay = document.getElementById('noteOverlay');
const notePanel = noteOverlay.querySelector('.note-modal');
const noteInput = document.getElementById('noteInput');
const noteMood = document.getElementById('noteMood');
const noteMeta = document.getElementById('noteMeta');

function currentQuestionText() {
  return deck.length ? (deck[idx][lang] || deck[idx].ru || deck[idx].en) : '';
}

function buildShareUrl() {
  if (!deck.length) return window.location.href;
  const url = new URL(window.location.href);
  url.hash = `card=${deck[idx].id}&lang=${lang}`;
  return url.toString();
}

function openNoteModal() {
  if (!deck.length) return;
  noteMeta.innerHTML = `
    <strong>${escapeHTML(roundMeta.label || t(ROUND_TITLES.random))}</strong><br/>
    ${escapeHTML(`${idx + 1} / ${deck.length}`)} • ${escapeHTML(currentQuestionText())}
  `;
  noteInput.value = '';
  noteMood.value = 'soft';
  openOverlay(noteOverlay, notePanel, noteInput);
}

function closeNoteModal() {
  closeOverlay(noteOverlay);
}

function saveRoundNote() {
  const text = noteInput.value.trim();
  if (!text || !deck.length) return;

  notes.unshift({
    id: Date.now(),
    createdAt: new Date().toISOString(),
    mood: noteMood.value,
    text,
    roundLabel: roundMeta.label || t(ROUND_TITLES.random),
    question: currentQuestionText(),
    progress: `${idx + 1} / ${deck.length}`,
    partnerMode: roundMeta.partnerMode,
  });
  notes = notes.slice(0, 18);
  saveNotes();
  renderNotes();
  closeNoteModal();
  showToast(t(TOAST.noteSaved));
  track('round_note_saved', { mood: noteMood.value, partnerMode: roundMeta.partnerMode, progress: idx + 1, total: deck.length });
}

document.getElementById('modalSaveNote').addEventListener('click', openNoteModal);
document.getElementById('noteClose').addEventListener('click', closeNoteModal);
noteOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) closeNoteModal(); });
document.getElementById('noteSubmit').addEventListener('click', saveRoundNote);
document.getElementById('btnClearNotes').addEventListener('click', () => {
  notes = [];
  saveNotes();
  renderNotes();
  showToast(t(TOAST.notesCleared));
  track('round_notes_cleared');
});

// ── DECK / MODAL ──
var modalOverlay = document.getElementById('modalOverlay');
var modalPanel = modalOverlay.querySelector('.card-modal');

function openDeckDirect(cards, startId, meta = {}) {
  if (!cards.length) return;
  deck = cards;
  idx  = Math.max(0, cards.findIndex(c => c.id === startId));
  roundMeta = {
    source: meta.source || 'random',
    label: meta.label || t(ROUND_TITLES.random),
    partnerMode: Boolean(meta.partnerMode),
  };
  document.getElementById('modalQuestion').textContent = deck[idx][lang] || deck[idx].ru || deck[idx].en;
  addToHistory(deck[idx].id);
  updateModalMeta();
  openOverlay(modalOverlay, modalPanel, modalPanel);
  bumpSession();
  persistLastRound();
  track('round_started', { source: roundMeta.source, partnerMode: roundMeta.partnerMode, size: deck.length });
}

// Wrapper to show tap screen first
function openDeck(cards, startId, meta = {}) {
  openTapScreen(cards, startId, meta);
}

const NEXT_LABEL = { en: 'Next', no: 'Neste', ru: 'Далее' };

function updateModalMeta() {
  const card = deck[idx];
  if (card) addToHistory(card.id);
  document.getElementById('modalDeckLabel').textContent = (TAG[card.category] || TAG.custom)[lang];
  modalPanel.dataset.cat = card.category || 'light';
  document.getElementById('cardIndex').textContent  = idx + 1;
  document.getElementById('cardTotal').textContent  = deck.length;
  document.getElementById('progressFill').style.width = ((idx+1)/deck.length*100) + '%';
  const nextSpan = document.querySelector('#modalNext [data-en]');
  if (nextSpan) nextSpan.textContent = NEXT_LABEL[lang];
  const turn = document.getElementById('modalTurn');
  if (turn) {
    if (roundMeta.partnerMode) {
      turn.hidden = false;
      turn.textContent = idx % 2 === 0 ? t(TURN.a) : t(TURN.b);
    } else {
      turn.hidden = true;
    }
  }
  syncFavBtn();
  persistLastRound();
  history.replaceState(null, '', buildShareUrl());
  // SVG background removed - using gradient only
  // const artEl = document.getElementById('modalArt');
  // if (artEl) artEl.innerHTML = CAT_SVG[card.category] || CAT_SVG.light;
}

const flipSound = (function() {
  let ctx = null;
  return function() {
    if (REDUCE_MOTION) return;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  };
}());

function animateTo(newIdx) {
  if (REDUCE_MOTION) {
    idx = newIdx;
    document.getElementById('modalQuestion').textContent = deck[idx][lang] || deck[idx].ru || deck[idx].en;
    updateModalMeta();
    bumpSession();
    track('card_advanced', { index: idx + 1, source: roundMeta.source });
    return;
  }
  flipSound();
  modalPanel.classList.add('card-falling');
  modalOverlay.classList.add('fire-burst');
  setTimeout(() => {
    idx = newIdx;
    document.getElementById('modalQuestion').textContent = deck[idx][lang] || deck[idx].ru || deck[idx].en;
    updateModalMeta();
    modalPanel.classList.remove('card-falling');
    modalPanel.classList.add('card-rising');
    modalOverlay.classList.remove('fire-burst');
    setTimeout(() => modalPanel.classList.remove('card-rising'), 430);
    bumpSession();
    track('card_advanced', { index: idx + 1, source: roundMeta.source });
  }, 430);
}

function closeModal() {
  closeOverlay(modalOverlay);
  persistLastRound();
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

function setupModalListeners() {
  const modalNext    = document.getElementById('modalNext');
  const modalPrev    = document.getElementById('modalPrev');
  const modalClose   = document.getElementById('modalClose');
  const modalShuffle = document.getElementById('modalShuffle');
  const modalFav     = document.getElementById('modalFav');
  const modalShare   = document.getElementById('modalShare');
  const modalExport  = document.getElementById('modalExport');

  if (modalNext)    modalNext.addEventListener('click', () => animateTo((idx + 1) % deck.length));
  if (modalPrev)    modalPrev.addEventListener('click', () => animateTo((idx - 1 + deck.length) % deck.length));
  if (modalClose)   modalClose.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

  if (modalShuffle) modalShuffle.addEventListener('click', function() {
    this.classList.add('spin'); setTimeout(() => this.classList.remove('spin'), 440);
    animateTo((idx + 1 + Math.floor(Math.random() * (deck.length - 1))) % deck.length);
    track('deck_shuffled', { source: roundMeta.source });
  });

  if (modalFav) modalFav.addEventListener('click', (e) => {
    e.stopPropagation();
    if (deck.length && deck[idx]) toggleSave(deck[idx].id);
  });

  if (modalShare) modalShare.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!deck.length || !deck[idx]) return;
    const url = buildShareUrl();
    const shareText = currentQuestionText();
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Snakke', text: shareText, url });
        showToast(t(TOAST.shared));
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast(t(TOAST.copied));
      } else {
        throw new Error('share unavailable');
      }
      track('card_shared', { id: deck[idx].id, source: roundMeta.source });
    } catch(err) {
      showToast(t(TOAST.shareError));
    }
  });

  if (modalExport) modalExport.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!deck.length || !deck[idx]) return;
    await exportCard(deck[idx], deck[idx][lang] || deck[idx].ru || deck[idx].en);
  });
}

// Note: btnShuffle handler moved to inline script in index.html to support spark animation
// document.getElementById('btnShuffle').addEventListener('click', () => {
//   const all = allCards();
//   const pick = all[Math.floor(Math.random()*all.length)];
//   openDeck(all, pick.id, { source: 'random', label: t(ROUND_TITLES.random) });
// });
const categoryOverlay = document.getElementById('categoryOverlay');
const categoryPanel   = categoryOverlay.querySelector('.category-modal');

function openCategoryOverlay() {
  // sync translated text in tiles
  categoryPanel.querySelectorAll('[data-en]').forEach(el => {
    el.textContent = el.dataset[lang] || el.dataset.en;
  });
  openOverlay(categoryOverlay, categoryPanel, categoryPanel);
  track('category_overlay_opened');
}
function closeCategoryOverlay() { closeOverlay(categoryOverlay); }

document.getElementById('btnScroll').addEventListener('click', () => {
  openCategoryOverlay();
});
document.getElementById('categoryClose').addEventListener('click', closeCategoryOverlay);
categoryOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) closeCategoryOverlay(); });

// Tarot-style illustration: hand-drawn card with paper texture, double border,
// crescent moons at top/bottom, sun with radiating lines in center, corner ornaments
const TAROT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="100%" height="100%" preserveAspectRatio="none">
  <defs>
    <filter id="handDrawn">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="paperTexture">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise"/>
      <feDiffuseLighting in="noise" lighting-color="#E3D5C1" surfaceScale="1.2">
        <fePointLight x="150" y="225" z="100"/>
      </feDiffuseLighting>
    </filter>
  </defs>

  <rect width="100%" height="100%" filter="url(#paperTexture)"/>

  <g filter="url(#handDrawn)" fill="none" stroke="#36291C">
    <rect x="15" y="15" width="270" height="420" stroke-width="2.2"/>
    <rect x="22" y="22" width="256" height="406" stroke-width="0.8"/>

    <g transform="translate(150, 95)">
      <path d="M -30 0 A 30 30 0 1 1 30 0 A 30 40 0 0 0 -30 0" stroke-width="2"/>
    </g>

    <g transform="translate(150, 355)">
      <path d="M -30 0 A 30 30 0 1 0 30 0 A 30 40 0 0 1 -30 0" stroke-width="2"/>
    </g>

    <g transform="translate(150, 225)" stroke-width="1.1" opacity="0.8">
      <line x1="0" y1="-105" x2="0" y2="105"/>
      <line x1="-105" y1="0" x2="105" y2="0"/>
      <line x1="-75" y1="-75" x2="75" y2="75"/>
      <line x1="-75" y1="75" x2="75" y2="-75"/>
      <line x1="-40" y1="-95" x2="40" y2="95"/>
      <line x1="40" y1="-95" x2="-40" y2="95"/>
      <line x1="-95" y1="-40" x2="95" y2="40"/>
      <line x1="-95" y1="40" x2="95" y2="-40"/>
    </g>

    <circle cx="150" cy="225" r="42" fill="#E3D5C1" stroke-width="2"/>
    <path d="M 150 183 A 42 42 0 0 1 150 267 A 22 42 0 0 0 150 183" stroke-width="1.8"/>

    <path d="M 35 35 Q 55 35 55 60 M 35 35 Q 35 55 60 55" stroke-width="1.2"/>
    <path d="M 265 35 Q 245 35 245 60 M 265 35 Q 265 55 240 55" stroke-width="1.2"/>
    <path d="M 35 415 Q 55 415 55 390 M 35 415 Q 35 395 60 395" stroke-width="1.2"/>
    <path d="M 265 415 Q 245 415 245 390 M 265 415 Q 265 395 240 395" stroke-width="1.2"/>

    <g stroke-width="0.7">
      <path d="M 75 120 L 77 128 L 85 130 L 77 132 L 75 140 L 73 132 L 65 130 L 73 128 Z"/>
      <path d="M 225 310 L 227 318 L 235 320 L 227 322 L 225 330 L 223 322 L 215 320 L 223 318 Z"/>
      <path d="M 245 100 L 247 104 L 252 105 L 247 106 L 245 110 L 243 106 L 238 105 L 243 104 Z"/>
    </g>

    <g fill="#36291C" stroke="none">
      <circle cx="215" cy="105" r="1.2"/>
      <circle cx="245" cy="170" r="1.3"/>
      <circle cx="55" cy="290" r="1.1"/>
      <circle cx="105" cy="80" r="1.2"/>
      <circle cx="185" cy="385" r="1.3"/>
      <circle cx="85" cy="380" r="1.1"/>
    </g>
  </g>
</svg>`;

const CAT_SVG = { light: TAROT_SVG, deep: TAROT_SVG, bold: TAROT_SVG };

const CAT_LABELS = {
  light: { en:'Warm conversations', no:'Varme samtaler', ru:'Тёплые разговоры' },
  deep:  { en:'Honest conversations', no:'Ærlige samtaler', ru:'Честные разговоры' },
  bold:  { en:'Brave', no:'Modige', ru:'Смелые' },
};
categoryPanel.querySelectorAll('.cat-tile').forEach(tile => {
  tile.addEventListener('click', () => {
    const cat = tile.dataset.cat;
    const cards = shuffleList(allCards().filter(c => c.category === cat));
    closeCategoryOverlay();
    setTimeout(() => {
      openDeck(cards, cards[0].id, { source: cat, label: t(CAT_LABELS[cat] || CAT_LABELS.light) });
    }, 120);
  });
});
document.querySelectorAll('.home-cat[data-cat]').forEach(btn => {
  btn.addEventListener('click', () => {
    const cat = btn.dataset.cat;
    const cards = shuffleList(allCards().filter(c => c.category === cat));
    if (!cards.length) return;
    openDeck(cards, cards[0].id, { source: cat, label: t(CAT_LABELS[cat] || CAT_LABELS.light) });
  });
});

document.getElementById('btnResume').addEventListener('click', resumeLastRound);

// Export card function (called from setupModalListeners)
async function exportCard(card, text) {
  const category = (TAG[card.category] || TAG.custom)[lang];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = 800, height = 1000;
  canvas.width = width; canvas.height = height;
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#0f2448');
  grad.addColorStop(0.5, '#091830');
  grad.addColorStop(1, '#060e1c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(20,55,120,0.5)';
  const radialGrad = ctx.createRadialGradient(width*0.8, height*0.1, 0, width*0.8, height*0.1, width*0.5);
  radialGrad.addColorStop(0, 'rgba(20,55,120,0.5)');
  radialGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(212,170,106,0.3)';
  ctx.beginPath();
  ctx.arc(width*0.85, height*0.15, 50, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#d4aa6a';
  ctx.beginPath();
  ctx.arc(width*0.85, height*0.15, 30, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#64c8a6';
  ctx.font = '600 14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(category.toUpperCase(), width/2, 80);
  ctx.fillStyle = '#ffffff';
  ctx.font = '400 36px "DM Serif Display", serif';
  ctx.textAlign = 'center';
  const words = text.split(' ');
  let line = '', lines = [];
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > width - 120 && i > 0) {
      lines.push(line);
      line = words[i] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  const lineHeight = 50;
  const startY = height/2 - (lines.length * lineHeight)/2;
  lines.forEach((l, i) => ctx.fillText(l.trim(), width/2, startY + i * lineHeight));
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '12px Inter, sans-serif';
  ctx.fillText('Snakke — Questions for Couples', width/2, height - 60);
  try {
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snakke-card-${card.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
      showToast({ en: 'Card exported!', no: 'Kort eksportert!', ru: 'Карточка экспортирована!' }[lang]);
      track('card_exported', { id: card.id });
    }, 'image/png');
  } catch {
    showToast({ en: 'Export failed', no: 'Eksport feilet', ru: 'Ошибка экспорта' }[lang]);
  }
}

// ── SWIPE ──
(function () {
  const modal = document.querySelector('.card-modal');
  if (!modal) return;
  let tx = 0, ty = 0;
  modal.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive:true });
  modal.addEventListener('touchend', e => {
    const dx = tx - e.changedTouches[0].clientX;
    const dy = ty - e.changedTouches[0].clientY;
    if (Math.abs(dx) < 44 || Math.abs(dy) > Math.abs(dx)) return;
    animateTo(dx > 0 ? (idx+1)%deck.length : (idx-1+deck.length)%deck.length);
  }, { passive:true });
}());

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
  const mo = modalOverlay.classList.contains('open');
  const co = createOverlay.classList.contains('open');
  const no = noteOverlay.classList.contains('open');
  const ro = rulesOverlay.classList.contains('open');
  if (no && e.key==='Escape') { closeNoteModal(); return; }
  if (ro && e.key==='Escape') { closeOverlay(rulesOverlay); return; }
  if (co && e.key==='Escape') { closeCreate(); return; }
  if (!mo) return;
  if (e.key==='Escape')    { closeModal(); return; }
  if (e.key==='ArrowRight'||e.key===' ') { e.preventDefault(); animateTo((idx+1)%deck.length); }
  if (e.key==='ArrowLeft') animateTo((idx-1+deck.length)%deck.length);
  if (e.key==='s'||e.key==='S') { if (deck.length) toggleSave(deck[idx].id); }
});

// ── MUSIC PLAYER ──
(function () {
  const audio  = document.getElementById('audio');
  const play   = document.getElementById('musicPlay');
  const iPlay  = document.getElementById('iconPlay');
  const iPause = document.getElementById('iconPause');
  const eq     = document.getElementById('musicEq');
  const vol    = document.getElementById('volSlider');
  const source = audio.querySelector('source[data-src]');
  let loaded = false;

  audio.volume = parseFloat(vol.value);

  function ensureSource() {
    if (loaded || !source) return;
    source.src = source.dataset.src;
    audio.load();
    loaded = true;
  }

  function setState(playing) {
    iPlay.classList.toggle('hidden', playing);
    iPause.classList.toggle('hidden', !playing);
    eq.classList.toggle('playing', playing);
    play.setAttribute('aria-label', playing ? t(LABELS.pauseMusic) : t(LABELS.playMusic));
  }

  syncMusicButton = () => setState(!audio.paused);

  play.addEventListener('click', () => {
    if (audio.paused) {
      ensureSource();
      audio.play().catch(() => setState(false));
      setState(true);
      track('music_toggled', { playing: true });
    } else {
      audio.pause();
      setState(false);
      track('music_toggled', { playing: false });
    }
  });
  audio.addEventListener('play', () => setState(true));
  audio.addEventListener('pause', () => setState(false));
  audio.addEventListener('ended', () => setState(false));
  vol.addEventListener('input',   () => { audio.volume = parseFloat(vol.value); });
  setState(false);
}());

function syncMobileChrome() {
  const compact = window.innerWidth <= 640 && window.scrollY < Math.min(window.innerHeight * 0.55, 420);
  document.body.classList.toggle('hero-compact', compact);
}

function openSharedCardFromHash() {
  if (!window.location.hash) return false;
  const raw = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(raw);
  const requestedLang = params.get('lang');
  if (requestedLang && ['en', 'no', 'ru'].includes(requestedLang) && requestedLang !== lang) {
    applyLang(requestedLang);
  }
  const cardId = parseInt(params.get('card') || '', 10);
  if (!Number.isFinite(cardId)) return false;
  const cards = allCards();
  const card = cards.find(item => item.id === cardId);
  if (!card) return false;
  openDeck(cards, cardId, { source: 'shared', label: t(ROUND_TITLES.random) });
  track('shared_card_opened', { id: cardId });
  return true;
}

syncFireButton = function () {
  if (!fireBtn) return;
  const running = fireAudio.isRunning();
  fireBtn.classList.toggle('muted', !running);
  fireBtn.setAttribute('aria-pressed', String(running));
  fireBtn.setAttribute('aria-label', running ? t(LABELS.fireOff) : t(LABELS.fireOn));
  fireBtn.title = running ? t(LABELS.fireOff) : t(LABELS.fireOn);
};

// ── INIT ──
function init() {
  document.getElementById('heroCardCount').textContent = CARDS.length;
  renderScenarios();
  renderNotes();
  renderGrid();
  syncStaticLabels();
  applyLang(lang);
  livePreview();
  syncMobileChrome();
  updateSavedChip();
  openSharedCardFromHash();
  setupModalListeners();
  window.addEventListener('scroll', syncMobileChrome, { passive: true });
  window.addEventListener('resize', syncMobileChrome);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ── THEME TOGGLE ──
const themeBtn = document.getElementById('themeBtn');
let isDay = readText(STORAGE.theme) === 'day';
function applyTheme() {
  document.body.classList.toggle('day', isDay);
  if (themeBtn) themeBtn.textContent = isDay ? '☾' : '☀';
}
applyTheme();
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    isDay = !isDay;
    writeText(STORAGE.theme, isDay ? 'day' : 'night');
    applyTheme();
    track('theme_toggled', { theme: isDay ? 'day' : 'night' });
  });
}

// ── TAP TO DRAW SCREEN ──
const tapOverlay = document.getElementById('tapOverlay');
const tapScreen = tapOverlay?.querySelector('.tap-screen');
const tapText = tapOverlay?.querySelector('.tap-text');
const tapCardPlaceholder = tapOverlay?.querySelector('.tap-card-placeholder');

// Stars for tap screen
(function initTapStars() {
  const canvas = document.getElementById('tapStarsCanvas');
  if (!canvas || REDUCE_MOTION || IS_MOBILE) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], shooters = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Create stars
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random(),
      d: Math.random() * 0.02 + 0.005
    });
  }

  function draw() {
    if (!tapOverlay.classList.contains('open')) {
      requestAnimationFrame(draw);
      return;
    }
    ctx.clearRect(0, 0, W, H);

    // Regular stars
    stars.forEach(s => {
      s.a += s.d;
      const alpha = 0.3 + Math.abs(Math.sin(s.a)) * 0.7;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Shooting stars
    if (Math.random() < 0.008 && shooters.length < 2) {
      shooters.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.4,
        vx: -2 - Math.random() * 2,
        vy: 0.5 + Math.random() * 0.5,
        len: 20 + Math.random() * 40,
        life: 1
      });
    }

    shooters.forEach((s, i) => {
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.015;

      const grad = ctx.createLinearGradient(s.x, s.y, s.x + s.len, s.y - s.len * 0.3);
      grad.addColorStop(0, `rgba(255,255,255,${s.life})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.globalAlpha = s.life;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.len, s.y - s.len * 0.3);
      ctx.stroke();

      if (s.life <= 0 || s.x < -100 || s.y > H + 100) shooters.splice(i, 1);
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

let tapPendingDeck = null;

function openTapScreen(cards, startId, meta = {}) {
  if (!cards.length) return;
  tapPendingDeck = { cards, startId, meta };

  if (tapText) {
    tapText.textContent = tapText.dataset[lang] || tapText.dataset.en;
  }

  const badge = document.getElementById('tapPartnerBadge');
  if (badge) badge.hidden = !meta.partnerMode;

  tapCardPlaceholder?.classList.remove('drawing');
  tapText?.classList.remove('fading');
  tapScreen?.classList.remove('exiting');

  openOverlay(tapOverlay, tapScreen, tapScreen);
  track('tap_screen_opened', { source: meta.source || 'random' });
}

function closeTapScreen() {
  closeOverlay(tapOverlay);
}

function revealCard() {
  if (!tapPendingDeck) return;

  // Start animations
  tapCardPlaceholder?.classList.add('drawing');
  tapText?.classList.add('fading');
  tapScreen?.classList.add('exiting');

  // Wait for animation then open actual card
  setTimeout(() => {
    closeTapScreen();
    const { cards, startId, meta } = tapPendingDeck;
    // Small delay for transition
    setTimeout(() => {
      openDeckDirect(cards, startId, meta);
    }, 100);
    tapPendingDeck = null;
  }, 600);
}

// Handle tap/click
if (tapOverlay) {
  tapOverlay.addEventListener('click', (e) => {
    // Create ripple effect
    const ripple = document.createElement('div');
    ripple.className = 'tap-ripple';
    const size = 100;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - size/2) + 'px';
    ripple.style.top = (e.clientY - size/2) + 'px';
    tapScreen.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    revealCard();
  });
}

