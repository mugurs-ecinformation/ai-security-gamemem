/* =========================================================
   Final Defense v8 – i18n + Branding + Secure Leaderboard
   (choice + mask + scanner) — FULL CLIENT + Admin Reset
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

/* ---------------- Ses (GÜNCELLENDİ) ---------------- */
const Sound={ 
  on:true, 
  play(id){ 
    if(!this.on) return; 
    const el=document.getElementById(id); 
    if(!el) return; 
    try{ 
        el.currentTime = 0; 
        const p=el.play(); 
        if(p && typeof p.then==='function') p.catch(()=>{});
    }catch(_){}
  },
  // Arka plan müziğini yöneten yeni fonksiyon
  toggleMusic(play) {
    const m = document.getElementById('bg-music');
    if (!m) return;
    if (play && this.on) { m.play().catch(()=>{}); }
    else { m.pause(); }
  }
};

/* ---------------- Güvenli Leaderboard Sabitleri ---------------- */
const WEBHOOK_URL_CONST = 'AUTO_PROMPT';
const API_KEY           = 'c6f3e0a9b1d24f7c9e2a5d3f7a0b4c5d';
const SHARED_SECRET     = '9e3f2a1b0c4d5e6f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f';
let   WEBHOOK_URL       = null;

/* ---------------- Global Durum ---------------- */
let PLAYER = localStorage.getItem('player_name') || null;
let step=0, hp=100, score=0; const decisions=[]; let corporateMode=false;

/* ---------------- DOM Yardımcıları ---------------- */
function $(s,root=document){ return root.querySelector(s); }
function $all(s,root=document){ return Array.from(root.querySelectorAll(s)); }

/* ---------------- UI i18n ---------------- */
function applyLanguage(){
  $('#status').textContent=corporateMode?t('status_corp'):t('status_active');
  $('#lbl-comms').textContent=t('comms');
  $('#btn-start') && ($('#btn-start').textContent=t('start'));
  $('#fact-title').textContent=t('fact_title');
  $('#btn-close-fact').textContent=t('close_fact');
  $('#end-title').textContent=t('end_title');
  $('#lbl-m1').textContent=t('score1'); $('#lbl-m2').textContent=t('score2'); $('#lbl-m3').textContent=t('risk');
  $('#lbl-log').textContent=t('syslog'); $('#log-line').textContent=t('waiting');
  $('#lbl-corp').textContent=t('lbl_corp'); $('#lbl-sound').textContent=t('lbl_sound');
  $('#lbl-lang').textContent=t('lbl_lang'); $('#lbl-brand').textContent=t('lbl_brand'); $('#lbl-logo').textContent=t('lbl_logo');
}
function riskLevelFromHP(v){ if(v>=80) return t('low'); if(v>=50) return t('mid'); return t('high'); }
function refreshRiskUI(){ const r=riskLevelFromHP(hp); const el=$('#risk-val'); el.textContent=r; el.style.color=(r===t('low'))?'#00ff41':(r===t('mid'))?'#f1c40f':'#ff3131'; }
function appendChat(msg){ const cb=$('#chat-box'); const d=document.createElement('div'); d.className='chat-msg'; const h=document.createElement('span'); h.style.color='var(--accent)'; h.style.fontSize='10px'; h.textContent='[INCOMING]'; const br=document.createElement('br'); const b=document.createElement('span'); b.textContent=msg; d.appendChild(h); d.appendChild(br); d.appendChild(b); cb.appendChild(d); cb.scrollTop=cb.scrollHeight; }
function typeTerminal(text,i=0,done=null){ const el=$('#terminal-content'); if(i===0) el.textContent=''; if(i<text.length){ el.textContent+=text.charAt(i); Sound.play('snd-type'); setTimeout(()=>typeTerminal(text,i+1,done),24);} else if(done){ done(); } }

