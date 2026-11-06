'use strict';
// 주식 한끼 BEST3 — 정적 사이트 (data/index.json, data/days/<날짜>.json 을 읽어 그림)
const LW = window.LightweightCharts;
const UP = '#E5202B', DN = '#1A5BD6', RSIC = '#8E44AD';
const MAC = { 5: '#D62FD0', 20: '#F08A00', 60: '#13A35B', 120: '#7A8494' };
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
async function getJSON(u) { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }

let INDEX = null, CUR = null, CHARTS = [];

async function init() {
  try { INDEX = await getJSON('data/index.json'); }
  catch (e) { $('#stocks').innerHTML = `<div class="empty">데이터를 불러오지 못했습니다 (${esc(e.message)})</div>`; return; }
  $('#updated').textContent = '갱신 ' + INDEX.updated;
  const sel = $('#daySel');
  sel.innerHTML = INDEX.days.map(d => `<option value="${d.day}">${dname(d.day)} 마감 · ${d.stocks.map(s => esc(s.name)).join(', ')}</option>`).join('');
  sel.onchange = () => { location.hash = sel.value; };
  window.addEventListener('hashchange', route);
  renderPerf();
  route();
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
  try { D = await getJSON(`data/days/${day}.json`); }
  catch (e) { $('#stocks').innerHTML = `<div class="empty">${day} 데이터가 없습니다</div>`; return; }
  const latest = day === INDEX.latest;
  $('#dayhead').innerHTML = `<h1>${dname(day)} 마감 기준 주목 종목 BEST3</h1><span class="meta">${latest ? '최신 · ' : '지난 날짜 · '}다음 거래일 장에서 볼 종목 · 생성 ${esc(D.made || '')}</span>`;
  $('#jump').innerHTML = D.stocks.map((s, i) => `<a href="javascript:void(0)" data-k="${i}"><span class="r">${i + 1}</span>${esc(s.name)} <span class="${cls(s.chg)}">${pct(s.chg)}</span></a>`).join('');
  $('#jump').querySelectorAll('a').forEach(a => a.onclick = () => document.getElementById('st' + a.dataset.k).scrollIntoView({ behavior: 'smooth' }));
  const box = $('#stocks'); box.innerHTML = '';
  D.stocks.forEach((s, i) => { const el = card(s, i); box.appendChild(el); CHARTS.push(buildChart(el, s)); });
  renderArchive(day);
  if (top) window.scrollTo({ top: 0 });
}

