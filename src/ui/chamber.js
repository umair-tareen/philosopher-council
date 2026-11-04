// The council chamber: seven busts around a table, one voice at a time.
//
// Pattern credit: the talking-bust room in Roast Room (github.com/nateherkai/roast-room,
// MIT, © 2026 AI Automation Society) - a stack of mouth frames swapped while a seat
// speaks. Everything here is drawn fresh: code-drawn SVG busts by default, replaced
// automatically by painted portraits dropped into assets/portraits/<id>-<frame>.webp.

export const SEATS = [
  { id: 'socrates', name: 'Socrates', lens: 'questions every term' },
  { id: 'plato', name: 'Plato', lens: 'looks past the shadow to the Form' },
  { id: 'confucius', name: 'Confucius', lens: 'asks who owes what to whom' },
  { id: 'ibnarabi', name: 'Ibn ʿArabī', lens: 'weaves the verdicts into one', synth: true },
  { id: 'laotzu', name: 'Lao Tzu', lens: 'subtracts until it flows' },
  { id: 'aristotle', name: 'Aristotle', lens: 'checks the syllogism and the mean' },
  { id: 'kant', name: 'Kant', lens: 'tests whether it could be universal law' },
];

const FRAMES = ['base', 'mid', 'open', 'blink'];

// ---------- code-drawn busts ----------
// viewBox 0 0 200 240. Each look is a few layers; mouths and eyes are swapped by
// data-shape on the wrapper, exactly like the portrait frames.
const LOOKS = {
  socrates: { skin: '#d9a57b', robe: '#d8d0bf', trim: '#a89c80', hair: 'bald', hairC: '#8d8a84', beard: 'bushy', beardC: '#9a958c', nose: 'snub' },
  plato: { skin: '#d6a07a', robe: '#5b7aa3', trim: '#3f5a80', hair: 'full', hairC: '#b9b4aa', beard: 'long', beardC: '#c3bdb2', band: '#e6c35c' },
  aristotle: { skin: '#cf9a72', robe: '#8a3b3b', trim: '#5e2626', hair: 'curly', hairC: '#3b2f27', beard: 'short', beardC: '#3b2f27' },
  confucius: { skin: '#e0b48a', robe: '#7a2430', trim: '#c9a227', hair: 'topknot', hairC: '#1d1b1a', beard: 'wisp', beardC: '#26221f', cap: '#1d1b1a' },
  laotzu: { skin: '#dcae86', robe: '#7d6b4a', trim: '#5a4c33', hair: 'sage', hairC: '#ecebe6', beard: 'flowing', beardC: '#f1f0ea' },
  kant: { skin: '#efc6a6', robe: '#2e3440', trim: '#1f232c', hair: 'wig', hairC: '#ecebe6', beard: 'none', cravat: true },
  ibnarabi: { skin: '#c9926a', robe: '#2f6b4f', trim: '#c9a227', hair: 'turban', hairC: '#f2efe6', beard: 'full', beardC: '#2a211b' },
};

function hairLayer(l) {
  switch (l.hair) {
    case 'bald':
      return `<path d="M58 92 q-6 -12 2 -26 M142 92 q6 -12 -2 -26" stroke="${l.hairC}" stroke-width="9" stroke-linecap="round" fill="none"/>`;
    case 'full':
      return `<path d="M54 100 q-8 -58 46 -64 q54 6 46 64 q-6 -30 -46 -34 q-40 4 -46 34z" fill="${l.hairC}"/>
        <path d="M58 74 q42 -14 84 0" stroke="${l.band}" stroke-width="4" fill="none"/>`;
    case 'curly':
      return `<g fill="${l.hairC}">${[60, 74, 88, 102, 116, 130, 142].map((x, i) => `<circle cx="${x}" cy="${58 - (i % 2) * 5 - (i > 0 && i < 6 ? 6 : 0)}" r="12"/>`).join('')}
        <circle cx="54" cy="80" r="10"/><circle cx="146" cy="80" r="10"/></g>`;
    case 'topknot':
      return `<path d="M56 92 q-4 -50 44 -54 q48 4 44 54 q-8 -28 -44 -30 q-36 2 -44 30z" fill="${l.hairC}"/>
        <rect x="82" y="22" width="36" height="22" rx="4" fill="${l.cap}"/><rect x="76" y="40" width="48" height="6" rx="3" fill="${l.trim}"/>`;
    case 'sage':
      return `<path d="M56 84 q-12 30 -4 62 q6 -24 10 -40z M144 84 q12 30 4 62 q-6 -24 -10 -40z" fill="${l.hairC}"/>
        <path d="M70 52 q30 -10 60 0" stroke="#c99a76" stroke-width="2" fill="none" opacity=".5"/>`;
    case 'wig':
      return `<path d="M54 96 q-6 -56 46 -60 q52 4 46 60 q-6 -26 -46 -30 q-40 4 -46 30z" fill="${l.hairC}"/>
        <g fill="${l.hairC}" stroke="#cfcdc5" stroke-width="2"><ellipse cx="52" cy="100" rx="9" ry="7"/><ellipse cx="52" cy="116" rx="9" ry="7"/><ellipse cx="148" cy="100" rx="9" ry="7"/><ellipse cx="148" cy="116" rx="9" ry="7"/></g>`;
    case 'turban':
      return `<path d="M50 84 q0 -54 50 -56 q50 2 50 56 q-50 -14 -100 0z" fill="${l.hairC}"/>
        <path d="M54 70 q46 -22 92 0 M58 58 q42 -20 84 0" stroke="#d9d3c3" stroke-width="3" fill="none"/>
        <circle cx="100" cy="52" r="6" fill="${l.trim}"/>`;
    default:
      return '';
  }
}