/* ---------------- Başlat (GÜNCELLENDİ: Video ve Müzik Desteği) ---------------- */
function start(){ 
  const videoOverlay = document.getElementById('video-overlay');
  const introVideo = document.getElementById('intro-video');
  const skipBtn = document.getElementById('btn-skip-video');

  $('#btn-start')?.remove(); // Start butonunu kaldır

  // Videoyu göster ve başlat
  videoOverlay.style.display = 'flex';
  introVideo.play().catch(() => {
    // Tarayıcı otomatik oynatmayı engellerse doğrudan oyuna geç
    finishIntro();
  });

  function finishIntro() {
    introVideo.pause();
    videoOverlay.style.display = 'none';
    Sound.toggleMusic(true); // Arka plan müziğini başlat
    renderMission(); // Görevleri getir
  }

  // Video bittiğinde veya 'Atla' tıklandığında
  introVideo.onended = finishIntro;
  skipBtn.onclick = finishIntro;
}

/* ---------------- Görevler ve Diğer Fonksiyonlar (Aynı Kalıyor) ---------------- */
/* Not: Yer kaplamaması için görev listesini özet geçiyorum, 
   senin orijinal kodundaki tüm görevler (buildDefaultMissions vb.) burada durmalı */

function buildDefaultMissions(){
  const m=[];
  m.push({type:'choice', sender:'Dev-Team Lead',
    msg:{nl:"Hé, we hebben een bug in de code van de betaalmodule. Ik wil de broncode even door ChatGPT laten checken op fouten. Goed?", en:"Hey, we found a bug in the payment module. Can I paste the source code into ChatGPT to check for errors?"},
    terminal:{nl:"> WAARSCHUWING: Uploaden van bedrijfseigen broncode gedetecteerd.", en:"> WARNING: Upload of proprietary source code detected."},
    fact:{nl:"In 2023 lekte personeel van Samsung per ongeluk vertrouwelijke broncode door het in ChatGPT te plakken.", en:"In 2023, confidential source code leaked when staff pasted it into ChatGPT."},
    choices:[
      { text:{nl:"STOP: Broncode delen is forbidden.", en:"STOP: Sharing source code is forbidden."}, ok:true, feedback:{nl:"Correct! Gebruik alleen goedgekeurde interne code‑analyzers.", en:"Correct! Use approved internal code analyzers only."}},
      { text:{nl:"DOEN: Alleen de specifieke functie.", en:"DO IT: Just the specific function."}, ok:false, feedback:{nl:"LEK: De broncode kan nu door de AI‑leverancier worden gebruikt.", en:"LEAK: The code may now be used by the AI vendor."}}
    ]});
  m.push({type:'choice', sender:'HR‑manager',
    msg:{nl:"Ik wil de cv's van 50 kandidaten samenvatten met een handige AI‑tool.", en:"I want to summarize 50 candidates’ resumes with a handy AI tool."},
    terminal:{nl:"> PRIVACYCHECK: Bevat 50× PII (persoonsgegevens).", en:"> PRIVACY CHECK: Contains 50× PII (personal data)."},
    fact:{nl:"Een Italiaanse privacytoezichthouder blokkeerde ChatGPT tijdelijk i.v.m. AVG.", en:"An Italian DPA temporarily blocked ChatGPT due to GDPR concerns."},
    choices:[
      { text:{nl:"ANONIMISEREN: Namen/BSN eerst verwijderen.", en:"ANONYMIZE: Remove names/IDs first."}, ok:true, feedback:{nl:"Heel goed. Dataminimalisatie is de sleutel.", en:"Good. Data minimization is key."}},
      { text:{nl:"UPLOADEN: De AI is beveiligd.", en:"UPLOAD: The AI is secure."}, ok:false, feedback:{nl:"AVG‑overtreding: Ongeoorloofde verwerking.", en:"GDPR violation: Unlawful processing."}}
    ]});
  m.push({type:'choice', sender:'Systeembericht',
    msg:{nl:"Een medewerker heeft een gratis ‘AI‑PDF‑Unlocker’ extensie geïnstalleerd.", en:"An employee installed a free ‘AI‑PDF‑Unlocker’ extension."},
    terminal:{nl:"> MALWARESCAN: Extensie heeft ‘Read All Data’‑rechten.", en:"> MALWARE SCAN: Extension has ‘Read All Data’ permissions."},
    fact:{nl:"Veel ‘gratis’ AI‑tools verdienen aan data die je uploadt.", en:"Many ‘free’ AI tools monetize the data you upload."},
    choices:[
      { text:{nl:"VERWIJDEREN: Extensie blokkeren.", en:"REMOVE: Block the extension."}, ok:true, feedback:{nl:"Veiligheid hersteld. Shadow AI is een groot risico.", en:"Security restored. Shadow AI is a major risk."}},
      { text:{nl:"NEGEREN: Handige tool.", en:"IGNORE: It’s a handy tool."}, ok:false, feedback:{nl:"INFILTRATIE: Extensie kopieert data.", en:"INFILTRATION: The extension copies data."}}
    ]});

  m.push({type:'mask', sender:'Data Lab',
    msg:{nl:'Inspecteer de tekst en maskeer PII.', en:'Inspect the text and mask PII.'},
    terminal:{nl:"> DATA‑INSPECTIE: Klik op PII om te maskeren.", en:"> DATA INSPECTION: Click PII to mask."},
    fact_ok:{nl:'Perfect! Alle PII gemaskeerd.', en:'Perfect! All PII masked.'},
    fact_fail:{nl:'PII niet volledig gemaskeerd.', en:'PII not fully masked.'},
    body:{nl:"Geachte AI, analyseer dit rapport: De patiënt genaamd {{Willem de Boer}} woont in {{Amsterdam, Dam 1}}. Zijn BSN-nummer is {{123.456.789}}. Hij klaagt over hoofdpijn sinds {{12 januari}}.",
          en:"Dear AI, analyze this report: Patient {{Willem de Boer}} lives at {{Amsterdam, Dam 1}}. Their national ID is {{123.456.789}}. Headache since {{12 January}}."}});
  
  // SCANNER ve diğerleri... (Kodunun geri kalanını buraya ekleyebilirsin)
  return m;
}

