/* 내 포트폴리오 생성 — 회원 브리핑 팝업 (11/24)
   시장 날씨 배너 안 오른쪽 버튼 → 팝업에서 자유롭게 입력 → 브리핑 컴퓨터(data/brief.json 의 api 주소)가 만들어 PNG 돌려줌
   app.js·style.css 와 분리 (이 파일만 고치면 됨) */
(function () {
  const EDITOR = 'https://t.me/vuswlqwk';
  const SYM = 'pf_symbol.png', SAMPLE = 'pf_sample.jpg';
  const STEPS = ['요청 해석', '실시간 시세 조회', '시황·뉴스 분석', '브리핑 작성', '이미지 생성'];

  const css = `
/* ── 버튼: 시장 날씨 배너 안 오른쪽, 배너 높이 그대로 ── */
.mktrow{position:relative;margin:0 0 12px}
.mktrow>.mkt{margin:0;padding-right:196px}
@property --pfa{syntax:'<angle>';inherits:false;initial-value:0deg}
.pfb{position:absolute;right:9px;top:50%;transform:translateY(-50%);z-index:5;display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 6px 0 9px;border-radius:9px;
  border:1.6px solid transparent;color:#f3d488;font:800 13px/1 sans-serif;font-family:inherit;letter-spacing:-.2px;cursor:pointer;white-space:nowrap;
  /* 오로라: 부드러운 금·샴페인·로즈골드 빛이 테두리를 천천히 돌고, 바깥 빛도 함께 돈다 */
  background:linear-gradient(180deg,#1a2230,#0d131c) padding-box,
    conic-gradient(from var(--pfa),#5e461b 0deg,#a67c35 40deg,#f6d27a 85deg,#fff4d6 110deg,#e9b98f 140deg,#c9a24f 175deg,#5e461b 230deg,#8a6a2a 290deg,#d8b25e 330deg,#5e461b 360deg) border-box;
  animation:pfaur 7s linear infinite;transition:filter .25s}
@keyframes pfaur{
  0%{--pfa:0deg;box-shadow:0 -3px 12px rgba(246,210,122,.42),0 0 4px rgba(233,185,143,.25)}
  25%{box-shadow:5px 0 12px rgba(255,236,190,.42),0 0 4px rgba(246,210,122,.25)}
  50%{box-shadow:0 3px 12px rgba(233,185,143,.42),0 0 4px rgba(246,210,122,.25)}
  75%{box-shadow:-5px 0 12px rgba(246,210,122,.42),0 0 4px rgba(255,236,190,.25)}
  100%{--pfa:360deg;box-shadow:0 -3px 12px rgba(246,210,122,.42),0 0 4px rgba(233,185,143,.25)}}
.pfb:hover{filter:brightness(1.12)}
.pfb img{height:18px;width:auto;flex:none}
.pfb .pf-ai{font:800 10px/1 sans-serif;font-family:inherit;color:#fff;border:1.2px solid rgba(255,255,255,.85);border-radius:999px;padding:2px 5px 2px}
@media (prefers-reduced-motion:reduce){.pfb{animation:none}}
.mktrow:has(>.mkt[hidden]){display:flex;justify-content:flex-end}
.mktrow:has(>.mkt[hidden]) .pfb{position:static;transform:none}
@media (max-width:700px){.mktrow>.mkt{padding-right:14px}.mktrow{display:flex;flex-direction:column}.pfb{position:static;transform:none;align-self:flex-end;margin-top:6px}}

/* ── 팝업 ── */
.pfm{position:fixed;inset:0;z-index:200;background:rgba(6,10,18,.7);backdrop-filter:blur(3px);display:flex;align-items:flex-start;justify-content:center;padding:5vh 16px 16px;overflow:auto}
.pfm[hidden]{display:none}
.pfc{position:relative;width:min(980px,100%);display:grid;grid-template-columns:1fr 330px;background:#121a26;color:#e5e7eb;border:1px solid #2b3647;border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.55);overflow:hidden;font-size:15px}
.pfc .pf-l{padding:30px 32px 26px;min-width:0}
.pfc .pf-r{background:radial-gradient(120% 80% at 50% 0%,#1d2a3c,#0b111a);border-left:1px solid #243041;padding:22px 22px 18px;display:flex;flex-direction:column}
.pfc h3{display:flex;align-items:center;gap:11px;margin:0 0 6px;font-size:23px;color:#f1cf7a;letter-spacing:-.4px}
.pfc h3 img{height:33px;width:auto}
.pfc .pf-x{position:absolute;right:14px;top:12px;background:rgba(0,0,0,.25);border:0;color:#cbd5e1;font-size:22px;width:34px;height:34px;border-radius:50%;cursor:pointer;line-height:1;z-index:2}
.pfc .pf-sub{color:#9ca3af;font-size:14px;margin:0 0 16px;line-height:1.65}.pfc .pf-sub b{color:#e5c77e;font-weight:700}
.pfc textarea,.pfc input{width:100%;box-sizing:border-box;background:#0b111a;color:#f3f4f6;border:1px solid #334155;border-radius:12px;padding:15px 17px;font:16px/1.8 sans-serif;font-family:inherit;resize:vertical}
.pfc textarea{min-height:220px;word-break:keep-all}
.pfc textarea::placeholder,.pfc input::placeholder{color:#64707f}
.pfc textarea:focus,.pfc input:focus{outline:0;border-color:#d8b25e;box-shadow:0 0 0 3px rgba(216,178,94,.16)}
.pfc .pf-row{display:flex;gap:10px;align-items:center;margin-top:14px;flex-wrap:wrap}
.pfc .pf-cnt{color:#6b7280;font-size:12px;margin-right:auto}
.pfc .pf-go{background:linear-gradient(180deg,#f3d385,#c99a3e);color:#1a1405;border:0;border-radius:12px;padding:15px 30px;font:800 16px/1 sans-serif;font-family:inherit;cursor:pointer;box-shadow:0 6px 18px rgba(201,154,62,.25)}
.pfc .pf-go:disabled{opacity:.5;cursor:default}
.pfc .pf-ft{margin-top:12px;font-size:12.5px;color:#6b7280}
.pfc .pf-ghost{background:none;border:1px solid #475569;color:#e5e7eb;border-radius:11px;padding:12px 16px;font:700 14px/1 sans-serif;font-family:inherit;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.pfc .pf-ed{background:#229ED9;border-color:#229ED9;color:#fff}
.pfc .pf-tg{width:18px;height:18px;flex:none}
/* 완성: 저장 카드 2개(PNG·A4) + 아래 다시 만들기 */
.pfc .pf-cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
.pfc .pf-cards.one{grid-template-columns:1fr}
.pfc .pf-card{display:flex;gap:13px;align-items:center;text-align:left;padding:15px 16px;border-radius:14px;cursor:pointer;font-family:inherit;border:1.5px solid #3b4a60;background:#0b111a;color:#e5e7eb;transition:filter .2s,border-color .2s}
.pfc .pf-card:hover{filter:brightness(1.08);border-color:#d8b25e}
.pfc .pf-card.main{background:linear-gradient(180deg,#f3d385,#c99a3e);border-color:transparent;color:#1a1405;box-shadow:0 6px 18px rgba(201,154,62,.25)}
.pfc .pf-card:disabled{opacity:.6;cursor:default}
.pfc .pf-card .ic{flex:none;width:44px;height:44px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.14)}
.pfc .pf-card:not(.main) .ic{background:#162131;color:#f3d488;border:1px solid #2b3647}
.pfc .pf-card .ic svg{width:24px;height:24px}
.pfc .pf-card b{display:block;font-size:16px;font-weight:800;margin-bottom:3px}
.pfc .pf-card:not(.main) b{color:#f3d488}
.pfc .pf-card span.t{display:block;font-size:12.5px;opacity:.8;line-height:1.45}
.pfc .pf-card i{display:inline-block;font:800 10.5px/1 sans-serif;font-family:inherit;font-style:normal;background:#d8b25e;color:#1a1405;padding:3px 6px;border-radius:5px;margin-left:4px;vertical-align:2px}
.pfc .pf-again{width:100%;justify-content:center;margin-top:12px;padding:14px 16px;font-size:15px;border-color:#334155;color:#cbd5e1;background:rgba(255,255,255,.02)}
.pfc .pf-again:hover{border-color:#64748b;color:#fff}
.pfc .pf-again svg{width:17px;height:17px}
@media (max-width:520px){.pfc .pf-cards{grid-template-columns:1fr}}
.pfc .pf-st{margin-top:6px;padding:14px 16px;border-radius:12px;background:#0b111a;border:1px solid #243041;line-height:1.65}
.pfc .pf-err{border-color:#7f1d1d;background:#1f1214}
.pfc .pf-q{color:#f1cf7a;font-weight:700}
/* 오른쪽 예시·결과 */
.pfc .pf-rt{font-size:12.5px;color:#9ca3af;margin:0 0 10px;display:flex;align-items:center;gap:6px}
.pfc .pf-rt b{color:#e5c77e}
.pfc .pf-shot{flex:1;min-height:0;border-radius:10px;overflow:hidden;border:1px solid #2b3647;background:#fff;position:relative;max-height:520px}
.pfc .pf-shot img{width:100%;display:block}
.pfc .pf-shot.sample{max-height:470px}
.pfc .pf-shot.sample:not(.busy)::after{content:'예시 이미지';position:absolute;right:12px;bottom:12px;z-index:2;background:rgba(17,24,39,.78);color:#f1cf7a;font:800 11px/1 sans-serif;font-family:inherit;padding:5px 8px;border-radius:6px}
.pfc .pf-shot.sample::before{content:'';position:absolute;left:0;right:0;bottom:0;height:90px;background:linear-gradient(transparent,#0b111a);z-index:1}
.pfc .pf-shot.res{max-height:none;overflow:auto;cursor:zoom-in}
/* AI 제작 화면 */
.pfc .pf-ai-run{display:grid;grid-template-columns:170px 1fr;gap:34px;align-items:center;padding:14px 0 8px}
.pfc .pf-orb{position:relative;width:170px;height:170px}
/* 은은한 빛 고리: 얇고 옅고 천천히 */
.pfc .pf-orb .ring{position:absolute;inset:0;border-radius:50%;opacity:.42;background:conic-gradient(from var(--pfa),transparent 0 45%,rgba(246,210,122,.5) 65%,rgba(255,244,214,.85) 74%,rgba(233,185,143,.45) 82%,transparent 92%);
  -webkit-mask:radial-gradient(circle,transparent 67%,#000 68%,#000 69.5%,transparent 70.5%);mask:radial-gradient(circle,transparent 67%,#000 68%,#000 69.5%,transparent 70.5%);animation:pforb 6s linear infinite}
.pfc .pf-orb .ring.r2{inset:18px;animation-duration:9s;animation-direction:reverse;opacity:.25}
.pfc .pf-orb .glow{position:absolute;inset:34px;border-radius:50%;background:radial-gradient(circle,rgba(246,210,122,.2),rgba(246,210,122,0) 70%);animation:pfpulse 4s ease-in-out infinite}
.pfc .pf-orb img{position:absolute;left:50%;top:50%;height:50px;width:auto;transform:translate(-50%,-50%);filter:drop-shadow(0 0 8px rgba(246,210,122,.35))}
.pfc .pf-orb i{position:absolute;width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:#fff4d6;box-shadow:0 0 6px rgba(246,210,122,.8);opacity:.55;left:50%;top:50%;animation:pfdot 7s linear infinite}
.pfc .pf-orb i:nth-of-type(2){animation-delay:-2.3s;animation-duration:9s;opacity:.4}.pfc .pf-orb i:nth-of-type(3){display:none}
@keyframes pforb{to{--pfa:360deg}}
@keyframes pfpulse{0%,100%{transform:scale(.9);opacity:.55}50%{transform:scale(1.04);opacity:.9}}
@keyframes pfdot{from{transform:rotate(0) translateX(84px)}to{transform:rotate(360deg) translateX(84px)}}
/* 타임라인: 세로로 크게 + 단계 사이 이음선 */
.pfc .pf-steps{list-style:none;margin:0;padding:0;position:relative}
.pfc .pf-steps li{position:relative;display:flex;align-items:center;gap:14px;padding:12px 0;color:#5b6676;font-size:17px;transition:color .3s}
.pfc .pf-steps li:not(:last-child)::after{content:'';position:absolute;left:13px;top:calc(50% + 15px);height:calc(100% - 30px);width:2px;background:#243041;border-radius:2px}
.pfc .pf-steps li.done:not(:last-child)::after{background:linear-gradient(#c99a3e,#8a6a2a)}
.pfc .pf-steps li .c{width:28px;height:28px;box-sizing:border-box;border-radius:50%;border:2px solid #334155;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex:none}
.pfc .pf-steps li.done{color:#9ca3af}.pfc .pf-steps li.done .c{background:#c99a3e;border-color:#c99a3e;color:#1a1405}
.pfc .pf-steps li.now{color:#f3d488;font-weight:700}
.pfc .pf-steps li.now .c{border-color:#f3d488;border-top-color:transparent;animation:pfspin .9s linear infinite}
.pfc .pf-steps li small{font-size:12.5px;font-weight:400;color:#6b7686;margin-left:6px}
@keyframes pfspin{to{transform:rotate(360deg)}}
.pfc .pf-log{margin-top:18px;font:13px/1.75 ui-monospace,Consolas,monospace;color:#7dd3a7;background:#070b11;border:1px solid #1f2a38;border-radius:10px;padding:11px 14px;height:132px;box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;white-space:pre-wrap;scrollbar-width:thin;scrollbar-color:#2f3d50 transparent}
.pfc .pf-log::-webkit-scrollbar{width:6px}.pfc .pf-log::-webkit-scrollbar-thumb{background:#2f3d50;border-radius:6px}
.pfc .pf-log b{color:#f3d488;font-weight:400}
.pfc .pf-log .cur{display:inline-block;width:8px;height:14px;background:#7dd3a7;vertical-align:-2px;animation:pfblink 1s steps(1) infinite}
@keyframes pfblink{50%{opacity:0}}
.pfc .pf-time{font-size:12.5px;color:#6b7280;margin-top:8px}
.pfc .pf-scan{position:absolute;inset:0;z-index:2;background:linear-gradient(180deg,transparent 40%,rgba(246,210,122,.2) 48%,rgba(255,244,214,.55) 50%,rgba(246,210,122,.2) 52%,transparent 60%);background-size:100% 250%;animation:pfscan 2.6s ease-in-out infinite;pointer-events:none}
@keyframes pfscan{from{background-position:0 100%}to{background-position:0 0}}
.pfc .pf-shot.busy img{filter:blur(2.5px) grayscale(.35) brightness(.75)}
@media (max-width:820px){.pfc{grid-template-columns:1fr}.pfc .pf-r{border-left:0;border-top:1px solid #243041}.pfc .pf-ai-run{grid-template-columns:1fr;justify-items:center}}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // 버튼
  const mkt = document.getElementById('mkt'); if (!mkt) return;
  const row = document.createElement('div'); row.className = 'mktrow';
  mkt.parentNode.insertBefore(row, mkt); row.appendChild(mkt);
  const btn = document.createElement('button'); btn.className = 'pfb'; btn.type = 'button';
  btn.innerHTML = `<img src="${SYM}" alt="">내 포트폴리오 생성<span class="pf-ai">AI</span>`;
  row.appendChild(btn);

  // 팝업
  const m = document.createElement('div'); m.className = 'pfm'; m.hidden = true;
  m.innerHTML = `<div class="pfc" role="dialog" aria-modal="true" aria-label="내 포트폴리오 생성">
  <button class="pf-x" aria-label="닫기">×</button>
  <div class="pf-l">
    <h3><img src="${SYM}" alt="">내 포트폴리오 생성</h3>
    <p class="pf-sub">보유 종목과 평단·수량을 편하게 적어 주세요. 아는 것만 적어도 됩니다.<br><b>회원명</b>을 함께 적으면 이미지 제목에 들어갑니다 (권장).</p>
    <div class="pf-form"><textarea maxlength="200" placeholder="예시1) 홍길동 삼전 24만 30주, 하닉 240만 10주&#10;예시2) 삼전 하닉 현차 각 10주&#10;예시3) 하이닉스 3월쯤 10주 샀어&#10;예시4) 삼전 30주, 하닉 평단 모름&#10;예시5) 강민 대한광통신 평단 없음"></textarea>
      <div class="pf-row"><span class="pf-cnt">0 / 200</span><button class="pf-go" type="button">✦ 브리핑 만들기</button></div>
      <div class="pf-ft">실시간 시세 · 오늘 시황 반영 · 보통 1~3분</div></div>
    <div class="pf-out"></div>
  </div>
  <div class="pf-r"><div class="pf-rt"></div><div class="pf-shot"></div></div>
  </div>`;
  document.body.appendChild(m);
  const $ = s => m.querySelector(s);
  const ta = $('textarea'), go = $('.pf-go'), out = $('.pf-out'), form = $('.pf-form'), rt = $('.pf-rt'), shot = $('.pf-shot');
  let api = null, job = null, timer = null, tick = null, t0 = 0;

  const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TG = '<svg class="pf-tg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.4 3.6 2.9 10.7c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.4-1.5ZM8.6 13.4l9.2-5.8c.4-.3.8-.1.5.2l-7.6 6.9-.3 3.2-1.8-4.5Z"/></svg>';
  const PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>';
  const PAGE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 2.5h8.5L19 7v14.5H6z"/><path d="M14.5 2.5V7H19"/><path d="M9 12h7M9 15.5h7M9 19h4"/></svg>';
  const AGAIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>';
  const editorBtn = req => `<a class="pf-ghost pf-ed" href="${EDITOR}" target="_blank" rel="noopener">${TG}편집자에게 텔레 보내기</a>` +
    (req ? `<button class="pf-ghost pf-cp" type="button">요청 문장 복사</button>` : '');
  function wireCopy(req) { const b = out.querySelector('.pf-cp'); if (b) b.onclick = () => { navigator.clipboard && navigator.clipboard.writeText(req); b.textContent = '복사됨'; }; }
  function show(html, cls) { out.innerHTML = `<div class="pf-st ${cls || ''}">${html}</div>`; }
  function sampleView() {
    rt.innerHTML = '✦ <b>완성 예시</b> · 이런 이미지가 만들어집니다';
    shot.className = 'pf-shot sample'; shot.onclick = null; shot.innerHTML = `<img src="${SAMPLE}" alt="브리핑 완성 예시">`;
  }
  sampleView();
  function stopAI() { clearInterval(tick); tick = null; }
  function fail(msg, req) {
    stopAI(); sampleView();
    show(`⚠ ${esc(msg)}${req ? `<br><small style="color:#9ca3af">보내신 요청: ${esc(req)}</small>` : ''}<div class="pf-row">${editorBtn(req)}</div>`, 'pf-err');
    wireCopy(req); go.disabled = false; form.hidden = false;
  }

  // AI 제작 화면: 서버가 보내는 실제 단계(step)와 실제 작업 기록(logs)을 그대로 표시
  function aiView(j) {
    if (!out.querySelector('.pf-ai-run')) {
      out.innerHTML = `<div class="pf-ai-run"><div class="pf-orb"><div class="ring"></div><div class="ring r2"></div><div class="glow"></div><i></i><i></i><i></i><img src="${SYM}" alt=""></div>
        <ul class="pf-steps">${STEPS.map(s => `<li><span class="c"></span>${s}<small></small></li>`).join('')}</ul></div>
        <div class="pf-log"></div><div class="pf-time"></div>`;
      rt.innerHTML = '✦ <b>AI가 브리핑을 만드는 중</b>';
      shot.className = 'pf-shot sample busy'; shot.innerHTML = `<img src="${SAMPLE}" alt=""><div class="pf-scan"></div>`;
      tick = setInterval(() => { const tt = out.querySelector('.pf-time'); if (tt) tt.textContent = `경과 ${Math.floor((Date.now() - t0) / 1000)}초 · ${job && job.pos > 1 ? `앞에 ${job.pos - 1}건 대기 · ` : ''}보통 1~3분`; }, 1000);
    }
    const s = j.state === 'queued' ? -1 : (j.step ?? -1);
    out.querySelectorAll('.pf-steps li').forEach((li, i) => {
      li.className = i < s ? 'done' : i === s ? 'now' : '';
      li.querySelector('.c').textContent = i < s ? '✓' : '';
    });
    const searches = (j.logs || []).filter(l => /^웹 검색/.test(l[1])).length;
    const sm = out.querySelectorAll('.pf-steps li small')[2]; if (sm) sm.textContent = searches ? `검색 ${searches}회` : '';
    // 전체 기록을 다 넣고 맨 아래(최신 줄)를 보여 줌. 사용자가 위로 올려 보는 중이면 그 위치 유지
    const lg = out.querySelector('.pf-log');
    const L = j.logs || [];
    const atBottom = lg.scrollHeight - lg.scrollTop - lg.clientHeight < 24;
    const html = (L.length ? L.map(l => `<b>[${esc(l[0])}]</b> ${esc(l[1])}`).join('\n') : (j.state === 'queued' ? `대기 중${j.pos > 1 ? ` · 앞에 ${j.pos - 1}건` : ''}` : '')) + ' <span class="cur"></span>';
    if (lg.dataset.h !== html) { lg.innerHTML = html; lg.dataset.h = html; if (atBottom) lg.scrollTop = lg.scrollHeight; }
  }

  async function base() {
    if (api) return api;
    const r = await fetch('data/brief.json?t=' + Date.now(), { cache: 'no-store' });
    api = (await r.json()).api.replace(/\/$/, ''); return api;
  }
  async function call(path, body) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
    try {
      const r = await fetch((await base()) + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal } : { signal: ctl.signal, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw Object.assign(new Error(j.error || '요청 실패'), { soft: true });
      return j;
    } finally { clearTimeout(t); }
  }
  function render(j) {
    job = j;
    if (j.state === 'queued' || j.state === 'running') {
      aiView(j); clearTimeout(timer); timer = setTimeout(poll, 1500); return;
    }
    stopAI();
    if (j.state === 'ask') {
      sampleView();
      show(`<span class="pf-q">❓ ${esc(j.question)}</span><div class="pf-row" style="margin-top:10px"><input maxlength="200" placeholder="답을 적어 주세요"><button class="pf-go pf-ans" type="button">보내기</button></div>`);
      const inp = out.querySelector('input'), b = out.querySelector('.pf-ans'); inp.focus();
      const send = async () => { if (!inp.value.trim()) return; b.disabled = true; t0 = Date.now(); try { render(await call('/api/answer', { id: j.id, text: inp.value })); } catch (e) { fail(e.message, ta.value); } };
      b.onclick = send; inp.onkeydown = e => { if (e.key === 'Enter') send(); };
      return;
    }
    if (j.state === 'ok') {
      const pdf = j.pdf || [], many = j.img.length > 1;
      const cards = j.img.map((p, i) => {
        const nm = many ? `${esc(j.names[i].replace(/\.png$/, ''))} ` : '';
        return `<div class="pf-cards${pdf[i] ? '' : ' one'}">
          <button class="pf-card main pf-dl" data-i="${i}" data-k="png" type="button"><span class="ic">${PHONE}</span><span><b>${nm}PNG 저장</b><span class="t">휴대폰·카톡 전송용<br>화면에 꽉 차게 보기 좋음</span></span></button>
          ${pdf[i] ? `<button class="pf-card pf-dl" data-i="${i}" data-k="pdf" type="button"><span class="ic">${PAGE}</span><span><b>${nm}A4 저장<i>PDF</i></b><span class="t">인쇄·문서 첨부용<br>A4 용지 한 장에 맞춤</span></span></button>` : ''}
        </div>`;
      }).join('');
      out.innerHTML = `<div class="pf-st">✅ <b>완성!</b> ${esc(j.msg)}${j.note ? `<br><small style="color:#9ca3af">📝 ${esc(j.note)}</small>` : ''}
        ${cards}<button class="pf-ghost pf-again" type="button">${AGAIN}다른 종목으로 다시 만들기</button></div>`;
      rt.innerHTML = '✦ <b>완성된 브리핑</b> · 누르면 원본 크기로';
      shot.className = 'pf-shot res'; shot.innerHTML = j.img.map((p, i) => `<img src="${api}/${p}" alt="${esc(j.names[i])}">`).join('');
      shot.onclick = () => window.open(`${api}/${j.img[0]}`, '_blank');
      out.querySelectorAll('.pf-dl').forEach(b => b.onclick = async () => {
        const i = +b.dataset.i, isPdf = b.dataset.k === 'pdf';
        b.disabled = true;
        try {
          const r = await fetch(`${api}/${isPdf ? pdf[i] : j.img[i]}`); if (!r.ok) throw 0; const blob = await r.blob();
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
          a.download = isPdf ? j.names[i].replace(/\.png$/, '') + ' (A4).pdf' : j.names[i]; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        } catch (e) { alert('저장하지 못했습니다. 브리핑 컴퓨터가 다시 켜졌다면 새로 만들어 주세요.'); }
        finally { b.disabled = false; }
      });
      out.querySelector('.pf-again').onclick = () => { out.innerHTML = ''; sampleView(); form.hidden = false; go.disabled = false; ta.focus(); };
      return;
    }
    fail(j.reason || '브리핑을 만들지 못했습니다.', ta.value.trim());
  }
  async function poll() {
    try { render(await call('/api/job?id=' + job.id)); }
    catch (e) { clearTimeout(timer); timer = setTimeout(poll, 4000); }
  }
  async function start() {
    const text = ta.value.trim(); if (!text) { ta.focus(); return; }
    go.disabled = true; form.hidden = true; t0 = Date.now(); job = null;
    aiView({ state: 'queued', msg: '' });
    try { await call('/api/ping'); }
    catch (e) { api = null; return fail('지금은 브리핑 컴퓨터가 꺼져 있어 만들 수 없습니다. 편집자에게 요청해 주세요.', text); }
    try { render(await call('/api/brief', { text })); }
    catch (e) { fail(e.soft ? e.message : '연결이 끊겼습니다. 잠시 뒤 다시 시도해 주세요.', text); }
  }
  ta.oninput = () => { $('.pf-cnt').textContent = `${ta.value.length} / 200`; };
  go.onclick = start;
  ta.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) start(); };
  const close = () => { m.hidden = true; };
  $('.pf-x').onclick = close; m.onclick = e => { if (e.target === m) close(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !m.hidden) close(); });
  btn.onclick = () => { m.hidden = false; setTimeout(() => ta.focus(), 30); };
})();
