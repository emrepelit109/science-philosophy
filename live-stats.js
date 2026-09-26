(() => {
  'use strict';

  const CONFIG = {
    repo: 'emrepelit109/science-philosophy',
    blog: 'https://emrepelit7337.blogspot.com',
    api: 'https://api.github.com',
    statsUrl: 'https://raw.githubusercontent.com/emrepelit109/science-philosophy/main/stats/latest.json',
    readBaselineUrl: 'https://raw.githubusercontent.com/emrepelit109/science-philosophy/main/stats/read-baseline.json'
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
  function addStyle() {
    if (document.getElementById('sp-live-style')) return;
    const s=document.createElement('style');
    s.id='sp-live-style';
    s.textContent=[
      '#sp-live-root{position:fixed;right:18px;bottom:18px;z-index:2147483647;font-family:system-ui,-apple-system,Segoe UI,sans-serif}',
      '#sp-live-toggle{border:0;border-radius:999px;padding:12px 16px;background:#111827;color:#fff;font-weight:800;box-shadow:0 8px 28px #0005;cursor:pointer;border:1px solid #3b82f6;display:inline-flex;align-items:center;gap:8px}',
      '#sp-live-toggle:hover{filter:brightness(1.08);transform:translateY(-1px)}',
      '#sp-live-dot{width:8px;height:8px;border-radius:50%;background:#28d17c;box-shadow:0 0 0 4px #28d17c22}',
      '#sp-live-panel{display:none;width:min(390px,calc(100vw - 36px));margin-bottom:10px;background:#0f1629;color:#eef2ff;border:1px solid #34446e;border-radius:16px;padding:14px;box-shadow:0 16px 45px #0007}',
      '#sp-live-panel.open{display:block}',
      '#sp-live-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}',
      '#sp-live-status{font-size:.75rem;color:#aeb9d6}',
      '#sp-live-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
      '.sp-live-stat{padding:10px;border:1px solid #263555;border-radius:10px;background:#121b30}',
      '.sp-live-stat small{display:block;color:#aeb9d6;font-size:.74rem}',
      '.sp-live-stat strong{display:block;margin-top:3px;font-size:1rem}',
      '#sp-live-note{margin-top:10px;color:#aeb9d6;font-size:.78rem;line-height:1.45}',
      '#sp-live-refresh{margin-top:10px;width:100%;border:1px solid #34446e;background:#1d2945;color:#dfe8ff;border-radius:10px;padding:9px 12px;font-weight:700;cursor:pointer}',
      '#sp-live-refresh:disabled,#sp-live-toggle:disabled{opacity:.65;cursor:wait}',
      '@media(max-width:560px){#sp-live-root{right:12px;bottom:12px}#sp-live-panel{width:min(360px,calc(100vw - 24px))}}'
    ].join('');
    document.head.appendChild(s);
  }
  function bloggerFeed() {
    return new Promise((resolve,reject)=>{
      const cb='__spBloggerStats_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const s=document.createElement('script');
      const timer=setTimeout(()=>{cleanup();reject(new Error('Blogger feed timeout'));},10000);
      function cleanup(){clearTimeout(timer);delete window[cb];s.remove();}
      window[cb]=p=>{cleanup();resolve(p);};
      s.src=CONFIG.blog+'/feeds/posts/default?alt=json-in-script&max-results=1&callback='+encodeURIComponent(cb);
      s.async=true;
      document.head.appendChild(s);
      s.onerror=()=>{cleanup();reject(new Error('Blogger feed error'));};
    });
  }
  async function json(url){
    const r=await fetch(url,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
    if(!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  }
  async function load(panel,toggle,status,refresh){
    toggle.disabled=true; refresh.disabled=true; status.textContent='Veriler alınıyor…'; panel.classList.add('open');
    try{
      const [repo,blog,cached,baseline]=await Promise.all([
        json(CONFIG.api+'/repos/'+CONFIG.repo),
        bloggerFeed().catch(()=>null),
        json(CONFIG.statsUrl+'?ts='+Date.now()).catch(()=>null),
        json(CONFIG.readBaselineUrl+'?ts='+Date.now()).catch(()=>({}))
      ]);
      const feed=blog?.feed||{};
      const posts=feed['openSearch$totalResults']?.$t ?? '—';
      const latest=Array.isArray(feed.entry)?feed.entry[0]:null;
      const title=latest?.title?.$t || '—';
      const published=latest?.published?.$t || null;
      const t=cached?.traffic||{};
      const baseRaw=baseline?.blogger_net_reads;
      const base=(baseRaw===null || baseRaw===undefined || baseRaw==='') ? null : Number(baseRaw);
      const web=Number(cached?.reads?.web_reads ?? 0);
      const total=(Number.isFinite(base)&&Number.isFinite(web)) ? base+web : null;
      panel.innerHTML=
        '<div id="sp-live-head"><strong>Live Stats</strong><span id="sp-live-status">● CANLI</span></div>'+
        '<div id="sp-live-grid">'+
        '<div class="sp-live-stat"><small>Web okunma</small><strong>'+nf.format(Number.isFinite(web)?web:0)+'</strong></div>'+
        '<div class="sp-live-stat"><small>Net okunma</small><strong>'+ (total===null?'—':nf.format(total)) +'</strong></div>'+
        '<div class="sp-live-stat"><small>GitHub yıldız</small><strong>'+nf.format(repo.stargazers_count??0)+'</strong></div>'+
        '<div class="sp-live-stat"><small>GitHub fork</small><strong>'+nf.format(repo.forks_count??0)+'</strong></div>'+
        '<div class="sp-live-stat"><small>Açık issue</small><strong>'+nf.format(repo.open_issues_count??0)+'</strong></div>'+
        '<div class="sp-live-stat"><small>Watcher</small><strong>'+nf.format(repo.subscribers_count??0)+'</strong></div>'+
        '<div class="sp-live-stat"><small>Blogger makale</small><strong>'+esc(posts)+'</strong></div>'+
        '<div class="sp-live-stat"><small>Dal</small><strong>'+esc(repo.default_branch||'—')+'</strong></div>'+
        '</div>'+
        '<div id="sp-live-note"><strong>Blogger net okunma tabanı:</strong> '+(base===null?'Ayarlanmadı':nf.format(base))+
        '<br><strong>Net okunma:</strong> Blogger net okunma + Science & Philosophy web okunması.'+
        '<br><strong>Son makale:</strong> '+esc(title)+(published?' · '+esc(date(published)):'')+
        '<br><strong>GitHub trafik kaydı:</strong> son kayıtlı 14 günde '+nf.format(t.views_14d??0)+' görüntüleme, '+nf.format(t.unique_views_14d??0)+' benzersiz ziyaret.'+
        '<br><strong>Veri çekme:</strong> '+esc(date(new Date().toISOString()))+
        '</div>';
      status.textContent='● CANLI'; status.style.color='#28d17c';
    }catch(e){
      panel.innerHTML='<div>Canlı istatistikler şu anda alınamadı.</div><div id="sp-live-note">Bağlantıyı kontrol edip Yenile düğmesine basın.</div>';
      status.textContent='● HATA'; status.style.color='#ef6b73';
    }finally{toggle.disabled=false; refresh.disabled=false;}
  }
  function mount(){
    if(document.getElementById('sp-live-root')) return;
    addStyle();
    const root=document.createElement('div');
    root.id='sp-live-root';
    root.innerHTML='<div id="sp-live-panel" aria-live="polite"><div id="sp-live-head"><strong>Science & Philosophy</strong><span id="sp-live-status">Hazır</span></div><div>Güncel istatistikleri görmek için aşağıdaki butona basın.</div><button id="sp-live-refresh" type="button">↻ Yenile</button></div><button id="sp-live-toggle" type="button" aria-expanded="false"><span id="sp-live-dot"></span>Live Stats</button>';
    document.body.appendChild(root);
    const panel=root.querySelector('#sp-live-panel'),toggle=root.querySelector('#sp-live-toggle'),refresh=root.querySelector('#sp-live-refresh'),status=root.querySelector('#sp-live-status');
    const run=()=>load(panel,toggle,status,refresh);
    toggle.addEventListener('click',()=>{if(panel.classList.contains('open')){panel.classList.remove('open');toggle.setAttribute('aria-expanded','false')}else{toggle.setAttribute('aria-expanded','true');run()}});
    refresh.addEventListener('click',run);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
  window.SciencePhilosophyLiveStats={mount};
})();
