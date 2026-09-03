/* ==========================================================================
   AI Work Pays — quiz engine
   7 single-select questions, then every platform scored and ranked.
   Depends on app.js (getData, applyLink, disclosureLine, esc, formatMonth).
   ========================================================================== */

'use strict';

const QUESTIONS = [
  {
    id: 'experience',
    q: 'How much AI work have you done?',
    options: [
      { value: 'none', label: 'None yet' },
      { value: 'side', label: 'A bit, on the side' },
      { value: 'pro', label: "I've worked in AI or tech professionally" }
    ]
  },
  {
    id: 'education',
    q: "What's your education background?",
    options: [
      { value: 'none', label: 'No degree' },
      { value: 'college', label: 'Some college' },
      { value: 'bachelors', label: "Bachelor's" },
      { value: 'advanced', label: 'Advanced degree (PhD, MD, JD, etc.)' }
    ]
  },
  {
    id: 'country',
    q: 'Where are you based?',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'in', label: 'India' },
      { value: 'ph', label: 'Philippines' },
      { value: 'ng', label: 'Nigeria' },
      { value: 'ke', label: 'Kenya' },
      { value: 'other', label: 'Somewhere else' }
    ]
  },
  {
    id: 'hours',
    q: 'How many hours a week can you give it?',
    options: [
      { value: 'under5', label: 'Under 5' },
      { value: '5-10', label: '5–10' },
      { value: '10-20', label: '10–20' },
      { value: '20+', label: '20 or more' }
    ]
  },
  {
    id: 'pay_style',
    q: 'What matters more to you?',
    options: [
      { value: 'steady', label: 'Steady, predictable pay' },
      { value: 'ceiling', label: 'A higher earning ceiling' },
      { value: 'either', label: "Doesn't matter — I just want to start" }
    ]
  },
  {
    id: 'gate',
    q: 'Platforms differ on how they let you in. Which fits you?',
    options: [
      { value: 'none', label: 'I want zero interview' },
      { value: 'written', label: "I'm fine with a written test" },
      { value: 'video', label: "I'm fine with an AI video interview" }
    ]
  },
  {
    id: 'strength',
    q: 'What are you strongest in?',
    options: [
      { value: 'generalist', label: 'Generalist — writing, reasoning, judgement' },
      { value: 'coding', label: 'Coding' },
      { value: 'professional', label: 'A professional field (finance, law, medicine, engineering…)' }
    ]
  }
];

const GATE_RANK = { none: 0, written: 1, video: 2 };

/* --- Scoring ------------------------------------------------------------- */

/**
 * Score one platform against the answers.
 * Nothing is eliminated — everything is ranked, so there is never a dead end.
 */
function scorePlatform(p, a) {
  const t = p.tags || {};
  let score = 0;
  const hits = [];

  // Country eligibility carries the most weight: it is the real dealbreaker.
  const countries = t.countries || [];
  if (countries.includes(a.country)) {
    score += 30;
    hits.push(countries.length >= 6 ? 'countries:global' : `countries:${a.country}`);
  } else {
    score -= 30;
  }

  // Gate tolerance is a ceiling, not an equality: someone happy with a video
  // interview is also happy with a written test or no gate at all.
  const want = GATE_RANK[a.gate];
  const has = GATE_RANK[t.gate];
  if (want >= has) {
    score += 22 - (want - has) * 5;
    hits.push(`gate:${t.gate}`);
  } else {
    score -= 20;
  }

  if ((t.strength || []).includes(a.strength)) { score += 18; hits.push(`strength:${a.strength}`); }
  else score -= 6;

  if ((t.experience || []).includes(a.experience)) { score += 15; hits.push(`experience:${a.experience}`); }
  else score -= 10;

  if (t.pay_style === a.pay_style) { score += 14; hits.push(`pay_style:${a.pay_style}`); }
  else if (t.pay_style === 'either' || a.pay_style === 'either') score += 7;

  if ((t.education || []).includes(a.education)) { score += 10; hits.push(`education:${a.education}`); }
  else score -= 8;

  if ((t.hours || []).includes(a.hours)) { score += 8; hits.push(`hours:${a.hours}`); }
  else score -= 4;

  // Turn matched dimensions into plain-English lines. Prefer the line authored
  // for this platform; fall back to a factual line derived from its own tags so
  // a strong match never shows up with a single thin reason.
  const reasons = [];
  for (const pass of ['authored', 'generic']) {
    for (const key of hits) {
      if (reasons.length === 3) break;
      const line = pass === 'authored' ? (p.reasons && p.reasons[key]) : genericReason(key, p);
      if (line && !reasons.includes(line)) reasons.push(line);
    }
  }

  return { platform: p, score, reasons };
}

