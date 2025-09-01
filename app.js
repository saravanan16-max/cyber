/* -----------------------
   App logic (restored + updated)
   Replace your app.js with this file
----------------------- */

const FINAL_LINE = "CYBER KNIGHTS DEFEND THE WEB";

// minimal fragment data (editable)
const QR_FRAGMENTS = [
  { id:1, fragment:"CYBER", cipher:"Rklyc3QgZnJhZ21lbnQ6IENZQkVS", note:"Base64: decode me" },
  { id:2, fragment:" KNIGHTS", cipher:"Xy1LTklHSFRTLS0=", note:"Trim dashes, Base64" },
  { id:3, fragment:" DEFEND", cipher:"QR fragment: V ERHQkV T", note:"Remove spaces, read base64-ish" },
  { id:4, fragment:" THE", cipher:"ROT13 of 'GUR'", note:"Use ROT13" },
  { id:5, fragment:" WEB", cipher:"576562 -> ascii(57=W, 65=E, 66=B)", note:"ASCII codes" }
];

const state = {
  levelClears: {1:0,2:0,3:0,4:0,5:0},
  qrEarned: {1:false,2:false,3:false,4:false,5:false},
  current: 0,
};

// meta
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

// storage
function saveGame(){
  try { localStorage.setItem('ck-quest-state', JSON.stringify(state)); }
  catch(e){ console.warn('saveGame error', e); }
  toast('Progress saved.');
}
function loadGame(){
  const raw = localStorage.getItem('ck-quest-state');
  if(!raw) return;
  try{
    const s = JSON.parse(raw);
    // merge into existing state safely
    if(s.levelClears) state.levelClears = Object.assign(state.levelClears, s.levelClears);
    if(s.qrEarned) state.qrEarned = Object.assign(state.qrEarned, s.qrEarned);
    if(typeof s.current === 'number') state.current = s.current;
  }catch(e){ console.warn('loadGame parse error', e); }
}

function resetGame(){
  localStorage.removeItem('ck-quest-state');
  localStorage.removeItem('ck-teams');
  // reload to ensure UI and state cleared
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

  // Auto-fill final line once all fragments collected
  if(count === QR_FRAGMENTS.length){
    const finalInput = document.getElementById('finalLine');
    if(finalInput && !finalInput.value){
      finalInput.value = FINAL_LINE;
      toast('All QR fragments collected! Final line filled.');
    }
  }

  renderLevelsSidebar();
}

// navigation & rendering
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
    // generate QR image of ciphertext (small)
    try{
      if(typeof QRCode !== 'undefined'){
        new QRCode(qrHolder, { text: q.cipher, width:64, height:64, correctLevel: QRCode.CorrectLevel.L });
      } else {
        // fallback: show cipher text if QR lib missing
        qrHolder.textContent = 'QR';
      }
    }catch(e){ console.warn('QR render error', e); }
  });
  el.innerHTML = '';
  el.appendChild(wrapper);
}

function checkFinalLine(){
  const v = (document.getElementById('finalLine').value || '').trim();
  const out = document.getElementById('finalStatus');
  if(!out) return;
  // case-insensitive compare
  if(v.toUpperCase() === (FINAL_LINE || '').toUpperCase()){
    out.innerHTML = `<div class="status">✅ SUCCESS! You completed the Cyber Knights quest.</div>`;
    awardModal(`🎉 Mission Complete`, `You entered the correct final line.<br><strong>${FINAL_LINE}</strong>`);
  } else {
    out.innerHTML = `<span style="color:var(--danger);font-weight:700">❌ Not correct yet. Keep hunting!</span>`;
  }
}
function prefillDemo(){ const el = document.getElementById('finalLine'); if(el) el.value = "*********"; }

// modal utilities (reusable)
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
    // show the first recently awarded fragment that's not shown yet
    const last = QR_FRAGMENTS.find(f => (!f._shown && state.qrEarned[f.id]));
    if(last){
      const holder = document.getElementById('awardQR');
      const node = document.createElement('div'); node.style.width='120px'; node.style.height='120px';
      holder.appendChild(node);
      if(typeof QRCode !== 'undefined') new QRCode(node, { text:last.cipher, width:120, height:120, correctLevel: QRCode.CorrectLevel.L });
      last._shown = true;
    }
  }catch(e){ console.warn('awardModal error', e); }
}

