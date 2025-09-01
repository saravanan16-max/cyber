const FINAL_LINE = "CYBER KNIGHTS DEFEND THE WEB";
const QR_FRAGMENTS = [
  { id:1, fragment:"CYBER", cipher:"CYBER", note:"Base64: decode me" },
  { id:2, fragment:" KNIGHTS", cipher:"KNIGHTS", note:"Trim dashes, Base64" },
  { id:3, fragment:" DEFEND", cipher:"DEFEND", note:"Remove spaces, read base64-ish" },
  { id:4, fragment:" THE", cipher:"THE", note:"Use ROT13" },
  { id:5, fragment:" WEB", cipher:"WEB", note:"ASCII codes" }
];
const state = {
  levelClears: {1:0,2:0,3:0,4:0,5:0},
  qrEarned: {1:false,2:false,3:false,4:false,5:false},
  current: 0,
};
const levelMeta = {
  1:{title:"Encoded ↔ Decoded", minClear:1, total:5},
  2:{title:"Find the Correct Link", minClear:1, total:4},
  3:{title:"Connect the Meaning (Buzzers)", minClear:1, total:3},
  4:{title:"Fill a Strong Password", minClear:1, total:1},
  5:{title:"Three Doors — Code Output", minClear:1, total:3},
};
// timer utilities
let timerInterval = null;
let timerStart = null;
function formatDuration(ms){
  const s = Math.floor(ms/1000);
  const h = String(Math.floor(s/3600)).padStart(2,'0');
  const m = String(Math.floor((s%3600)/60)).padStart(2,'0');
  const sec = String(s%60).padStart(2,'0');
  return `${h}:${m}:${sec}`;
}
function startTimer(){
  if(timerInterval) return;
  timerStart = Date.now();
  timerInterval = setInterval(()=>{
    const tEl = document.getElementById('timer');
    if(tEl) tEl.textContent = formatDuration(Date.now()-timerStart);
  }, 500);
}
function stopTimer(){
  clearInterval(timerInterval);
  timerInterval = null;
  timerStart = null;
  const tEl = document.getElementById('timer');
  if(tEl) tEl.textContent = "00:00:00";
}
function saveGame(){
  try { localStorage.setItem('ck-quest-state', JSON.stringify(state)); }
  catch(e){ }
  toast('Progress saved.');
}
function loadGame(){
  const raw = localStorage.getItem('ck-quest-state');
  if(!raw) return;
  try{
    const s = JSON.parse(raw);
    if(s.levelClears) state.levelClears = Object.assign(state.levelClears, s.levelClears);
    if(s.qrEarned) state.qrEarned = Object.assign(state.qrEarned, s.qrEarned);
    if(typeof s.current === 'number') state.current = s.current;
    if(typeof s.l1Index === 'number') state.l1Index = s.l1Index;
    if(typeof s.l2Index === 'number') state.l2Index = s.l2Index;
    if(typeof s.l3Index === 'number') state.l3Index = s.l3Index;
    if(typeof s.l4Index === 'number') state.l4Index = s.l4Index;
    if(typeof s.l5Index === 'number') state.l5Index = s.l5Index;
  }catch(e){}
}
function resetGame(){
  localStorage.removeItem('ck-quest-state');
  location.reload();
}
function toast(msg){
  const el = document.getElementById('toast'); 
  if(!el) return;
  el.textContent = msg; el.classList.remove('hidden');
  setTimeout(()=>el.classList.add('hidden'), 2200);
}
function setVisible(id, show){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.toggle('hidden', !show);
}
function updateProgress(){
  const count = Object.values(state.qrEarned).filter(Boolean).length;
  const progEl = document.getElementById('progressText');
  if(progEl) progEl.textContent = `${count} / ${QR_FRAGMENTS.length} QR fragments`;
  renderLevelsSidebar();
}
function goHome(){
  state.current = 0;
  ['home','level1','level2','level3','level4','level5'].forEach(id=>setVisible(id,false));
  setVisible('home', true);
  renderHomeQR();
  updateProgress();
  saveGame();
}
function goLevel(n){
  if(n>1){
    const prev = n-1;
    const ok = state.levelClears[prev] >= levelMeta[prev].minClear;
    if(!ok){
      toast(`Clear at least ${levelMeta[prev].minClear} in Level ${prev} to proceed.`);
      return;
    }
  }
  state.current = n;
  ['home','level1','level2','level3','level4','level5'].forEach(id=>setVisible(id,false));
  setVisible(`level${n}`, true);
  updateProgress();
  saveGame();
}
function renderLevelsSidebar(){
  const root = document.getElementById('levelList');
  if(!root) return;
  root.innerHTML = '';
  const items = [
    {id:0,label:'🏠 Home', go:goHome},
    {id:1,label:'🧩 L1: Encoded/Decoded', go:()=>goLevel(1)},
    {id:2,label:'🧺 L2: Find Link', go:()=>goLevel(2)},
    {id:3,label:'🔔 L3: Buzzers', go:()=>goLevel(3)},
    {id:4,label:'🔐 L4: Strong Password', go:()=>goLevel(4)},
    {id:5,label:'🚪 L5: Three Doors', go:()=>goLevel(5)},
  ];
  items.forEach(({id,label,go})=>{
    const div = document.createElement('div'); div.className='level';
    if(id>1){
      const ok = state.levelClears[id-1] >= levelMeta[id-1].minClear;
      if(!ok){
        div.classList.add('locked');
        div.onclick = ()=>toast(`Unlock by clearing L${id-1}`);
      } else div.onclick = go;
    } else div.onclick = go;
    div.innerHTML = `<span>${label}</span>` + (id>0? `<span class="badge ${state.qrEarned[id]?'ok':'todo'}">${state.qrEarned[id]?'QR ✓':'QR ?'}</span>` : '');
    root.appendChild(div);
  })
}
function renderHomeQR(){
  const el = document.getElementById('homeQR');
  if(!el) return;
  const got = Object.entries(state.qrEarned).filter(([k,v])=>v).map(([k])=>Number(k));
  if(got.length===0){
    el.innerHTML = '<div class="small">Collect QR fragments from each level to view them here.</div>';
    return;
  }
  const wrapper = document.createElement('div');
  got.forEach(i=>{
    const q = QR_FRAGMENTS[i-1];
    const block = document.createElement('div'); block.className='qr';
    const qrHolder = document.createElement('div'); qrHolder.style.width='64px'; qrHolder.style.height='64px';
    block.appendChild(qrHolder);
    const right = document.createElement('div');
    right.innerHTML = `<div class="small">Fragment ${i}</div><div class="cipher">${q.cipher}</div><div class="small">Hint: ${q.note}</div>`;
    block.appendChild(right);
    wrapper.appendChild(block);
    try{
      if(typeof QRCode !== 'undefined'){
        new QRCode(qrHolder, { text: q.cipher, width:64, height:64, correctLevel: QRCode.CorrectLevel.L });
      } else {
        qrHolder.textContent = 'QR';
      }
    }catch(e){}
  });
  el.innerHTML = '';
  el.appendChild(wrapper);
  // No auto-fill of finalLine input
}
function checkFinalLine(){
  const v = (document.getElementById('finalLine').value || '').trim();
  const out = document.getElementById('finalStatus');
  if(!out) return;
  if(v.toUpperCase() === (FINAL_LINE || '').toUpperCase()){
    out.innerHTML = `<div class="status">✅ SUCCESS! You completed the Cyber Knights quest.</div>`;
    awardModal(`🎉 Mission Complete`, `You entered the correct final line.<br><strong>${FINAL_LINE}</strong>`);
  } else {
    out.innerHTML = `<span style="color:var(--danger);font-weight:700">❌ Not correct yet. Keep hunting!</span>`;
  }
}
function prefillDemo(){ const el = document.getElementById('finalLine'); if(el) el.value = "*********"; }
function modal(html){
  const root = document.getElementById('modalRoot');
  if(!root) return;
  root.classList.remove('hidden');
  root.innerHTML = `<div class='overlay' onclick='closeModal(event)'><div class='modal' onclick='event.stopPropagation()'>${html}<div class='grid c2 mt16'><button class='btn' onclick='closeModal()'>OK</button><button class='btn secondary' onclick='closeModal()'>Close</button></div></div></div>`;
}
function closeModal(){ const root = document.getElementById('modalRoot'); if(!root) return; root.classList.add('hidden'); root.innerHTML=''; }
function awardModal(title, body){
  modal(`<h3 class='title'>${title}</h3><div class='small mt8'>${body}</div><div id='awardQR' class='mt12'></div>`);
  try{
    const last = QR_FRAGMENTS.find(f => (!f._shown && state.qrEarned[f.id]));
    if(last){
      const holder = document.getElementById('awardQR');
      const node = document.createElement('div'); node.style.width='120px'; node.style.height='120px';
      holder.appendChild(node);
      if(typeof QRCode !== 'undefined') new QRCode(node, { text:last.cipher, width:120, height:120, correctLevel: QRCode.CorrectLevel.L });
      last._shown = true;
    }
  }catch(e){}
}
function normalizeAnswer(str){
  return (str||'').replace(/[^A-Z0-9]/gi,'').replace(/\s+/g,'').toUpperCase();
}

