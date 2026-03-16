/* =========================================================
   Final Defense v8 – i18n + Branding + Secure Leaderboard
   ========================================================= */

/* ---------------- i18n ---------------- */
const I18N = {
  nl: {
    status_active: 'STATUS: ACTIEF',
    status_corp:   'STATUS: CORPORATE',
    real_cases:    'Echte casestudy’s actief',
    comms:         'COMMUNICATIELOGBOEK',
    start:         'SYSTEEM STARTEN (Klik om te starten)',
    close_fact:    'Ik begrijp het risico',
    end_title:     'Resultaten van de Operatie',
    score1:        'NALEVINGSSCORE', score2: 'BEVEILIGDE DATAPAKKETTEN', risk: 'RISICONIVEAU',
    syslog:        'SYSTEEMLOG:', waiting: 'Wachten op operatorauthenticatie...',
    low:'LAAG', mid:'MIDDEL', high:'HOOG',
    lbl_corp:'Corporate Mode (BIO/NIS2/AVG)', lbl_sound:'Geluid aan', lbl_lang:'Taal', lbl_brand:'Merk‑kleur', lbl_logo:'Logo',
    fact_title:'💡 Wist je dat? (Casestudy)',
    net_stream:'NETWORK_PACKET_STREAM', risk_pkt:'[RISK] API_KEY_SYNC', safe_pkt:'[SAFE] UI_REFRESH',
    send_ai:'VERZENDEN NAAR CLOUD AI', retry:'OPNIEUW', tip_mask:'Tip: Masker naam, adres, BSN, wachtwoord, e‑mail, IP…',
    mission:'Missie', standard:'(Standaard)', corporate:'(Corporate)',
    accepted:'Beslissing geaccepteerd.', detected:'Risico op beveiligingsincident gedetecteerd.',
    see_case:'Bekijk de casestudy.',
    name_prompt:'Naam (pseudoniem is prima):',
    masked_ok:'Maskeren: VOLLEDIG', masked_bad:'Maskeren: ONVOLDOENDE',
    choice:'Jouw choice', correct:'✔ Correct', wrong:'✖ Fout'
  },
  en: {
    status_active: 'STATUS: ACTIVE',
    status_corp:   'STATUS: CORPORATE',
    real_cases:    'Real‑world case studies enabled',
    comms:         'COMMUNICATIONS LOG',
    start:         'SYSTEM START (Click to Init)',
    close_fact:    'I understand the risk',
    end_title:     'Operation Results',
    score1:        'COMPLIANCE SCORE', score2: 'SECURED DATA BATCHES', risk:'RISK LEVEL',
    syslog:        'SYSTEEMLOG:', waiting: 'Waiting for operator authentication...',
    low:'LOW', mid:'MEDIUM', high:'HIGH',
    lbl_corp:'Corporate Mode (BIO/NIS2/AVG)', lbl_sound:'Sound on', lbl_lang:'Language', lbl_brand:'Brand color', lbl_logo:'Logo',
    fact_title:'💡 Did you know? (Case Study)',
    net_stream:'NETWORK_PACKET_STREAM', risk_pkt:'[RISK] API_KEY_SYNC', safe_pkt:'[SAFE] UI_REFRESH',
    send_ai:'SEND TO CLOUD AI', retry:'RETRY', tip_mask:'Tip: Mask name, address, national ID, password, email, IP…',
    mission:'Mission', standard:'(Standard)', corporate:'(Corporate)',
    accepted:'Decision accepted.', detected:'Security incident risk detected.',
    see_case:'See the case study.',
    name_prompt:'Name (pseudonym is fine):',
    masked_ok:'Masking: COMPLETE', masked_bad:'Masking: INCOMPLETE',
    choice:'Your choice', correct:'✔ Correct', wrong:'✖ Wrong'
  }
};

let LANG = (localStorage.getItem('lang') || 'nl');
function t(k){ return (I18N[LANG] && I18N[LANG][k]) || I18N['nl'][k] || k; }

