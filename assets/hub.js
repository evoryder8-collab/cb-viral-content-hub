/* CB Viral Content Hub — app logic (vanilla JS, no build step).
   Data: data/manifest.json + data/library.json + data/weeks/<id>.json
   (or window.__HUB_DATA__ when the page is built as a single file). */
(() => {
  'use strict';

  /* ---------------- constants ---------------- */
  const NICHES = [
    { key: 'massage', label: 'Massage', long: 'Massage therapists', weight: 1 },
    { key: 'gym_pt', label: 'PT Gyms', long: 'PT-led gyms & personal training', weight: 1 },
    { key: 'dexa_biohacking', label: 'DEXA & Biohacking', long: 'DEXA scans, body comp & biohacking', weight: 0.95 },
    { key: 'icebath', label: 'Ice Bath', long: 'Ice baths, cold plunge & Wim Hof', weight: 0.8 },
    { key: 'photo_video', label: 'Photo & Video', long: 'Photographers & videographers', weight: 0.8 }
  ];
  const NICHE = Object.fromEntries(NICHES.map(n => [n.key, n]));
  NICHE.general = { key: 'general', label: 'All niches', long: 'Works in every niche' };

  const HOOK_TYPES = {
    pattern_interrupt: 'Pattern interrupt', curiosity_gap: 'Curiosity gap', negative_warning: 'Negative / warning',
    contrarian: 'Contrarian', pov: 'POV', stitch_duet: 'Stitch / duet', green_screen_react: 'Green-screen react',
    asmr_sensory: 'ASMR / sensory', before_after_reveal: 'Before → after', transformation: 'Transformation',
    myth_bust: 'Myth-bust', listicle: 'Listicle', question: 'Question', storytime: 'Storytime',
    challenge_day_x: 'Day X series', behind_the_scenes: 'Behind the scenes', satisfying_process: 'Satisfying process',
    shock_stat: 'Shock stat', authority_credential: 'Authority', relatable_pain: 'Relatable pain',
    humor_skit: 'Humour / skit', comment_reply: 'Comment reply', tutorial_howto: 'Tutorial / how-to',
    price_value_reveal: 'Price / value reveal', test_experiment: 'Test / experiment', reaction_face: 'Reaction',
    social_proof_testimonial: 'Testimonial', us_vs_them: 'Us vs them', visual_spectacle: 'Visual spectacle', loop: 'Loop'
  };

  const I = {
    tiktok: '<svg viewBox="0 0 24 24"><path d="M14.5 3v11.2a3.8 3.8 0 1 1-3.8-3.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M14.5 3c.5 2.7 2.4 4.6 5.2 4.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    instagram: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/></svg>',
    youtube: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor"/></svg>',
    facebook: '<svg viewBox="0 0 24 24"><path d="M14 8h3V4.5h-3a4 4 0 0 0-4 4V11H7.5v3.5H10V21h3.5v-6.5H16.5l.5-3.5h-3.5V8.6c0-.3.2-.6.5-.6z" fill="currentColor"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M5 4.5l14 15M19 4.5l-14 15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    web: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 12h17M12 3.5c2.6 2.4 2.6 14.6 0 17M12 3.5c-2.6 2.4-2.6 14.6 0 17" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>',
    views: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" fill="currentColor"/></svg>',
    comment: '<svg viewBox="0 0 24 24"><path d="M4 5.5h16v10H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="1.9"/></svg>',
    save: '<svg viewBox="0 0 24 24"><path d="M6 3.5h12v17l-6-4-6 4z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>',
    ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    more: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24"><path d="M4 7h3.5c4.5 0 4.5 10 9 10H20M4 17h3.5c1.6 0 2.6-1.3 3.4-2.9M20 7h-3.5c-1.6 0-2.6 1.3-3.4 2.9M17.5 4.5 20 7l-2.5 2.5M17.5 14.5 20 17l-2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><rect x="6" y="2.5" width="12" height="19" rx="3" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>',
    cinema: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="13" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M16 11l5-3v9l-5-3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>',
    ear: '<svg viewBox="0 0 24 24"><path d="M7 9a5 5 0 0 1 10 0c0 3-3 3.5-3 6.5a3 3 0 0 1-5.5 1.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M10 9.5a2 2 0 0 1 4 0" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    cut: '<svg viewBox="0 0 24 24"><circle cx="6.5" cy="6.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="6.5" cy="17.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M8.6 8 20 18M8.6 16 20 6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="currentColor"/></svg>',
    cc: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M10.5 10.2a2.2 2.2 0 1 0 0 3.6M17 10.2a2.2 2.2 0 1 0 0 3.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    music: '<svg viewBox="0 0 24 24"><path d="M9 18V5.5l11-2V16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.5" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="17.5" cy="16" r="2.5" fill="none" stroke="currentColor" stroke-width="1.9"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    face: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="9" cy="10.5" r="1" fill="currentColor"/><circle cx="15" cy="10.5" r="1" fill="currentColor"/><path d="M8.8 14.5a4 4 0 0 0 6.4 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  // Icons for the visual guides (video.guide): the data names them, see scripts/validate.py GUIDE_ICONS.
  const ico = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  const GI = {
    eye: ico('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
    face: I.face,
    laugh: ico('<circle cx="12" cy="12" r="8.5"/><path d="M8 10q1-1.3 2 0M14 10q1-1.3 2 0M7.5 13.5h9a4.5 4.5 0 0 1-9 0z"/>'),
    hand: ico('<path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V11M10 10.5V4.5a1.5 1.5 0 0 1 3 0V11M13 10.5V5.5a1.5 1.5 0 0 1 3 0V12M16 11.5V8.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6.5 6.5 0 0 1-5.3-2.7l-2.6-3.7a1.6 1.6 0 0 1 2.5-2L7 13.5"/>'),
    ear: I.ear,
    mic: ico('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>'),
    music: I.music,
    text: ico('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9h8M12 9v7"/>'),
    camera: I.camera,
    tripod: ico('<rect x="8.5" y="2.5" width="7" height="9" rx="1.5"/><path d="M12 11.5v3M12 14.5l-5.5 7M12 14.5l5.5 7M12 14.5v7"/>'),
    zoom: ico('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6"/>'),
    light: ico('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>'),
    cut: I.cut,
    loop: ico('<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5"/>'),
    clock: I.clock,
    people: ico('<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="16.5" cy="9" r="2.6"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>'),
    person: ico('<circle cx="12" cy="8" r="3.5"/><path d="M5 20.5a7 7 0 0 1 14 0"/>'),
    spark: I.spark,
    question: ico('<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.2"/>'),
    chat: I.comment,
    share: ico('<path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5z"/>'),
    heart: I.heart,
    money: ico('<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/>'),
    pin: ico('<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
    paw: ico('<circle cx="6.5" cy="10" r="1.8"/><circle cx="10" cy="6" r="1.8"/><circle cx="14.5" cy="6" r="1.8"/><circle cx="18" cy="10" r="1.8"/><path d="M12.2 11.5c-2.5 0-5.4 3.6-5.4 6 0 1.6 1.3 2.5 2.8 2.5 1.2 0 1.8-.6 2.6-.6s1.5.6 2.7.6c1.5 0 2.8-.9 2.8-2.5 0-2.4-3-6-5.5-6z"/>'),
    snow: ico('<path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>'),
    dumbbell: ico('<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>'),
    scan: ico('<path d="M3.5 8V5A1.5 1.5 0 0 1 5 3.5h3M16 3.5h3A1.5 1.5 0 0 1 20.5 5v3M20.5 16v3a1.5 1.5 0 0 1-1.5 1.5h-3M8 20.5H5A1.5 1.5 0 0 1 3.5 19v-3M3.5 12h17"/>'),
    warn: ico('<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.3"/>'),
    check: I.check,
    star: ico('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'),
    fire: ico('<path d="M12 21a6.5 6.5 0 0 0 6.5-6.5c0-4.5-4-6.5-4.5-11-2.5 1.5-4.5 4.5-4 7.5-1-.5-1.8-1.5-2-2.5-1.5 1.5-2.5 3.6-2.5 6A6.5 6.5 0 0 0 12 21z"/>'),
    bolt: I.bolt,
    cinema: I.cinema
  };
  const SHOT = [['camera', 'Camera', 'camera'], ['angle', 'Angle', 'tripod'], ['light', 'Light', 'light'], ['sound', 'Sound', 'ear'], ['text', 'On-screen text', 'text'], ['edit', 'Edit', 'cut'], ['length', 'Length', 'clock'], ['people', 'People', 'people']];

  /* ---------------- utils ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const fmt = n => {
    if (n == null || isNaN(n)) return '—';
    const a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(a >= 1e11 ? 0 : 1).replace(/\.0$/, '') + 'B';
    if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e8 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (a >= 1e3) return (n / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return String(n);
  };
  // qualifier: '~' = approximate ("about 2.9M"), '+' = lower bound ("over 5M")
  const fmtQ = (n, q) => n == null ? '—' : q === '~' ? '~' + fmt(n) : q === '+' ? fmt(n) + '+' : fmt(n);
  const PLAT = { tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', facebook: 'Facebook', x: 'X', web: 'Web' };
  const PLATFORM_BOARDS = [
    { key: 'tiktok', label: 'TikTok top', short: 'TikTok', icon: 'tiktok', match: ['tiktok'] },
    { key: 'instagram', label: 'Instagram top', short: 'Instagram', icon: 'instagram', match: ['instagram'] },
    { key: 'youtube', label: 'YouTube top', short: 'YouTube', icon: 'youtube', match: ['youtube'], note: 'Shorts views include replays' },
    { key: 'other', label: 'X, Facebook & press-reported', short: 'other platforms', icon: 'web', match: ['x', 'web', 'facebook'], note: 'Platform not named in the source, or X / Facebook' }
  ];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = d => {
    if (!d) return '';
    const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(d);
    if (!m) return d;
    return (m[3] ? (+m[3]) + ' ' : '') + MONTHS[+m[2] - 1] + ' ' + m[1];
  };
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
  const store = {
    get(k, d) { try { const v = localStorage.getItem('cbhub:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('cbhub:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  const slotify = t => esc(t).replace(/\[([^\]]+)\]/g, '<span class="slot">[$1]</span>');

  /* ---------------- scoring ---------------- */
  // Virality is computed from public numbers only, so it is the same for everyone and re-computable.
  function virality(v) {
    const s = v.stats || {};
    let base = null, eng = 8, basis = '';
    if (s.views) {
      base = Math.pow(clamp((Math.log10(s.views) - 3.5) / 4, 0, 1), 0.8) * 80;
      if (s.likes) eng = clamp((s.likes / s.views) / 0.1, 0, 1) * 20;
      basis = 'views';
    } else if (s.likes) {
      base = Math.pow(clamp((Math.log10(s.likes) - 2.3) / 4.2, 0, 1), 0.8) * 80;
      basis = 'likes';
    }
    if (base == null) return { value: null, basis: 'none' };
    return { value: Math.round(clamp(base + eng, 0, 99)), basis };
  }
  // The viral bar: a leaderboard only shows proven hits.
  const BAR = { views: 1e6, likes: 1e5 };
  function passesBar(v) {
    const s = v.stats || {};
    if (s.views) return s.views >= BAR.views;
    return (s.likes || 0) >= BAR.likes;
  }
  function overall(v) {
    const vi = virality(v).value;
    const re = v.scores ? v.scores.relatability : 50;
    const rv = v.scores ? v.scores.relevancy : 50;
    return 0.4 * (vi == null ? 45 : vi) + 0.3 * re + 0.3 * rv;
  }

  /* ---------------- state ---------------- */
  const state = {
    data: null, weekId: null, niche: store.get('niche', 'all'), view: 'home', q: '',
    sort: 'viral', hookType: 'all', platform: 'instagram', showAll: false, group: 'all', platOpen: {}, plat: store.get('plat', 'all'),
    saved: store.get('saved', { v: [], h: [] }), pf: store.get('preflight', {}), spot: 0
  };
  const IS_SINGLE = !!(window.__HUB_DATA__ && window.__HUB_DATA__.mode === 'single');

  async function getJSON(p) {
    const r = await fetch(p, { cache: 'no-cache' });
    if (!r.ok) throw new Error(p + ' → ' + r.status);
    return r.json();
  }
  async function load() {
    if (window.__HUB_DATA__) return window.__HUB_DATA__;
    const manifest = await getJSON('data/manifest.json');
    const library = await getJSON('data/library.json');
    const weeks = {};
    await Promise.all(manifest.weeks.map(async w => { weeks[w.id] = await getJSON('data/weeks/' + w.id + '.json'); }));
    return { manifest, library, weeks };
  }

  // Flatten all weeks into one index (a newer week's copy of a video wins).
  function buildIndex(d) {
    const ids = d.manifest.weeks.map(w => w.id).sort();
    const videos = new Map();
    for (const id of ids) {
      const w = d.weeks[id];
      (w.videos || []).forEach(v => videos.set(v.id, Object.assign({}, v, { week: id })));
    }
    d.allVideos = Array.from(videos.values());
    d.videoById = videos;
    d.hookById = new Map((d.library.hooks || []).map(h => [h.id, h]));
    d.formatByKey = new Map((d.library.formats || []).map(f => [f.key, f]));
  }

  const nicheOK = n => state.niche === 'all' || n === state.niche;
  const boardOf = p => (PLATFORM_BOARDS.find(b => b.match.includes(p)) || PLATFORM_BOARDS[PLATFORM_BOARDS.length - 1]).key;
  const platOK = v => state.plat === 'all' || boardOf(v.platform) === state.plat;
  const nichesOK = arr => state.niche === 'all' || !arr || !arr.length || arr.includes(state.niche) || arr.includes('general');

  /* ---------------- render helpers ---------------- */
  function platformPill(p) {
    const label = PLAT[p] || 'Web';
    return '<span class="pill">' + (I[p] || I.web) + '<span>' + label + '</span></span>';
  }
  function ring(cls, label, value, big) {
    const r = 21, c = 2 * Math.PI * r;
    const off = value == null ? c : c * (1 - clamp(value, 0, 100) / 100);
    return '<div class="score ' + cls + (big ? ' big' : '') + '"><div class="ring"><svg viewBox="0 0 50 50"><circle class="trk" cx="25" cy="25" r="' + r + '" fill="none" stroke-width="4"/><circle class="arc" cx="25" cy="25" r="' + r + '" fill="none" stroke-width="4" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '"/></svg><b>' + (value == null ? '–' : value) + '</b></div><small>' + label + '</small></div>';
  }
  function posterHookText(v) {
    if (v.hook && v.hook.verbatim) return '<q>' + esc(v.hook.verbatim) + '</q>';
    return esc(v.poster_text || v.title);
  }
  function ytId(v) {
    if (v.platform !== 'youtube' || !v.url) return null;
    const m = /(?:shorts\/|v=|youtu\.be\/|embed\/)([\w-]{11})/.exec(v.url);
    return m ? m[1] : null;
  }
  // Real cover images: a cached file shipped with the hub (thumbs/<id>.jpg) wins. On the open web we can
  // also ask YouTube and TikTok for the cover at view time; the private single-file view only shows shipped files.
  function thumbSrc(v) {
    if (v.thumb) return v.thumb;
    const yid = ytId(v);
    if (yid && !IS_SINGLE) return 'https://i.ytimg.com/vi/' + yid + '/hqdefault.jpg';
    return null;
  }
  const ttRuntime = v => !IS_SINGLE && v.platform === 'tiktok' && /\/video\/\d+/.test(v.url || '');
  async function tiktokCover(v) {
    const key = 'tt:' + v.id;
    const hit = store.get(key, null);
    if (hit && Date.now() - hit.t < 12 * 3600e3) return hit.u;
    const r = await fetch('https://www.tiktok.com/oembed?url=' + encodeURIComponent(v.url));
    if (!r.ok) throw new Error('oembed ' + r.status);
    const j = await r.json();
    if (!j.thumbnail_url) throw new Error('no cover');
    store.set(key, { u: j.thumbnail_url, t: Date.now() });
    return j.thumbnail_url;
  }
  function hydrateThumbs(root) {
    $$('img[data-thumb]', root || document).forEach(img => {
      if (img.dataset.done) return;
      img.dataset.done = '1';
      const box = img.closest('.poster');
      const ok = () => { if (img.naturalWidth > 0 && box) box.classList.add('has-img'); };
      img.addEventListener('load', ok);
      img.addEventListener('error', () => { if (box) box.classList.remove('has-img'); img.remove(); });
      if (img.complete && img.getAttribute('src')) ok();
      if (img.dataset.tt) {
        const v = state.data.videoById.get(img.dataset.tt);
        if (v) tiktokCover(v).then(u => { img.src = u; }).catch(() => img.remove());
      }
    });
  }
  function poster(v, rank, opts) {
    opts = opts || {};
    const src = thumbSrc(v);
    const img = src
      ? '<img alt="" loading="lazy" decoding="async" data-thumb src="' + esc(src) + '">'
      : (ttRuntime(v) ? '<img alt="" decoding="async" data-thumb data-tt="' + esc(v.id) + '">' : '');
    const s = v.stats || {};
    const rk = rank ? '<span class="pill rank' + (rank <= 3 ? ' gold' : '') + '">#' + rank + '</span>' : '';
    return '<div class="poster" data-n="' + esc(v.niche) + '">' + img +
      '<div class="poster-shade"></div><div class="poster-grain"></div><span class="cover-tag">Original cover</span>' +
      '<div class="poster-top">' + platformPill(v.platform) + rk + '</div>' +
      '<div class="poster-hook">' + posterHookText(v) + '</div>' +
      (opts.noplay ? '' : '<div class="poster-play">' + I.play + '</div>') +
      '<div class="poster-stats num">' +
        '<span title="Views">' + I.views + (s.views ? fmtQ(s.views, s.qualifier) : '<span class="na">views n/a</span>') + '</span>' +
        '<span title="Likes">' + I.heart + (s.likes ? fmtQ(s.likes, s.qualifier) : '<span class="na">—</span>') + '</span>' +
      '</div><div class="poster-bar"><i></i></div></div>';
  }
  function videoCard(v, rank) {
    const vi = virality(v).value;
    const n = NICHE[v.niche] || NICHE.general;
    return '<article class="vcard glass lit" tabindex="0" role="button" data-open-v="' + esc(v.id) + '" data-n="' + esc(v.niche) + '" aria-label="' + esc(v.title) + '">' +
      poster(v, rank) +
      '<div class="vbody">' +
        '<div class="vmeta"><i class="dot"></i><span class="who">' + esc(n.label) + ' · ' + esc(v.creator && (v.creator.handle || v.creator.name) || '') + '</span></div>' +
        '<div class="vtitle">' + esc(v.title) + '</div>' +
        (v.formula ? '<div class="vformula">' + esc(v.formula) + '</div>' : '') +
        '<div class="scores">' + ring('viral', 'Virality', vi) + ring('relate', 'Relatable', v.scores && v.scores.relatability) + ring('relevant', 'Relevant', v.scores && v.scores.relevancy) + '</div>' +
      '</div></article>';
  }
  function hookRow(h) {
    const saved = state.saved.h.includes(h.id);
    const tags = (h.types || []).slice(0, 3).map(t => '<span class="tag">' + esc(HOOK_TYPES[t] || t) + '</span>').join('') +
      (h.niches || []).filter(n => n !== 'general').slice(0, 2).map(n => '<span class="tag n" data-n="' + esc(n) + '">' + esc((NICHE[n] || {}).label || n) + '</span>').join('');
    return '<div class="row" data-hook="' + esc(h.id) + '">' +
      '<div class="row-main">' +
        '<div class="hook-t">' + slotify(h.template) + '</div>' +
        (h.example ? '<div class="hook-ex"><q>' + esc(h.example) + '</q> <span class="by">— ' + esc(h.creator || '') + '</span></div>' : '') +
        '<div class="tags">' + tags + '</div>' +
        '<div class="hook-more" hidden>' +
          (h.evidence ? '<p><b>Why it works:</b> ' + esc(h.evidence) + '</p>' : '') +
          (h.delivery ? '<p><b>Delivery:</b> ' + esc(h.delivery.replace(/_/g, ' ')) + '</p>' : '') +
          (h.source_url ? '<div class="src"><a href="' + esc(h.source_url) + '" target="_blank" rel="noopener">Source: ' + esc(host(h.source_url)) + '</a></div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="row-actions">' +
        '<button class="icon-btn" type="button" data-copy-hook="' + esc(h.id) + '" aria-label="Copy hook">' + I.copy + '</button>' +
        '<button class="icon-btn" type="button" data-save-h="' + esc(h.id) + '" aria-pressed="' + saved + '" aria-label="Save hook">' + I.save + '</button>' +
        '<button class="icon-btn" type="button" data-expand aria-expanded="false" aria-label="Show evidence">' + I.more + '</button>' +
      '</div></div>';
  }
  function recipe(p) {
    if (!p) return '';
    const out = [];
    const cam = p.camera;
    if (cam) out.push('<span class="rc' + (cam === 'iphone' ? ' on' : '') + '">' + (cam === 'pro_camera' ? I.cinema : I.camera) + ({ iphone: 'iPhone / phone', pro_camera: 'Pro camera', mixed: 'Phone + pro', either: 'Any camera', action_camera: 'Action camera', unknown: 'Camera: unknown' }[cam] || cam) + '</span>');
    if (p.asmr) out.push('<span class="rc' + (p.asmr === 'yes' ? ' on' : '') + '">' + I.ear + ({ yes: 'ASMR sound', partial: 'Some ASMR', optional: 'ASMR optional', no: 'No ASMR' }[p.asmr] || p.asmr) + '</span>');
    if (p.editing) out.push('<span class="rc">' + I.cut + ({ raw: 'Raw, barely edited', light: 'Light edit', heavy: 'Heavy edit' }[p.editing] || p.editing) + '</span>');
    if (p.vfx && !/^none/i.test(p.vfx)) out.push('<span class="rc on" title="' + esc(p.vfx) + '">' + I.spark + esc(p.vfx.length > 34 ? p.vfx.slice(0, 32) + '…' : p.vfx) + '</span>');
    if (p.captions === true) out.push('<span class="rc on">' + I.cc + 'On-screen text</span>');
    if (p.audio) { const au = String(p.audio).replace(/_/g, ' '); out.push('<span class="rc" title="' + esc(au) + '">' + I.music + esc(au.length > 34 ? au.slice(0, 32) + '…' : au) + '</span>'); }
    if (p.length_s) out.push('<span class="rc">' + I.clock + esc(p.length_s) + (/s$/.test(String(p.length_s)) ? '' : ' s') + '</span>');
    if (p.faces) out.push('<span class="rc">' + I.face + esc(String(p.faces).replace(/_/g, ' ')) + '</span>');
    return '<div class="recipe">' + out.join('') + '</div>';
  }
  // The four "how to copy it" blocks as visuals: storyboard, reasons, spec tiles, numbered steps.
  function guideBlocks(g) {
    const gi = k => GI[k] || GI.check;
    const n = (g.story || []).length;
    const stage = i => i === 0 ? 'Hook' : i === n - 1 ? 'Payoff' : n === 4 && i === 2 ? 'Turn' : 'Build';
    const story = n ? '<div class="block"><h3>Formula</h3><ol class="story">' + g.story.map((f, i) =>
      '<li><div class="st"><span>' + stage(i) + '</span><span class="t">' + esc(f.t || '') + '</span></div><span class="ic">' + gi(f.icon) + '</span><b>' + esc(f.do) + '</b></li>').join('') + '</ol></div>' : '';
    const why = (g.why || []).length ? '<div class="block"><h3>Why it worked</h3><ul class="whys">' + g.why.map(w =>
      '<li><span class="ic">' + gi(w.icon) + '</span><b>' + esc(w.says) + '</b></li>').join('') + '</ul></div>' : '';
    const sh = g.shot || {};
    const tiles = SHOT.filter(s => sh[s[0]]).map(s => '<div><span class="ic">' + GI[s[2]] + '</span><small>' + s[1] + '</small><b>' + esc(sh[s[0]]) + '</b></div>').join('');
    const shot = tiles ? '<div class="block"><h3>How it was shot</h3><div class="spec">' + tiles + '</div></div>' : '';
    const steps = (g.steps || []).length ? '<div class="block"><h3>Repeat it</h3><ol class="steps">' + g.steps.map(s =>
      '<li><div class="do">' + gi(s.icon) + '<b>' + esc(s.do) + '</b></div>' + (s.tip ? '<div class="tip">' + esc(s.tip) + '</div>' : '') + '</li>').join('') + '</ol>' +
      (g.avoid ? '<p class="avoid">' + GI.warn + '<span>' + esc(g.avoid) + '</span></p>' : '') + '</div>' : '';
    return story + why + shot + steps;
  }
  function sec(title, sub, right, body, id) {
    return '<section class="section"' + (id ? ' id="' + id + '"' : '') + '><div class="sec-head"><div><h2>' + title + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (right || '') + '</div>' + body + '</section>';
  }
  function empty(t, s) { return '<div class="empty glass"><b>' + esc(t) + '</b><p>' + esc(s) + '</p></div>'; }

  /* ---------------- views ---------------- */
  function weekVideos() {
    const w = state.data.weeks[state.weekId];
    const ranks = new Map((w.picks || []).map((id, i) => [id, i + 1]));
    let list = (w.videos || []).map(v => Object.assign({}, v, { week: state.weekId, _rank: ranks.get(v.id) || 999 }));
    list = list.filter(v => nicheOK(v.niche) && platOK(v));
    const vir = v => { const x = virality(v).value; return x == null ? -1 : x; };
    if (state.sort === 'rank') list.sort((a, b) => a._rank - b._rank || overall(b) - overall(a));
    if (state.sort === 'viral') list.sort((a, b) => vir(b) - vir(a) || overall(b) - overall(a));
    if (state.sort === 'relevant') list.sort((a, b) => (b.scores.relevancy - a.scores.relevancy) || overall(b) - overall(a));
    return list;
  }

  function viewHome() {
    const w = state.data.weeks[state.weekId];
    const list = weekVideos();
    const moves = (w.moves || []).filter(m => nicheOK(m.niche) || m.niche === 'general');
    const hero = '<section class="hero section">' +
      '<span class="eyebrow">' + (w.kind === 'collection' ? 'Collection · ' : 'Weekly drop · ') + esc(w.label || fmtDate(w.id)) + '</span>' +
      '<h1>' + (w.headline_html || esc(w.headline || 'This week’s proven formulas')) + '</h1>' +
      (w.lede ? '<p class="lede">' + esc(w.lede) + '</p>' : '') +
      (moves.length ? '<div class="moves">' + moves.map((m, i) => '<a class="move glass lit" data-n="' + esc(m.niche) + '" href="' + (m.ref ? '#v-' + esc(m.ref) : '#home') + '"><span class="k">' + (i + 1) + '</span><div><b>' + esc(m.title) + '</b><span>' + esc(m.text) + '</span></div></a>').join('') + '</div>' : '') +
      '</section>';

    const seg = '<div class="seg" role="group" aria-label="Sort">' +
      [['viral', 'Most viral'], ['relevant', 'Most relevant'], ['rank', 'Our picks']].map(([k, l]) => '<button type="button" data-sort="' + k + '" aria-pressed="' + (state.sort === k) + '">' + l + '</button>').join('') + '</div>';
    // One leaderboard per platform: views are not comparable across apps, so nothing is mixed.
    const useBar = w.bar !== false;  // a collection like "Constantin's picks" shows everything
    const proven = useBar ? list.filter(passesBar) : list;
    const below = useBar ? list.filter(v => !passesBar(v)) : [];
    const boards = PLATFORM_BOARDS.filter(b => state.plat === 'all' || b.key === state.plat).map(b => {
      const items = proven.filter(v => b.match.includes(v.platform));
      if (!items.length) return '';
      const open = state.plat !== 'all' || !!state.platOpen[b.key];
      const shown = open ? items : items.slice(0, 4);
      const viralTop = items.map(v => virality(v).value).filter(x => x != null);
      const meta = items.length + (items.length === 1 ? ' reference' : ' references') + (viralTop.length ? ' · top virality ' + Math.max.apply(null, viralTop) : '');
      return '<section class="board" data-board="' + b.key + '">' +
        '<div class="board-head"><span class="board-icon">' + (I[b.icon] || I.web) + '</span><div><h3>' + esc(b.label) + '</h3><p>' + esc(meta) + '</p></div>' +
        (b.note ? '<span class="board-note">' + esc(b.note) + '</span>' : '') + '</div>' +
        '<div class="grid-v">' + shown.map((v, i) => videoCard(v, i + 1)).join('') + '</div>' +
        (items.length > 4 && state.plat === 'all' ? '<div class="board-more"><button class="btn" type="button" data-platopen="' + b.key + '">' + (open ? 'Show top 4 only' : 'Show all ' + items.length + ' on ' + esc(b.short)) + '</button></div>' : '') +
        '</section>';
    }).join('');
    const belowHtml = below.length ? '<section class="board below">' +
      '<div class="board-head"><span class="board-icon">' + I.bolt + '</span><div><h3>Below the viral bar</h3><p>' + below.length + ' references under 1M views (or 100K likes), or with no public numbers. Kept for the formula, not as proof.</p></div></div>' +
      (state.platOpen.below ? '<div class="grid-v">' + below.map(v => videoCard(v, 0)).join('') + '</div>' : '') +
      '<div class="board-more"><button class="btn" type="button" data-platopen="below">' + (state.platOpen.below ? 'Hide them' : 'Show ' + below.length + ' formula references') + '</button></div></section>' : '';
    const where = [state.niche !== 'all' ? NICHE[state.niche].label : '', state.plat !== 'all' ? (PLATFORM_BOARDS.find(b => b.key === state.plat) || {}).short : ''].filter(Boolean).join(' on ');
    const picks = list.length ? '<div class="boards">' + (boards || empty('No proven hit here yet', 'Nothing ' + (where ? 'in ' + where + ' ' : '') + 'clears 1M views or 100K likes this week. The formula references below are still worth a look.')) + belowHtml + '</div>' : empty('Nothing ' + (where ? 'for ' + where + ' ' : '') + 'this week', 'Switch the niche or platform filter to All, or open an earlier weekly drop.');

    const trends = (w.trends || []).filter(t => nicheOK(t.niche) || t.niche === 'general');
    const trendHtml = trends.length ? '<div class="panel glass"><div class="rows">' + trends.map(t =>
      '<div class="row trend" data-n="' + esc(t.niche) + '"><i class="dot"></i><div class="row-main"><b>' + esc(t.trend) + '</b><p>' + esc(t.evidence) + '</p>' +
      (t.source_url ? '<a href="' + esc(t.source_url) + '" target="_blank" rel="noopener">' + esc(host(t.source_url)) + (t.date ? ' · ' + esc(fmtDate(t.date)) : '') + '</a>' : '') + '</div></div>').join('') + '</div></div>' : '';

    const newHooks = (state.data.library.hooks || []).filter(h => h.added === state.weekId && nichesOK(h.niches));
    const featured = newHooks.filter(h => (h.niches || []).some(n => n !== 'general')).concat(newHooks.filter(h => !(h.niches || []).some(n => n !== 'general'))).slice(0, 6);
    const hookHtml = featured.length ? '<div class="panel glass"><div class="rows">' + featured.map(hookRow).join('') + '</div></div>' : '';

    return hero +
      sec(useBar ? 'Virality leaderboards' : 'Your picks', useBar ? 'Only proven hits: at least 1M views, or 100K likes where views are private. Ranked separately on each platform, because a view means something different on each app.' : 'Every video you sent in, ranked by virality on each platform. No viral bar here.', seg, picks) +
      (trendHtml ? sec('Moving right now', 'Signals from this week’s research. Ride them early.', '', trendHtml) : '') +
      (hookHtml ? sec('Hooks to steal this week', 'Fill the brackets with your niche.', '<a class="link" href="#hooks">All hooks →</a>', hookHtml) : '');
  }

  function filteredHooks() {
    return (state.data.library.hooks || []).filter(h => nichesOK(h.niches) && (state.hookType === 'all' || (h.types || []).includes(state.hookType)));
  }
  function viewHooks() {
    const base = (state.data.library.hooks || []).filter(h => nichesOK(h.niches));
    const counts = {};
    base.forEach(h => (h.types || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    const types = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    const filt = '<div class="filters" role="group" aria-label="Hook type"><button class="fchip" type="button" data-htype="all" aria-pressed="' + (state.hookType === 'all') + '">All types<span class="count">' + base.length + '</span></button>' +
      types.map(t => '<button class="fchip" type="button" data-htype="' + t + '" aria-pressed="' + (state.hookType === t) + '">' + esc(HOOK_TYPES[t] || t) + '<span class="count">' + counts[t] + '</span></button>').join('') + '</div>';
    const list = filteredHooks();
    const spot = list.length ? list[state.spot % list.length] : null;
    const spotlight = spot ? '<div class="glass lit" style="padding:24px 26px;border-radius:var(--r-xl)"><div style="position:relative;z-index:2;display:grid;gap:12px">' +
      '<span class="eyebrow">Hook roulette · ' + ((state.spot % list.length) + 1) + ' of ' + list.length + '</span>' +
      '<div class="big-hook">' + slotify(spot.template) + '</div>' +
      (spot.example ? '<div class="hook-ex"><q>' + esc(spot.example) + '</q> <span class="by">— ' + esc(spot.creator || '') + '</span></div>' : '') +
      '<div class="d-actions"><button class="btn primary" type="button" data-copy-hook="' + esc(spot.id) + '">' + I.copy + 'Copy hook</button><button class="btn" type="button" data-spin>' + I.shuffle + 'Next hook</button></div></div></div>' : '';
    return '<section class="section"><div class="sec-head"><div><span class="eyebrow">Hook library</span><h2 style="font-size:var(--t-2xl);margin-top:6px">Hooks that have already worked</h2><p>Lines lifted from top-performing posts and proven platform conventions, turned into fill-in-the-blank templates. Tap the arrow on any hook for its evidence and source.</p></div></div>' + spotlight + filt +
      (list.length ? '<div class="panel glass"><div class="rows">' + list.map(hookRow).join('') + '</div></div>' : empty('No hooks match', 'Try another type or switch to All niches.')) + '</section>';
  }

  function formatCard(f) {
    return '<article class="fcard glass lit" tabindex="0" role="button" data-open-f="' + esc(f.key) + '">' +
      '<div class="ndots">' + (f.niches || []).map(n => '<i data-n="' + esc(n) + '" title="' + esc((NICHE[n] || {}).label || n) + '"></i>').join('') + '</div>' +
      '<h3>' + esc(f.name) + '</h3><p>' + esc(f.definition) + '</p>' + recipe(f.production) + '</article>';
  }
  function viewFormats() {
    const list = (state.data.library.formats || []).filter(f => nichesOK(f.niches));
    const carousels = (state.data.library.carousels || []).filter(c => nichesOK([c.niche]));
    const cHtml = carousels.length ? '<div class="panel glass"><div class="rows">' + carousels.map(c =>
      '<div class="row"><div class="row-main"><span class="eyebrow">Slide 1</span><div class="hook-t">' + slotify(c.slide1) + '</div><p class="hook-ex">' + esc(c.structure) + '</p>' +
      '<div class="tags">' + (c.niche ? '<span class="tag n" data-n="' + esc(c.niche) + '">' + esc((NICHE[c.niche] || NICHE.general).label) + '</span>' : '') + (c.creator ? '<span class="tag">' + esc(c.creator) + '</span>' : '') + '</div>' +
      (c.evidence || c.source_url ? '<div class="src">' + (c.evidence ? '<span>' + esc(c.evidence) + '</span>' : '') + (c.source_url ? '<a href="' + esc(c.source_url) + '" target="_blank" rel="noopener">' + esc(host(c.source_url)) + '</a>' : '') + '</div>' : '') +
      '</div><div class="row-actions"><button class="icon-btn" type="button" data-copy-text="' + esc(c.slide1) + '" aria-label="Copy slide 1">' + I.copy + '</button></div></div>').join('') + '</div></div>' : '';
    return '<section class="section"><div class="sec-head"><div><span class="eyebrow">Formats</span><h2 style="font-size:var(--t-2xl);margin-top:6px">Proven video structures</h2><p>Pick a format first, then a hook. Each card shows how it is usually shot: camera, sound, edit level, length.</p></div></div>' +
      (list.length ? '<div class="grid-f">' + list.map(formatCard).join('') + '</div>' : empty('No formats for this niche yet', 'Switch to All niches.')) + '</section>' +
      (cHtml ? sec('Carousel formulas', 'Slide-1 hooks and slide structures that earn the swipe.', '', cHtml) : '');
  }

  function viewCraft() {
    const L = state.data.library;
    const allFactors = L.production || [];
    const groups = Array.from(new Set(allFactors.map(f => f.group || 'Other')));
    if (state.group !== 'all' && !groups.includes(state.group)) state.group = 'all';
    const factors = allFactors.filter(f => state.group === 'all' || (f.group || 'Other') === state.group);
    const gChips = '<div class="filters" role="group" aria-label="Element group"><button class="fchip" type="button" data-group="all" aria-pressed="' + (state.group === 'all') + '">All<span class="count">' + allFactors.length + '</span></button>' +
      groups.map(g => '<button class="fchip" type="button" data-group="' + esc(g) + '" aria-pressed="' + (state.group === g) + '">' + esc(g) + '<span class="count">' + allFactors.filter(f => (f.group || 'Other') === g).length + '</span></button>').join('') + '</div>';
    const big = (L.big_questions || []).map(b => {
      const f = allFactors.find(x => x.key === b.factor);
      return '<article class="ccard glass lit"><span class="eyebrow">' + esc(b.label || 'Big question') + '</span><h3 style="font-size:1.35rem">' + esc(b.q) + '</h3><p class="verdict">' + esc(b.a) + '</p>' + (f && f.sources ? srcLinks(f.sources) : '') + '</article>';
    }).join('');
    const fHtml = gChips + '<div class="grid-c">' + factors.map(f =>
      '<article class="ccard glass"><span class="eyebrow">' + esc(f.group || 'Element') + '</span><h3>' + esc(f.name) + '</h3>' +
      (f.stat ? '<div class="stat">' + esc(f.stat) + '</div>' : '') +
      '<p class="verdict">' + esc(f.verdict) + '</p>' +
      '<dl>' + (f.use_when ? '<div><dt>Use when </dt><dd>' + esc(f.use_when) + '</dd></div>' : '') + (f.avoid_when ? '<div><dt>Skip when </dt><dd>' + esc(f.avoid_when) + '</dd></div>' : '') + '</dl>' +
      (f.evidence ? '<p style="color:var(--fg-2);font-size:var(--t-sm)">' + esc(f.evidence) + '</p>' : '') +
      srcLinks(f.sources) + '</article>').join('') + '</div>';

    const fm = (L.formats || []).filter(f => f.production);
    const lv = (val, map) => { const m = map[val] || ['opt', val || '—']; return '<span class="lvl ' + m[0] + '"><i></i>' + esc(m[1]) + '</span>'; };
    const matrix = fm.length ? '<div class="glass table-wrap" style="border-radius:var(--r-lg)"><table class="matrix"><thead><tr><th>Format</th><th>Camera</th><th>ASMR / sound</th><th>Editing</th><th>Transitions / VFX</th><th>Audio</th><th>Length</th></tr></thead><tbody>' +
      fm.map(f => { const p = f.production; return '<tr><th scope="row">' + esc(f.name) + '</th><td>' + lv(p.camera, { iphone: ['yes', 'iPhone wins'], pro_camera: ['opt', 'Pro camera'], either: ['opt', 'Either'], mixed: ['opt', 'Phone + pro'] }) + '</td><td>' + lv(p.asmr, { yes: ['yes', 'Boosts'], optional: ['opt', 'Optional'], no: ['no', 'Not needed'], partial: ['opt', 'Partial'] }) + '</td><td>' + lv(p.editing, { raw: ['yes', 'Raw'], light: ['opt', 'Light'], heavy: ['no', 'Heavy'] }) + '</td><td>' + esc(p.transitions || '—') + '</td><td>' + esc(String(p.audio || '—').replace(/_/g, ' ')) + '</td><td class="num">' + esc(p.length_s || '—') + '</td></tr>'; }).join('') +
      '</tbody></table></div>' : '';

    const plats = ['instagram', 'tiktok', 'youtube', 'facebook'].filter(p => (L.algorithm || []).some(a => a.platform === p));
    if (!plats.includes(state.platform)) state.platform = plats[0];
    const pseg = '<div class="seg" role="group" aria-label="Platform">' + plats.map(p => '<button type="button" data-plat="' + p + '" aria-pressed="' + (state.platform === p) + '">' + ({ instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', facebook: 'Facebook' }[p]) + '</button>').join('') + '</div>';
    const facts = (L.algorithm || []).filter(a => a.platform === state.platform);
    const aHtml = '<div class="panel glass"><div class="facts">' + facts.map(a =>
      '<div class="fact"><span class="conf ' + esc(a.confidence) + '">' + esc({ official: 'Official', study: 'Data study', practitioner: 'Practitioner' }[a.confidence] || a.confidence || '') + (a.date ? ' · ' + esc(fmtDate(a.date)) : '') + '</span><b>' + esc(a.fact) + '</b>' + (a.implication ? '<p>→ ' + esc(a.implication) + '</p>' : '') + (a.source_url ? '<div class="src"><a href="' + esc(a.source_url) + '" target="_blank" rel="noopener">' + esc(host(a.source_url)) + '</a></div>' : '') + '</div>').join('') + '</div></div>';

    const notes = (L.niche_notes || []).filter(n => nicheOK(n.niche));
    const linkify = t => esc(t).replace(/(https?:\/\/[^\s,;)]+)/g, u => '<a href="' + u + '" target="_blank" rel="noopener">' + esc(host(u.replace(/&amp;/g, '&'))) + '</a>');
    const nHtml = notes.length ? '<div class="panel glass"><div class="facts">' + notes.map(n => '<div class="fact" data-n="' + esc(n.niche) + '"><span class="conf" style="color:var(--c)">' + esc((NICHE[n.niche] || NICHE.general).label) + '</span><p style="color:var(--fg)">' + linkify(n.note) + '</p></div>').join('') + '</div></div>' : '';
    const cs = L.carousel_science || [];
    const cHtml = cs.length ? '<div class="panel glass"><div class="facts">' + cs.map(c => '<div class="fact"><b>' + esc(c.fact) + '</b>' + (c.implication ? '<p>→ ' + esc(c.implication) + '</p>' : '') + (c.source_url ? '<div class="src"><a href="' + esc(c.source_url) + '" target="_blank" rel="noopener">' + esc(host(c.source_url)) + (c.date ? ' · ' + esc(fmtDate(c.date)) : '') + '</a></div>' : '') + '</div>').join('') + '</div></div>' : '';

    const how = '<div class="grid-c">' +
      '<article class="ccard glass">' + ring('viral', 'Virality', 78, true) + '<h3>Virality</h3><p style="color:var(--fg-2);font-size:var(--t-sm)">Calculated from the public numbers only. Views on a log scale (10K ≈ 20, 1M ≈ 55, 30M+ ≈ 80) plus up to 20 points for like-rate (likes ÷ views, maxing out at 10%). When only likes are public, likes are used instead. No numbers, no score.</p></article>' +
      '<article class="ccard glass">' + ring('relate', 'Relatable', 84, true) + '<h3>Relatability</h3><p style="color:var(--fg-2);font-size:var(--t-sm)">Editorial rating: how universal the feeling or problem in the hook is (desk-neck pain beats a niche technique), whether a viewer sees themselves in the first 2 seconds, and whether it makes people tag or send it.</p></article>' +
      '<article class="ccard glass">' + ring('relevant', 'Relevant', 92, true) + '<h3>Relevancy</h3><p style="color:var(--fg-2);font-size:var(--t-sm)">Editorial rating: how directly the formula transfers to your client niches, weighted by priority (massage and PT gyms first, DEXA/biohacking next, then ice baths and photo/video), and whether it can be shot without special access or budget.</p></article>' +
      '</div>';

    return '<section class="section"><div class="sec-head"><div><span class="eyebrow">Craft</span><h2 style="font-size:var(--t-2xl);margin-top:6px">What to shoot with, how to edit, what the algorithms reward</h2><p>The production decisions behind viral posts: iPhone or cinema camera, ASMR or music, raw or heavily edited. Each verdict links to its evidence.</p></div></div></section>' +
      (big ? sec('The three questions to answer before every shoot', 'Short answers from this week’s research. Sources under each card.', '', '<div class="grid-c">' + big + '</div>') : '') +
      (allFactors.length ? sec('Production elements', 'Verdicts on the choices you make before you press record.', '', fHtml) : '') +
      (nHtml ? sec('Niche production notes', state.niche === 'all' ? 'What the research found about shooting in each niche. Pick a niche above to narrow this list.' : 'What the research found about shooting in this niche.', '', nHtml) : '') +
      (matrix ? sec('Format × element matrix', 'Default production recipe for each format. Green means it helps, amber means it depends on the shot, grey means it doesn’t matter.', '', matrix) : '') +
      (facts.length ? sec('What the algorithms reward', 'Official statements first, then large data studies, then practitioner consensus.', pseg, aHtml) : '') +
      (cHtml ? sec('Carousel science', '', '', cHtml) : '') +
      sec('How scores work', 'Three numbers on every card, each out of 100.', '', how, 'scores');
  }

  function viewPreflight() {
    const items = state.data.library.checklist || [];
    const total = items.reduce((a, c) => a + (c.weight || 1), 0);
    const got = items.reduce((a, c) => a + (state.pf[c.id] ? (c.weight || 1) : 0), 0);
    const pct = total ? Math.round(got / total * 100) : 0;
    const verdict = pct >= 85 ? 'Ready to post.' : pct >= 65 ? 'Close. Fix the heaviest unticked items.' : pct >= 40 ? 'Not yet. The hook or the first frame needs work.' : 'Start with the top three checks.';
    const r = 80, c = 2 * Math.PI * r;
    const list = '<div class="pf-list panel glass">' + items.map(it =>
      '<label class="pf-item" for="pf-' + esc(it.id) + '"><input type="checkbox" id="pf-' + esc(it.id) + '" data-pf="' + esc(it.id) + '"' + (state.pf[it.id] ? ' checked' : '') + '><span class="pf-box">' + I.check + '</span><span><b>' + esc(it.check) + '</b><p>' + esc(it.why) + (it.source_url ? ' <a class="link" style="font-size:var(--t-xs)" href="' + esc(it.source_url) + '" target="_blank" rel="noopener">source</a>' : '') + '</p></span><span class="pf-w" title="Weight">×' + (it.weight || 1) + '</span></label>').join('') + '</div>';
    const side = '<aside class="pf-side glass"><span class="eyebrow">Viral readiness</span><div class="gauge"><svg viewBox="0 0 180 180"><defs><linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--s-relate)"/><stop offset=".5" stop-color="var(--s-viral)"/><stop offset="1" stop-color="var(--s-relevant)"/></linearGradient></defs><circle class="trk" cx="90" cy="90" r="' + r + '" fill="none" stroke-width="12"/><circle class="arc" cx="90" cy="90" r="' + r + '" fill="none" stroke-width="12" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - pct / 100)).toFixed(1) + '"/></svg><b class="num">' + pct + '</b></div><p class="pf-verdict">' + esc(verdict) + '</p><p>Tick what is true for the post you are about to publish. Heavier items move the needle more.</p><button class="btn" type="button" data-pf-reset>Reset checklist</button></aside>';
    return '<section class="section"><div class="sec-head"><div><span class="eyebrow">Pre-flight</span><h2 style="font-size:var(--t-2xl);margin-top:6px">Check before you post</h2><p>Each check is tied to a platform statement or a large study. None of this guarantees a viral post, but every unticked box is a known way to lose one.</p></div></div><div class="pf">' + list + side + '</div></section>';
  }

  function viewSaved() {
    const vids = state.saved.v.map(id => state.data.videoById.get(id)).filter(v => v && platOK(v));
    const hooks = state.saved.h.map(id => state.data.hookById.get(id)).filter(Boolean);
    if (!vids.length && !hooks.length) return '<section class="section">' + empty('Nothing saved yet', 'Tap the bookmark on any reference or hook. Saved items stay on this device.') + '</section>';
    return '<section class="section"><div class="sec-head"><div><span class="eyebrow">Saved</span><h2 style="font-size:var(--t-2xl);margin-top:6px">Your shortlist</h2><p>Stored in this browser only.</p></div></div></section>' +
      (vids.length ? sec('References', '', '', '<div class="grid-v">' + vids.map(v => videoCard(v, 0)).join('') + '</div>') : '') +
      (hooks.length ? sec('Hooks', '', '', '<div class="panel glass"><div class="rows">' + hooks.map(hookRow).join('') + '</div></div>') : '');
  }

  function srcLinks(arr) {
    if (!arr || !arr.length) return '';
    return '<div class="src">' + arr.slice(0, 4).map(u => '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(host(u) || u) + '</a>').join('') + '</div>';
  }

  /* ---------------- search ---------------- */
  function textOf(o) {
    if (!o) return '';
    if (typeof o === 'string') return o;
    if (Array.isArray(o)) return o.map(textOf).join(' ');
    if (typeof o === 'object') return Object.values(o).map(textOf).join(' ');
    return String(o);
  }
  function searchAll(q) {
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
    const score = (hay) => { hay = hay.toLowerCase(); let s = 0; for (const t of toks) { if (!hay.includes(t)) return 0; s += hay.split(t).length - 1; } return s; };
    const typeWords = o => (o.types || (o.hook && o.hook.types) || []).map(t => HOOK_TYPES[t] || t).join(' ');
    const nicheWords = o => [o.niche].concat(o.niches || []).map(n => n && NICHE[n] ? NICHE[n].label + ' ' + NICHE[n].long : '').join(' ');
    const rank = (arr, fn) => arr.map(o => [o, score(fn(o))]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).map(x => x[0]);
    const L = state.data.library;
    return {
      videos: rank(state.data.allVideos.filter(v => nicheOK(v.niche) && platOK(v)), v => textOf([v.title, v.creator, v.hook, v.formula, v.why, v.replicate, v.platform, v.production, v.beats]) + ' ' + typeWords(v) + ' ' + nicheWords(v)),
      hooks: rank((L.hooks || []).filter(h => nichesOK(h.niches)), h => textOf([h.template, h.example, h.creator, h.evidence]) + ' ' + typeWords(h) + ' ' + nicheWords(h)),
      formats: rank((L.formats || []).filter(f => nichesOK(f.niches)), f => textOf([f.name, f.definition, f.when, f.steps, f.evidence, f.production])),
      craft: rank((L.production || []).concat(L.algorithm || []), c => textOf(c))
    };
  }
  function viewSearch() {
    const r = searchAll(state.q);
    const n = r.videos.length + r.hooks.length + r.formats.length + r.craft.length;
    let html = '<section class="section"><div class="s-head"><h1>“' + esc(state.q) + '”</h1><span>' + n + ' result' + (n === 1 ? '' : 's') + (state.niche !== 'all' ? ' in ' + esc(NICHE[state.niche].label) : '') + '</span></div></section>';
    if (!n) return html + '<section class="section">' + empty('No matches', 'Try a broader word such as “ASMR”, “before”, “POV”, “price” or a creator handle.') + '</section>';
    if (r.videos.length) html += sec('References', '', '', '<div class="grid-v">' + r.videos.slice(0, 24).map(v => videoCard(v, 0)).join('') + '</div>');
    if (r.hooks.length) html += sec('Hooks', '', '', '<div class="panel glass"><div class="rows">' + r.hooks.slice(0, 40).map(hookRow).join('') + '</div></div>');
    if (r.formats.length) html += sec('Formats', '', '', '<div class="grid-f">' + r.formats.slice(0, 12).map(formatCard).join('') + '</div>');
    if (r.craft.length) html += sec('Craft & algorithm', '', '', '<div class="panel glass"><div class="facts">' + r.craft.slice(0, 12).map(c => '<div class="fact"><b>' + esc(c.name || c.fact) + '</b><p>' + esc(c.verdict || c.implication || '') + '</p></div>').join('') + '</div></div>');
    return html;
  }

  /* ---------------- detail sheets ---------------- */
  function embedUrl(v) {
    if (!v.url) return null;
    let m;
    if (v.platform === 'youtube' && (m = ytId(v))) return 'https://www.youtube-nocookie.com/embed/' + m;
    if (v.platform === 'tiktok' && (m = /\/video\/(\d+)/.exec(v.url))) return 'https://www.tiktok.com/embed/v2/' + m[1];
    if (v.platform === 'instagram' && (m = /instagram\.com\/(?:[\w.]+\/)?(reel|p|tv)\/([\w-]+)/.exec(v.url))) return 'https://www.instagram.com/' + m[1] + '/' + m[2] + '/embed';
    return null;
  }
  function brief(v) {
    const p = v.production || {};
    const g = v.guide;
    if (g) {
      const sh = g.shot || {};
      const gl = [
        'REFERENCE: ' + v.title + ' (' + (v.creator && v.creator.handle || '') + ', ' + v.platform + ')',
        v.url ? 'LINK: ' + v.url : '',
        '',
        'STORYBOARD:'
      ].concat((g.story || []).map(f => '- ' + f.t + ': ' + f.do))
        .concat(['', 'WHY IT WORKS:'], (g.why || []).map(w => '- ' + w.says))
        .concat(['', 'SHOT:'], SHOT.filter(s => sh[s[0]]).map(s => '- ' + s[1] + ': ' + sh[s[0]]))
        .concat(['', 'SHOOT YOUR VERSION:'], (g.steps || []).map((s, i) => (i + 1) + '. ' + s.do + (s.tip ? ' (' + s.tip + ')' : '')))
        .concat(g.avoid ? ['', 'AVOID: ' + g.avoid] : []);
      return gl.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
    }
    const lines = [
      'REFERENCE: ' + v.title + ' (' + (v.creator && v.creator.handle || '') + ', ' + v.platform + ')',
      v.url ? 'LINK: ' + v.url : '',
      '',
      'HOOK: ' + (v.hook && (v.hook.verbatim || v.hook.summary) || ''),
      'FORMULA: ' + (v.formula || ''),
      '',
      'BEATS:'
    ].concat((v.beats || []).map(b => '- ' + b)).concat([
      '',
      'SHOOT: ' + [p.camera && p.camera.replace('_', ' '), p.asmr && ('ASMR ' + p.asmr), p.editing && (p.editing + ' edit'), p.vfx, p.captions ? 'on-screen text' : '', p.audio && String(p.audio).replace(/_/g, ' '), p.length_s && (p.length_s + 's')].filter(Boolean).join(' · '),
      '',
      'REPEAT IT: ' + (v.replicate || '')
    ]);
    if (v.remix) lines.push('', 'REMIX:', ...Object.keys(v.remix).map(k => '- ' + ((NICHE[k] || {}).label || k) + ': ' + v.remix[k]));
    return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
  }
  function openVideo(id) {
    const v = state.data.videoById.get(id);
    if (!v) return;
    const s = v.stats || {};
    const vi = virality(v);
    const n = NICHE[v.niche] || NICHE.general;
    const emb = embedUrl(v);
    const saved = state.saved.v.includes(v.id);
    const statCells = [['Views', s.views], ['Likes', s.likes], ['Comments', s.comments], ['Shares / saves', s.shares]].filter(x => x[1] != null)
      .map(x => '<div class="d-stat"><b>' + fmtQ(x[1], s.qualifier) + '</b><span>' + x[0] + '</span></div>').join('') ||
      '<div class="d-stat"><b>—</b><span>No public numbers found</span></div>';
    const statSrc = s.quote || s.source_url ? '<div class="quote">' + (s.quote ? '<b>Reported:</b> ' + esc(s.quote) : '') + (s.source_url ? ' <a class="link" href="' + esc(s.source_url) + '" target="_blank" rel="noopener">' + esc(host(s.source_url)) + (s.as_of ? ', ' + esc(fmtDate(s.as_of)) : '') + ' ↗</a>' : '') + '</div>' : '';
    const remix = v.remix ? '<div class="block"><h3>Remix for each niche</h3><div class="remix">' + Object.keys(v.remix).map(k => '<div class="remix-row" data-n="' + esc(k) + '"><b><i></i>' + esc((NICHE[k] || {}).label || k) + '</b><span>' + esc(v.remix[k]) + '</span></div>').join('') + '</div></div>' : '';
    const typeTags = ((v.hook && v.hook.types) || []).map(t => '<span class="tag">' + esc(HOOK_TYPES[t] || t) + '</span>').join('');
    const platLabel = v.url_is_exact_post === false && !/tiktok|instagram|youtube|facebook|x\.com/.test(host(v.url)) ? 'the source' : (PLAT[v.platform] || 'the source');
    const notes =
      (v.formula ? '<div class="block"><h3>Formula</h3><p style="color:var(--fg);font-weight:600">' + esc(v.formula) + '</p></div>' : '') +
      (v.beats && v.beats.length ? '<div class="block"><h3>Beat by beat</h3><ol class="beats">' + v.beats.map(b => { const m = /^([\d.:–\-+ s]+s|end|End)\s*[:\-–]?\s*(.*)$/.exec(b); return '<li><span class="t">' + esc(m ? m[1] : '•') + '</span><span>' + esc(m ? m[2] : b) + '</span></li>'; }).join('') + '</ol>' + (v.beats_inferred ? '<p style="color:var(--fg-3);font-size:var(--t-xs)">Beats reconstructed from captions and press coverage, not frame-checked. Watch the original before you copy the timing.</p>' : '') + '</div>' : '') +
      (v.why ? '<div class="block"><h3>Why it worked</h3><p>' + esc(v.why) + '</p></div>' : '') +
      (v.production ? '<div class="block"><h3>How it was shot</h3>' + recipe(v.production) + '</div>' : '') +
      (v.replicate ? '<div class="block"><h3>Repeat it</h3><p>' + esc(v.replicate) + '</p></div>' : '');
    const html =
      '<div class="d-grid">' +
        '<div class="d-left"><div id="player">' + poster(v, 0, { noplay: !emb || IS_SINGLE }) + '</div>' +
          '<div class="d-actions">' +
            (emb && !IS_SINGLE ? '<button class="btn primary" type="button" data-embed="' + esc(emb) + '">' + I.play + 'Play here</button>' : '') +
            (v.url ? '<a class="btn' + (emb && !IS_SINGLE ? '' : ' primary') + '" href="' + esc(v.url) + '" target="_blank" rel="noopener">' + I.ext + (v.url_is_exact_post === false ? (/tiktok|instagram|youtube|x\.com/.test(host(v.url)) ? 'Open creator profile' : 'Read the source') : 'Watch on ' + platLabel) + '</a>' : '') +
          '</div></div>' +
        '<div class="d-main">' +
          '<div class="tags"><span class="tag n" data-n="' + esc(v.niche) + '">' + esc(n.label) + '</span>' + (v.pick ? '<span class="tag n" data-n="general">Constantin\'s pick</span>' : '') + (v.adjacent ? '<span class="tag">Adjacent niche</span>' : '') + '<span class="tag">' + esc(platLabel) + '</span>' + (v.posted ? '<span class="tag">Posted ' + esc(fmtDate(v.posted)) + '</span>' : '') + (v.evidence ? '<span class="tag ev-' + esc(v.evidence) + '">Evidence: ' + esc(v.evidence) + '</span>' : '') + (v.effort ? '<span class="tag">Effort: ' + esc(v.effort) + '</span>' : '') + '</div>' +
          '<h2 id="sheet-title">' + esc(v.title) + '</h2>' +
          '<p style="color:var(--fg-2)">' + esc((v.creator && [v.creator.name, v.creator.handle].filter(Boolean).join(' · ')) || '') + (v.creator && v.creator.followers ? ' · ' + esc(v.creator.followers) + ' followers' : '') + (v.url_is_exact_post === false ? ' · <em>exact post link not found; the button opens the best available source</em>' : '') + '</p>' +
          (v.url_note ? '<p style="color:var(--warn);font-size:var(--t-xs)">' + esc(v.url_note) + '</p>' : '') +
          '<div class="d-stats">' + statCells + '</div>' + statSrc +
          '<div class="d-scores">' + ring('viral', 'Virality', vi.value, true) + ring('relate', 'Relatable', v.scores && v.scores.relatability, true) + ring('relevant', 'Relevant', v.scores && v.scores.relevancy, true) + '</div>' +
          (v.scores && v.scores.note ? '<p style="color:var(--fg-3);font-size:var(--t-sm)">' + esc(v.scores.note) + '</p>' : '') +
          '<div class="block"><h3>The hook</h3>' + (v.hook && v.hook.verbatim ? '<div class="big-hook">“' + esc(v.hook.verbatim) + '”</div>' + (v.hook.summary ? '<p>' + esc(v.hook.summary) + '</p>' : '') : '<p style="color:var(--fg);font-size:var(--t-lg);font-weight:600;line-height:1.45">' + esc(v.hook && v.hook.summary || '') + '</p><p style="color:var(--fg-3);font-size:var(--t-xs)">Exact opening line not documented in the sources; this describes what happens on screen.</p>') + '<div class="tags">' + typeTags + '</div></div>' +
          (v.guide ? guideBlocks(v.guide) + '<details class="notes"><summary>Full research notes</summary><div class="d-main">' + notes + '</div></details>' : notes) +
          remix +
          '<div class="d-actions"><button class="btn primary" type="button" data-copy-brief="' + esc(v.id) + '">' + I.copy + 'Copy shoot brief</button><button class="btn" type="button" data-save-v="' + esc(v.id) + '" aria-pressed="' + saved + '">' + I.save + (saved ? 'Saved' : 'Save') + '</button></div>' +
        '</div>' +
      '</div>';
    openSheet(html);
  }
  function openFormat(key) {
    const f = state.data.formatByKey.get(key);
    if (!f) return;
    const ex = f.example;
    const html = '<div class="d-main" style="max-width:760px">' +
      '<div class="tags">' + (f.niches || []).map(n => '<span class="tag n" data-n="' + esc(n) + '">' + esc((NICHE[n] || {}).label || n) + '</span>').join('') + '</div>' +
      '<h2 id="sheet-title">' + esc(f.name) + '</h2><p style="color:var(--fg-2);font-size:var(--t-lg)">' + esc(f.definition) + '</p>' +
      (f.when ? '<div class="block"><h3>Use it when</h3><p>' + esc(f.when) + '</p></div>' : '') +
      (f.steps && f.steps.length ? '<div class="block"><h3>How to shoot it</h3><ol class="beats">' + f.steps.map((s, i) => '<li><span class="t">Step ' + (i + 1) + '</span><span>' + esc(s) + '</span></li>').join('') + '</ol></div>' : '') +
      (f.production ? '<div class="block"><h3>Default recipe</h3>' + recipe(Object.assign({}, f.production, { vfx: f.production.transitions })) + '</div>' : '') +
      (ex && (ex.creator || ex.description) ? '<div class="block"><h3>Proof it works</h3><p><b>' + esc(ex.creator || '') + '</b> ' + esc(ex.description || '') + (ex.stats ? ' · ' + esc(ex.stats) : '') + '</p>' + (ex.url ? '<div class="src"><a href="' + esc(ex.url) + '" target="_blank" rel="noopener">' + esc(host(ex.url)) + '</a></div>' : '') + '</div>' : '') +
      (f.evidence ? '<div class="block"><h3>Evidence</h3><p>' + esc(f.evidence) + '</p>' + srcLinks(f.sources) + '</div>' : '') +
      relatedVideos(f.key) +
      '</div>';
    openSheet(html);
  }
  function relatedVideos(key) {
    const rel = state.data.allVideos.filter(v => platOK(v) && ((v.hook && v.hook.types || []).includes(key) || v.format_key === key)).sort((a, b) => (virality(b).value || 0) - (virality(a).value || 0)).slice(0, 6);
    if (!rel.length) return '';
    return '<div class="block"><h3>References using this format</h3><div class="grid-v">' + rel.map(v => videoCard(v, 0)).join('') + '</div></div>';
  }
  let lastFocus = null;
  function openSheet(html) {
    lastFocus = document.activeElement;
    $('#sheet-body').innerHTML = html;
    hydrateThumbs($('#sheet-body'));
    const wrap = $('#sheet');
    wrap.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    $('.sheet', wrap).scrollTop = 0;
    setTimeout(() => { const x = $('.sheet-x', wrap); if (x) x.focus(); }, 30);
  }
  function closeSheet() {
    const wrap = $('#sheet');
    if (wrap.hidden) return;
    wrap.hidden = true;
    $('#sheet-body').innerHTML = '';
    document.documentElement.style.overflow = '';
    if (/^#v-/.test(location.hash)) { try { history.replaceState(null, '', '#' + state.view); } catch (e) { /* ignore */ } }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------------- chrome ---------------- */
  function renderNiches() {
    const all = state.data.allVideos;
    const weekVids = (state.data.weeks[state.weekId].videos || []);
    const count = k => (k === 'all' ? weekVids : weekVids.filter(v => v.niche === k)).filter(platOK).length;
    $('#niches').innerHTML = '<button class="chip all" type="button" data-niche="all" aria-pressed="' + (state.niche === 'all') + '"><i class="dot"></i>All niches<span class="count">' + count('all') + '</span></button>' +
      NICHES.map(n => '<button class="chip" type="button" data-n="' + n.key + '" data-niche="' + n.key + '" aria-pressed="' + (state.niche === n.key) + '"><i class="dot"></i>' + esc(n.label) + '<span class="count">' + count(n.key) + '</span></button>').join('');
    void all;
  }
  function renderPlats() {
    const weekVids = (state.data.weeks[state.weekId].videos || []).filter(v => nicheOK(v.niche));
    const n = k => (k === 'all' ? weekVids : weekVids.filter(v => boardOf(v.platform) === k)).length;
    $('#plats').innerHTML = '<span class="plats-label">Platform</span>' +
      '<button class="chip all" type="button" data-plat-filter="all" aria-pressed="' + (state.plat === 'all') + '">All<span class="count">' + n('all') + '</span></button>' +
      PLATFORM_BOARDS.map(b => '<button class="chip pchip" type="button" data-plat-filter="' + b.key + '" aria-pressed="' + (state.plat === b.key) + '">' + (I[b.icon] || I.web) + esc(b.key === 'other' ? 'X & other' : b.short) + '<span class="count">' + n(b.key) + '</span></button>').join('');
  }
  function renderWeeks() {
    const sel = $('#week');
    const all = state.data.manifest.weeks;
    const weeks = all.filter(w => w.kind !== 'collection').sort((a, b) => b.id.localeCompare(a.id));
    const cols = all.filter(w => w.kind === 'collection');
    const opt = (w, text) => '<option value="' + esc(w.id) + '"' + (w.id === state.weekId ? ' selected' : '') + '>' + esc(text) + '</option>';
    sel.innerHTML = weeks.map((w, i) => opt(w, (i === 0 ? 'This week · ' : 'Week of ') + fmtDate(w.id))).join('') +
      (cols.length ? '<optgroup label="Collections">' + cols.map(w => opt(w, w.label || w.id)).join('') + '</optgroup>' : '');
  }
  function render() {
    const view = state.q ? 'search' : state.view;
    const html = { home: viewHome, hooks: viewHooks, formats: viewFormats, craft: viewCraft, preflight: viewPreflight, saved: viewSaved, search: viewSearch }[view]();
    $('#view').innerHTML = html;
    hydrateThumbs($('#view'));
    $$('.dock a').forEach(a => a.setAttribute('aria-current', !state.q && a.dataset.view === state.view ? 'page' : 'false'));
    renderNiches();
    renderPlats();
  }
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('on'), 1800);
  }
  async function copy(text, label) {
    try { await navigator.clipboard.writeText(text); toast(label || 'Copied'); }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove();
      toast(ok ? (label || 'Copied') : 'Copy blocked here. Select the text and copy it manually.');
    }
  }
  function toggleSave(kind, id) {
    const arr = state.saved[kind];
    const i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else arr.unshift(id);
    store.set('saved', state.saved);
    toast(i >= 0 ? 'Removed from saved' : 'Saved');
    return i < 0;
  }

  /* ---------------- routing ---------------- */
  const VIEWS = ['home', 'hooks', 'formats', 'craft', 'preflight', 'saved'];
  function route() {
    const h = (location.hash || '').slice(1);
    if (h.startsWith('v-')) {
      if (state.view !== 'home' && !$('#view').innerHTML) render();
      openVideo(h.slice(2));
      return;
    }
    if (h === 'scores') { state.view = 'craft'; state.q = ''; $('#q').value = ''; render(); const el = document.getElementById('scores'); if (el) el.scrollIntoView(); return; }
    const v = VIEWS.includes(h) ? h : 'home';
    closeSheet();
    if (v !== state.view || state.q) { state.view = v; state.q = ''; $('#q').value = ''; render(); window.scrollTo(0, 0); }
  }

  /* ---------------- events ---------------- */
  function bind() {
    document.addEventListener('click', e => {
      const t = e.target.closest('button, [data-open-v], [data-open-f], a[href^="#"]');
      if (!t) return;
      const d = t.dataset;
      if (d.close !== undefined || e.target.closest('[data-close]')) { closeSheet(); return; }
      if (d.openV) { openVideo(d.openV); return; }
      if (d.openF) { openFormat(d.openF); return; }
      if (d.platFilter) { state.plat = d.platFilter; store.set('plat', state.plat); state.platOpen = {}; const y = window.scrollY; render(); window.scrollTo(0, Math.min(y, 400)); return; }
      if (d.niche) { state.niche = d.niche; store.set('niche', state.niche); state.spot = 0; state.platOpen = {}; render(); return; }
      if (d.sort) { state.sort = d.sort; render(); return; }
      if (d.platopen) { state.platOpen[d.platopen] = !state.platOpen[d.platopen]; const y = window.scrollY; render(); window.scrollTo(0, y); return; }
      if (d.htype) { state.hookType = d.htype; state.spot = 0; render(); return; }
      if (d.group) { state.group = d.group; const y = window.scrollY; render(); window.scrollTo(0, y); return; }
      if (d.plat) { state.platform = d.plat; const y = window.scrollY; render(); window.scrollTo(0, y); return; }
      if (d.spin !== undefined) { const n = filteredHooks().length || 1; state.spot = (state.spot + 1 + Math.floor(Math.random() * Math.max(1, n - 1))) % n; render(); return; }
      if (d.copyHook) { const h = state.data.hookById.get(d.copyHook); if (h) copy(h.template, 'Hook copied'); return; }
      if (d.copyText) { copy(d.copyText, 'Copied'); return; }
      if (d.copyBrief) { const v = state.data.videoById.get(d.copyBrief); if (v) copy(brief(v), 'Shoot brief copied'); return; }
      if (d.saveH) { const on = toggleSave('h', d.saveH); t.setAttribute('aria-pressed', on); if (state.view === 'saved' && !on) render(); return; }
      if (d.saveV) { const on = toggleSave('v', d.saveV); t.setAttribute('aria-pressed', on); t.lastChild.textContent = on ? 'Saved' : 'Save'; if (state.view === 'saved') render(); return; }
      if (d.expand !== undefined) { const row = t.closest('.row'); const m = row && $('.hook-more', row); if (m) { m.hidden = !m.hidden; t.setAttribute('aria-expanded', !m.hidden); t.style.transform = m.hidden ? '' : 'rotate(180deg)'; } return; }
      if (d.embed) { const p = $('#player'); if (p) p.innerHTML = '<div class="embed"><iframe src="' + esc(d.embed) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Embedded video"></iframe></div>'; t.remove(); return; }
      if (d.pfReset !== undefined) { state.pf = {}; store.set('preflight', state.pf); render(); return; }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { if (!$('#sheet').hidden) closeSheet(); else if (state.q) { state.q = ''; $('#q').value = ''; render(); } return; }
      if (e.key === '/' && document.activeElement !== $('#q') && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); $('#q').focus(); return; }
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement.matches('[data-open-v],[data-open-f]')) { e.preventDefault(); document.activeElement.click(); }
    });
    document.addEventListener('change', e => {
      const t = e.target;
      if (t.id === 'week') { state.weekId = t.value; state.view = 'home'; state.q = ''; $('#q').value = ''; try { history.replaceState(null, '', '#home'); } catch (e2) { /* ignore */ } render(); window.scrollTo(0, 0); }
      if (t.dataset.pf) { state.pf[t.dataset.pf] = t.checked; store.set('preflight', state.pf); const y = window.scrollY; render(); window.scrollTo(0, y); const el = document.getElementById(t.id); if (el) el.focus(); }
    });
    let qt;
    $('#q').addEventListener('input', e => {
      clearTimeout(qt);
      qt = setTimeout(() => { state.q = e.target.value.trim(); render(); if (state.q) window.scrollTo(0, 0); }, 120);
    });
    window.addEventListener('hashchange', route);
    // pointer-following specular highlight on glass
    let raf = 0, lastEv = null;
    document.addEventListener('pointermove', e => {
      lastEv = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = lastEv.target.closest && lastEv.target.closest('.lit');
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (lastEv.clientX - r.left) + 'px');
        el.style.setProperty('--my', (lastEv.clientY - r.top) + 'px');
      });
    }, { passive: true });
  }

  /* ---------------- boot ---------------- */
  async function boot() {
    try {
      state.data = await load();
    } catch (err) {
      $('#view').innerHTML = '<section class="section">' + empty('Could not load the data', 'Open this page through a web server (GitHub Pages or `python3 -m http.server`), not straight from the file system. Details: ' + err.message) + '</section>';
      return;
    }
    buildIndex(state.data);
    state.spot = Math.floor(Math.random() * 1000);
    state.weekId = state.data.manifest.latest || state.data.manifest.weeks.filter(w => w.kind !== 'collection').map(w => w.id).sort().pop();
    if (state.niche !== 'all' && !NICHE[state.niche]) state.niche = 'all';
    try {
      const brands = navigator.userAgentData && navigator.userAgentData.brands || [];
      if (brands.some(b => /Chromium/.test(b.brand)) && !matchMedia('(prefers-reduced-motion: reduce)').matches) $('.dock').classList.add('lens');
    } catch (e) { /* no lens */ }
    renderWeeks();
    bind();
    const h = (location.hash || '').slice(1);
    state.view = VIEWS.includes(h) ? h : 'home';
    render();
    if (h.startsWith('v-') || h === 'scores') route();
  }
  boot();
})();