/* -----------------------
   LEVEL 1 — One Question at a Time
----------------------- */
function renderLevel1(){
  const host = document.getElementById('level1');
  if(!host) return;
  if(typeof state.l1Index !== 'number') state.l1Index = 0;
  const nodes = [
    {key:'caesar', label:'Caesar', q:"URYYB JBEYQ! ROT13 -> ?", ans:"HELLO WORLD"},
    {key:'base64', label:'Base64', q:"Q3liZXIgS25pZ2h0IQ==", ans:"CYBER KNIGHT!"},
    {key:'hex', label:'Hex', q:"43 59 42 45 52 -> ?", ans:"CYBER"},
    {key:'vigenere', label:'Vigenere', q:"Key=KNIGHT, Cipher= PFKG ZH VZ YZ", ans:"CODE IS FUN"},
    {key:'emoji', label:'Emoji', q:"💻🔒 + 🧠 = ? (two words)", ans:"SECURE MIND"},
  ];
  const i = state.l1Index;
  const n = nodes[i];
  host.innerHTML = `
    <h2 class="title">Level 1: <span class="accent">Encoded ↔ Decoded</span></h2>
    <div class="card">
      <div class="title">${n.label} Challenge</div>
      <div class="small mt12">${n.q}</div>
      <input id="l1answer" class="mt12" placeholder="Enter answer (case-insensitive)" />
      <div class="grid c3 mt12">
        <button class="btn secondary" id="prevQ" ${i===0?'disabled':''}>Previous</button>
        <button class="btn" id="l1sub">Submit</button>
        <button class="btn secondary" id="nextQ" ${i===nodes.length-1?'disabled':''}>Next</button>
      </div>
      <div id="l1status" class="mt12 small">Question ${i+1} of ${nodes.length} | Cleared: ${state.levelClears[1]} / ${levelMeta[1].total}</div>
    </div>
  `;
  document.getElementById('l1sub').onclick = ()=>checkL1(n.key, n.ans);
  document.getElementById('prevQ').onclick = ()=>{
    if(i>0){ state.l1Index--; renderLevel1(); }
  };
  document.getElementById('nextQ').onclick = ()=>{
    if(i<nodes.length-1){ state.l1Index++; renderLevel1(); }
  };
}
function checkL1(key, correct){
  const vEl = document.getElementById('l1answer'); if(!vEl) return;
  const v = vEl.value;
  if(normalizeAnswer(v) === normalizeAnswer(correct)){
    state.levelClears[1]++;
    closeModal(); toast('Correct!');
    if(state.levelClears[1] >= 1 && !state.qrEarned[1]) awardQR(1);
    updateProgress(); saveGame();
    renderLevel1();
  } else { toast('Try again!'); }
}