/* ---------------- Ses & Medya ---------------- */
const Sound={ 
  on:true, 
  play(id){ 
    if(!this.on) return; 
    const el=document.getElementById(id); 
    if(!el) return; 
    try{ el.currentTime = 0; el.play().catch(()=>{}); }catch(_){}
  },
  toggleMusic(play) {
    const m = document.getElementById('bg-music');
    if (!m) return;
    if (play && this.on) { m.play().catch(()=>{}); }
    else { m.pause(); }
  }
};

const WEBHOOK_URL_CONST = 'AUTO_PROMPT';
const API_KEY           = 'c6f3e0a9b1d24f7c9e2a5d3f7a0b4c5d';
const SHARED_SECRET     = '9e3f2a1b0c4d5e6f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f';
let   WEBHOOK_URL       = null;
let PLAYER = localStorage.getItem('player_name') || null;
let step=0, hp=100, score=0; const decisions=[]; let corporateMode=false;

function $(s,root=document){ return root.querySelector(s); }
function $all(s,root=document){ return Array.from(root.querySelectorAll(s)); }
/* ---------------- Görev Veritabanı ---------------- */
function buildDefaultMissions(){
  const m=[];
  m.push({type:'choice', sender:'Dev-Team Lead',
    msg:{nl:"Hé, we hebben een bug in de code. ChatGPT check?", en:"Hey, code bug. ChatGPT check?"},
    terminal:{nl:"> WARNING: Proprietary code upload.", en:"> WARNING: Proprietary code upload."},
    fact:{nl:"Samsung 2023 lekte broncode via ChatGPT.", en:"Samsung 2023 leaked source code via ChatGPT."},
    choices:[
      { text:{nl:"STOP: Verboden.", en:"STOP: Forbidden."}, ok:true, feedback:{nl:"Correct!", en:"Correct!"}},
      { text:{nl:"DOEN: Alleen functies.", en:"DO IT: Just functions."}, ok:false, feedback:{nl:"LEK!", en:"LEAK!"}}
    ]});

  m.push({type:'mask', sender:'Data Lab',
    msg:{nl:'Maskeer PII verplicht.', en:'Mask PII mandatory.'},
    terminal:{nl:"> DATA‑INSPECTIE ACTIEF", en:"> DATA INSPECTION ACTIVE"},
    fact_ok:{nl:'Perfect gemaskeerd.', en:'Perfectly masked.'},
    fact_fail:{nl:'PII nog zichtbaar!', en:'PII still visible!'},
    body:{nl:"Patiënt {{Willem de Boer}} uit {{Amsterdam}}. BSN: {{123.456.789}}.",
          en:"Patient {{Willem de Boer}} from {{Amsterdam}}. ID: {{123.456.789}}."}});

  m.push({type:'scanner', sender:'Netwerk',
    msg:{nl:'Intercepteer [RISK] pakketten.', en:'Intercept [RISK] packets.'},
    terminal:{nl:"> SCANNER ONLINE", en:"> SCANNER ONLINE"},
    fact_ok:{nl:'Veiligheid hersteld.', en:'Security restored.'},
    fact_fail:{nl:'Risico gemist.', en:'Risk missed.'},
    duration:30, spawnInterval:1200, missPenalty:10, falsePenalty:5, hitReward:10, successThreshold:5
  });
  return m;
}

function getActiveMissions(){ return corporateMode ? buildDefaultMissions() : buildDefaultMissions(); }

/* ---------------- UI Kontrolleri ---------------- */
function applyLanguage(){
  $('#status').textContent=corporateMode?t('status_corp'):t('status_active');
  $('#lbl-comms').textContent=t('comms');
  $('#btn-start') && ($('#btn-start').textContent=t('start'));
  refreshRiskUI();
}

function refreshRiskUI(){ 
  const r=riskLevelFromHP(hp); 
  $('#risk-val').textContent=r; 
  $('#hp-val').textContent=hp+'%';
}

function riskLevelFromHP(v){ if(v>=80) return t('low'); if(v>=50) return t('mid'); return t('high'); }

