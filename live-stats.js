(() => {
  'use strict';
  const CONFIG = {
    repo: 'emrepelit109/science-philosophy',
    blog: 'https://emrepelit7337.blogspot.com',
    api: 'https://api.github.com',
    statsUrl: 'https://raw.githubusercontent.com/emrepelit109/science-philosophy/main/stats/latest.json'
  };
  const nf = new Intl.NumberFormat('tr-TR');

  function esc(value) {
    return String(value ?? '—').replace(/[&<>"']/g, ch => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[ch]));
  }

  function date(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) :
      d.toLocaleString('tr-TR', {dateStyle:'medium', timeStyle:'short'});
  }

  function makeStyles(root) {
    if (root.querySelector('.sp-live-style')) return;
    const style = document.createElement('style');
    style.className = 'sp-live-style';
    style.textContent = [
      '.sp-live-wrap{margin:20px 0;font-family:inherit}',
      '.sp-live-card{border:1px solid #2a3659;border-radius:16px;padding:18px;background:#151c32;color:#eef2ff;box-sizing:border-box}',
      '.sp-live-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}',
      '.sp-live-title h3{margin:0;font-size:1.15rem}',
      '.sp-live-badge{display:inline-flex;align-items:center;gap:7px;font-size:.78rem;padding:6px 9px;border:1px solid #34446e;border-radius:999px;color:#aeb9d6;white-space:nowrap}',
      '.sp-live-dot{width:8px;height:8px;border-radius:50%;background:#28d17c;box-shadow:0 0 0 4px #28d17c22}',
      '.sp-live-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}',
      '.sp-live-btn{border:0;border-radius:11px;padding:11px 15px;font-weight:800;cursor:pointer;background:#e8efff;color:#10172b}',
      '.sp-live-btn.secondary{background:#1d2945;color:#dfe8ff;border:1px solid #34446e}',
      '.sp-live-btn:disabled{opacity:.7;cursor:wait}',
      '.sp-live-panel{margin-top:14px;padding:14px;border:1px solid #34446e;border-radius:13px;background:#0f1629}',
      '.sp-live-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}',
      '.sp-live-stat{padding:11px;border:1px solid #263555;border-radius:10px;background:#121b30}',
      '.sp-live-stat small{display:block;color:#aeb9d6;font-size:.78rem}',
      '.sp-live-stat strong{display:block;margin-top:3px;font-size:1.05rem}',
      '.sp-live-note{margin-top:11px;color:#aeb9d6;font-size:.82rem;line-height:1.45}',
      '.sp-live-note a{color:#9cc5ff}',
      '@media(max-width:560px){.sp-live-title{align-items:flex-start;flex-direction:column}.sp-live-grid{grid-template-columns:1fr}}'
    ].join('');
    root.appendChild(style);
  }

  function publicBlogJsonp() {
    return new Promise((resolve, reject) => {
      const callback = '__spBloggerStats_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Blogger feed timeout'));
      }, 10000);

      function cleanup() {
        clearTimeout(timer);
        delete window[callback];
        script.remove();
      }

      window[callback] = payload => {
        cleanup();
        resolve(payload);
      };

      script.src = CONFIG.blog + '/feeds/posts/default?alt=json-in-script&max-results=1&callback=' + encodeURIComponent(callback);
      script.async = true;
      script.onerror = () => {
        cleanup();
        reject(new Error('Blogger feed error'));
      };
      document.head.appendChild(script);
    });
  }

  async function json(url) {
    const r = await fetch(url, {
      cache: 'no-store',
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  async function loadLive(panel, button, badge) {
    button.disabled = true;
    const secondary = button.parentElement.querySelector('[data-sp-refresh]');
    if (secondary) secondary.disabled = true;
    badge.innerHTML = '<span class="sp-live-dot" style="background:#f4c95d;box-shadow:0 0 0 4px #f4c95d22"></span>Yükleniyor…';
    panel.hidden = false;
    panel.innerHTML = '<div>Canlı veriler alınıyor…</div>';

    try {
      const [repo, blogResult, cached] = await Promise.all([
        json(CONFIG.api + '/repos/' + CONFIG.repo),
        publicBlogJsonp().catch(() => null),
        json(CONFIG.statsUrl + '?ts=' + Date.now()).catch(() => null)
      ]);

      const feed = blogResult?.feed || {};
      const totalPosts = feed['openSearch$totalResults']?.$t ?? '—';
      const entry = Array.isArray(feed.entry) ? feed.entry[0] : null;
      const latestTitle = entry?.title?.$t || '—';
      const latestPublished = entry?.published?.$t || null;
      const traffic = cached?.traffic || {};

      panel.innerHTML =
        '<div class="sp-live-grid">' +
          '<div class="sp-live-stat"><small>GitHub yıldız</small><strong>' + nf.format(repo.stargazers_count ?? 0) + '</strong></div>' +
          '<div class="sp-live-stat"><small>GitHub fork</small><strong>' + nf.format(repo.forks_count ?? 0) + '</strong></div>' +
          '<div class="sp-live-stat"><small>Açık issue</small><strong>' + nf.format(repo.open_issues_count ?? 0) + '</strong></div>' +
          '<div class="sp-live-stat"><small>Watcher</small><strong>' + nf.format(repo.subscribers_count ?? 0) + '</strong></div>' +
          '<div class="sp-live-stat"><small>Blogger makale sayısı</small><strong>' + esc(totalPosts) + '</strong></div>' +
          '<div class="sp-live-stat"><small>Varsayılan dal</small><strong>' + esc(repo.default_branch || '—') + '</strong></div>' +
        '</div>' +
        '<div class="sp-live-note"><strong>Son makale:</strong> ' + esc(latestTitle) +
          (latestPublished ? ' · ' + esc(date(latestPublished)) : '') + '</div>' +
        '<div class="sp-live-note"><strong>GitHub trafik kaydı:</strong> son kayıtlı 14 günde ' +
          nf.format(traffic.views_14d ?? 0) + ' görüntüleme ve ' +
          nf.format(traffic.unique_views_14d ?? 0) + ' benzersiz ziyaret. ' +
          'Bu bölüm GitHub’ın periyodik trafik kaydından gelir; tıklama anındaki trafik sayacı değildir.</div>' +
        '<div class="sp-live-note"><strong>Veri çekme zamanı:</strong> ' + esc(date(new Date().toISOString())) + '</div>';

      badge.innerHTML = '<span class="sp-live-dot"></span>CANLI';
    } catch (err) {
      panel.innerHTML =
        '<div>Canlı istatistikler şu anda alınamadı.</div>' +
        '<div class="sp-live-note">Bağlantıyı kontrol edip Yenile düğmesine tekrar basın.</div>';
      badge.innerHTML = '<span class="sp-live-dot" style="background:#ef6b73;box-shadow:0 0 0 4px #ef6b7322"></span>Hata';
    } finally {
      button.disabled = false;
      if (secondary) secondary.disabled = false;
    }
  }

  function mount(target) {
    const root = typeof target === 'string' ? document.querySelector(target) : target;
    if (!root || root.dataset.spLiveMounted === '1') return;
    root.dataset.spLiveMounted = '1';
    makeStyles(root);

    root.innerHTML +=
      '<div class="sp-live-wrap">' +
        '<div class="sp-live-card">' +
          '<div class="sp-live-title">' +
            '<h3>Live Stats</h3>' +
            '<span class="sp-live-badge" data-sp-badge><span class="sp-live-dot"></span>Hazır</span>' +
          '</div>' +
          '<div>İstediğiniz anda güncel site/repository ve Blogger içerik istatistiklerini görüntüleyin.</div>' +
          '<div class="sp-live-actions">' +
            '<button class="sp-live-btn" type="button" data-sp-live>Live Stats’ı Göster</button>' +
            '<button class="sp-live-btn secondary" type="button" data-sp-refresh hidden>↻ Yenile</button>' +
          '</div>' +
          '<div class="sp-live-panel" data-sp-panel hidden aria-live="polite"></div>' +
        '</div>' +
      '</div>';

    const button = root.querySelector('[data-sp-live]');
    const refresh = root.querySelector('[data-sp-refresh]');
    const panel = root.querySelector('[data-sp-panel]');
    const badge = root.querySelector('[data-sp-badge]');

    button.addEventListener('click', () => {
      refresh.hidden = false;
      loadLive(panel, button, badge);
    });
    refresh.addEventListener('click', () => loadLive(panel, button, badge));
  }

  window.SciencePhilosophyLiveStats = { mount };
})();