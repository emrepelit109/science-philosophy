(() => {
  'use strict';

  const CONFIG = {
    repo: 'emrepelit109/science-philosophy',
    blog: 'https://emrepelit7337.blogspot.com',
    api: 'https://api.github.com',
    statsUrl: 'https://raw.githubusercontent.com/emrepelit109/science-philosophy/main/stats/latest.json',
    readBaselineUrl: 'https://raw.githubusercontent.com/emrepelit109/science-philosophy/main/stats/read-baseline.json',
    counterBase: 'https://countapi.mileshilliard.com/api/v1',
    counters: {
      sourceNet: 'science-philosophy-grokme-web-reads-2026-09-26-7c2f9a',
      sourceViews: 'science-philosophy-grokme-page-views-2026-09-26-8e4d1c',
      pagesNet: 'science-philosophy-github-pages-web-reads-2026-09-26-41a6d2',
      pagesViews: 'science-philosophy-github-pages-page-views-2026-09-26-5b7a2e'
    },
    minimumReadSeconds: 10,
    perPagePerDay: true
  };

  const nf = new Intl.NumberFormat('tr-TR');

  function esc(v) {
    return String(v ?? '—').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  async function json(url) {
    const r = await fetch(url, {cache:'no-store'});
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  function trackedHost() {
    const h = window.location.hostname;
    if (h === 'science-philosophy.grok.me' || h === 'www.science-philosophy.grok.me') {
      return 'source';
    }
    if (h === 'emrepelit109.github.io') return 'pages';
    return null;
  }

  function counterKey(kind) {
    const host = trackedHost();
    if (!host) return null;
    return CONFIG.counters[host + (kind === 'views' ? 'Views' : 'Net')];
  }

  function storageKey() {
    const day = new Date().toISOString().slice(0,10);
    return 'sp:netread:' + day + ':' + (location.pathname || '/');
  }

  function alreadyRead() {
    if (!CONFIG.perPagePerDay) return false;
    try { return localStorage.getItem(storageKey()) === '1'; } catch(e) { return false; }
  }

  function markRead() {
    try { localStorage.setItem(storageKey(), '1'); } catch(e) {}
  }

  async function hit(kind) {
    const key = counterKey(kind);
    if (!key) return null;
    const result = await json(CONFIG.counterBase + '/hit/' + encodeURIComponent(key));
    const value = Number(result.value);
    return Number.isFinite(value) ? value : null;
  }

  async function getCounter(key) {
    try {
      const result = await json(CONFIG.counterBase + '/get/' + encodeURIComponent(key));
      const value = Number(result.value);
      return Number.isFinite(value) ? value : 0;
    } catch(e) {
      return null;
    }
  }

  function initTracking() {
    if (window.__spTrackingStarted || !trackedHost()) return;
    window.__spTrackingStarted = true;

    // Every opened website page increments the page-view counter immediately.
    hit('views').catch(() => {});

    // A net read requires at least 10 seconds of visible time.
    if (alreadyRead()) return;

    let visibleStarted = Date.now();
    let accumulated = 0;
    let timer = null;
    let counted = false;

    function countNet() {
      if (counted || alreadyRead() || document.hidden) return;
      counted = true;
      hit('net').then(markRead).catch(() => { counted = false; });
    }

    function schedule() {
      if (timer) clearTimeout(timer);
      const remaining = Math.max(0, CONFIG.minimumReadSeconds * 1000 - accumulated);
      timer = setTimeout(countNet, remaining);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        accumulated += Date.now() - visibleStarted;
        if (timer) { clearTimeout(timer); timer = null; }
      } else {
        visibleStarted = Date.now();
        if (accumulated >= CONFIG.minimumReadSeconds * 1000) countNet();
        else schedule();
      }
    }, {passive:true});

    schedule();
  }

  function addStyle() {
    if (document.getElementById('sp-live-style')) return;
    const s = document.createElement('style');
    s.id = 'sp-live-style';
    s.textContent =
      '#sp-live-root{position:fixed;right:18px;bottom:18px;z-index:2147483647;font-family:system-ui,-apple-system,Segoe UI,sans-serif}' +
      '#sp-live-toggle{border:0;border-radius:999px;padding:12px 16px;background:#111827;color:#fff;font-weight:800;box-shadow:0 8px 28px #0005;cursor:pointer;border:1px solid #3b82f6;display:inline-flex;align-items:center;gap:8px}' +
      '#sp-live-dot{width:8px;height:8px;border-radius:50%;background:#28d17c;box-shadow:0 0 0 4px #28d17c22}' +
      '#sp-live-panel{display:none;width:min(420px,calc(100vw - 36px));margin-bottom:10px;background:#0f1629;color:#eef2ff;border:1px solid #34446e;border-radius:16px;padding:14px;box-shadow:0 16px 45px #0007}' +
      '#sp-live-panel.open{display:block}' +
      '#sp-live-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}' +
      '.sp-live-stat{padding:10px;border:1px solid #263555;border-radius:10px;background:#121b30}' +
      '.sp-live-stat small{display:block;color:#aeb9d6;font-size:.74rem}' +
      '.sp-live-stat strong{display:block;margin-top:3px;font-size:1rem}' +
      '#sp-live-note{margin-top:10px;color:#aeb9d6;font-size:.78rem;line-height:1.45}' +
      '#sp-live-refresh{margin-top:10px;width:100%;border:1px solid #34446e;background:#1d2945;color:#dfe8ff;border-radius:10px;padding:9px 12px;font-weight:700;cursor:pointer}' +
      '@media(max-width:560px){#sp-live-root{right:12px;bottom:12px}#sp-live-panel{width:min(380px,calc(100vw - 24px))}}';
    document.head.appendChild(s);
  }

  async function load(panel, status, refresh) {
    refresh.disabled = true;
    status.textContent = 'Veriler alınıyor…';
    try {
      const c = CONFIG.counters;
      const [repo, stats, baseline, sourceNet, sourceViews, pagesNet, pagesViews] = await Promise.all([
        json(CONFIG.api + '/repos/' + CONFIG.repo),
        json(CONFIG.statsUrl + '?ts=' + Date.now()).catch(() => null),
        json(CONFIG.readBaselineUrl + '?ts=' + Date.now()).catch(() => ({})),
        getCounter(c.sourceNet), getCounter(c.sourceViews),
        getCounter(c.pagesNet), getCounter(c.pagesViews)
      ]);

      const sn = sourceNet ?? Number(stats?.reads?.source_web_reads ?? 0);
      const sv = sourceViews ?? Number(stats?.reads?.source_page_views ?? 0);
      const pn = pagesNet ?? Number(stats?.reads?.pages_web_reads ?? 0);
      const pv = pagesViews ?? Number(stats?.reads?.pages_page_views ?? 0);
      const webNet = Number(baseline?.website_net_read_baseline ?? baseline?.authoritative_net_reads ?? 0) + sn +
        Number(baseline?.github_pages_net_read_baseline ?? 0) + pn;
      const totalViews = Number(baseline?.website_page_views_baseline ?? 0) + sv +
        Number(baseline?.github_pages_page_views_baseline ?? 0) + pv;
      const net = Number(stats?.reads?.net_reads ?? baseline?.authoritative_net_reads ?? 0) + sn + pn;

      panel.innerHTML =
        '<strong>Science & Philosophy — Live Stats</strong>' +
        '<div id="sp-live-grid">' +
        '<div class="sp-live-stat"><small>Website görüntüleme</small><strong>' + nf.format(Number(baseline?.website_page_views_baseline ?? 0) + sv) + '</strong></div>' +
        '<div class="sp-live-stat"><small>GitHub Pages görüntüleme</small><strong>' + nf.format(Number(baseline?.github_pages_page_views_baseline ?? 0) + pv) + '</strong></div>' +
        '<div class="sp-live-stat"><small>Toplam görüntüleme</small><strong>' + nf.format(totalViews) + '</strong></div>' +
        '<div class="sp-live-stat"><small>Website net okunma</small><strong>' + nf.format(Number(baseline?.website_net_read_baseline ?? baseline?.authoritative_net_reads ?? 0) + sn) + '</strong></div>' +
        '<div class="sp-live-stat"><small>GitHub Pages net okunma</small><strong>' + nf.format(Number(baseline?.github_pages_net_read_baseline ?? 0) + pn) + '</strong></div>' +
        '<div class="sp-live-stat"><small>Birleşik web net okunma</small><strong>' + nf.format(webNet) + '</strong></div>' +
        '<div class="sp-live-stat"><small>Senkronize net okunma</small><strong>' + (Number.isFinite(net) ? nf.format(net) : '—') + '</strong></div>' +
        '<div class="sp-live-stat"><small>GitHub yıldız</small><strong>' + nf.format(repo.stargazers_count ?? 0) + '</strong></div>' +
        '</div>' +
        '<div id="sp-live-note">' +
        '<strong>Görüntüleme:</strong> 41.198 başlangıç değerinin üzerine her yeni sayfa açılışında +1.<br>' +
        '<strong>Net okunma:</strong> Sayfa en az 10 saniye görünür kaldığında +1. Aynı sayfa/tarayıcı için günde en fazla 1 net okuma.<br>' +
        '<strong>Otomatik senkron:</strong> 5 dakika aralıkla.' +
        '</div>';

      status.textContent = '● CANLI';
      status.style.color = '#28d17c';
    } catch(e) {
      panel.innerHTML = '<div>Canlı istatistikler şu anda alınamadı.</div>';
      status.textContent = '● HATA';
      status.style.color = '#ef6b73';
    } finally {
      refresh.disabled = false;
    }
  }

  function mount() {
    if (document.getElementById('sp-live-root')) return;
    addStyle();
    initTracking();

    const root = document.createElement('div');
    root.id = 'sp-live-root';
    root.innerHTML =
      '<div id="sp-live-panel">' +
      '<div id="sp-live-status">Hazır</div>' +
      '<button id="sp-live-refresh" type="button">↻ Yenile</button>' +
      '</div>' +
      '<button id="sp-live-toggle" type="button" aria-expanded="false"><span id="sp-live-dot"></span>Live Stats</button>';

    document.body.appendChild(root);
    const panel = root.querySelector('#sp-live-panel');
    const toggle = root.querySelector('#sp-live-toggle');
    const refresh = root.querySelector('#sp-live-refresh');
    const status = root.querySelector('#sp-live-status');

    toggle.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      if (open) load(panel, status, refresh);
    });
    refresh.addEventListener('click', () => load(panel, status, refresh));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, {once:true});
  } else {
    mount();
  }

  window.SciencePhilosophyLiveStats = {mount};
})();