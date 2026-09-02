/* ==========================================================================
   AI Work Pays — shared app logic
   ========================================================================== */

'use strict';

/* --- Site config --------------------------------------------------------
   One place to change the name, canonical URL and analytics code.
   ------------------------------------------------------------------------ */

const SITE = {
  name: 'AI Work Pays',
  wordmark: 'aiworkpays',
  // TODO: set once the domain is bought (used for canonical + OG tags).
  url: 'https://aiworkpays.example',
  // TODO: replace with your real GoatCounter code, e.g. 'aiworkpays'.
  goatcounter: null
};

/* --- Data layer ---------------------------------------------------------
   THE ONLY PLACE THAT TALKS TO A DATA SOURCE.
   Phase 2: change ENDPOINTS to the live API and nothing else moves.
     platforms: '/api/platforms/'
     jobs:      '/api/jobs/'
     guides:    '/api/guides/'
   ------------------------------------------------------------------------ */

const ENDPOINTS = {
  platforms: 'data/platforms.json',
  jobs: 'data/jobs.json',
  guides: 'data/guides.json'
};

const _cache = new Map();

/** Resolve a path relative to the site root, accounting for subfolder pages. */
function basePath() {
  return document.body.dataset.base || '';
}

/**
 * Fetch a collection by name. Cached per page load.
 * @param {'platforms'|'jobs'|'guides'} name
 * @returns {Promise<Array>}
 */
async function getData(name) {
  if (_cache.has(name)) return _cache.get(name);

  const endpoint = ENDPOINTS[name];
  if (!endpoint) throw new Error(`Unknown collection: ${name}`);

  const url = /^https?:|^\//.test(endpoint) ? endpoint : basePath() + endpoint;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  const data = await res.json();
  _cache.set(name, data);
  return data;
}

/* --- Click tracking -----------------------------------------------------
   No-op until a GoatCounter code is set in SITE. Phase 2 can POST here too.
   ------------------------------------------------------------------------ */

function trackClick(kind, label) {
  const path = `outbound/${kind}/${label}`;
  if (window.goatcounter && typeof window.goatcounter.count === 'function') {
    window.goatcounter.count({ path, title: `${kind}: ${label}`, event: true });
  }
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-track]');
  if (link) trackClick(link.dataset.track, link.dataset.trackLabel || link.hostname);
});

/* --- Utilities ----------------------------------------------------------- */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const pad2 = (n) => String(n).padStart(2, '0');

const STATUS_LABEL = {
  paid: 'Paying',
  waiting: 'Waiting',
  rejected: 'Rejected',
  untested: 'Unverified'
};

const COUNTRY_NAME = {
  us: 'United States', ca: 'Canada', uk: 'United Kingdom', in: 'India',
  ph: 'Philippines', ng: 'Nigeria', ke: 'Kenya', other: 'Elsewhere'
};

const GATE_LABEL = {
  none: 'No interview',
  written: 'Written assessment',
  video: 'AI video interview'
};

const DISCLOSED_NOTE =
  'Referral link — I earn a bonus if you sign up through it. It never changes your pay.';
const DIRECT_NOTE =
  'Direct link — no referral relationship, so this listing earns nothing.';

/** Highest figure mentioned in a pay string, used for sorting. */
function payCeiling(platform) {
  const nums = String(platform.pay?.display || '').match(/\d+(?:\.\d+)?/g);
  return nums ? Math.max(...nums.map(Number)) : 0;
}