/* -----------------------
   LEVEL 2 — One Question at a Time
----------------------- */
function renderLevel2(){
  const host = document.getElementById('level2');
  if(!host) return;
  if(typeof state.l2Index !== 'number') state.l2Index = 0;
  const nodes = [
    {key:'phish', label:'Phishing', q:"Which link is safe?<br>1. www.paypa1.com<br>2. www.paypal.com", ans:"2"},
    {key:'typo', label:'Typo', q:"Spot the typo:<br>www.gooogle.com", ans:"GOOGLE"},
    {key:'short', label:'Short URL', q:"Is bit.ly/abc123 safe? (yes/no)", ans:"NO"},
    {key:'https', label:'HTTPS', q:"Which is secure?<br>1. http://bank.com<br>2. https://bank.com", ans:"2"},
  ];
  const i = state.l2Index;
  const n = nodes[i];
  host.innerHTML = `
    <h2 class="title">Level 2: <span class="accent">Find the Correct Link</span></h2>
    <div class="card">
      <div class="title">${n.label} Challenge</div>
      <div class="small mt12">${n.q}</div>
      <input id="l2answer" class="mt12" placeholder="Enter answer" />
      <div class="grid c3 mt12">
        <button class="btn secondary" id="prevQ2" ${i===0?'disabled':''}>Previous</button>
        <button class="btn" id="l2sub">Submit</button>
        <button class="btn secondary" id="nextQ2" ${i===nodes.length-1?'disabled':''}>Next</button>
      </div>
      <div id="l2status" class="mt12 small">Question ${i+1} of ${nodes.length} | Cleared: ${state.levelClears[2]} / ${levelMeta[2].total}</div>
    </div>
  `;
  document.getElementById('l2sub').onclick = ()=>checkL2(n.key, n.ans);
  document.getElementById('prevQ2').onclick = ()=>{
    if(i>0){ state.l2Index--; renderLevel2(); }
  };
  document.getElementById('nextQ2').onclick = ()=>{
    if(i<nodes.length-1){ state.l2Index++; renderLevel2(); }
  };
}
function checkL2(key, correct){
  const vEl = document.getElementById('l2answer'); if(!vEl) return;
  const v = vEl.value;
  if(normalizeAnswer(v) === normalizeAnswer(correct)){
    state.levelClears[2]++;
    closeModal(); toast('Correct!');
    if(state.levelClears[2] >= 1 && !state.qrEarned[2]) awardQR(2);
    updateProgress(); saveGame();
    renderLevel2();
  } else { toast('Try again!'); }
}