/* -----------------------
   LEVEL 1
----------------------- */
function renderLevel1(){
  const host = document.getElementById('level1');
  if(!host) return;
  host.innerHTML = `<h2 class="title">Level 1: <span class="accent">Encoded ↔ Decoded</span></h2>
    <div class="small">Click a node to open its encoded question. Solve any one to unlock Level 2.</div>
    <div class="circle-map" id="l1map"></div>
    <div id="l1status" class="mt12 small"></div>`;

  const nodes = [
    {key:'caesar', label:'Caesar', x:30, y:20, q:"URYYB JBEYQ! ROT13 -> ?", ans:"HELLO WORLD"},
    {key:'base64', label:'Base64', x:65, y:12, q:"Q3liZXIgS25pZ2h0IQ==", ans:"CYBER KNIGHT!"},
    {key:'hex', label:'Hex', x:10, y:60, q:"43 59 42 45 52 -> ?", ans:"CYBER"},
    {key:'vigenere', label:'Vigenere', x:60, y:70, q:"Key=KNIGHT, Cipher= PFKG ZH VZ YZ", ans:"CODE IS FUN"},
    {key:'emoji', label:'Emoji', x:30, y:80, q:"💻🔒 + 🧠 = ? (two words)", ans:"SECURE MIND"},
  ];

  const map = document.getElementById('l1map');
  if(!map) return;

  function placeCircle(n){
    const c = document.createElement('div');
    c.className = 'circle';
    c.style.left = `calc(${n.x}% - 60px)`;
    c.style.top  = `calc(${n.y}% - 60px)`;
    c.id = `l1_${n.key}`;
    c.textContent = n.label;
    c.onclick = ()=>openNode(n);
    map.appendChild(c);
  }
  function line(x1,y1,x2,y2){
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx,dy);
    const ang = Math.atan2(dy,dx) * 180/Math.PI;
    const L = document.createElement('div');
    L.className='line';
    L.style.width = len + '%';
    L.style.left = x1 + '%';
    L.style.top = y1 + '%';
    L.style.transform = `rotate(${ang}deg)`;
    map.appendChild(L);
  }

  nodes.forEach(placeCircle);
  // connect a few
  line(30,20,65,12); line(30,20,10,60); line(10,60,60,70); line(60,70,30,80); line(65,12,60,70);

  function openNode(n){
    modal(`<h3 class='title'>${n.label} Challenge</h3>
      <div class='small mt8'>${n.q}</div>
      <input id='l1answer' class='mt12' placeholder='Enter answer (case-insensitive)' />
      <div class='grid c2 mt12'><button class='btn' id='l1sub'>Submit</button><button class='btn secondary' onclick='closeModal()'>Cancel</button></div>`);
    const sub = document.getElementById('l1sub');
    if(sub) sub.onclick = ()=>checkL1(n.key, n.ans);
  }
}
// Normalize answer for Level 1 (removes spaces and punctuation, case-insensitive)
function normalizeAnswer(str){
  return (str||'').replace(/[^A-Z0-9]/gi,'').replace(/\s+/g,'').toUpperCase();
}
function checkL1(key, correct){
  const vEl = document.getElementById('l1answer'); if(!vEl) return;
  const v = vEl.value;
  if(normalizeAnswer(v) === normalizeAnswer(correct)){
    state.levelClears[1]++;
    const nodeEl = document.getElementById(`l1_${key}`);
    if(nodeEl) nodeEl.classList.add('done');
    closeModal(); toast('Correct!');
    if(state.levelClears[1] >= 1 && !state.qrEarned[1]) awardQR(1);
    const st = document.getElementById('l1status');
    if(st) st.innerHTML = `Cleared: ${state.levelClears[1]} / ${levelMeta[1].total}`;
    updateProgress(); saveGame();
  } else { toast('Try again!'); }
}