function formatMonth(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return m ? `${months[Number(m) - 1]} ${y}` : y;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function setState(el, message, isError) {
  el.innerHTML = `<p class="state${isError ? ' state--error' : ''}">${esc(message)}</p>`;
}

/* --- Outbound link markup ------------------------------------------------ */

function applyLink(item, kind, labelText) {
  const rel = item.disclosed
    ? 'noopener nofollow sponsored'
    : 'noopener nofollow';
  const cls = item.disclosed ? 'btn' : 'btn btn--ghost';
  return `<a class="${cls}" href="${esc(item.url)}" target="_blank" rel="${rel}"
    data-track="${esc(kind)}" data-track-label="${esc(item.slug || item.title || '')}"
    >${esc(labelText)} →</a>`;
}

function disclosureLine(item) {
  const text = item.disclosed ? (item.referral_terms || DISCLOSED_NOTE) : DIRECT_NOTE;
  return `<span class="disclosure-flag">${esc(text)}</span>`;
}

/* --- Platforms ledger ---------------------------------------------------- */

function platformEntry(p, index) {
  const id = `detail-${esc(p.slug)}`;
  const status = p.status || 'untested';
  const gate = GATE_LABEL[p.tags?.gate] || '—';
  const countries = (p.tags?.countries || []).map((c) => COUNTRY_NAME[c] || c).join(', ') || '—';

  return `
  <article class="entry" data-slug="${esc(p.slug)}" data-countries="${esc((p.tags?.countries || []).join(' '))}">
    <div class="entry__row">
      <div class="entry__no" aria-hidden="true">${pad2(index + 1)}</div>
      <div class="entry__main">
        <h3 class="entry__name">
          ${esc(p.name)}
          <span class="tag tag--${esc(status)}">${esc(STATUS_LABEL[status] || status)}</span>
        </h3>
        <p class="entry__blurb">${esc(p.blurb)}</p>
      </div>
      <div class="entry__pay">
        ${esc(p.pay?.display || '—')}<br>
        <span class="as-of">as of ${esc(formatMonth(p.pay?.as_of))}</span>
      </div>
      <div class="entry__act">
        <button class="entry__toggle" type="button" aria-expanded="false" aria-controls="${id}">Details</button>
      </div>
    </div>

    <div class="entry__detail" id="${id}" hidden>
      <p>${esc(p.detail || p.blurb)}</p>
      <dl class="meta-grid">
        <div><dt>Entry gate</dt><dd>${esc(gate)}</dd></div>
        <div><dt>Pay basis</dt><dd>${esc(p.pay?.source || 'advertised')}</dd></div>
        <div><dt>Last checked</dt><dd>${esc(formatMonth(p.last_checked))}</dd></div>
        <div><dt>Open to</dt><dd>${esc(countries)}</dd></div>
      </dl>
      ${p.honest_note ? `<div class="note"><strong>Honest note:</strong> ${esc(p.honest_note)}</div>` : ''}
      <div>
        ${applyLink(p, 'platform', `Go to ${p.name}`)}
        ${disclosureLine(p)}
      </div>
    </div>
  </article>`;
}

function wireToggles(root) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.entry__toggle');
    if (!btn) return;
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    btn.textContent = open ? 'Details' : 'Close';
    panel.hidden = open;
  });
}

/**
 * Render the platforms ledger.
 * @param {string} mountId
 * @param {{country?: string, controls?: string}} [opts]
 */
async function renderPlatforms(mountId, opts = {}) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  setState(mount, 'Loading the ledger…');

  let platforms;
  try {
    platforms = await getData('platforms');
  } catch (err) {
    setState(mount, `Could not load the platform list (${err.message}). If you opened this file directly, run a local server instead.`, true);
    return;
  }

  if (opts.country) {
    platforms = platforms.filter((p) => (p.tags?.countries || []).includes(opts.country));
  }

  const draw = (list) => {
    mount.innerHTML = `
      <div class="ledger__head" aria-hidden="true">
        <span>№</span><span>Platform</span><span>Advertised pay</span><span></span>
      </div>
      ${list.map(platformEntry).join('')}`;
    const counter = opts.controls && document.querySelector(`#${opts.controls} .count`);
    if (counter) counter.textContent = `${list.length} platform${list.length === 1 ? '' : 's'}`;
  };

  draw(platforms);
  wireToggles(mount);

  const controls = opts.controls && document.getElementById(opts.controls);
  if (!controls) return;

  const sortSel = controls.querySelector('[data-sort]');
  const countrySel = controls.querySelector('[data-country]');

  const apply = () => {
    let list = platforms.slice();
    const c = countrySel && countrySel.value;
    if (c) list = list.filter((p) => (p.tags?.countries || []).includes(c));

    const mode = sortSel && sortSel.value;
    if (mode === 'pay') list.sort((a, b) => payCeiling(b) - payCeiling(a));
    else if (mode === 'name') list.sort((a, b) => a.name.localeCompare(b.name));

    draw(list);
  };

  if (sortSel) sortSel.addEventListener('change', apply);
  if (countrySel) countrySel.addEventListener('change', apply);
  apply();
}