/* -----------------------
   LEVEL 3 — One Question at a Time
----------------------- */
function renderLevel3(){
  const host = document.getElementById('level3');
  if(!host) return;
  if(typeof state.l3Index !== 'number') state.l3Index = 0;
  const nodes = [
    {key:'firewall', label:'Firewall', q:"What does a firewall do?", ans:"BLOCKS UNAUTHORIZED ACCESS"},
    {key:'vpn', label:'VPN', q:"VPN stands for?", ans:"VIRTUAL PRIVATE NETWORK"},
    {key:'malware', label:'Malware', q:"Malware is?", ans:"MALICIOUS SOFTWARE"},
  ];
  const i = state.l3Index;
  const n = nodes[i];
  host.innerHTML = `
    <h2 class="title">Level 3: <span class="accent">Connect the Meaning</span></h2>
    <div class="card">
      <div class="title">${n.label} Challenge</div>
      <div class="small mt12">${n.q}</div>
      <input id="l3answer" class="mt12" placeholder="Enter answer" />
      <div class="grid c3 mt12">
        <button class="btn secondary" id="prevQ3" ${i===0?'disabled':''}>Previous</button>
        <button class="btn" id="l3sub">Submit</button>
        <button class="btn secondary" id="nextQ3" ${i===nodes.length-1?'disabled':''}>Next</button>
      </div>
      <div id="l3status" class="mt12 small">Question ${i+1} of ${nodes.length} | Cleared: ${state.levelClears[3]} / ${levelMeta[3].total}</div>
    </div>
  `;
  document.getElementById('l3sub').onclick = ()=>checkL3(n.key, n.ans);
  document.getElementById('prevQ3').onclick = ()=>{
    if(i>0){ state.l3Index--; renderLevel3(); }
  };
  document.getElementById('nextQ3').onclick = ()=>{
    if(i<nodes.length-1){ state.l3Index++; renderLevel3(); }
  };
}
function checkL3(key, correct){
  const vEl = document.getElementById('l3answer'); if(!vEl) return;
  const v = vEl.value;
  if(normalizeAnswer(v) === normalizeAnswer(correct)){
    state.levelClears[3]++;
    closeModal(); toast('Correct!');
    if(state.levelClears[3] >= 1 && !state.qrEarned[3]) awardQR(3);
    updateProgress(); saveGame();
    renderLevel3();
  } else { toast('Try again!'); }
}