/** Factual fallback reason, built from the platform's own tags. */
function genericReason(key, p) {
  const [dim, value] = key.split(':');

  if (dim === 'countries') {
    return value === 'global'
      ? 'Open to applicants in most countries, including yours.'
      : `Listed as open to applicants in ${COUNTRY_NAME[value] || value}.`;
  }
  if (dim === 'gate') {
    return {
      none: 'No interview and no assessment standing between you and the work.',
      written: 'Entry is a written assessment rather than an interview.',
      video: 'Entry is a single AI video interview.'
    }[value];
  }
  if (dim === 'strength') {
    return {
      generalist: 'Generalist writing and judgement work is the core of what they run.',
      coding: 'Coding is one of the strengths this platform recruits for.',
      professional: 'Specialist professional expertise is one of the strengths they recruit for.'
    }[value];
  }
  if (dim === 'experience') {
    return {
      none: 'Open to contributors with no prior AI-work history.',
      side: 'Side-project experience is enough to qualify here.',
      pro: 'Professional experience is what their intake rewards.'
    }[value];
  }
  if (dim === 'education') {
    return value === 'none'
      ? 'No degree requirement listed.'
      : 'Your education level is within what they accept.';
  }
  if (dim === 'hours') {
    return value === 'under5' || value === '5-10'
      ? 'The work suits a small weekly time commitment.'
      : 'Enough work available to fill the hours you have.';
  }
  if (dim === 'pay_style') {
    return {
      steady: 'Pay here is comparatively steady rather than spiky.',
      ceiling: 'The rate band is wide, so the ceiling is worth chasing.',
      either: 'Works either as steady income or as something to start with.'
    }[value];
  }
  return null;
}

/* --- View ---------------------------------------------------------------- */

const state = { step: 0, answers: {} };

const els = {};

function mountQuiz() {
  els.root = document.getElementById('quiz');
  if (!els.root) return;
  renderQuestion();
}

function renderQuestion() {
  const i = state.step;
  const q = QUESTIONS[i];
  const chosen = state.answers[q.id];
  const isLast = i === QUESTIONS.length - 1;

  els.root.innerHTML = `
    <div class="progress">
      <p class="progress__label mono">Q ${i + 1}/${QUESTIONS.length}</p>
      <div class="progress__track" role="progressbar" aria-valuemin="1"
           aria-valuemax="${QUESTIONS.length}" aria-valuenow="${i + 1}"
           aria-label="Question ${i + 1} of ${QUESTIONS.length}">
        <div class="progress__bar" style="width:${((i + 1) / QUESTIONS.length) * 100}%"></div>
      </div>
    </div>

    <h2 class="quiz__q" id="quiz-q">${esc(q.q)}</h2>
    <div class="options" role="radiogroup" aria-labelledby="quiz-q">
      ${q.options.map((o) => `
        <label class="option">
          <input type="radio" name="${esc(q.id)}" value="${esc(o.value)}"
                 ${chosen === o.value ? 'checked' : ''}>
          <span>${esc(o.label)}</span>
        </label>`).join('')}
    </div>

    <div class="quiz__nav">
      <button class="btn btn--ghost" type="button" data-back>${i === 0 ? 'Back to start' : 'Back'}</button>
      <button class="btn" type="button" data-next ${chosen ? '' : 'disabled'}>
        ${isLast ? 'See my results' : 'Next'}
      </button>
    </div>`;

  const nextBtn = els.root.querySelector('[data-next]');

  els.root.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener('change', () => {
      state.answers[q.id] = input.value;
      nextBtn.disabled = false;
    });
  });

  els.root.querySelector('[data-back]').addEventListener('click', () => {
    if (i === 0) { location.href = 'index.html'; return; }
    state.step -= 1;
    renderQuestion();
    els.root.querySelector('.quiz__q').scrollIntoView({ block: 'nearest' });
  });

  nextBtn.addEventListener('click', () => {
    if (!state.answers[q.id]) return;
    if (isLast) { showResults(); return; }
    state.step += 1;
    renderQuestion();
    els.root.querySelector('.quiz__q').scrollIntoView({ block: 'nearest' });
  });
}