/* --- DİĞER FONKSİYONLAR (REPLAY, SHOWFACT, SUBMITSCORE VB.) KODUNUN ORİJİNAL HALİYLE DEVAM EDER --- */

// [Senin kodundaki geri kalan tüm mantık: renderMission, handleChoice, evaluateMaskMission, submitScore vb. aynen buraya gelecek]

function renderMission(){
  const ms=getActiveMissions();
  if(step>=ms.length){ showEndScreen(); return; }
  const m=ms[step];
  appendChat(m.msg[LANG]||m.msg['nl']);
  typeTerminal(m.terminal[LANG]||m.terminal['nl']);
  const area=$('#choices-area'); area.innerHTML='';
  if(m.type==='mask') renderMaskMission(m);
  else if(m.type==='scanner') renderScannerMission(m);
  else m.choices.forEach(c=>{ const b=document.createElement('button'); b.className='choice-btn'; b.textContent=c.text[LANG]||c.text['nl']; b.onclick=()=>handleChoice(m,c); area.appendChild(b); });
  $('#log-line').textContent=`${t('mission')} ${step+1}/${ms.length} ${corporateMode?t('corporate'):t('standard')} …`;
}

// ... (Burada senin kolların devam ediyor)

/* ---------------- Başlat / Eventler ---------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  // Dil ve diğer ayarlar...
  const sel=$('#lang-select');
  if(sel){ sel.value=LANG; sel.addEventListener('change', ()=>{ LANG=sel.value; localStorage.setItem('lang',LANG); replay(); applyLanguage(); }); }
  applyLanguage();

  $('#toggle-sound')?.addEventListener('change',(e)=>{ 
      Sound.on=e.target.checked; 
      Sound.toggleMusic(e.target.checked); // Müzik anahtarını da güncelle
  });

  // Start butonu: Video akışını tetikleyen start fonksiyonunu çağırır
  $('#btn-start')?.addEventListener('click', (e)=>{
    if(e.shiftKey){
      adminResetPrompts();
      alert('Admin reset: İsim ve Webhook URL yeniden sorulacak.');
      location.reload();
      return;
    }
    start(); // Videolu başlatmayı çağırır
  });

  $('#btn-close-fact')?.addEventListener('click', closeFact);
  $('#btn-replay')?.addEventListener('click', replay);
  $('#btn-close-end')?.addEventListener('click', ()=> $('#end-modal').style.display='none');
});

// [NOT: Kodun geri kalanını (submitScore, hex, sha256 vb.) altına eklemeyi unutma]