/* -----------------------
   LEVEL 4 — One Question at a Time
----------------------- */
function renderLevel4(){
  const host = document.getElementById('level4');
  if(!host) return;
  if(typeof state.l4Index !== 'number') state.l4Index = 0;
  const nodes = [
    {key:'password', label:'Strong Password', q:"Create a strong password (min 8 chars, mix of letters, numbers, symbol)", ans:"ANY"},
  ];
  const i = state.l4Index;
  const n = nodes[i];
  host.innerHTML = `
    <h2 class="title">Level 4: <span class="accent">Fill a Strong Password</span></h2>
    <div class="card">
      <div class="title">${n.label} Challenge</div>
      <div class="small mt12">${n.q}</div>
      <input id="l4answer" class="mt12" placeholder="Enter password" />
      <div class="grid c3 mt12">
        <button class="btn secondary" id="prevQ4" disabled>Previous</button>
        <button class="btn" id="l4sub">Submit</button>
        <button class="btn secondary" id="nextQ4" disabled>Next</button>
      </div>
      <div id="l4status" class="mt12 small">Question 1 of 1 | Cleared: ${state.levelClears[4]} / ${levelMeta[4].total}</div>
    </div>
  `;
  document.getElementById('l4sub').onclick = ()=>checkL4(n.key, n.ans);
}
function checkL4(key, correct){
  const vEl = document.getElementById('l4answer'); if(!vEl) return;
  const v = vEl.value;
  // Simple strong password check
  if(v.length>=8 && /[A-Z]/i.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v)){
    state.levelClears[4]++;
    closeModal(); toast('Correct!');
    if(state.levelClears[4] >= 1 && !state.qrEarned[4]) awardQR(4);
    updateProgress(); saveGame();
    renderLevel4();
  } else { toast('Try again! Use letters, numbers, and a symbol.'); }
}

