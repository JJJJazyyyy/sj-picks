'use strict';
// 주목 종목 BEST3 — 정적 사이트 (data/index.json, data/days/<날짜>.json 을 읽어 그림)
const LW = window.LightweightCharts;
// 디자인 고르기: 모드(색) × 레이아웃(배치). ?mode=..&lay=.. (고른 값은 이 브라우저에 기억)
const MODES = { light: '라이트', dark: '다크', soft: '소프트' };
const LAYS = { basic: '기본', card: '카드', tab: '탭', dash: '3열', f1: '차트 집중 A', f2: '차트 집중 B', f3: '차트 집중 C' };
const TABBED = ['tab', 'f1', 'f2', 'f3'];
function pick(key, all, def) {
  let v = new URLSearchParams(location.search).get(key);
  try { if (v && all[v]) localStorage.setItem('sjp:' + key, v); else v = localStorage.getItem('sjp:' + key) || localStorage.getItem(key); } catch (e) { }   // 이 브라우저에만 저장
  return all[v] ? v : def;
}
const MODE = pick('mode', MODES, 'light'), LAY = pick('lay', LAYS, 'basic');
const DARK = MODE === 'dark';
// 근거(왜 주목하나) 호버 확대 — 11/10 사용자 선택 B(확대+말풍선). ?zm=a 확대만 · c 바깥 어둡게 · off 끔 (주소로만, 기억 안 함)
const ZMQ = new URLSearchParams(location.search).get('zm'), ZM = ZMQ === 'off' ? '' : ['a', 'b', 'c'].includes(ZMQ) ? ZMQ : 'b';
document.body.classList.add('mode-' + MODE, 'lay-' + LAY);
if (DARK) document.body.classList.add('dk');
if (['tab', 'dash', 'f1', 'f2', 'f3'].includes(LAY)) document.body.classList.add('tb');
if (['f1', 'f2', 'f3'].includes(LAY)) document.body.classList.add('fx');
const THS = {
  light: { bg: '#FFFFFF', txt: '#4B5563', grid: '#F0F1F4', border: '#C9CDD4', up: '#E5202B', dn: '#1A5BD6' },
  dark: { bg: '#0F1318', txt: '#A8B0BD', grid: '#1B2129', border: '#2A313C', up: '#FF4040', dn: '#3D8BFF' },
  soft: { bg: '#FFFFFF', txt: '#8B95A1', grid: '#F2F4F6', border: '#E5E8EB', up: '#F04452', dn: '#3182F6' },
};
const TH = THS[MODE];
const UP = TH.up, DN = TH.dn, RSIC = DARK ? '#C084FC' : '#8E44AD';
const ORG = DARK ? '#FB923C' : '#EA580C';   // 선정 화살표 주황 (밝은 노랑 주황은 흰 바탕에서 잘 안 보여서 진하게)
const ENT = DARK ? '#9DB0E0' : '#2A3858';   // 진입가 선 남색 실선 (현재가 빨강·피보나치 주황 점선과 구분, 11/9 사용자 선택 B)
const MAC = DARK ? { 5: '#F472D0', 20: '#FBBF24', 60: '#34D399', 120: '#9CA3AF' } : { 5: '#D62FD0', 20: '#F08A00', 60: '#13A35B', 120: '#7A8494' };
function fixC(c) {   // 다크에서 너무 어두운 작도 색은 밝게
  if (!DARK || !c || c[0] !== '#') return c;
  const h = c.slice(1), f = h.length === 3 ? h.split('').map(x => x + x).join('') : h, n = parseInt(f, 16);
  return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255 < 0.35 ? '#D1D5DB' : c;
}
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => n == null || isNaN(n) ? '-' : Math.round(n).toLocaleString('ko-KR');
const pct = (n, d = 2) => n == null || isNaN(n) ? '-' : (n > 0 ? '+' : '') + Number(n).toFixed(d) + '%';
const cls = n => n > 0 ? 'up' : n < 0 ? 'dn' : '';
const tm = d => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
const WD = '일월화수목금토';
const dname = d => { const x = new Date(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8)); return `${+d.slice(4, 6)}/${+d.slice(6, 8)}(${WD[x.getDay()]})`; };
const md = d => `${+d.slice(4, 6)}/${+d.slice(6, 8)}`;
function alpha(hex, a) {
  const h = hex.replace('#', ''); const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h; const n = parseInt(f, 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}
// 종목 로고: 네이버 증권 → 알파스퀘어 → 첫 글자 배지 (이미지는 저장소에 복사하지 않고 주소로만 불러옴)
const LOGO = [c => `https://ssl.pstatic.net/imgstock/fn/real/logo/stock/Stock${c}.svg`, c => `https://file.alphasquare.co.kr/media/images/stock_logo/kr/${c}.png`];
function logo(code, name, px = 22) {
  return `<span class="logo" style="width:${px}px;height:${px}px;font-size:${Math.round(px * 0.5)}px" data-n="${esc((name || '?').slice(0, 1))}"><img src="${LOGO[0](code)}" data-c="${code}" data-k="0" alt="" loading="lazy" onerror="logoErr(this)"></span>`;
}
window.logoErr = img => {
  const k = +img.dataset.k + 1;
  if (k < LOGO.length) { img.dataset.k = k; img.src = LOGO[k](img.dataset.c); }
  else { const sp = img.parentNode; sp.classList.add('txt'); sp.textContent = sp.dataset.n; }
};
async function getJSON(u) { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }

let INDEX = null, CUR = null, CURD = null, CHARTS = [], LIVE = null;

async function init() {
  const sel2 = (id, all, cur, key, pre) => { const el = $(id); el.innerHTML = Object.entries(all).map(([k, v]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${pre}${v}</option>`).join('');
    el.onchange = () => { const q = new URLSearchParams(location.search); q.set(key, el.value); location.search = q.toString(); }; };
  sel2('#modeSel', MODES, MODE, 'mode', '모드: '); sel2('#laySel', LAYS, LAY, 'lay', '배치: ');
  try { INDEX = await getJSON('data/index.json'); }
  catch (e) { $('#stocks').innerHTML = `<div class="empty">데이터를 불러오지 못했습니다 (${esc(e.message)})</div>`; return; }
  $('#updated').textContent = '갱신 ' + INDEX.updated;
  const sel = $('#daySel');
  sel.innerHTML = INDEX.days.map(d => `<option value="${d.day}">${dname(d.day)} 마감 · ${d.stocks.map(s => esc(s.name)).join(', ')}</option>`).join('');
  sel.onchange = () => { location.hash = sel.value; };
  window.addEventListener('hashchange', route);
  try { LIVE = await getJSON('data/live.json'); } catch (e) { LIVE = null; }
  setInterval(async () => { try { const L = await getJSON('data/live.json'); if (!LIVE || L.date !== LIVE.date || L.time !== LIVE.time) { LIVE = L; applyLive(); perfMini(); } } catch (e) { } }, 5 * 60 * 1000);
  renderPerf();
  route();
  if (SHOT) setTimeout(() => {   // 설명 이미지 캡처용: 첫 종목 + 점수표 열기
    document.querySelectorAll('.rv').forEach(e => e.classList.add('in')); goTo(0, false);
    const c = document.querySelector('#st0 .scchip'); if (c) c.click();
  }, 1500);
}

function route() {
  const h = location.hash.slice(1);
  if (/^\d{8}$/.test(h)) { if (h !== CUR) renderDay(h); return; }
  if (!CUR && INDEX.latest) renderDay(INDEX.latest, !h);
}

// ───────────────────────── 날짜 페이지 ─────────────────────────
async function renderDay(day, top = true) {
  CUR = day; $('#daySel').value = day;
  CHARTS.forEach(c => c.remove()); CHARTS = [];
  let D;
  try { D = await getJSON(`data/days/${day}.json`); CURD = D; }
  catch (e) { $('#stocks').innerHTML = `<div class="empty">${day} 데이터가 없습니다</div>`; return; }
  const latest = day === INDEX.latest;
  $('#dayhead').innerHTML = `<h1>${dname(day)} 마감 기준 주목 종목 BEST3</h1><span class="meta">${latest ? '최신 · ' : '지난 날짜 · '}다음 거래일 장에서 볼 종목 · 생성 ${esc(D.made || '')}</span>`;
  $('#jump').innerHTML = jumpHTML(D);
  $('#jump').querySelectorAll('a').forEach(a => a.onclick = () => goTo(+a.dataset.k));
  $('#summary').innerHTML = summary(D);
  $('#summary').querySelectorAll('tr[data-k]').forEach(tr => tr.onclick = () => goTo(+tr.dataset.k));
  const box = $('#stocks'); box.innerHTML = '';
  D.stocks.forEach((s, i) => { const el = card(s, i); box.appendChild(el); CHARTS.push(buildChart(el, s)); bindScore(el, s); if (TF !== 'D') setTF(el, s, TF); });
  $('#method').innerHTML = methodHTML(D);
  if (TABBED.includes(LAY)) goTo(0, false);
  renderArchive(day);
  motion();
  setupSplits();
  if (top) window.scrollTo({ top: 0 });
}

// ── 효과 (컴퓨터에서 '애니메이션 줄이기'를 켜면 자동으로 끔) ──
const SHOT = new URLSearchParams(location.search).has('shot');
if (SHOT) document.body.classList.add('shot');
const CALM = SHOT || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function countUp(el) {
  const v = +el.dataset.v, p = +el.dataset.p; if (CALM || !v) return;
  const t0 = performance.now();
  const f = t => { const k = Math.max(0, Math.min(1, (t - t0) / 450)), e = 1 - Math.pow(1 - k, 3);
    el.innerHTML = `${fmt(v * e)} <small class="day">(${pct(p * e)})</small>`; if (k < 1) requestAnimationFrame(f); else el.innerHTML = `${fmt(v)} <small class="day">(${pct(p)})</small>`; };
  requestAnimationFrame(f);
}
let IO = null;
function motion() {
  const els = document.querySelectorAll('.card, .box, .jump');
  if (CALM || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  if (IO) IO.disconnect();
  IO = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in'); IO.unobserve(en.target);
    en.target.querySelectorAll('.px[data-v]').forEach(countUp);
  }), { threshold: 0.06 });
  els.forEach(e => { e.classList.add('rv'); IO.observe(e); });
}
window.addEventListener('scroll', () => document.querySelector('.top').classList.toggle('sm', window.scrollY > 40), { passive: true });
if ('ResizeObserver' in window) new ResizeObserver(() => document.documentElement.style.setProperty('--hdrH', document.querySelector('.top').offsetHeight + 'px')).observe(document.querySelector('.top'));
// 현재가: 장중 10분 간격 live.json → 없으면 성과 기록의 최근 종가
function cur(code, day) {
  const L = LIVE && LIVE.prices && LIVE.prices[code];
  if (L && LIVE.date >= day) return { p: L.p, o: L.o, h: L.h, l: L.l, v: L.v, d: LIVE.date, label: `${md(LIVE.date)} ${LIVE.time}${LIVE.closed ? ' · 장 마감' : ' · 10분 간격'}`, live: true };
  const pf = (INDEX.perf || []).find(p => p.day === day && p.code === code);
  if (pf && pf.last) return { p: pf.last.c, d: pf.last.d, label: `${md(pf.last.d)} 종가` };
  return null;
}
function levelOf(s, k) { return (s.levels || []).find(l => l.kind === k); }
function firstTarget(s, ref) { return (s.levels || []).filter(l => l.kind === '목표' && l.price > ref).sort((a, b) => a.price - b.price)[0] || levelOf(s, '저항2'); }
function nowHTML(s) {
  const c = cur(s.code, CUR);
  if (!c) return `<span class="t">현재가</span><span class="v muted">아직 없음 <small>다음 장부터</small></span>`;
  const r = (c.p / s.close - 1) * 100;
  return `<span class="t">현재가 · ${esc(c.label)}</span><span class="v ${cls(r)}">${fmt(c.p)} <small>진입 후 ${pct(r)}</small></span>`;
}
function distHTML(s) {
  const c = cur(s.code, CUR), ref = c ? c.p : s.close, stop = levelOf(s, '손절'), r1 = levelOf(s, '저항1');
  const a = []; if (stop) a.push(`손절 ${fmt(stop.price)}까지 <b class="dn">${pct((stop.price / ref - 1) * 100, 1)}</b>`); if (r1) a.push(`저항1 ${fmt(r1.price)}까지 <b class="up">${pct((r1.price / ref - 1) * 100, 1)}</b>`);
  return a.join(' · ') + (c ? ' <small>(현재가 기준)</small>' : '');
}
function retNow(code, day, base) {
  const c = cur(code, day); return c && base ? { r: (c.p / base - 1) * 100, c } : null;
}
// 종목 성격 칩 (11/9부터 days json의 kind: hot = 급등 후보, swing = 미리 담을 종목. 없으면 안 붙임)
function kindChip(s, sm) {
  const K = { hot: ['급등 후보', '다음 날 바로 움직일 수 있는 종목'], swing: ['미리 담을 종목', '추세가 좋아 며칠에 걸쳐 미리 모아 가기 좋은 자리: 평행채널 하단 근접·상승 추세 눌림 등'] }[s.kind];
  const ic = s.kind === 'hot' ? '<polyline points="1.5,10 5,6.5 7.5,9 12.5,3.5"/><polyline points="9,3.5 12.5,3.5 12.5,7"/>' : '<circle cx="7" cy="7" r="5.5"/><polyline points="7,4 7,7 9.2,8.4"/>';
  return K ? `<span class="kind ${s.kind}${sm ? ' sm' : ''}" title="${K[1]}"><svg viewBox="0 0 14 14" aria-hidden="true">${ic}</svg>${K[0]}</span>` : '';
}
function jumpHTML(D) {
  return D.stocks.map((s, i) => { const x = retNow(s.code, D.day, s.close);
    return `<a href="javascript:void(0)" data-k="${i}" title="${x ? '진입 후 · ' + esc(x.c.label) : '아직 현재가 없음'}"><span class="r">${i + 1}</span>${logo(s.code, s.name, 18)}${esc(s.name)}${kindChip(s, 1)} <span class="pv ${x ? cls(x.r) : ''}">${x ? pct(x.r) : '-'}</span><span class="jl">진입 후</span></a>`; }).join('');
}
function applyLive() {
  if (!CURD) return;
  const on = [...document.querySelectorAll('#jump a')].findIndex(a => a.classList.contains('on'));
  $('#jump').innerHTML = jumpHTML(CURD); $('#jump').querySelectorAll('a').forEach(a => a.onclick = () => goTo(+a.dataset.k));
  if (on >= 0) $('#jump').querySelectorAll('a')[on].classList.add('on');
  document.querySelectorAll('[data-now]').forEach(el => { const s = CURD.stocks.find(x => x.code === el.dataset.now); if (s) el.innerHTML = nowHTML(s); });
  document.querySelectorAll('[data-dist]').forEach(el => { const s = CURD.stocks.find(x => x.code === el.dataset.dist); if (s) el.innerHTML = distHTML(s); });
  $('#summary').innerHTML = summary(CURD);
  $('#summary').querySelectorAll('tr[data-k]').forEach(tr => tr.onclick = () => goTo(+tr.dataset.k));
}
// ── 크기 조절: 전체 폭(본문 양쪽 끝) · 박스 사이 경계를 끌기. 두 번 누르면 원래대로. 이 브라우저에 레이아웃별로 기억 ──
const ROOT = document.documentElement, SZK = 'sz:' + LAY;
let SZ = {}; try { SZ = JSON.parse(localStorage.getItem('sjp:' + SZK) || localStorage.getItem(SZK) || '{}'); } catch (e) { }
Object.entries(SZ).forEach(([k, v]) => ROOT.style.setProperty(k, v));
const saveSZ = () => { try { localStorage.setItem('sjp:' + SZK, JSON.stringify(SZ)); } catch (e) { } };
let PLACERS = [];
const placeAll = () => PLACERS.forEach(f => f());
function drag(h, onMove, onEnd) {
  h.onpointerdown = e => {
    e.preventDefault(); h.setPointerCapture(e.pointerId); document.body.classList.add('resizing'); h.classList.add('on');
    const st = onMove(null, e);
    h.onpointermove = ev => onMove(st, ev);
    h.onpointerup = () => { h.onpointermove = null; document.body.classList.remove('resizing'); h.classList.remove('on'); onEnd(); placeAll(); };
  };
}
function frSplit(grid, vars) {
  if (!grid) return;
  const hs = vars.slice(1).map(() => { const h = document.createElement('div'); h.className = 'spl'; h.title = '끌어서 폭 조절 · 두 번 누르면 원래대로'; grid.appendChild(h); return h; });
  const tracks = () => getComputedStyle(grid).gridTemplateColumns.split(' ').map(parseFloat);
  const place = () => {
    const t = tracks(), gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    if (t.length !== vars.length || !grid.offsetWidth) { hs.forEach(h => h.style.display = 'none'); return; }
    let x = 0; hs.forEach((h, i) => { x += t[i] + (i ? gap : 0); h.style.display = ''; h.style.left = (x + gap / 2) + 'px'; h.style.height = grid.offsetHeight + 'px'; });
  };
  hs.forEach((h, i) => {
    drag(h, (st, e) => {
      if (!st) { const t = tracks(); vars.forEach((v, k) => ROOT.style.setProperty(v, t[k] + 'fr')); return { x0: e.clientX, a0: t[i], b0: t[i + 1] }; }
      const a = Math.max(140, Math.min(st.a0 + st.b0 - 140, st.a0 + e.clientX - st.x0));
      ROOT.style.setProperty(vars[i], a + 'fr'); ROOT.style.setProperty(vars[i + 1], (st.a0 + st.b0 - a) + 'fr'); placeAll(); return st;
    }, () => { vars.forEach(v => SZ[v] = ROOT.style.getPropertyValue(v)); saveSZ(); });
    h.ondblclick = () => { vars.forEach(v => { ROOT.style.removeProperty(v); delete SZ[v]; }); saveSZ(); placeAll(); };
  });
  PLACERS.push(place);
  if ('ResizeObserver' in window) new ResizeObserver(place).observe(grid);
  place();
}
function hSplit(el, vars, min = 160) {
  if (!el) return;
  const h = document.createElement('div'); h.className = 'hspl'; h.title = '끌어서 높이 조절 · 두 번 누르면 원래대로'; el.appendChild(h);
  drag(h, (st, e) => {
    if (!st) return { y0: e.clientY, h0: el.getBoundingClientRect().height };
    const v = Math.max(min, Math.round(st.h0 + e.clientY - st.y0));
    ROOT.style.setProperty(vars[0], v + 'px'); vars.slice(1).forEach(([k, val]) => ROOT.style.setProperty(k, val)); placeAll(); return st;
  }, () => { SZ[vars[0]] = ROOT.style.getPropertyValue(vars[0]); vars.slice(1).forEach(([k]) => SZ[k] = ROOT.style.getPropertyValue(k)); saveSZ(); });
  h.ondblclick = () => { [vars[0], ...vars.slice(1).map(x => x[0])].forEach(k => { ROOT.style.removeProperty(k); delete SZ[k]; }); saveSZ(); placeAll(); };
}
function mainHandles() {
  const m = document.querySelector('main'); if (m.querySelector('.mh')) return;
  ['l', 'r'].forEach(sd => {
    const h = document.createElement('div'); h.className = 'mh ' + sd; h.title = '끌어서 전체 폭 조절 · 두 번 누르면 원래대로'; m.appendChild(h);
    drag(h, (st, e) => {
      if (!st) { const r = m.getBoundingClientRect(); return { cx: r.left + r.width / 2 }; }
      ROOT.style.setProperty('--mainW', Math.max(900, Math.min(window.innerWidth, 2 * Math.abs(e.clientX - st.cx))) + 'px'); return st;
    }, () => { SZ['--mainW'] = ROOT.style.getPropertyValue('--mainW'); saveSZ(); });
    h.ondblclick = () => { ROOT.style.removeProperty('--mainW'); delete SZ['--mainW']; saveSZ(); placeAll(); };
  });
}
function setupSplits() {
  PLACERS = []; document.querySelectorAll('.spl, .hspl').forEach(x => x.remove());
  mainHandles();
  const cards = [...document.querySelectorAll('#stocks .card')];
  cards.forEach(c => {
    if (LAY === 'basic' || LAY === 'card') { frSplit(c.querySelector('.chartrow'), ['--cw', '--sw']); frSplit(c.querySelector('.panels'), ['--p1', '--p2', '--p3', '--p4']); }
    if (LAY === 'tab') frSplit(c, ['--t1', '--t2']);
    if (LAY === 'f1') frSplit(c, ['--a1', '--a2']);
    if (LAY === 'f2') frSplit(c, ['--b1', '--b2', '--b3']);
    if (LAY === 'f3') frSplit(c.querySelector('.pcol.a'), ['--c1', '--c2']);
    if (['f1', 'f2', 'f3'].includes(LAY)) frSplit(c.querySelector('.pcol.b'), ['--m1', '--m2']);
  });
  cards.forEach(c => {
    hSplit(c.querySelector('.chartwrap'), ['--chH', ['--chAR', 'auto']], 240);       // 차트 높이 (차트 집중형은 16:9 대신 정한 높이)
    if (LAY === 'f1') hSplit(c.querySelector('.p-why'), ['--whyH', ['--whyMax', 'none']], 60);   // 오른쪽 열: 왜 주목 | 가격대 사이
    if (LAY === 'f3') hSplit(c.querySelector('.pcol.a'), ['--infoH'], 120);          // 아래 정보 칸 높이
  });
  if (LAY === 'dash') frSplit($('#stocks'), ['--d1', '--d2', '--d3']);
}
window.addEventListener('resize', () => placeAll());
// 경계 가까이(28px) 마우스가 오면 경계선을 파랗게 — 끌 수 있다는 힌트
let nearRAF = 0;
document.addEventListener('mousemove', e => {
  if (nearRAF || document.body.classList.contains('resizing')) return;
  nearRAF = requestAnimationFrame(() => {
    nearRAF = 0;
    document.querySelectorAll('.spl, .mh').forEach(h => {
      if (h.style.display === 'none') return;
      const r = h.getBoundingClientRect(), cx = r.left + r.width / 2;
      const near = Math.abs(e.clientX - cx) < 28 && e.clientY >= r.top - 8 && e.clientY <= r.bottom + 8;
      h.classList.toggle('near', near);
    });
    document.querySelectorAll('.hspl').forEach(h => {
      const r = h.getBoundingClientRect(); if (!r.width) return;
      const cy = r.top + r.height / 2;
      h.classList.toggle('near', Math.abs(e.clientY - cy) < 22 && e.clientX >= r.left - 8 && e.clientX <= r.right + 8);
    });
  });
}, { passive: true });
document.addEventListener('mouseleave', () => document.querySelectorAll('.spl.near, .mh.near, .hspl.near').forEach(h => h.classList.remove('near')));
function goTo(i, scroll = true) {
  if (TABBED.includes(LAY)) {
    document.querySelectorAll('#stocks .card').forEach((c, k) => { c.classList.toggle('hide', k !== i); if (k === i && !c.classList.contains('in')) { c.classList.add('in'); c.querySelectorAll('.px[data-v]').forEach(countUp); } });
    document.querySelectorAll('#jump a').forEach((a, k) => a.classList.toggle('on', k === i));
    placeAll();
    if (scroll && LAY !== 'tab') { const c = document.getElementById('st' + i), h = document.querySelector('.top').offsetHeight + document.querySelector('#jump').offsetHeight; let y = 0; for (let e = c; e; e = e.offsetParent) y += e.offsetTop; window.scrollTo({ top: y - h - 2, behavior: 'auto' }); }   // offsetTop: 등장 효과의 이동값에 안 흔들림
  } else document.getElementById('st' + i).scrollIntoView({ behavior: 'smooth' });
}
function summary(D) {
  const rows = D.stocks.map((s, i) => {
    const B = s.close, c = cur(s.code, D.day), ref = c ? c.p : B;
    const stop = levelOf(s, '손절'), tg = firstTarget(s, ref);
    const rr = stop && tg && stop.price < ref ? ((tg.price / ref - 1) / (1 - stop.price / ref)).toFixed(1) : '-';
    const iv = (s.inv || [])[0] || {}, fo = (iv.frgn || 0) + (iv.orgn || 0);
    const ch = chipOf((s.why && s.why[0]) || (s.notes || [])[0] || '').chips[0];
    const r = c ? (c.p / B - 1) * 100 : null;
    const ds = (l, k) => l ? `<span class="${k}">${pct((l.price / ref - 1) * 100, 1)}</span> <small>${fmt(l.price)}</small>` : '-';
    return `<tr data-k="${i}"><td class="l"><span class="rk">${i + 1}</span></td><td class="l nmtd"><span class="nmcell">${logo(s.code, s.name, 20)}<b>${esc(s.name)}</b></span></td><td class="kc">${kindChip(s, 1)}</td>
      <td class="g1">${fmt(B)} <small class="${cls(s.chg)}">(${pct(s.chg)})</small></td><td class="g2">${c ? fmt(c.p) : '-'}</td><td class="g2 ${cls(r)}">${c ? pct(r) : '-'}</td>
      <td class="l">${ch ? `<span class="cc" style="--c:${fixC(ch[1])}">${esc(ch[0])}</span>` : ''}</td><td>${ds(stop, 'dn')}</td><td>${ds(tg, 'up')}</td><td><b>${rr}</b></td><td class="${cls(fo)}">${fo > 0 ? '+' : ''}${fmt(fo)}억</td><td>${s.rsi ?? '-'}</td></tr>`;
  }).join('');
  const c0 = D.stocks.length ? cur(D.stocks[0].code, D.day) : null;
  return `<h2>한눈에 보기 <small>회색 = 분석 시점(${dname(D.day)} 종가) · 노랑 = 지금${c0 ? ` (${esc(c0.label)})` : ''} · 손절·목표까지는 현재가 기준 · 행을 누르면 그 종목으로</small></h2>
  <div class="tblwrap"><table class="perf sumt"><tr><th class="l">#</th><th class="l" colspan="2">종목</th><th class="g1">진입가</th><th class="g2">현재가</th><th class="g2">진입 후</th><th class="l">핵심</th><th>손절까지</th><th>첫 목표까지</th><th>손익비</th><th>외+기(당일)</th><th>RSI</th></tr>${rows}</table></div>`;
}
// ── 선정 점수: 머리줄 칩 → 차트 위에 떠서 펼치는 항목별 점수표 ──
const scMax = s => (s.items || []).reduce((a, x) => a + (x.max || 0), 0);
function scoreChip(s) {
  if (s.score == null) return '';
  const rk = s.rank && s.ncand ? ` · ${s.ncand}개 중 ${s.rank}위` : '';
  return `<button class="scchip" type="button" aria-expanded="false">선정 <b>${s.score}</b>${s.items ? `<small>/${scMax(s)}</small>` : ''}점${rk} <span class="car">▾</span></button>`;
}
function scoreTable(s) {
  if (!s.items) return '<div class="hint">이날은 항목별 점수 기록이 없어요</div>';
  const big = Math.max(2, ...s.items.map(x => Math.abs(x.pts)));
  const rows = s.items.map(x => {
    const k = x.pts > 0 ? 'p' : x.pts < 0 ? 'n' : 'z', w = Math.max(4, Math.abs(x.pts || x.max || 0.5) / big * 100);
    return `<tr class="${k}" title="${esc(x.rule)}"><td>${esc(x.label)}</td><td class="vv">${esc(x.val)}</td><td class="bb"><i style="width:${w}%"></i></td><td class="pp">${x.pts > 0 ? '+' : ''}${x.pts}</td></tr>`;
  }).join('');
  const sk = (s.skipped || []).slice(0, 4).map(k => `<li>${k.rank}위 ${esc(k.name)} (${k.score}점) — ${esc(k.why)}</li>`).join('');
  const more = (s.skipped || []).length > 4 ? `<li>외 ${(s.skipped || []).length - 4}개</li>` : '';
  return `<div class="sph"><b>선정 점수 ${s.score}</b> / ${scMax(s)}점${s.rank ? ` · 후보 ${s.ncand}개 중 ${s.rank}위` : ''}</div>
    <table class="spt">${rows}</table>
    ${sk ? `<div class="sps"><b>위 순위인데 안 뽑힌 종목</b><ul>${sk}${more}</ul></div>` : ''}
    ${s.pickNote ? `<div class="spn">${esc(s.pickNote)}</div>` : ''}
    <a class="spm" href="javascript:void(0)">선정 방식 보기 ↓</a>`;
}
let SC_PIN = null;
function bindScore(el, s) {
  const chip = el.querySelector('.scchip'); if (!chip) return;
  const pop = document.createElement('div'); pop.className = 'scpop'; pop.innerHTML = scoreTable(s); el.appendChild(pop);
  const place = () => { const cr = el.getBoundingClientRect(), r = chip.getBoundingClientRect();
    pop.style.top = (r.bottom - cr.top + 4) + 'px'; pop.style.left = Math.max(4, Math.min(cr.width - pop.offsetWidth - 4, r.left - cr.left)) + 'px'; };
  const open = () => { pop.classList.add('show'); place(); };
  const close = () => { if (SC_PIN === pop) return; pop.classList.remove('show'); };
  chip.onmouseenter = open;
  chip.onmouseleave = () => setTimeout(() => { if (!pop.matches(':hover') && !chip.matches(':hover')) close(); }, 120);
  pop.onmouseleave = () => setTimeout(() => { if (!pop.matches(':hover') && !chip.matches(':hover')) close(); }, 120);
  chip.onclick = e => { e.stopPropagation();
    if (SC_PIN === pop) { SC_PIN = null; chip.classList.remove('on'); chip.setAttribute('aria-expanded', 'false'); pop.classList.remove('show'); return; }
    unpin(); SC_PIN = pop; chip.classList.add('on'); chip.setAttribute('aria-expanded', 'true'); open(); };
  pop.onclick = e => e.stopPropagation();
  pop.querySelector('.spm').onclick = () => { unpin(); document.getElementById('method').scrollIntoView({ behavior: 'smooth' }); };
}
function unpin() {
  if (!SC_PIN) return; SC_PIN.classList.remove('show');
  const c = SC_PIN.parentNode.querySelector('.scchip'); if (c) { c.classList.remove('on'); c.setAttribute('aria-expanded', 'false'); }
  SC_PIN = null;
}
document.addEventListener('click', unpin);
document.addEventListener('keydown', e => { if (e.key === 'Escape') unpin(); });

// ── 페이지 아래 '선정 방식': 단계 + 점수표(그날 세 종목 점수를 열로) ──
function methodHTML(D) {
  const st = D.stocks.filter(x => x.items);
  const base = st[0] ? st[0].items : null;
  const steps = `<ol class="msteps">
    <li><b>후보 모으기</b> — 코스피·코스닥 각각 등락률 상위 30 · 거래대금 상위 30 · 거래증가율 상위 30 (순위 조회가 모자라면 최근 후보 목록으로 보충)</li>
    <li><b>제외</b> — ETF·ETN·스팩·리츠·우선주, 일봉 130개 미만, 종가 1,000원 미만, 거래대금 50억 미만</li>
    <li><b>점수</b> — 아래 13개 항목을 더함 (최고 ${base ? base.reduce((a, x) => a + x.max, 0) : 14.5}점)</li>
    <li><b>최종 3종목</b> — 점수 순으로, 상한가(+29.5% 이상)는 다음 날 진입이 어려워 빼고, 업종이 겹치면 다음 순위</li></ol>`;
  if (!base) return `<h2>선정 방식</h2>${steps}`;
  const head = st.map(x => `<th>${logo(x.code, x.name, 16)}${esc(x.name)}</th>`).join('');
  const rows = base.map((it, k) => `<tr><td class="l"><b>${esc(it.label)}</b></td><td class="l rl">${esc(it.rule)}</td>${st.map(x => { const v = (x.items || []).find(y => y.k === it.k);      // 추세형(미리 담을 종목)은 항목이 달라 빈칸
    if (!v) return '<td class="zz">-</td>';
    return `<td class="${v.pts > 0 ? 'up' : v.pts < 0 ? 'dn' : 'zz'}">${v.pts > 0 ? '+' : ''}${v.pts} <small>${esc(v.val)}</small></td>`; }).join('')}</tr>`).join('');
  const tot = `<tr class="tot"><td class="l" colspan="2"><b>합계</b></td>${st.map(x => `<td><b>${x.score}</b>${x.rank ? ` <small>${x.ncand}개 중 ${x.rank}위</small>` : ''}</td>`).join('')}</tr>`;
  const note = st.find(x => x.pickNote);
  return `<h2>선정 방식 <small>${dname(D.day)} 마감 기준 세 종목 점수를 나란히</small></h2>${steps}
    ${note ? `<div class="spn">${esc(note.pickNote)}</div>` : ''}
    <div class="tblwrap"><table class="perf mtab"><tr><th class="l">항목</th><th class="l">조건 · 점수</th>${head}</tr>${rows}${tot}</table></div>`;
}
function card(s, i) {
  const el = document.createElement('section'); el.className = 'card'; el.id = 'st' + i;
  const p = s.price || {};
  const chips = [
    s.vr != null && `<span class="chip">거래량 <b>${s.vr}배</b></span>`,
    s.rsi != null && `<span class="chip">RSI <b>${s.rsi}</b></span>`,
    p.per && `<span class="chip">PER <b>${(+p.per).toFixed(1)}</b></span>`,
    p.pbr && `<span class="chip">PBR <b>${(+p.pbr).toFixed(2)}</b></span>`,
    p.mcap_eok && `<span class="chip">시총 <b>${fmt(p.mcap_eok)}억</b></span>`,
  ].filter(Boolean).join('');
  el.innerHTML = `
  <div class="cardhead"><span class="rank">${i + 1}</span>${logo(s.code, s.name, 30)}<span class="nm">${esc(s.name)}</span>${kindChip(s)}<span class="cd">${s.code} · ${esc(s.sector || '')}</span>
    <div class="pbx base"><span class="t">진입가 · ${dname(CUR)} 종가 (분석 시점)</span><span class="v px" data-v="${s.close}" data-p="${s.chg}">${fmt(s.close)} <small class="day">(${pct(s.chg)})</small></span></div>
    <span class="parr">→</span><div class="pbx now" data-now="${s.code}">${nowHTML(s)}</div><span class="dist" data-dist="${s.code}">${distHTML(s)}</span>${scoreChip(s)}
    <div class="chips">${chips}</div></div>
  <div class="chartrow"><div class="chartwrap"><div class="ohlc"></div><div class="chart"></div></div><div class="side"></div></div>
  <div class="panels"><div class="pcol a">
    <div class="pn p-why"><h4 class="why">왜 주목하나</h4>${chipList(s.why && s.why.length ? s.why : s.notes || [], true)}</div>
    <div class="pn p-lv"><h4 class="lv">볼 가격대 <small style="color:#6B7280;font-weight:400">(행에 마우스 → 차트 표시)</small></h4>${levelsTable(s)}
      ${s.watch && s.watch.length ? `<h4 class="lv" style="margin-top:10px">체크 포인트</h4>${chipList(s.watch, true)}` : ''}</div>
    </div><div class="pcol b"><div class="pn p-inv"><h4 class="sd">수급 (순매수, 억 원)</h4>${invTable(s.inv || [], s.rows)}</div>
    <div class="pn p-news"><h4 class="nw">재료 · 관련 기사</h4>
      ${matNews(s)}</div></div>
  </div>`;
  return el;
}

const KORD = { '목표': 0, '저항2': 1, '저항1': 2, '현재가': 2.5, '진입가': 2.6, '지지1': 3, '지지2': 4, '손절': 5 };
function kcls(k) { return k === '현재가' ? 'cur' : k === '진입가' ? 'base' : k.startsWith('저항') ? 'res' : k.startsWith('지지') ? 'sup' : k === '손절' ? 'stop' : 'tgt'; }
function levelsTable(s) {
  if (!(s.levels || []).length) return '<div class="hint">계산된 가격대 없음</div>';
  const C = s.close;
  const cn = cur(s.code, CUR);
  const extra = [{ kind: '진입가', price: C, basis: `${dname(CUR)} 종가 = 분석 시점 — 위는 저항·목표, 아래는 지지·손절` }];
  if (cn) extra.push({ kind: '현재가', price: cn.p, basis: cn.label });
  const lv = (s.levels || []).concat(extra)
    .sort((a, b) => b.price - a.price || (KORD[a.kind] ?? 9) - (KORD[b.kind] ?? 9));
  const rows = lv.map((l, j) => l.kind === '진입가' || l.kind === '현재가'
    ? `<tr data-j="${j}" class="${l.kind === '진입가' ? 'baserow' : 'currow'}"><td><span class="k ${kcls(l.kind)}">${l.kind}</span></td><td><b>${fmt(l.price)}</b></td><td class="${cls(l.price - C)}">${l.kind === '진입가' ? '0.0%' : pct((l.price / C - 1) * 100, 1)}</td><td class="b">${esc(l.basis)}</td></tr>`
    : `<tr data-j="${j}"><td><span class="k ${kcls(l.kind)}">${esc(l.kind)}</span></td><td>${fmt(l.price)}</td><td class="${cls(l.price - C)}">${pct((l.price / C - 1) * 100, 1)}</td><td class="b">${esc(l.basis)}</td></tr>`).join('');
  const stop = lv.find(l => l.kind === '손절'); const r1 = lv.filter(l => l.kind === '저항1')[0]; const tg = lv.filter(l => l.kind === '목표').sort((a, b) => a.price - b.price)[0];
  let rr = '';
  if (stop && (r1 || tg)) {
    const risk = (1 - stop.price / C) * 100;
    rr = `<div class="rr"><small>진입가 기준</small> 손절까지 <b class="dn">-${risk.toFixed(1)}%</b>${r1 ? ` · 저항1까지 <b class="up">${pct((r1.price / C - 1) * 100, 1)}</b>` : ''}${tg ? ` · 첫 목표까지 <b class="up">${pct((tg.price / C - 1) * 100, 1)}</b> (손익비 ${((tg.price / C - 1) * 100 / risk).toFixed(1)})` : ''}</div>`;
  }
  return `<table class="lvt" data-lv='${esc(JSON.stringify(lv))}'><tr><th>구분</th><th>가격</th><th>진입가 대비</th><th style="text-align:left">근거</th></tr>${rows}</table>${rr}`;
}
function invTable(inv, rows) {
  if (!inv.length) return '<div class="hint">수급 데이터 없음</div>';
  const r = inv.slice(0, 7);
  const sum = k => r.slice(0, 5).reduce((a, x) => a + (x[k] || 0), 0);
  const c = v => `<td class="${cls(v)}">${v > 0 ? '+' : ''}${fmt(v)}</td>`;
  return `<table class="inv"><tr><th>날짜</th><th>외국인</th><th>기관</th><th>개인</th></tr>
    ${r.map(x => `<tr><td>${md(x.d)}</td>${c(x.frgn)}${c(x.orgn)}${c(x.prsn)}</tr>`).join('')}
    <tr><td><b>5일 합</b></td>${c(sum('frgn'))}${c(sum('orgn'))}${c(sum('prsn'))}</tr></table>${invRead(inv, rows)}`;
}
// 수급 쉽게 읽기 — 표의 숫자만으로 규칙대로 풀이 (지어내지 않음)
function streak(inv, k) {
  const sg = Math.sign(inv[0][k] || 0); if (!sg) return [0, 0];
  let n = 0; for (const x of inv) { if (Math.sign(x[k] || 0) === sg) n++; else break; }
  return [sg, n];
}
function invRead(inv, rows) {
  if (!inv.length) return '';
  const t = inv[0], f = t.frgn || 0, o = t.orgn || 0, p = t.prsn || 0, both = f + o;
  const r5 = inv.slice(0, 5), s5 = k => r5.reduce((a, x) => a + (x[k] || 0), 0);
  const last = rows && rows.length ? rows[rows.length - 1] : null;
  const tv = last && last.d === t.d ? last.c * last.v / 1e8 : null;      // 그날 거래대금(억, 종가×거래량 근사)
  const who = k => k === 'frgn' ? '외국인' : '기관';
  const out = [];
  let head, tone;
  if (f > 0 && o > 0) { head = `외국인·기관 <b class="up">동시 순매수</b> (${'+' + fmt(both)}억)`; tone = '큰손 둘 다 샀다 = 수급상 가장 좋은 그림'; }
  else if (f < 0 && o < 0) { head = `외국인·기관 <b class="dn">동시 순매도</b> (${fmt(both)}억)`; tone = '큰손 둘 다 팔았다 = 오른 날이어도 반등이 짧을 수 있음, 조심'; }
  else if (both > 0) { const k = f > o ? 'frgn' : 'orgn'; head = `${who(k)} 주도 순매수 (외+기 ${'+' + fmt(both)}억)`; tone = `${who(k === 'frgn' ? 'orgn' : 'frgn')}은 팔았지만 합치면 사는 쪽이 많음 = 무난`; }
  else { head = `외+기 합계 <b class="dn">순매도</b> (${fmt(both)}억)`; tone = '큰손 쪽이 파는 쪽이 많음 = 수급은 약한 편'; }
  out.push(`<b>당일(${md(t.d)})</b> ${head} → ${tone}`);
  if (p > 0 && both < 0) out.push('개인만 샀다 = 큰손이 판 물량을 개인이 받는 중, 단기 고점 신호일 때가 많음');
  else if (p < 0 && both > 0) out.push('개인이 판 물량을 외국인·기관이 받아감 = 손바뀜이 좋은 쪽');
  if (tv && tv > 0) { const r = both / tv * 100; out.push(`외+기 순매수가 당일 거래대금(약 ${fmt(tv)}억)의 <b>${r > 0 ? '+' : ''}${r.toFixed(1)}%</b> — 5% 넘으면 꽤 큰 매수, 1% 안쪽이면 의미 작음`); }
  for (const k of ['frgn', 'orgn']) {
    const [sg, n] = streak(inv, k);
    if (n >= 2) out.push(`${who(k)} <b class="${sg > 0 ? 'up' : 'dn'}">${n}일 연속 ${sg > 0 ? '순매수' : '순매도'}</b> (5일 합 ${s5(k) > 0 ? '+' : ''}${fmt(s5(k))}억)`);
  }
  return `<div class="invread"><ul>${out.map(x => `<li>${x}</li>`).join('')}</ul>
    <div class="legend">읽는 법: <span class="up">+ 빨강 = 순매수(산 돈)</span>, <span class="dn">− 파랑 = 순매도(판 돈)</span>, 단위 억 원. 외국인·기관이 <b>같이, 여러 날 연속</b> 사면 강한 신호이고, 개인만 사면 주의.</div></div>`;
}
// 항목 앞 색깔 칩: 문장 종류(엘리엇·피보나치·RSI·수급…)를 칩으로, 뒤에 내용
const CAT = [
  [/다이버전스/, '다이버전스', '#16A085'], [/평행채널|채널/, '채널', '#0E7490'], [/A-B-C|ABC 조정/, 'A-B-C', '#7C3AED'], [/엘리엇|[0-9]파(?![가-힣])|파동/, '엘리엇', '#2156E8'],
  [/피보나치|되돌림/, '피보나치', '#2980B9'], [/추세선/, '추세선', '#1E2329'], [/큰 추세|추세는|하락 추세|상승 추세/, '추세', '#374151'], [/52주|신고가|신저가/, '52주', '#6B7280'], [/이중바닥|쌍바닥|W자|넥라인/, '이중바닥', '#7C3AED'],
  [/RSI|과매도|과열/, 'RSI', '#8E44AD'], [/외국인|기관|순매수|순매도|수급/, '수급', '#0E9F6E'], [/거래량/, '거래량', '#F08A00'],
  [/\d+일선|정배열|이평/, '이평선', '#13A35B'], [/돌파/, '돌파', '#E5202B'], [/공시|공급계약|수주/, '공시', '#475569'],
  [/실적|분기|영업이익|매출/, '실적', '#B45309'], [/리포트|목표가|증권사/, '리포트', '#6D28D9'], [/자사주|소각|배당/, '주주환원', '#0369A1'],
  [/분할|합병|상장|연기/, '이벤트', '#0E7490'], [/출시|허가|승인|진출/, '사업', '#0F766E'], [/윗꼬리|아랫꼬리|양봉|음봉|캔들/, '캔들', '#BE185D'],
  [/손절|이탈|무효/, '손절', '#111111'], [/지지|버티/, '지지', DN], [/저항/, '저항', UP], [/PER|PBR|밸류|저평가|고평가/, '밸류', '#6B7280'],
];
function cats(t, n = 2) { const out = []; for (const [re, lab, col] of CAT) { if (re.test(t) && !out.some(x => x[0] === lab)) out.push([lab, col]); if (out.length >= n) break; } return out; }
function chipOf(text) {
  const m = String(text).match(/^([^:：]{2,14})[:：]\s*(.+)$/);
  if (m) { const c = cats(m[1], 1)[0] || cats(m[2], 1)[0] || ['', '#6B7280']; return { chips: [[m[1].trim(), c[1]]], body: m[2] }; }
  const cs = cats(text, 1); return { chips: cs.length ? cs : [['메모', '#9CA3AF']], body: text };   // 칩은 하나만 (두 개면 줄바꿈돼서)
}
function chipList(items, hl) {
  if (!items || !items.length) return '<div class="hint">없음</div>';
  return `<ul class="cl${hl ? ' hl' : ''}">${items.map(x => { const c = chipOf(x);
    return `<li${hl ? ` data-hl="${esc(x)}"` : ''}><span class="ccs">${c.chips.map(([l, col]) => `<span class="cc" style="--c:${fixC(col)}">${esc(l)}</span>`).join('')}</span><span class="ct">${esc(c.body)}</span></li>`; }).join('')}</ul>`;
}
// 같은 사건 기사 빼기: 제목 낱말이 절반 넘게 겹치면 중복
function dedupeNews(n, name) {
  const tok = t => new Set(String(t).replace(/[^\w가-힣]+/g, ' ').split(' ').filter(w => w.length >= 2 && w !== name));
  const kept = [];
  for (const x of n) {
    const a = tok(x.title);
    if (kept.some(k => { const b = tok(k.title); let i = 0; a.forEach(w => { if (b.has(w)) i++; }); const long = [...a].some(w => w.length >= 4 && b.has(w)); return long || i / Math.max(1, Math.min(a.size, b.size)) >= 0.5; })) continue;
    kept.push(x);
  }
  return kept;
}
const EXT = '<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z"/></svg>';
function matNews(s) {
  const news = dedupeNews(s.news || [], s.name);
  const mat = s.material && s.material.length ? s.material : news.map(x => x.summary).filter(Boolean);
  const body = mat.length ? chipList(mat, false) : '<div class="hint">기사 요약 준비 중</div>';
  const src = news.length ? `<div class="srcs"><span class="srclab">원문</span>${news.map(x => `<a class="srcchip" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" title="${esc(x.title + (x.summary ? '\n\n' + x.summary : ''))}"><span class="sn">${esc(x.type === 'dart' ? 'DART' : x.type === 'search' ? '제목검색' : x.source || '기사')}</span><span class="st">${esc(x.title)}</span>${EXT}</a>`).join('')}</div>` : '';
  return body + src;
}

// ───────────────────────── 차트 ─────────────────────────
function sma(c, n) { return c.map((_, i) => i >= n - 1 ? c.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n : null); }
function rsi(c, n = 14) {
  let ag = 0, al = 0; const out = c.map(() => null);
  for (let i = 1; i < c.length; i++) {
    const d = c[i] - c[i - 1], g = Math.max(d, 0), l = Math.max(-d, 0);
    if (i === 1) { ag = g; al = l; } else { ag = (ag * (n - 1) + g) / n; al = (al * (n - 1) + l) / n; }
    out[i] = 100 - 100 / (1 + ag / (al || 1e-9));
  }
  return out;
}
const POS = { above: 'aboveBar', below: 'belowBar' };

// ── 분봉: data/min/<코드>.json(30분봉, 아침 갱신) + live.json m30(오늘 봉, 장중 10분) → 30M·1H·4H ──
const MIN = {}, TFS = [['30', '30M'], ['60', '1H'], ['240', '4H'], ['D', '1D']], TFPD = { 30: 13, 60: 7, 240: 2 };
let TF = 'D'; try { TF = localStorage.getItem('sjp:tf') || 'D'; } catch (e) { }
async function minRows(code, tf) {
  if (!(code in MIN)) { try { MIN[code] = (await getJSON(`data/min/${code}.json`)).bars; } catch (e) { MIN[code] = null; } }
  let b = MIN[code]; if (!b || !b.length) return null;
  const lt = LIVE && LIVE.m30 && LIVE.m30[code];
  if (lt && lt.length) { const last = b[b.length - 1][0]; b = b.concat(lt.filter(x => x[0] > last)); }
  const key = t => { if (tf === '30') return t; if (tf === '60') return t - t % 3600; const d = t - t % 86400; return d + (t - d >= 13 * 3600 ? 13 : 9) * 3600; };
  const m = new Map();
  for (const [t, o, h, l, c, v] of b) {
    const k = key(t), x = m.get(k);
    if (!x) m.set(k, { t: k, o, h, l, c, v }); else { x.h = Math.max(x.h, h); x.l = Math.min(x.l, l); x.c = c; x.v += v; }
  }
  return [...m.values()].sort((a, b2) => a.t - b2.t);
}
async function setTF(el, s, tf) {
  const k = CHARTS.findIndex(c => c._el === el); if (k < 0) return;
  let m = null;
  if (tf !== 'D') { m = await minRows(s.code, tf); if (!m) { const o = el.querySelector('.ohlc'); if (o) o.innerHTML = '<b>분봉 없음</b> — 분봉은 최근 3일 종목과 추적 중인 종목만 있어요'; return; } }
  TF = tf; try { localStorage.setItem('sjp:tf', tf); } catch (e) { }
  CHARTS[k].remove(); el.querySelector('.chart').innerHTML = '';
  CHARTS[k] = buildChart(el, s, tf, m);
}
const pad2 = n => String(n).padStart(2, '0');
const tlab = t => { const d = new Date(t * 1000); return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`; };

function buildChart(el, s, tf = 'D', mrows = null) {
  const box = el.querySelector('.chart'), side = el.querySelector('.side'), ohlc = el.querySelector('.ohlc');
  (s.groups || []).forEach(g => { if (g.id === 'vol') g.id = 'volx'; });      // 작도 '거래량 급증'과 지표 '거래량' 분리
  if (DARK) (s.groups || []).forEach(g => { g.color = fixC(g.color); (g.items || []).forEach(it => { it.color = fixC(it.color); (it.marks || []).forEach(m => m.color = fixC(m.color)); }); });
  const ID = tf !== 'D' && mrows && mrows.length;      // 분봉 차트
  if (!ID) tf = 'D';
  let pickI = s.rows.length - 1, rows;
  if (ID) {
    rows = mrows;
    const pd = s.rows[pickI].d, end = Date.UTC(+pd.slice(0, 4), +pd.slice(4, 6) - 1, +pd.slice(6, 8) + 1) / 1000;
    pickI = rows.reduce((k, r, i) => r.t < end ? i : k, -1);
  } else {
    rows = s.rows.concat((s.after || []).filter(r => r.d > s.rows[pickI].d));
    const lc = cur(s.code, CUR);
    if (lc && lc.live && lc.d > rows[rows.length - 1].d && lc.o) rows.push({ d: lc.d, o: lc.o, h: lc.h, l: lc.l, c: lc.p, v: lc.v, live: true });
  }
  const T = rows.map(r => ID ? r.t : tm(r.d)), C = rows.map(r => r.c), N = rows.length;
  const idx = new Map(T.map((t, i) => [t, i]));
  const chart = LW.createChart(box, {
    autoSize: true,
    layout: { background: { type: 'solid', color: TH.bg }, textColor: TH.txt, fontSize: 11, fontFamily: 'Malgun Gothic, Apple SD Gothic Neo, sans-serif',
      panes: { separatorColor: TH.border, separatorHoverColor: 'rgba(33,86,232,.12)', enableResize: true } },
    grid: { vertLines: { color: TH.grid }, horzLines: { color: TH.grid } },
    crosshair: { mode: LW.CrosshairMode.Normal },
    rightPriceScale: { borderColor: TH.border },
    timeScale: { borderColor: TH.border, rightOffset: 6, barSpacing: 7, minBarSpacing: 1.5, timeVisible: !!ID },
    localization: { locale: 'ko-KR', dateFormat: 'yyyy-MM-dd' },
  });
  const pxFmt = { type: 'custom', minMove: 1, formatter: p => Math.round(p).toLocaleString('ko-KR') };
  const reg = [];   // {g, item, kind, series|pl, base, ...}
  const add = (e) => { reg.push(e); return e; };

  // 캔들
  if (N - 1 > pickI) {      // 선정 후 구간 옅은 배경
    const bg = chart.addSeries(LW.AreaSeries, { priceScaleId: 'bgband', lineColor: 'rgba(0,0,0,0)', lineWidth: 1, topColor: DARK ? 'rgba(251,146,60,.10)' : 'rgba(234,88,12,.08)', bottomColor: DARK ? 'rgba(251,146,60,.10)' : 'rgba(234,88,12,.08)',
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }, 0);
    chart.priceScale('bgband').applyOptions({ scaleMargins: { top: 0, bottom: 0 }, visible: false });
    bg.setData(rows.map((r, i) => i >= pickI ? { time: T[i], value: 1 } : { time: T[i] }));
  }
  const candle = chart.addSeries(LW.CandlestickSeries, { upColor: UP, downColor: DN, borderUpColor: UP, borderDownColor: DN, wickUpColor: UP, wickDownColor: DN, priceLineColor: UP, priceFormat: pxFmt }, 0);
  candle.setData(rows.map((r, i) => ({ time: T[i], open: r.o, high: r.h, low: r.l, close: r.c })));
  const baseMk = pickI >= 0 ? [{ time: T[pickI], position: 'aboveBar', shape: 'arrowDown', color: ORG, text: '선정', size: 1.6 }] : [];
  const candleMk = LW.createSeriesMarkers(candle, baseMk);
  candle.createPriceLine({ price: s.close, color: ENT, lineWidth: 2, lineStyle: LW.LineStyle.Solid, axisLabelVisible: true, title: '진입가' });
  const stopLv = levelOf(s, '손절');      // 축에는 현재가·진입가·손절만 상시 표시
  if (stopLv) candle.createPriceLine({ price: stopLv.price, color: DARK ? '#E5E7EB' : '#111111', lineWidth: 1, lineStyle: LW.LineStyle.SparseDotted, axisLabelVisible: true, title: '손절' });
  add({ g: 'candle', kind: 'candle', series: candle });
  // 이동평균
  const maVal = {};
  for (const n of [5, 20, 60, 120]) {
    const v = sma(C, n); maVal[n] = v;
    const sr = chart.addSeries(LW.LineSeries, { color: MAC[n], lineWidth: n >= 60 ? 2 : 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, priceFormat: pxFmt }, 0);
    sr.setData(v.map((x, i) => x == null ? { time: T[i] } : { time: T[i], value: x }));
    add({ g: 'ma' + n, kind: 'line', series: sr, color: MAC[n], w: n >= 60 ? 2 : 1 });
  }
  // 거래량 + 20일 평균
  const volFmt = { type: 'custom', minMove: 1, formatter: v => v >= 1e4 ? Math.round(v / 1e4).toLocaleString('ko-KR') + '만' : Math.round(v).toString() };
  const vol = chart.addSeries(LW.HistogramSeries, { priceFormat: volFmt, priceLineVisible: false, lastValueVisible: false }, 1);
  const volData = a => rows.map((r, i) => ({ time: T[i], value: r.v, color: alpha(r.c >= r.o ? UP : DN, a) }));
  vol.setData(volData(0.75));
  add({ g: 'vol', kind: 'vol', series: vol, volData, pane: 1 });
  const v20 = rows.map((_, i) => i >= 20 ? rows.slice(i - 20, i).reduce((a, x) => a + x.v, 0) / 20 : null);
  const vma = chart.addSeries(LW.LineSeries, { color: '#F08A00', lineWidth: 1, priceFormat: volFmt, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }, 1);
  vma.setData(v20.map((x, i) => x == null ? { time: T[i] } : { time: T[i], value: x }));
  add({ g: 'vol', kind: 'line', series: vma, color: '#F08A00', w: 1, pane: 1 });
  // RSI
  const rsFmt = { type: 'custom', minMove: 0.1, formatter: v => v.toFixed(1) };
  const rv = rsi(C);
  const rs = chart.addSeries(LW.LineSeries, { color: RSIC, lineWidth: 2, priceFormat: rsFmt, priceLineVisible: false, lastValueVisible: true }, 2);
  rs.setData(rv.map((x, i) => x == null ? { time: T[i] } : { time: T[i], value: x }));
  for (const y of [70, 30]) rs.createPriceLine({ price: y, color: '#9CA3AF', lineWidth: 1, lineStyle: LW.LineStyle.Dashed, axisLabelVisible: true, title: '' });
  add({ g: 'rsi', kind: 'line', series: rs, color: RSIC, w: 2, pane: 2 });
  try { const ps = chart.panes(); ps[0].setStretchFactor(4); ps[1].setStretchFactor(1); ps[2].setStretchFactor(1.1); } catch (e) { /* 이전 버전 호환 */ }

  // 작도
  // 분봉에서는 가로선 작도(피보나치·넥라인·목표선 등)만 화면 전체 폭으로 — 날짜로 찍은 사선·표시는 1D에서만
  const flat = it => it.k === 'line' && !(it.pane > 0) && (it.pts || []).length > 1 && it.pts.every(q => q[1] === it.pts[0][1]);
  const groups = !ID ? (s.groups || []) : (s.groups || []).map(g => ({ ...g, items: (g.items || []).filter(flat).map(it => ({ ...it, marks: null, pts: [[T[0], it.pts[0][1]], [T[N - 1], it.pts[0][1]]] })) })).filter(g => g.items.length);
  groups.forEach(g => (g.items || []).forEach((it, k) => {
    const key = g.id + ':' + k;
    const pts = dedupe((it.pts || []).map(([d, v]) => ({ time: ID ? d : tm(d), value: v })));
    let sr;
    if (it.k === 'hist') {
      sr = chart.addSeries(LW.HistogramSeries, { color: it.color, priceFormat: volFmt, priceLineVisible: false, lastValueVisible: false }, it.pane || 1);
      sr.setData(pts);
      add({ g: g.id, item: key, kind: 'hist', series: sr, color: it.color, marks: it.marks, pane: it.pane || 1 });
    } else {
      sr = chart.addSeries(LW.LineSeries, {
        color: it.color, lineWidth: it.w || 1, lineStyle: it.dash ? LW.LineStyle.Dashed : LW.LineStyle.Solid, priceLineVisible: false,
        lastValueVisible: false, title: '', crosshairMarkerVisible: false, pointMarkersVisible: false,
        priceFormat: it.pane === 2 ? rsFmt : pxFmt,
      }, it.pane || 0);
      sr.setData(pts);
      add({ g: g.id, item: key, kind: 'line', series: sr, color: it.color, w: it.w || 1, marks: it.marks, pane: it.pane || 0,
        axis: !!it.axis && !(it.pane > 0), label: String(it.label || ''), pts });
    }
    const e = reg[reg.length - 1];
    if (it.marks && it.marks.length) {
      e.mk = it.marks.filter(m => idx.has(tm(m.d))).map(m => ({ time: tm(m.d), position: POS[m.pos] || 'aboveBar', shape: m.shape || 'circle', color: m.color || it.color, text: m.text || '', size: 1 }))
        .sort((a, b) => a.time < b.time ? -1 : 1);
      e.mkApi = LW.createSeriesMarkers(sr, e.mk);
    }
  }));

  // 상태 바꾸기
  function paint(e, st) {      // st: norm | dim | hi
    if (e.hidden) return;
    if (e.kind === 'candle') {
      const a = st === 'dim' ? 0.28 : 1;
      e.series.applyOptions({ upColor: alpha(UP, a), downColor: alpha(DN, a), borderUpColor: alpha(UP, a), borderDownColor: alpha(DN, a), wickUpColor: alpha(UP, a), wickDownColor: alpha(DN, a) });
    } else if (e.kind === 'vol') {
      e.series.setData(e.volData(st === 'dim' ? 0.18 : 0.75));
    } else if (e.kind === 'hist') {
      e.series.applyOptions({ color: st === 'dim' ? alpha(e.color, 0.15) : e.color });
    } else if (e.kind === 'line') {
      e.series.applyOptions({ color: st === 'dim' ? alpha(e.color, 0.12) : e.color, lineWidth: st === 'hi' ? Math.min(4, e.w + 2) : e.w });
    }
    if (e.mkApi) e.mkApi.setMarkers(st === 'dim' ? e.mk.map(m => ({ ...m, color: alpha(m.color, 0.15) })) : e.mk);
    if (e.lab) e.lab.style.opacity = st === 'dim' ? 0.15 : 1;
    if (e.axis) { const ax = st === 'hi' && !ZON; e.series.applyOptions({ lastValueVisible: ax, title: ax ? e.label : '' }); }   // 강조한 작도만 축에 (근거 확대 중엔 큰 가격표가 대신)
  }
  const focus = pred => reg.forEach(e => paint(e, pred(e) ? 'hi' : 'dim'));
  const unfocus = () => reg.forEach(e => paint(e, 'norm'));
  function show(g, on) {
    reg.filter(e => e.g === g).forEach(e => {
      e.hidden = !on; e.series.applyOptions({ visible: on });
      if (e.mkApi) e.mkApi.setMarkers(on ? e.mk : []);
      if (e.lab) e.lab.style.display = on ? '' : 'none';
      if (on) paint(e, 'norm');
    });
    fitPanes(); sched();
  }
  // 지표(거래량·RSI)를 끄면 그 칸을 통째로 접어 캔들 칸을 넓힘 (급증·다이버전스 작도만으로는 칸을 남기지 않음)
  const PSF = [4, 1, 1.1];
  function fitPanes() {
    try {
      chart.panes().forEach((p, i) => { if (i) p.setStretchFactor(reg.some(e => e.pane === i && !e.item && !e.hidden) ? PSF[i] : 0.0001); });
    } catch (e) { /* 이전 버전 */ }
  }

  // 작도 이름표: 축 대신 선 위에 작게 (피보나치는 선 왼쪽, 나머지는 선 오른쪽 끝 바깥 빈 곳 — 캔들과 안 겹치게)
  const ovl = document.createElement('div'); ovl.className = 'ovl'; box.appendChild(ovl);
  const labs = reg.filter(e => e.axis && e.pts && e.pts.length);
  labs.forEach(e => {
    e.side = e.g === 'fib' ? 'l' : 'r';
    const v = e.pts[e.pts.length - 1].value;
    e.lab = document.createElement('span'); e.lab.className = e.side;
    e.lab.style.color = e.color; e.lab.textContent = `${e.label} ${fmt(Math.round(v))}`;
    ovl.appendChild(e.lab);
  });
  ovl.style.setProperty('--halo', TH.bg);
  if (labs.some(e => e.side === 'r')) chart.timeScale().applyOptions({ rightOffset: 16 });   // 오른쪽 이름표 자리
  let rafP = 0, zoomDraw = null, ZON = null;
  function sched() { if (!rafP) rafP = requestAnimationFrame(() => { rafP = 0; place(); }); }
  function place() {
    const ts = chart.timeScale(), W = ts.width();
    let H = box.clientHeight; try { H = chart.panes()[0].getHeight(); } catch (e) { /* 이전 버전 */ }
    ovl.style.width = W + 'px'; ovl.style.height = H + 'px';
    const side = { l: [], r: [] };
    labs.forEach(e => {
      if (e.hidden) return;
      const p = e.side === 'l' ? e.pts[0] : e.pts[e.pts.length - 1];
      const y = e.series.priceToCoordinate(p.value);
      let x = ts.timeToCoordinate(p.time);
      if (x == null) x = e.side === 'l' ? 0 : W;
      let out = false;
      if (e.side === 'l') x = Math.max(4, x + 2);
      else { out = x + 6 + e.lab.offsetWidth <= W - 2; x = out ? x + 6 : Math.min(W - 4, x - 2); }   // 선 끝 오른쪽 빈 곳에 자리가 있으면 거기, 없으면 선 위
      e.lab.classList.toggle('o', out);
      if (y == null || y < 0 || y > H) { e.lab.style.visibility = 'hidden'; return; }
      e.lab.style.visibility = ''; side[e.side].push({ e, x, y });
    });
    for (const a of Object.values(side)) {      // 같은 쪽끼리 겹치면 살짝 아래로
      a.sort((p, q) => p.y - q.y);
      a.forEach((o, i) => { if (i && o.y < a[i - 1].y + 12) o.y = a[i - 1].y + 12; o.e.lab.style.left = o.x + 'px'; o.e.lab.style.top = o.y + 'px'; });
    }
    if (zoomDraw) zoomDraw(ts, W, H);
  }
  chart.timeScale().subscribeVisibleLogicalRangeChange(sched);
  chart.timeScale().subscribeSizeChange(sched);
  box.addEventListener('wheel', sched, { passive: true });
  box.addEventListener('pointermove', ev => { if (ev.buttons) sched(); });
  ['pointerup', 'dblclick'].forEach(t => box.addEventListener(t, () => setTimeout(sched, 30)));
  if (window.ResizeObserver) new ResizeObserver(sched).observe(box);

  // 옆 패널 (토글 + 강조)
  const subsHtml = g => (g.items || []).length > 1 ? `<div class="subs">${g.items.map((it, k) => `<span class="sub" data-i="${g.id}:${k}" style="border-color:${it.color}">${esc(it.sub || it.label || '')}</span>`).join('')}</div>` : '';
  const ml = n => ID ? `MA${n}` : `${n}일선`;
  const base = [['ma5', ml(5), MAC[5]], ['ma20', ml(20), MAC[20]], ['ma60', ml(60), MAC[60]], ['ma120', ml(120), MAC[120]], ['vol', ID ? '거래량 · 20봉 평균' : '거래량 · 20일 평균', '#F08A00'], ['rsi', 'RSI(14) · 30/70', RSIC]];
  side.innerHTML = `
    <div class="mt">${[['draw', '작도'], ['ind', '지표']].map(([k, t]) => `<button type="button" class="msw on" data-sec="${k}" role="switch" aria-checked="true" title="${t} 전부 켜기/끄기">${t}<span class="tr"></span></button>`).join('')}</div>
    <h3>작도 — 마우스 올리면 강조</h3>
    ${groups.length ? groups.map(g => `<div class="grp" data-sec="draw" data-g="${g.id}" title="${esc(g.note || '')}"><label class="row"><input type="checkbox" checked data-g="${g.id}"><span class="sw" style="background:${g.color}"></span><span class="lab">${esc(g.label)}</span></label>
      <div class="note">${esc(g.note || '')}</div>${subsHtml(g)}</div>`).join('') : '<div class="hint">이날 유효한 작도 없음</div>'}
    <h3>지표</h3>
    ${base.map(([id, lab, col]) => `<div class="grp" data-sec="ind" data-g="${id}"><label class="row"><input type="checkbox" checked data-g="${id}"><span class="sw" style="background:${col}"></span><span class="lab">${lab}</span></label></div>`).join('')}
    <div class="grp" data-g="levels"><label class="row"><input type="checkbox" data-lv="1"><span class="sw" style="background:#111"></span><span class="lab">볼 가격대 선 (지지·저항·손절·목표)</span></label></div>
    <h3>보기</h3>
    <div class="hint">드래그 = 좌우 이동 · 휠 = 확대/축소 · 가격축 드래그 = 세로 확대<br>
      <span class="tfs">${TFS.map(([k, t]) => `<button data-tf="${k}" class="${k === tf ? 'on' : ''}">${t}</button>`).join('')}</span>
      <span class="tfs rng">${(ID ? [['1주', 5], ['1달', 21], ['3달', 60]].map(([t, d]) => [t, d * TFPD[tf]]) : [['3개월', 66], ['6개월', 130], ['1년', 260]]).map(([t, n]) => `<button data-r="${n}">${t}</button>`).join('')}</span></div>`;
  const secCbs = sec => [...side.querySelectorAll(`.grp[data-sec="${sec}"] input[data-g]`)];
  const syncSw = () => side.querySelectorAll('.msw').forEach(b => {      // 하나라도 켜져 있으면 켬
    const on = secCbs(b.dataset.sec).some(cb => cb.checked);
    b.classList.toggle('on', on); b.setAttribute('aria-checked', on);
  });
  side.querySelectorAll('input[data-g]').forEach(cb => cb.onchange = () => { show(cb.dataset.g, cb.checked); syncSw(); });
  side.querySelectorAll('.msw').forEach(b => b.onclick = () => {      // 작도·지표 전체 스위치
    const on = !b.classList.contains('on');
    secCbs(b.dataset.sec).forEach(cb => { if (cb.checked !== on) { cb.checked = on; show(cb.dataset.g, on); } });
    syncSw();
  });
  syncSw();
  side.querySelectorAll('.grp[data-g]').forEach(div => {
    const g = div.dataset.g; if (g === 'levels') return;
    div.onmouseenter = () => { if (!div.querySelector('input').checked) return; focus(e => e.g === g); };
    div.onmouseleave = unfocus;
  });
  side.querySelectorAll('.sub[data-i]').forEach(sp => {
    sp.onmouseenter = ev => { ev.stopPropagation(); const k = sp.dataset.i; focus(e => e.item === k); };
    sp.onmouseleave = () => { const g = sp.dataset.i.split(':')[0]; focus(e => e.g === g); };
  });
  side.querySelectorAll('button[data-tf]').forEach(b => b.onclick = () => { if (b.dataset.tf !== tf) setTF(el, s, b.dataset.tf); });
  const RLAB = labs.some(e => e.side === 'r');
  const range = n => chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, N - n), to: N + (RLAB ? Math.max(8, Math.round(n * .14)) : 5) });   // 오른쪽 작도 이름표 자리 (보이는 봉 수의 14%)
  side.querySelectorAll('button[data-r]').forEach(b => b.onclick = () => range(+b.dataset.r));

  // 볼 가격대: 토글(전부) + 행 마우스 오버(하나 강조)
  const tbl = el.querySelector('.lvt'); const lv = tbl ? JSON.parse(tbl.dataset.lv) : [];
  const lvColor = k => ({ res: UP, sup: DN, stop: DARK ? '#E5E7EB' : '#111111', tgt: '#13A35B', cur: ORG, base: ENT }[kcls(k)]);
  let allPL = [], hovPL = null;
  side.querySelector('input[data-lv]').onchange = ev => {
    allPL.forEach(p => candle.removePriceLine(p)); allPL = [];
    if (ev.target.checked) allPL = lv.filter(l => l.kind !== '현재가' && l.kind !== '진입가' && l.kind !== '손절').map(l => candle.createPriceLine({ price: l.price, color: lvColor(l.kind), lineWidth: 1, lineStyle: LW.LineStyle.SparseDotted, axisLabelVisible: true, title: l.kind }));
  };
  if (tbl) tbl.querySelectorAll('tr[data-j]').forEach(tr => {
    tr.onmouseenter = () => {
      const l = lv[+tr.dataset.j];
      hovPL = candle.createPriceLine({ price: l.price, color: lvColor(l.kind), lineWidth: 2, lineStyle: LW.LineStyle.Dashed, axisLabelVisible: true, title: `${l.kind} ${l.basis}`.slice(0, 22) });
      focus(e => e.g === 'candle');
    };
    tr.onmouseleave = () => { if (hovPL) candle.removePriceLine(hovPL); hovPL = null; unfocus(); };
  });

  // 왜 주목하나 · 체크 포인트 → 문장이 가리키는 작도·가격을 강조
  const RR = ID ? s.rows : rows, NR = RR.length;      // 20일 고점·52주 최저 등은 늘 일봉 기준
  const hiN = Math.max(...RR.slice(NR - 21, NR - 1).map(r => r.h)), loAll = Math.min(...RR.map(r => r.l)), hiAll = Math.max(...RR.map(r => r.h));
  const has = g => reg.some(e => e.g === g);
  function targets(txt) {
    const g = new Set(), items = new Set(), prices = []; let wick = null, inv = false;
    const fibItems = reg.filter(e => e.g === 'fib' && e.item);
    const lvs = [...txt.matchAll(/(?<![\d.])(0\.236|0\.382|0\.5|0\.618|0\.786)(?!\d)/g)].map(m => m[1]);
    if (/피보나치|되돌림/.test(txt) || lvs.length) {
      const fg = groups.find(x => x.id === 'fib');
      if (fg && lvs.length) fg.items.forEach((it, k) => { if (lvs.includes(String(it.label))) items.add('fib:' + k); });
      else if (fibItems.length) g.add('fib');
    }
    if (/엘리엇|[0-9]파|A-B-C|ABC|조정/.test(txt) && has('elliott')) g.add('elliott');
    if (/채널/.test(txt) && has('channel')) {      // 상단·중단·하단 중 문장이 말하는 선만
      const cg = groups.find(x => x.id === 'channel'), w = (txt.match(/상단|중단|하단/) || [])[0];
      const k = w && cg ? cg.items.findIndex(it => String(it.label).includes(w)) : -1;
      if (k >= 0) items.add('channel:' + k); else g.add('channel');
    }
    if (/윗꼬리|아랫꼬리/.test(txt) && pickI >= 0) wick = /아랫꼬리/.test(txt) ? 'lo' : 'hi';
    const room = (s.items || []).find(i => i.k === 'room');
    if (/저항/.test(txt) && room && parseFloat(room.val)) prices.push([Math.round(s.close * (1 + parseFloat(room.val) / 100)), `위 저항 ${room.val}`]);
    if (/외국인|기관|순매수|순매도|수급/.test(txt)) inv = true;
    if (/추세선/.test(txt) && has('trend')) g.add('trend');
    if (/이중바닥|쌍바닥|W자|넥라인|바닥/.test(txt) && has('dbottom')) g.add('dbottom');
    if (/다이버전스/.test(txt) && has('div')) g.add('div');
    if (/RSI|과매도|과열/.test(txt)) g.add('rsi');
    if (/거래량/.test(txt)) { g.add('vol'); if (has('volx')) g.add('volx'); }
    for (const m of txt.matchAll(/(5|20|60|120)일선/g)) { g.add('ma' + m[1]); if (m[1] === '60' && has('ma60')) g.add('ma60'); }
    if (/정배열/.test(txt)) ['ma5', 'ma20', 'ma60'].forEach(x => g.add(x));
    if (/20일 고점/.test(txt)) prices.push([hiN, '20일 고점']);
    if (/52주 최저|1년 저점/.test(txt)) prices.push([loAll, '52주 최저']);
    if (/1년 고점|52주 최고/.test(txt)) prices.push([hiAll, '1년 고점']);
    for (const m of txt.matchAll(/(\d{1,3}(?:,\d{3})+|\d{4,7})(?!\s*(?:억|%|배|만|주|일|년|원 규모|개))/g)) {
      const v = +m[1].replace(/,/g, '');
      if (v >= loAll * 0.6 && v <= hiAll * 1.4 && !/^20[0-9]{2}$/.test(m[1])) prices.push([v, m[1]]);
    }
    return { g, items, prices, wick, inv };
  }
  // 선정일 캔들(분봉이면 그날 고가·저가가 나온 봉)과 꼬리 가격
  const pd = s.rows[s.rows.length - 1], pdBody = [Math.max(pd.o, pd.c), Math.min(pd.o, pd.c)];
  const pdBar = w => {
    if (!ID) return pickI;
    const d0 = Date.UTC(+pd.d.slice(0, 4), +pd.d.slice(4, 6) - 1, +pd.d.slice(6, 8)) / 1000;
    let b = pickI; rows.forEach((r, i) => { if (r.t >= d0 && i <= pickI && (w === 'lo' ? r.l < rows[b].l : r.h > rows[b].h)) b = i; });
    return b;
  };
  const CDL = DARK ? '#F472B6' : '#BE185D';      // 캔들 칩 색
  const invPn = el.querySelector('.p-inv');

  // ── 근거 확대 시안 (?zm=a 확대만 · b 확대+말풍선 · c 확대+말풍선+바깥 어둡게) ──
  function zoneOf(tg, txt) {
    let a = Infinity, b = -Infinity, c0 = Infinity, c1 = -Infinity, anchor = null, note = '';
    const tags = [], ps = [], P = pickI >= 0 ? pickI : N - 1;
    const span = (i, j, k0 = i, k1 = j) => { a = Math.min(a, i); b = Math.max(b, j); c0 = Math.min(c0, k0); c1 = Math.max(c1, k1); };   // 보여 줄 구간 · 핵심 구간
    if (tg.wick) {
      const i = pdBar(tg.wick), hi = tg.wick === 'hi', wv = (s.items || []).find(x => x.k === 'wick');
      span(i - 16, i + 3, i, i); ps.push(pd.h, pd.l); tags.push([hi ? pd.h : pd.l, CDL, hi ? '고가' : '저가'], [hi ? pdBody[0] : pdBody[1], CDL, '몸통']);
      anchor = [i, hi ? pd.h : pd.l];
      note = `${hi ? '윗' : '아랫'}꼬리 ${fmt(hi ? pd.h - pdBody[0] : pdBody[1] - pd.l)}원${hi && wv ? ` · 하루 폭의 ${wv.val}` : ''}`;
    }
    reg.forEach(e => {
      if (!e.pts || !(tg.g.has(e.g) || tg.items.has(e.item))) return;
      const is = e.pts.map(p => idx.get(p.time)).filter(i => i != null); if (!is.length) return;
      span(Math.min(...is), Math.max(P, ...is));
      if (!(e.pane > 0) && e.label && e.axis) tags.push([e.pts[e.pts.length - 1].value, e.color, e.label]);
      if (!anchor && !(e.pane > 0) && e.label) { const p = e.pts[e.pts.length - 1]; anchor = [Math.min(N - 1, idx.get(p.time) ?? P), p.value]; note = `${e.label} ${fmt(Math.round(p.value))}${e.g === 'channel' ? ` · 종가 ${fmt(rows[P].c)}` : ''}`; }
    });
    for (const gk of tg.g) {
      const m = /^ma(\d+)$/.exec(gk);
      if (m) { const v = maVal[m[1]][P]; if (v == null) continue; span(P - 40, P + 2, P - 2, P); ps.push(v); tags.push([v, MAC[m[1]], ml(m[1])]); if (!anchor) { anchor = [P, v]; note = `${ml(m[1])} ${fmt(Math.round(v))} → 종가 ${fmt(rows[P].c)}`; } }
      else if (gk === 'vol' || gk === 'rsi') span(P - 40, P + 2, P - 1, P);
    }
    tg.prices.forEach(([v, t]) => { span(P - 30, N - 1, P - 30, N - 1); ps.push(v); tags.push([v, ORG, t]); if (!anchor) { anchor = [N - 1, v]; note = `${t} ${fmt(v)}`; } });
    if (a === Infinity) return null;
    const MIN = ID ? 26 : 24;
    if (b - a < MIN) { const c = (a + b) / 2; a = c - MIN / 2; b = c + MIN / 2; }
    a = Math.max(0, Math.round(a)); b = Math.min(N - 1, Math.round(b));
    if (!anchor) anchor = [P, rows[P].h];
    // 세로: 보여 줄 구간의 봉 + 꼭 넣을 가격, 위아래 여유
    let lo = Math.min(...ps, anchor[1]), hi = Math.max(...ps, anchor[1]);
    for (let i = a; i <= b; i++) { lo = Math.min(lo, rows[i].l); hi = Math.max(hi, rows[i].h); }
    const pv = (hi - lo) || hi * .02;
    return { a, b, c0: Math.max(a, c0), c1: Math.min(b, c1), lo: lo - pv * .1, hi: hi + pv * .22, anchor, tags, note: note || chipOf(txt).body };
  }
  let tw = 0, saved = null, leaveT = 0;
  const ease = t => 1 - Math.pow(1 - t, 3);      // 처음에 빠르게 붙고 끝에 살짝 감속 (굼뜨지 않게)
  const PS = chart.priceScale('right');
  function tween(to, py, ms = 240, done) {      // 가로(봉 구간)·세로(가격 범위)를 같이 부드럽게
    cancelAnimationFrame(tw);
    const ts = chart.timeScale(), fr = ts.getVisibleLogicalRange(); if (!fr) return;
    const fp = py && PS.getVisibleRange ? PS.getVisibleRange() : null;
    if (fp) PS.setAutoScale(false);
    const t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / ms), q = ease(k);
      ts.setVisibleLogicalRange({ from: fr.from + (to.from - fr.from) * q, to: fr.to + (to.to - fr.to) * q });
      if (fp) PS.setVisibleRange({ from: fp.from + (py.from - fp.from) * q, to: fp.to + (py.to - fp.to) * q });
      sched();      // 세로 범위만 바뀌어도 큰 가격표·말풍선이 따라가게 (차트가 그린 다음 프레임에 자리 잡음)
      if (k < 1) tw = requestAnimationFrame(step); else { setTimeout(sched, 40); if (done) done(); } };
    tw = requestAnimationFrame(step);
  }
  const zd = document.createElement('div'), zc = document.createElement('div'), zl = document.createElement('div'), zr = document.createElement('div');
  zd.className = 'zd'; zc.className = 'zc'; zl.className = zr.className = 'zsh';
  if (ZM) ovl.prepend(zl, zr), ovl.append(zd, zc);
  const axo = document.createElement('div'); axo.className = 'axo'; if (ZM) box.appendChild(axo);   // 가격축 위 큰 가격표 (1.5배)
  zoomDraw = (ts, W, H) => {
    const on = !!ZON;
    axo.style.left = W + 'px'; axo.style.height = H + 'px'; axo.style.width = PS.width() + 'px';
    let py = -99;      // 큰 가격표끼리 겹치면 아래 것을 살짝 내림
    [...axo.children].map(d => ({ d, y: candle.priceToCoordinate(+d.dataset.p) })).sort((p, q) => (p.y ?? 1e9) - (q.y ?? 1e9)).forEach(o => {
      if (o.y == null || o.y < 0 || o.y > H) { o.d.style.visibility = 'hidden'; return; }
      const y = Math.max(o.y, py + 23); py = y; o.d.style.top = y + 'px'; o.d.style.visibility = '';
    });
    zd.classList.toggle('on', on && ZM !== 'a'); zc.classList.toggle('on', on && ZM !== 'a');
    zl.classList.toggle('on', on && ZM === 'c'); zr.classList.toggle('on', on && ZM === 'c');
    if (!on) return;
    if (ZM !== 'a') {
      const x = ts.logicalToCoordinate(ZON.anchor[0]), y = candle.priceToCoordinate(ZON.anchor[1]);
      if (x == null || y == null || y < 0 || y > H) { zd.classList.remove('on'); zc.classList.remove('on'); }
      else {
        zd.style.left = zc.style.left = x + 'px'; zd.style.top = zc.style.top = y + 'px';
        zc.style.setProperty('--tx', x > W * .6 ? 'calc(-100% - 14px)' : '14px');
        zc.style.setProperty('--ty', y < 56 ? '10px' : 'calc(-100% - 10px)');
      }
    }
    if (ZM === 'c') {
      const x0 = ts.logicalToCoordinate(ZON.c0), x1 = ts.logicalToCoordinate(ZON.c1), sp = ts.logicalToCoordinate(ZON.c0 + 1) - x0 || 6;   // 정수 칸만 됨
      const xa = x0 == null ? null : x0 - sp * 1.2, xb = x1 == null ? null : x1 + sp * 1.2;   // 핵심 구간 바깥만 어둡게
      zl.style.width = Math.max(0, xa ?? 0) + 'px';
      zr.style.left = Math.min(W, xb ?? W) + 'px'; zr.style.width = Math.max(0, W - (xb ?? W)) + 'px';
    }
  };
  function zoomIn(z) {
    clearTimeout(leaveT);      // 바로 시작 (11/10 사용자: 대기 없이) — 다른 항목으로 옮기면 지금 화면에서 곧장 다음 구간으로
    if (!saved) saved = { t: chart.timeScale().getVisibleLogicalRange(), p: PS.getVisibleRange ? PS.getVisibleRange() : null };
    const w = z.b - z.a, pad = Math.max(3, w * .12);
    ZON = z; zc.innerHTML = `<b>${esc(z.note)}</b>`;
    axo.innerHTML = z.tags.map(([v, c, n]) => `<div data-p="${v}" style="background:${c}">${n ? `<small>${esc(n)}</small>` : ''}${fmt(Math.round(v))}</div>`).join('');
    tween({ from: z.a - pad, to: z.b + pad + (RLAB ? Math.max(6, w * .14) : 3) }, { from: z.lo, to: z.hi }, 300); place();
  }
  function zoomOut() {
    ZON = null; axo.innerHTML = ''; sched();
    leaveT = setTimeout(() => {      // 항목 사이를 옮겨 다닐 땐 원래 화면으로 안 돌아감
      if (!saved) return; const sv = saved; saved = null;
      tween(sv.t, sv.p, 300, () => { if (!saved) PS.setAutoScale(true); });
    }, 120);
  }

  let hlPL = [];
  el.querySelectorAll('[data-hl]').forEach(li => {
    const tg = targets(li.dataset.hl);
    if (!tg.g.size && !tg.items.size && !tg.prices.length && !tg.wick && !(tg.inv && invPn)) return;
    li.classList.add('can');
    const zn = ZM ? zoneOf(tg, li.dataset.hl) : null;
    li._zm = zn ? [() => zoomIn(zn), zoomOut] : null;      // 차트를 다시 그리면(30M↔1D) 새 차트 것으로 바뀜
    if (!li._zb) { li._zb = 1; li.addEventListener('mouseenter', () => li._zm && li._zm[0]()); li.addEventListener('mouseleave', () => li._zm && li._zm[1]()); }
    li.onmouseenter = () => {
      hlPL = tg.prices.map(([v, t]) => candle.createPriceLine({ price: v, color: ORG, lineWidth: 2, lineStyle: LW.LineStyle.Dashed, axisLabelVisible: !ZM, title: ZM ? '' : t }));      // 근거 확대 중엔 축에 큰 가격표(이름 포함)가 대신
      if (tg.wick) {      // 꼬리 끝 ~ 몸통 사이를 두 선으로 + 그 봉에 표시
        const hi = tg.wick === 'hi';
        hlPL.push(candle.createPriceLine({ price: hi ? pd.h : pd.l, color: CDL, lineWidth: 2, lineStyle: LW.LineStyle.Dashed, axisLabelVisible: !ZM, title: ZM ? '' : hi ? '고가(꼬리 끝)' : '저가(꼬리 끝)' }));
        hlPL.push(candle.createPriceLine({ price: hi ? pdBody[0] : pdBody[1], color: CDL, lineWidth: 1, lineStyle: LW.LineStyle.Dotted, axisLabelVisible: !ZM, title: ZM ? '' : '몸통' }));
        candleMk.setMarkers(baseMk.concat({ time: T[pdBar(tg.wick)], position: hi ? 'aboveBar' : 'belowBar', shape: 'circle', color: CDL, text: hi ? '윗꼬리' : '아랫꼬리', size: 1.3 }).sort((a, b) => a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
      }
      if (tg.inv && invPn) invPn.classList.add('flash');
      focus(e => e.g === 'candle' || tg.g.has(e.g) || tg.items.has(e.item));
    };
    li.onmouseleave = () => { hlPL.forEach(p => candle.removePriceLine(p)); hlPL = []; candleMk.setMarkers(baseMk); if (invPn) invPn.classList.remove('flash'); unfocus(); };
  });

  // 시고저종 표시
  function legend(i) {
    const r = rows[i], p = i > 0 ? rows[i - 1].c : r.o, ch = (r.c / p - 1) * 100;
    const mv = [5, 20, 60, 120].map(n => maVal[n][i] != null ? `<span class="mav" style="color:${MAC[n]}">${n} ${fmt(maVal[n][i])}</span>` : '').join('');
    ohlc.innerHTML = `<b>${ID ? tlab(r.t) : tm(r.d)}</b>${ID ? (i > pickI ? ' <span class="pk2">선정 후</span>' : '') : i === pickI ? ' <span class="pk">선정일</span>' : i > pickI ? ` <span class="pk2">선정 +${i - pickI}일${r.live ? ' · 진행 중' : ''}</span>` : ''} 시 ${fmt(r.o)} 고 <span class="up">${fmt(r.h)}</span> 저 <span class="dn">${fmt(r.l)}</span> 종 <b class="${cls(ch)}">${fmt(r.c)} (${pct(ch)})</b> · 거래량 ${fmt(r.v)}${mv}<span class="mav" style="color:${RSIC}">RSI ${rv[i] != null ? rv[i].toFixed(1) : '-'}</span>`;
  }
  legend(N - 1);
  chart.subscribeCrosshairMove(p => { const i = p && p.time ? idx.get(typeof p.time === 'number' || typeof p.time === 'string' ? p.time : `${p.time.year}-${String(p.time.month).padStart(2, '0')}-${String(p.time.day).padStart(2, '0')}`) : null; legend(i == null ? N - 1 : i); });
  range(130); sched();
  chart._el = el;
  return chart;
}
function dedupe(pts) {
  const m = new Map(); pts.forEach(p => m.set(p.time, p));
  return [...m.values()].sort((a, b) => a.time < b.time ? -1 : 1);
}

// ───────────────────────── 성과 · 아카이브 ─────────────────────────
function renderPerf() {
  const P = INDEX.perf || [];
  const H = ['1', '3', '5', '10'];
  $('#perfStats').innerHTML = H.map(h => {
    const v = P.map(p => p.perf && p.perf[h]).filter(x => x != null);
    if (!v.length) return `<div class="stat">${h}거래일 뒤 <b>-</b> <small>아직 없음</small></div>`;
    const avg = v.reduce((a, b) => a + b, 0) / v.length, win = v.filter(x => x > 0).length;
    return `<div class="stat">${h}거래일 뒤 평균 <b class="${cls(avg)}">${pct(avg)}</b> · 상승 ${win}/${v.length}</div>`;
  }).join('') + `<div class="stat">손절선 이탈 <b>${P.filter(p => p.stop_hit).length}</b>/${P.length}</div>`;
  const c = v => `<td class="${cls(v)}">${pct(v)}</td>`;
  $('#perfTbl').innerHTML = `<tr><th class="l">선정일</th><th class="l">종목</th><th>진입가</th><th>+1일</th><th>+3일</th><th>+5일</th><th>+10일</th><th>최고(10일)</th><th>최저(10일)</th><th>최근 종가</th><th>손절선</th><th class="l">상태</th></tr>` +
    (P.length ? P.map(p => {
      const st = p.stop_hit ? `<span class="tag stop">손절 이탈 ${md(p.stop_hit)}</span>` : p.done ? '<span class="tag end">10일 완료</span>' : `<span class="tag run">진행 ${p.last ? p.last.n : 0}일</span>`;
      const hot = p.last && p.last.ret >= 10 ? ' <span class="tag hot">급등</span>' : '';
      const pf = p.perf || {};
      return `<tr class="${p.stop_hit ? 'hit' : ''}"><td class="l"><a href="#${p.day}">${dname(p.day)}</a></td><td class="l nmcell">${logo(p.code, p.name, 18)}<b>${esc(p.name)}</b></td><td>${fmt(p.base)}</td>${c(pf['1'])}${c(pf['3'])}${c(pf['5'])}${c(pf['10'])}${c(p.max_up)}${c(p.max_dn)}
        <td>${p.last ? `${fmt(p.last.c)} <small class="${cls(p.last.ret)}">${pct(p.last.ret, 1)}</small>` : '-'}</td><td>${fmt(p.stop)}</td><td class="l">${st}${hot}</td></tr>`;
    }).join('') : '<tr><td class="l" colspan="12">아직 기록 없음</td></tr>');
  perfMini();
}
// 성과 칸 미니 차트: 진입 뒤 경로 (30분봉 있으면 30분봉, 없으면 일봉 종가) + 진입가·손절선·최고점
async function perfPath(p) {
  const end = Date.UTC(+p.day.slice(0, 4), +p.day.slice(4, 6) - 1, +p.day.slice(6, 8), 23) / 1000;
  const m = await minRows(p.code, '30');
  if (m) { const b = m.filter(x => x.t > end); if (b.length) return { src: '30분봉', pts: b.map(x => ({ d: new Date(x.t * 1000).getUTCDate(), c: x.c, h: x.h, l: x.l })) }; }
  const pts = (p.path || []).map(([d, o, h, l, c]) => ({ d: d, c, h, l }));
  const lv = LIVE && LIVE.prices && LIVE.prices[p.code], last = pts.length ? pts[pts.length - 1].d : p.day;
  if (lv && LIVE.date && LIVE.date.replace(/-/g, '') > last) pts.push({ d: LIVE.date, c: lv.p, h: lv.h, l: lv.l });
  return pts.length ? { src: '일봉', pts } : null;
}
function miniSVG(p, P) {
  const W = 240, H = 100, R = 44, b = p.base, r = v => (v / b - 1) * 100;
  const cs = [0, ...P.pts.map(x => r(x.c))], hs = P.pts.map(x => r(x.h)), st = p.stop ? r(p.stop) : null;
  const lo = Math.min(...cs, ...P.pts.map(x => r(x.l)), st ?? 0) - 1, hi0 = Math.max(...hs, 0), hi = hi0 + Math.max(2.5, (hi0 - lo) * .22);
  const y = v => (H - 5 - (v - lo) / (hi - lo) * (H - 12)).toFixed(1), n = cs.length - 1, x = i => (3 + i * (W - R - 6) / Math.max(n, 1)).toFixed(1);
  let g = '';
  if (P.src === '30분봉') P.pts.forEach((q, i) => { if (i && q.d !== P.pts[i - 1].d) g += `<line x1="${x(i + .5)}" x2="${x(i + .5)}" y1="0" y2="${H}" class="ms-d"/>`; });
  g += `<line x1="0" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" class="ms-0"/>`;
  if (st != null && st > lo) g += `<line x1="0" x2="${W - R}" y1="${y(st)}" y2="${y(st)}" class="ms-st"/>`;
  const now = cs[n], up = now >= 0;
  g += `<polyline points="${cs.map((v, i) => x(i) + ',' + y(v)).join(' ')}" class="ms-l ${up ? 'u' : 'd'}"/>`;
  const mx = Math.max(...hs), k = hs.indexOf(mx);
  if (mx > 0) { const X = +x(k + 1), lab = pct(mx, 1); const an = X < 34 ? 'start' : X > W - R - 34 ? 'end' : 'middle'; g += `<circle cx="${X}" cy="${y(mx)}" r="3.5" class="ms-pk"/><text x="${an === 'start' ? X - 3 : an === 'end' ? X + 3 : X}" y="${+y(mx) - 7}" text-anchor="${an}" class="ms-pt">최고 ${lab}</text>`; }
  g += `<circle cx="${x(n)}" cy="${y(now)}" r="3" class="ms-e ${up ? 'u' : 'd'}"/><text x="${+x(n) + 6}" y="${+y(now) + 4}" class="ms-nt ${up ? 'u' : 'd'}">${pct(now, 1)}</text>`;
  return { svg: `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(p.name)} 진입 뒤 경로">${g}</svg>`, now, mx };
}
let PMQ = 0;
async function perfMini() {
  const el = $('#perfMini'); if (!el) return; const P = INDEX.perf || [], q = ++PMQ;
  if (!P.length) { el.innerHTML = ''; return; }
  const cards = await Promise.all(P.map(async p => {
    const path = await perfPath(p);
    const st = p.stop_hit ? `<span class="tag stop">손절 이탈 ${md(p.stop_hit)}</span>` : p.done ? '<span class="tag end">10일 완료</span>' : '<span class="tag run">진행 중</span>';
    const head = `<div class="pm-h">${logo(p.code, p.name, 18)}<b>${esc(p.name)}</b><span class="pm-s" title="진입가">${md(p.day)} · ${fmt(p.base)}</span></div>`;
    if (!path) return `<a class="pm-c" href="#${p.day}">${head}<div class="pm-none">아직 진입 뒤 시세 없음</div><div class="pm-f">${st}</div></a>`;
    const S = miniSVG(p, path), days = new Set(path.pts.map(x => x.d)).size;
    return `<a class="pm-c" href="#${p.day}" title="${esc(p.name)} · ${path.src} 기준 · 남색 선 = 진입가, 파란 점선 = 손절 ${fmt(p.stop)}">${head}${S.svg}<div class="pm-f">${st}${S.mx >= 10 ? ' <span class="tag hot">+10% 터치</span>' : ''}<span class="pm-s">${days}일 · ${path.src}</span></div></a>`;
  }));
  if (q === PMQ) el.innerHTML = cards.join('');
}
function renderArchive(day) {
  $('#archList').innerHTML = INDEX.days.map(d => `<a href="#${d.day}" class="${d.day === day ? 'cur' : ''}"><span class="d">${dname(d.day)} 마감</span><br>${d.stocks.map(s => { const pf = (INDEX.perf || []).find(p => p.day === d.day && p.code === s.code), x = pf ? retNow(s.code, d.day, pf.base) : null;
    return `${logo(s.code, s.name, 15)}${esc(s.name)} <span class="${x ? cls(x.r) : ''}">${x ? pct(x.r) : '-'}</span>`; }).join(' · ')}<br><small class="al">진입 후 지금 등락</small></a>`).join('');
}

init();