function beardLayer(l) {
  switch (l.beard) {
    case 'bushy':
      return `<path d="M60 112 q-2 62 40 70 q42 -8 40 -70 q-8 22 -40 24 q-32 -2 -40 -24z" fill="${l.beardC}"/>`;
    case 'long':
      return `<path d="M62 114 q-2 74 38 86 q40 -12 38 -86 q-8 22 -38 24 q-30 -2 -38 -24z" fill="${l.beardC}"/>`;
    case 'short':
      return `<path d="M64 116 q2 40 36 46 q34 -6 36 -46 q-8 18 -36 20 q-28 -2 -36 -20z" fill="${l.beardC}"/>`;
    case 'wisp':
      return `<path d="M92 156 q8 34 8 46 q0 -12 8 -46z" fill="${l.beardC}"/>
        <path d="M80 138 q-10 10 -12 26 M120 138 q10 10 12 26" stroke="${l.beardC}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'flowing':
      return `<path d="M60 112 q-4 90 40 108 q44 -18 40 -108 q-8 24 -40 26 q-32 -2 -40 -26z" fill="${l.beardC}"/>`;
    case 'full':
      return `<path d="M60 110 q-2 58 40 66 q42 -8 40 -66 q-8 22 -40 24 q-32 -2 -40 -24z" fill="${l.beardC}"/>`;
    default:
      return '';
  }
}

export function bustSvg(id) {
  const l = LOOKS[id];
  if (!l) return '';
  return `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18 240 q4 -62 82 -70 q78 8 82 70z" fill="${l.robe}"/>
    <path d="M70 176 q30 22 60 0" stroke="${l.trim}" stroke-width="6" fill="none"/>
    ${l.cravat ? '<path d="M86 176 l14 26 l14 -26z" fill="#f2efe6"/>' : ''}
    <rect x="86" y="140" width="28" height="36" rx="10" fill="${l.skin}"/>
    <ellipse cx="100" cy="98" rx="44" ry="54" fill="${l.skin}"/>
    <ellipse cx="56" cy="104" rx="7" ry="11" fill="${l.skin}"/><ellipse cx="144" cy="104" rx="7" ry="11" fill="${l.skin}"/>
    ${hairLayer(l)}
    <g class="eyes open-eyes"><ellipse cx="82" cy="96" rx="5" ry="6" fill="#231d18"/><ellipse cx="118" cy="96" rx="5" ry="6" fill="#231d18"/>
      <circle cx="84" cy="94" r="1.6" fill="#fff"/><circle cx="120" cy="94" r="1.6" fill="#fff"/></g>
    <g class="eyes shut-eyes"><path d="M76 97 q6 4 12 0 M112 97 q6 4 12 0" stroke="#231d18" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>
    <path d="M74 84 q8 -5 16 0 M110 84 q8 -5 16 0" stroke="${l.hairC === '#ecebe6' || l.hairC === '#f2efe6' ? '#a9a59b' : l.hairC}" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${l.nose === 'snub' ? '<ellipse cx="100" cy="114" rx="8" ry="6" fill="#c48c64"/>' : '<path d="M100 100 q-5 14 -2 18 q4 2 8 0" stroke="#b98360" stroke-width="2.4" fill="none" stroke-linecap="round"/>'}
    ${beardLayer(l)}
    <g class="mouth m-base"><path d="M88 134 q12 7 24 0" stroke="#6b3a2c" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <g class="mouth m-mid"><ellipse cx="100" cy="135" rx="9" ry="4.5" fill="#4a2119"/></g>
    <g class="mouth m-open"><ellipse cx="100" cy="137" rx="10" ry="8" fill="#4a2119"/><ellipse cx="100" cy="141" rx="6" ry="3" fill="#b5544a"/></g>
  </svg>`;
}

// ---------- the room ----------
export function createChamber(root) {
  root.innerHTML = `
    <div class="stage" id="stage">
      <div class="arc">${SEATS.map((s, i) => `
        <div class="seat${s.synth ? ' synth-seat' : ''}" data-id="${s.id}" style="--i:${i}">
          <div class="bust" data-shape="base">${bustSvg(s.id)}</div>
          <div class="think"><i></i><i></i><i></i></div>
          <div class="plate">${s.name}</div>
        </div>`).join('')}
      </div>
      <div class="table">
        <div class="caption" id="caption">
          <div class="cap-who" id="capwho">The chamber is open</div>
          <div class="cap-text" id="captext">Put a question to the council. Each seat deliberates alone, then speaks in turn. Ibn ʿArabī speaks last.</div>
          <div class="cap-meta" id="capmeta"></div>
        </div>
      </div>
    </div>`;

  const seatEl = (id) => root.querySelector(`.seat[data-id="${id}"]`);
  const queue = [];
  let speaking = false;
  let skip = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Swap in painted portraits for seats that have all four frames on disk.
  fetch('/api/portraits')
    .then((r) => (r.ok ? r.json() : []))
    .then((ids) => {
      for (const id of ids) {
        const bust = seatEl(id)?.querySelector('.bust');
        if (!bust) continue;
        bust.classList.add('painted');
        bust.innerHTML = FRAMES.map((f) => `<img class="${f}" src="/portraits/${id}-${f}.webp" alt="">`).join('');
      }
    })
    .catch(() => {});

  // Idle blinking, staggered per seat.
  for (const s of SEATS) {
    const blink = () => {
      const bust = seatEl(s.id)?.querySelector('.bust');
      if (bust && bust.dataset.shape === 'base') {
        bust.dataset.shape = 'blink';
        setTimeout(() => { if (bust.dataset.shape === 'blink') bust.dataset.shape = 'base'; }, 140);
      }
      setTimeout(blink, 2600 + Math.random() * 4200);
    };
    setTimeout(blink, 800 + Math.random() * 3000);
  }

  function setCaption(who, text, meta) {
    root.querySelector('#capwho').textContent = who;
    root.querySelector('#captext').textContent = text;
    root.querySelector('#capmeta').textContent = meta || '';
  }

  async function speak({ id, who, text, meta }) {
    const el = seatEl(id);
    const stage = root.querySelector('#stage');
    stage.classList.add('live');
    root.querySelectorAll('.seat').forEach((s) => s.classList.remove('speaking'));
    if (el) el.classList.add('speaking');
    const bust = el?.querySelector('.bust');
    root.querySelector('#capwho').textContent = who;
    root.querySelector('#capmeta').textContent = meta || '';
    const out = root.querySelector('#captext');
    out.textContent = '';
    const chars = [...text];
    const step = reduced ? chars.length : 2;
    for (let i = 0; i < chars.length && !skip; i += step) {
      out.textContent = chars.slice(0, i + step).join('');
      if (bust) bust.dataset.shape = /[\s,.;:!?—-]/.test(chars[i] || ' ') ? 'base' : (Math.random() < 0.5 ? 'open' : 'mid');
      await new Promise((r) => setTimeout(r, 55));
    }
    out.textContent = text;
    if (bust) bust.dataset.shape = 'base';
    await new Promise((r) => setTimeout(r, skip ? 0 : 1400));
    if (el) el.classList.remove('speaking');
  }

  async function drain() {
    if (speaking) return;
    speaking = true;
    while (queue.length) await speak(queue.shift());
    speaking = false;
    root.querySelector('#stage').classList.remove('live');
    for (const fn of idleWaiters.splice(0)) fn();
  }
  const idleWaiters = [];

  return {
    reset() {
      queue.length = 0;
      skip = false;
      root.querySelectorAll('.seat').forEach((s) => s.classList.remove('speaking', 'thinking', 'absent', 'dissent', 'failed'));
      setCaption('The council convenes…', '', '');
    },
    seat(ids) {
      for (const s of SEATS) {
        const el = seatEl(s.id);
        if (s.synth) continue;
        el.classList.toggle('absent', !ids.includes(s.id));
        el.classList.toggle('thinking', ids.includes(s.id));
      }
    },
    landed(id) { seatEl(id)?.classList.remove('thinking'); },
    failed(id) { const el = seatEl(id); el?.classList.remove('thinking'); el?.classList.add('failed'); },
    say(line) { queue.push(line); drain(); },
    dissent(id) { seatEl(id)?.classList.add('dissent'); },
    skipAhead() { skip = true; },
    /** Resolves once every queued line has been spoken. */
    whenIdle() { return speaking || queue.length ? new Promise((r) => idleWaiters.push(r)) : Promise.resolve(); },
    idle(who, text) { if (!speaking) setCaption(who, text, ''); },
  };
}