/* -----------------------
   LEVEL 2
----------------------- */
function renderLevel2(){
  const host = document.getElementById('level2');
  if(!host) return;
  host.innerHTML = `<h2 class="title">Level 2: <span class="accent">Find the Correct Link</span></h2>
    <div class="small">Each basket hides links. Reveal and select the legitimate one. Solve any one basket.</div>
    <div class="grid c2 mt12" id="l2grid"></div>
    <div id="l2status" class="mt12 small"></div>`;

  const baskets = [
    {name:'Banking', links:['paysecure.example','secure.payments.com','payments-com.support','paymments.com'], legit:1},
    {name:'University', links:['univ.edu','univ-verify-login.net','un1v.edu','univ-portal.help'], legit:0},
    {name:'Email', links:['mail.example.org','rnail.example.org','mail.example-login.org','example-mail.org-reset'], legit:0},
    {name:'Shopping', links:['shop.com','shop-com.sale','secure.shop-com.co','sh0p.com'], legit:0},
  ];

  const grid = document.getElementById('l2grid');
  if(!grid) return;

  baskets.forEach((b,bi)=>{
    const div = document.createElement('div'); div.className='basket';
    div.innerHTML = `<h4>🧺 ${b.name}</h4><button class='btn secondary' onclick='revealL2(${bi})'>Reveal Links</button><div id='l2b_${bi}' class='mt12 small'></div>`;
    grid.appendChild(div);
  });

  // local store of basket data for checking picks
  window.__l2 = [
    [{t:'paysecure.example',l:false},{t:'secure.payments.com',l:true},{t:'payments-com.support',l:false},{t:'paymments.com',l:false}],
    [{t:'univ.edu',l:true},{t:'univ-verify-login.net',l:false},{t:'un1v.edu',l:false},{t:'univ-portal.help',l:false}],
    [{t:'mail.example.org',l:true},{t:'rnail.example.org',l:false},{t:'mail.example-login.org',l:false},{t:'example-mail.org-reset',l:false}],
    [{t:'shop.com',l:true},{t:'shop-com.sale',l:false},{t:'secure.shop-com.co',l:false},{t:'sh0p.com',l:false}],
  ];
}
function revealL2(bi){
  const cont = document.getElementById(`l2b_${bi}`);
  if(!cont) return;
  if(!cont.dataset.revealed){
    cont.dataset.revealed = '1';
    cont.innerHTML = window.__l2[bi].map((x,i)=>`<div class='mt8'><button class='btn ghost' onclick='pickL2(${bi},${i},${x.l})'>${x.t}</button></div>`).join('');
  }
}
function pickL2(bi,i,legit){
  if(legit){
    state.levelClears[2]++;
    toast('Legit link!');
    const st = document.getElementById('l2status'); if(st) st.innerHTML = `Cleared: ${state.levelClears[2]} / ${levelMeta[2].total}`;
    if(state.levelClears[2] >= 1 && !state.qrEarned[2]) awardQR(2);
    updateProgress(); saveGame();
  } else {
    toast('Phishy link. Look carefully!');
  }
}

/* -----------------------
   LEVEL 3
----------------------- */
function renderLevel3(){
  const host = document.getElementById('level3');
  if(!host) return;
  host.innerHTML = `<h2 class="title">Level 3: <span class="accent">Connect the Meaning</span></h2>
    <div class="small">Three buzzers show emoji clues. Type the <strong>technical word</strong> you get. Solve any one buzzer.</div>
    <div class="grid c3 mt12" id="l3grid"></div>
    <div id="l3status" class="mt12 small"></div>`;

  const buzzers = [
    {emoji:'🐟🎣 + ✉️', ans:'PHISHING'},
    {emoji:'🔑 + 📓 + 👀', ans:'KEYLOGGER'},
    {emoji:'🧊 + ❌ + 🔗', ans:'BROKEN LINK'},
  ];
  const grid = document.getElementById('l3grid');
  if(!grid) return;
  buzzers.forEach((b,bi)=>{
    const div = document.createElement('div'); div.className='buzzer';
    div.innerHTML = `<div class='emoji'>${b.emoji}</div><input id='l3a_${bi}' class='mt12' placeholder='Type the word…'><button class='btn mt12' onclick='checkL3(${bi})'>Submit</button>`;
    grid.appendChild(div);
  });
  window.__l3answers = buzzers.map(b=>b.ans);
}
function normalize(ans){ return (ans||'').replace(/[^A-Z0-9]/gi,'').toUpperCase(); }
function checkL3(index){
  const el = document.getElementById(`l3a_${index}`); if(!el) return;
  const v = el.value;
  if(normalize(v) === normalize(window.__l3answers[index])){
    state.levelClears[3]++;
    toast('Correct!');
    const st = document.getElementById('l3status'); if(st) st.innerHTML = `Cleared: ${state.levelClears[3]} / ${levelMeta[3].total}`;
    if(state.levelClears[3] >= 1 && !state.qrEarned[3]) awardQR(3);
    updateProgress(); saveGame();
  } else {
    toast('Not quite. Consider the emojis again.');
  }
}

