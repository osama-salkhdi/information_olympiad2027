/* مكتبة مشتركة: الشبكة، التخزين، الاختبارات، المؤثرات */
(function(){
const CFG = window.CFG || {};
const LET = ['A','B','C','D','E'];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store = {
  get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};

/* ---------- الاختبارات ---------- */
const EXAMS = {};
window.registerExam = e => { EXAMS[e.id] = e; };
function loadExam(id){
  if(EXAMS[id]) return Promise.resolve(EXAMS[id]);
  const m = (window.EXAMS_MANIFEST||[]).find(x => x.id === id);
  if(!m) return Promise.reject(new Error('اختبار غير معروف'));
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = m.file; s.onload = () => EXAMS[id] ? res(EXAMS[id]) : rej(new Error('ملف الاختبار لا يسجّل نفسه'));
    s.onerror = () => rej(new Error('تعذّر تحميل ملف الاختبار'));
    document.head.appendChild(s);
  });
}
const examMeta = id => (window.EXAMS_MANIFEST||[]).find(x => x.id === id) || {id, title:id, count:0};

/* ---------- الترتيب: العلامة الأعلى ثم الزمن الأقل ---------- */
function rankInfo(rows, row){
  const same = rows.filter(r => r.exam === row.exam);
  const better = same.filter(r => r.score > row.score || (r.score === row.score && r.seconds < row.seconds)).length;
  return { rank: better + 1, total: same.length };
}

/* ---------- الشبكة (مع وضع محلي للتجربة بدون خادم) ---------- */
const live = () => !!CFG.SCRIPT_URL;
const localRows = () => store.get('oly_local_rows') || [];
async function g(p){ const r = await fetch(CFG.SCRIPT_URL + '?' + new URLSearchParams(p)); return r.json(); }
async function p(b){ const r = await fetch(CFG.SCRIPT_URL, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(b)}); return r.json(); }
const Net = {
  live,
  async check(exam, reg){
    if(live()) return g({action:'check', exam, reg});
    return {ok:true, exists: localRows().some(r => r.exam === exam && r.reg === reg)};
  },
  async student(reg){
    if(live()) return g({action:'student', reg});
    const all = localRows();
    return {ok:true, results: all.filter(r => r.reg === reg).map(r => ({...r, ...rankInfo(all, r)}))};
  },
  async submit(d){
    if(live()) return p(d);
    const all = localRows();
    if(all.some(r => r.exam === d.exam && r.reg === d.reg)) return {ok:false, error:'dup'};
    const ex = await loadExam(d.exam);
    const score = ex.questions.reduce((t,q,i) => t + (d.answers[i] === LET[q.a] ? 1 : 0), 0);
    const row = {time:new Date().toISOString(), exam:d.exam, reg:d.reg, name:d.name, score, seconds:d.seconds, answers:d.answers};
    all.push(row); store.set('oly_local_rows', all);
    return {ok:true, score, ...rankInfo(all, row)};
  },
  async all(key){
    if(live()) return g({action:'all', key});
    return {ok:true, rows: localRows()};
  }
};

/* ---------- الترويسة ---------- */
function brandHTML(){
  return `<header class="brand"><div class="brand-in">
    <img class="logo" src="assets/logo.png" alt="شعار الأولمبياد العلمي السوري">
    <div class="office">${esc(CFG.OFFICE)}</div>
    <div class="eng">${esc(CFG.ENGINEER)}</div></div><div class="stripe"></div></header>`;
}

/* ---------- الألعاب النارية ---------- */
let cv, cx, parts = [], raf = 0;
function initFW(){
  cv = document.getElementById('fw'); if(!cv) return; cx = cv.getContext('2d');
  const fit = () => { cv.width = innerWidth; cv.height = innerHeight; }; fit(); addEventListener('resize', fit);
}
function burst(x, y, n=70){
  if(!cv) return;
  const h = Math.random()*360;
  for(let i=0;i<n;i++){ const a=Math.random()*6.283, v=2+Math.random()*5; parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,h:h+Math.random()*40}); }
  if(!raf) loop();
}
function loop(){
  cx.clearRect(0,0,cv.width,cv.height); parts = parts.filter(q => q.life > 0);
  for(const q of parts){ q.x+=q.vx; q.y+=q.vy; q.vy+=.06; q.vx*=.985; q.life-=.014; cx.globalAlpha=Math.max(q.life,0); cx.fillStyle=`hsl(${q.h},95%,60%)`; cx.beginPath(); cx.arc(q.x,q.y,2.6,0,6.283); cx.fill(); }
  cx.globalAlpha = 1; raf = parts.length ? requestAnimationFrame(loop) : 0; if(!raf) cx.clearRect(0,0,cv.width,cv.height);
}
function celebrate(times=3){ for(let i=0;i<times;i++) setTimeout(() => burst(innerWidth*(.2+Math.random()*.6), innerHeight*(.15+Math.random()*.35)), i*260); }

/* ---------- تأثير الموجة على الأزرار ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b || b.disabled) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
  const s = document.createElement('span'); s.className = 'ripple';
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;
  b.appendChild(s); setTimeout(() => s.remove(), 600);
});

const fmtTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
window.OLY = {CFG, LET, esc, store, Net, loadExam, examMeta, rankInfo, brandHTML, initFW, burst, celebrate, fmtTime};
})();