/* --- Jobs ---------------------------------------------------------------- */

async function renderJobs(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  setState(mount, 'Loading job referrals…');

  let jobs;
  try {
    jobs = await getData('jobs');
  } catch (err) {
    setState(mount, `Could not load the job list (${err.message}).`, true);
    return;
  }

  if (!jobs.length) {
    setState(mount, 'No job referrals open right now. New posts go up as they land.');
    return;
  }

  mount.innerHTML = `
    <div class="ledger__head" aria-hidden="true">
      <span>№</span><span>Role</span><span>Pay</span><span></span>
    </div>
    ${jobs.map((job, i) => {
      const id = `job-${i}`;
      return `
      <article class="entry">
        <div class="entry__row">
          <div class="entry__no" aria-hidden="true">${pad2(i + 1)}</div>
          <div class="entry__main">
            <h3 class="entry__name">${esc(job.title)}</h3>
            <p class="entry__blurb">${esc(job.company)} · ${esc(job.location || 'Remote')}</p>
          </div>
          <div class="entry__pay">
            ${esc(job.pay || '—')}<br>
            <span class="as-of">posted ${esc(formatDate(job.posted))}</span>
          </div>
          <div class="entry__act">
            <button class="entry__toggle" type="button" aria-expanded="false" aria-controls="${id}">Details</button>
          </div>
        </div>
        <div class="entry__detail" id="${id}" hidden>
          <p>${esc(job.desc)}</p>
          <div>
            ${applyLink(job, 'job', 'Apply')}
            ${disclosureLine(job)}
          </div>
        </div>
      </article>`;
    }).join('')}`;

  wireToggles(mount);
}

/* --- Guides -------------------------------------------------------------- */

async function renderGuides(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  setState(mount, 'Loading guides…');

  let guides;
  try {
    guides = await getData('guides');
  } catch (err) {
    setState(mount, `Could not load the guide list (${err.message}).`, true);
    return;
  }

  mount.innerHTML = `<div class="cards">${guides.map((g) => `
    <a class="card" href="${basePath()}guides/${esc(g.slug)}.html">
      <h3>${esc(g.title)}</h3>
      <p>${esc(g.dek)}</p>
      <div class="card__meta">${esc(g.read_min)} min read · updated ${esc(formatMonth(g.updated))}${
        g.status === 'draft' ? ' · draft' : ''
      }</div>
    </a>`).join('')}</div>`;
}

/* --- Theme toggle -------------------------------------------------------- */

(function theme() {
  const KEY = 'awp-theme';
  const saved = localStorage.getItem(KEY);
  if (saved) document.documentElement.dataset.theme = saved;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-toggle');
    if (!btn) return;
    const current = document.documentElement.dataset.theme
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(KEY, next);
    btn.setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} theme`);
  });
})();

/* --- Nav current-page marker --------------------------------------------- */

(function markNav() {
  const here = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
  document.querySelectorAll('.nav a').forEach((a) => {
    const target = new URL(a.getAttribute('href'), location.href).pathname
      .replace(/index\.html$/, '').replace(/\/$/, '');
    if (target === here) a.setAttribute('aria-current', 'page');
  });
})();