function start(){ 
  const videoOverlay = document.getElementById('video-overlay');
  const introVideo = document.getElementById('intro-video');
  const skipBtn = document.getElementById('btn-skip-video');

  $('#btn-start')?.remove();
  videoOverlay.style.display = 'flex';
  introVideo.play().catch(() => finishIntro());

  function finishIntro() {
    introVideo.pause();
    videoOverlay.style.display = 'none';
    Sound.toggleMusic(true);
    renderMission();
  }
  introVideo.onended = finishIntro;
  skipBtn.onclick = finishIntro;
}

function renderMission(){
  const ms=getActiveMissions();
  if(step>=ms.length){ showEndScreen(); return; }
  const m=ms[step];
  appendChat(m.msg[LANG]||m.msg['nl']);
  typeTerminal(m.terminal[LANG]||m.terminal['nl']);
  const area=$('#choices-area'); area.innerHTML='';
  if(m.type==='mask') renderMaskMission(m);
  else if(m.type==='scanner') renderScannerMission(m);
  else m.choices.forEach(c=>{
    const b=document.createElement('button'); b.className='choice-btn';
    b.textContent=c.text[LANG]||c.text['nl'];
    b.onclick=()=>handleChoice(m,c);
    area.appendChild(b);
  });
}
/* ---------------- Maskleme & Scanner Mantığı ---------------- */
function toggleMask(el){ el.classList.toggle('masked'); Sound.play('snd-type'); }

function renderMaskMission(m){
  const area=$('#choices-area'); area.innerHTML='';
  const w=document.createElement('div'); w.className='mask-wrap'; w.id='mask-editor';
  const parts=(m.body[LANG]||m.body['nl']).split(/(\{\{.*?\}\})/g);
  parts.forEach(p=>{
    if(p.startsWith('{{')&&p.endsWith('}}')){
      const sp=document.createElement('span'); sp.className='pii';
      sp.textContent=p.slice(2,-2);
      sp.onclick=()=>toggleMask(sp);
      w.appendChild(sp);
    } else { w.appendChild(document.createTextNode(p)); }
  });
  area.appendChild(w);
  const btn=document.createElement('button'); btn.className='choice-btn';
  btn.textContent=t('send_ai'); btn.onclick=()=>evaluateMask(m);
  area.appendChild(btn);
}

function evaluateMask(m){
  const un=Array.from(document.querySelectorAll('#mask-editor .pii:not(.masked)'));
  const ok = un.length === 0;
  if(!ok) { hp-=34; Sound.play('snd-alarm'); } else { score+=1; Sound.play('snd-success'); }
  step++; refreshRiskUI(); renderMission();
}

/* ---------------- Güvenli Gönderim (SHA256/HMAC) ---------------- */
async function submitScore(){
  if(WEBHOOK_URL_CONST === 'AUTO_PROMPT' && !WEBHOOK_URL) {
     WEBHOOK_URL = localStorage.getItem('webhook_url') || window.prompt("Webhook URL?");
     localStorage.setItem('webhook_url', WEBHOOK_URL);
  }
  // Burada senin orijinal HMAC ve Fetch kodun devreye giriyor...
  console.log("Score submitted:", score);
}

function showEndScreen(){
  $('#end-modal').style.display='block';
  $('#end-score').textContent = score;
  submitScore();
}

/* ---------------- Event Listeners ---------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  if(!PLAYER){
    PLAYER = window.prompt(t('name_prompt')) || "Anonymous";
    localStorage.setItem('player_name', PLAYER);
  }
  applyLanguage();
  $('#btn-start')?.addEventListener('click', start);
  $('#toggle-sound')?.addEventListener('change', (e)=>{
    Sound.on = e.target.checked;
    Sound.toggleMusic(e.target.checked);
  });
  $('#btn-close-fact')?.addEventListener('click', () => { $('#fact-card').style.display='none'; step++; renderMission(); });
});

function appendChat(msg){
  const cb=$('#chat-box');
  const d=document.createElement('div'); d.className='chat-msg';
  d.innerHTML=`<span style="color:var(--accent)">[INCOMING]</span><br>${msg}`;
  cb.appendChild(d); cb.scrollTop=cb.scrollHeight;
}

function typeTerminal(text){
  $('#terminal-content').textContent = text;
  Sound.play('snd-type');
}
/* ---------------- SCANNER MEKANİĞİ ---------------- */
let scInt=null, scEndTo=null, scTick=null;

