/* لوحة التحكم: فلترة حسب الاختبار والطالب، ملف كامل لكل طالب، إحصاءات الأسئلة */
(function(){
const {LET, esc, store, Net, loadExam, examMeta, rankInfo, brandHTML, fmtTime} = OLY;
document.getElementById('brand').innerHTML = brandHTML();
const $app = document.getElementById('app');
const MAN = window.EXAMS_MANIFEST || [];
let ALL = [], KEY = sessionStorage.getItem('oly_admin_key') || '';
const fdate = t => { const d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString('ar-SY') + ' ' + d.toLocaleTimeString('ar-SY',{hour:'2-digit',minute:'2-digit'}); };
const pct = (s, id) => { const n = examMeta(id).count || 1; return Math.round(s / n * 100); };

/* ---------- الدخول ---------- */
function login(err=''){
  $app.innerHTML = `<div class="card" style="max-width:460px;margin:auto"><h1>🔐 لوحة التحكم</h1>
  <label>كلمة السر</label><input id="pw" type="password" autocomplete="current-password">
  ${err ? `<div class="msg bad">${err}</div>` : ''}<button class="pulse" id="ok">دخول</button></div>`;
  const go = () => { KEY = document.getElementById('pw').value; load(); };
  document.getElementById('ok').onclick = go;
  document.getElementById('pw').onkeydown = e => { if(e.key === 'Enter') go(); };
}
async function load(){
  $app.innerHTML = '<div class="card"><div class="skel"></div></div>';
  let r; try{ r = await Net.all(KEY); }catch(e){ return login('تعذّر الاتصال بالخادم.'); }
  if(!r.ok) return login('كلمة السر غير صحيحة.');
  sessionStorage.setItem('oly_admin_key', KEY);
  ALL = (r.rows || []).map(x => ({...x, reg:String(x.reg), score:Number(x.score), seconds:Number(x.seconds), answers:String(x.answers || '')}));
  ALL.forEach(x => Object.assign(x, rankInfo(ALL, x)));
  shell();
}

/* ---------- الهيكل ---------- */
function shell(){
  $app.innerHTML = `<div class="card"><div class="top"><h2>لوحة المتابعة</h2><div class="chips">
      <button class="sm" id="rf">🔄 تحديث</button><button class="sec sm" id="csv">⬇ تحميل CSV</button><button class="sec sm" id="cp">📋 نسخ أفضل 10</button><button class="red sm" id="lo">خروج</button></div></div>
    <div class="filters" style="margin-top:12px">
      <div><label>الاختبار</label><select id="fx"><option value="">كل الاختبارات</option>${MAN.map(m => `<option value="${m.id}">${esc(m.title)}</option>`).join('')}</select></div>
      <div><label>بحث بالاسم أو رقم الاكتتاب</label><input id="fq" placeholder="مثال: 10234 أو أحمد" autocomplete="off"></div>
      <div><button class="sec" id="clr">مسح الفلتر</button></div></div></div>
    <div id="kp"></div><div id="prof"></div><div id="exs"></div><div id="tbl"></div>`;
  document.getElementById('fx').onchange = view;
  document.getElementById('fq').oninput = view;
  document.getElementById('clr').onclick = () => { document.getElementById('fx').value = ''; document.getElementById('fq').value = ''; view(); };
  document.getElementById('rf').onclick = load;
  document.getElementById('lo').onclick = () => { sessionStorage.removeItem('oly_admin_key'); KEY = ''; login(); };
  document.getElementById('csv').onclick = () => exportCSV(current());
  document.getElementById('cp').onclick = copyTop;
  view();
}
function current(){
  const ex = document.getElementById('fx').value, q = document.getElementById('fq').value.trim().toLowerCase();
  let rows = ALL.filter(r => (!ex || r.exam === ex) && (!q || r.name.toLowerCase().includes(q) || r.reg.includes(q)));
  const order = id => MAN.findIndex(m => m.id === id);
  rows.sort((a,b) => ex ? a.rank - b.rank : order(a.exam) - order(b.exam) || a.rank - b.rank);
  return rows;
}

function view(){
  const ex = document.getElementById('fx').value, q = document.getElementById('fq').value.trim();
  const rows = current();
  const regs = [...new Set(rows.map(r => r.reg))];
  const avg = rows.length ? Math.round(rows.reduce((t,r) => t + pct(r.score, r.exam), 0) / rows.length) : 0;
  const best = rows.length ? Math.max(...rows.map(r => pct(r.score, r.exam))) : 0;
  document.getElementById('kp').innerHTML = `<div class="kpis"><div class="kpi"><b>${regs.length}</b><span>طالب</span></div><div class="kpi"><b>${rows.length}</b><span>محاولة</span></div>
    <div class="kpi"><b>${rows.length ? avg + '%' : '—'}</b><span>متوسط النسبة</span></div><div class="kpi"><b>${rows.length ? best + '%' : '—'}</b><span>أعلى نسبة</span></div></div>`;
  // ملف الطالب الكامل عند تحديد طالب واحد
  const profEl = document.getElementById('prof');
  if(q && regs.length === 1) studentProfile(regs[0], profEl); else profEl.innerHTML = '';
  // إحصاءات الاختبار المحدد
  const exEl = document.getElementById('exs');
  if(ex) examStats(ex, exEl); else exEl.innerHTML = '';
  // الجدول
  const body = rows.map(r => `<tr class="${ex && r.rank <= 3 ? 'top3' : ''}" data-reg="${esc(r.reg)}"><td>${r.rank} / ${r.total}</td><td>${esc(r.name)}</td><td>${esc(r.reg)}</td>
    <td>${esc(examMeta(r.exam).title)}</td><td><b>${r.score}</b> / ${examMeta(r.exam).count} (${pct(r.score, r.exam)}%)</td><td>${fmtTime(r.seconds)}</td><td>${fdate(r.time)}</td></tr>`).join('');
  document.getElementById('tbl').innerHTML = `<div class="card"><h2>النتائج ${ex ? '— ' + esc(examMeta(ex).title) : ''} <span class="muted">(${rows.length})</span></h2>
    ${rows.length ? `<div class="scroll"><table class="t"><thead><tr><th>الترتيب</th><th>الاسم</th><th>رقم الاكتتاب</th><th>الاختبار</th><th>العلامة</th><th>الزمن</th><th>التاريخ</th></tr></thead><tbody>${body}</tbody></table></div>
    <p class="muted">اضغط على أي صف لعرض الملف الكامل للطالب.</p>` : '<p class="muted">لا توجد نتائج مطابقة.</p>'}</div>`;
  document.querySelectorAll('#tbl tbody tr').forEach(tr => tr.onclick = () => {
    document.getElementById('fq').value = tr.dataset.reg; view(); scrollTo({top:0, behavior:'smooth'});
  });
}

/* ---------- ملف الطالب الكامل ---------- */
async function studentProfile(reg, el){
  const mine = ALL.filter(r => r.reg === reg);
  const name = mine[0].name;
  const done = new Set(mine.map(r => r.exam));
  const avg = Math.round(mine.reduce((t,r) => t + pct(r.score, r.exam), 0) / mine.length);
  const secs = mine.reduce((t,r) => t + r.seconds, 0);
  const lines = mine.slice().sort((a,b) => MAN.findIndex(m => m.id === a.exam) - MAN.findIndex(m => m.id === b.exam)).map(r => {
    const p = pct(r.score, r.exam);
    return `<tr style="cursor:default"><td>${esc(examMeta(r.exam).title)}</td><td><b>${r.score}</b> / ${examMeta(r.exam).count}</td>
      <td><div class="hbar"><i style="width:${p}%;background:${p >= 70 ? 'var(--green)' : p >= 50 ? 'var(--amber)' : 'var(--red)'}"></i></div>${p}%</td>
      <td>${r.rank} من ${r.total}</td><td>${fmtTime(r.seconds)}</td><td>${fdate(r.time)}</td><td><div class="rv" id="rv_${r.exam}"></div></td></tr>`;
  }).join('');
  const missing = MAN.filter(m => !done.has(m.id)).map(m => `<span class="badge">${esc(m.title)}</span>`).join(' ');
  el.innerHTML = `<div class="card prof"><div class="ph"><div><h2>👤 ${esc(name)}</h2><div class="muted">رقم الاكتتاب: ${esc(reg)}</div></div>
    <div class="chips"><span class="badge g">${mine.length} من ${MAN.length} اختبارات</span><span class="badge a">المتوسط ${avg}%</span><span class="badge">إجمالي الزمن ${fmtTime(secs)}</span></div></div>
    <div class="scroll" style="margin-top:12px"><table class="t"><thead><tr><th>الاختبار</th><th>العلامة</th><th>النسبة</th><th>الترتيب بين المقدّمين</th><th>الزمن</th><th>التاريخ</th><th>إجاباته (أخضر صحيح / أحمر خطأ)</th></tr></thead><tbody>${lines}</tbody></table></div>
    ${missing ? `<p class="muted" style="margin-bottom:0">لم يقدّم بعد: ${missing}</p>` : ''}</div>`;
  for(const r of mine){                         // تلوين إجاباته (يحتاج مفتاح الاختبار من ملفه)
    try{
      const E = await loadExam(r.exam); const box = document.getElementById('rv_' + r.exam); if(!box) continue;
      box.innerHTML = E.questions.map((Q,i) => { const c = r.answers[i]; const k = c ? LET.indexOf(c) : -1;
        return `<span class="${k < 0 ? 'n' : k === Q.a ? 'g' : 'r'}" title="س${i+1}${k >= 0 ? ' — ' + c : ''}" style="width:26px;height:26px;font-size:.72rem;cursor:default">${i+1}</span>`; }).join('');
    }catch(e){}
  }
}

/* ---------- إحصاءات اختبار (نسبة الصحة لكل سؤال) ---------- */
async function examStats(id, el){
  const rows = ALL.filter(r => r.exam === id);
  el.innerHTML = '<div class="card"><div class="skel" style="height:80px"></div></div>';
  let E; try{ E = await loadExam(id); }catch(e){ el.innerHTML = ''; return; }
  if(document.getElementById('fx').value !== id) return;
  if(!rows.length){ el.innerHTML = ''; return; }
  const sc = rows.map(r => r.score).sort((a,b) => a - b), n = sc.length;
  const med = n % 2 ? sc[(n-1)/2] : (sc[n/2-1] + sc[n/2]) / 2;
  const stats = E.questions.map((Q,i) => { const t = rows.filter(r => r.answers[i] === LET[Q.a]).length; return Math.round(t / n * 100); });
  el.innerHTML = `<div class="card"><h2>📊 إحصاءات ${esc(E.title)}</h2>
    <div class="chips"><span class="badge g">أعلى علامة ${sc[n-1]}</span><span class="badge r">أدنى علامة ${sc[0]}</span><span class="badge a">الوسيط ${med}</span></div>
    <p class="muted" style="margin:10px 0 0">نسبة الإجابة الصحيحة لكل سؤال (الأحمر = الأصعب):</p>
    <div class="qgrid">${stats.map((p,i) => `<div class="qs ${p >= 70 ? 'hi' : p >= 40 ? 'mid' : 'lo'}">س${i+1}<b>${p}%</b></div>`).join('')}</div></div>`;
}

/* ---------- التصدير والنسخ ---------- */
function exportCSV(rows){
  const head = ['الترتيب','عدد المقدّمين','الاسم','رقم الاكتتاب','الاختبار','العلامة','من','الزمن بالثواني','التاريخ'];
  const c = '\ufeff' + [head.join(',')].concat(rows.map(r => [r.rank, r.total, '"' + r.name.replace(/"/g,'""') + '"', r.reg, '"' + examMeta(r.exam).title + '"', r.score, examMeta(r.exam).count, r.seconds, r.time].join(','))).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([c], {type:'text/csv'})); a.download = 'results.csv'; a.click();
}
function copyTop(){
  const ex = document.getElementById('fx').value;
  if(!ex) return alert('اختر اختباراً محدداً أولاً لنسخ ترتيبه.');
  const rows = ALL.filter(r => r.exam === ex).sort((a,b) => a.rank - b.rank).slice(0,10);
  const txt = '🏆 أفضل النتائج — ' + examMeta(ex).title + '\n' + rows.map((r,i) => `${['🥇','🥈','🥉'][i] || (i+1) + '.'} ${r.name} — ${r.score}/${examMeta(ex).count}`).join('\n');
  navigator.clipboard.writeText(txt).then(() => alert('تم النسخ، الصقه في مجموعة الطلاب'));
}

KEY ? load() : login();
})();