function card(s, i) {
  const el = document.createElement('section'); el.className = 'card'; el.id = 'st' + i;
  const p = s.price || {};
  const chips = [
    s.score != null && `<span class="chip">조건 점수 <b>${s.score}</b></span>`,
    s.vr != null && `<span class="chip">거래량 <b>${s.vr}배</b></span>`,
    s.rsi != null && `<span class="chip">RSI <b>${s.rsi}</b></span>`,
    p.per && `<span class="chip">PER <b>${(+p.per).toFixed(1)}</b></span>`,
    p.pbr && `<span class="chip">PBR <b>${(+p.pbr).toFixed(2)}</b></span>`,
    p.mcap_eok && `<span class="chip">시총 <b>${fmt(p.mcap_eok)}억</b></span>`,
  ].filter(Boolean).join('');
  el.innerHTML = `
  <div class="cardhead"><span class="rank">${i + 1}</span><span class="nm">${esc(s.name)}</span><span class="cd">${s.code} · ${esc(s.sector || '')}</span>
    <span class="px ${cls(s.chg)}">${fmt(s.close)} <small>${pct(s.chg)}</small></span><div class="chips">${chips}</div></div>
  <div class="chartrow"><div class="chartwrap"><div class="ohlc"></div><div class="chart"></div></div><div class="side"></div></div>
  <div class="panels">
    <div class="pn"><h4 class="why">왜 주목하나</h4><ul>${(s.why && s.why.length ? s.why : s.notes || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="pn"><h4 class="lv">볼 가격대 <small style="color:#6B7280;font-weight:400">(행에 마우스 → 차트 표시)</small></h4>${levelsTable(s)}
      ${s.watch && s.watch.length ? `<h4 class="lv" style="margin-top:10px">체크 포인트</h4><ul>${s.watch.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>
    <div class="pn"><h4 class="sd">수급 (순매수, 억 원)</h4>${invTable(s.inv || [])}</div>
    <div class="pn"><h4 class="nw">재료 · 관련 기사</h4>
      ${s.material && s.material.length ? `<ul class="mat">${s.material.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${newsList(s.news || [])}</div>
  </div>`;
  return el;
}

const KORD = { '목표': 0, '저항2': 1, '저항1': 2, '지지1': 3, '지지2': 4, '손절': 5 };
function kcls(k) { return k.startsWith('저항') ? 'res' : k.startsWith('지지') ? 'sup' : k === '손절' ? 'stop' : 'tgt'; }
function levelsTable(s) {
  const lv = (s.levels || []).slice().sort((a, b) => b.price - a.price || (KORD[a.kind] ?? 9) - (KORD[b.kind] ?? 9));
  if (!lv.length) return '<div class="hint">계산된 가격대 없음</div>';
  const C = s.close;
  const rows = lv.map((l, j) => `<tr data-j="${j}"><td><span class="k ${kcls(l.kind)}">${esc(l.kind)}</span></td><td>${fmt(l.price)}</td><td class="${cls(l.price - C)}">${pct((l.price / C - 1) * 100, 1)}</td><td class="b">${esc(l.basis)}</td></tr>`).join('');
  const stop = lv.find(l => l.kind === '손절'); const r1 = lv.filter(l => l.kind === '저항1')[0]; const tg = lv.filter(l => l.kind === '목표').sort((a, b) => a.price - b.price)[0];
  let rr = '';
  if (stop && (r1 || tg)) {
    const risk = (1 - stop.price / C) * 100;
    rr = `<div class="rr">손절까지 <b class="dn">-${risk.toFixed(1)}%</b>${r1 ? ` · 저항1까지 <b class="up">${pct((r1.price / C - 1) * 100, 1)}</b>` : ''}${tg ? ` · 첫 목표까지 <b class="up">${pct((tg.price / C - 1) * 100, 1)}</b> (손익비 ${((tg.price / C - 1) * 100 / risk).toFixed(1)})` : ''}</div>`;
  }
  return `<table class="lvt" data-lv='${esc(JSON.stringify(lv))}'><tr><th>구분</th><th>가격</th><th>현재가 대비</th><th style="text-align:left">근거</th></tr>${rows}</table>${rr}`;
}
function invTable(inv) {
  if (!inv.length) return '<div class="hint">수급 데이터 없음</div>';
  const r = inv.slice(0, 7);
  const sum = k => r.slice(0, 5).reduce((a, x) => a + (x[k] || 0), 0);
  const c = v => `<td class="${cls(v)}">${v > 0 ? '+' : ''}${fmt(v)}</td>`;
  return `<table class="inv"><tr><th>날짜</th><th>외국인</th><th>기관</th><th>개인</th></tr>
    ${r.map(x => `<tr><td>${md(x.d)}</td>${c(x.frgn)}${c(x.orgn)}${c(x.prsn)}</tr>`).join('')}
    <tr><td><b>5일 합</b></td>${c(sum('frgn'))}${c(sum('orgn'))}${c(sum('prsn'))}</tr></table>`;
}
function newsList(n) {
  if (!n.length) return '<div class="hint">기사 요약 준비 중</div>';
  return `<ul class="news">${n.map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a><span class="src">${esc(x.source || '')}${x.type === 'search' ? ' · 제목 검색' : ''}</span><div class="sm">${esc(x.summary || '')}</div></li>`).join('')}</ul>`;
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

function buildChart(el, s) {
  const box = el.querySelector('.chart'), side = el.querySelector('.side'), ohlc = el.querySelector('.ohlc');
  const rows = s.rows, T = rows.map(r => tm(r.d)), C = rows.map(r => r.c), N = rows.length;
  const idx = new Map(T.map((t, i) => [t, i]));
  const chart = LW.createChart(box, {
    autoSize: true,
    layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#4B5563', fontSize: 11, fontFamily: 'Malgun Gothic, Apple SD Gothic Neo, sans-serif',
      panes: { separatorColor: '#C9CDD4', separatorHoverColor: 'rgba(33,86,232,.12)', enableResize: true } },
    grid: { vertLines: { color: '#F0F1F4' }, horzLines: { color: '#F0F1F4' } },
    crosshair: { mode: LW.CrosshairMode.Normal },
    rightPriceScale: { borderColor: '#C9CDD4' },
    timeScale: { borderColor: '#C9CDD4', rightOffset: 6, barSpacing: 7, minBarSpacing: 1.5 },
    localization: { locale: 'ko-KR', dateFormat: 'yyyy-MM-dd' },
  });
  const pxFmt = { type: 'custom', minMove: 1, formatter: p => Math.round(p).toLocaleString('ko-KR') };
  const reg = [];   // {g, item, kind, series|pl, base, ...}
  const add = (e) => { reg.push(e); return e; };

  // 캔들
  const candle = chart.addSeries(LW.CandlestickSeries, { upColor: UP, downColor: DN, borderUpColor: UP, borderDownColor: DN, wickUpColor: UP, wickDownColor: DN, priceLineColor: UP, priceFormat: pxFmt }, 0);
  candle.setData(rows.map((r, i) => ({ time: T[i], open: r.o, high: r.h, low: r.l, close: r.c })));
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
  add({ g: 'vol', kind: 'vol', series: vol, volData });
  const v20 = rows.map((_, i) => i >= 20 ? rows.slice(i - 20, i).reduce((a, x) => a + x.v, 0) / 20 : null);
  const vma = chart.addSeries(LW.LineSeries, { color: '#F08A00', lineWidth: 1, priceFormat: volFmt, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }, 1);
  vma.setData(v20.map((x, i) => x == null ? { time: T[i] } : { time: T[i], value: x }));
  add({ g: 'vol', kind: 'line', series: vma, color: '#F08A00', w: 1 });
  // RSI
  const rsFmt = { type: 'custom', minMove: 0.1, formatter: v => v.toFixed(1) };
  const rv = rsi(C);
  const rs = chart.addSeries(LW.LineSeries, { color: RSIC, lineWidth: 2, priceFormat: rsFmt, priceLineVisible: false, lastValueVisible: true }, 2);
  rs.setData(rv.map((x, i) => x == null ? { time: T[i] } : { time: T[i], value: x }));
  for (const y of [70, 30]) rs.createPriceLine({ price: y, color: '#9CA3AF', lineWidth: 1, lineStyle: LW.LineStyle.Dashed, axisLabelVisible: true, title: '' });
  add({ g: 'rsi', kind: 'line', series: rs, color: RSIC, w: 2 });
  try { const ps = chart.panes(); ps[0].setStretchFactor(4); ps[1].setStretchFactor(1); ps[2].setStretchFactor(1.1); } catch (e) { /* 이전 버전 호환 */ }

  // 작도
  const groups = s.groups || [];
  groups.forEach(g => (g.items || []).forEach((it, k) => {
    const key = g.id + ':' + k;
    const pts = dedupe((it.pts || []).map(([d, v]) => ({ time: tm(d), value: v })));
    let sr;
    if (it.k === 'hist') {
      sr = chart.addSeries(LW.HistogramSeries, { color: it.color, priceFormat: volFmt, priceLineVisible: false, lastValueVisible: false }, it.pane || 1);
      sr.setData(pts);
      add({ g: g.id, item: key, kind: 'hist', series: sr, color: it.color, marks: it.marks });
    } else {
      sr = chart.addSeries(LW.LineSeries, {
        color: it.color, lineWidth: it.w || 1, lineStyle: it.dash ? LW.LineStyle.Dashed : LW.LineStyle.Solid, priceLineVisible: false,
        lastValueVisible: !!it.axis, title: it.axis ? (it.label || '') : '', crosshairMarkerVisible: false, pointMarkersVisible: false,
        priceFormat: it.pane === 2 ? rsFmt : pxFmt,
      }, it.pane || 0);
      sr.setData(pts);
      add({ g: g.id, item: key, kind: 'line', series: sr, color: it.color, w: it.w || 1, marks: it.marks });
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
  }
  const focus = pred => reg.forEach(e => paint(e, pred(e) ? 'hi' : 'dim'));
  const unfocus = () => reg.forEach(e => paint(e, 'norm'));
  function show(g, on) {
    reg.filter(e => e.g === g).forEach(e => {
      e.hidden = !on; e.series.applyOptions({ visible: on });
      if (e.mkApi) e.mkApi.setMarkers(on ? e.mk : []);
      if (on) paint(e, 'norm');
    });
  }

  // 옆 패널 (토글 + 강조)
  const subsHtml = g => (g.items || []).length > 1 ? `<div class="subs">${g.items.map((it, k) => `<span class="sub" data-i="${g.id}:${k}" style="border-color:${it.color}">${esc(it.sub || it.label || '')}</span>`).join('')}</div>` : '';
  const base = [['ma5', '5일선', MAC[5]], ['ma20', '20일선', MAC[20]], ['ma60', '60일선', MAC[60]], ['ma120', '120일선', MAC[120]], ['vol', '거래량 · 20일 평균', '#F08A00'], ['rsi', 'RSI(14) · 30/70', RSIC]];
  side.innerHTML = `
    <h3>작도 — 켜기/끄기 · 마우스 올리면 강조</h3>
    ${groups.length ? groups.map(g => `<div class="grp" data-g="${g.id}"><label class="row"><input type="checkbox" checked data-g="${g.id}"><span class="sw" style="background:${g.color}"></span><span class="lab">${esc(g.label)}</span></label>
      <div class="note">${esc(g.note || '')}</div>${subsHtml(g)}</div>`).join('') : '<div class="hint">이날 유효한 작도 없음</div>'}
    <h3>지표</h3>
    ${base.map(([id, lab, col]) => `<div class="grp" data-g="${id}"><label class="row"><input type="checkbox" checked data-g="${id}"><span class="sw" style="background:${col}"></span><span class="lab">${lab}</span></label></div>`).join('')}
    <div class="grp" data-g="levels"><label class="row"><input type="checkbox" data-lv="1"><span class="sw" style="background:#111"></span><span class="lab">볼 가격대 선 (지지·저항·손절·목표)</span></label></div>
    <h3>보기</h3>
    <div class="hint">드래그 = 좌우 이동 · 휠 = 확대/축소 · 가격축 드래그 = 세로 확대<br>
      <button data-r="66">3개월</button> <button data-r="130">6개월</button> <button data-r="260">1년</button></div>`;
  side.querySelectorAll('input[data-g]').forEach(cb => cb.onchange = () => show(cb.dataset.g, cb.checked));
  side.querySelectorAll('.grp[data-g]').forEach(div => {
    const g = div.dataset.g; if (g === 'levels') return;
    div.onmouseenter = () => { if (!div.querySelector('input').checked) return; focus(e => e.g === g); };
    div.onmouseleave = unfocus;
  });
  side.querySelectorAll('.sub[data-i]').forEach(sp => {
    sp.onmouseenter = ev => { ev.stopPropagation(); const k = sp.dataset.i; focus(e => e.item === k); };
    sp.onmouseleave = () => { const g = sp.dataset.i.split(':')[0]; focus(e => e.g === g); };
  });
  const range = n => chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, N - n), to: N + 5 });
  side.querySelectorAll('button[data-r]').forEach(b => b.onclick = () => range(+b.dataset.r));

  // 볼 가격대: 토글(전부) + 행 마우스 오버(하나 강조)
  const tbl = el.querySelector('.lvt'); const lv = tbl ? JSON.parse(tbl.dataset.lv) : [];
  const lvColor = k => ({ res: UP, sup: DN, stop: '#111111', tgt: '#13A35B' }[kcls(k)]);
  let allPL = [], hovPL = null;
  side.querySelector('input[data-lv]').onchange = ev => {
    allPL.forEach(p => candle.removePriceLine(p)); allPL = [];
    if (ev.target.checked) allPL = lv.map(l => candle.createPriceLine({ price: l.price, color: lvColor(l.kind), lineWidth: 1, lineStyle: LW.LineStyle.SparseDotted, axisLabelVisible: true, title: l.kind }));
  };
  if (tbl) tbl.querySelectorAll('tr[data-j]').forEach(tr => {
    tr.onmouseenter = () => {
      const l = lv[+tr.dataset.j];
      hovPL = candle.createPriceLine({ price: l.price, color: lvColor(l.kind), lineWidth: 2, lineStyle: LW.LineStyle.Dashed, axisLabelVisible: true, title: `${l.kind} ${l.basis}`.slice(0, 22) });
      focus(e => e.g === 'candle');
    };
    tr.onmouseleave = () => { if (hovPL) candle.removePriceLine(hovPL); hovPL = null; unfocus(); };
  });

  // 시고저종 표시
  function legend(i) {
    const r = rows[i], p = i > 0 ? rows[i - 1].c : r.o, ch = (r.c / p - 1) * 100;
    const mv = [5, 20, 60, 120].map(n => maVal[n][i] != null ? `<span class="mav" style="color:${MAC[n]}">${n} ${fmt(maVal[n][i])}</span>` : '').join('');
    ohlc.innerHTML = `<b>${tm(r.d)}</b> 시 ${fmt(r.o)} 고 <span class="up">${fmt(r.h)}</span> 저 <span class="dn">${fmt(r.l)}</span> 종 <b class="${cls(ch)}">${fmt(r.c)} (${pct(ch)})</b> · 거래량 ${fmt(r.v)}${mv}<span class="mav" style="color:${RSIC}">RSI ${rv[i] != null ? rv[i].toFixed(1) : '-'}</span>`;
  }
  legend(N - 1);
  chart.subscribeCrosshairMove(p => { const i = p && p.time ? idx.get(typeof p.time === 'string' ? p.time : `${p.time.year}-${String(p.time.month).padStart(2, '0')}-${String(p.time.day).padStart(2, '0')}`) : null; legend(i == null ? N - 1 : i); });
  range(130);
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
  $('#perfTbl').innerHTML = `<tr><th class="l">선정일</th><th class="l">종목</th><th>기준가</th><th>+1일</th><th>+3일</th><th>+5일</th><th>+10일</th><th>최고(10일)</th><th>최저(10일)</th><th>최근 종가</th><th>손절선</th><th class="l">상태</th></tr>` +
    (P.length ? P.map(p => {
      const st = p.stop_hit ? `<span class="tag stop">손절 이탈 ${md(p.stop_hit)}</span>` : p.done ? '<span class="tag end">10일 완료</span>' : `<span class="tag run">진행 ${p.last ? p.last.n : 0}일</span>`;
      const hot = p.last && p.last.ret >= 10 ? ' <span class="tag hot">급등</span>' : '';
      const pf = p.perf || {};
      return `<tr class="${p.stop_hit ? 'hit' : ''}"><td class="l"><a href="#${p.day}">${dname(p.day)}</a></td><td class="l"><b>${esc(p.name)}</b></td><td>${fmt(p.base)}</td>${c(pf['1'])}${c(pf['3'])}${c(pf['5'])}${c(pf['10'])}${c(p.max_up)}${c(p.max_dn)}
        <td>${p.last ? `${fmt(p.last.c)} <small class="${cls(p.last.ret)}">${pct(p.last.ret, 1)}</small>` : '-'}</td><td>${fmt(p.stop)}</td><td class="l">${st}${hot}</td></tr>`;
    }).join('') : '<tr><td class="l" colspan="12">아직 기록 없음</td></tr>');
}
function renderArchive(day) {
  $('#archList').innerHTML = INDEX.days.map(d => `<a href="#${d.day}" class="${d.day === day ? 'cur' : ''}"><span class="d">${dname(d.day)} 마감</span><br>${d.stocks.map(s => `${esc(s.name)} <span class="${cls(s.chg)}">${pct(s.chg)}</span>`).join(' · ')}</a>`).join('');
}

init();