/* -----------------------
   LEVEL 4
----------------------- */
function renderLevel4(){
  const host = document.getElementById('level4');
  if(!host) return;
  host.innerHTML = `<h2 class="title">Level 4: <span class="accent">Fill a Strong Password</span></h2>
    <div class="small">Clues: include 'RED' (uppercase), at least one number, at least one symbol, and length ≥ 10.</div>
    <input id="l4pwd" type="password" class="mt12" placeholder="Enter proposed strong password">
    <button class="btn mt12" onclick="checkL4()">Submit</button>
    <div id="l4tips" class="mt12 small"></div>`;
}
function checkL4(){
  const p = (document.getElementById('l4pwd') || {}).value || '';
  const tips = [];
  // Case-insensitive check for presence of 'red'
  if(!/red/i.test(p)) tips.push("Must contain the word 'red' (any case).");
  if(!/\d/.test(p)) tips.push('Must include at least one number.');
  if(!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) tips.push('Must include at least one symbol.');
  if(p.length < 10) tips.push('Length must be ≥ 10.');
  const el = document.getElementById('l4tips');
  if(!el) return;
  if(tips.length){
    el.innerHTML = `<span style='color:var(--danger)'>❌ ${tips.join(' ')}</span>`;
    toast('Password not strong enough yet.');
  } else {
    el.innerHTML = "✅ Looks strong!";
    toast('Level cleared.');
    if(!state.qrEarned[4]){ state.levelClears[4]=1; awardQR(4); }
    updateProgress(); saveGame();
  }
}

/* -----------------------
   LEVEL 5
----------------------- */
const DOORS = [
  { code:`print(2**3**2)`, answer:"512" }, // 3**2=9; 2**9=512
  { code:`a=[1,2,3]\nprint(a[::-1][0])`, answer:"3" },
  { code:`def f(x, g=lambda y: y+1):\n    return g(x)*2\nprint(f(4))`, answer:"10" },
];
function renderLevel5(){
  const host = document.getElementById('level5');
  if(!host) return;
  host.innerHTML = `<h2 class="title">Level 5: <span class="accent">Three Doors — Code Output</span></h2>
    <div class="small">Click a door to reveal a Python snippet. Enter the exact output to clear. Solve any 1 to proceed.</div>
    <div class="doors mt12">
      <div class="door" onclick="openDoor(0)"><div class="handle"></div><div>Door 1</div></div>
      <div class="door" onclick="openDoor(1)"><div class="handle"></div><div>Door 2</div></div>
      <div class="door" onclick="openDoor(2)"><div class="handle"></div><div>Door 3</div></div>
    </div>
    <div id="l5status" class="mt12 small"></div>`;
}
function openDoor(i){
  const d = DOORS[i];
  modal(`<h3 class='title'>Door ${i+1}</h3><pre class='small' style='background:rgba(255,255,255,.04);padding:12px;border-radius:12px;border:1px solid rgba(124,245,255,.2)'>${d.code}</pre>
    <input id='l5a' class='mt12' placeholder='Enter program output'>
    <div class='grid c2 mt12'><button class='btn' id='l5sub'>Submit</button><button class='btn secondary' onclick='closeModal()'>Cancel</button></div>`);
  const sub = document.getElementById('l5sub');
  if(sub) sub.onclick = ()=>checkL5(i);
}
function checkL5(i){
  const vEl = document.getElementById('l5a'); if(!vEl) return;
  const v = vEl.value.trim();
  if(v === DOORS[i].answer){
    state.levelClears[5]++;
    toast('Correct!');
    closeModal();
    const st = document.getElementById('l5status'); if(st) st.innerHTML = `Cleared: ${state.levelClears[5]} / ${levelMeta[5].total}`;
    if(state.levelClears[5] >= 1 && !state.qrEarned[5]) awardQR(5);
    updateProgress(); saveGame();
  } else {
    toast('Nope. Try running it mentally again.');
  }
}