async function showResults() {
  els.root.innerHTML = '<p class="state">Scoring the ledger…</p>';

  let platforms;
  try {
    platforms = await getData('platforms');
  } catch (err) {
    els.root.innerHTML = `<p class="state state--error">Could not load the platform list (${esc(err.message)}).</p>`;
    return;
  }

  const ranked = platforms
    .map((p) => scorePlatform(p, state.answers))
    .sort((a, b) => b.score - a.score);

  const top = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  els.root.innerHTML = `
    <h1>Your top 3 matches</h1>
    <p class="hero__lede" style="margin-inline:0;text-align:left">
      Ranked from your answers, best fit first. These are my working scores against advertised
      terms — not a promise of acceptance, and not verified earnings.
    </p>

    ${top.map((r, i) => resultCard(r, i)).join('')}

    <section class="rest">
      <p class="kicker">Everything else, ranked</p>
      <p style="color:var(--ink-soft);font-size:.9rem">
        Nothing is hidden — the rest of the ledger scored lower for your answers, usually on
        country eligibility or the entry gate.
      </p>
      ${rest.map((r, i) => `
        <div class="rest__row">
          <span class="rest__rank mono">${String(i + 4).padStart(2, '0')}</span>
          <span class="rest__name">${esc(r.platform.name)}</span>
          <span style="color:var(--ink-soft);font-size:.85rem">${esc(r.platform.blurb)}</span>
          <span class="rest__pay">${esc(r.platform.pay?.display || '—')}</span>
        </div>`).join('')}
    </section>

    <p style="margin-top:2rem;text-align:center">
      <button class="btn btn--ghost" type="button" data-retake>Retake the quiz</button>
    </p>`;

  els.root.querySelector('[data-retake]').addEventListener('click', () => {
    state.step = 0;
    state.answers = {};
    renderQuestion();
    window.scrollTo({ top: 0 });
  });

  window.scrollTo({ top: 0 });
}

function resultCard(r, i) {
  const p = r.platform;
  const ordinal = ['1st', '2nd', '3rd'][i] || `${i + 1}th`;
  return `
  <article class="result-card">
    <div class="result-card__head">
      <span class="rank">${ordinal}</span>
      <h2 class="result-card__name">${esc(p.name)}</h2>
    </div>
    <p class="result-card__blurb">${esc(p.blurb)}</p>
    ${r.reasons.length ? `<ul class="reasons">${r.reasons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    <p class="result-card__pay"><strong>Pay:</strong> ${esc(p.pay?.display || '—')} (${esc(p.pay?.source || 'advertised')}, as of ${esc(formatMonth(p.pay?.as_of))})</p>
    ${p.honest_note ? `<div class="note"><strong>Honest note:</strong> ${esc(p.honest_note)}</div>` : ''}
    <div style="margin-top:.9rem">
      ${applyLink(p, 'quiz-result', `Apply to ${p.name}`)}
      ${disclosureLine(p)}
    </div>
  </article>`;
}

document.addEventListener('DOMContentLoaded', mountQuiz);