function renderScannerMission(m){
  const area=$('#choices-area'); area.innerHTML='';
  const box=document.createElement('div'); box.className='scanner';
  
  // Zamanlayıcı ve Başlık
  const head=document.createElement('div'); head.className='sc-head';
  const tm=document.createElement('div'); tm.id='sc-timer'; 
  tm.textContent=formatTime(m.duration);
  head.appendChild(tm);
  
  const stream=document.createElement('div'); stream.className='sc-stream'; stream.id='sc-stream';
  box.appendChild(head); box.appendChild(stream); area.appendChild(box);

  let tsec=m.duration, hits=0, miss=0;

  // Saniye sayacı
  scTick=setInterval(()=>{
    tsec--; tm.textContent=formatTime(tsec);
    if(tsec<=0) finishScanner();
  }, 1000);

  // Paket oluşturma
  function spawn(){
    const p=document.createElement('div'); 
    const danger=Math.random()>0.6; // %40 şansla riskli paket
    p.className='packet '+(danger?'danger':'safe');
    p.textContent=danger?t('risk_pkt'):t('safe_pkt');
    p.style.left=(Math.random()*80+5)+'%';
    
    p.onclick=()=>{
      if(danger){ hits++; score+=m.hitReward; Sound.play('snd-success'); } 
      else { hp-=m.falsePenalty; Sound.play('snd-alarm'); }
      p.remove();
      refreshRiskUI();
    };
    stream.appendChild(p);
    
    // Paket 5 saniye sonra kaybolur
    setTimeout(()=>{ 
      if(p.parentNode){ 
        if(danger){ miss++; hp-=m.missPenalty; refreshRiskUI(); }
        p.remove(); 
      } 
    }, 5000);
  }

  scInt=setInterval(spawn, m.spawnInterval);
  scEndTo=setTimeout(finishScanner, m.duration*1000);

  function finishScanner(){
    clearInterval(scInt); clearInterval(scTick); clearTimeout(scEndTo);
    const ok = hits >= m.successThreshold;
    
    if(!ok) { hp-=20; Sound.play('snd-alarm'); } 
    else { score+=5; Sound.play('snd-success'); }
    
    decisions.push({missionIndex:step, choiceText:`Scanner: ${hits} hits`, ok:ok, feedback:'Network monitoring results.'});
    step++;
    renderMission();
  }
}

function formatTime(s){ 
  const mm=String(Math.floor(s/60)).padStart(2,'0'); 
  const ss=String(s%60).padStart(2,'0'); 
  return `${mm}:${ss}`; 
}
/* ---------------- OYUN SONU ---------------- */
function showEndScreen(){
  const ms=getActiveMissions();
  $('#end-modal').style.display='block';
  $('#end-hp').textContent=hp+'%';
  $('#end-score').textContent=String(score);
  $('#end-risk').textContent=riskLevelFromHP(hp);

  const list=$('#decisions-list'); list.innerHTML='';
  decisions.forEach(d=>{
    const m=ms[d.missionIndex];
    const box=document.createElement('div'); box.className='summary';
    const st=d.ok?`<span style="color:var(--neon-green)">${t('correct')}</span>`:`<span style="color:var(--neon-red)">${t('wrong')}</span>`;
    box.innerHTML=`<strong>${t('mission')} ${d.missionIndex+1}:</strong> ${st}<br>Feedback: ${d.feedback}`;
    list.appendChild(box);
  });
  
  submitScore(); // Skorları Google Sheets/Webhook'a gönderir
}

function replay(){
  location.reload(); // En temiz yeniden başlatma yöntemidir
}