/* -----------------------
   LEVEL 5 — One Question at a Time
----------------------- */
function renderLevel5(){
  const host = document.getElementById('level5');
  if(!host) return;
  if(typeof state.l5Index !== 'number') state.l5Index = 0;
  const nodes = [
    {key:'js', label:'JavaScript', q:"What is the output of: console.log(2+2)?", ans:"4"},
    {key:'python', label:'Python', q:"What is the output of: print('Cyber'.upper())?", ans:"CYBER"},
    {key:'html', label:'HTML', q:"What does &lt;b&gt;Hello&lt;/b&gt; look like?", ans:"HELLO"},
  ];
  const i = state.l5Index;
  const n = nodes[i];
  host.innerHTML = `
    <h2 class="title">Level 5: <span class="accent">Three Doors — Code Output</span></h2>
    <div class="card">
      <div class="title">${n.label} Challenge</div>
      <div class="small mt12">${n.q}</div>
      <input id="l5answer" class="mt12" placeholder="Enter answer" />
      <div class="grid c3 mt12">
        <button class="btn secondary" id="prevQ5" ${i===0?'disabled':''}>Previous</button>
        <button class="btn" id="l5sub">Submit</button>
        <button class="btn secondary" id="nextQ5" ${i===nodes.length-1?'disabled':''}>Next</button>
      </div>
      <div id="l5status" class="mt12 small">Question ${i+1} of ${nodes.length} | Cleared: ${state.levelClears[5]} / ${levelMeta[5].total}</div>
    </div>
  `;
  document.getElementById('l5sub').onclick = ()=>checkL5(n.key, n.ans);
  document.getElementById('prevQ5').onclick = ()=>{
    if(i>0){ state.l5Index--; renderLevel5(); }
  };
  document.getElementById('nextQ5').onclick = ()=>{
    if(i<nodes.length-1){ state.l5Index++; renderLevel5(); }
  };
}
function checkL5(key, correct){
  const vEl = document.getElementById('l5answer'); if(!vEl) return;
  const v = vEl.value;
  if(normalizeAnswer(v) === normalizeAnswer(correct)){
    state.levelClears[5]++;
    closeModal(); toast('Correct!');
    if(state.levelClears[5] >= 1 && !state.qrEarned[5]) awardQR(5);
    updateProgress(); saveGame();
    renderLevel5();
  } else { toast('Try again!'); }
}

/* -----------------------
   award QR and display
----------------------- */
function awardQR(level){
  state.qrEarned[level] = true;
  renderHomeQR();
  const q = QR_FRAGMENTS[level-1];
  modal(`<h3 class='title'>QR Fragment Awarded — Level ${level}</h3>
    <div class='qr'><div id='qrHolder' style='width:120px;height:120px'></div>
    <div><div class='small'>Ciphertext</div><div class='cipher'>${q.cipher}</div><div class='small'>Hint: ${q.note}</div></div></div>`);
  try{
    const holder = document.getElementById('qrHolder');
    if(holder && typeof QRCode !== 'undefined'){
      new QRCode(holder, { text: q.cipher, width:120, height:120, correctLevel: QRCode.CorrectLevel.L });
    }
  }catch(e){}
  saveGame();
}

/* -----------------------
   initialization
----------------------- */
function init(){
  loadGame();
  renderLevelsSidebar();
  const startBtn = document.getElementById('startBtn');
  if(startBtn) startBtn.onclick = ()=>goLevel(1);
  const howToBtn = document.getElementById('howTo');
  if(howToBtn) howToBtn.onclick = ()=>modal(`<h3 class='title'>How to Play</h3><ol class='small'><li>Open a level. Each has multiple challenges.</li><li>Clear at least <strong>one</strong> challenge in a level to unlock the next.</li><li>Clearing a level awards a QR fragment. Combine all fragments to form the final line.</li></ol>`);
  const submitFinalBtn = document.getElementById('submitFinal');
  if(submitFinalBtn) submitFinalBtn.onclick = checkFinalLine;
  const demoBtn = document.getElementById('demoFill');
  if(demoBtn) demoBtn.onclick = prefillDemo;
  const saveBtn = document.getElementById('saveBtn');
  if(saveBtn) saveBtn.onclick = saveGame;
  const resetBtn = document.getElementById('resetBtn');
  if(resetBtn) resetBtn.onclick = resetGame;
  const startTimerBtn = document.getElementById('startTimer');
  if(startTimerBtn) startTimerBtn.onclick = startTimer;
  const stopTimerBtn = document.getElementById('stopTimer');
  if(stopTimerBtn) stopTimerBtn.onclick = stopTimer;
  renderLevel1(); renderLevel2(); renderLevel3(); renderLevel4(); renderLevel5();
  updateProgress();
}
window.addEventListener('load', init);
