(() => {
  const KEY = 'science-philosophy-blogger-new-post-reads-2026-09-30-b4e71c';
  const API = 'https://countapi.mileshilliard.com/api/v1/hit/';
  const MIN_SECONDS = 10;
  const path = location.pathname || '/';
  if (!/\/\d{4}\/\d{2}\//.test(path)) return;
  const day = new Date().toISOString().slice(0,10);
  const storageKey = 'sp-blogger-read:' + day + ':' + path;
  try { if (localStorage.getItem(storageKey) === '1') return; } catch(e) {}
  let started = Date.now();
  let accumulated = 0;
  let counted = false;

  const mark = () => {
    if (counted || document.hidden || accumulated + (Date.now()-started) < MIN_SECONDS*1000) return;
    counted = true;
    fetch(API + encodeURIComponent(KEY), {cache:'no-store'})
      .then(() => { try { localStorage.setItem(storageKey,'1'); } catch(e) {} })
      .catch(() => { counted=false; });
  };

  let timer = setTimeout(mark, MIN_SECONDS*1000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      accumulated += Date.now()-started;
      clearTimeout(timer);
    } else {
      started = Date.now();
      const remaining = Math.max(0, MIN_SECONDS*1000-accumulated);
      timer = setTimeout(mark, remaining);
    }
  }, {passive:true});
})();