/* -----------------------
   award QR and display
----------------------- */
function awardQR(level){
  state.qrEarned[level] = true;
  renderHomeQR();
  const q = QR_FRAGMENTS[level-1];
  // modal with QR
  modal(`<h3 class='title'>QR Fragment Awarded — Level ${level}</h3>
    <div class='qr'><div id='qrHolder' style='width:120px;height:120px'></div>
    <div><div class='small'>Ciphertext</div><div class='cipher'>${q.cipher}</div><div class='small'>Hint: ${q.note}</div></div></div>`);
  try{
    const holder = document.getElementById('qrHolder');
    if(holder && typeof QRCode !== 'undefined'){
      new QRCode(holder, { text: q.cipher, width:120, height:120, correctLevel: QRCode.CorrectLevel.L });
    }
  }catch(e){ console.warn('awardQR QR generation error', e); }
  saveGame();
}

/* -----------------------
   initialization
----------------------- */
function init(){
  loadGame();
  renderLevelsSidebar();

  // wire UI safely, check existence
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

  const addTeamBtn = document.getElementById('addTeam');
  if(addTeamBtn) addTeamBtn.onclick = ()=>{
    const name = (document.getElementById('teamName') || {}).value || '';
    const n = name.trim();
    if(!n) return toast('Enter a team name');
    addTeam(n);
    const teamInput = document.getElementById('teamName');
    if(teamInput) teamInput.value = '';
  };
  const clearTeamsBtn = document.getElementById('clearTeams');
  if(clearTeamsBtn) clearTeamsBtn.onclick = ()=>{ localStorage.removeItem('ck-teams'); renderTeams(); };

  // render levels
  renderLevel1(); renderLevel2(); renderLevel3(); renderLevel4(); renderLevel5();

  // restore statuses into UI
  const l1s = document.getElementById('l1status'); if(l1s) l1s.innerHTML = `Cleared: ${state.levelClears[1]} / ${levelMeta[1].total}`;
  const l2s = document.getElementById('l2status'); if(l2s) l2s.innerHTML = `Cleared: ${state.levelClears[2]} / ${levelMeta[2].total}`;
  const l3s = document.getElementById('l3status'); if(l3s) l3s.innerHTML = `Cleared: ${state.levelClears[3]} / ${levelMeta[3].total}`;
  const l4s = document.getElementById('l4tips'); if(l4s) l4s.innerHTML = state.qrEarned[4]? '✅ Looks strong!' : '';
  const l5s = document.getElementById('l5status'); if(l5s) l5s.innerHTML = `Cleared: ${state.levelClears[5]} / ${levelMeta[5].total}`;

  updateProgress();
  renderTeams();
}

/* -----------------------
   scoreboard helper
----------------------- */
function addTeam(name){
  const teams = loadTeams();
  teams.push({ name, score:0 });
  localStorage.setItem('ck-teams', JSON.stringify(teams));
  renderTeams();
}
function loadTeams(){ try{ return JSON.parse(localStorage.getItem('ck-teams')||'[]'); }catch(e){ return []; } }
function renderTeams(){
  const teams = loadTeams();
  const el = document.getElementById('teams');
  if(!el) return;
  if(teams.length===0){ el.innerHTML = '<div class="small">No teams yet.</div>'; return; }
  el.innerHTML = teams.map((t,i)=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="flex:1">${t.name} <span class="small" style="color:var(--muted)">(${t.score})</span></div><div><button class="btn ghost" onclick="adjScore(${i},1)">+1</button><button class="btn ghost" onclick="adjScore(${i},-1)">-1</button></div></div>`).join('');
}
function adjScore(idx,delta){
  const teams = loadTeams(); if(!teams[idx]) return;
  teams[idx].score = Math.max(0, (teams[idx].score||0) + delta);
  localStorage.setItem('ck-teams', JSON.stringify(teams));
  renderTeams();
}

window.addEventListener('load', init);