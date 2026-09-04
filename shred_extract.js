/* ================================================================
   SHRED — Étape 1 manche + Anki d'accords (auto-évaluation).
   ================================================================ */
const NOTES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const NAT=[0,2,4,5,7,9,11];
const OPEN=[40,45,50,55,59,64];              /* Mi La Ré Sol Si Mi (grave→aigu) */
const STR_NAME=['Mi grave','La','Ré','Sol','Si','Mi aigu'];
const strNo=s=>6-s;
const midiAt=(s,f)=>OPEN[s]+f;
const noteAt=(s,f)=>NOTES[midiAt(s,f)%12];
const FRETS=12;

const DEFAULT={chords:{}, cNewDay:{date:null,n:0}, triads:{}, tNewDay:{date:null,n:0}, streak:0, lastDay:null, xp:0,
  findBest:{}, chordFindBest:{}, quizBest:0, cagedQuizBest:0, powBest:0, sprint:{best:{}}, showNames:false, natOnly:true, bpm:{}, sess:{date:null,done:[]}};
let S=load();
function load(){ try{return Object.assign({},DEFAULT,JSON.parse(localStorage.getItem('shred2')||'{}'));}catch(e){return {...DEFAULT};} }
function save(){ localStorage.setItem('shred2',JSON.stringify(S)); }
const today=()=>new Date().toISOString().slice(0,10);
function markDay(){ const t=today(); if(S.lastDay!==t){ const y=new Date(Date.now()-864e5).toISOString().slice(0,10); S.streak=(S.lastDay===y)?S.streak+1:1; S.lastDay=t; save(); } }
function el(t,c,h){ const e=document.createElement(t); if(c)e.className=c; if(h!=null)e.innerHTML=h; return e; }
function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.add('show'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2100); }

/* ---------------- audio : corde pincée (Karplus-Strong) ---------------- */
let AC=null;
function ac(){ if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended')AC.resume(); return AC; }
function pluck(midi,dur=1.3,vel=.5,when=0){
  const ctx=ac(), sr=ctx.sampleRate, f=440*Math.pow(2,(midi-69)/12);
  const N=Math.max(2,Math.round(sr/f)), len=Math.floor(sr*dur);
  const buf=ctx.createBuffer(1,len,sr), d=buf.getChannelData(0), y=new Float32Array(len);
  for(let i=0;i<N;i++) y[i]=Math.random()*2-1;
  const damp=.9955; for(let i=N;i<len;i++) y[i]=damp*.5*(y[i-N]+y[i-N+1]);
  for(let i=0;i<len;i++){ const env=Math.min(1,i/220)*(1-i/len); d[i]=y[i]*vel*env; }
  const src=ctx.createBufferSource(); src.buffer=buf;
  const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=Math.min(sr/2,f*7+1800);
  const g=ctx.createGain(); g.gain.value=1; src.connect(lp); lp.connect(g); g.connect(ctx.destination); src.start(when?ctx.currentTime+when:0);
}
function strum(ch){ ac(); const ms=[]; for(let s=0;s<6;s++){ if(ch.frets[s]>=0) ms.push(OPEN[s]+ch.frets[s]); } ms.forEach((m,i)=>setTimeout(()=>pluck(m,1.5,.42),i*42)); }

/* ---------------- fretboard ---------------- */
function buildFretboard(onTap,nf){
  nf=nf||FRETS;
  const wrap=el('div','fbwrap'), fb=el('div','fb'), cells={};
  const gtc='38px repeat('+nf+',minmax(34px,1fr))', mw=Math.max(520,38+nf*40)+'px';
  fb.style.minWidth=mw;
  for(let s=5;s>=0;s--){ const row=el('div','frow'); row.style.gridTemplateColumns=gtc;
    for(let f=0;f<=nf;f++){ const c=el('div','fcell'+(f===0?' nut':'')); c.appendChild(el('div','sl')); c.dataset.s=s; c.dataset.f=f; c.onclick=()=>onTap&&onTap(s,f,c); row.appendChild(c); cells[s+':'+f]=c; }
    fb.appendChild(row); }
  wrap.appendChild(fb);
  const nums=el('div','fnums'), marks={3:1,5:1,7:1,9:1,12:2,15:1}; nums.style.gridTemplateColumns=gtc; nums.style.minWidth=mw;
  for(let f=0;f<=nf;f++) nums.appendChild(el('div',marks[f]===2?'mk2':marks[f]?'mk':'',''+f));
  wrap.appendChild(nums);
  wrap.clearDots=()=>{ Object.values(cells).forEach(c=>{ const d=c.querySelector('.fdot'); if(d)d.remove(); }); };
  wrap.dot=(s,f,label,cls)=>{ const c=cells[s+':'+f]; if(!c)return; let d=c.querySelector('.fdot'); if(!d){ d=el('div','fdot'); c.appendChild(d);} d.className='fdot '+(cls||''); d.textContent=label==null?'':label; return d; };
  return wrap;
}

/* ================================================================
   LE SPRINT DES CORDES — apprendre une corde à la fois, contre la montre
   ================================================================ */
var _sprintTimer=null;
const SPRINT_N=10;
function buildStringStrip(s,onTap){
  const wrap=el('div'), strip=el('div','sstrip'), cells=[];
  for(let f=0;f<=FRETS;f++){ const c=el('div','scell'); c.appendChild(el('div','sl2')); c.dataset.f=f; c.onclick=()=>onTap&&onTap(f,c); strip.appendChild(c); cells.push(c); }
  wrap.appendChild(strip);
  const nums=el('div','snums'), marks={3:1,5:1,7:1,9:1,12:2};
  for(let f=0;f<=FRETS;f++) nums.appendChild(el('div',marks[f]===2?'mk2':marks[f]?'mk':'',''+f));
  wrap.appendChild(nums);
  wrap.dot=(f,label,cls)=>{ const c=cells[f]; let d=c.querySelector('.fdot'); if(!d){ d=el('div','fdot'); c.appendChild(d);} d.className='fdot '+(cls||''); d.textContent=label==null?'':label; return d; };
  wrap.clear=()=>cells.forEach(c=>{ const d=c.querySelector('.fdot'); if(d)d.remove(); });
  wrap.flash=(f)=>{ const c=cells[f]; c.classList.add('flash'); setTimeout(()=>c.classList.remove('flash'),200); };
  return wrap;
}
function sprintBest(s){ return (S.sprint&&S.sprint.best&&S.sprint.best[s])||null; }
function sprintRecommend(){ for(const k of [0,1,2,3,4,5]){ const b=sprintBest(k); if(!b||!b.clean) return k; } return 0; }
function openStringSprint(){
  ac(); markDay();
  let s=sprintRecommend(), withSharps=false;
  openOverlay('Le sprint des cordes', inner=>{
    inner.appendChild(el('p','lead','Une corde à la fois. Je te dis une note, tu la touches sur cette corde le plus VITE possible. But : trouver chaque note sans réfléchir — la vitesse vient toute seule après.'));
    const pick=el('div','card'); pick.appendChild(el('b',null,'1. Choisis ta corde'));
    const chips=el('div','toolrow'); const chipEls=[0,1,2,3,4,5].map(k=>{ const b=sprintBest(k);
      const t=el('div','tag'+(k===s?' on':''), STR_NAME[k]+(b&&b.clean?' ✓':'')); t.onclick=()=>{ s=k; chipEls.forEach(x=>x.classList.remove('on')); t.classList.add('on'); refresh(); }; chips.appendChild(t); return t; }); pick.appendChild(chips);
    const shTag=el('div','tag','Inclure les ♯/♭'); const shRow=el('div','toolrow'); shRow.appendChild(shTag);
    shTag.onclick=()=>{ withSharps=!withSharps; shTag.classList.toggle('on',withSharps); refresh(); }; pick.appendChild(shRow);
    const rec=el('p','lead',''); pick.appendChild(rec); inner.appendChild(pick);
    const arena=el('div','card'); inner.appendChild(arena);
    function refresh(){
      const b=sprintBest(s);
      rec.innerHTML=`Corde <b>${strNo(s)}</b> — ${STR_NAME[s]}. ${b?('Record : <b style="color:var(--acc)">'+(b.ms/1000).toFixed(1)+'s</b>'+(b.clean?' · ✓ déjà sans faute':'')):'Jamais tenté.'}`;
      arena.innerHTML=''; arena.appendChild(el('b',null,'2. Prêt ?'));
      arena.appendChild(el('p','lead',`${SPRINT_N} notes à trouver sur la corde de <b>${STR_NAME[s]}</b>${withSharps?' (dièses compris)':''}. Le chrono part à la 1re note.`));
      const go=el('button','btn','▶ Go !'); go.onclick=()=>runSprint(s,arena,refresh,withSharps); arena.appendChild(go);
    }
    refresh();
  });
}
function runSprint(s,arena,back,withSharps){
  const pool = withSharps? [0,1,2,3,4,5,6,7,8,9,10,11] : NAT.slice();
  const shuf=a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i];a[i]=a[j];a[j]=t; } return a; };
  const seq=shuf(pool).concat(shuf(pool)).slice(0,SPRINT_N);
  let i=0, err=0, t0=0;
  arena.innerHTML='';
  const prompt=el('div','qhead'); arena.appendChild(prompt);
  const strip=buildStringStrip(s,(f,cell)=>onTap(f,cell)); arena.appendChild(strip);
  const foot=el('div'); arena.appendChild(foot);
  function tick(){ const t=prompt.querySelector('.timer'); if(t&&t0) t.textContent=((performance.now()-t0)/1000).toFixed(1)+'s'; }
  function show(){ const pc=seq[i], name=NOTES[pc], elapsed=t0?((performance.now()-t0)/1000).toFixed(1):'0.0';
    prompt.innerHTML=`<div class="sub">Note <b>${i+1}</b>/${SPRINT_N} · ❌ ${err} · <span class="timer bigtimer">${elapsed}s</span></div><div class="q" style="font-size:40px">${name}</div><div class="sub">sur la corde de ${STR_NAME[s]}</div>`;
    if(i===0 && !t0){ t0=performance.now(); if(_sprintTimer)clearInterval(_sprintTimer); _sprintTimer=setInterval(tick,100); }
  }
  function onTap(f,cell){ if(strip._done)return; pluck(midiAt(s,f));
    if(midiAt(s,f)%12===seq[i]){ strip.flash(f); const d=strip.dot(f,NOTES[seq[i]],'ok'); setTimeout(()=>{ if(d&&d.parentNode)d.remove(); },260); i++; if(i>=SPRINT_N) return finish(); show(); }
    else { err++; const d=strip.dot(f,NOTES[midiAt(s,f)%12],'no'); setTimeout(()=>{ if(d&&d.parentNode)d.remove(); },360); show(); }
  }
  function finish(){ strip._done=true; if(_sprintTimer){ clearInterval(_sprintTimer); _sprintTimer=null; } const ms=performance.now()-t0;
    if(!S.sprint.best)S.sprint.best={}; const prev=S.sprint.best[s]||{ms:Infinity,clean:false};
    const isBest=ms<prev.ms; S.sprint.best[s]={ ms:Math.min(prev.ms,ms), clean:prev.clean||err===0 };
    S.xp+=Math.max(2,SPRINT_N-err); save();
    prompt.innerHTML=`<div class="q">${(ms/1000).toFixed(1)}s</div><div class="sub">${err===0?'⭐ Sans faute !':err+' erreur(s) — vise le sans-faute'}${isBest?' · 🏆 nouveau record !':''}</div>`;
    strip.clear(); foot.innerHTML='';
    const again=el('button','btn','↻ Encore'); again.onclick=()=>runSprint(s,arena,back,withSharps); foot.appendChild(again);
    const chg=el('button','btn ghost','← Changer de corde'); chg.onclick=back; foot.appendChild(chg);
  }
  show();
}

/* ================================================================
   VUE : LE MANCHE
   ================================================================ */
function renderManche(){
  const m=document.getElementById('main'); m.innerHTML='';
  m.appendChild(el('h1','page','Le manche'));
  m.appendChild(el('p','lead','Étape 1 : le connaître par cœur. Explore, puis entraîne-toi à trouver TOUTES les positions d’une note d’un coup.'));
  const c=el('div','card');
  const showTag=el('div','tag'+(S.showNames?' on':''),'👁 Voir les notes');
  const natTag=el('div','tag'+(S.natOnly?' on':''),'Naturelles seules');
  const tools=el('div','toolrow'); tools.appendChild(showTag); tools.appendChild(natTag); c.appendChild(tools);
  const fb=buildFretboard((s,f,cell)=>{ pluck(midiAt(s,f)); cell.classList.add('flash'); setTimeout(()=>cell.classList.remove('flash'),200);
    if(!S.showNames){ const d=fb.dot(s,f,noteAt(s,f), midiAt(s,f)%12===0?'root':(NAT.includes(midiAt(s,f)%12)?'on':'')); setTimeout(()=>{ if(!S.showNames&&d&&d.parentNode)d.remove(); },1100); } });
  c.appendChild(fb); m.appendChild(c);
  function paint(){ fb.clearDots(); if(S.showNames){ for(let s=0;s<6;s++)for(let f=0;f<=FRETS;f++){ const pc=midiAt(s,f)%12; if(S.natOnly&&!NAT.includes(pc))continue; fb.dot(s,f,noteAt(s,f), pc===0?'root':(NAT.includes(pc)?'on':'')); } } }
  showTag.onclick=()=>{ S.showNames=!S.showNames; save(); showTag.classList.toggle('on',S.showNames); paint(); };
  natTag.onclick=()=>{ S.natOnly=!S.natOnly; save(); natTag.classList.toggle('on',S.natOnly); paint(); };
  paint();

  const c2=el('div','card');
  c2.innerHTML='<b>🔎 Trouve toutes les positions</b><p class="lead" style="margin:6px 0 10px">L’app te donne une note. Touche TOUTES ses cases sur le manche, puis valide — tu vois combien tu en as trouvées.</p>';
  const b=el('button','btn','Lancer « trouve tout »'); b.onclick=()=>openFindAll(); c2.appendChild(b);
  const b2=el('button','btn ghost','🎯 Nommer 10 cases au hasard'); b2.onclick=()=>openNameQuiz(); c2.appendChild(b2);
  m.appendChild(c2);

  const cch=el('div','card');
  cch.innerHTML='<b>🎸 Toutes les notes d’un accord</b><p class="lead" style="margin:6px 0 10px">Le cran au-dessus de « trouve tout » : l’app te donne un accord (<b>Fa majeur = Fa · La · Do</b>). Touche <b>toutes</b> les cases qui contiennent <b>une de ses 3 notes</b>, partout sur le manche. Tu bosses les notes ET la construction de l’accord d’un coup.</p>';
  const bch=el('button','btn','Lancer « les notes de l’accord »'); bch.onclick=()=>openFindChord(); cch.appendChild(bch);
  const cb=Object.values(S.chordFindBest||{}); if(cb.length) cch.appendChild(el('p','lead',`Meilleur : <span style="color:var(--acc);font-weight:700">${Math.max.apply(null,cb.map(x=>x.pct))}%</span>.`)).style.margin='10px 0 0';
  m.appendChild(cch);

  const cs=el('div','card');
  cs.innerHTML='<b>⏱ Le sprint des cordes</b><p class="lead" style="margin:6px 0 10px">Corde par corde (Mi grave d’abord). Je nomme une note, tu la touches le plus vite possible sur cette corde. Le chrono te pousse à ne plus réfléchir.</p>';
  const bs=el('button','btn','Lancer le sprint'); bs.onclick=()=>openStringSprint(); cs.appendChild(bs);
  const done=[0,1,2,3,4,5].filter(k=>{ const b=sprintBest(k); return b&&b.clean; }).length;
  cs.appendChild(el('p','lead',`<span style="color:var(--acc);font-weight:700">${done}/6</span> cordes réussies sans faute.`)).style.margin='10px 0 0';
  m.appendChild(cs);

  const cg=el('div','card');
  cg.innerHTML='<b>🪜 La gamme majeure en positions</b><p class="lead" style="margin:6px 0 10px">Une fois les notes en place : les <b>5 formes</b> de la gamme majeure, à connaître dans l’ordre. C’est ta penta + 2 notes. Commence par la Position 1 — mobile, tu joues en majeur dans toutes les tonalités.</p>';
  const bg=el('button','btn ghost','Voir les positions'); bg.onclick=()=>openMajorPositions(); cg.appendChild(bg);
  m.appendChild(cg);

  const cc=el('div','card');
  cc.innerHTML='<b>🗺️ Le système CAGED</b><p class="lead" style="margin:6px 0 10px">La clé du manche : <b>5 formes d’accord</b> (C-A-G-E-D) qui, déplacées, jouent n’importe quel accord dans <b>5 positions</b> — et qui portent tes boîtes de penta. Explication + 3 exos, dont « connecte le manche ».</p>';
  const bcc=el('button','btn ghost','Ouvrir CAGED'); bcc.onclick=()=>openCAGED(); cc.appendChild(bcc);
  m.appendChild(cc);

  const c3=el('div','card'); c3.innerHTML='<b>Tes records</b>';
  c3.appendChild(el('div','statgrid',
    `<div class="stat"><b>${S.quizBest||0}/10</b><small>nommer les cases</small></div>
     <div class="stat"><b>${bestFind()}</b><small>meilleur « trouve tout »</small></div>
     <div class="stat"><b>${S.streak||0}</b><small>jours de suite</small></div>`));
  m.appendChild(c3);
}
function bestFind(){ const v=Object.values(S.findBest||{}); return v.length?Math.max.apply(null,v.map(x=>x.pct))+'%':'—'; }

/* ---------------- trouve toutes les positions ---------------- */
function posOf(pc){ const out=[]; for(let s=0;s<6;s++)for(let f=0;f<=FRETS;f++) if(midiAt(s,f)%12===pc) out.push([s,f]); return out; }
function openFindAll(){
  ac(); markDay();
  const pc=NAT[Math.floor(Math.random()*NAT.length)], name=NOTES[pc], target=posOf(pc), picked=new Set();
  openOverlay('Trouve toutes les '+name, inner=>{
    const qh=el('div','qhead',`<div class="q">${name}</div><div class="sub">Touche toutes les cases « ${name} » (cordes à vide comprises). <b>${target.length}</b> à trouver.</div>`); inner.appendChild(qh);
    const prog=el('div','fb-progress'); inner.appendChild(prog);
    const fb=buildFretboard((s,f,cell)=>{ if(fb._done)return; const key=s+':'+f;
      if(picked.has(key)){ picked.delete(key); const d=cell.querySelector('.fdot'); if(d)d.remove(); }
      else { picked.add(key); pluck(midiAt(s,f)); fb.dot(s,f,'',(midiAt(s,f)%12===pc)?'pick':'pick'); }
      prog.innerHTML=`Sélectionnées : <b>${picked.size}</b>`;
    }); inner.appendChild(fb);
    prog.innerHTML='Sélectionnées : <b>0</b>';
    const foot=el('div'); inner.appendChild(foot);
    const val=el('button','btn','✓ Valider'); foot.appendChild(val);
    val.onclick=()=>{
      fb._done=true; fb.clearDots();
      let found=0; const tset=new Set(target.map(p=>p[0]+':'+p[1]));
      target.forEach(([s,f])=>{ const key=s+':'+f; if(picked.has(key)){ found++; fb.dot(s,f,name,'ok'); } else fb.dot(s,f,name,'miss'); });
      let wrong=0; picked.forEach(k=>{ if(!tset.has(k)){ wrong++; const [s,f]=k.split(':').map(Number); fb.dot(s,f,noteAt(s,f),'no'); } });
      const pct=Math.round(found/target.length*100);
      qh.innerHTML=`<div class="q">${found}/${target.length}</div><div class="sub">${wrong?wrong+' en trop (en rouge). ':''}${pct===100?'Parfait !':pct>=70?'Bien — les manquantes sont en pointillé bleu.':'Regarde les pointillés bleus : ce sont les '+name+' que tu as ratés.'}</div>`;
      const b=S.findBest[name]||{pct:0}; if(pct>b.pct){ S.findBest[name]={pct}; }
      S.xp+=found; save();
      foot.innerHTML='';
      const again=el('button','btn ghost','↻ Une autre note'); again.onclick=()=>{ closeOverlay(); openFindAll(); }; foot.appendChild(again);
      const cl=el('button','btn','Fermer'); cl.onclick=closeOverlay; foot.appendChild(cl);
    };
  });
}
/* ---------------- toutes les notes d’un accord ---------------- */
function posOfSet(pcs){ const out=[]; for(let s=0;s<6;s++)for(let f=0;f<=FRETS;f++){ if(pcs.indexOf(midiAt(s,f)%12)>=0) out.push([s,f]); } return out; }
function randNatRoot(){ return NAT[Math.floor(Math.random()*NAT.length)]; }
function openFindChord(root,quality){
  ac(); markDay();
  if(root==null) root=5;             /* défaut : Fa majeur (son exemple) */
  quality=quality||'maj';
  const third=(root+(quality==='maj'?4:3))%12, fifth=(root+7)%12, pcs=[root,third,fifth];
  const cname=NOTES[root]+(quality==='maj'?' majeur':' mineur');
  const notesTxt=pcs.map(p=>NOTES[p]).join(' · ');
  const target=posOfSet(pcs), picked=new Set();
  openOverlay('Les notes de l’accord', inner=>{
    /* sélecteur : fondamentale (naturelles) + maj/min + hasard */
    const selR=el('div','toolrow'); NAT.forEach(pc=>{ const t=el('div','tag'+(pc===root?' on':''),NOTES[pc]); t.onclick=()=>openFindChord(pc,quality); selR.appendChild(t); }); inner.appendChild(selR);
    const selQ=el('div','toolrow');
    const tM=el('div','tag'+(quality==='maj'?' on':''),'majeur'), tm=el('div','tag'+(quality==='min'?' on':''),'mineur'), tR=el('div','tag','🎲 au hasard');
    tM.onclick=()=>openFindChord(root,'maj'); tm.onclick=()=>openFindChord(root,'min'); tR.onclick=()=>openFindChord(randNatRoot(),Math.random()<.5?'maj':'min');
    selQ.append(tM,tm,tR); inner.appendChild(selQ);

    const qh=el('div','qhead',`<div class="q">${cname}</div><div class="sub">Touche TOUTES les cases dont la note est <b>${notesTxt}</b> (cordes à vide comprises). <b>${target.length}</b> à trouver.</div>`); inner.appendChild(qh);
    const hear=el('button','btn ghost','🔊 Entendre l’accord'); hear.onclick=()=>playScaleUp(root, quality==='maj'?[0,4,7]:[0,3,7]); inner.appendChild(hear);
    const prog=el('div','fb-progress'); inner.appendChild(prog);
    const fb=buildFretboard((s,f,cell)=>{ if(fb._done)return; const key=s+':'+f;
      if(picked.has(key)){ picked.delete(key); const d=cell.querySelector('.fdot'); if(d)d.remove(); }
      else { picked.add(key); pluck(midiAt(s,f)); fb.dot(s,f,'','pick'); }
      prog.innerHTML=`Sélectionnées : <b>${picked.size}</b>`;
    }); inner.appendChild(fb);
    prog.innerHTML='Sélectionnées : <b>0</b>';
    const foot=el('div'); inner.appendChild(foot);
    const val=el('button','btn','✓ Valider'); foot.appendChild(val);
    val.onclick=()=>{
      fb._done=true; fb.clearDots();
      const tset=new Set(target.map(p=>p[0]+':'+p[1])), cnt={}; pcs.forEach(p=>cnt[p]={found:0,total:0});
      let found=0;
      target.forEach(([s,f])=>{ const key=s+':'+f, pc=midiAt(s,f)%12; cnt[pc].total++;
        if(picked.has(key)){ found++; cnt[pc].found++; fb.dot(s,f,NOTES[pc],'ok'); } else fb.dot(s,f,NOTES[pc],'miss'); });
      let wrong=0; picked.forEach(k=>{ if(!tset.has(k)){ wrong++; const [s,f]=k.split(':').map(Number); fb.dot(s,f,noteAt(s,f),'no'); } });
      const pct=Math.round(found/target.length*100);
      const breakdown=pcs.map(p=>`${NOTES[p]} <b>${cnt[p].found}/${cnt[p].total}</b>`).join(' · ');
      qh.innerHTML=`<div class="q">${found}/${target.length}</div><div class="sub">${breakdown}${wrong?` · <b style="color:var(--bad)">${wrong} en trop</b>`:''}<br>${pct===100?'Parfait — tout l’accord, partout sur le manche.':pct>=70?'Bien. Les manquantes sont en pointillé bleu.':'Regarde les pointillés bleus : les notes de l’accord que tu as ratées.'}</div>`;
      const b=(S.chordFindBest||{})[cname]||{pct:0}; if(pct>b.pct){ if(!S.chordFindBest)S.chordFindBest={}; S.chordFindBest[cname]={pct}; }
      S.xp+=found; save();
      foot.innerHTML='';
      const again=el('button','btn ghost','↻ Un autre accord'); again.onclick=()=>openFindChord(randNatRoot(),Math.random()<.5?'maj':'min'); foot.appendChild(again);
      const cl=el('button','btn','Fermer'); cl.onclick=closeOverlay; foot.appendChild(cl);
    };
  });
}
/* ---------------- nommer les cases (10) ---------------- */
function openNameQuiz(){
  ac(); markDay();
  const pool=[]; for(let s=0;s<6;s++)for(let f=0;f<=FRETS;f++){ if(S.natOnly&&!NAT.includes(midiAt(s,f)%12))continue; pool.push([s,f]); }
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=pool[i];pool[i]=pool[j];pool[j]=t;}
  const q=pool.slice(0,10); let i=0, good=0;
  openOverlay('Nommer les cases', inner=>{
    const prog=el('div','fb-progress'); inner.appendChild(prog);
    const qh=el('div','qhead'); inner.appendChild(qh);
    const fb=buildFretboard(null); inner.appendChild(fb);
    const opts=el('div','opts'); inner.appendChild(opts);
    const foot=el('div'); inner.appendChild(foot);
    function step(){
      if(i>=q.length) return finish();
      const [s,f]=q[i], note=noteAt(s,f);
      prog.innerHTML=`Case <b>${i+1}</b>/10 · ✓ ${good}`;
      qh.innerHTML=`<div class="q" style="font-size:19px">Quelle note ?</div><div class="sub">Corde ${strNo(s)} (${STR_NAME[s]}) · case ${f}</div>`;
      fb.clearDots(); fb.dot(s,f,'?','ask'); foot.innerHTML='';
      const set=new Set([note]); while(set.size<4) set.add(NOTES[NAT[Math.floor(Math.random()*NAT.length)]]);
      const arr=[...set].sort(()=>Math.random()-.5); opts.innerHTML='';
      arr.forEach(n=>{ const bo=el('button','opt',n); bo.onclick=()=>ans(n,bo,s,f,note); opts.appendChild(bo); });
    }
    function ans(n,bo,s,f,note){ opts.querySelectorAll('.opt').forEach(x=>x.style.pointerEvents='none'); pluck(midiAt(s,f));
      if(n===note){ bo.classList.add('right'); good++; fb.dot(s,f,note,'ok'); } else { bo.classList.add('wrong'); opts.querySelectorAll('.opt').forEach(x=>{if(x.textContent===note)x.classList.add('right');}); fb.dot(s,f,note,'no'); }
      const nx=el('button','btn', i+1<q.length?'Suivant →':'Terminer'); nx.onclick=()=>{ i++; step(); }; foot.appendChild(nx);
    }
    function finish(){ if(good>S.quizBest){S.quizBest=good;} S.xp+=good*2; save();
      qh.innerHTML=`<div class="q">${good}/10</div><div class="sub">${good>=8?'Solide.':'Continue — regarde les notes dans « Manche ».'}</div>`; fb.clearDots(); opts.innerHTML='';
      const cl=el('button','btn','Fermer'); cl.onclick=closeOverlay; foot.innerHTML=''; foot.appendChild(cl);
    }
    step();
  });
}

/* ================================================================
   ACCORDS — bibliothèque + Anki auto-évalué
   ================================================================ */
/* frets : [Mi grave … Mi aigu], -1 = corde étouffée, 0 = à vide */
const CHORDS=[
 {n:'A',cat:'maj',deg:'1 · 3 · 5',frets:[-1,0,2,2,2,0],logic:'La MAJEUR : fondamentale La, tierce MAJEURE Do♯ (le son clair), quinte Mi.'},
 {n:'C',cat:'maj',deg:'1 · 3 · 5',frets:[-1,3,2,0,1,0],logic:'Do majeur : Do, tierce majeure Mi, quinte Sol.'},
 {n:'D',cat:'maj',deg:'1 · 3 · 5',frets:[-1,-1,0,2,3,2],logic:'Ré majeur : Ré, Fa♯, La — le petit triangle sur les 3 cordes aiguës.'},
 {n:'E',cat:'maj',deg:'1 · 3 · 5',frets:[0,2,2,1,0,0],logic:'Mi majeur : Mi, Sol♯, Si. La forme REINE — déplacée en barré, elle donne tous les autres majeurs.'},
 {n:'G',cat:'maj',deg:'1 · 3 · 5',frets:[3,2,0,0,0,3],logic:'Sol majeur : Sol, Si, Ré. Grand son ouvert.'},
 {n:'Am',cat:'min',deg:'1 · ♭3 · 5',frets:[-1,0,2,2,1,0],logic:'La MINEUR : mêmes La et Mi que le A majeur, mais la tierce descend d’un demi-ton (Do♯ → Do). CETTE seule note = tout le « triste ». Astuce : c’est la forme du E majeur décalée d’une corde.'},
 {n:'Dm',cat:'min',deg:'1 · ♭3 · 5',frets:[-1,-1,0,2,3,1],logic:'Ré mineur : Ré, Fa (tierce mineure), La.'},
 {n:'Em',cat:'min',deg:'1 · ♭3 · 5',frets:[0,2,2,0,0,0],logic:'Mi mineur : Mi, Sol, Si. La plus facile — deux doigts. Forme mère des barrés mineurs.'},
 {n:'E5',cat:'pow',deg:'1 · 5',frets:[0,2,2,-1,-1,-1],logic:'POWER CHORD : juste fondamentale + quinte, PAS de tierce → ni majeur ni mineur. C’est pour ça que ça passe partout en rock/métal. Forme déplaçable sur la corde de Mi grave.'},
 {n:'A5',cat:'pow',deg:'1 · 5',frets:[-1,0,2,2,-1,-1],logic:'Power chord sur la corde de La : fondamentale La + quinte Mi. Même forme que E5, une corde plus haut.'},
 {n:'G5',cat:'pow',deg:'1 · 5',frets:[3,5,5,-1,-1,-1],logic:'Power chord déplaçable : cette forme (cases 3-5-5 sur Mi grave) = Sol5. Glisse-la et tu obtiens n’importe quel power chord — la fondamentale est sous ton index.'},
 {n:'E7',cat:'dom',deg:'1 · 3 · 5 · ♭7',frets:[0,2,0,1,0,0],logic:'Mi 7 : le E majeur + une 7e MINEURE (Ré). Cette 7e crée la tension bluesy qui « veut résoudre ».'},
 {n:'A7',cat:'dom',deg:'1 · 3 · 5 · ♭7',frets:[-1,0,2,0,2,0],logic:'La 7 : A majeur + 7e mineure Sol. Le son du blues et de la dominante.'},
 {n:'D7',cat:'dom',deg:'1 · 3 · 5 · ♭7',frets:[-1,-1,0,2,1,2],logic:'Ré 7 : Ré, Fa♯, La, Do.'},
 {n:'G7',cat:'dom',deg:'1 · 3 · 5 · ♭7',frets:[3,2,0,0,0,1],logic:'Sol 7 : Sol, Si, Ré, Fa. Tire fort vers Do.'},
 {n:'B7',cat:'dom',deg:'1 · 3 · 5 · ♭7',frets:[-1,2,1,2,0,2],logic:'Si 7 : la dominante de Mi. Indispensable en blues de Mi et de La.'},
 {n:'Cmaj7',cat:'col',deg:'1 · 3 · 5 · 7',frets:[-1,3,2,0,0,0],logic:'Do maj7 : Do + une 7e MAJEURE (Si). Son doux, jazzy, rêveur — à ne pas confondre avec le C7.'},
 {n:'Am7',cat:'col',deg:'1 · ♭3 · 5 · ♭7',frets:[-1,0,2,0,1,0],logic:'La m7 : Am + 7e mineure Sol. Velours, cool — et un doigt de moins que Am.'},
 {n:'Em7',cat:'col',deg:'1 · ♭3 · 5 · ♭7',frets:[0,2,0,0,0,0],logic:'Mi m7 : la plus facile de toutes — un seul doigt.'},
 {n:'Dm7',cat:'col',deg:'1 · ♭3 · 5 · ♭7',frets:[-1,-1,0,2,1,1],logic:'Ré m7 : Ré, Fa, La, Do.'},
 {n:'Dsus2',cat:'sus',deg:'1 · 2 · 5',frets:[-1,-1,0,2,3,0],logic:'Ré sus2 : la tierce (Fa♯) est remplacée par la SECONDE (Mi). Ni majeur ni mineur — ça flotte, en attente.'},
 {n:'Dsus4',cat:'sus',deg:'1 · 4 · 5',frets:[-1,-1,0,2,3,3],logic:'Ré sus4 : la tierce remplacée par la QUARTE (Sol). Ça « pousse » et se résout délicieusement sur le Ré majeur.'},
 {n:'Asus2',cat:'sus',deg:'1 · 2 · 5',frets:[-1,0,2,2,0,0],logic:'La sus2 : A avec la seconde Si à la place de la tierce.'},
 {n:'Asus4',cat:'sus',deg:'1 · 4 · 5',frets:[-1,0,2,2,3,0],logic:'La sus4 : A avec la quarte Ré. Enchaîne Asus4 → A, tu entends la résolution.'},
 {n:'E9',cat:'ext',deg:'1 · 3 · ♭7 · 9',frets:[0,2,0,1,0,2],logic:'Mi 9 : un E7 enrichi de la 9e (Fa♯). Le son funk/soul. L’essentiel d’un 9, c’est la tierce, la ♭7 et la 9 — on lâche volontiers le reste.'},
 {n:'A9',cat:'ext',deg:'1 · 3 · ♭7 · 9',frets:[-1,0,2,4,2,3],logic:'La 9 : A7 + la 9e (Si). Voicing jazz/funk typique, déplaçable.'},
 {n:'Cmaj9',cat:'ext',deg:'1 · 3 · 7 · 9',frets:[-1,3,2,4,3,0],logic:'Do maj9 : Cmaj7 + la 9e (Ré). Très doux, lumineux — le son « coucher de soleil ».'},
 /* + power chords */
 {n:'D5',cat:'pow',deg:'1 · 5',frets:[-1,-1,0,2,-1,-1],logic:'Ré5 sur les cordes Ré/Sol : Ré + La.'},
 {n:'C5',cat:'pow',deg:'1 · 5',frets:[-1,3,5,-1,-1,-1],logic:'Do5 : la forme A5 déplacée à la case 3 (fondamentale sur la corde de La).'},
 {n:'F5',cat:'pow',deg:'1 · 5',frets:[1,3,3,-1,-1,-1],logic:'Fa5 : la forme E5 à la case 1.'},
 {n:'B5',cat:'pow',deg:'1 · 5',frets:[-1,2,4,-1,-1,-1],logic:'Si5 : la forme A5 à la case 2.'},
 {n:'F♯5',cat:'pow',deg:'1 · 5',frets:[2,4,4,-1,-1,-1],logic:'Fa♯5 : forme E5 à la case 2. Une racine NOIRE — les power chords rendent Fa♯, Ré♭, Mi♭… aussi faciles que les autres (aucune tierce à gérer).'},
 /* + une 7e */
 {n:'C7',cat:'dom',deg:'1 · 3 · 5 · ♭7',frets:[-1,3,2,3,1,0],logic:'Do 7 : Do, Mi, Sol, Si♭. La tension du blues en Do.'},
 /* enrichis : add9 / 6 / 7sus4 / m7b5 */
 {n:'Cadd9',cat:'add',deg:'1 · 3 · 5 · 9',frets:[-1,3,2,0,3,0],logic:'Do add9 : un Do MAJEUR + la 9e (Ré) ajoutée, SANS 7e (≠ C9). Le son pop/folk scintillant.'},
 {n:'Aadd9',cat:'add',deg:'1 · 3 · 5 · 9',frets:[-1,0,2,4,2,0],logic:'La add9 : A + la 9e (Si) ajoutée.'},
 {n:'C6',cat:'add',deg:'1 · 3 · 6',frets:[-1,3,2,2,1,0],logic:'Do 6 : un Do majeur + la SIXTE (La). Doux, vintage, jazzy.'},
 {n:'G6',cat:'add',deg:'1 · 3 · 5 · 6',frets:[3,2,0,0,0,0],logic:'Sol 6 : Sol majeur + la sixte (Mi). Très ouvert.'},
 {n:'A6',cat:'add',deg:'1 · 3 · 5 · 6',frets:[-1,0,2,2,2,2],logic:'La 6 : A + la sixte (Fa♯).'},
 {n:'A7sus4',cat:'add',deg:'1 · 4 · 5 · ♭7',frets:[-1,0,2,0,3,0],logic:'La 7sus4 : la tierce remplacée par la quarte, avec une 7e. Le son suspendu du rock/funk.'},
 {n:'D7sus4',cat:'add',deg:'1 · 4 · 5 · ♭7',frets:[-1,-1,0,2,1,3],logic:'Ré 7sus4 : Ré, Sol, La, Do.'},
 {n:'Bm7♭5',cat:'add',deg:'1 · ♭3 · ♭5 · ♭7',frets:[-1,2,3,2,3,-1],logic:'Si m7♭5 (demi-diminué) : Si, Ré, Fa, La. La quinte est DIMINUÉE (Fa au lieu de Fa♯) → son trouble. C’est le ii des tonalités mineures.'},
 /* barrés & racines noires (formes déplaçables) */
 {n:'F',cat:'bar',deg:'1 · 3 · 5',frets:[1,3,3,2,1,1],logic:'Fa majeur BARRÉ : la forme de Mi majeur, l’index couché sur toute la case 1. Le premier barré, le plus dur — mais LA clé : déplace-la et tu as tous les majeurs à racine sur la corde de Mi grave.'},
 {n:'F♯',cat:'bar',deg:'1 · 3 · 5',frets:[2,4,4,3,2,2],logic:'Fa♯ majeur : la forme de F, une case plus haut (barré case 2). Racine noire, même forme.'},
 {n:'A♭',cat:'bar',deg:'1 · 3 · 5',frets:[4,6,6,5,4,4],logic:'La♭ majeur : forme de E barrée à la case 4.'},
 {n:'B♭',cat:'bar',deg:'1 · 3 · 5',frets:[-1,1,3,3,3,1],logic:'Si♭ majeur : la forme de La majeur, barrée à la case 1 (fondamentale sur la corde de La). L’AUTRE grande forme déplaçable.'},
 {n:'D♭',cat:'bar',deg:'1 · 3 · 5',frets:[-1,4,6,6,6,4],logic:'Ré♭ majeur : forme de A barrée à la case 4.'},
 {n:'E♭',cat:'bar',deg:'1 · 3 · 5',frets:[-1,6,8,8,8,6],logic:'Mi♭ majeur : forme de A barrée à la case 6.'},
 {n:'F♯m',cat:'bar',deg:'1 · ♭3 · 5',frets:[2,4,4,2,2,2],logic:'Fa♯ mineur : la forme de Mi MINEUR barrée à la case 2.'},
 {n:'B♭m',cat:'bar',deg:'1 · ♭3 · 5',frets:[-1,1,3,3,2,1],logic:'Si♭ mineur : la forme de La mineur barrée à la case 1.'},
 /* + 7e */
 {n:'F7',cat:'dom',deg:'1 · 3 · 5 · ♭7',frets:[1,3,1,2,1,1],logic:'Fa 7 : la forme de E7 barrée à la case 1. Fa, La, Do, Mi♭.'},
 /* + couleurs maj7 / m7 */
 {n:'Gmaj7',cat:'col',deg:'1 · 3 · 5 · 7',frets:[3,2,0,0,0,2],logic:'Sol maj7 : Sol, Si, Ré, Fa♯. Ouvert et doux.'},
 {n:'Fmaj7',cat:'col',deg:'1 · 3 · 5 · 7',frets:[-1,-1,3,2,1,0],logic:'Fa maj7 : la version FACILE du F (sans barré, 3 doigts). Souvent, elle remplace le F et sonne mieux.'},
 {n:'Bm7',cat:'col',deg:'1 · ♭3 · 5 · ♭7',frets:[-1,2,0,2,0,2],logic:'Si m7 : Si, Ré, Fa♯, La. Un barré partiel bien pratique.'},
 /* + suspendus */
 {n:'Esus4',cat:'sus',deg:'1 · 4 · 5',frets:[0,2,2,2,0,0],logic:'Mi sus4 : Mi avec la quarte (La) à la place de la tierce. Enchaîne Esus4 → E, tu entends la résolution.'},
 /* + enrichis */
 {n:'Eadd9',cat:'add',deg:'1 · 3 · 5 · 9',frets:[0,2,2,1,0,2],logic:'Mi add9 : E + la 9e (Fa♯).'},
 {n:'Gadd9',cat:'add',deg:'1 · 3 · 5 · 9',frets:[3,2,0,2,0,3],logic:'Sol add9 : G + la 9e (La).'},
 {n:'D6',cat:'add',deg:'1 · 3 · 6',frets:[-1,-1,0,2,0,2],logic:'Ré 6 : Ré majeur + la sixte (Si).'},
 /* + 9e */
 {n:'D9',cat:'ext',deg:'1 · 3 · ♭7 · 9',frets:[-1,5,4,5,5,-1],logic:'Ré 9 : D7 + la 9e (Mi). Voicing déplaçable, son funk.'},
 /* renversements (slash) : une autre note à la basse */
 {n:'C/E',cat:'inv',deg:'basse = 3ce',frets:[0,3,2,0,1,0],logic:'Do majeur, la TIERCE (Mi) à la basse (1er renversement). Sert aux lignes de basse fluides : C – G/B – Am, la basse marche Do–Si–La.'},
 {n:'C/G',cat:'inv',deg:'basse = 5te',frets:[3,3,2,0,1,0],logic:'Do majeur, la QUINTE (Sol) à la basse (2e renversement). Basse plus grave, plus stable.'},
 {n:'G/B',cat:'inv',deg:'basse = 3ce',frets:[-1,2,0,0,0,3],logic:'Sol majeur, la tierce (Si) à la basse. LA pièce des descentes : C – G/B – Am – … la basse glisse Do–Si–La.'},
 {n:'D/F♯',cat:'inv',deg:'basse = 3ce',frets:[2,0,0,2,3,2],logic:'Ré majeur, la tierce (Fa♯) à la basse. Enchaîne Em – D/F♯ – G : la basse MONTE Mi–Fa♯–Sol.'},
 {n:'Am/C',cat:'inv',deg:'basse = ♭3ce',frets:[-1,3,2,2,1,0],logic:'La mineur, la tierce (Do) à la basse (1er renversement).'},
 {n:'F/A',cat:'inv',deg:'basse = 3ce',frets:[-1,0,3,2,1,1],logic:'Fa majeur, la tierce (La) à la basse — et SANS barré. Bien plus facile que le F, et parfait dans C – F/A – … '},
 {n:'E/G♯',cat:'inv',deg:'basse = 3ce',frets:[4,2,2,1,0,0],logic:'Mi majeur, la tierce (Sol♯) à la basse, pour les montées de basse.'},
 {n:'A/E',cat:'inv',deg:'basse = 5te',frets:[0,0,2,2,2,0],logic:'La majeur, la quinte (Mi) à la basse. Son plein et grave.'},
];
const CHORD_CATS=[
 {id:'maj',ic:'☀️',name:'Majeurs',d:'La base, son clair.'},
 {id:'min',ic:'🌑',name:'Mineurs',d:'La tierce descend : le son triste.'},
 {id:'pow',ic:'⚡',name:'Power chords',d:'Fond. + quinte, sans tierce. Le rock.'},
 {id:'dom',ic:'🎺',name:'Accords de 7e',d:'La tension bluesy.'},
 {id:'col',ic:'🎨',name:'Couleurs · maj7 / m7',d:'Le son adulte, jazz.'},
 {id:'sus',ic:'🌀',name:'Suspendus · sus2 / sus4',d:'Ni majeur ni mineur.'},
 {id:'ext',ic:'💎',name:'9e / 11e (avancé)',d:'Enrichir : le son moderne.'},
 {id:'add',ic:'✨',name:'Enrichis · add9 / 6 / 7sus4',d:'Les couleurs pop, funk, jazz.'},
 {id:'bar',ic:'🅱️',name:'Barrés & racines noires',d:'F♯, B♭, D♭, E♭… formes déplaçables.'},
 {id:'inv',ic:'🔀',name:'Renversements (slash)',d:'Le même accord, autre note à la basse.'},
];
function chordsIn(cat){ return CHORDS.filter(c=>c.cat===cat); }
function chordByName(n){ return CHORDS.find(c=>c.n===n); }
function chordDiagram(ch){
  const f=ch.frets, pos=f.filter(x=>x>0), maxF=pos.length?Math.max.apply(null,pos):1, minF=pos.length?Math.min.apply(null,pos):1;
  const base = maxF<=4?0:minF-1;
  const wrap=el('div','cdiag');
  const mk=el('div','cdrow cdmk'); for(let s=0;s<6;s++){ const v=f[s]; mk.appendChild(el('div','cdcell', v<0?'✕':(v===0?'○':' '))); } wrap.appendChild(mk);
  if(base>0) wrap.appendChild(el('div','cdbase', (base+1)+'e case'));
  const grid=el('div','cdgrid'+(base>0?' off':''));
  for(let r=1;r<=4;r++){ const fr=base+r, row=el('div','cdrow'); for(let s=0;s<6;s++){ const cc=el('div','cdcell'); if(f[s]===fr) cc.appendChild(el('div','cddot')); row.appendChild(cc); } grid.appendChild(row); }
  wrap.appendChild(grid); return wrap;
}
/* SRS accords (auto-évalué) */
const C_NEW_PER_DAY=5;
function cBudget(){ const t=today(); if(S.cNewDay.date!==t){ S.cNewDay={date:t,n:0}; save(); } return Math.max(0,C_NEW_PER_DAY-S.cNewDay.n); }
function cDue(cat){ const now=Date.now(); return chordsIn(cat).filter(c=>S.chords[c.n]&&S.chords[c.n].due<=now).map(c=>c.n); }
function cNew(cat){ return chordsIn(cat).filter(c=>!S.chords[c.n]).map(c=>c.n); }
function cKnown(cat){ return chordsIn(cat).filter(c=>S.chords[c.n]&&S.chords[c.n].reps>=1).length; }
function srsGrade(map,n,q,dc){ let c=map[n]; if(!c){ c={ef:2.4,iv:0,reps:0,due:0,lapses:0}; if(dc)dc.n++; }
  if(q==='again'){ c.reps=0; c.iv=0; c.lapses++; c.ef=Math.max(1.3,c.ef-.2); c.due=Date.now()+60000; }
  else { c.reps++; if(c.reps===1)c.iv=1; else if(c.reps===2)c.iv=3; else c.iv=Math.max(1,Math.round(c.iv*c.ef));
    if(q==='easy'){ c.iv=Math.round(c.iv*1.35); c.ef+=.15; } c.ef=Math.max(1.3,Math.min(2.8,c.ef)); c.due=Date.now()+c.iv*864e5; }
  map[n]=c; save();
}
function cGrade(n,q){ srsGrade(S.chords,n,q,S.cNewDay); }
function cDueTotal(){ let n=0; CHORD_CATS.forEach(k=>{ n+=cDue(k.id).length; }); return n; }

/* --------- mode MIX : révision mélangée toutes familles --------- */
function mixReview(){
  let due=[]; CHORDS.forEach(c=>{ if(S.chords[c.n]&&S.chords[c.n].due<=Date.now()) due.push(c.n); });
  let rest=CHORDS.map(c=>c.n).filter(n=>due.indexOf(n)<0);
  for(let i=rest.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=rest[i];rest[i]=rest[j];rest[j]=t;}
  reviewChords(due.concat(rest).slice(0,12));
}
/* --------- mode PROGRESSION : jouer une suite cohérente --------- */
const PROGRESSIONS=[
 {n:'Pop · I–V–vi–IV',ch:['C','G','Am','F'],tip:'Des milliers de tubes. Vise des changements nets, sans blanc entre les accords.'},
 {n:'Doo-wop · I–vi–IV–V',ch:['C','Am','F','G'],tip:'Le son des années 50.'},
 {n:'Mélancolique · vi–IV–I–V',ch:['Am','F','C','G'],tip:'Même famille d’accords, ordre plus sombre.'},
 {n:'Blues en La · les 7e',ch:['A7','D7','A7','E7'],tip:'Les accords de 7e du blues, en boucle. Ressens la tension.'},
 {n:'Jazz · ii–V–I',ch:['Dm7','G7','Cmaj7'],tip:'La cadence reine. Enchaîne-la bien propre.'},
 {n:'Barrés · ceux qu’on évite',ch:['F','B♭','C','G'],tip:'Force le F et le B♭ barrés. C’est LÀ que le vrai progrès se cache — pas dans ce que tu sais déjà.'},
 {n:'Rock · power chords',ch:['E5','G5','A5','E5'],tip:'Palm mute, tempo régulier. Déplace la même forme.'},
 {n:'Folk · sus qui bougent',ch:['D','Dsus4','D','Dsus2'],tip:'Le petit doigt qui danse autour du Ré.'},
];
/* --------- module VARIANTES : plusieurs façons de jouer un accord commun --------- */
const VARIANTS=[
 {n:'Am', v:[
   {lab:'Ouvert',frets:[-1,0,2,2,1,0],tip:'La forme de base, la première qu’on apprend.'},
   {lab:'Barré case 5 (forme de Em)',frets:[5,7,7,5,5,5],tip:'Am = la forme de Mi mineur, fondamentale (La) sur la corde de Mi grave, case 5.'},
   {lab:'Barré case 12 (forme de Am)',frets:[-1,12,14,14,13,12],tip:'La forme ouverte, une octave plus haut.'},
 ]},
 {n:'C', v:[
   {lab:'Ouvert',frets:[-1,3,2,0,1,0],tip:'La forme cowboy.'},
   {lab:'Barré case 3 (forme de A)',frets:[-1,3,5,5,5,3],tip:'Forme de La majeur, fondamentale (Do) sur la corde de La, case 3.'},
   {lab:'Barré case 8 (forme de E)',frets:[8,10,10,9,8,8],tip:'Forme de Mi majeur, fondamentale sur la corde de Mi grave, case 8.'},
 ]},
 {n:'G', v:[
   {lab:'Ouvert',frets:[3,2,0,0,0,3],tip:'La forme classique.'},
   {lab:'Barré case 3 (forme de E)',frets:[3,5,5,4,3,3],tip:'Forme de Mi majeur à la case 3.'},
 ]},
 {n:'F', v:[
   {lab:'Barré case 1',frets:[1,3,3,2,1,1],tip:'Le « vrai » F — forme de E barrée. Le passage obligé.'},
   {lab:'Mini-F (4 cordes, sans barré)',frets:[-1,-1,3,2,1,1],tip:'Version facile pour débuter : on ne joue que les 4 cordes aiguës.'},
   {lab:'Fmaj7 (encore plus doux)',frets:[-1,-1,3,2,1,0],tip:'Un doigt de moins ; remplace souvent le F et sonne mieux.'},
 ]},
 {n:'E', v:[
   {lab:'Ouvert',frets:[0,2,2,1,0,0],tip:'La forme reine.'},
   {lab:'Barré case 7 (forme de A)',frets:[-1,7,9,9,9,7],tip:'Forme de La majeur, fondamentale sur la corde de La, case 7.'},
 ]},
 {n:'D', v:[
   {lab:'Ouvert',frets:[-1,-1,0,2,3,2],tip:'Le petit triangle.'},
   {lab:'Barré case 5 (forme de A)',frets:[-1,5,7,7,7,5],tip:'Forme de La majeur à la case 5.'},
 ]},
 {n:'Em', v:[
   {lab:'Ouvert',frets:[0,2,2,0,0,0],tip:'Deux doigts.'},
   {lab:'Barré case 7 (forme de Am)',frets:[-1,7,9,9,8,7],tip:'Forme de La mineur à la case 7.'},
 ]},
];
function openVariant(vv){
  openOverlay(vv.n+' — les variantes', inner=>{
    inner.appendChild(el('p','lead','Le même accord, plusieurs endroits sur le manche. Écoute : ce sont les MÊMES notes, jouées ailleurs. Savoir bouger un accord, c’est pouvoir jouer partout.'));
    vv.v.forEach(sh=>{ const c=el('div','card'); c.style.textAlign='center';
      c.appendChild(el('b',null,sh.lab));
      c.appendChild(el('div','',' ')).style.height='6px';
      c.appendChild(chordDiagram({frets:sh.frets}));
      if(sh.tip) c.appendChild(el('p','lead',sh.tip)).style.margin='10px 0 0';
      const b=el('button','btn ghost','🔊 Écouter'); b.onclick=()=>strum({frets:sh.frets}); c.appendChild(b);
      inner.appendChild(c);
    });
  });
}
let _progAuto=null;
function openProgression(p){
  ac(); markDay();
  openOverlay(p.n, inner=>{
    inner.appendChild(el('p','lead',p.tip));
    const chips=el('div','toolrow'); chips.style.justifyContent='center'; inner.appendChild(chips);
    const cur=el('div','qhead'); inner.appendChild(cur);
    const dia=el('div'); dia.style.textAlign='center'; inner.appendChild(dia);
    const foot=el('div'); inner.appendChild(foot);
    let idx=0;
    const chipEls=p.ch.map((n,k)=>{ const t=el('div','tag',n); t.onclick=()=>{ idx=k; show(); }; chips.appendChild(t); return t; });
    function show(){ const ch=chordByName(p.ch[idx]); chipEls.forEach((t,k)=>t.classList.toggle('on',k===idx));
      cur.innerHTML=`<div class="q">${p.ch[idx]}</div>`; dia.innerHTML=''; if(ch){ dia.appendChild(chordDiagram(ch)); strum(ch); } }
    const nx=el('button','btn','⏭ Accord suivant'); nx.onclick=()=>{ idx=(idx+1)%p.ch.length; show(); }; foot.appendChild(nx);
    const ap=el('button','btn ghost','▶ Lecture auto'); ap.onclick=()=>{
      if(_progAuto){ clearInterval(_progAuto); _progAuto=null; ap.textContent='▶ Lecture auto'; }
      else { ap.textContent='⏹ Stop'; _progAuto=setInterval(()=>{ idx=(idx+1)%p.ch.length; show(); },2200); } };
    foot.appendChild(ap);
    show();
  });
}

/* ================================================================
   TRIADES — Anki des NOTES (épellation exacte, vérifiée)
   ================================================================ */
const TRIADS=[
 /* majeures : 1 · 3 · 5 (racine, tierce MAJEURE, quinte) */
 {n:'C',   q:'maj', notes:['C','E','G'],    root:0},
 {n:'D♭',  q:'maj', notes:['D♭','F','A♭'],  root:1},
 {n:'D',   q:'maj', notes:['D','F♯','A'],   root:2},
 {n:'E♭',  q:'maj', notes:['E♭','G','B♭'],  root:3},
 {n:'E',   q:'maj', notes:['E','G♯','B'],   root:4},
 {n:'F',   q:'maj', notes:['F','A','C'],    root:5},
 {n:'F♯',  q:'maj', notes:['F♯','A♯','C♯'], root:6},
 {n:'G',   q:'maj', notes:['G','B','D'],    root:7},
 {n:'A♭',  q:'maj', notes:['A♭','C','E♭'],  root:8},
 {n:'A',   q:'maj', notes:['A','C♯','E'],   root:9},
 {n:'B♭',  q:'maj', notes:['B♭','D','F'],   root:10},
 {n:'B',   q:'maj', notes:['B','D♯','F♯'],  root:11},
 /* mineures : 1 · ♭3 · 5 (racine, tierce mineure, quinte) */
 {n:'Cm',  q:'min', notes:['C','E♭','G'],   root:0},
 {n:'C♯m', q:'min', notes:['C♯','E','G♯'],  root:1},
 {n:'Dm',  q:'min', notes:['D','F','A'],    root:2},
 {n:'E♭m', q:'min', notes:['E♭','G♭','B♭'], root:3},
 {n:'Em',  q:'min', notes:['E','G','B'],    root:4},
 {n:'Fm',  q:'min', notes:['F','A♭','C'],   root:5},
 {n:'F♯m', q:'min', notes:['F♯','A','C♯'],  root:6},
 {n:'Gm',  q:'min', notes:['G','B♭','D'],   root:7},
 {n:'G♯m', q:'min', notes:['G♯','B','D♯'],  root:8},
 {n:'Am',  q:'min', notes:['A','C','E'],    root:9},
 {n:'B♭m', q:'min', notes:['B♭','D♭','F'],  root:10},
 {n:'Bm',  q:'min', notes:['B','D','F♯'],   root:11},
];
const T_NEW_PER_DAY=6;
function tBudget(){ const t=today(); if(S.tNewDay.date!==t){ S.tNewDay={date:t,n:0}; save(); } return Math.max(0,T_NEW_PER_DAY-S.tNewDay.n); }
function tDue(){ const now=Date.now(); return TRIADS.filter(x=>S.triads[x.n]&&S.triads[x.n].due<=now).map(x=>x.n); }
function tNew(){ return TRIADS.filter(x=>!S.triads[x.n]).map(x=>x.n); }
function tKnown(){ return TRIADS.filter(x=>S.triads[x.n]&&S.triads[x.n].reps>=1).length; }
function tGrade(n,q){ srsGrade(S.triads,n,q,S.tNewDay); }
function triadByName(n){ return TRIADS.find(x=>x.n===n); }
function triadPcs(t){ return t.q==='maj'?[t.root,(t.root+4)%12,(t.root+7)%12]:[t.root,(t.root+3)%12,(t.root+7)%12]; }
function reviewTriads(pool){
  ac(); markDay();
  if(!pool.length){ toast('Rien à réviser'); return; }
  pool=pool.slice(); for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=pool[i];pool[i]=pool[j];pool[j]=t;}
  let i=0,done=0;
  openOverlay('Triades', inner=>{
    const prog=el('div','fb-progress'); inner.appendChild(prog);
    const qh=el('div','qhead'); inner.appendChild(qh);
    const body=el('div'); body.style.textAlign='center'; inner.appendChild(body);
    const foot=el('div'); inner.appendChild(foot);
    function step(){ if(i>=pool.length) return finish();
      const t=triadByName(pool[i]);
      prog.innerHTML=`Carte <b>${i+1}</b>/${pool.length}`;
      qh.innerHTML=`<div class="q">${t.n}</div><div class="sub">Ses 3 notes ? (${t.q==='maj'?'1 · 3 · 5':'1 · ♭3 · 5'})</div>`;
      body.innerHTML=''; foot.innerHTML='';
      const rev=el('button','btn','👁 Voir les notes'); rev.onclick=()=>reveal(t); foot.appendChild(rev);
    }
    function reveal(t){
      const pcs=triadPcs(t), base=48+t.root, iv=t.q==='maj'?[0,4,7]:[0,3,7];
      const arp=()=>iv.forEach((x,k)=>setTimeout(()=>pluck(base+x,1.2,.5),k*170)); arp();
      body.innerHTML=`<div class="q" style="font-size:30px;letter-spacing:1px">${t.notes.join('  ·  ')}</div>`;
      body.appendChild(el('div','',' ')).style.height='8px';
      const names={}; pcs.forEach((p,k)=>{ names[p]=t.notes[k]; });
      const fb=buildFretboard(null); body.appendChild(fb); paintScale(fb,t.root,pcs,{labels:true,names:names});
      body.appendChild(el('div','clogic',`<div class="deg">${t.n} = ${t.q==='maj'?'racine + tierce MAJEURE + quinte':'racine + tierce mineure + quinte'}</div>Fondamentale ${t.notes[0]} en rouge. Toutes ses positions sont éclairées sur le manche.`));
      const pl=el('button','btn ghost','🔊 Réécouter'); pl.onclick=arp; body.appendChild(pl);
      qh.querySelector('.sub').textContent='Tu avais bon ?';
      foot.innerHTML='';
      const rate=el('div','rate'); const a=el('button','again','❌ À revoir'),g=el('button','good','✅ Je sais'),e=el('button','easy','⭐ Facile');
      a.onclick=()=>next(t.n,'again'); g.onclick=()=>next(t.n,'good'); e.onclick=()=>next(t.n,'easy');
      rate.append(a,g,e); foot.appendChild(rate);
    }
    function next(n,q){ tGrade(n,q); done++; if(q!=='again')S.xp+=2; save(); i++; step(); }
    function finish(){ qh.innerHTML=`<div class="q">✓</div><div class="sub">${done} triade(s) passée(s). Les sues reviendront plus tard, les ratées très vite.</div>`; body.innerHTML=''; foot.innerHTML=''; const cl=el('button','btn','Fermer'); cl.onclick=closeOverlay; foot.appendChild(cl); }
    step();
  });
}

/* ================================================================
   MOTEUR GAMMES (partagé penta + modes) + peinture sur le manche
   ================================================================ */
function pcsFrom(root,ints){ return ints.map(i=>(root+i)%12); }
function paintScale(fb,root,pcs,o){ o=o||{}; fb.clearDots();
  const lab=pc=> (o.names&&o.names[pc]!=null) ? o.names[pc] : (o.labels?NOTES[pc]:'');
  for(let s=0;s<6;s++)for(let f=0;f<=FRETS;f++){ const pc=midiAt(s,f)%12; if(pcs.indexOf(pc)<0) continue;
    const cls = pc===root?'root':(o.char!=null&&pc===o.char?'pick':'on');
    fb.dot(s,f, lab(pc), cls); }
  if(o.extra!=null){ for(let s=0;s<6;s++)for(let f=0;f<=FRETS;f++){ if(midiAt(s,f)%12===o.extra) fb.dot(s,f, lab(o.extra), 'pick'); } }
}
function rootPicker(cur,onPick){ const wrap=el('div','toolrow'); const tags=[];
  for(let pc=0;pc<12;pc++){ const t=el('div','tag'+(pc===cur?' on':''),NOTES[pc]);
    t.onclick=()=>{ tags.forEach(x=>x.classList.remove('on')); t.classList.add('on'); onPick(pc); };
    tags.push(t); wrap.appendChild(t); }
  return wrap;
}
function playScaleUp(root,ints){ ac(); const base=48+root, seq=ints.concat([12]); seq.forEach((iv,k)=>setTimeout(()=>pluck(base+iv,1.05,.5),k*145)); }

/* ================================================================
   MODULE IMPRO : la pentatonique & les notes à viser
   ================================================================ */
function openPentaModule(){
  ac(); markDay();
  let root=9, type='min', extra=null;   /* défaut : penta mineure de La (l’exemple de Thomas) */
  openOverlay('Impro : penta & notes à viser', inner=>{
    inner.appendChild(el('div','theory',`
      <h3>Ta première boîte à solo</h3>
      <p>Une <b>pentatonique</b> = <b>5 notes</b> au lieu de 7. Moins de notes, moins de risques de fausse note : c’est LA gamme du solo rock &amp; blues.</p>
      <div class="formula">Mineure : 1 · ♭3 · 4 · 5 · ♭7<br>Majeure : 1 · 2 · 3 · 5 · 6</div>
      <p><b>Le raccourci qui double ton manche :</b> la penta <b>mineure de La</b> et la penta <b>majeure de Do</b> sont les <b>mêmes 5 notes</b> — juste une maison différente. Une forme apprise = deux gammes.</p>
      <div class="tip">Pour transformer une penta mineure en penta MAJEURE de <b>même fondamentale</b>, descends toute la forme de <b>3 cases</b>.</div>`));

    const c=el('div','card');
    c.appendChild(el('b',null,'🎸 Explore-la sur le manche'));
    const tsel=el('div','toolrow'); tsel.style.marginTop='10px';
    const tmin=el('div','tag'+(type==='min'?' on':''),'Mineure'), tmaj=el('div','tag'+(type==='maj'?' on':''),'Majeure');
    tmin.onclick=()=>{type='min';tmin.classList.add('on');tmaj.classList.remove('on');draw();};
    tmaj.onclick=()=>{type='maj';tmaj.classList.add('on');tmin.classList.remove('on');draw();};
    tsel.append(tmin,tmaj); c.appendChild(tsel);
    c.appendChild(rootPicker(root,pc=>{root=pc;draw();}));
    const fb=buildFretboard(null); c.appendChild(fb);
    const xsel=el('div','toolrow');
    const x0=el('div','tag on','Notes seules'), x3=el('div','tag','+ 3ce majeure'), xb=el('div','tag','+ blue note');
    const setX=(v,e)=>{ extra=v; [x0,x3,xb].forEach(z=>z.classList.remove('on')); e.classList.add('on'); draw(); };
    x0.onclick=()=>setX(null,x0); x3.onclick=()=>setX('maj3',x3); xb.onclick=()=>setX('blue',xb);
    xsel.append(x0,x3,xb); c.appendChild(xsel);
    const info=el('div','clogic'); c.appendChild(info);
    const play=el('button','btn ghost','🔊 Écouter la gamme'); play.onclick=()=>playScaleUp(root, type==='min'?[0,3,5,7,10]:[0,2,4,7,9]); c.appendChild(play);
    inner.appendChild(c);

    inner.appendChild(el('div','theory',`
      <h3>Quoi viser ? (le vrai secret du solo)</h3>
      <p>Jouer la gamme ne suffit pas : ce qui sonne « juste et fort », ce sont les <b>notes de l’accord</b> qui passe sous toi. Sur un accord de La, vise <b>La · Do♯ · Mi</b> ; quand ça change pour un Fa, vise <b>Fa · La · Do</b>. On appelle ça <b>jouer les changements</b> — et la note la plus parlante, c’est presque toujours la <b>tierce</b> de l’accord.</p>
      <h3>⭐ L’astuce reine (ton exemple)</h3>
      <p>En penta <b>mineure de La</b>, tu as le <b>Do</b> (la ♭3). Si le morceau sonne <b>majeur</b> (accord de La majeur, blues en La…), vise plutôt le <b>Do♯</b> — la <b>tierce MAJEURE</b>. Effet : ça <b>s’éclaire</b>, ça devient joyeux/bluesy. C’est le son de Chuck Berry, de SRV, de la country.</p>
      <p>Encore mieux : <b>glisse ou bende du Do au Do♯</b> (♭3 → 3). Ce petit mouvement est LA couleur blues par excellence. Active «&nbsp;+ 3ce majeure&nbsp;» pour voir où elle tombe (en <b>bleu</b>).</p>
      <h3>La blue note</h3>
      <p>Entre la 4 et la 5 de la penta mineure se cache une note « sale » : la <b>♭5</b> (blue note). En passage rapide (jamais tenue), elle donne le grain du blues. Active «&nbsp;+ blue note&nbsp;».</p>
      <div class="tip">Programme : (1) une position par cœur → (2) cible la fondamentale sur chaque accord → (3) ajoute la 3ce majeure pour éclairer → (4) relie les positions.</div>`));

    function draw(){
      const ints = type==='min'?[0,3,5,7,10]:[0,2,4,7,9];
      const pcs = pcsFrom(root,ints);
      let ex=null; if(extra==='maj3') ex=(root+4)%12; else if(extra==='blue') ex=(root+6)%12;
      paintScale(fb, root, pcs, {labels:true, extra:ex});
      const rn=NOTES[root];
      let t=`<div class="deg">Penta ${type==='min'?'mineure':'majeure'} de ${rn}</div>Notes : ${pcs.map(p=>NOTES[p]).join(' · ')}. Fondamentale ${rn} en rouge.`;
      if(type==='min') t+=` <span style="color:var(--dim)">(mêmes 5 notes que la penta majeure de ${NOTES[(root+3)%12]}).</span>`;
      else t+=` <span style="color:var(--dim)">(mêmes 5 notes que la penta mineure de ${NOTES[(root+9)%12]}).</span>`;
      if(extra==='maj3') t+=`<br><b style="color:var(--blue)">En bleu : ${NOTES[(root+4)%12]}</b> = la 3ce majeure. Bende/glisse la ♭3 vers elle pour éclairer le son.`;
      if(extra==='blue') t+=`<br><b style="color:var(--blue)">En bleu : ${NOTES[(root+6)%12]}</b> = la blue note (♭5), uniquement en passage.`;
      info.innerHTML=t;
    }
    draw();
  });
}

/* ================================================================
   MODULE MODES : les 7 couleurs, par ordre
   ================================================================ */
const MODES=[
 {n:'Ionien', deg:'Ie degré', sub:'la gamme majeure', ints:[0,2,4,5,7,9,11], form:'1 2 3 4 5 6 7', char:11, charTxt:'la 7e majeure (sensible)', mood:'Lumineux, résolu — « heureux ».', song:'toute la pop en majeur, « Let It Be »', chord:'majeur / maj7', txt:'Le mode de référence : c’est la gamme majeure elle-même, rien d’altéré. Tous les autres modes se mesurent à lui.'},
 {n:'Dorien', deg:'IIe degré', sub:'le mineur « cool »', ints:[0,2,3,5,7,9,10], form:'1 2 ♭3 4 5 6 ♭7', char:9, charTxt:'la 6te MAJEURE', mood:'Mineur mais pas triste — jazzy, planant, funky.', song:'« So What », « Oye Como Va », « Scarborough Fair »', chord:'m7', txt:'Un mineur dont la 6te est MAJEURE (au lieu de mineure). Cette seule note relevée éclaire le mineur sans le rendre majeur : c’est toute sa couleur.'},
 {n:'Phrygien', deg:'IIIe degré', sub:'le mineur « espagnol »', ints:[0,1,3,5,7,8,10], form:'1 ♭2 ♭3 4 5 ♭6 ♭7', char:1, charTxt:'la ♭2 (seconde mineure)', mood:'Sombre, tendu — flamenco, métal.', song:'flamenco, riffs métal (Metallica « Wherever I May Roam »)', chord:'m7', txt:'Un mineur avec une ♭2 : ce demi-ton collé au-dessus de la fondamentale crée la tension « espagnole »/orientale.'},
 {n:'Lydien', deg:'IVe degré', sub:'le majeur « rêveur »', ints:[0,2,4,6,7,9,11], form:'1 2 3 ♯4 5 6 7', char:6, charTxt:'la ♯4 (quarte augmentée)', mood:'Majeur qui flotte, magique, cinéma.', song:'thème des Simpson, musiques de films (Elfman, Williams)', chord:'maj7 (♯11)', txt:'Un majeur avec une 4te DIÉSÉE. Cette note qui « monte » donne un son suspendu, lumineux, qui décolle.'},
 {n:'Mixolydien', deg:'Ve degré', sub:'le majeur « blues/rock »', ints:[0,2,4,5,7,9,10], form:'1 2 3 4 5 6 ♭7', char:10, charTxt:'la ♭7 (septième mineure)', mood:'Majeur bluesy, dominant, groove.', song:'« Sweet Home Alabama », « Sympathy for the Devil »', chord:'7 (dominante)', txt:'Un majeur avec une 7e MINEURE. C’est LE mode des accords de dominante (7) et du rock : majeur, mais avec le grain du blues.'},
 {n:'Éolien', deg:'VIe degré', sub:'le mineur naturel', ints:[0,2,3,5,7,8,10], form:'1 2 ♭3 4 5 ♭6 ♭7', char:8, charTxt:'la ♭6 (sixte mineure)', mood:'Triste, mélancolique — le « mineur » par défaut.', song:'« Losing My Religion », « Stairway » (solo), une montagne de rock', chord:'m7', txt:'La gamme mineure naturelle. Sa ♭6 (contre la 6te majeure du dorien) est ce qui le rend franchement mélancolique. Ton terrain de prédilection.'},
 {n:'Locrien', deg:'VIIe degré', sub:'l’instable', ints:[0,1,3,5,6,8,10], form:'1 ♭2 ♭3 4 ♭5 ♭6 ♭7', char:6, charTxt:'la ♭5 (quinte diminuée)', mood:'Bancal, angoissé — rare.', song:'métal extrême ; jazz, sur un accord m7♭5', chord:'m7♭5 (demi-diminué)', txt:'Le seul mode dont la QUINTE est diminuée (♭5) : la fondamentale ne « tient » pas, tout reste en suspens. Très peu utilisé seul.'},
];
function openModesModule(){
  ac(); markDay();
  let root=9, mi=5;   /* défaut : La éolien (le mineur, son focus) */
  openOverlay('Les modes, par ordre', inner=>{
    inner.appendChild(el('div','theory',`
      <h3>C’est quoi un mode ?</h3>
      <p>Prends la gamme majeure de Do (Do Ré Mi Fa Sol La Si). Joue ces <b>mêmes 7 notes</b> mais <b>en partant d’une autre</b> : tu obtiens un <b>mode</b>. Sept points de départ = sept modes = <b>sept couleurs</b>.</p>
      <p>Chaque mode a une <b>note caractéristique</b> : l’altération qui le distingue et fait toute sa saveur. C’est elle qu’il faut entendre — et viser.</p>
      <p>Choisis une <b>fondamentale</b>, puis compare les modes <b>sur la même note</b> (le meilleur moyen d’entendre la couleur basculer). La note caractéristique s’affiche en <b>bleu</b>.</p>`));
    const c=el('div','card');
    c.appendChild(el('b',null,'🎸 Compare les modes sur une même fondamentale'));
    c.appendChild(rootPicker(root,pc=>{root=pc;draw();}));
    const chips=el('div','toolrow'); const chipEls=MODES.map((M,k)=>{ const t=el('div','tag'+(k===mi?' on':''),M.n);
      t.onclick=()=>{mi=k;chipEls.forEach(x=>x.classList.remove('on'));t.classList.add('on');draw();}; chips.appendChild(t); return t; }); c.appendChild(chips);
    const fb=buildFretboard(null); c.appendChild(fb);
    const play=el('button','btn ghost','🔊 Écouter le mode'); play.onclick=()=>playScaleUp(root, MODES[mi].ints); c.appendChild(play);
    inner.appendChild(c);
    const detail=el('div','card'); inner.appendChild(detail);
    inner.appendChild(el('div','theory',`<div class="tip">L’autre façon de voir : tous ces modes partagent la <b>même gamme parente</b>. Ré dorien, Mi phrygien, Sol mixolydien… ce sont tous les notes de <b>Do majeur</b>, avec une fondamentale différente. Sur scène on pense souvent « quelle gamme majeure contient mon accord ? » puis on vise la note caractéristique.</div>`));
    function draw(){
      const M=MODES[mi], pcs=pcsFrom(root,M.ints), charPc=M.char!=null?(root+M.char)%12:null;
      paintScale(fb, root, pcs, {labels:true, char:charPc});
      detail.innerHTML=`<b>${NOTES[root]} ${M.n}</b> <span style="color:var(--dim);font-size:13px">· ${M.deg} · ${M.sub}</span>
        <div class="clogic" style="margin-top:10px">
          <div class="deg">Formule : ${M.form}</div>
          <p style="margin:0 0 8px">${M.txt}</p>
          <p style="margin:0 0 6px"><b style="color:var(--blue)">Note caractéristique : ${M.charTxt}</b>${charPc!=null?` (ici ${NOTES[charPc]}, en bleu)`:''}.</p>
          <p style="margin:0 0 4px">🎭 <b>Couleur :</b> ${M.mood}</p>
          <p style="margin:0 0 4px">🎧 <b>À écouter :</b> ${M.song}</p>
          <p style="margin:0">🎸 <b>Se pose sur :</b> un accord ${M.chord}.</p>
        </div>`;
    }
    draw();
  });
}

/* ================================================================
   LES POSITIONS DE LA GAMME MAJEURE — 5 formes, « penta + 2 notes »
   ================================================================ */
const MAJ_INTS=[0,2,4,5,7,9,11], MAJ_PENTA_INTS=[0,2,4,7,9], ADDED_INTS=[5,11];
const DEG_LABEL={0:'1',2:'2',4:'3',5:'4',7:'5',9:'6',11:'7'};
const POS_OFF=[0,2,4,7,9];
function fretOnLowE(pc){ return ((pc-4)%12+12)%12; }         /* case de la note sur Mi grave (0..11) */
function fitLow(base){ const b=((base%12)+12)%12; return b<=9?b:9; } /* fenêtre de 4 cases qui tient dans 0..12 */
function paintPosition(fb, root, low, full, labelNotes){
  fb.clearDots();
  const majPcs=pcsFrom(root,MAJ_INTS), addPcs=pcsFrom(root,ADDED_INTS), lit=[];
  for(let s=0;s<6;s++) for(let f=low; f<=low+3 && f<=FRETS; f++){ if(f<0) continue;
    const pc=midiAt(s,f)%12; if(majPcs.indexOf(pc)<0) continue;
    const isAdded=addPcs.indexOf(pc)>=0; if(isAdded && !full) continue;
    const isRoot=pc===root, deg=DEG_LABEL[((pc-root)%12+12)%12];
    fb.dot(s,f, labelNotes?NOTES[pc]:deg, isRoot?'root':(isAdded?'pick':'on'));
    lit.push({s,f,m:midiAt(s,f)}); }
  return lit;
}
function openMajorPositions(){
  ac(); markDay();
  let root=7, pos=0, full=true, labelNotes=false;   /* défaut : Sol majeur (relatif Mi mineur) */
  openOverlay('La gamme majeure en positions', inner=>{
    inner.appendChild(el('div','theory',`
      <h3>5 formes, tout le manche</h3>
      <p>La gamme majeure sur tout le manche, ce n’est pas 100 notes à retenir : ce sont <b>5 formes</b> (positions) qui se répètent et s’emboîtent. Tu les apprends <b>une par une</b>, dans l’ordre.</p>
      <div class="formula">Gamme majeure = ta PENTA (5 notes) + 2 notes</div>
      <p>Tu connais déjà les boîtes de pentatonique. Dans chaque position, la penta est là (en <b>orange</b>) — il suffit d’<b>ajouter 2 notes</b> (la <b>4</b> et la <b>7</b>, en <b>bleu</b>) pour avoir la gamme majeure complète. C’est tout.</p>
      <div class="tip"><b>La n°1 d’abord.</b> Sa fondamentale est sur la corde de Mi grave — des notes que tu connais déjà (étape Manche). Apprends-la <b>mobile</b> : tu joues alors la gamme majeure dans <b>n’importe quelle tonalité</b>.</div>`));

    const c=el('div','card');
    c.appendChild(el('b',null,'🎸 Ta tonalité'));
    c.appendChild(rootPicker(root,pc=>{root=pc;draw();}));
    const relNote=el('p','lead',''); relNote.style.margin='2px 0 6px'; c.appendChild(relNote);
    const psel=el('div','toolrow'); const pTags=POS_OFF.map((_,i)=>{ const t=el('div','tag'+(i===pos?' on':''),(i===0?'★ ':'')+'Position '+(i+1)); t.onclick=()=>{pos=i;pTags.forEach(x=>x.classList.remove('on'));t.classList.add('on');draw();}; psel.appendChild(t); return t; }); c.appendChild(psel);
    const opts=el('div','toolrow');
    const tFull=el('div','tag on','Gamme complète'), tPenta=el('div','tag','Penta seule'), tLab=el('div','tag','Degrés');
    tFull.onclick=()=>{full=true;tFull.classList.add('on');tPenta.classList.remove('on');draw();};
    tPenta.onclick=()=>{full=false;tPenta.classList.add('on');tFull.classList.remove('on');draw();};
    tLab.onclick=()=>{labelNotes=!labelNotes;tLab.classList.toggle('on',labelNotes);tLab.textContent=labelNotes?'Notes':'Degrés';draw();};
    opts.append(tFull,tPenta,tLab); c.appendChild(opts);
    const fb=buildFretboard((s,f)=>pluck(midiAt(s,f))); c.appendChild(fb);
    const info=el('div','clogic'); c.appendChild(info);
    const play=el('button','btn ghost','🔊 Écouter la position'); c.appendChild(play);
    inner.appendChild(c);

    inner.appendChild(el('div','theory',`
      <h3>Dans quel ordre les apprendre</h3>
      <ol style="margin:0 0 10px 18px;color:#d8cebf;line-height:1.65">
        <li><b>Position 1</b> par cœur, mobile → tu joues déjà en majeur partout.</li>
        <li><b>Position 2</b> (au-dessus) et <b>Position 5</b> (en dessous) pour entourer la 1.</li>
        <li><b>Relie-les</b> : glisse de l’une à l’autre sans t’arrêter.</li>
        <li>Ajoute enfin <b>3 et 4</b> pour couvrir tout le manche.</li>
        <li>Passe des <b>degrés</b> aux <b>vraies notes</b> (bouton « Notes ») : tu sais où viser.</li>
      </ol>
      <div class="tip">Chaque forme est <b>identique dans toutes les tonalités</b> : c’est la même main qui glisse. Ici elle s’affiche là où elle tient sur 12 cases.</div>`));

    function draw(){
      const base=fretOnLowE(root)+POS_OFF[pos], low=fitLow(base);
      const lit=paintPosition(fb, root, low, full, labelNotes);
      play.onclick=()=>{ ac(); lit.slice().sort((a,b)=>a.m-b.m).forEach((n,k)=>setTimeout(()=>pluck(n.m,1.0,.5),k*130)); };
      relNote.innerHTML=`Gamme de <b>${NOTES[root]} majeur</b> · relatif mineur : <b>${NOTES[(root+9)%12]} mineur</b> (mêmes notes).`;
      const posTxt=['Fondamentale sur la corde de <b>Mi grave</b>. LA position à connaître en premier — mobile, pose-la sur n’importe quelle tonique.',
        'Juste au-dessus de la 1. On retrouve la fondamentale vers les cordes de Ré / Si.',
        'Le milieu du manche. Beaucoup de fondamentales sur les cordes aiguës.',
        'Vers le haut du manche. Prépare le retour à l’octave.',
        'Juste en dessous de la 1 (ou en position ouverte). Boucle le système.'][pos];
      const fullClause = full
        ? `En <b style="color:var(--blue)">bleu</b> : les 2 notes ajoutées (la 4<sup>e</sup> ${NOTES[(root+5)%12]} et la 7<sup>e</sup> ${NOTES[(root+11)%12]}) = gamme complète.`
        : `<b>Penta seule</b> — active « Gamme complète » pour voir les 2 notes en plus.`;
      info.innerHTML=`<div class="deg">Position ${pos+1}${pos===0?' — commence ici':''}</div>${posTxt}<br>En <b style="color:var(--bad)">rouge</b> : la fondamentale (${NOTES[root]}). En <b style="color:var(--acc)">orange</b> : la penta. ${fullClause}`;
    }
    draw();
  });
}

/* ================================================================
   LE SYSTÈME CAGED — 5 formes d’accord, tout le manche
   ================================================================ */
const CAGED_ORDER=['C','A','G','E','D'];
/* décalage de chaque forme par rapport à la fondamentale sur Mi grave (réf. Do majeur) */
const CAGED_REL={C:-8,A:-5,G:-3,E:0,D:2};
const IVNAME={0:'R',4:'3',7:'5'};
/* forme normalisée : case la plus grave = 0. s : 0=Mi grave … 5=Mi aigu. iv : 0=fond., 4=tierce, 7=quinte */
const CAGED_SHAPES={
  C:{span:3, openName:'Do', notes:[{s:1,nf:3,iv:0},{s:2,nf:2,iv:4},{s:3,nf:0,iv:7},{s:4,nf:1,iv:0},{s:5,nf:0,iv:4}],
     roots:'La &amp; Si',
     hint:'La forme du <b>Do ouvert</b>, déplacée. Fondamentales sur les cordes de <b>La</b> et de <b>Si</b>. La plus « en biais » — pénible en barré complet, mais un repère en or et de superbes voicings aigus.'},
  A:{span:2, openName:'La', notes:[{s:1,nf:0,iv:0},{s:2,nf:2,iv:7},{s:3,nf:2,iv:0},{s:4,nf:2,iv:4},{s:5,nf:0,iv:7}],
     roots:'La',
     hint:'La forme du <b>La ouvert</b> en barré. Fondamentale sur la corde de <b>La</b> — c’est le petit barré à 3 doigts que tu fais déjà pour un Si ou un Do « barré 5<sup>e</sup> case ».'},
  G:{span:3, openName:'Sol', notes:[{s:0,nf:3,iv:0},{s:1,nf:2,iv:4},{s:2,nf:0,iv:7},{s:3,nf:0,iv:0},{s:4,nf:0,iv:4},{s:5,nf:3,iv:0}],
     roots:'Mi grave, Sol &amp; Mi aigu',
     hint:'La forme du <b>Sol ouvert</b>. <b>Trois</b> fondamentales (Mi grave, Sol, Mi aigu) — la plus large, presque jamais jouée en entier en barré, mais imbattable pour repérer les fondamentales sur tout le manche.'},
  E:{span:2, openName:'Mi', notes:[{s:0,nf:0,iv:0},{s:1,nf:2,iv:7},{s:2,nf:2,iv:0},{s:3,nf:1,iv:4},{s:4,nf:0,iv:7},{s:5,nf:0,iv:0}],
     roots:'Mi grave &amp; Ré',
     hint:'La forme <b>REINE</b> : le <b>Mi ouvert</b> en barré. Fondamentale sur la corde de <b>Mi grave</b> — celle que tu connais déjà par cœur (étape Manche). C’est le barré « Fa » que tout le monde apprend en premier.'},
  D:{span:3, openName:'Ré', notes:[{s:2,nf:0,iv:0},{s:3,nf:2,iv:7},{s:4,nf:3,iv:0},{s:5,nf:2,iv:4}],
     roots:'Ré &amp; Si',
     hint:'La forme du <b>Ré ouvert</b>. Fondamentales sur les cordes de <b>Ré</b> et de <b>Si</b> — un petit triangle sur les 3 cordes aiguës, parfait pour les accords brillants en haut du manche.'},
};
const CAGED_NF=15;
function cagedBaseOffsets(sh,K){ const base=fretOnLowE(K)+CAGED_REL[sh]; return [base-12,base,base+12,base+24]; }
function cagedBestOffset(sh,K){ const span=CAGED_SHAPES[sh].span; let best=null,bp=1e9;
  cagedBaseOffsets(sh,K).forEach(o=>{ const lo=o,hi=o+span; const pen=(lo>=0&&hi<=CAGED_NF)?lo:1000+Math.max(0,-lo)+Math.max(0,hi-CAGED_NF); if(pen<bp){bp=pen;best=o;} });
  return best;
}
function cagedNotesAt(sh,o){ return CAGED_SHAPES[sh].notes.map(n=>({s:n.s,f:n.nf+o,iv:n.iv})); }
function cagedFrets(sh,o){ const fr=[-1,-1,-1,-1,-1,-1]; CAGED_SHAPES[sh].notes.forEach(n=>fr[n.s]=n.nf+o); return fr; }
function cagedOrdered(K){ return CAGED_ORDER.map(sh=>({sh,o:cagedBestOffset(sh,K)})).sort((a,b)=>a.o-b.o); }

function openCAGED(){
  ac(); markDay();
  let root=7, sel='G', mode='one', labelNotes=false;   /* défaut : Sol majeur — les 5 formes tiennent en 0-12 */
  openOverlay('Le système CAGED', inner=>{
    inner.appendChild(el('div','theory',`
      <h3>Une clé pour tout le manche</h3>
      <p>Tu connais <b>5 accords ouverts</b> : <b>C, A, G, E, D</b> (Do, La, Sol, Mi, Ré). Le système CAGED dit une chose énorme : ces <b>5 formes</b>, déplacées le long du manche, suffisent à jouer <b>n’importe quel accord majeur dans 5 endroits différents</b>. Cinq formes = tout le manche cartographié.</p>
      <div class="formula">C → A → G → E → D → (C) …<br>toujours dans cet ordre, en montant</div>
      <p>Ce n’est pas un tour de magie : les formes <b>s’emboîtent</b>. La fondamentale de l’une est dans la suivante. Bout à bout, elles pavent le manche et se répètent tous les 12 cases (à l’octave).</p>
      <div class="tip"><b>Pourquoi ça change tout :</b> tu ne « cherches » plus un accord — tu sais où sont ses 5 maisons. Et ces mêmes 5 cases contiennent tes <b>boîtes de penta</b> et tes <b>positions de gamme</b> (étape précédente) : la forme d’accord est le <b>squelette</b>, la gamme est la chair autour. Pour toi qui joues aux doigts et qui aimes le contraste doux/fort (Deftones, Audioslave) : arpège la forme en couplet, écrase-la en accord plein au refrain — même position, deux intensités.</p>`));

    const c=el('div','card');
    c.appendChild(el('b',null,'🎸 Ta tonalité'));
    c.appendChild(rootPicker(root,pc=>{root=pc;draw();}));
    const modeRow=el('div','toolrow');
    const mOne=el('div','tag on','Une forme'), mAll=el('div','tag','Les 5 d’un coup');
    mOne.onclick=()=>{mode='one';mOne.classList.add('on');mAll.classList.remove('on');draw();};
    mAll.onclick=()=>{mode='all';mAll.classList.add('on');mOne.classList.remove('on');draw();};
    modeRow.append(mOne,mAll); c.appendChild(modeRow);
    const shapeRow=el('div','toolrow');
    const shapeTags=CAGED_ORDER.map(sh=>{ const t=el('div','tag'+(sh===sel?' on':''),'Forme '+sh);
      t.onclick=()=>{sel=sh;shapeTags.forEach(x=>x.classList.remove('on'));t.classList.add('on');draw();}; shapeRow.appendChild(t); return t; });
    c.appendChild(shapeRow);
    const optRow=el('div','toolrow');
    const tLab=el('div','tag','Notes'); tLab.onclick=()=>{labelNotes=!labelNotes;tLab.classList.toggle('on',labelNotes);draw();};
    optRow.appendChild(tLab); c.appendChild(optRow);
    const fb=buildFretboard((s,f)=>pluck(midiAt(s,f)),CAGED_NF); c.appendChild(fb);
    const info=el('div','clogic'); c.appendChild(info);
    const btnRow=el('div','row3'); btnRow.style.marginTop='10px';
    const bChord=el('button','btn ghost','🔊 Accord'), bArp=el('button','btn ghost','🎵 Arpège');
    btnRow.append(bChord,bArp); c.appendChild(btnRow);
    inner.appendChild(c);

    inner.appendChild(el('div','theory',`
      <h3>Comment l’apprendre (sans se noyer)</h3>
      <ol style="margin:0 0 10px 18px;color:#d8cebf;line-height:1.65">
        <li>Commence par la forme <b>E</b> et la forme <b>A</b> : ce sont tes deux barrés de tous les jours, fondamentale sur Mi grave et sur La. 90 % du répertoire tient là.</li>
        <li>Pour une tonalité, <b>récite l’ordre</b> C-A-G-E-D en montant, et repère où tombe chaque fondamentale (rouge).</li>
        <li>Fais l’exo <b>« Connecte le manche »</b> : traverse les 5 formes d’une seule tonalité, de la nut vers l’aigu.</li>
        <li>Ensuite seulement, ajoute G, C, D — plus acrobatiques, mais 3 super repères de fondamentales.</li>
        <li>Relie CAGED à ta gamme : chaque forme est entourée de sa position de penta / gamme majeure. L’accord te dit <b>où viser</b> (1-3-5) pendant un solo.</li>
      </ol>
      <div class="tip">Astuce mémoire : le <b>nom</b> de la forme n’est pas la tonalité ! La « forme C » jouée case 3 donne un <b>Ré</b>, pas un Do. Le nom dit juste <b>quel dessin</b> ta main fait.</div>`));

    const ex=el('div','card');
    ex.innerHTML='<b>🎯 Les exercices</b><p class="lead" style="margin:6px 0 10px">On ancre. Reconnaître le dessin, savoir où sont les fondamentales, puis relier les 5 en vrai.</p>';
    const e1=el('button','btn','🔗 Connecte le manche (le vrai but)'); e1.onclick=openCagedConnect; ex.appendChild(e1);
    const e2=el('button','btn ghost','🔎 Reconnais la forme'); e2.onclick=openCagedQuiz; ex.appendChild(e2);
    const e3=el('button','btn ghost','🔴 Place les fondamentales'); e3.onclick=openCagedRoots; ex.appendChild(e3);
    if(S.cagedQuizBest) ex.appendChild(el('p','lead',`Record « reconnais la forme » : <b style="color:var(--acc)">${S.cagedQuizBest}/8</b>.`)).style.margin='10px 0 0';
    inner.appendChild(ex);

    function draw(){
      fb.clearDots();
      const lab=n=> labelNotes?NOTES[midiAt(n.s,n.f)%12]:IVNAME[n.iv];
      if(mode==='all'){
        cagedOrdered(root).forEach(({sh,o})=>{ cagedNotesAt(sh,o).forEach(n=>{ if(n.f>=0&&n.f<=CAGED_NF) fb.dot(n.s,n.f, lab(n), n.iv===0?'root':(sh===sel?'pick':'on')); }); });
        const seq=cagedOrdered(root).map(x=>x.sh).join(' → ');
        info.innerHTML=`<div class="deg">${NOTES[root]} majeur — les 5 formes</div>De la nut vers l’aigu : <b>${seq}</b>. En <b style="color:var(--bad)">rouge</b> : toutes les fondamentales (${NOTES[root]}). En <b style="color:var(--blue)">bleu</b> : la forme <b>${sel}</b> mise en évidence dans l’ensemble — vois comme elle se colle à ses voisines.`;
        bChord.onclick=()=>{ const o=cagedBestOffset(sel,root); strum({frets:cagedFrets(sel,o)}); };
        bArp.onclick=()=>{ const o=cagedBestOffset(sel,root); playCagedArp(sel,o); };
      } else {
        const o=cagedBestOffset(sel,root); const notes=cagedNotesAt(sel,o);
        notes.forEach(n=>{ if(n.f>=0&&n.f<=CAGED_NF) fb.dot(n.s,n.f, lab(n), n.iv===0?'root':'on'); });
        const sh=CAGED_SHAPES[sel], lo=Math.min.apply(null,notes.map(n=>n.f)), hi=Math.max.apply(null,notes.map(n=>n.f));
        info.innerHTML=`<div class="deg">Forme ${sel} · ${NOTES[root]} majeur${o===0?' (position ouverte)':''}</div>${sh.hint}<br>Ici : cases <b>${lo}–${hi}</b>. Fondamentales (<b style="color:var(--bad)">rouge</b>) sur ${sh.roots}. En <b style="color:var(--acc)">orange</b> : tierce (3) et quinte (5). Bascule « Notes » pour voir les vraies notes.`;
        bChord.onclick=()=>strum({frets:cagedFrets(sel,o)});
        bArp.onclick=()=>playCagedArp(sel,o);
      }
    }
    draw();
  });
}
function playCagedArp(sh,o){ ac(); const ms=cagedNotesAt(sh,o).map(n=>midiAt(n.s,n.f)).sort((a,b)=>a-b); ms.forEach((m,k)=>setTimeout(()=>pluck(m,1.1,.5),k*160)); }

/* ---- exo : connecte le manche (traverser les 5 formes d’une tonalité) ---- */
function openCagedConnect(){
  ac(); markDay();
  let root=7, i=0;
  openOverlay('Connecte le manche', inner=>{
    inner.appendChild(el('p','lead','Une seule tonalité, tout le manche. On traverse les 5 formes dans l’ordre, de la plus grave à la plus aiguë. Joue chaque forme, écoute-la, puis glisse vers la suivante — elles se touchent, c’est là que ta main passe.'));
    const c=el('div','card');
    c.appendChild(el('b',null,'🎸 Tonalité'));
    c.appendChild(rootPicker(root,pc=>{root=pc;i=0;draw();}));
    const fb=buildFretboard((s,f)=>pluck(midiAt(s,f)),CAGED_NF); c.appendChild(fb);
    const info=el('div','clogic'); c.appendChild(info);
    const row=el('div','row3'); row.style.marginTop='10px';
    const bC=el('button','btn ghost','🔊 Accord'), bA=el('button','btn ghost','🎵 Arpège'), bN=el('button','btn','Suivante →');
    row.append(bC,bA,bN); c.appendChild(row); inner.appendChild(c);
    function draw(){
      const seq=cagedOrdered(root); i=((i%5)+5)%5; const cur=seq[i], nxt=seq[(i+1)%5];
      fb.clearDots();
      cagedNotesAt(nxt.sh,nxt.o).forEach(n=>{ if(n.f>=0&&n.f<=CAGED_NF) fb.dot(n.s,n.f,'','pick'); });
      cagedNotesAt(cur.sh,cur.o).forEach(n=>{ if(n.f>=0&&n.f<=CAGED_NF) fb.dot(n.s,n.f,IVNAME[n.iv], n.iv===0?'root':'on'); });
      info.innerHTML=`<div class="deg">Forme ${cur.sh} · ${i+1}/5 · ${NOTES[root]} majeur</div>${CAGED_SHAPES[cur.sh].hint}<br><b style="color:var(--blue)">En bleu : la forme suivante (${nxt.sh})</b> — elles se chevauchent. Glisse d’une à l’autre sans lever la main.`;
      bC.onclick=()=>strum({frets:cagedFrets(cur.sh,cur.o)});
      bA.onclick=()=>playCagedArp(cur.sh,cur.o);
      bN.textContent = i<4?'Suivante →':'↻ Reprendre en bas';
      bN.onclick=()=>{ const wasLast=i===4; i=(i+1)%5; if(wasLast){ S.xp+=6; save(); toast('Manche traversé · +6 XP 🎸'); } draw(); };
    }
    draw();
  });
}

/* ---- exo : reconnais la forme (quiz) ---- */
function openCagedQuiz(){
  ac(); markDay();
  const N=8; let i=0, good=0, cur=null;
  openOverlay('Reconnais la forme', inner=>{
    const prog=el('div','fb-progress'); inner.appendChild(prog);
    const qh=el('div','qhead'); inner.appendChild(qh);
    const fb=buildFretboard(null,CAGED_NF); inner.appendChild(fb);
    const opts=el('div','opts'); inner.appendChild(opts);
    const foot=el('div'); inner.appendChild(foot);
    function step(){
      if(i>=N) return finish();
      cur=CAGED_ORDER[Math.floor(Math.random()*5)];
      const K=Math.floor(Math.random()*12), o=cagedBestOffset(cur,K);
      prog.innerHTML=`Forme <b>${i+1}</b>/${N} · ✓ ${good}`;
      qh.innerHTML=`<div class="q" style="font-size:19px">Quelle forme CAGED ?</div><div class="sub">Lis le dessin (fondamentales en rouge). Ce n’est pas la tonalité qui compte — c’est la <b>forme</b>.</div>`;
      fb.clearDots(); cagedNotesAt(cur,o).forEach(n=>{ if(n.f>=0&&n.f<=CAGED_NF) fb.dot(n.s,n.f,IVNAME[n.iv], n.iv===0?'root':'on'); });
      opts.innerHTML=''; foot.innerHTML='';
      CAGED_ORDER.forEach(x=>{ const b=el('button','opt',x); b.onclick=()=>ans(x,b); opts.appendChild(b); });
    }
    function ans(x,b){ opts.querySelectorAll('.opt').forEach(o=>o.style.pointerEvents='none');
      if(x===cur){ b.classList.add('right'); good++; } else { b.classList.add('wrong'); opts.querySelectorAll('.opt').forEach(o=>{ if(o.textContent===cur) o.classList.add('right'); }); }
      const nx=el('button','btn', i+1<N?'Suivante →':'Terminer'); nx.onclick=()=>{ i++; step(); }; foot.appendChild(nx);
    }
    function finish(){ S.xp+=good*2; if((S.cagedQuizBest||0)<good) S.cagedQuizBest=good; save();
      qh.innerHTML=`<div class="q">${good}/${N}</div><div class="sub">${good>=6?'Tu lis les formes au premier coup d’œil. Passe à « Connecte le manche ».':'Reviens jouer avec les 5 formes, puis retente — vise le dessin, pas les notes.'}</div>`;
      fb.clearDots(); opts.innerHTML=''; foot.innerHTML='';
      const cl=el('button','btn','Fermer'); cl.onclick=closeOverlay; foot.appendChild(cl);
    }
    step();
  });
}

/* ---- exo : place les fondamentales ---- */
function openCagedRoots(){
  ac(); markDay();
  const sh=CAGED_ORDER[Math.floor(Math.random()*5)], K=Math.floor(Math.random()*12), o=cagedBestOffset(sh,K);
  const notes=cagedNotesAt(sh,o), roots=notes.filter(n=>n.iv===0), picked=new Set();
  openOverlay('Place les fondamentales', inner=>{
    const qh=el('div','qhead',`<div class="q" style="font-size:18px">Forme ${sh} · ${NOTES[K]} majeur</div><div class="sub">Voici la forme. Touche <b>uniquement ses fondamentales</b> (${NOTES[K]}). Il y en a <b>${roots.length}</b>.</div>`); inner.appendChild(qh);
    const prog=el('div','fb-progress'); inner.appendChild(prog);
    const fb=buildFretboard((s,f)=>{ if(fb._done)return; if(!notes.some(n=>n.s===s&&n.f===f))return; const key=s+':'+f;
      if(picked.has(key)) picked.delete(key); else { picked.add(key); pluck(midiAt(s,f)); }
      paint(); prog.innerHTML=`Sélectionnées : <b>${picked.size}</b>/${roots.length}`;
    },CAGED_NF); inner.appendChild(fb);
    function paint(){ fb.clearDots(); notes.forEach(n=>{ const key=n.s+':'+n.f; fb.dot(n.s,n.f, picked.has(key)?'●':'', picked.has(key)?'pick':'on'); }); }
    paint(); prog.innerHTML=`Sélectionnées : <b>0</b>/${roots.length}`;
    const foot=el('div'); inner.appendChild(foot);
    const val=el('button','btn','✓ Valider'); foot.appendChild(val);
    val.onclick=()=>{ fb._done=true; fb.clearDots(); let ok=0,wrong=0;
      notes.forEach(n=>{ const key=n.s+':'+n.f, isRoot=n.iv===0, sel=picked.has(key);
        if(isRoot&&sel){ fb.dot(n.s,n.f,'R','ok'); ok++; }
        else if(isRoot&&!sel){ fb.dot(n.s,n.f,'R','miss'); }
        else if(!isRoot&&sel){ fb.dot(n.s,n.f,IVNAME[n.iv],'no'); wrong++; }
        else fb.dot(n.s,n.f,IVNAME[n.iv],'on'); });
      qh.innerHTML=`<div class="q">${ok}/${roots.length}</div><div class="sub">${ok===roots.length&&!wrong?'Parfait — tu sais où vivent tes fondamentales sur cette forme.':(wrong?'En rouge : ce ne sont pas des fondamentales (c’est la 3 ou la 5). ':'')+'Pointillé bleu : fondamentale ratée.'}</div>`;
      S.xp+=ok; save(); foot.innerHTML='';
      const again=el('button','btn ghost','↻ Une autre forme'); again.onclick=()=>{ closeOverlay(); openCagedRoots(); }; foot.appendChild(again);
      const cl=el('button','btn','Fermer'); cl.onclick=closeOverlay; foot.appendChild(cl);
    };
  });
}

/* ================================================================
   LA BOUSSOLE — dans quelle gamme je joue ? + quoi viser
   ================================================================ */
const DIA=[[0,'maj'],[2,'min'],[4,'min'],[5,'maj'],[7,'maj'],[9,'min'],[11,'dim']];
function detectKeys(chords){ const res=[]; for(let K=0;K<12;K++){ const set=DIA.map(([iv,q])=>((K+iv)%12)+'|'+q); if(chords.length&&chords.every(c=>set.indexOf(c.pc+'|'+c.q)>=0)) res.push(K); } return res; }
const TOOLS_MIN=[
 {n:'Penta mineure', tag:'★ le plus sûr', ints:[0,3,5,7,10], tgt:[0], txt:'5 notes, zéro fausse note. Tu PEUX ne faire que ça et déjà sonner juste. Vise la fondamentale pour te poser.'},
 {n:'Blues mineur', tag:'le grain', ints:[0,3,5,6,7,10], tgt:[0], blue:6, txt:'La penta + la blue note (♭5), seulement en passage (jamais tenue). C’est le sel du blues.'},
 {n:'Mineur naturel', tag:'plus riche', ints:[0,2,3,5,7,8,10], tgt:[0,3,7], txt:'Les 7 notes (éolien). Plus mélancolique, plus de couleurs. Vise 1 · ♭3 · 5 — les notes de l’accord.'},
 {n:'Dorien', tag:'mineur « cool »', ints:[0,2,3,5,7,9,10], tgt:[0,3,9], blue:9, txt:'Si le morceau sonne mineur mais pas triste (jazzy, funky) : la 6te devient majeure (bleu). C’est toute sa couleur.'},
];
const TOOLS_MAJ=[
 {n:'Penta majeure', tag:'★ le plus sûr', ints:[0,2,4,7,9], tgt:[0,4], txt:'5 notes sûres. Vise la fondamentale et la tierce (3) pour sonner « chez toi ».'},
 {n:'Gamme majeure', tag:'complète', ints:[0,2,4,5,7,9,11], tgt:[0,4,7], txt:'Les 7 notes (ionien). Vise 1 · 3 · 5. Lumineux, résolu.'},
 {n:'Blues majeur', tag:'le grain', ints:[0,2,3,4,7,9], tgt:[0,4], blue:3, txt:'La penta majeure + la ♭3 en passage (bleu). Glisse la ♭3 vers la 3 : c’est LA couleur blues-country.'},
 {n:'Mixolydien', tag:'si ça sonne 7 (rock/blues)', ints:[0,2,4,5,7,9,10], tgt:[0,4,10], blue:10, txt:'Sur un accord de 7 (dominante) : la 7e devient mineure (bleu). Le son « Sweet Home ».'},
];
function openBoussole(){
  ac(); markDay();
  let root=9, feel='min', tool=0; const chosen={};   /* défaut : La mineur */
  openOverlay('Dans quelle gamme je joue ?', inner=>{
    inner.appendChild(el('p','lead','Deux questions : quelle est ta TONIQUE (la note « maison ») ? Et : majeur ou mineur ? Réponds — je te donne ta palette et les notes à viser sur le manche.'));

    inner.appendChild(el('div','theory',`
      <h3>1. Trouver la tonique (la note « maison »)</h3>
      <p>La <b>tonique</b>, c’est la note où le morceau <b>se repose</b>, où il pourrait <b>finir</b> sans rester en suspens. Chante « la fin » du morceau : cette note-là, c’est elle.</p>
      <ul>
        <li>Souvent = le <b>dernier accord</b> du morceau.</li>
        <li>Ou l’accord qui <b>revient le plus</b>, celui qui « sonne posé ».</li>
      </ul>
      <h3>2. Majeur ou mineur ?</h3>
      <p>La maison sonne <b>lumineuse / joyeuse</b> → <b>majeur</b>. <b>Sombre / triste / tendue</b> → <b>mineur</b>. Dans le doute, essaie les deux plus bas : ton oreille tranche.</p>`));

    const c=el('div','card');
    c.appendChild(el('b',null,'🏠 Je connais ma note maison'));
    c.appendChild(rootPicker(root,pc=>{root=pc;draw();}));
    const fsel=el('div','toolrow'); const fmin=el('div','tag on','mineur'), fmaj=el('div','tag','majeur');
    fmin.onclick=()=>{feel='min';fmin.classList.add('on');fmaj.classList.remove('on');tool=0;rebuildTools();draw();};
    fmaj.onclick=()=>{feel='maj';fmaj.classList.add('on');fmin.classList.remove('on');tool=0;rebuildTools();draw();};
    fsel.append(fmin,fmaj); c.appendChild(fsel);
    inner.appendChild(c);

    const d=el('div','card');
    d.innerHTML='<b>🎧 Ou : je connais les accords</b><p class="lead" style="margin:6px 0 8px">Coche les accords que tu entends — je trouve la gamme qui les contient tous.</p>';
    const grid=el('div','toolrow'); const CH=[];
    for(let pc=0;pc<12;pc++){ CH.push({pc,q:'maj',lbl:NOTES[pc]}); CH.push({pc,q:'min',lbl:NOTES[pc]+'m'}); }
    CH.forEach(ch=>{ const t=el('div','tag',ch.lbl); t.onclick=()=>{ const k=ch.pc+ch.q; if(chosen[k]){delete chosen[k];t.classList.remove('on');}else{chosen[k]=ch;t.classList.add('on');} }; grid.appendChild(t); }); d.appendChild(grid);
    const detBtn=el('button','btn','Trouver la gamme'); d.appendChild(detBtn);
    const detOut=el('div','clogic'); detOut.style.display='none'; d.appendChild(detOut);
    detBtn.onclick=()=>{ const chords=Object.values(chosen); if(chords.length<2){detOut.style.display='block';detOut.innerHTML='Coche au moins <b>deux</b> accords.';return;}
      const keys=detectKeys(chords); detOut.style.display='block';
      if(!keys.length){ detOut.innerHTML='Ces accords ne rentrent pas tous dans une seule gamme majeure — le morceau <b>emprunte</b> peut-être des accords. Prends l’accord qui sonne « maison » comme tonique (plus haut).'; return; }
      const html=keys.map(K=>`<b>${NOTES[K]} majeur</b> / ${NOTES[(K+9)%12]} mineur`).join(' &nbsp;—&nbsp; ou &nbsp;—&nbsp; ');
      detOut.innerHTML=`<div class="deg">Gamme trouvée</div>Ces accords vivent dans : ${html}.<br>Ta tonique = l’accord « maison ». S’il est <b>majeur</b> → <b>${NOTES[keys[0]]} majeur</b> ; s’il est <b>mineur</b> → <b>${NOTES[(keys[0]+9)%12]} mineur</b>. J’ai réglé la palette sur ${NOTES[keys[0]]} majeur — bascule en mineur si besoin.`;
      root=keys[0]; feel='maj'; fmaj.classList.add('on'); fmin.classList.remove('on'); tool=0; rebuildTools(); draw();
    };
    inner.appendChild(d);

    const pb=el('div','card');
    pb.appendChild(el('b',null,'🎨 Ta palette — du plus sûr au plus coloré'));
    pb.appendChild(el('p','lead','Tu PEUX rester sur la 1re (sûre). Si tu VEUX plus de couleur, descends la liste.'));
    const toolChips=el('div','toolrow'); pb.appendChild(toolChips);
    const fb=buildFretboard((s,f)=>pluck(midiAt(s,f))); pb.appendChild(fb);
    const onlyRow=el('div','toolrow'); const tOnly=el('div','tag','Ne montrer que les notes à viser'); onlyRow.appendChild(tOnly); pb.appendChild(onlyRow);
    let onlyTargets=false; tOnly.onclick=()=>{onlyTargets=!onlyTargets;tOnly.classList.toggle('on',onlyTargets);draw();};
    const pinfo=el('div','clogic'); pb.appendChild(pinfo);
    const pplay=el('button','btn ghost','🔊 Écouter'); pb.appendChild(pplay);
    inner.appendChild(pb);

    inner.appendChild(el('div','theory',`<div class="tip">Pour aller plus loin (relier une chanson à un <b>mode</b> précis, la formule parent-majeur), va dans <b>De la chanson au mode</b>. Ici, l’essentiel : trouve ta tonique, pose la penta, et <b>vise les notes bleues</b>.</div>`));

    let toolEls=[];
    const tools=()=> feel==='min'?TOOLS_MIN:TOOLS_MAJ;
    function rebuildTools(){ toolChips.innerHTML=''; toolEls=tools().map((T,i)=>{ const t=el('div','tag'+(i===tool?' on':''),T.n); t.onclick=()=>{tool=i;toolEls.forEach(x=>x.classList.remove('on'));t.classList.add('on');draw();}; toolChips.appendChild(t); return t; }); }
    function draw(){
      const T=tools()[tool], pcs=pcsFrom(root,T.ints), tgt=T.tgt.map(i=>(root+i)%12), bluePc=T.blue!=null?(root+T.blue)%12:null;
      fb.clearDots();
      for(let s=0;s<6;s++)for(let f=0;f<=FRETS;f++){ const pc=midiAt(s,f)%12; if(pcs.indexOf(pc)<0) continue;
        const isRoot=pc===root, isTgt=tgt.indexOf(pc)>=0, isBlue=bluePc!=null&&pc===bluePc;
        if(onlyTargets && !isRoot && !isTgt && !isBlue) continue;
        fb.dot(s,f,NOTES[pc], isRoot?'root':((isTgt||isBlue)?'pick':'on')); }
      pplay.onclick=()=>playScaleUp(root,T.ints);
      const tgtNames=tgt.map(p=>NOTES[p]).join(' · ')+(bluePc!=null?' · '+NOTES[bluePc]+' (passage)':'');
      pinfo.innerHTML=`<div class="deg">${NOTES[root]} ${feel==='min'?'mineur':'majeur'} · ${T.n} <span style="color:var(--dim)">(${T.tag})</span></div>${T.txt}<br><b style="color:var(--bad)">Fondamentale : ${NOTES[root]}</b> (rouge). <b style="color:var(--blue)">À viser : ${tgtNames}</b> (bleu) — atterris dessus pour sonner juste.`;
    }
    rebuildTools(); draw();
  });
}

/* ================================================================
   MODULE POWER CHORDS
   ================================================================ */
function openPowerModule(){
  ac(); markDay();
  let rs=0, fret=3;   /* rs : 0 = fond. sur Mi grave, 1 = sur La */
  openOverlay('Maîtriser les power chords', inner=>{
    inner.appendChild(el('div','theory',`
      <h3>Pourquoi ils sont partout</h3>
      <p>Un <b>power chord</b> (accord de quinte, «&nbsp;X5&nbsp;») = seulement <b>2 notes</b> : la <b>fondamentale</b> et sa <b>quinte</b>. <b>Pas de tierce</b> → ni majeur ni mineur. Il passe donc sur tout, et avec la disto il sonne <b>énorme et net</b> (la tierce, elle, «&nbsp;bave&nbsp;» en saturation). C’est le carburant du rock et du métal.</p>
      <div class="formula">Power chord = 1 + 5 &nbsp;(+ 8)</div>
      <p>On ajoute souvent l’<b>octave</b> (la fondamentale au-dessus) pour un son plus plein : 3 cordes au lieu de 2.</p>`));

    const c=el('div','card');
    c.appendChild(el('b',null,'🎸 La forme, et comment elle se déplace'));
    c.appendChild(el('p','lead','La <b>même</b> forme partout. Le nom de l’accord = la note sous ton <b>index</b> (la fondamentale). Tu connais déjà toutes les fondamentales grâce à l’étape Manche — déplace la forme, c’est tout.'));
    const ss=el('div','toolrow'); const sE=el('div','tag on','Fond. sur Mi grave'), sA=el('div','tag','Fond. sur La');
    sE.onclick=()=>{rs=0;sE.classList.add('on');sA.classList.remove('on');draw();}; sA.onclick=()=>{rs=1;sA.classList.add('on');sE.classList.remove('on');draw();};
    ss.append(sE,sA); c.appendChild(ss);
    const fsel=el('div','toolrow'); const fTags=[]; for(let f=1;f<=9;f++){ const t=el('div','tag'+(f===fret?' on':''),'C'+f);
      t.onclick=()=>{fret=f;fTags.forEach(x=>x.classList.remove('on'));t.classList.add('on');draw();}; fTags.push(t); fsel.appendChild(t);} c.appendChild(fsel);
    const fb=buildFretboard(null); c.appendChild(fb);
    const nm=el('div','qhead'); c.appendChild(nm);
    const play=el('button','btn ghost','🔊 Écouter'); play.onclick=()=>strum(shape()); c.appendChild(play);
    inner.appendChild(c);

    inner.appendChild(el('div','theory',`
      <h3>Le palm mute (le «&nbsp;chuggo&nbsp;»)</h3>
      <p>Pose le tranchant de ta main droite (côté auriculaire) sur les cordes <b>tout près du chevalet</b>. Ça étouffe juste ce qu’il faut → le fameux «&nbsp;<b>tchak-tchak</b>&nbsp;» du métal. Trop vers le manche = tout est mort ; ajuste de quelques millimètres.</p>
      <h3>Pourquoi tu galères (et comment débloquer)</h3>
      <ul>
        <li><b>Ça frise / ça sonne mort</b> : appuie <b>juste derrière</b> la barrette (jamais dessus), et <b>cambre</b> les doigts pour ne pas coucher sur les cordes voisines.</li>
        <li><b>Des cordes parasites sonnent</b> : laisse la <b>pulpe de l’index</b> effleurer les cordes graves inutilisées pour les étouffer.</li>
        <li><b>L’écart index→annulaire fait mal</b> : garde <b>annulaire + auriculaire collés</b> (ils jouent la même case), poignet bas et relâché, pouce derrière le manche.</li>
        <li><b>Les changements sont lents</b> : ne relâche pas la forme, <b>glisse-la</b> le long des cordes d’une position à la suivante.</li>
      </ul>`));

    const q=el('div','card'); q.innerHTML='<b>🎯 Trouve la fondamentale</b><p class="lead" style="margin:6px 0 10px">L’app te donne un power chord. Touche la case de sa <b>fondamentale</b> (sur Mi grave ou La). Ça muscle l’étape Manche là où ça sert vraiment.</p>';
    const qb=el('button','btn','Lancer le quiz'); qb.onclick=()=>powerQuiz(); q.appendChild(qb); inner.appendChild(q);

    const pr=el('div','card'); pr.innerHTML='<b>🤘 Mets-les en musique</b><p class="lead" style="margin:6px 0 10px">Une suite rock à enchaîner en power chords : palm mute, tempo régulier, même forme qui se déplace.</p>';
    const prb=el('button','btn ghost','▶ Progression rock'); prb.onclick=()=>openProgression({n:'Rock · power chords',ch:['E5','G5','A5','E5'],tip:'Palm mute, tempo régulier. Déplace la même forme et vise bien la fondamentale sous ton index.'}); pr.appendChild(prb); inner.appendChild(pr);

    function shape(){ const fr=[-1,-1,-1,-1,-1,-1]; fr[rs]=fret; fr[rs+1]=fret+2; fr[rs+2]=fret+2; return {frets:fr}; }
    function draw(){ fb.clearDots();
      const pc=midiAt(rs,fret)%12;
      fb.dot(rs,fret,'1','root'); fb.dot(rs+1,fret+2,'5','on'); fb.dot(rs+2,fret+2,'8','on');
      nm.innerHTML=`<div class="q">${NOTES[pc]}5</div><div class="sub">fondamentale ${NOTES[pc]} · quinte ${NOTES[midiAt(rs+1,fret+2)%12]} · octave ${NOTES[pc]}</div>`;
    }
    draw();
  });
}
function powerQuiz(){
  ac();
  let i=0, good=0, cur=null;
  openOverlay('Trouve la fondamentale', inner=>{
    const prog=el('div','fb-progress'); inner.appendChild(prog);
    const qh=el('div','qhead'); inner.appendChild(qh);
    const fb=buildFretboard((s,f)=>{ if(fb._done)return; answer(s,f); }); inner.appendChild(fb);
    const foot=el('div'); inner.appendChild(foot);
    function step(){ if(i>=8) return finish();
      const rs=Math.random()<.5?0:1, fret=1+Math.floor(Math.random()*9);
      cur={rs,fret,pc:midiAt(rs,fret)%12};
      fb._done=false; fb.clearDots(); foot.innerHTML='';
      prog.innerHTML=`Question <b>${i+1}</b>/8 · ✓ ${good}`;
      qh.innerHTML=`<div class="q">${NOTES[cur.pc]}5</div><div class="sub">Touche la fondamentale (${NOTES[cur.pc]}) sur Mi grave ou La.</div>`;
    }
    function answer(s,f){ const pc=midiAt(s,f)%12; pluck(midiAt(s,f)); fb._done=true;
      const okPos=(s===0||s===1)&&pc===cur.pc; fb.clearDots();
      fb.dot(cur.rs,cur.fret,NOTES[cur.pc],'ok'); fb.dot(cur.rs+1,cur.fret+2,'5','on'); fb.dot(cur.rs+2,cur.fret+2,'8','on');
      if(!(s===cur.rs&&f===cur.fret)) fb.dot(s,f,NOTES[pc],okPos?'ok':'no');
      if(okPos) good++;
      qh.querySelector('.sub').textContent = okPos?'✓ Oui — n’importe quelle fondamentale sur Mi grave/La marche.':'Raté : la voilà en vert (+ la forme).';
      const nx=el('button','btn', i+1<8?'Suivant →':'Terminer'); nx.onclick=()=>{i++;step();}; foot.appendChild(nx);
    }
    function finish(){ if(good>(S.powBest||0)){S.powBest=good;save();} qh.innerHTML=`<div class="q">${good}/8</div><div class="sub">${good>=6?'Tu places tes fondamentales — le plus dur est fait.':'Repasse par l’étape Manche : les fondamentales sur Mi grave et La.'}</div>`; fb.clearDots(); foot.innerHTML=''; const cl=el('button','btn','Fermer'); cl.onclick=closeOverlay; foot.appendChild(cl); }
    step();
  });
}

/* ================================================================
   IMPROVISATION — hub : penta · chanson→mode · blues 12 · licks · phrasé
   ================================================================ */
function openImproHub(){
  markDay();
  openOverlay('Improviser', inner=>{
    inner.appendChild(el('p','lead','Le vrai terrain de jeu. Perdu sur un morceau ? Commence par la Boussole. Sinon : le lick du jour, la penta, les modes, le blues, des licks & riffs, la technique, le phrasé.'));
    inner.appendChild(lickOfDayCard(true));
    const items=[
      ['🗺','La Conquête des gammes','Les 5 boîtes de la penta, une par une, 5 paliers chacune — et elles redescendent si tu les laisses filer. Pensé pour le téléphone.',openConquete],
      ['🎯','Le Duel — 60 s, combo, 3 vies','L’arcade : l’app te jette une boîte et une tonalité, tu touches le degré demandé au réflexe.',openDuel],
      ['🎧','Le Juke-box — jouer sur des vrais morceaux','30 morceaux rangés par gamme, la grille jouée en boucle par l’app, et LA note à viser. Lonely Day, Deftones, Nirvana, le blues…',openJukebox],
      ['🧭','Dans quelle gamme je joue ? (+ quoi viser)','Trouve ta tonique (depuis les accords ou l’oreille), puis ta palette — penta, blues, modes — et les notes à viser sur le manche.',openBoussole],
      ['🎯','La penta & les notes à viser','Les 5 notes, les positions, et surtout QUOI viser (ta 3ce majeure, la blue note).',openPentaModule],
      ['🎼','De la chanson au mode','« Ma chanson est en Mi mineur → quelle gamme majeure, quelle position, pour quel mode ? » La formule, sur le manche.',openSongMode],
      ['🥁','Le blues en 12 mesures','La grille, et la note qui fait « pro » sur chaque accord.',openBlues12],
      ['🎸','Licks, riffs & lick du jour','Des phrases toutes faites (blues, rock) + des riffs de style (metal, funk…), en tablature + au son.',openLicks],
      ['🕷️','Technique & déliateurs','L’araignée, l’alternance des doigts, le legato… les exos qui construisent ta main : vitesse, indépendance, précision.',openTechnique],
      ['🗣️','Bien phraser (le secret)','Le silence, les motifs, l’appel-réponse, la tension qui se résout. Le mindset du soliste.',openPhrasing],
    ];
    items.forEach(it=>{ const c=el('div','catcard',`<div class="ico">${it[0]}</div><div class="t"><b>${it[1]}</b><small>${it[2]}</small></div><div class="pc">›</div>`); c.onclick=it[3]; inner.appendChild(c); });
  });
}

/* --- De la chanson au mode : la formule parent-majeur --- */
function openSongMode(){
  ac(); markDay();
  let root=4, feel='min';                 /* Mi mineur par défaut */
  const SETS={min:[5,1,2], maj:[0,3,4]};  /* éolien/dorien/phrygien ; ionien/lydien/mixo */
  const OFF=[0,2,4,5,7,9,11];             /* intervalle du degré de départ dans la majeure */
  const DEGN=['1er','2e','3e','4e','5e','6e','7e'];
  let mi=SETS[feel][0];
  openOverlay('De la chanson au mode', inner=>{
    inner.appendChild(el('div','theory',`
      <h3>L’idée en une phrase</h3>
      <p>Un <b>mode</b>, c’est une <b>gamme majeure que tu connais déjà</b>, jouée en te reposant sur une <b>autre note</b>. Pour colorer ta chanson, la question est donc : <b>quelle gamme majeure superposer, et sur quelle note revenir ?</b></p>
      <div class="formula">Mode de degré N sur ta fondamentale<br>= la gamme MAJEURE dont ta fondamentale est le degré N</div>`));
    const c=el('div','card');
    c.appendChild(el('b',null,'1. Ta chanson est en…'));
    c.appendChild(rootPicker(root,pc=>{root=pc;draw();}));
    const fsel=el('div','toolrow'); const fmin=el('div','tag on','mineur'),fmaj=el('div','tag','majeur');
    fmin.onclick=()=>{feel='min';fmin.classList.add('on');fmaj.classList.remove('on');mi=SETS.min[0];rebuild();draw();};
    fmaj.onclick=()=>{feel='maj';fmaj.classList.add('on');fmin.classList.remove('on');mi=SETS.maj[0];rebuild();draw();};
    fsel.append(fmin,fmaj); c.appendChild(fsel);
    const lbl=el('b',null,'2. Quelle couleur (mode) ?'); lbl.style.cssText='display:block;margin-top:10px'; c.appendChild(lbl);
    const chips=el('div','toolrow'); c.appendChild(chips);
    const fb=buildFretboard(null); c.appendChild(fb);
    const info=el('div','clogic'); c.appendChild(info);
    const play=el('button','btn ghost','🔊 Écouter le mode'); play.onclick=()=>playScaleUp(root,MODES[mi].ints); c.appendChild(play);
    inner.appendChild(c);
    let chipEls=[];
    function rebuild(){ chips.innerHTML=''; chipEls=SETS[feel].map(k=>{ const t=el('div','tag'+(k===mi?' on':''),MODES[k].n); t.onclick=()=>{mi=k;chipEls.forEach(x=>x.classList.remove('on'));t.classList.add('on');draw();}; chips.appendChild(t); return t; }); }
    function draw(){
      const M=MODES[mi], pcs=pcsFrom(root,M.ints), charPc=M.char!=null?(root+M.char)%12:null;
      paintScale(fb, root, pcs, {labels:true, char:charPc});
      const parent=NOTES[((root-OFF[mi])%12+12)%12];
      info.innerHTML=`<div class="deg">${NOTES[root]} ${M.n} = la gamme de <b>${parent} majeur</b></div>
        Ta fondamentale <b>${NOTES[root]}</b> est le <b>${DEGN[mi]} degré</b> de ${parent} majeur : joue les <b>positions de ${parent} majeur</b> (celles que tu connais déjà) et <b>repose-toi sur le ${NOTES[root]}</b>.
        <br><b style="color:var(--blue)">La note qui colore : ${M.charTxt}${charPc!=null?' ('+NOTES[charPc]+', en bleu)':''}.</b> ${feel==='min'&&mi!==5?'C’est elle qui change par rapport au mineur naturel. ':''}${M.txt}`;
    }
    rebuild(); draw();
  });
}

/* --- Le blues en 12 mesures + notes à viser par accord --- */
function openBlues12(){
  ac(); markDay();
  let chord='A7';
  const TARG={ 'A7':{pc:1,name:'Do♯',deg:'la tierce majeure de La'}, 'D7':{pc:6,name:'Fa♯',deg:'la tierce de Ré'}, 'E7':{pc:8,name:'Sol♯',deg:'la tierce de Mi'} };
  const GRID=['A7','A7','A7','A7','D7','D7','A7','A7','E7','D7','A7','E7'];
  openOverlay('Le blues en 12 mesures', inner=>{
    inner.appendChild(el('div','theory',`
      <h3>La grille (en La)</h3>
      <p>Le blues, c’est <b>12 mesures</b> qui tournent en boucle, sur 3 accords : <b>La7 (I)</b>, <b>Ré7 (IV)</b>, <b>Mi7 (V)</b>.</p>`));
    const g=el('div','g12'); GRID.forEach(ch=>g.appendChild(el('div','cell'+(ch==='D7'?' iv':ch==='E7'?' v':''),ch))); inner.appendChild(g);
    inner.appendChild(el('div','theory',`
      <h3>Quoi jouer</h3>
      <p><b>Le raccourci magique :</b> la <b>penta mineure de La</b> sonne sur TOUT le morceau. Tu peux ne faire que ça et déjà être dans le blues.</p>
      <p><b>Pour sonner pro :</b> sur chaque accord, vise sa <b>tierce</b> — souvent une note HORS de la penta mineure. C’est ça, « jouer les changements ».</p>`));
    const c=el('div','card'); c.appendChild(el('b',null,'La note à viser sur chaque accord'));
    const chips=el('div','toolrow'); const chipEls=['A7','D7','E7'].map(k=>{ const t=el('div','tag'+(k===chord?' on':''),k); t.onclick=()=>{chord=k;chipEls.forEach(x=>x.classList.remove('on'));t.classList.add('on');draw();}; chips.appendChild(t); return t; }); c.appendChild(chips);
    const fb=buildFretboard(null); c.appendChild(fb);
    const info=el('div','clogic'); c.appendChild(info);
    inner.appendChild(c);
    function draw(){
      const pcs=pcsFrom(9,[0,3,5,7,10]); const tg=TARG[chord];
      paintScale(fb, 9, pcs, {labels:true, extra:tg.pc});
      info.innerHTML=`<div class="deg">Sur ${chord} → vise ${tg.name}</div>Penta mineure de La (fondamentale La en rouge). <b style="color:var(--blue)">En bleu : ${tg.name}</b> = ${tg.deg}. Atterris dessus quand ${chord} passe : ton solo « suit » les accords au lieu de rester plat.`;
    }
    draw();
  });
}

/* --- Les licks : tablature générée depuis les notes + audio --- */
const LICKS=[
 {n:'La descente (le squelette)', key:'La min penta · boîte 1', seq:[{s:5,f:8},{s:5,f:5},{s:4,f:8},{s:4,f:5},{s:3,f:7},{s:3,f:5},{s:2,f:7},{s:2,f:5},{s:1,f:7},{s:1,f:5},{s:0,f:8},{s:0,f:5}], why:'La boîte 1 de haut en bas. Apprends-la jusqu’à la jouer les yeux fermés : tous les licks en sortent.'},
 {n:'Le lick blues n°1', key:'La · bend + blue note', seq:[{s:3,f:7,t:'b'},{s:3,f:5},{s:2,f:7},{s:1,f:6,t:'/'},{s:1,f:7,t:'~'}], why:'Plie le Ré (corde de Sol, case 7) d’un ton jusqu’au Mi, redescends Do–La, puis glisse la blue note (Mi♭, case 6) vers le Mi. Ce ♭5→5, c’est LE frisson du blues.'},
 {n:'Le B.B. King (2 notes)', key:'La · l’émotion', seq:[{s:4,f:8,t:'b'},{s:5,f:5,t:'~'}], why:'Le secret de B.B. : deux notes. Plie le Sol (corde de Si, case 8) jusqu’au La, puis chante le La (mi aigu, case 5) avec un gros vibrato. Moins de notes, plus d’émotion.'},
 {n:'La cascade (pull-offs)', key:'La · fluidité', seq:[{s:4,f:8,t:'p'},{s:4,f:5},{s:3,f:7,t:'p'},{s:3,f:5},{s:2,f:7,t:'p'},{s:2,f:5}], why:'Des tirés en cascade : joue la case haute, laisse claquer le doigt vers la basse. Le son legato du blues-rock.'},
 {n:'La couleur majeure (ton Do♯)', key:'La · ♭3 → 3', seq:[{s:2,f:7},{s:3,f:5},{s:3,f:6,t:'h'},{s:3,f:7},{s:4,f:5}], why:'Entre le Do (corde de Sol, case 5) et le Ré (case 7), passe par le Do♯ (case 6) — la tierce MAJEURE. Ce Do→Do♯ éclaire tout de suite le son. C’est ton exemple, en phrase.'},
 {n:'Le riff rock (en Mi)', key:'Mi min penta · open', seq:[{s:0,f:0},{s:0,f:3,t:'h'},{s:1,f:0},{s:1,f:2},{s:0,f:0}], why:'En Mi, tout tombe sous les doigts en open. Mi–Sol (marteau) puis La–Si, retour au Mi. Palm mute et c’est un riff.'},
 {n:'Le blues répétitif', key:'La · le motif qui insiste', seq:[{s:3,f:7,t:'b'},{s:3,f:5},{s:4,f:5},{s:3,f:7,t:'b'},{s:3,f:5},{s:4,f:5}], why:'Répète un petit motif (Ré-bendé-Mi, Do, Mi aigu) : l’oreille adore ce qui revient. Un bon solo, c’est souvent UNE idée répétée, pas dix idées.'},
 {n:'La mitraillette (séquence)', key:'La · vitesse par groupes', seq:[{s:5,f:8},{s:5,f:5},{s:4,f:8},{s:5,f:5},{s:4,f:8},{s:4,f:5},{s:3,f:7},{s:4,f:5},{s:3,f:7},{s:3,f:5}], why:'Le secret des traits rapides : joue la penta par petits groupes qui se chevauchent, pas note par note. Lentement d’abord, la vitesse suit.'},
 {n:'Le lick de résolution', key:'La · finir propre sur la tonique', seq:[{s:4,f:8,t:'b'},{s:5,f:5},{s:5,f:8},{s:5,f:5},{s:4,f:5},{s:2,f:7,t:'~'}], why:'Pour BIEN finir une phrase, tombe sur le La (la fondamentale, ici corde de Ré case 7) avec un vibrato. Ça sonne « résolu », posé — pas en suspens.'},
];
/* riffs : patterns originaux dans les grands styles (pas de copie d’œuvre) */
const RIFFS=[
 {n:'Shuffle blues (en La)', key:'boogie · corde de La & Ré', seq:[{s:1,f:0},{s:2,f:2},{s:2,f:4},{s:2,f:2},{s:1,f:0},{s:2,f:2},{s:2,f:4},{s:2,f:2}], why:'La pompe du blues : la basse monte 1–5–6–5 (La–Mi–Fa♯–Mi). Joue-la en swing (ternaire, « ta-tam ta-tam »). Toute la boogie et le rock’n’roll sont là-dessus.'},
 {n:'Rock (power chords)', key:'Mi5 · Sol5 · La5', seq:[{s:0,f:0},{s:0,f:0},{s:0,f:3},{s:0,f:5},{s:0,f:0},{s:0,f:3},{s:0,f:5},{s:0,f:0}], why:'Joue chaque note en POWER CHORD (la forme du module ⚡), palm mute léger. Mi5–Sol5–La5 : la marche rock la plus classique du monde.'},
 {n:'Gallop metal', key:'Mi grave · palm mute serré', seq:[{s:0,f:0},{s:0,f:0},{s:0,f:0},{s:0,f:3},{s:0,f:0},{s:0,f:0},{s:0,f:0},{s:0,f:5}], why:'« Da-da-dum, da-da-dum » : trois Mi graves palm-mutés serrés, ponctués d’une note (Sol, La). Au pouce, coups serrés vers le bas (butée). Le moteur du metal.'},
 {n:'Funk (single-note groove)', key:'Mi min · joue COURT', seq:[{s:2,f:2},{s:3,f:0},{s:2,f:2},{s:2,f:0},{s:3,f:2},{s:2,f:2}], why:'Le funk, c’est le rythme et les SILENCES. Joue des notes très courtes, étouffe entre chaque (ghost notes), reste collé au groove. Moins de notes, plus de place.'},
 {n:'Surf / western', key:'Mi min · trémolo + réverb', seq:[{s:0,f:0},{s:0,f:3},{s:0,f:5},{s:0,f:7},{s:0,f:5},{s:0,f:3}], why:'Le son « spaghetti western » / Tarantino : trémolo (i-m-i-m ultra-rapide sur chaque note) et réverb à fond. Descends la corde de Mi grave, dramatique et mouillé.'},
 {n:'Espagnol (phrygien)', key:'Mi phrygien · le ♭2', seq:[{s:0,f:0},{s:0,f:1},{s:0,f:3},{s:0,f:5},{s:0,f:3},{s:0,f:1},{s:0,f:0}], why:'La couleur flamenco/orientale : le Fa juste au-dessus du Mi (le ♭2 du mode phrygien, cf. tes fiches de modes). Allers-retours nerveux, accents secs.'},
 {n:'Punk (tout en bas)', key:'Mi5–La5–Si5 · downstrokes', seq:[{s:0,f:0},{s:0,f:0},{s:1,f:0},{s:1,f:0},{s:0,f:0},{s:0,f:0},{s:1,f:2},{s:1,f:2}], why:'Trois power chords, TOUT au pouce en coups secs vers le bas (butée), tempo rapide, aucune finesse. L’énergie avant la technique — le punk en deux minutes.'},
 {n:'Stoner / heavy', key:'Mi blues · lourd & lent', seq:[{s:0,f:0},{s:0,f:0},{s:0,f:3},{s:0,f:0},{s:0,f:6},{s:0,f:5}], why:'Lent, gras, en bas : Mi–Mi–Sol–Mi–Si♭(la blue note)–La. Grosse disto, tempo traînant. Le riff « désert » qui écrase tout.'},
 {n:'Grunge (années 90)', key:'Mi5 + une note qui frotte', seq:[{s:0,f:0},{s:0,f:0},{s:0,f:6},{s:0,f:5}], why:'Power chords + une note dissonante (le Si♭, la ♭5) qui « frotte ». Alterne propre/sale, doux/fort — c’est le contraste, pas la vitesse, qui fait le son 90s.'},
 {n:'Celtique / folk', key:'Ré majeur · corde de Ré', seq:[{s:2,f:0},{s:2,f:2},{s:2,f:4},{s:2,f:5},{s:2,f:4},{s:2,f:2}], why:'Un air de gigue : Ré–Mi–Fa♯–Sol qui monte et redescend sur la corde de Ré. Joue-le rond et dansant, façon musique celtique.'},
];
/* technique : déliateurs (l’araignée & co) — construits, pas « musicaux » */
const SPIDER=[]; for(let s=0;s<6;s++)for(let f=1;f<=4;f++) SPIDER.push({s,f});
const SPIDER_X=[]; for(let a=0;a<5;a++){ SPIDER_X.push({s:a,f:1},{s:a+1,f:2},{s:a,f:3},{s:a+1,f:4}); }
const TECH=[
 {n:'🕷️ L’araignée', key:'déliateur chromatique', seq:SPIDER, how:'Un doigt par case (1-2-3-4). Monte corde par corde du Mi grave au Mi aigu, puis redescends. Chaque note claire avant de passer à la suivante.', why:'LE déliateur : indépendance des 4 doigts + synchro main gauche/droite. 5 min par jour et ta main change en deux semaines.'},
 {n:'🕸️ L’araignée croisée', key:'le vrai « spider »', seq:SPIDER_X, how:'Tu traverses les cordes en gardant chaque doigt sur SA case (1 et 3 sur une corde, 2 et 4 sur la voisine). Ne regarde pas ta main.', why:'Force les doigts faibles (annulaire, auriculaire) et t’apprend à changer de corde proprement — le point qui bloque tout le monde.'},
 {n:'↔️ Alternance des doigts (i-m)', key:'index-majeur régulier', seq:[{s:0,f:5},{s:0,f:6},{s:0,f:7},{s:0,f:8},{s:0,f:8},{s:0,f:7},{s:0,f:6},{s:0,f:5}], how:'i-m-i-m STRICT (index puis majeur), jamais deux fois le même doigt. Sur une seule corde d’abord. Vise la régularité (comme un métronome), pas la vitesse.', why:'La base de toute la vitesse à droite aux doigts. Une alternance i-m régulière = des gammes et des licks rapides plus tard.'},
 {n:'🌊 Legato (marteaux & tirés)', key:'la main gauche fait le son', seq:[{s:3,f:5},{s:3,f:7,t:'h'},{s:3,f:5,t:'p'},{s:3,f:7,t:'h'},{s:3,f:8,t:'h'},{s:3,f:5,t:'p'},{s:3,f:7,t:'h'}], how:'Frappe (hammer) et arrache (pull-off) SANS repincer : une seule attaque du doigt, tout le reste vient de la main gauche. Cherche l’égalité de volume.', why:'Le son fluide, « coulé », du blues-rock et du solo. Muscle aussi ta main gauche.'},
 {n:'⛷️ Cordes sautées', key:'précision main droite', seq:[{s:0,f:5},{s:2,f:5},{s:1,f:5},{s:3,f:5},{s:2,f:5},{s:4,f:5}], how:'Saute une corde à chaque note. Vise juste, sans accrocher la corde du milieu. Lent et net.', why:'Précision de la main droite : tu vises la bonne corde à tous les coups. Ouvre les sons plus larges (arpèges).'},
 {n:'🖐️ L’étirement', key:'gagner en allonge', seq:[{s:0,f:1},{s:0,f:5},{s:1,f:2},{s:1,f:6},{s:2,f:3},{s:2,f:7}], how:'Écarte index (case basse) et auriculaire (case haute) sur des cases éloignées. DOUCEMENT, jamais dans la douleur — on gagne en amplitude par petites touches.', why:'De la souplesse dans la main = des accords et des écarts plus confortables. À faire échauffé.'},
];
function renderTab(seq){
  const names=['e','B','G','D','A','E'], rows=[[],[],[],[],[],[]];
  const labels=seq.map(st=>''+st.f+(st.t?st.t:'')), w=Math.max(2,...labels.map(l=>l.length))+1;
  seq.forEach((st,i)=>{ const lab=labels[i], rowIdx=5-st.s; for(let r=0;r<6;r++) rows[r].push(r===rowIdx?('-'.repeat(w-lab.length)+lab):'-'.repeat(w)); });
  return names.map((nm,r)=>nm+'|'+rows[r].join('')+'-|').join('\n');
}
function playLick(seq){ ac(); seq.forEach((st,i)=>setTimeout(()=>{ pluck(midiAt(st.s,st.f)+(st.t==='b'?2:0),1.3,.5); },i*340)); }
const dayNum=()=>Math.floor(Date.now()/864e5);
function lickOfDay(){ return LICKS[dayNum()%LICKS.length]; }
function lickCard(L, withBpm){ const c=el('div','card');
  c.innerHTML=`<b>${L.n}</b>${L.key?` <span style="color:var(--acc);font-size:12px;font-weight:700">· ${L.key}</span>`:''}`;
  const pre=el('pre','tab'); pre.textContent=renderTab(L.seq); c.appendChild(pre);
  if(L.how){ const h=el('p','lead','🖐 '+L.how); h.style.margin='4px 0 0'; c.appendChild(h); }
  const p=el('p','lead',L.why); p.style.margin='4px 0 0'; c.appendChild(p);
  const b=el('button','btn ghost','🔊 Jouer'); b.onclick=()=>playLick(L.seq); c.appendChild(b);
  if(withBpm) c.appendChild(bpmLog('tech·'+L.n, 80));
  return c;
}
function lickOfDayCard(withOpen){ const L=lickOfDay(); const c=el('div','card'); c.style.borderColor='var(--acc)';
  c.innerHTML=`<b>🎸 Lick du jour</b> <span style="color:var(--acc);font-size:12px;font-weight:700">· ${L.n}</span><p class="lead" style="margin:6px 0 8px">Celui à travailler aujourd’hui : lentement, puis plus vite, puis déforme-le. ${L.why}</p>`;
  const pre=el('pre','tab'); pre.textContent=renderTab(L.seq); c.appendChild(pre);
  const b=el('button','btn','🔊 Jouer le lick du jour'); b.onclick=()=>playLick(L.seq); c.appendChild(b);
  if(withOpen){ const o=el('button','btn ghost','Tous les licks & riffs ›'); o.onclick=()=>openLicks(); c.appendChild(o); }
  return c;
}
function openLicks(){
  ac(); markDay();
  openOverlay('Licks, riffs & lick du jour', inner=>{
    inner.appendChild(lickOfDayCard(false));
    inner.appendChild(el('p','lead','Légende : b = bend (tiré d’un ton), h = hammer, p = pull-off, / = slide, ~ = vibrato. Sauf mention, tout est en La (penta), boîte 1.'));
    inner.appendChild(el('h1','page','Les licks'));
    LICKS.forEach(L=>inner.appendChild(lickCard(L)));
    inner.appendChild(el('h1','page','Les riffs'));
    inner.appendChild(el('p','lead','Un tour des grands styles — blues, rock, metal, funk, surf, flamenco, punk, stoner, grunge, celtique. Ce sont des riffs que j’ai composés pour te faire travailler LE GESTE de chaque genre (pas la copie d’un morceau précis). Apprends le mouvement : après, tu reconnais et tu rejoues n’importe quel riff du même style.'));
    RIFFS.forEach(L=>inner.appendChild(lickCard(L)));
    inner.appendChild(el('div','theory',`<div class="tip">La routine : le <b>lick du jour</b> (en haut) + un riff qui te plaît. Au métronome, tempo lent → tu montes seulement quand c’est PROPRE. Le but n’est pas de réciter mais de <b>mélanger</b> et de casser.</div>`));
  });
}
function openTechnique(){
  ac(); markDay();
  openOverlay('Technique & déliateurs', inner=>{
    inner.appendChild(el('div','theory',`
      <h3>Ces exercices ne « sonnent » pas — ils construisent ta main</h3>
      <p>La règle d’or : <b>lentement, au métronome, chaque note nette</b>. La vitesse vient toute seule quand c’est propre — jamais l’inverse. <b>5 minutes par jour</b> suffisent à tout changer.</p>
      <div class="tip"><b>Main gauche</b> — un doigt par case : index = 1, majeur = 2, annulaire = 3, auriculaire = 4. Ne regarde pas ta main : apprends à SENTIR les cases.<br><b>Main droite (aux doigts, sans médiator)</b> : le pouce sur les cordes graves, index (i) et majeur (m) qui <b>alternent</b> (i-m-i-m) sur les aiguës. Jamais deux notes de suite avec le même doigt.</div>`));
    { const mb=el('button','btn ghost','🥁 Ouvrir le métronome'); mb.onclick=()=>openMetronome(); inner.appendChild(mb); }
    TECH.forEach(L=>inner.appendChild(lickCard(L,true)));
    inner.appendChild(el('div','theory',`<div class="tip">Progression : trouve le tempo où tu joues 3 fois de suite SANS faute, puis +5 BPM. Note-le dans un coin. C’est comme ça qu’on gagne en vitesse pour de vrai.</div>`));
  });
}

/* --- Bien phraser : le mindset du soliste --- */
function openPhrasing(){
  markDay();
  openOverlay('Bien phraser', inner=>{
    inner.appendChild(el('div','theory',`
      <h3>Un solo, c’est une phrase — pas une gamme</h3>
      <p>Tu peux connaître toutes les notes et sonner ennuyeux. Ce qui fait un solo, c’est <b>comment</b> tu joues les notes. Les leviers, du plus payant au plus fin :</p>
      <h3>1. Le silence</h3>
      <p>Les débutants jouent trop. <b>Laisse respirer.</b> Une note tenue puis un blanc vaut mieux qu’une rafale : le silence met en valeur ce qui suit.</p>
      <h3>2. L’appel-réponse</h3>
      <p>Joue une petite phrase (l’<b>appel</b>), laisse un trou, réponds par une variation (la <b>réponse</b>). C’est une conversation — le blues n’est QUE ça.</p>
      <h3>3. Le motif</h3>
      <p>Prends 3-4 notes avec une <b>rythmique</b> reconnaissable et <b>répète-la</b> en la déplaçant sur les accords. Un motif répété, l’oreille l’attrape.</p>
      <h3>4. La tension et la résolution</h3>
      <p>Les notes hors-accord créent de la <b>tension</b> ; les notes de l’accord (surtout la <b>tierce</b>) la <b>résolvent</b>. Finis tes phrases sur une note d’accord et ça sonne « juste » ; reste sur une tension et ça garde du suspens.</p>
      <h3>5. L’expression : bends & vibrato</h3>
      <p>C’est ta <b>voix</b>. Un bend <b>juste</b> (bien dans le ton), un vibrato régulier au bout de la note : voilà ce qui sépare un humain d’un logiciel. Travaille-les <b>lentement</b>, à la justesse.</p>
      <h3>Comment t’entraîner</h3>
      <ul>
        <li>Mets un <b>backing track</b> (cherche « backing track blues La » ou « Am jam »).</li>
        <li>Impose-toi <b>une seule position</b> et <b>5 notes max</b> pendant 2 minutes.</li>
        <li>Vise la <b>tierce</b> de chaque accord (onglet « Le blues en 12 mesures »).</li>
        <li>Vole <b>1 lick</b>, joue-le, puis change UNE chose (le rythme, la dernière note).</li>
      </ul>
      <div class="tip">La règle d’or : <b>moins de notes, mieux placées, bien exprimées.</b> Toujours.</div>`));
  });
}

/* ================================================================
   LE MINI-COURS DU JOUR — une technique/jour, de la base au shred
   ================================================================ */
const MINI=[
 {n:'Le hammer-on', ic:'🔨', niv:'base',
  notation:'Écrit «&nbsp;<b>5h7</b>&nbsp;» : joue la case 5, puis <b>FRAPPE</b> la case 7 avec un autre doigt <b>sans repincer</b>. Le son de la 7 vient uniquement du choc du doigt.',
  interet:'Lier deux notes sans réattaquer → un son fluide, «&nbsp;coulé&nbsp;», et de la vitesse gratuite (une attaque pour deux notes). La base du legato et du solo rapide.',
  bien:'Frappe <b>fort et net</b>, juste derrière la barrette, avec le bout du doigt. Garde le doigt de la 5 bien en place. Les autres doigts déjà en l’air, prêts à tomber.',
  mistake:'Frapper trop mou ou trop loin de la frette → la note «&nbsp;meurt&nbsp;». Frappe sec et près de la barrette.',
  exos:[
   {n:'1 · Le geste', seq:[{s:3,f:5},{s:3,f:7,t:'h'},{s:3,f:5},{s:3,f:7,t:'h'}], how:'Corde de Sol. Une seule attaque (un doigt) sur le 5, le 7 sonne par le hammer. Cherche 2 notes de MÊME volume.'},
   {n:'2 · Dans la penta', seq:[{s:5,f:5},{s:5,f:8,t:'h'},{s:4,f:5},{s:4,f:8,t:'h'},{s:3,f:5},{s:3,f:7,t:'h'}], how:'Monte la penta de La : sur chaque corde, attaque la basse, frappe la haute.'},
   {n:'3 · Double hammer', seq:[{s:3,f:5},{s:3,f:7,t:'h'},{s:3,f:9,t:'h'}], how:'5h7h9 : deux hammers d’affilée sur UNE attaque. Le 9 doit sonner aussi fort que le 5.'}]},
 {n:'Le pull-off', ic:'👇', niv:'base',
  notation:'Écrit «&nbsp;<b>7p5</b>&nbsp;» : joue la 7, puis <b>TIRE</b> le doigt vers le bas (comme si tu pinçais la corde) pour faire sonner la 5. Le doigt de la 5 est posé d’avance.',
  interet:'Le miroir du hammer, pour <b>descendre</b> en fluide. Hammer + pull = legato = phrases rapides sans fatiguer la main droite.',
  bien:'Ne <b>lève</b> pas le doigt tout droit : <b>tire-le vers le sol</b> pour «&nbsp;lancer&nbsp;» la corde. Pose la note d’arrivée AVANT de tirer.',
  mistake:'Lever le doigt sans l’accrocher vers le bas → aucun son. Il faut ce petit pincement.',
  exos:[
   {n:'1 · Le geste', seq:[{s:3,f:7},{s:3,f:5,t:'p'},{s:3,f:7},{s:3,f:5,t:'p'}], how:'Doigt de la 5 posé d’avance. Attaque le 7, tire vers le bas → le 5 sonne seul.'},
   {n:'2 · Descendre la penta', seq:[{s:2,f:8},{s:2,f:5,t:'p'},{s:3,f:7},{s:3,f:5,t:'p'},{s:4,f:7},{s:4,f:5,t:'p'}], how:'La penta de La qui redescend, tout en pull-off. Une attaque par corde.'},
   {n:'3 · La cascade', seq:[{s:3,f:9},{s:3,f:7,t:'p'},{s:3,f:5,t:'p'}], how:'9p7p5 : double pull sur une attaque. Le son «&nbsp;cascade&nbsp;» du blues-rock.'}]},
 {n:'Le slide (le glissé)', ic:'🎢', niv:'base',
  notation:'Écrit «&nbsp;<b>5/7</b>&nbsp;» : joue la 5 et <b>GLISSE</b> le doigt jusqu’à la 7 sans relâcher la pression. Une seule attaque.',
  interet:'Relie des notes et surtout des <b>positions</b> avec du liant. C’est comme ça qu’on voyage sur le manche en solo sans «&nbsp;couper&nbsp;».',
  bien:'Garde la pression <b>constante</b> pendant le glissé, vise la case d’arrivée. Pour relier deux boîtes : glisse sur une note commune.',
  mistake:'Relâcher la pression en route → le son se coupe. Reste appuyé du départ à l’arrivée.',
  exos:[
   {n:'1 · Le geste', seq:[{s:2,f:5},{s:2,f:7,t:'/'}], how:'Attaque le 5, glisse jusqu’au 7. Le 7 doit rester net après le glissé.'},
   {n:'2 · Au milieu d’une phrase', seq:[{s:5,f:5},{s:3,f:5},{s:3,f:7,t:'/'},{s:2,f:5}], how:'Un slide en plein milieu change la couleur et lie la phrase.'},
   {n:'3 · Relier 2 positions', seq:[{s:0,f:5},{s:0,f:8,t:'/'},{s:0,f:12}], how:'Sur la corde de Mi grave, glisse pour monter de boîte en boîte : le secret pour couvrir tout le manche.'}]},
 {n:'Le palm mute (l’étouffé)', ic:'✋', niv:'base',
  notation:'Noté «&nbsp;<b>P.M.</b>&nbsp;» : pose le tranchant de la main droite (côté auriculaire) sur les cordes tout <b>près du chevalet</b>. Le son devient sourd, percussif : «&nbsp;tchak&nbsp;».',
  interet:'Le moteur du rock et du metal : contrôle, groove, agressivité maîtrisée. Sans lui, la disto devient une bouillie.',
  bien:'Le tranchant JUSTE sur le chevalet (pas vers le manche, sinon tout meurt). Ajuste de quelques millimètres jusqu’au «&nbsp;tchak&nbsp;» qui garde une hauteur.',
  mistake:'Main trop vers le manche → notes complètement mortes. Trop en arrière → aucun étouffement. Le point est précis.',
  exos:[
   {n:'1 · Le chug', seq:[{s:0,f:0},{s:0,f:0},{s:0,f:0},{s:0,f:0}], how:'Mi grave à vide, attaque au <b>pouce</b>, palm mute, tempo régulier. Cherche le «&nbsp;tchak-tchak&nbsp;» qui garde une note.'},
   {n:'2 · Le gallop', seq:[{s:0,f:0},{s:0,f:0},{s:0,f:0},{s:0,f:3},{s:0,f:0},{s:0,f:0},{s:0,f:0},{s:0,f:5}], how:'«&nbsp;Da-da-dum&nbsp;» au <b>pouce</b> : trois Mi serrés palm-mutés, ponctués d’une note. Le moteur du metal.'}]},
 {n:'Le bend (le tiré)', ic:'🎯', niv:'inter',
  notation:'Écrit «&nbsp;<b>7b</b>&nbsp;» : joue la 7 et <b>POUSSE</b> la corde pour monter la hauteur. Un «&nbsp;bend d’un ton&nbsp;» = tu montes jusqu’au son de <b>2 cases</b> plus haut.',
  interet:'C’est la <b>voix</b> de la guitare : ça pleure, ça chante. Un bend juste te fait sonner humain. Le cœur du blues et du rock.',
  bien:'Pousse avec <b>2-3 doigts ensemble</b>, tourne le poignet comme une clé, pouce par-dessus le manche. <b>Vérifie la justesse</b> : le bend doit atteindre EXACTEMENT la note cible.',
  mistake:'Bender «&nbsp;à peu près&nbsp;». Un bend faux sonne pire qu’une fausse note. Compare toujours à la vraie note.',
  exos:[
   {n:'1 · Le bend juste (d’un ton)', seq:[{s:3,f:9},{s:3,f:7,t:'b'}], how:'Joue d’abord la case 9 (ta cible). Puis bende la case 7 d’un TON entier pour retrouver EXACTEMENT ce son. Ton oreille juge.'},
   {n:'2 · Bend + relâche', seq:[{s:3,f:7,t:'b'},{s:3,f:7},{s:3,f:5}], how:'Bende, tiens, puis relâche jusqu’à la note d’origine, redescends sur le 5. Contrôle toute la descente.'},
   {n:'3 · Le B.B. King', seq:[{s:4,f:8,t:'b'},{s:5,f:5,t:'~'}], how:'Bende le 8 (corde de Si) d’un ton, puis chante le La aigu avec un vibrato. Deux notes, toute l’émotion.'}]},
 {n:'Le vibrato', ic:'〰️', niv:'inter',
  notation:'Écrit «&nbsp;<b>7~</b>&nbsp;» : tiens la note et fais-la «&nbsp;onduler&nbsp;» en montant/descendant très légèrement et <b>régulièrement</b> la hauteur.',
  interet:'Ce qui sépare un humain d’un logiciel. Un beau vibrato transforme UNE note tenue en un moment de musique. La signature de chaque grand guitariste.',
  bien:'Comme un mini-bend répété, <b>régulier comme un battement</b>. Vient du <b>poignet</b>, pas des doigts. Commence LENT et large, garde le tempo constant.',
  mistake:'Le vibrato «&nbsp;nerveux&nbsp;», rapide et irrégulier (le vibrato de la peur). Lent et régulier d’abord.',
  exos:[
   {n:'1 · La note qui chante', seq:[{s:2,f:8,t:'~'}], how:'Tiens le Sol (case 8 corde de Si) et fais-le onduler, lent et régulier. Compte : ondule, 2, 3, 4.'},
   {n:'2 · Finis tes phrases dessus', seq:[{s:3,f:7},{s:3,f:5},{s:5,f:5,t:'~'}], how:'Une petite phrase, puis pose-toi sur le La (mi aigu case 5) avec vibrato : c’est là que ça sonne «&nbsp;fini&nbsp;», posé.'}]},
 {n:'L’alternance des doigts (i-m)', ic:'↔️', niv:'inter',
  notation:'Aux doigts : alterne <b>index (i)</b> et <b>majeur (m)</b>, <b>i-m-i-m</b>, sans jamais jouer deux notes de suite avec le même doigt.',
  interet:'La base de TOUTE la vitesse à la main droite quand on joue aux doigts. Deux doigts qui se relaient → tu enchaînes vite sans fatiguer.',
  bien:'Attaque <b>chair + ongle</b>, doigts détendus et PRÈS des cordes, pouce posé sur une corde grave comme point d’appui. L’alternance i-m ne s’arrête jamais.',
  mistake:'Répéter le même doigt (i-i) ou repartir toujours de l’index après une pause. Impose-toi <b>i-m-i-m strict</b>.',
  exos:[
   {n:'1 · Régularité, 1 corde', seq:[{s:0,f:5},{s:0,f:6},{s:0,f:7},{s:0,f:8},{s:0,f:8},{s:0,f:7},{s:0,f:6},{s:0,f:5}], how:'i-m-i-m strict (index puis majeur). Vise le métronome, pas la vitesse. Chaque note IDENTIQUE en volume.'},
   {n:'2 · Le changement de corde', seq:[{s:1,f:5},{s:1,f:7},{s:0,f:5},{s:0,f:7}], how:'Garder l’alternance i-m en changeant de corde : c’est LÀ que ça coince. Très lent.'}]},
 {n:'Les cordes sautées (string skipping)', ic:'⛷️', niv:'inter',
  notation:'Tu <b>sautes</b> une corde (ou plus) entre deux notes. La main droite vise loin, sans toucher la corde du milieu.',
  interet:'Ouvre des sons plus larges (arpèges, grands intervalles) que la gamme note-à-note. Et une précision main droite qui tient à toute vitesse.',
  bien:'<b>Étouffe</b> la corde sautée avec la paume/les doigts. Vise net, lent d’abord — l’oreille entend chaque accroc.',
  exos:[
   {n:'1 · Saute une corde', seq:[{s:0,f:5},{s:2,f:5},{s:1,f:5},{s:3,f:5}], how:'Mi grave → Ré (saut du La), puis La → Sol. Vise juste, sans frôler la corde du milieu.'},
   {n:'2 · Arpège large', seq:[{s:5,f:5},{s:3,f:5},{s:5,f:8},{s:3,f:7}], how:'Des sauts pour un son «&nbsp;qui plane&nbsp;», plus ouvert qu’une gamme.'}]},
 {n:'Le trille', ic:'🐎', niv:'inter',
  notation:'Écrit «&nbsp;<b>5h7p5h7p…</b>&nbsp;» très rapide : un hammer/pull-off <b>en boucle</b> entre deux notes, le plus vite possible.',
  interet:'Une texture «&nbsp;qui vibre&nbsp;», un ornement — et un excellent muscleur de main gauche (endurance + force des doigts faibles).',
  bien:'Une seule attaque, puis h/p en boucle <b>régulière</b>. Travaille surtout les paires faibles (annulaire-auriculaire).',
  exos:[
   {n:'1 · Index ↔ annulaire', seq:[{s:3,f:5},{s:3,f:7,t:'h'},{s:3,f:5,t:'p'},{s:3,f:7,t:'h'},{s:3,f:5,t:'p'},{s:3,f:7,t:'h'}], how:'5h7p5… régulier, une attaque. Monte la vitesse peu à peu.'},
   {n:'2 · Les doigts faibles', seq:[{s:3,f:7},{s:3,f:9,t:'h'},{s:3,f:7,t:'p'},{s:3,f:9,t:'h'},{s:3,f:7,t:'p'}], how:'7↔9 avec annulaire↔auriculaire. Dur, indispensable. 30 s suffisent à fatiguer — c’est bon signe.'}]},
 {n:'Le legato (tout lié)', ic:'🌊', niv:'avancé',
  notation:'Un enchaînement de hammers et pull-offs : <b>une seule attaque</b> du doigt pour toute une série de notes.',
  interet:'Le son fluide, sans attaque, des solos rapides (Satriani, Vai en legato). Économise la main droite → tu joues LONGTEMPS et VITE.',
  bien:'Toute la force vient de la <b>main gauche</b> : frappe/tire fort et net. Cherche l’<b>égalité de volume</b> entre la note attaquée et les autres.',
  exos:[
   {n:'1 · Le rouleau', seq:[{s:3,f:5},{s:3,f:7,t:'h'},{s:3,f:5,t:'p'},{s:3,f:7,t:'h'},{s:3,f:9,t:'h'},{s:3,f:5,t:'p'}], how:'5h7p5h7h9p5 sur UNE attaque. Le graal : tout au même volume.'},
   {n:'2 · Legato penta', seq:[{s:4,f:5},{s:4,f:8,t:'h'},{s:3,f:5},{s:3,f:7,t:'h'},{s:2,f:5},{s:2,f:8,t:'h'}], how:'Monte la penta en legato, une attaque par corde. Fluide comme de l’eau.'}]},
 {n:'Les séquences (jouer en motifs)', ic:'🔢', niv:'avancé',
  notation:'Au lieu de monter la gamme note à note (1-2-3-4-5…), tu la joues par petits <b>groupes qui se décalent</b> : «&nbsp;1-2-3, 2-3-4, 3-4-5…&nbsp;» ou par 4.',
  interet:'C’EST le secret du son «&nbsp;rapide et pro&nbsp;». Les traits véloces sont presque toujours des séquences, pas des notes au hasard. L’oreille adore le motif qui se répète en montant.',
  bien:'Choisis UN motif, garde-le <b>identique</b> en montant la gamme. Lentement au métronome — la vitesse vient parce que la main répète le MÊME geste.',
  exos:[
   {n:'1 · La penta par 3', seq:[{s:5,f:5},{s:5,f:8},{s:4,f:5},{s:5,f:8},{s:4,f:5},{s:4,f:7}], how:'Groupes de 3 qui se chevauchent, penta de La boîte 1. Répète le geste en descendant les cordes.'},
   {n:'2 · La mitraillette', seq:[{s:5,f:8},{s:5,f:5},{s:4,f:8},{s:5,f:5},{s:4,f:8},{s:4,f:5},{s:3,f:7},{s:4,f:5}], how:'Le motif «&nbsp;4 notes qui reculent&nbsp;» : rapide à l’oreille, régulier sous les doigts.'}]},
 {n:'Le sweep picking (le balayé)', ic:'🧹', niv:'shred',
  notation:'Aux doigts : tu «&nbsp;racles&nbsp;» plusieurs cordes d’un seul geste continu — le <b>pouce</b> vers les aigus, l’<b>index</b> qui remonte vers les graves — <b>une note par corde</b>, main gauche qui roule. (Un onglet de pouce rend ça bien plus net.)',
  interet:'Le son «&nbsp;cascade&nbsp;» ultra-rapide des arpèges (Malmsteen, metal néo-classique). Beaucoup de notes pour très peu de mouvement.',
  bien:'Ce n’est PAS un gratté rapide : c’est <b>un seul geste lent et fluide</b>. La main gauche «&nbsp;déroule&nbsp;» (un doigt se lève dès que le suivant tombe) pour ne jamais laisser deux notes sonner ensemble. L’étouffement = 90 % du travail.',
  mistake:'Laisser les notes sonner comme un accord plaqué. Chaque note doit s’arrêter quand la suivante arrive.',
  exos:[
   {n:'1 · Balayage 3 cordes (La mineur)', seq:[{s:4,f:5},{s:3,f:5},{s:2,f:7}], how:'Mi-Do-La (arpège de La min) d’un seul geste, l’<b>index</b> qui racle des aigus vers les graves. TRÈS lent, note par note d’abord, chaque note étouffée avant la suivante.'},
   {n:'2 · Aller et retour', seq:[{s:2,f:7},{s:3,f:5},{s:4,f:5},{s:3,f:5},{s:2,f:7}], how:'Descends au <b>pouce</b> (vers les aigus) puis remonte à l’<b>index</b>. Le mouvement doit rester continu, pas saccadé.'}]},
 {n:'Le tapping', ic:'👆', niv:'shred',
  notation:'Écrit «&nbsp;<b>12t</b>&nbsp;» : tu <b>frappes</b> la case avec un doigt de la main <b>droite</b> (comme un hammer), puis tu tires — et tu enchaînes avec la main gauche.',
  interet:'Le son «&nbsp;impossible&nbsp;» de EVH («&nbsp;Eruption&nbsp;»), du metal : des écarts énormes et une vitesse folle sans effort de la main gauche.',
  bien:'Tape net et <b>tire légèrement vers le bas</b> en sortant (le tap fait AUSSI un pull-off) pour lancer la corde suivante. Étouffe les cordes inutiles, sinon ça sonne sale.',
  mistake:'Taper sans tirer en sortant → la note de la main gauche ne sonne pas.',
  exos:[
   {n:'1 · Le motif de base', seq:[{s:3,f:12,t:'t'},{s:3,f:5,t:'p'},{s:3,f:9,t:'h'}], how:'Tape la case 12 (main droite), tire vers le 5, frappe le 9 (main gauche). En boucle : 12-5-9, 12-5-9.'},
   {n:'2 · Triolets tapés', seq:[{s:2,f:12,t:'t'},{s:2,f:5,t:'p'},{s:2,f:8,t:'h'},{s:2,f:12,t:'t'},{s:2,f:5,t:'p'},{s:2,f:8,t:'h'}], how:'Sur la corde de Si, en triolets réguliers : c’est déjà un plan «&nbsp;shred&nbsp;». Lentement !'}]},
 {n:'Le pinch harmonic (l’harmonique pincée)', ic:'🐝', niv:'shred',
  notation:'Noté «&nbsp;<b>P.H.</b>&nbsp;» : en attaquant (souvent une note bendée, en disto), tu laisses le <b>côté du pouce / l’ongle</b> effleurer la corde juste après l’attaque → un «&nbsp;squeal&nbsp;», un cri aigu.',
  interet:'Le «&nbsp;couac&nbsp;» criard de Zakk Wylde, Dimebag, du hard rock et du metal. De l’attitude pure sur une seule note.',
  bien:'Aux doigts, c’est le <b>pouce</b> qui pince : attaque avec la chair, puis laisse l’<b>ongle / le côté du pouce</b> toucher la corde IMMÉDIATEMENT après. Un <b>onglet de pouce</b> (thumbpick) aide énormément. Le point «&nbsp;magique&nbsp;» change selon la case — cherche-le. Bend + vibrato derrière = le cri complet.',
  mistake:'Sans <b>gain/disto</b>, ça ne sort quasiment pas. Il faut du gain et le bon point d’attaque.',
  exos:[
   {n:'1 · Trouve le squeal', seq:[{s:2,f:7,t:'b'}], how:'Sur le La (corde de Ré, case 7), attaque en pinçant du pouce, puis bende. Déplace ton point d’attaque de 1-2 mm jusqu’à ce que ça CRIE.'}]},
];
const MINI_LEGEND='Légende — main gauche : h = hammer, p = pull-off, b = bend (d’un ton), / = slide, ~ = vibrato, t = tap. Main droite (jeu aux doigts, sans médiator) : pouce · i = index · m = majeur.';
function miniToday(){ return MINI[dayNum()%MINI.length]; }
function nivPill(niv){ return `<span style="display:inline-block;font-size:10px;font-weight:800;color:var(--acc);border:1px solid var(--acc);border-radius:10px;padding:2px 8px;margin-bottom:8px">${niv}</span>`; }
function exoCard(e, idp){ const c=el('div','card'); c.style.background='var(--bg3)';
  c.innerHTML=`<b style="font-size:14px">${e.n}</b>`;
  const pre=el('pre','tab'); pre.textContent=renderTab(e.seq); c.appendChild(pre);
  if(e.how){ const h=el('p','lead','🖐 '+e.how); h.style.margin='2px 0 0'; c.appendChild(h); }
  const b=el('button','btn ghost','🔊 Jouer'); b.onclick=()=>playLick(e.seq); c.appendChild(b);
  c.appendChild(bpmLog((idp||'exo')+'·'+e.n, 60));
  return c;
}
function openMiniLesson(L){ ac(); markDay();
  openOverlay(L.ic+' '+L.n, inner=>{
    inner.appendChild(el('div','theory',`${nivPill(L.niv)}
      <h3>La notation</h3><p>${L.notation}</p>
      <h3>À quoi ça sert</h3><p>${L.interet}</p>
      <h3>Comment bien le faire</h3><p>${L.bien}</p>
      ${L.mistake?`<div class="tip">⚠️ <b>Erreur classique :</b> ${L.mistake}</div>`:''}`));
    inner.appendChild(el('h1','page','Les exos'));
    inner.appendChild(el('p','lead','Du plus simple au plus dur. Lentement, au métronome, chaque note nette — la vitesse suit toute seule.'));
    L.exos.forEach(e=>inner.appendChild(exoCard(e, L.n)));
    inner.appendChild(el('div','theory',`<div class="tip">${MINI_LEGEND}</div>`));
  });
}
function openMiniCourse(){ ac(); markDay();
  const T=miniToday();
  openOverlay('Le mini-cours du jour', inner=>{
    const c=el('div','card'); c.style.borderColor='var(--acc)';
    c.innerHTML=`<b>🎓 Aujourd’hui</b> <span style="color:var(--acc);font-size:12px;font-weight:700">· ${T.ic} ${T.n}</span><p class="lead" style="margin:6px 0 10px">${T.interet}</p>`;
    const b=el('button','btn',`Ouvrir : ${T.n}`); b.onclick=()=>openMiniLesson(T); c.appendChild(b); inner.appendChild(c);
    inner.appendChild(el('p','lead','Une technique par jour, de la base jusqu’au shred : notation, intérêt, comment bien la faire, et 2-3 exos. Fais-en une par jour → tu les as toutes en deux semaines.'));
    inner.appendChild(el('h1','page','Toutes les techniques'));
    MINI.forEach(L=>{ const isT=L===T; const cc=el('div','catcard'); if(isT) cc.style.borderColor='var(--acc)';
      cc.innerHTML=`<div class="ico">${L.ic}</div><div class="t"><b>${L.n}${isT?' <span style="color:var(--acc)">· aujourd’hui</span>':''}</b><small>${L.niv} · ${L.exos.length} exos</small></div><div class="pc">›</div>`;
      cc.onclick=()=>openMiniLesson(L); inner.appendChild(cc); });
  });
}

/* ================================================================
   JOUER VITE — la méthode des pros + exos en progression
   ================================================================ */
const SPEED=[
 {n:'1 · Le métronome, ton juge', key:'régularité avant vitesse', seq:[{s:0,f:5},{s:0,f:6},{s:0,f:7},{s:0,f:8},{s:0,f:8},{s:0,f:7},{s:0,f:6},{s:0,f:5}], how:'Alternance i-m stricte sur une corde, au clic. Trouve le tempo où c’est PROPRE 3 fois de suite.', why:'La règle des pros : jamais plus vite que propre. +5 BPM seulement quand c’est net. Le log de BPM ci-dessous garde ton record — c’est ta vraie progression.'},
 {n:'2 · La rafale (burst)', key:'tromper la crispation', seq:[{s:5,f:5},{s:5,f:8},{s:4,f:5},{s:4,f:7}], how:'Joue ces 4 notes TRÈS vite d’un coup, puis stoppe et respire. Recommence. La vitesse par petites explosions.', why:'Ton cerveau apprend le geste rapide sans avoir le temps de se crisper. LE truc pour débloquer un plafond de vitesse.'},
 {n:'3 · La synchro des 2 mains', key:'le vrai plafond', seq:SPIDER, how:'L’araignée, très lentement : chaque note de la main gauche PILE avec le doigt qui attaque (i-m). Ne regarde pas ta main.', why:'Le mur de vitesse n’est ni la main droite ni la gauche : c’est leur SYNCHRO. C’est ça qu’on muscle ici.'},
 {n:'4 · La séquence (le son « rapide »)', key:'motifs qui se décalent', seq:[{s:5,f:8},{s:5,f:5},{s:4,f:8},{s:5,f:5},{s:4,f:8},{s:4,f:5},{s:3,f:7},{s:4,f:5}], how:'La mitraillette : un motif de 4 notes qui recule. Garde le MÊME geste en descendant les cordes.', why:'Les traits rapides = des séquences répétées, pas des notes au hasard. La main répète, donc elle accélère.'},
 {n:'5 · Le legato (vitesse sans réattaquer)', key:'la main gauche fait tout', seq:[{s:3,f:5},{s:3,f:7,t:'h'},{s:3,f:9,t:'h'},{s:3,f:7,t:'p'},{s:3,f:5,t:'p'},{s:3,f:7,t:'h'}], how:'Une seule attaque, tout le reste en hammer/pull. Cherche l’égalité de volume.', why:'Quand la main droite plafonne, le legato te donne de la vitesse «&nbsp;gratuite&nbsp;». Le son fluide du shred.'},
 {n:'6 · La gamme au tempo', key:'position 1, montée-descente', seq:[{s:0,f:5},{s:0,f:7},{s:0,f:8},{s:1,f:5},{s:1,f:7},{s:1,f:8}], how:'Monte/descends une position de gamme au métronome, propre, puis +5 BPM. (3 notes par corde = idéal pour la vitesse.)', why:'La gamme au tempo = la matière première de l’impro rapide. Position par cœur → doigts en pilote automatique.'},
];
function openSpeed(){ ac(); markDay();
  openOverlay('Jouer vite (la méthode des pros)', inner=>{
    inner.appendChild(el('div','theory',`
      <h3>La vérité sur la vitesse</h3>
      <p>Jouer vite, ce n’est pas de la FORCE : c’est du <b>relâchement</b> et de l’<b>économie de mouvement</b>. Les pros bougent MOINS que toi, pas plus fort.</p>
      <div class="formula">Vitesse = relâchement + petits mouvements + synchro des 2 mains</div>
      <h3>La méthode qui marche vraiment</h3>
      <ul>
        <li><b>Relâche</b> : épaule et avant-bras souples, doigts (droite ET gauche) détendus et PRÈS des cordes.</li>
        <li><b>Le métronome, toujours</b> : le tempo où c’est propre <b>3 fois de suite</b> → <b>+5 BPM</b> → note-le. Jamais plus vite que propre.</li>
        <li><b>Les rafales</b> : joue vite par salves de 4-6 notes, puis stoppe. Tu apprends le geste rapide sans te crisper.</li>
        <li><b>Le chunking</b> : découpe en groupes de 3-4 notes qui se chevauchent, pas note à note.</li>
      </ul>`));
    inner.appendChild(metronomeCard());
    inner.appendChild(el('p','lead','Les exos, dans l’ordre. Chacun = un métronome, un tempo propre, +5 BPM quand c’est net. Le bandeau 🥁 garde ton record.'));
    SPEED.forEach(L=>inner.appendChild(lickCard(L,true)));
    inner.appendChild(el('div','theory',`<div class="tip">Les déliateurs purs (l’araignée & co) sont dans <b>Technique &amp; déliateurs</b> (hub Improviser). Ici, on transforme la technique en <b>vitesse utile</b>.</div>`));
  });
}

/* ================================================================
   IMPROVISER VITE COMME UN PRO — progression
   ================================================================ */
const FASTIMPRO=[
 {n:'Étape 1 · 5 notes, sois musical', how:'Sur un backing La mineur (cherche «&nbsp;Am jam backing track&nbsp;»), UNE position, 5 notes max, 2 minutes. Silence, motifs, vibrato.', why:'Avant la vitesse : la MUSIQUE. Peu de notes, bien placées. Si tu n’es pas musical à 5 notes, tu ne le seras pas à 50. (cf. Bien phraser)'},
 {n:'Étape 2 · Le vocabulaire', how:'Apprends 3 licks PAR CŒUR (commence par le lick du jour) jusqu’à les jouer les yeux fermés, puis change-en UNE chose à chaque fois.', why:'Les pros enchaînent des licks CONNUS, pas des notes cherchées en direct. Ton stock de phrases = ta vitesse et ton aisance.'},
 {n:'Étape 3 · Les séquences au tempo', seq:[{s:5,f:5},{s:5,f:8},{s:4,f:5},{s:5,f:8},{s:4,f:5},{s:4,f:7}], how:'Joue la penta en motifs (par 3, par 4) sur le backing, de plus en plus vite au métronome.', why:'C’est ça qui SONNE rapide et pro : le motif qui monte, pas la note au hasard.'},
 {n:'Étape 4 · Vise la tierce au changement', how:'Sur chaque changement d’accord, atterris sur sa TIERCE. D’abord très lentement, puis au tempo.', why:'«&nbsp;Jouer les changements&nbsp;» : ton solo suit les accords au lieu de rester plat. (cf. La Boussole & Le blues en 12 mesures)'},
 {n:'Étape 5 · Relie les positions', seq:[{s:0,f:5},{s:0,f:8,t:'/'},{s:0,f:12}], how:'Glisse d’une boîte à la suivante pour balayer tout le manche sans t’arrêter. Monte en solo, redescends.', why:'Les solos qui «&nbsp;voyagent&nbsp;» = des positions reliées par slides et notes communes. (cf. La gamme majeure en positions)'},
 {n:'Étape 6 · Appel-réponse rapide', how:'Une RAFALE (l’appel), un blanc, une réponse plus calme. Alterne vite / lent, fort / doux.', why:'La vitesse n’a d’impact QUE par contraste avec le silence et les notes lentes. Une rafale non-stop lasse en 10 secondes.'},
 {n:'Étape 7 · Le solo d’une minute', how:'Sur un vamp La mineur : phrase lente → motif répété → UNE rafale rapide → résolution sur le La avec vibrato. Enregistre-toi et réécoute.', why:'Le vrai jeu : raconter une histoire (calme → tension → explosion → repos). C’est exactement ça, jouer comme un pro.'},
];
function fastCard(st){ const c=el('div','card');
  c.innerHTML=`<b>${st.n}</b>`;
  if(st.seq){ const pre=el('pre','tab'); pre.textContent=renderTab(st.seq); c.appendChild(pre); }
  const h=el('p','lead','🎯 '+st.how); h.style.margin='6px 0 0'; c.appendChild(h);
  const w=el('p','lead',st.why); w.style.margin='4px 0 0'; c.appendChild(w);
  if(st.seq){ const b=el('button','btn ghost','🔊 Jouer'); b.onclick=()=>playLick(st.seq); c.appendChild(b); }
  return c;
}
function openFastImpro(){ ac(); markDay();
  openOverlay('Improviser vite comme un pro', inner=>{
    inner.appendChild(el('div','theory',`
      <h3>Les pros n’improvisent pas «&nbsp;au hasard&nbsp;»</h3>
      <p>Le trait rapide qui te bluffe n’est pas de la magie : c’est un <b>vocabulaire</b> de licks et de séquences <b>connus par cœur</b>, posés sur les <b>bonnes notes</b>, avec du <b>phrasé</b>. On assemble des blocs qu’on maîtrise — on ne cherche pas les notes en direct.</p>
      <div class="formula">Impro rapide = vocabulaire + notes cibles + phrasé<br>(pas des doigts au hasard)</div>
      <p>La progression, étape par étape. Ne saute pas : chacune prépare la suivante.</p>`));
    FASTIMPRO.forEach(st=>inner.appendChild(fastCard(st)));
    inner.appendChild(el('div','theory',`<div class="tip">Tes outils pour ces étapes : <b>La Boussole</b> (tes notes à viser), <b>La gamme majeure en positions</b> (relier le manche), <b>Bien phraser</b> (le contraste). Reviens-y dès qu’une étape coince.</div>`));
  });
}

/* ================================================================
   ÉCRIRE UNE CHANSON — pensé rock dynamique (grunge / alt)
   ================================================================ */
function openSongwriting(){ ac(); markDay();
  openOverlay('Écrire une chanson', inner=>{
    inner.appendChild(el('div','theory',`
      <h3>Une chanson = des blocs simples + une émotion</h3>
      <p>Écrire une chanson, ce n’est pas être savant : c’est <b>assembler des blocs</b> et transmettre une <b>émotion</b>. Ton terrain — le rock dynamique (Nirvana, Audioslave, Deftones) — mise tout sur le <b>contraste</b> et la <b>sincérité</b>, pas sur la complexité. Cobain écrivait des tubes avec 4 accords.</p>
      <div class="formula">Intro (riff) · Couplet · Refrain · Couplet · Refrain · Pont · Refrain</div>
      <p>Ça, c’est le squelette de 90 % du rock. Le <b>refrain revient</b> : c’est le cœur, le moment qu’on retient.</p>`));

    inner.appendChild(el('div','theory',`
      <h3>1. Par où commencer : deux portes</h3>
      <ul>
        <li><b>Le riff</b> — la chanson naît d’une phrase de guitare (Nirvana, Deftones). Un riff qui te fait quelque chose ? C’est ta fondation, construis autour.</li>
        <li><b>La suite d’accords</b> — 4 accords qui tournent et posent une ambiance (façon « Like a Stone »). Le chant viendra dessus.</li>
      </ul>
      <p>Choisis-en <b>une</b>, l’autre suit. Le plus dur, c’est de commencer — pas de finir.</p>`));

    const c=el('div','card'); c.appendChild(el('b',null,'▶ Des suites d’accords à voler'));
    c.appendChild(el('p','lead','Écoute-les tourner (lecture auto), puis remplace-les par les tiennes.'));
    const b1=el('button','btn ghost','Mélodique (mineure) — Am · F · C · G'); b1.onclick=()=>openProgression({n:'Suite rock mélodique',ch:['Am','F','C','G'],tip:'Le mineur émouvant, mid-tempo (ambiance « Like a Stone »). Arpège-la au couplet, gratte-la fort au refrain.'});
    const b2=el('button','btn ghost','Grunge (tendue) — Em · C · G · D'); b2.onclick=()=>openProgression({n:'Suite grunge',ch:['Em','C','G','D'],tip:'Sombre et carrée. Couplet en accords tenus/clean, refrain en power chords saturés : le contraste fait tout.'});
    c.append(b1,b2); inner.appendChild(c);

    inner.appendChild(el('div','theory',`
      <h3>⭐ 2. Le contraste doux / fort — LA formule de ton style</h3>
      <p>C’est l’ADN de ta musique. <b>Couplet retenu</b> (son clean, arpèges ou palm mute léger, on laisse de la place) → <b>refrain qui EXPLOSE</b> (disto, power chords, plus haut, plus fort). C’est la formule Pixies → Nirvana, et le cœur de Deftones : la <b>beauté ET la violence</b> dans la même chanson.</p>
      <div class="tip">Le raccourci : garde souvent les <b>mêmes accords</b> au couplet et au refrain — change seulement l’<b>intensité</b> et la <b>texture</b> (clean → saturé, arpège → power chords). L’explosion se ressent sans changer de terrain.</div>
      <p>Pour le poids (Deftones, Nirvana « Heart-Shaped Box ») : accorde ta corde de Mi grave en <b>Ré (drop D)</b> — power chords à un doigt, son plus lourd.</p>`));

    inner.appendChild(el('div','theory',`
      <h3>3. Le refrain (le hook)</h3>
      <p>Le <b>sommet</b> : le plus mémorable, le plus fort émotionnellement. Rends-le plus <b>gros</b> (power chords, chant plus haut) et fais-y tomber ta <b>phrase-titre</b>. Test : si dans 3 jours tu ne fredonnes qu’<b>une</b> partie de ta chanson, ça doit être le refrain.</p>
      <h3>4. La mélodie de chant</h3>
      <p>Elle vit <b>au-dessus</b> des accords. Vise les <b>notes de l’accord</b> et la <b>pentatonique</b> de ta tonalité (→ La Boussole). <b>Laisse respirer</b> (des trous), et <b>répète</b> : une bonne mélodie se fredonne <b>sans les paroles</b>.</p>
      <h3>5. Les paroles</h3>
      <p>Pars d’une <b>émotion</b> ou d’une image concrète, pas d’un concept. Le <b>couplet raconte</b>, le <b>refrain assène</b> le cœur. N’explique pas tout : le flou évocateur (Cobain) laisse l’auditeur <b>projeter</b> sa propre histoire — c’est une force.</p>
      <h3>6. Tempo &amp; groove</h3>
      <p>Choisis l’énergie : <b>mid-tempo lourd</b> (Deftones, Soundgarden) ou <b>nerveux</b> (punk / Nirvana up-tempo). La batterie porte l’énergie ; ta guitare et elle doivent <b>respirer ensemble</b>.</p>`));

    inner.appendChild(el('div','theory',`
      <h3>🎯 Écris-en une cette semaine</h3>
      <ol style="margin:0 0 10px 18px;color:#d8cebf;line-height:1.7">
        <li>Choisis une <b>émotion</b> (ou un titre) + une <b>tonalité mineure</b> (Mi ou La mineur = idéal guitare). → <b>La Boussole</b>.</li>
        <li>Trouve <b>4 accords</b> qui tournent (ou <b>1 riff</b>) = ton <b>couplet</b>.</li>
        <li>Fais un <b>refrain qui contraste</b> (plus fort, power chords).</li>
        <li><b>Fredonne</b> une mélodie par-dessus (notes d’accord + penta).</li>
        <li>Trouve <b>une ligne</b> pour le refrain (la phrase-titre).</li>
        <li><b>Arrange</b> : intro (riff) – couplet – refrain – couplet – refrain – pont – refrain.</li>
        <li><b>Enregistre-la</b> au téléphone. <b>Fini vaut mieux que parfait.</b></li>
      </ol>
      <div class="tip">Tes outils : <b>La Boussole</b> (ta tonalité + tes notes), <b>les positions</b> (pour un riff), <b>les power chords</b> (le mur du refrain), <b>Bien phraser</b> (la mélodie).</div>`));
  });
}

/* ================================================================
   MÉTRONOME (WebAudio) + LOG DE BPM par exercice
   ================================================================ */
const metro={on:false,bpm:90,beats:4,cur:0,next:0,timer:null,onBeat:null};
function metroClick(time,accent){ const ctx=ac(), o=ctx.createOscillator(), g=ctx.createGain();
  o.frequency.value=accent?1600:1000; o.type='square';
  g.gain.setValueAtTime(0.0001,time); g.gain.exponentialRampToValueAtTime(accent?.6:.4,time+0.001); g.gain.exponentialRampToValueAtTime(0.0001,time+0.05);
  o.connect(g); g.connect(ctx.destination); o.start(time); o.stop(time+0.06); }
function metroSchedule(){ const ctx=ac(); while(metro.next<ctx.currentTime+0.12){ const beat=metro.cur%metro.beats;
  metroClick(metro.next,beat===0); const dt=Math.max(0,(metro.next-ctx.currentTime)*1000);
  setTimeout(()=>{ if(metro.on&&metro.onBeat)metro.onBeat(beat); },dt);
  metro.cur++; metro.next+=60/metro.bpm; } }
function metroStart(){ if(metro.on)return; ac(); metro.on=true; metro.cur=0; metro.next=ac().currentTime+0.06; metro.timer=setInterval(metroSchedule,25); }
function metroStop(){ metro.on=false; if(metro.timer){clearInterval(metro.timer); metro.timer=null;} }
function metroSetBpm(b){ metro.bpm=Math.max(30,Math.min(300,Math.round(b))); }
function metronomeCard(){
  const c=el('div','card'); c.innerHTML='<b>🥁 Métronome</b>';
  const bpmN=el('div'); bpmN.style.cssText='font-size:46px;font-weight:900;text-align:center;font-variant-numeric:tabular-nums;margin:6px 0 0';
  const sub=el('div'); sub.style.cssText='text-align:center;color:var(--dim);font-size:12px;font-weight:700;margin-bottom:6px'; sub.textContent='BPM';
  const dots=el('div'); dots.style.cssText='display:flex;gap:10px;justify-content:center;margin:6px 0 12px';
  c.append(bpmN,sub,dots);
  let dotEls=[];
  function buildDots(){ dots.innerHTML=''; dotEls=[]; for(let i=0;i<metro.beats;i++){ const d=el('div'); d.style.cssText='width:16px;height:16px;border-radius:50%;background:var(--bg3);border:1px solid var(--line);transition:background .04s'; dots.appendChild(d); dotEls.push(d);} }
  const slider=el('input'); slider.type='range'; slider.min='40'; slider.max='240'; slider.step='1'; slider.value=metro.bpm; slider.style.cssText='width:100%;margin:2px 0 12px;accent-color:var(--acc)';
  const rowT=el('div','toolrow'); rowT.style.justifyContent='center';
  const m5=el('div','tag','−5'), m1=el('div','tag','−1'), p1=el('div','tag','+1'), p5=el('div','tag','+5'); rowT.append(m5,m1,p1,p5);
  const bRow=el('div','row3'); const startB=el('button','btn','▶ Démarrer'), tapB=el('button','btn ghost','👆 Tap'), beatB=el('button','btn ghost',metro.beats+'/4'); bRow.append(startB,tapB,beatB);
  c.append(slider,rowT,bRow);
  function paint(){ bpmN.textContent=metro.bpm; slider.value=metro.bpm; }
  function setB(b){ metroSetBpm(b); paint(); }
  m5.onclick=()=>setB(metro.bpm-5); m1.onclick=()=>setB(metro.bpm-1); p1.onclick=()=>setB(metro.bpm+1); p5.onclick=()=>setB(metro.bpm+5);
  slider.oninput=()=>setB(+slider.value);
  metro.onBeat=(i)=>{ dotEls.forEach((d,k)=>{ d.style.background = k===i?(i===0?'var(--bad)':'var(--acc)'):'var(--bg3)'; }); };
  startB.onclick=()=>{ if(metro.on){ metroStop(); startB.textContent='▶ Démarrer'; dotEls.forEach(d=>d.style.background='var(--bg3)'); } else { buildDots(); metro.onBeat=(i)=>{ dotEls.forEach((d,k)=>{ d.style.background=k===i?(i===0?'var(--bad)':'var(--acc)'):'var(--bg3)'; }); }; metroStart(); startB.textContent='⏹ Stop'; } };
  let taps=[]; tapB.onclick=()=>{ const now=performance.now(); if(taps.length&&now-taps[taps.length-1]>2500) taps=[]; taps.push(now); if(taps.length>=2){ const iv=(taps[taps.length-1]-taps[0])/(taps.length-1); setB(60000/iv); } if(taps.length>6) taps.shift(); };
  beatB.onclick=()=>{ metro.beats=metro.beats===4?3:metro.beats===3?2:metro.beats===2?6:4; beatB.textContent=metro.beats+'/4'; buildDots(); };
  buildDots(); paint(); return c;
}
function openMetronome(){ ac(); markDay(); openOverlay('Métronome', inner=>{
  inner.appendChild(el('p','lead','Le juge de toute la technique. Le protocole des pros : trouve le tempo où c’est PROPRE 3 fois de suite, monte de +5, recommence.'));
  inner.appendChild(metronomeCard());
  inner.appendChild(el('div','theory',`<div class="tip">Sur chaque exo (mini-cours, technique, vitesse), le bandeau <b>🥁 log BPM</b> garde ton record. C’est ton vrai chiffre de progression — pas «&nbsp;je crois que je vais plus vite&nbsp;».</div>`));
}); }
function bpmLog(id, base){ base=base||70;
  const wrap=el('div'); wrap.style.cssText='background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:9px 11px;margin-top:8px';
  let cur=(S.bpm&&S.bpm[id])||base, live=false;
  const r1=el('div'); r1.style.cssText='display:flex;align-items:center;gap:7px;flex-wrap:wrap';
  const pulse=el('div'); pulse.style.cssText='width:13px;height:13px;border-radius:50%;background:var(--bg3);border:1px solid var(--line);flex-shrink:0;transition:background .04s';
  const bpmN=el('div'); bpmN.style.cssText='font-weight:800;font-variant-numeric:tabular-nums;font-size:15px;min-width:66px';
  const minus=el('div','tag','−5'), plus=el('div','tag','+5'), playB=el('div','tag on','▶ métro'), okb=el('div','tag','✓ propre');
  r1.append(pulse,bpmN,minus,plus,playB,okb); wrap.appendChild(r1);
  const rec=el('div'); rec.style.cssText='font-size:11px;color:var(--dim);font-weight:700;margin-top:6px'; wrap.appendChild(rec);
  function paint(){ bpmN.innerHTML='🥁 '+cur; const r=S.bpm&&S.bpm[id]; rec.innerHTML=r?`Record : <b style="color:var(--acc)">${r} BPM</b> — monte quand c’est propre 3× de suite.`:'Lance le métronome, joue dessus, puis « ✓ propre » à ton tempo net.'; }
  function stop(){ live=false; playB.textContent='▶ métro'; playB.classList.add('on'); pulse.style.background='var(--bg3)'; }
  minus.onclick=()=>{ cur=Math.max(30,cur-5); if(live)metroSetBpm(cur); paint(); };
  plus.onclick=()=>{ cur=Math.min(300,cur+5); if(live)metroSetBpm(cur); paint(); };
  playB.onclick=()=>{ if(live){ metroStop(); stop(); }
    else { metroStop(); live=true; playB.textContent='⏹ stop'; playB.classList.remove('on');
      metro.beats=4; metro.onBeat=(i)=>{ pulse.style.background=i===0?'var(--bad)':'var(--acc)'; setTimeout(()=>{ pulse.style.background='var(--bg3)'; },95); };
      metroSetBpm(cur); metroStart(); } };
  okb.onclick=()=>{ if(!S.bpm)S.bpm={}; if(!S.bpmLog)S.bpmLog={};
    const prev=S.bpm[id]||0;
    /* on garde TOUT, daté : c'est la courbe qui parle, pas le record isolé */
    const L=S.bpmLog[id]||(S.bpmLog[id]=[]); L.push([today(),cur]); if(L.length>60) L.splice(0,L.length-60);
    if(cur>prev){ S.bpm[id]=cur; S.xp+=3; save(); toast('🏆 '+cur+' BPM — nouveau record !'); }
    else { save(); toast('Noté à '+cur+' BPM (record : '+prev+')'); }
    paint(); };
  paint(); return wrap;
}

function renderCartes(){
  const m=document.getElementById('main'); m.innerHTML='';
  m.appendChild(el('h1','page','Accords & cartes'));
  m.appendChild(el('p','lead','Deux jeux de cartes en répétition espacée — les <b>notes</b> des triades et les <b>formes</b> d’accords — plus un module pour dompter les power chords.'));

  /* ---- Deck 1 : triades (leurs notes) ---- */
  { const td=tDue(), tk=tKnown();
    const c=el('div','card');
    c.innerHTML=`<b>🎼 Triades — connais leurs notes</b><p class="lead" style="margin:6px 0 8px">«&nbsp;A = A · C♯ · E&nbsp;». On te montre un accord, tu dis ses 3 notes de tête, puis tu t’auto-évalues. Su → revient plus tard ; raté → revient vite.</p>`;
    c.appendChild(el('div','statgrid',`<div class="stat"><b>${tk}/${TRIADS.length}</b><small>triades sues</small></div><div class="stat"><b>${td.length}</b><small>à réviser</small></div><div class="stat"><b>${tBudget()}</b><small>nouvelles auj.</small></div>`));
    const b=el('button','btn','▶ Réviser les triades'); b.onclick=()=>reviewTriads(td.concat(tNew().slice(0,tBudget()))); c.appendChild(b);
    const row=el('div','row3'); const bm=el('button','btn ghost','☀️ Majeures'),bn=el('button','btn ghost','🌑 Mineures'),ba=el('button','btn ghost','🎲 Tout');
    bm.onclick=()=>reviewTriads(TRIADS.filter(x=>x.q==='maj').map(x=>x.n)); bn.onclick=()=>reviewTriads(TRIADS.filter(x=>x.q==='min').map(x=>x.n)); ba.onclick=()=>reviewTriads(TRIADS.map(x=>x.n));
    row.append(bm,bn,ba); c.appendChild(row); m.appendChild(c); }

  /* ---- Module power chords ---- */
  { const c=el('div','card'); c.innerHTML='<b>⚡ Maîtriser les power chords</b><p class="lead" style="margin:6px 0 8px">La forme qui se déplace partout, le palm mute, et surtout <b>débloquer ce qui coince</b>. + un quiz «&nbsp;trouve la fondamentale&nbsp;».</p>';
    const b=el('button','btn','Ouvrir le module'); b.onclick=()=>openPowerModule(); c.appendChild(b); m.appendChild(c); }

  /* ---- Deck 2 : formes d’accords (l’Anki existant) ---- */
  m.appendChild(el('h1','page','Cartes d’accords (formes)'));
  m.appendChild(el('p','lead','On te montre un accord : essaie de le jouer, puis dis si tu le sais. Chaque carte explique aussi sa construction.'));
  const due=cDueTotal();
  if(due){ const c=el('div','card'); c.innerHTML=`<b>À réviser maintenant</b><p class="lead" style="margin:6px 0 0"><b style="color:var(--acc)">${due}</b> accord(s) dû(s), toutes catégories.</p>`;
    const b=el('button','btn','▶ Réviser les accords dus'); b.onclick=()=>{ let pool=[]; CHORD_CATS.forEach(k=>pool=pool.concat(cDue(k.id))); reviewChords(pool); }; c.appendChild(b); m.appendChild(c); }
  m.appendChild(el('p','lead','Commence par les <b>Majeurs</b> et <b>Mineurs</b>, puis débloque le reste à ton rythme.'));
  CHORD_CATS.forEach(k=>{ const tot=chordsIn(k.id).length, kn=cKnown(k.id), due=cDue(k.id).length;
    const c=el('div','catcard',`<div class="ico">${k.ic}</div><div class="t"><b>${k.name}</b><small>${k.d}</small></div><div class="pc">${kn}/${tot}${due?' · 🔁'+due:''}</div>`);
    c.onclick=()=>{ let pool=cDue(k.id).concat(cNew(k.id).slice(0,cBudget())); if(!pool.length) pool=chordsIn(k.id).map(x=>x.n); reviewChords(pool); };
    m.appendChild(c); });

  const cx=el('div','card'); cx.innerHTML='<b>🎲 Révision mixte</b><p class="lead" style="margin:6px 0 0">Un mélange de toutes les familles, priorité à ce qui est dû — pour ne pas ronronner sur une seule catégorie.</p>';
  const bx=el('button','btn ghost','🎲 Mix — 12 accords'); bx.onclick=()=>mixReview(); cx.appendChild(bx); m.appendChild(cx);

  m.appendChild(el('h1','page','Jouer une progression'));
  m.appendChild(el('p','lead','Enchaîne une suite d’accords cohérente — c’est là qu’on apprend les CHANGEMENTS (le vrai enjeu). Choisis-en une qui te force les accords que tu évites.'));
  PROGRESSIONS.forEach(p=>{ const c=el('div','catcard',`<div class="ico">🎵</div><div class="t"><b>${p.n}</b><small>${p.ch.join(' – ')}</small></div><div class="pc">›</div>`);
    c.onclick=()=>openProgression(p); m.appendChild(c); });

  m.appendChild(el('h1','page','Variantes d’un accord'));
  m.appendChild(el('p','lead','Un accord commun, plusieurs manières de le jouer (ouvert, barré, autre position). Les mêmes notes ailleurs sur le manche — la clé pour se déplacer.'));
  VARIANTS.forEach(v=>{ const c=el('div','catcard',`<div class="ico">🔧</div><div class="t"><b>${v.n}</b><small>${v.v.length} façons de le jouer</small></div><div class="pc">›</div>`);
    c.onclick=()=>openVariant(v); m.appendChild(c); });
}

function reviewChords(pool){
  ac(); markDay();
  if(!pool.length){ toast('Rien à réviser'); return; }
  pool=pool.slice(); for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=pool[i];pool[i]=pool[j];pool[j]=t;}
  let i=0, done=0;
  openOverlay('Accords', inner=>{
    const prog=el('div','fb-progress'); inner.appendChild(prog);
    const qh=el('div','qhead'); inner.appendChild(qh);
    const body=el('div'); body.style.textAlign='center'; inner.appendChild(body);
    const foot=el('div'); inner.appendChild(foot);
    function step(){
      if(i>=pool.length) return finish();
      const ch=chordByName(pool[i]);
      prog.innerHTML=`Carte <b>${i+1}</b>/${pool.length}`;
      qh.innerHTML=`<div class="q">${ch.n}</div><div class="sub">Essaie de le jouer sur ta guitare…</div>`;
      body.innerHTML=''; foot.innerHTML='';
      const rev=el('button','btn','👁 Voir la forme + écouter'); rev.onclick=()=>reveal(ch); foot.appendChild(rev);
    }
    function reveal(ch){
      strum(ch);
      body.innerHTML=''; body.appendChild(chordDiagram(ch));
      body.appendChild(el('div','clogic',`<div class="deg">Notes : ${ch.deg}</div>${ch.logic}`));
      const play=el('button','btn ghost','🔊 Réécouter'); play.onclick=()=>strum(ch); body.appendChild(play);
      qh.querySelector('.sub').textContent='Tu le connais ?';
      foot.innerHTML='';
      const rate=el('div','rate');
      const a=el('button','again','❌ À revoir'), g=el('button','good','✅ Je sais'), e=el('button','easy','⭐ Facile');
      a.onclick=()=>next(ch.n,'again'); g.onclick=()=>next(ch.n,'good'); e.onclick=()=>next(ch.n,'easy');
      rate.appendChild(a); rate.appendChild(g); rate.appendChild(e); foot.appendChild(rate);
    }
    function next(n,q){ cGrade(n,q); done++; if(q!=='again')S.xp+=3; save(); i++; step(); }
    function finish(){ qh.innerHTML=`<div class="q">✓</div><div class="sub">${done} carte(s) passée(s). Les accords sus reviendront plus tard, ceux « à revoir » très vite.</div>`;
      body.innerHTML=''; const cl=el('button','btn','Fermer'); cl.onclick=closeOverlay; foot.innerHTML=''; foot.appendChild(cl); }
    step();
  });
}

/* ================================================================
   THÉORIE
   ================================================================ */
const LESSONS=[
{id:'12notes',ic:'🔢',title:'Les 12 notes',sub:'Tout part de là',body:`
<p>La musique occidentale, c’est <b>12 notes</b> :</p>
<div class="formula">Do · Do♯ · Ré · Ré♯ · Mi · Fa · Fa♯ · Sol · Sol♯ · La · La♯ · Si</div>
<p>(en lettres, comme sur les guitares : <b>C C♯ D D♯ E F F♯ G G♯ A A♯ B</b>). Après le Si on reboucle sur le Do, une <b>octave</b> plus haut. Tout le manche n’est que ces 12 notes qui se répètent.</p>
<h3>Deux pièges</h3>
<ul><li>Entre <b>Mi–Fa</b> et <b>Si–Do</b>, pas de dièse : demi-tons « collés ».</li><li>Une case = <b>un demi-ton</b>.</li></ul>
<div class="tip">Sur une corde à vide, monte de <b>12 cases</b> : même note, une octave plus haut. La case 12 est LE grand repère.</div>`},
{id:'accordage',ic:'🎸',title:'L’accordage : E A D G B E',sub:'Le nom des 6 cordes',body:`
<p>De la plus grave à la plus aiguë :</p>
<div class="formula">Mi – La – Ré – Sol – Si – Mi<br>E &nbsp; A &nbsp; D &nbsp; G &nbsp; B &nbsp; E</div>
<p>Mnémo : « <b>Every Adult Dog Growls, Barks, Eats</b> ».</p>
<h3>La logique cachée</h3>
<p>Chaque corde est une <b>quarte</b> (5 cases) au-dessus de la précédente… <b>sauf</b> Sol→Si (une tierce, 4 cases). Cette exception explique pourquoi le manche déroute au début.</p>
<div class="tip">La case 5 d’une corde donne la corde du dessus à vide (exception : corde de Sol, case 4).</div>`},
{id:'reperes',ic:'📍',title:'Se repérer',sub:'Cases-repères et octaves',body:`
<p>Tu connais quelques <b>repères</b> et tu déduis le reste.</p>
<h3>Cases marquées</h3><p>Les points sont à <b>3, 5, 7, 9</b> et (double) <b>12</b>. Mémorise d’abord la corde de <b>Mi grave</b> : Sol(3), La(5), Si(7), Do♯(9), Mi(12).</p>
<h3>Motif de l’octave</h3><p><b>2 cordes plus haut, 2 cases plus loin</b> = la même note à l’octave. Une note connue = son octave gratuite.</p>
<div class="tip">Priorité : la corde de <b>Mi grave</b> et la corde de <b>La</b> — ce sont les fondamentales des accords et des power chords.</div>`},
{id:'construction',ic:'🧱',title:'D’où viennent les accords',sub:'Fondamentale, tierce, quinte',body:`
<p>Un accord de base = <b>3 notes</b> empilées : la <b>fondamentale</b> (qui donne le nom), la <b>tierce</b>, la <b>quinte</b>.</p>
<div class="formula">Majeur = fond. + tierce MAJEURE + quinte<br>Mineur = fond. + tierce MINEURE + quinte</div>
<p>La <b>tierce</b> est la note qui décide tout : majeure (claire) ou mineure (sombre, un demi-ton plus bas). C’est pour ça que passer de A à Am ne change qu’<b>une note</b> sous tes doigts.</p>
<h3>Les familles (onglet Accords)</h3>
<ul><li><b>Power chord</b> : fond. + quinte, SANS tierce → ni l’un ni l’autre, passe-partout.</li>
<li><b>7e</b> : on ajoute une 4e note (la 7e) → tension bluesy.</li>
<li><b>sus</b> : on remplace la tierce par la 2de ou la 4te → suspendu.</li></ul>
<div class="tip">Regarde les <b>degrés</b> affichés sous chaque carte d’accord (1 · 3 · 5…) : tu verras la même recette se répéter sur tout le manche.</div>`},
{id:'enrichir',ic:'🎨',title:'Enrichir : 7, 9, 11… et le ♭5',sub:'D’où viennent ces accords « bizarres »',body:`
<p>Un accord de base = 3 notes empilées <b>de tierce en tierce</b> : 1 (fondamentale), 3 (tierce), 5 (quinte). Pour l’enrichir, on continue juste à <b>empiler des tierces</b> par-dessus.</p>
<div class="formula">1 – 3 – 5 – 7 – 9 – 11 – 13</div>
<p>Chaque nouveau chiffre = une tierce de plus. Les chiffres <b>au-dessus de 7</b> sont juste des notes montées d’une <b>octave</b> :</p>
<ul><li>la <b>9e</b> = la 2de, une octave plus haut ;</li>
<li>la <b>11e</b> = la 4te, une octave plus haut ;</li>
<li>la <b>13e</b> = la 6te, une octave plus haut.</li></ul>
<h3>La 7e, d’abord</h3>
<p>Avant d’ajouter une 9 ou une 11, il y a la <b>7e</b> : la 4e note qui donne le son « adulte »/bluesy. Un <b>C7</b> = Do + Mi + Sol + <b>Si♭</b>.</p>
<h3>La 9e : DEUX façons (attention)</h3>
<ul><li><b>add9</b> (ex. Cadd9) : on ajoute juste la 9e (le Ré) à la triade, <b>SANS</b> 7e → son pop, clair, scintillant.</li>
<li><b>9</b> (ex. C9) : on part de l’accord de <b>7</b> (donc avec le Si♭) <b>puis</b> on ajoute la 9e → son funk/jazz, plus riche.</li></ul>
<p>Voilà pourquoi Cadd9 et C9 sonnent différemment : l’un a la 7e, l’autre non.</p>
<h3>La 11e</h3>
<p>Encore une tierce au-dessus : la 11e (= la 4te à l’octave). Piège : sur un accord majeur, la 11e « frotte » avec la tierce, donc on <b>enlève souvent la tierce</b>. C’est ce qui donne à un accord de 11 son côté ouvert, suspendu.</p>
<div class="tip">À la guitare, on ne joue JAMAIS les 6-7 notes ! On garde <b>l’essentiel</b> : la tierce (elle dit majeur/mineur), la 7e, et l’extension (9 ou 11). On lâche la fondamentale (le bassiste la joue) et la quinte (elle ne dit rien).</div>
<h3>Le « truc bizarre » : le ♭5 (m7♭5, demi-diminué)</h3>
<p>Un accord mineur 7 normal a une <b>quinte juste</b>. Le <b>m7♭5</b> (ex. Bm7♭5) <b>abaisse cette quinte d’un demi-ton</b> — c’est ça, le ♭5 :</p>
<div class="formula">m7 : &nbsp;1 – ♭3 – 5 – ♭7<br>m7♭5 : 1 – ♭3 – <b>♭5</b> – ♭7</div>
<p>Cette quinte diminuée rend l’accord <b>instable, trouble, en suspens</b>. Son autre nom : <b>demi-diminué</b>. Son rôle : c’est le <b>ii des tonalités mineures</b>, il ouvre le fameux ii–V–i mineur — en La mineur : <b>Bm7♭5 → E7 → Am</b>.</p>
<div class="tip">Repère express : un m7♭5, c’est un mineur 7 dont on a « cassé » la quinte (descendue d’un demi-ton). Joue Bm7, puis descends le Fa♯ en Fa : tu obtiens Bm7♭5.</div>`},
{id:'pourquoi-gammes',ic:'🪜',title:'Pourquoi la gamme majeure',sub:'Aperçu — étape impro',body:`
<p>Sur les 12 notes, une chanson n’en utilise que <b>7</b> : une <b>gamme</b>. La majeure suit toujours le même écart de cases :</p>
<div class="formula">2 – 2 – 1 – 2 – 2 – 2 – 1</div>
<p>Ces 7 notes forment l’<b>alphabet</b> du morceau : accords, mélodie et solos en sortent. Quand tu improviseras, la gamme te dira quelles notes sonnent juste.</p>
<div class="tip">On attaque l’impro pour de vrai à l’<b>étape 3</b>. Pour l’instant : le manche, puis les accords.</div>`},
];
function renderTheorie(){
  const m=document.getElementById('main'); m.innerHTML='';
  m.appendChild(el('h1','page','Théorie'));
  m.appendChild(el('p','lead','La base, vraiment simple, en partant de zéro.'));
  LESSONS.forEach(L=>{ const c=el('div','lesson',`<div class="ico">${L.ic}</div><div class="t"><b>${L.title}</b><small>${L.sub}</small></div>`);
    c.onclick=()=>openOverlay(L.title, inner=>{ inner.appendChild(el('div','theory',L.body)); const b=el('button','btn ghost','← Retour'); b.onclick=closeOverlay; inner.appendChild(b); }); m.appendChild(c); });
}

/* ================================================================
   SUITE
   ================================================================ */
function renderSuite(){
  const m=document.getElementById('main'); m.innerHTML='';
  m.appendChild(el('h1','page','La suite'));
  m.appendChild(el('p','lead','On construit dans l’ordre. Chaque étape s’appuie sur la précédente.'));

  const T=miniToday();
  const dc=el('div','card'); dc.style.borderColor='var(--acc)';
  dc.innerHTML=`<b>🎓 Le cours du jour</b> <span style="color:var(--acc);font-size:12px;font-weight:700">· ${T.ic} ${T.n}</span><p class="lead" style="margin:6px 0 10px">${T.interet}</p>`;
  const db=el('button','btn','Faire le mini-cours du jour'); db.onclick=()=>openMiniLesson(T); dc.appendChild(db);
  m.appendChild(dc);

  const steps=[
    {n:'1',t:'🎸 Le manche',d:'En cours. Notes par cœur : « trouve tout » + nommer les cases.',now:true},
    {n:'2',t:'🎴 Accompagnement',d:'En cours. Anki d’accords + triades + power chords, avec la logique de construction.',now:true},
    {n:'3',t:'🪜 La gamme majeure en positions',d:'Les 5 formes à connaître, dans l’ordre. Ta penta + 2 notes. Commence par la Position 1, mobile — tu joues alors en majeur partout.',open:openMajorPositions},
    {n:'4',t:'🗺️ Le système CAGED',d:'La carte qui relie accords et gammes : 5 formes (C-A-G-E-D) déplacées jouent tout accord dans 5 positions, et portent tes boîtes de penta. Explication + « connecte le manche » + 2 exos.',open:openCAGED},
    {n:'5',t:'🎤 Improviser',d:'Le hub complet : la Boussole (dans quelle gamme je joue ?), lick du jour, penta & notes à viser, de la chanson au mode, le blues, licks & riffs, technique, phrasé.',open:openImproHub},
    {n:'6',t:'🌈 Les modes, par ordre',d:'Les 7 couleurs de Ionien à Locrien : la note qui colore chacune, sur quel accord, entendue et vue sur le manche.',open:openModesModule},
    {n:'7',t:'🎓 Le mini-cours du jour',d:'Une technique par jour, de la base au shred (hammer, bend, legato, tapping, sweep…) : notation, intérêt, comment bien la faire, 2-3 exos. Aujourd’hui : '+miniToday().n+'.',open:openMiniCourse},
    {n:'8',t:'⚡ Jouer vite (comme les pros)',d:'La méthode qui marche vraiment : relâchement, métronome, rafales, séquences — des exos en progression pour gagner en vitesse pour de vrai.',open:openSpeed},
    {n:'9',t:'🎸 Improviser vite comme un pro',d:'Transformer la vitesse en musique : vocabulaire de licks, notes cibles, séquences au tempo, relier les positions, le solo d’une minute.',open:openFastImpro},
    {n:'10',t:'🎼 Écrire une chanson',d:'La structure couplet-refrain, le contraste doux/fort (l’ADN de ton rock), le riff, le refrain, la mélodie, les paroles — et la méthode pour en écrire une cette semaine.',open:openSongwriting},
  ];
  steps.forEach(a=>{ const s=el('div','step'+(a.now?' now':'')); s.innerHTML=`<div class="n">${a.n}</div><div style="flex:1"><b>${a.t}${a.open?' <span style="color:var(--acc)">›</span>':''}</b><small>${a.d}</small>${a.open?'<small style="color:var(--acc);font-weight:700;margin-top:4px">Disponible — touche pour ouvrir</small>':''}</div>`;
    if(a.open){ s.style.cursor='pointer'; s.onclick=a.open; } m.appendChild(s); });
  const soon=el('div','card');
  soon.innerHTML='<b>🔮 Plus tard dans le parcours</b><p class="lead" style="margin:6px 0 10px">Les prochaines briques de connaissances &amp; de technique — je les construirai avec toi quand tu y seras.</p>';
  [['🎚️','Le son','ampli, disto, réverb, delay — façonner ta tonalité (les textures Deftones)'],
   ['🎸','Les accordages alternatifs','drop D, drop C — le poids et les power chords à un doigt'],
   ['🎙️','S’enregistrer & faire une démo','poser tes idées, t’écouter, garder une trace'],
   ['👂','Relever à l’oreille','retrouver un riff / une chanson sans tablature'],
   ['🥁','Jouer en groupe','rester serré avec une batterie, tenir le tempo, le « pocket »']]
   .forEach(a=>{ const r=el('div','catcard'); r.style.opacity='.7';
     r.innerHTML=`<div class="ico">${a[0]}</div><div class="t"><b>${a[1]}</b><small>${a[2]}</small></div><div class="pc" style="color:var(--dim)">bientôt</div>`;
     soon.appendChild(r); });
  m.appendChild(soon);
  m.appendChild(el('div','card','<b>Pourquoi cet ordre ?</b><p class="lead" style="margin:6px 0 0">1→6, on construit les fondations : le manche, les accords, les positions, la carte CAGED, l’impro, les modes. Les étapes <b>7-10</b> (mini-cours, vitesse, impro rapide, écrire une chanson) se travaillent <b>en parallèle, un peu chaque jour</b> — commence par le cours du jour, tout en haut.</p>'));
}

/* ================================================================
   LA CONQUÊTE — les 5 boîtes de la penta, une par une, gamifiées
   Pensé POUR LE TÉLÉPHONE : plus de manche entier à faire défiler,
   une FENÊTRE de 5 cases (6 cordes × 5 cases) qui tient sous le pouce.
   Chaque boîte franchit 5 paliers ; le passage « par cœur » →
   « scellée » exige DEUX jours différents (le sommeil fait le travail),
   puis la boîte revient en révision espacée et REDESCEND d’un palier
   si l’entretien est raté. Même moteur que le Grand Œuvre du Piano
   Dojo — c’est ce qui marche : sans ternissement, l’app croit que tu
   sais des choses que tu as oubliées.
   ================================================================ */
const PENTA_M=[0,3,5,7,10];
const DEG_PENTA={0:'1',3:'♭3',5:'4',7:'5',10:'♭7'};
const DEG_LONG={0:'la fondamentale',3:'la ♭3 (tierce mineure)',5:'la 4te',7:'la 5te',10:'la ♭7'};
/* Les 5 boîtes : décalages de cases par rapport à la fondamentale sur la
   corde de Mi grave. Index 0 = Mi grave … 5 = Mi aigu. (Vérifié sur La
   mineur, fondamentale case 5 : la boîte 1 tombe bien sur 5-8.) */
const BOXES=[
 {n:'Boîte 1', off:0, sh:[[0,3],[0,2],[0,2],[0,2],[0,3],[0,3]],
  tip:'LA boîte. Fondamentale sous l’index sur le Mi grave. 90 % des solos rock sortent d’ici — apprends-la jusqu’à la jouer les yeux fermés.'},
 {n:'Boîte 2', off:2, sh:[[3,5],[2,5],[2,5],[2,4],[3,5],[3,5]],
  tip:'Juste au-dessus de la 1. C’est la boîte des grands bends : la corde de Sol y donne le ♭7 → la fondamentale.'},
 {n:'Boîte 3', off:4, sh:[[5,7],[5,7],[5,7],[4,7],[5,8],[5,7]],
  tip:'La plus « carrée » : deux doigts qui glissent. Attention à la corde de Sol, décalée d’une case (l’écart classique).'},
 {n:'Boîte 4', off:7, sh:[[7,10],[7,10],[7,9],[7,9],[8,10],[7,10]],
  tip:'La fondamentale revient sur la corde de Ré. Boîte très « chantante » : c’est là que les phrases de B.B. King vivent.'},
 {n:'Boîte 5', off:9, sh:[[10,12],[10,12],[9,12],[9,12],[10,12],[10,12]],
  tip:'Elle boucle le système : au-dessus d’elle, la boîte 1 recommence 12 cases plus haut. Une fois celle-ci sue, tu as TOUT le manche.'}
];
const BX_RANK=['—','Reconnue','Montée','À l’aveugle','Par cœur','Scellée ✅'];
const BX_MODE=['guide','order','blind','targets','chrono'];
const BX_MODEN=['Reconnaître','Monter & descendre','À l’aveugle','Les cibles','Le chrono'];
const BX_INTERVALS=[1,3,7,16,35,60];
const BX_CHRONO=30;      /* secondes à battre au dernier palier */

/* fenêtre de 5 cases d’une boîte, ramenée dans la partie jouable du manche */
function boxLow(root,bi){ const r=((root-4)%12+12)%12; let low=r+BOXES[bi].off;
  if(low+4>15) low-=12; if(low<0) low+=12; return low; }
/* les 12 notes de la boîte, triées du grave à l’aigu */
function boxCells(root,bi){ const r=((root-4)%12+12)%12, low=boxLow(root,bi), out=[];
  /* la fondamentale de référence peut être 12 cases plus bas : on recale */
  const base = (low - BOXES[bi].off);
  BOXES[bi].sh.forEach((pair,s)=>pair.forEach(o=>{ const f=base+o;
    out.push({s,f,m:midiAt(s,f),pc:midiAt(s,f)%12,deg:DEG_PENTA[((midiAt(s,f)%12-root)%12+12)%12]}); }));
  out.sort((a,b)=>a.m-b.m); return out;
}
/* widget « boîte » : 6 cordes × 5 cases, gros doigts, zéro défilement */
function buildBox(low,onTap){
  const wrap=el('div','boxwrap'), grid=el('div','boxgrid'), cells={};
  for(let s=5;s>=0;s--){
    const nm=el('div','bname',['E','A','D','G','B','e'][s]); grid.appendChild(nm);
    for(let f=low;f<=low+4;f++){ const c=el('div','bcell'+(f===0?' nut':''));
      c.appendChild(el('div','bsl')); c.dataset.s=s; c.dataset.f=f;
      c.onclick=()=>onTap&&onTap(s,f,c); grid.appendChild(c); cells[s+':'+f]=c; }
  }
  wrap.appendChild(grid);
  const nums=el('div','boxnums'); nums.appendChild(el('div','',''));
  const marks={3:1,5:1,7:1,9:1,12:2,15:1};
  for(let f=low;f<=low+4;f++) nums.appendChild(el('div',marks[f]===2?'mk2':marks[f]?'mk':'',''+f));
  wrap.appendChild(nums);
  wrap.dot=(s,f,label,cls)=>{ const c=cells[s+':'+f]; if(!c)return; let d=c.querySelector('.bdot');
    if(!d){ d=el('div','bdot'); c.appendChild(d); } d.className='bdot '+(cls||''); d.textContent=label==null?'':label; return d; };
  wrap.clear=()=>Object.values(cells).forEach(c=>{ const d=c.querySelector('.bdot'); if(d)d.remove(); });
  wrap.flash=(s,f,cls)=>{ const c=cells[s+':'+f]; if(!c)return; c.classList.add(cls||'good');
    setTimeout(()=>c.classList.remove(cls||'good'),260); };
  return wrap;
}

/* ---------------- état de conquête ---------------- */
function bxAll(){ if(!S.boxes) S.boxes={}; return S.boxes; }
function bx(i){ const a=bxAll(); if(!a[i]) a[i]={lvl:0,seal:null,due:null,step:0,best:null,lapses:0,keys:{}}; return a[i]; }
const bxAddDays=(d,n)=>{ const x=new Date(d+'T12:00:00'); x.setDate(x.getDate()+n); return x.toISOString().slice(0,10); };
function bxDue(i){ const g=bx(i); return g.lvl>=5 && g.due && g.due<=today(); }
function bxDueList(){ return [0,1,2,3,4].filter(bxDue); }
function bxMastered(){ return [0,1,2,3,4].filter(i=>bx(i).lvl>=5).length; }
function bxPct(){ let s=0; for(let i=0;i<5;i++) s+=Math.min(5,bx(i).lvl); return Math.round(100*s/25); }
/* la prochaine boîte à ouvrir : la 1re encore inconnue, sinon la moins avancée */
function bxNext(){ const d=bxDueList(); if(d.length) return d[0];
  for(let i=0;i<5;i++) if(bx(i).lvl<5) return i; return 0; }
function bxSchedPass(i){ const g=bx(i); g.step=Math.min((g.step||0)+1,BX_INTERVALS.length-1);
  g.due=bxAddDays(today(),BX_INTERVALS[g.step]); save(); return BX_INTERVALS[g.step]; }
function bxSchedFail(i){ const g=bx(i); g.lapses=(g.lapses||0)+1; g.lvl=4; g.step=0; g.due=null; g.seal=null; save(); }
/* monte d’un palier ; le 4→5 exige DEUX jours différents */
function bxAward(i,secs){
  const g=bx(i), t=today();
  if(secs!=null && (g.best==null||secs<g.best)) g.best=secs;
  if(g.lvl<4){ g.lvl++; S.xp+=12; save(); return {up:true,msg:`▲ ${BOXES[i].n} → palier « ${BX_RANK[g.lvl]} »`}; }
  if(g.lvl===4){
    if(!g.seal){ g.seal=t; S.xp+=8; save();
      return {up:false,msg:`🔒 Sceau posé sur la ${BOXES[i].n}. Reviens un AUTRE jour la refaire à l’aveugle pour la sceller — la mémoire a besoin de dormir dessus.`}; }
    if(g.seal!==t){ g.lvl=5; g.seal=null; g.step=0; g.due=bxAddDays(t,BX_INTERVALS[0]); S.xp+=40; save();
      return {up:true,master:true,msg:`🏅 ${BOXES[i].n} CONQUISE. Premier entretien demain, puis de plus en plus espacé.`}; }
    save(); return {up:false,msg:`Déjà scellée aujourd’hui — reviens demain pour finir le travail.`};
  }
  bxSchedPass(i); S.xp+=10; save();
  return {up:false,msg:`✓ Entretien fait. Prochaine révision dans ${BX_INTERVALS[bx(i).step]} j.`};
}

/* ---------------- le moteur d’épreuve ----------------
   Un seul moteur, 5 modes. Tout se joue au doigt sur la fenêtre. */
function runBoxTrial(host,opt,done){
  const {root,bi,mode}=opt;
  const cells=boxCells(root,bi), low=boxLow(root,bi);
  const seq = mode==='chrono' ? cells.concat(cells.slice(0,-1).reverse()) : cells;
  let i=0, err=0, t0=null, tk=null;
  host.innerHTML='';
  const head=el('div','qhead'); host.appendChild(head);
  const box=buildBox(low,(s,f)=>tap(s,f)); host.appendChild(box);
  const foot=el('div'); host.appendChild(foot);
  const rootName=NOTES[root];

  /* mode « cibles » : 8 degrés à trouver, une fenêtre différente à chaque fois */
  let qs=null;
  if(mode==='targets'){ qs=[]; const pool=PENTA_M.slice();
    while(qs.length<8){ const iv=pool[Math.floor(Math.random()*pool.length)];
      if(qs.length && qs[qs.length-1]===iv) continue; qs.push(iv); } }

  function paintGuide(){ box.clear();
    if(mode==='guide'){ cells.forEach((c,k)=>box.dot(c.s,c.f, DEG_PENTA[((c.pc-root)%12+12)%12], k<i?'okd':(c.pc===root?'root':'on'))); if(cells[i]) box.dot(cells[i].s,cells[i].f,'?','ask'); }
    else if(mode==='order'){ cells.forEach((c,k)=>{ if(k<i) box.dot(c.s,c.f,'✓','okd'); else box.dot(c.s,c.f,'','on'); }); }
    else if(mode==='targets'){ if(!host._painted){ host._painted=1; cells.forEach(c=>box.dot(c.s,c.f,'','on')); } }
    /* 'blind' et 'chrono' : rien du tout, c’est le but */
  }
  function tick(){ const e=head.querySelector('.timer'); if(e&&t0) e.textContent=((performance.now()-t0)/1000).toFixed(1)+'s'; }
  function startClock(){ if(t0) return; t0=performance.now(); if(tk)clearInterval(tk); tk=setInterval(tick,100); }

  function show(){
    const timed=(mode==='chrono'||mode==='blind'||mode==='targets');
    const el0=timed?`<span class="timer bigtimer">${t0?((performance.now()-t0)/1000).toFixed(1):'0.0'}s</span> · `:'';
    if(mode==='targets'){
      const iv=qs[i];
      head.innerHTML=`<div class="sub">${el0}${i+1}/8 · ❌ ${err}</div>
        <div class="q" style="font-size:30px">touche ${DEG_PENTA[iv]}</div>
        <div class="sub">${DEG_LONG[iv]} de <b>${rootName} mineur</b> — n’importe laquelle dans la boîte</div>`;
    } else {
      const asc = i<cells.length || mode!=='chrono';
      const dir = (mode==='chrono' && i>=cells.length)?'↓ on redescend':'↑ on monte';
      head.innerHTML=`<div class="sub">${el0}${i+1}/${seq.length} · ❌ ${err}</div>
        <div class="q" style="font-size:22px">${BOXES[bi].n} · ${rootName} mineur</div>
        <div class="sub">${mode==='guide'?'suis le <b>?</b> : les notes dans l’ordre, du grave à l’aigu':(mode==='order'?'les notes de la boîte, <b>dans l’ordre</b>':(mode==='blind'?'à l’aveugle : de la plus grave à la plus aiguë':dir))}</div>`;
    }
    paintGuide();
  }
  function tap(s,f){
    if(host._done) return; pluck(midiAt(s,f)); startClock();
    if(mode==='targets'){
      const pc=midiAt(s,f)%12, want=(root+qs[i])%12;
      const inBox=cells.some(c=>c.s===s&&c.f===f);
      if(inBox && pc===want){ box.flash(s,f,'good'); box.dot(s,f,DEG_PENTA[qs[i]],'okd'); i++; if(i>=8) return finish(); setTimeout(show,180); }
      else { err++; box.flash(s,f,'bad'); const d=box.dot(s,f,inBox?DEG_PENTA[((pc-root)%12+12)%12]:'✗','no'); setTimeout(()=>{ if(d&&d.parentNode)d.remove(); },420); show(); }
      return;
    }
    const want=seq[i];
    if(s===want.s && f===want.f){ box.flash(s,f,'good'); i++; if(i>=seq.length) return finish(); show(); }
    else { err++; box.flash(s,f,'bad'); const d=box.dot(s,f,'✗','no'); setTimeout(()=>{ if(d&&d.parentNode)d.remove(); paintGuide(); },420); }
  }
  function finish(){ host._done=true; if(tk){clearInterval(tk);tk=null;}
    const secs=t0?Math.round((performance.now()-t0)/100)/10:null;
    box.clear(); cells.forEach(c=>box.dot(c.s,c.f,DEG_PENTA[((c.pc-root)%12+12)%12],c.pc===root?'root':'okd'));
    done({err,secs,root,bi,mode});
  }
  show();
}

/* ---------------- l’écran d’une boîte ---------------- */
function bxKeyFor(lvl){ /* paliers 1-2 : La mineur (le terrain connu) ; après : tonalité TIRÉE AU SORT */
  if(lvl<2) return 9;
  const pool=[9,4,2,7,0,5,11,10,3,8,6,1];
  return pool[Math.floor(Math.random()*(lvl>=3?12:5))];
}
function openBox(bi){
  ac(); markDay();
  const g=bx(bi);
  openOverlay(BOXES[bi].n+' — penta mineure', inner=>{
    const due=bxDue(bi), lvl=g.lvl;
    const isMaint = lvl>=5;
    const mode = isMaint ? 'chrono' : BX_MODE[Math.min(4,lvl)];
    const root = bxKeyFor(isMaint?4:lvl);

    const h=el('div','card'); h.style.borderColor='var(--acc)';
    h.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between">
        <b style="font-size:17px">${BOXES[bi].n}</b>
        <span style="color:var(--acc);font-weight:800;font-size:13px">${BX_RANK[Math.min(5,lvl)]}</span></div>
      <div class="bxbar"><i style="width:${Math.min(100,lvl*20)}%"></i></div>
      <p class="lead" style="margin:8px 0 0">${isMaint?(due?'🔁 <b style="color:var(--acc)">Entretien dû aujourd’hui.</b> Refais-la à l’aveugle sous chrono : si tu la rates, elle redescend d’un palier — c’est le prix de l’honnêteté.':'Conquise. Prochain entretien le <b>'+(g.due||'—')+'</b>. Tu peux la refaire quand tu veux, ça ne coûte rien.'):('Palier suivant : <b style="color:var(--acc)">'+BX_MODEN[Math.min(4,lvl)]+'</b>'+(lvl>=2?' · tonalité tirée au sort : la forme est <b>mobile</b>, c’est tout l’intérêt':''))}</p>`;
    inner.appendChild(h);

    inner.appendChild(el('div','theory',`<div class="tip">${BOXES[bi].tip}</div>`));

    const arena=el('div','card'); inner.appendChild(arena);
    function ready(){
      arena.innerHTML='';
      arena.appendChild(el('b',null,'▶ '+BX_MODEN[Math.min(4,isMaint?4:lvl)]+' · '+NOTES[root]+' mineur'));
      const expl={guide:'La boîte est affichée avec ses degrés. Touche les notes <b>dans l’ordre</b>, du grave à l’aigu, en suivant le <b>?</b>. Le but ici : voir la forme, pas la retenir.',
        order:'Les notes sont là, sans étiquette. Touche-les dans l’ordre, du grave à l’aigu, puis c’est fini. Deux erreurs maximum.',
        blind:'<b>Manche vide.</b> Tu poses les 12 notes de la boîte de mémoire, du grave à l’aigu. C’est là que ça grave.',
        targets:'8 questions : « touche la ♭3 », « touche la 5te »… N’importe laquelle dans la boîte. C’est ce qui transforme une forme en <b>vraies notes à viser</b>.',
        chrono:`À l’aveugle, <b>monte ET redescends</b>, sous <b>${BX_CHRONO}s</b>, zéro faute. C’est le test qui scelle la boîte.`};
      arena.appendChild(el('p','lead',expl[mode]));
      const go=el('button','btn','▶ Go'); go.onclick=()=>play(); arena.appendChild(go);
      if(lvl>0){ const rev=el('button','btn ghost','👁 Revoir la forme (sans test)');
        rev.onclick=()=>openBoxLook(bi,root); arena.appendChild(rev); }
    }
    function play(){
      arena.innerHTML=''; arena._done=false; delete arena._done;
      const host=el('div'); arena.appendChild(host);
      runBoxTrial(host,{root,bi,mode},res=>{
        const maxErr = mode==='guide'?99:(mode==='order'?2:(mode==='targets'?1:0));
        const okTime = mode!=='chrono' || (res.secs!=null && res.secs<=BX_CHRONO);
        const win = res.err<=maxErr && okTime;
        const out=el('div'); arena.appendChild(out);
        if(win){
          const r=bxAward(bi,res.secs);
          out.innerHTML=`<div class="qhead"><div class="q" style="color:var(--ok)">✓ ${res.secs!=null?res.secs+'s':'réussi'}</div>
            <div class="sub">${res.err?res.err+' erreur(s)':'sans faute'}</div></div>
            <div class="clogic" style="margin-top:10px"><b style="color:var(--acc)">${r.msg}</b></div>`;
          toast(r.up?'▲ Palier franchi · +12 XP':'✓ +XP');
        } else {
          if(isMaint){ bxSchedFail(bi);
            out.innerHTML=`<div class="qhead"><div class="q" style="color:var(--bad)">Entretien raté</div>
              <div class="sub">${res.err} erreur(s)${res.secs!=null?' · '+res.secs+'s':''}</div></div>
              <div class="clogic" style="margin-top:10px">La ${BOXES[bi].n} <b style="color:var(--bad)">redescend au palier « Par cœur »</b>. Ce n’est pas une punition : c’est l’app qui refuse de te mentir sur ce que tu sais.</div>`;
          } else {
            out.innerHTML=`<div class="qhead"><div class="q" style="color:var(--bad)">Pas encore</div>
              <div class="sub">${res.err} erreur(s)${res.secs!=null?' · '+res.secs+'s'+(mode==='chrono'?' (cible '+BX_CHRONO+'s)':''):''}</div></div>
              <div class="clogic" style="margin-top:10px">Le palier n’est pas validé — ${maxErr===0?'il faut le <b>sans-faute</b>':'maximum '+maxErr+' erreur(s)'}. Revois la forme 30 secondes et recommence : c’est normal d’y passer 2-3 essais.</div>`;
          }
        }
        const again=el('button','btn','↻ Encore'); again.onclick=()=>openBox(bi); out.appendChild(again);
        const back=el('button','btn ghost','← La Conquête'); back.onclick=()=>openConquete(); out.appendChild(back);
      });
    }
    ready();
  });
}
/* revoir la forme, sans enjeu */
function openBoxLook(bi,root){
  ac();
  openOverlay(BOXES[bi].n+' — la forme', inner=>{
    let r=root==null?9:root;
    const c=el('div','card');
    c.appendChild(el('b',null,'Touche pour entendre'));
    c.appendChild(rootPicker(r,pc=>{ r=pc; draw(); }));
    const holder=el('div'); c.appendChild(holder);
    const info=el('div','clogic'); c.appendChild(info);
    const play=el('button','btn ghost','🔊 Écouter la boîte'); c.appendChild(play);
    inner.appendChild(c);
    inner.appendChild(el('div','theory',`<div class="tip">${BOXES[bi].tip}</div>
      <p>Les 5 boîtes sont les <b>mêmes 5 notes</b>, découpées en 5 fenêtres qui s’emboîtent. Change de tonalité ci-dessus : <b>la forme ne bouge pas</b>, elle glisse. C’est ça, une forme mobile — et c’est pour ça qu’en apprendre 5 suffit pour les 12 tonalités.</p>`));
    function draw(){ holder.innerHTML='';
      const low=boxLow(r,bi), cells=boxCells(r,bi);
      const b=buildBox(low,(s,f)=>{ pluck(midiAt(s,f)); b.flash(s,f,'good'); }); holder.appendChild(b);
      cells.forEach(x=>b.dot(x.s,x.f,DEG_PENTA[((x.pc-r)%12+12)%12], x.pc===r?'root':'on'));
      play.onclick=()=>{ ac(); cells.forEach((x,k)=>setTimeout(()=>pluck(x.m,1.0,.5),k*135)); };
      info.innerHTML=`<div class="deg">${NOTES[r]} mineur · ${BOXES[bi].n} · cases ${low}–${low+4}</div>
        Notes : ${PENTA_M.map(iv=>NOTES[(r+iv)%12]).join(' · ')}. En <b style="color:var(--bad)">rouge</b> : la fondamentale.
        <br><span style="color:var(--dim)">(Mêmes 5 notes que la penta MAJEURE de ${NOTES[(r+3)%12]} — une forme apprise, deux gammes.)</span>`;
    }
    draw();
  });
}

/* ---------------- l’écran de conquête ---------------- */
function openConquete(){
  markDay();
  openOverlay('La Conquête du manche', inner=>{
    const m=bxMastered(), pct=bxPct(), due=bxDueList();
    const h=el('div','card'); h.style.borderColor='var(--acc)';
    h.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:baseline">
        <b style="font-size:17px">${m}/5 boîtes conquises</b><span style="color:var(--acc);font-weight:800">${pct}%</span></div>
      <div class="bxbar"><i style="width:${pct}%"></i></div>
      <p class="lead" style="margin:8px 0 0">${m>=5?'🏆 <b>Tout le manche est à toi.</b> Reviens pour les entretiens — et va jouer sur des vrais morceaux (🎧 Le Juke-box).':(due.length?'🔁 <b style="color:var(--acc)">'+due.length+' boîte(s) à revoir aujourd’hui</b> — l’entretien d’abord, toujours.':'5 boîtes, 5 paliers chacune. Une seule à la fois, 5 minutes par jour. Les 12 tonalités viennent gratuitement : la forme est mobile.')}</p>`;
    inner.appendChild(h);

    const nxt=bxNext();
    const go=el('div','card'); go.style.borderColor='var(--acc2)';
    go.innerHTML=`<b>⚔️ Ta prochaine étape</b><p class="lead" style="margin:6px 0 10px">${BOXES[nxt].n} — ${bxDue(nxt)?'entretien dû':('palier « '+BX_MODEN[Math.min(4,bx(nxt).lvl)]+' »')}</p>`;
    const gb=el('button','btn','Y aller'); gb.onclick=()=>openBox(nxt); go.appendChild(gb);
    inner.appendChild(go);

    BOXES.forEach((B,i)=>{ const g=bx(i), d=bxDue(i);
      const c=el('div','catcard');
      const pipes=[0,1,2,3,4].map(k=>`<i class="${k<g.lvl?'on':''}"></i>`).join('');
      c.innerHTML=`<div class="ico">${g.lvl>=5?'🏅':(i+1)}</div>
        <div class="t"><b>${B.n} ${d?'<span style="color:var(--acc)">· 🔁 à revoir</span>':''}</b>
        <small>${BX_RANK[Math.min(5,g.lvl)]}${g.best?' · record '+g.best+'s':''}${g.lapses?' · '+g.lapses+' rechute(s)':''}</small>
        <div class="pips">${pipes}</div></div><div class="pc">›</div>`;
      c.onclick=()=>openBox(i); inner.appendChild(c); });

    const tools=el('div','card'); tools.innerHTML='<b>🛠 Autour des boîtes</b>';
    const t1=el('button','btn ghost','🎯 Le Duel — 60 s, combo, 3 vies'); t1.onclick=()=>openDuel(); tools.appendChild(t1);
    const t2=el('button','btn ghost','👁 Revoir une forme, sans test'); t2.onclick=()=>openBoxLook(0,9); tools.appendChild(t2);
    const t3=el('button','btn ghost','🎧 Le Juke-box — jouer sur des vrais morceaux'); t3.onclick=()=>openJukebox(); tools.appendChild(t3);
    inner.appendChild(tools);

    inner.appendChild(el('div','theory',`
      <h3>Pourquoi ça marche (et pas les autres méthodes)</h3>
      <p><b>Une boîte à la fois.</b> Cinq formes en même temps, c’est zéro forme dans six semaines. On en ouvre une, on la scelle, on passe.</p>
      <p><b>La forme se déplace.</b> Dès le 3<sup>e</sup> palier, l’app tire la tonalité au sort. Si tu ne sais la jouer qu’en La mineur, tu ne la sais pas.</p>
      <p><b>Ça peut redescendre.</b> Une boîte scellée revient à J+1, +3, +7, +16, +35, +60. Entretien raté = elle redescend d’un palier. Une app qui ne fait que monter te ment.</p>
      <div class="tip">Le vrai but n’est pas de « connaître 5 formes » : c’est de <b>viser une note précise</b> pendant qu’un accord passe. C’est exactement ce que teste le palier « Les cibles » — et ce que tu joues pour de vrai dans le Juke-box.</div>`));
  });
}

/* ================================================================
   LE DUEL — 60 secondes, combo, 3 vies. L’arcade des gammes.
   Le contraire de la Conquête : ici on ne réfléchit pas, on répond
   au réflexe. C’est ce mode-là qui transforme « je sais retrouver
   la ♭3 » en « ma main est déjà dessus ».
   ================================================================ */
const DUEL_RANKS=[[0,'Bleu'],[250,'Habitué'],[600,'Tireur'],[1000,'Duelliste'],[1600,'Sniper du manche'],[2400,'Légende']];
function duelRank(sc){ let n=DUEL_RANKS[0][1]; DUEL_RANKS.forEach(r=>{ if(sc>=r[0]) n=r[1]; }); return n; }
var _duelT=null;
function openDuel(){
  ac(); markDay();
  openOverlay('Le Duel', inner=>{
    const best=S.duelBest||0;
    const intro=el('div','card'); intro.style.borderColor='var(--acc)';
    intro.innerHTML=`<b>🎯 60 secondes · combo · 3 vies</b>
      <p class="lead" style="margin:6px 0 0">L’app te jette une boîte et une tonalité au hasard, et te demande un degré : <b>touche-le</b>. Juste = ton combo monte (×2, ×3, ×4). Faux = une vie en moins. Trois vies, et c’est fini.</p>
      <div class="statgrid" style="margin-top:10px">
        <div class="stat"><b>${best}</b><small>record</small></div>
        <div class="stat"><b>${duelRank(best)}</b><small>rang</small></div>
        <div class="stat"><b>${bxMastered()}/5</b><small>boîtes sues</small></div></div>`;
    inner.appendChild(intro);
    const arena=el('div','card'); inner.appendChild(arena);
    const go=el('button','btn','▶ En garde'); go.onclick=()=>runDuel(arena); arena.appendChild(go);
    inner.appendChild(el('div','theory',`<div class="tip">Astuce : ne cherche pas la note « en comptant ». Repère d’abord <b>la fondamentale</b> dans la fenêtre, puis attrape le degré <b>par la forme</b> — c’est comme ça qu’on va vite.</div>`));
  });
}
function runDuel(host){
  const DUR=60;
  let score=0, combo=0, lives=3, hits=0, miss=0, t0=performance.now(), over=false;
  const unlocked=[0,1,2,3,4].filter(i=>bx(i).lvl>=1);
  const pool = unlocked.length?unlocked:[0];
  let bi=0, root=9, want=0, cells=[], qt0=0;
  host.innerHTML='';
  const hud=el('div','duelhud'); host.appendChild(hud);
  const head=el('div','qhead'); host.appendChild(head);
  const holder=el('div'); host.appendChild(holder);
  const foot=el('div'); host.appendChild(foot);
  function hudDraw(){ const left=Math.max(0,DUR-(performance.now()-t0)/1000);
    hud.innerHTML=`<div class="dh"><b>${score}</b><small>score</small></div>
      <div class="dh"><b style="color:${combo>=3?'var(--acc)':'var(--txt)'}">×${Math.min(4,1+Math.floor(combo/3))}</b><small>combo ${combo}</small></div>
      <div class="dh"><b>${'❤️'.repeat(lives)||'—'}</b><small>vies</small></div>
      <div class="dh"><b class="bigtimer" style="color:${left<10?'var(--bad)':'var(--txt)'}">${left.toFixed(1)}</b><small>secondes</small></div>`;
    if(left<=0 && !over) finish();
  }
  function nextQ(){
    bi=pool[Math.floor(Math.random()*pool.length)];
    root=[9,4,2,7,0,5,11,10,3,8,6,1][Math.floor(Math.random()*(bxMastered()>=2?12:6))];
    cells=boxCells(root,bi);
    const ivs=PENTA_M.filter(v=>v!==want); want=ivs[Math.floor(Math.random()*ivs.length)];
    holder.innerHTML='';
    const box=buildBox(boxLow(root,bi),(s,f)=>tap(s,f,box)); holder.appendChild(box);
    cells.forEach(c=>box.dot(c.s,c.f,'','on'));
    head.innerHTML=`<div class="sub">${BOXES[bi].n} · <b>${NOTES[root]} mineur</b></div>
      <div class="q" style="font-size:34px">${DEG_PENTA[want]}</div>
      <div class="sub">${DEG_LONG[want]}</div>`;
    qt0=performance.now();
  }
  function tap(s,f,box){
    if(over) return; pluck(midiAt(s,f));
    const pc=midiAt(s,f)%12, inBox=cells.some(c=>c.s===s&&c.f===f);
    if(inBox && pc===(root+want)%12){
      const fast=(performance.now()-qt0)<2200;
      const mult=Math.min(4,1+Math.floor(combo/3));
      score+=(fast?15:10)*mult; combo++; hits++;
      box.flash(s,f,'good'); box.dot(s,f,DEG_PENTA[want],'okd');
      if(combo===3||combo===6||combo===9||combo===12) toast('🔥 combo ×'+Math.min(4,1+Math.floor(combo/3)));
      setTimeout(()=>{ if(!over) nextQ(); },230);
    } else {
      combo=0; lives--; miss++;
      box.flash(s,f,'bad'); const d=box.dot(s,f,'✗','no');
      const good=cells.filter(c=>c.pc===(root+want)%12);
      good.forEach(c=>box.dot(c.s,c.f,DEG_PENTA[want],'miss'));
      if(lives<=0){ setTimeout(finish,700); }
      else setTimeout(()=>{ if(!over) nextQ(); },900);
    }
    hudDraw();
  }
  function finish(){ if(over) return; over=true; if(_duelT){clearInterval(_duelT);_duelT=null;}
    const isBest=score>(S.duelBest||0); if(isBest) S.duelBest=score;
    S.xp+=Math.round(score/20); save();
    holder.innerHTML=''; head.innerHTML='';
    hud.innerHTML='';
    const r=el('div','card'); r.style.borderColor='var(--acc)';
    r.innerHTML=`<div class="qhead"><div class="q" style="font-size:38px">${score}</div>
      <div class="sub">${hits} touches · ${miss} raté(s) · rang <b style="color:var(--acc)">${duelRank(score)}</b>${isBest?' · 🏆 <b>nouveau record</b>':''}</div></div>
      <p class="lead" style="margin:10px 0 0">${score>=800?'Ta main sait où sont les notes. C’est exactement ce qu’on cherchait.':score>=350?'Bon rythme. Le combo est là où le score se fait : enchaîne sans te précipiter, une faute casse tout.':'Normal au début : cherche la <b>fondamentale</b> d’abord, le reste est une forme. Refais-en 3 d’affilée.'}<br><b style="color:var(--acc)">+${Math.round(score/20)} XP</b></p>`;
    host.innerHTML=''; host.appendChild(r);
    const again=el('button','btn','↻ Revanche'); again.onclick=()=>runDuel(host); host.appendChild(again);
    const back=el('button','btn ghost','← La Conquête'); back.onclick=()=>openConquete(); host.appendChild(back);
  }
  if(_duelT) clearInterval(_duelT); _duelT=setInterval(hudDraw,100);
  nextQ(); hudDraw();
}

/* ================================================================
   LE JUKE-BOX — les gammes sur des VRAIS morceaux.
   Chaque morceau : sa tonalité, sa gamme, sa grille jouée en boucle
   par l’app, et LA note à viser quand tel accord passe. C’est le
   chaînon manquant entre « je connais mes boîtes » et « je joue ».
   ================================================================ */
const SC_DEF={
  pm:{n:'penta mineure', iv:[0,3,5,7,10], fam:'Penta mineure'},
  aeo:{n:'mineure naturelle (éolien)', iv:[0,2,3,5,7,8,10], fam:'Penta mineure'},
  PM:{n:'penta majeure', iv:[0,2,4,7,9], fam:'Penta majeure'},
  maj:{n:'majeure', iv:[0,2,4,5,7,9,11], fam:'Penta majeure'},
  dor:{n:'dorien', iv:[0,2,3,5,7,9,10], fam:'Dorien'},
  mix:{n:'mixolydien', iv:[0,2,4,5,7,9,10], fam:'Mixolydien'},
  lyd:{n:'lydien', iv:[0,2,4,6,7,9,11], fam:'Lydien'},
  phr:{n:'phrygien', iv:[0,1,3,5,7,8,10], fam:'Phrygien'},
  phrD:{n:'phrygien dominant', iv:[0,1,4,5,7,8,10], fam:'Phrygien'},
  blu:{n:'gamme blues', iv:[0,3,5,6,7,10], fam:'Blues'},
  har:{n:'mineure harmonique', iv:[0,2,3,5,7,8,11], fam:'Harmonique'}
};
const JB_FAMS=['Penta mineure','Penta majeure','Dorien','Mixolydien','Lydien','Phrygien','Blues','Harmonique'];
/* ch : [fondamentale 0-11, type] par mesure · exact:false = boucle d’entraînement
   dans la tonalité (pas la grille note pour note du disque) */
const JUKE=[
 {id:'lonelyday', ic:'🖤', t:'Lonely Day', a:'System of a Down', star:1, root:8, key:'Sol♯ mineur', sc:'pm', diff:1, bpm:88, exact:1,
  ch:[[8,'min'],[4,'maj'],[11,'maj'],[3,'dom7']],
  aim:[7,'Sur le <b>Ré♯7</b> (le dernier accord), vise le <b>Sol</b> — c’est sa tierce majeure, et c’est la note qui tire vers le retour au Sol♯m. Hors penta : c’est exactement la note qui fait « pro ».'],
  why:'Ta découverte. La boucle est <b>i – ♭VI – ♭III – V7</b> : trois accords tout droit sortis de Sol♯ mineur, plus un Ré♯7 emprunté au mineur harmonique. C’est pour ça que la penta mineure de Sol♯ passe sur tout — et que le Ré♯7 sonne « tendu » : lui seul contient une note étrangère.',
  tune:'SOAD accorde très bas. Si ta version sonne plus grave, ce n’est pas toi : garde la <b>forme</b> et déplace-la (la Boussole te donne la tonique à l’oreille).'},
 {id:'change', ic:'🪰', t:'Change (In the House of Flies)', a:'Deftones', root:0, key:'Do mineur', sc:'pm', diff:1, bpm:96, exact:1,
  ch:[[0,'min'],[0,'min'],[5,'min'],[5,'min']],
  aim:[3,'Vise le <b>Mi♭</b> (la ♭3) et <b>tiens-la</b>. Le son Deftones, ce n’est pas des notes rapides : c’est une note tenue au-dessus d’un mur.'],
  why:'Deux accords, <b>Dom – Fam</b> (i – iv) : le minimum absolu, et c’est ce qui laisse toute la place. Avec si peu d’harmonie, ce qui compte n’est plus QUELLE note mais <b>combien de temps</b> tu la laisses sonner.',
  tune:'Accordage bas (drop C). En accordage standard, joue-le en <b>Mi mineur</b> : mêmes rapports, mêmes formes, juste plus haut.'},
 {id:'teenspirit', ic:'💥', t:'Smells Like Teen Spirit', a:'Nirvana', root:5, key:'Fa mineur', sc:'pm', diff:1, bpm:117, exact:1,
  ch:[[5,'min'],[10,'min'],[8,'maj'],[1,'maj']],
  aim:[8,'Le <b>La♭</b> (la ♭3) est aussi la fondamentale du 3<sup>e</sup> accord : atterris dessus quand il arrive, ça « colle » d’un coup.'],
  why:'<b>i – iv – ♭III – ♭VI</b> en power chords : la boucle mineure la plus jouée des années 90. Le solo de Kurt, c’est la mélodie du chant — preuve qu’un solo n’a pas besoin d’être une démonstration.',
  tune:''},
 {id:'comeasyouare', ic:'🌊', t:'Come As You Are', a:'Nirvana', root:6, key:'Fa♯ mineur', sc:'aeo', diff:1, bpm:120, exact:0,
  ch:[[6,'min'],[6,'min'],[9,'maj'],[11,'min']],
  aim:[4,'Le riff descend la gamme mineure. Repère le <b>Mi</b> (la ♭7) : c’est la note qui donne son côté « mou », résigné.'],
  why:'Le riff EST la gamme : Fa♯ mineur naturelle jouée note à note. Le meilleur exercice de gamme du monde, parce que tu l’as déjà dans l’oreille depuis dix ans.',
  tune:'Kurt accorde un TON plus bas (Ré Sol Do Fa La Ré) : sur le disque ça sonne en <b>Mi mineur</b>. En accordage standard, joue-le en Fa♯ mineur — c’est l’accordage, pas toi.'},
 {id:'likeastone', ic:'🪨', t:'Like a Stone', a:'Audioslave', root:9, key:'La mineur', sc:'pm', diff:1, bpm:100, exact:1,
  ch:[[9,'min'],[7,'maj'],[4,'min'],[5,'maj']],
  aim:[9,'Sur le <b>Fa</b>, ta fondamentale La est SA tierce : reste dessus, ça sonne plein et triste à la fois. Le truc de Cornell.'],
  why:'<b>i – ♭VII – v – ♭VI</b> : que du diatonique de La mineur, donc la penta mineure de La ne peut pas se tromper. C’est le morceau idéal pour ton premier vrai solo lent.',
  tune:''},
 {id:'zombie', ic:'🪖', t:'Zombie', a:'The Cranberries', root:4, key:'Mi mineur', sc:'aeo', diff:1, bpm:84, exact:1,
  ch:[[4,'min'],[0,'maj'],[7,'maj'],[2,'maj']],
  aim:[6,'Sur le <b>Ré</b>, vise le <b>Fa♯</b> : sa tierce. Elle est DANS la gamme de Mi mineur mais PAS dans la penta — ta première note « en plus ».'],
  why:'<b>i – ♭VI – ♭III – ♭VII</b> : la boucle mineure la plus jouée de la planète (tu la retrouveras dans des centaines de morceaux). Parfaite pour apprendre à sortir de la penta d’une seule note.',
  tune:''},
 {id:'nothingelse', ic:'🖤', t:'Nothing Else Matters', a:'Metallica', root:4, key:'Mi mineur', sc:'aeo', diff:1, bpm:70, exact:1,
  ch:[[4,'min'],[2,'maj'],[0,'maj']],
  aim:[11,'Sur le <b>Ré</b>, le <b>Fa♯</b> ; sur le <b>Do</b>, le <b>Mi</b> (ta fondamentale). Tenues, lentes. Ici la vitesse tue.'],
  why:'Em – Ré – Do : la descente ♭VII–♭VI, le cliché le plus émouvant du rock. À ce tempo, tu as le temps de <b>choisir</b> chaque note : c’est le meilleur terrain pour apprendre à viser.',
  tune:''},
 {id:'seven', ic:'🥁', t:'Seven Nation Army', a:'The White Stripes', root:4, key:'Mi mineur', sc:'pm', diff:1, bpm:124, exact:0,
  ch:[[4,'min'],[4,'min'],[0,'maj'],[7,'maj']],
  aim:[7,'Le riff, c’est <b>Mi – Sol – Mi – Ré – Do – Si</b> : cinq notes de la penta mineure de Mi, dans la boîte 1. Rejoue-le en le regardant comme une gamme.'],
  why:'Le riff le plus connu du siècle est une <b>penta mineure descendante</b>, jouée lentement. Quand on te dit qu’une gamme, ça fait de la musique — c’est littéralement ça.',
  tune:''},
 {id:'stairway', ic:'🪜', t:'Stairway to Heaven (le solo)', a:'Led Zeppelin', root:9, key:'La mineur', sc:'pm', diff:2, bpm:82, exact:1,
  ch:[[9,'min'],[7,'maj'],[5,'maj'],[9,'min']],
  aim:[0,'Page reste dans la <b>boîte 1</b> de La mineur presque tout le solo. Le <b>Do</b> (♭3) tenu avec vibrato, c’est sa signature.'],
  why:'Le solo modèle : une seule boîte, des motifs répétés, une montée d’intensité. Preuve qu’un grand solo se construit avec <b>peu de matériel</b> et beaucoup d’intention.',
  tune:''},
 /* ---- majeur / penta majeure ---- */
 {id:'sweetchild', ic:'🌹', t:'Sweet Child o’ Mine', a:'Guns N’ Roses', root:2, key:'Ré majeur', sc:'PM', diff:2, bpm:126, exact:1,
  ch:[[2,'maj'],[0,'maj'],[7,'maj'],[2,'maj']],
  aim:[6,'Le <b>Fa♯</b> (la tierce majeure) est la note qui rend tout ça joyeux. En penta MAJEURE, tu l’as sous les doigts en permanence.'],
  why:'Même forme que ta penta mineure — mais posée trois cases plus bas. Penta majeure de Ré = penta mineure de Si. <b>Une forme apprise, deux gammes.</b>',
  tune:'Slash accorde un demi-ton plus bas ; en standard, c’est en Ré.'},
 {id:'wishyou', ic:'🔥', t:'Wish You Were Here', a:'Pink Floyd', root:7, key:'Sol majeur', sc:'PM', diff:1, bpm:120, exact:1,
  ch:[[0,'maj'],[2,'maj'],[9,'min'],[7,'maj']],
  aim:[11,'Vise le <b>Si</b> (la tierce de Sol) sur le dernier accord : c’est la note « qui rentre à la maison ».'],
  why:'Do – Ré – Lam – Sol : IV – V – ii – I en Sol majeur. Douce, ouverte, et la penta majeure de Sol y sonne comme une évidence. Le morceau parfait pour apprendre le majeur sans avoir l’air de faire un exercice.',
  tune:''},
 {id:'threelittle', ic:'🐦', t:'Three Little Birds', a:'Bob Marley', root:9, key:'La majeur', sc:'PM', diff:1, bpm:76, exact:1,
  ch:[[9,'maj'],[2,'maj'],[4,'maj'],[9,'maj']],
  aim:[1,'Le <b>Do♯</b> (tierce majeure) : c’est LA note du sourire. Reste dessus, tu ne peux pas sonner triste.'],
  why:'<b>I – IV – V</b>, les trois accords voisins. Le plus doux terrain d’entraînement pour la penta majeure : trois accords, aucun piège, et le contretemps te force à respirer.',
  tune:''},
 {id:'creep', ic:'🕳', t:'Creep', a:'Radiohead', root:7, key:'Sol majeur', sc:'maj', diff:2, bpm:92, exact:1,
  ch:[[7,'maj'],[11,'maj'],[0,'maj'],[0,'min']],
  aim:[3,'Le <b>Mi♭</b> du dernier accord (Dom). Il n’appartient PAS à Sol majeur — c’est un accord <b>emprunté</b>, et c’est exactement ce qui fait le frisson. Vise-le quand il passe.'],
  why:'I – III – IV – <b>iv</b>. Le 2<sup>e</sup> accord (Si majeur) et le dernier (Do MINEUR) sont des intrus. Le meilleur exemple pour comprendre qu’une « fausse » note choisie exprès est la plus belle du morceau.',
  tune:''},
 /* ---- dorien ---- */
 {id:'oyecomova', ic:'🔥', t:'Oye Como Va', a:'Santana', root:9, key:'La dorien', sc:'dor', diff:2, bpm:112, exact:1,
  ch:[[9,'m7'],[2,'dom7']],
  aim:[6,'Le <b>Fa♯</b> — la sixte MAJEURE. C’est elle, et elle seule, qui fait la différence entre « mineur triste » et « mineur cool ».'],
  why:'Deux accords : Am7 – D7. Le Ré7 contient un Fa♯, alors qu’un La mineur « normal » aurait un Fa naturel. Ce Fa♯ = le dorien. <b>Écoute-le, puis joue le Fa naturel : tu entendras la couleur s’éteindre.</b>',
  tune:''},
 {id:'getlucky', ic:'🕺', t:'Get Lucky', a:'Daft Punk', root:11, key:'Si dorien', sc:'dor', diff:2, bpm:116, exact:1,
  ch:[[11,'min'],[2,'maj'],[6,'min'],[4,'maj']],
  aim:[8,'Le <b>Sol♯</b>, apporté par le Mi majeur. Un IV MAJEUR dans un morceau mineur = signature du dorien.'],
  why:'Bm – Ré – F♯m – Mi. Si le morceau était en Si mineur naturel, le 4<sup>e</sup> accord serait un Mi MINEUR. Il est majeur : voilà pourquoi ça groove au lieu de pleurer.',
  tune:''},
 {id:'wicked', ic:'🌘', t:'Wicked Game', a:'Chris Isaak', root:11, key:'Si dorien', sc:'dor', diff:1, bpm:112, exact:1,
  ch:[[11,'min'],[9,'maj'],[4,'maj']],
  aim:[8,'Même note-clé que Get Lucky : le <b>Sol♯</b> du Mi majeur. Joue-la longue, avec du trémolo — c’est tout le morceau.'],
  why:'Bm – La – Mi, en boucle, sans fin. Trois accords, une ambiance : la démonstration que le <b>son</b> (réverbe, notes tenues, contraste doux/fort) compte autant que les notes. Ton terrain.',
  tune:''},
 {id:'sowhat', ic:'🎺', t:'So What', a:'Miles Davis', root:2, key:'Ré dorien', sc:'dor', diff:3, bpm:130, exact:1,
  ch:[[2,'m7'],[2,'m7'],[3,'m7'],[2,'m7']],
  aim:[11,'Le <b>Si</b> naturel (la 6te majeure). Sur le Mi♭m7 du pont, tout glisse d’un demi-ton : même gamme, un cran plus haut.'],
  why:'Le jazz modal : <b>un seul accord</b> pendant 8 mesures. Plus rien ne t’aide, plus rien ne te gêne — tu ne peux compter que sur tes phrases. L’examen final de l’impro.',
  tune:''},
 {id:'brick', ic:'🧱', t:'Another Brick in the Wall (le solo)', a:'Pink Floyd', root:2, key:'Ré mineur / dorien', sc:'dor', diff:2, bpm:104, exact:0,
  ch:[[2,'min'],[2,'min'],[0,'maj'],[0,'maj']],
  aim:[7,'Gilmour vise des notes <b>tenues et bendées</b>. Prends le <b>Sol</b> (la 4te) et bende-la vers le La : c’est son geste signature.'],
  why:'Le solo le plus « chantant » du rock, sur une boucle minimale. Leçon : <b>une note bien pliée vaut dix notes rapides</b>.',
  tune:''},
 /* ---- mixolydien ---- */
 {id:'sweethome', ic:'🏡', t:'Sweet Home Alabama', a:'Lynyrd Skynyrd', root:2, key:'Ré mixolydien', sc:'mix', diff:2, bpm:98, exact:1,
  ch:[[2,'maj'],[0,'maj'],[7,'maj']],
  aim:[0,'Le <b>Do naturel</b> (la ♭7). Dans Ré MAJEUR il y aurait un Do♯ — ici non, et c’est exactement le grain « sudiste ».'],
  why:'Ré – Do – Sol : I – ♭VII – IV. Le ♭VII (l’accord de Do) est impossible en majeur pur : c’est la carte d’identité du mixolydien. Tout le rock sudiste et une moitié des Stones vivent là-dedans.',
  tune:''},
 {id:'sympathy', ic:'😈', t:'Sympathy for the Devil', a:'The Rolling Stones', root:4, key:'Mi mixolydien', sc:'mix', diff:2, bpm:116, exact:1,
  ch:[[4,'maj'],[2,'maj'],[9,'maj'],[4,'maj']],
  aim:[8,'Le <b>Sol♯</b> (tierce MAJEURE) contre le <b>Ré</b> (♭7) : les deux ensemble, c’est le son Richards. Passe de l’un à l’autre.'],
  why:'Mi – Ré – La – Mi : I – ♭VII – IV. Même formule que Sweet Home Alabama, autre planète. Preuve qu’un mode n’est pas un style : c’est une palette.',
  tune:''},
 {id:'backinblack', ic:'⚫', t:'Back in Black', a:'AC/DC', root:4, key:'Mi (mixo / blues)', sc:'mix', diff:2, bpm:92, exact:1,
  ch:[[4,'maj'],[2,'maj'],[9,'maj']],
  aim:[8,'Le mouvement <b>Sol → Sol♯</b> (♭3 vers 3). Glisse ou bende de l’un à l’autre : c’est LE son du rock, et c’est ton fameux « éclairage ».'],
  why:'Angus joue la penta MINEURE de Mi sur des accords MAJEURS. Cette friction ♭3/3 est tout le rock’n’roll. Le morceau idéal pour installer le réflexe du bend d’un demi-ton.',
  tune:''},
 /* ---- lydien ---- */
 {id:'simpsons', ic:'🍩', t:'Le thème des Simpson', a:'Danny Elfman', root:0, key:'Do lydien', sc:'lyd', diff:2, bpm:110, exact:0,
  ch:[[0,'maj7'],[2,'maj']],
  aim:[6,'Le <b>Fa♯</b> — la quarte AUGMENTÉE. Toute la couleur « décalée, magique » tient dans cette seule note.'],
  why:'Un accord de Do avec un Ré majeur par-dessus : le Ré majeur apporte le Fa♯, et voilà le lydien. Le mode du cinéma (Elfman, Williams) : ça flotte, ça ne se pose jamais vraiment.',
  tune:''},
 {id:'dreams', ic:'🌫', t:'Dreams', a:'Fleetwood Mac', root:5, key:'Fa lydien', sc:'lyd', diff:1, bpm:120, exact:1,
  ch:[[5,'maj7'],[7,'maj']],
  aim:[11,'Le <b>Si</b> naturel (♯4), amené par l’accord de Sol. Fa majeur « normal » aurait un Si♭ : compare les deux, la bascule est immédiate.'],
  why:'<b>Deux accords, tout le morceau</b> : Famaj7 – Sol. Le meilleur bac à sable lydien qui existe — tu as tout le temps du monde pour écouter ce que fait le Si.',
  tune:''},
 /* ---- phrygien ---- */
 {id:'roam', ic:'🐍', t:'Wherever I May Roam', a:'Metallica', root:4, key:'Mi phrygien', sc:'phr', diff:2, bpm:110, exact:0,
  ch:[[4,'min'],[5,'maj'],[4,'min'],[5,'maj']],
  aim:[5,'Le <b>Fa</b> — la ♭2, collée à la fondamentale. Joue Mi puis Fa puis Mi : cette demi-marche, c’est tout l’Orient dans deux notes.'],
  why:'Un Mi mineur suivi d’un Fa MAJEUR : impossible en mineur normal. Ce ♭II est la signature du phrygien (et le solo bascule en phrygien dominant, avec une tierce majeure en plus).',
  tune:''},
 {id:'misirlou', ic:'🏄', t:'Misirlou', a:'Dick Dale (Pulp Fiction)', root:4, key:'Mi phrygien dominant', sc:'phrD', diff:3, bpm:170, exact:0,
  ch:[[4,'maj'],[5,'maj'],[4,'maj'],[4,'maj']],
  aim:[8,'La tierce <b>MAJEURE</b> (Sol♯) juste au-dessus d’une ♭2 (Fa) : cet écart d’un ton et demi entre Fa et Sol♯, c’est LE son « oriental ».'],
  why:'Le phrygien dominant = le 5<sup>e</sup> mode du mineur harmonique. Une ♭2 sombre + une tierce majeure claire dans la même gamme : le mélange impossible qui fait le flamenco, le metal oriental et la surf music.',
  tune:''},
 /* ---- blues ---- */
 {id:'blues12', ic:'🎺', t:'Le blues en 12 mesures (en La)', a:'la grille reine', root:9, key:'La', sc:'blu', diff:1, bpm:92, exact:1,
  ch:[[9,'dom7'],[9,'dom7'],[9,'dom7'],[9,'dom7'],[2,'dom7'],[2,'dom7'],[9,'dom7'],[9,'dom7'],[4,'dom7'],[2,'dom7'],[9,'dom7'],[4,'dom7']],
  aim:[1,'Sur le <b>La7</b>, vise le <b>Do♯</b> ; sur le Ré7, le <b>Fa♯</b> ; sur le Mi7, le <b>Sol♯</b>. Chaque fois : la tierce de l’accord qui passe.'],
  why:'La penta mineure de La passe sur les 12 mesures — mais viser la tierce de chaque accord, c’est ce qui sépare « je joue une gamme » de « je joue les changements ».',
  tune:''},
 {id:'thrill', ic:'👑', t:'The Thrill Is Gone', a:'B.B. King', root:11, key:'Si mineur', sc:'pm', diff:2, bpm:80, exact:1,
  ch:[[11,'min'],[11,'min'],[4,'min'],[11,'min'],[7,'maj'],[6,'dom7'],[11,'min'],[11,'min']],
  aim:[10,'Sur le <b>Fa♯7</b>, vise le <b>La♯</b> : sa tierce, une note étrangère à Si mineur qui crée toute la tension avant le retour.'],
  why:'Le blues MINEUR (différent du blues à trois accords) : i – iv – ♭VI – V7. B.B. joue trois notes par phrase et laisse tout respirer. Écoute le silence autant que les notes.',
  tune:''},
 {id:'cometogether', ic:'🚶', t:'Come Together', a:'The Beatles', root:2, key:'Ré mineur', sc:'pm', diff:1, bpm:82, exact:0,
  ch:[[2,'min'],[2,'min'],[9,'dom7'],[7,'dom7']],
  aim:[5,'Le riff tourne autour du <b>Fa</b> (♭3) et du Ré. Joue-le très près du manche, mollement : le groove est dans la mollesse.'],
  why:'Encore un riff qui n’est qu’une penta mineure. Trois morceaux d’époques différentes (Beatles, White Stripes, Nirvana), la même gamme : c’est le meilleur argument pour la travailler.',
  tune:''},
 {id:'heyjoe', ic:'🔫', t:'Hey Joe', a:'Jimi Hendrix', root:4, key:'Mi (blues)', sc:'blu', diff:2, bpm:80, exact:1,
  ch:[[0,'maj'],[7,'maj'],[2,'maj'],[9,'maj'],[4,'maj']],
  aim:[10,'La <b>♭5</b> (Si♭) en passage rapide : jamais tenue, juste traversée. C’est la « blue note », le grain sale.'],
  why:'Do – Sol – Ré – La – Mi : la grille descend le <b>cycle des quintes</b>, chaque accord tire vers le suivant. Hendrix improvise en Mi blues par-dessus sans jamais changer de gamme — le morceau parfait pour comprendre qu’une gamme peut tenir sur des accords très mobiles.',
  tune:''},
 /* ---- mineur harmonique ---- */
 {id:'hotel', ic:'🏨', t:'Hotel California', a:'Eagles', root:11, key:'Si mineur', sc:'har', diff:3, bpm:74, exact:1,
  ch:[[11,'min'],[6,'maj'],[9,'maj'],[4,'maj'],[7,'maj'],[2,'maj'],[4,'min'],[6,'maj']],
  aim:[10,'Sur le <b>Fa♯ majeur</b> (le V), vise le <b>La♯</b>. C’est la 7<sup>e</sup> RELEVÉE du mineur harmonique — la note qui donne cette couleur espagnole/dramatique.'],
  why:'Huit accords, et un seul intrus : le Fa♯ MAJEUR (au lieu de Fa♯ mineur). Cet accord vient du mineur harmonique et c’est lui qui rend la boucle inoubliable. Le solo final de Felder/Walsh vise cette note à chaque tour.',
  tune:''}
];
function jbScale(s){ return SC_DEF[s.sc]; }
function jbDone(id){ return !!(S.jb&&S.jb[id]); }
function jbCount(){ return S.jb?Object.keys(S.jb).length:0; }

/* ---------------- la boucle d’accompagnement ---------------- */
const CH_IV={maj:[0,4,7,12],min:[0,3,7,12],dom7:[0,4,7,10],m7:[0,3,7,10],maj7:[0,4,7,11]};
const CH_SUF={maj:'',min:'m',dom7:'7',m7:'m7',maj7:'maj7'};
const Loop={ on:false, timer:null, ctx:null, prog:null, bpm:90, spb:.66, bar:0, next:0, cb:null,
  midis(pc,type){ const b=40+((pc-4)%12+12)%12; return (CH_IV[type]||CH_IV.maj).map(i=>b+i); },
  start(prog,bpm,cb){ this.stop(); const ctx=ac(); this.ctx=ctx; this.prog=prog; this.bpm=bpm; this.cb=cb;
    this.spb=60/bpm; this.bar=0; this.next=ctx.currentTime+.15; this.on=true;
    this.timer=setInterval(()=>this._sched(),40); this._sched(); },
  _sched(){ if(!this.on) return; const ctx=this.ctx;
    while(this.next < ctx.currentTime+.35){
      const c=this.prog[this.bar%this.prog.length], ms=this.midis(c[0],c[1]), d=this.next-ctx.currentTime;
      ms.forEach((m,k)=>pluck(m,this.spb*3.4,.30,d+k*.030));
      ms.slice(1).forEach((m,k)=>pluck(m,this.spb*2.2,.17,d+2*this.spb+k*.026));
      if(this.cb){ const b=this.bar; setTimeout(()=>{ if(this.on&&this.cb) this.cb(b%this.prog.length); },Math.max(0,d*1000)); }
      this.next+=4*this.spb; this.bar++;
    } },
  stop(){ this.on=false; if(this.timer){ clearInterval(this.timer); this.timer=null; } this.cb=null; }
};

/* ---------------- l’écran Juke-box ---------------- */
function openJukebox(fam){
  ac(); markDay(); Loop.stop();
  let cur=fam||null;
  openOverlay('Le Juke-box', inner=>{
    inner.appendChild(el('p','lead','Des vrais morceaux, rangés <b>par gamme</b>. Pour chacun : la tonalité, la gamme à poser, la grille jouée en boucle par l’app — et LA note à viser quand tel accord passe. C’est ici que les boîtes deviennent de la musique.'));
    const st=el('div','card'); st.style.borderColor='var(--acc)';
    st.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:baseline"><b>${jbCount()}/${JUKE.length} morceaux validés</b><span style="color:var(--acc);font-weight:800">${Math.round(100*jbCount()/JUKE.length)}%</span></div>
      <div class="bxbar"><i style="width:${Math.round(100*jbCount()/JUKE.length)}%"></i></div>
      <p class="lead" style="margin:8px 0 0">Un morceau se valide quand tu as improvisé dessus <b>et que ça sonnait</b> — pas quand tu l’as lu.</p>`;
    inner.appendChild(st);
    const fr=el('div','toolrow');
    const all=el('div','tag'+(cur?'':' on'),'Tout'); all.onclick=()=>{ Loop.stop(); openJukebox(null); }; fr.appendChild(all);
    JB_FAMS.forEach(f=>{ const n=JUKE.filter(s=>SC_DEF[s.sc].fam===f).length; if(!n) return;
      const t=el('div','tag'+(cur===f?' on':''),f+' · '+n); t.onclick=()=>{ Loop.stop(); openJukebox(f); }; fr.appendChild(t); });
    inner.appendChild(fr);
    const list=cur?JUKE.filter(s=>SC_DEF[s.sc].fam===cur):JUKE;
    let lastFam=null;
    list.forEach(s=>{ const f=SC_DEF[s.sc].fam;
      if(f!==lastFam && !cur){ lastFam=f; const h=el('h1','page',f); h.style.cssText='font-size:15px;color:var(--acc);margin:16px 0 8px'; inner.appendChild(h); }
      const c=el('div','catcard'); const d=jbDone(s.id);
      c.innerHTML=`<div class="ico">${s.ic}</div><div class="t"><b>${d?'✓ ':''}${s.t}${s.star?' ⭐':''}</b>
        <small>${s.a} · <b style="color:var(--acc)">${s.key}</b> · ${SC_DEF[s.sc].n} · ${'◆'.repeat(s.diff)}</small></div><div class="pc">›</div>`;
      if(d) c.style.opacity='.7';
      c.onclick=()=>openSong(s); inner.appendChild(c); });
  });
}
function openSong(s){
  ac(); markDay(); Loop.stop();
  const SC=SC_DEF[s.sc], pcs=pcsFrom(s.root,SC.iv);
  openOverlay(s.t, inner=>{
    const h=el('div','card'); h.style.borderColor='var(--acc)';
    h.innerHTML=`<b style="font-size:17px">${s.ic} ${s.t}</b><div style="color:var(--dim);font-size:13px;margin-top:2px">${s.a}</div>
      <div class="statgrid" style="margin-top:10px">
        <div class="stat"><b style="font-size:15px">${s.key}</b><small>tonalité</small></div>
        <div class="stat"><b style="font-size:15px">${SC.n}</b><small>ta gamme</small></div>
        <div class="stat"><b style="font-size:15px">${s.bpm}</b><small>BPM</small></div></div>`;
    inner.appendChild(h);

    /* la grille + la boucle */
    const g=el('div','card'); g.appendChild(el('b',null,'🎛 La grille'+(s.exact?'':' <span style="color:var(--dim);font-weight:600;font-size:12px">(boucle d’entraînement dans la tonalité, pas la grille exacte du disque)</span>')));
    const grid=el('div','g12'); grid.style.gridTemplateColumns='repeat('+Math.min(4,s.ch.length)+',1fr)';
    const cellEls=s.ch.map((c,i)=>{ const e=el('div','cell'+(i?'':' iv'),NOTES[c[0]]+CH_SUF[c[1]]); grid.appendChild(e); return e; });
    g.appendChild(grid);
    const pb=el('button','btn','▶ Lancer la boucle');
    pb.onclick=()=>{ if(Loop.on){ Loop.stop(); pb.textContent='▶ Lancer la boucle'; cellEls.forEach(e=>e.classList.remove('now')); }
      else { Loop.start(s.ch,s.bpm,bar=>{ cellEls.forEach((e,i)=>e.classList.toggle('now',i===bar)); }); pb.textContent='■ Stop'; } };
    g.appendChild(pb);
    g.appendChild(el('p','lead','Lance la boucle, baisse le son de l’app si besoin, et joue par-dessus. Commence par <b>une seule note par mesure</b> — vraiment une seule.'));
    inner.appendChild(g);

    /* la gamme sur le manche */
    const sc=el('div','card'); sc.appendChild(el('b',null,'🎸 Ta palette'));
    const fb=buildFretboard((st,f)=>pluck(midiAt(st,f))); sc.appendChild(fb);
    const aimPc=s.aim?s.aim[0]:null;
    paintScale(fb,s.root,pcs,{labels:true,extra:aimPc!=null&&pcs.indexOf(aimPc)<0?aimPc:null,char:aimPc!=null&&pcs.indexOf(aimPc)>=0?aimPc:null});
    const info=el('div','clogic');
    info.innerHTML=`<div class="deg">${SC.n} de ${NOTES[s.root]}</div>Notes : ${pcs.map(p=>NOTES[p]).join(' · ')}.
      En <b style="color:var(--bad)">rouge</b> la fondamentale${aimPc!=null?`, en <b style="color:var(--blue)">bleu</b> le <b>${NOTES[aimPc]}</b> — la note à viser`:''}.`;
    sc.appendChild(info);
    const pl=el('button','btn ghost','🔊 Écouter la gamme'); pl.onclick=()=>playScaleUp(s.root,SC.iv); sc.appendChild(pl);
    if(s.sc==='pm'||s.sc==='aeo'){ const bb=el('button','btn ghost','🗺 Voir la boîte 1 dans cette tonalité');
      bb.onclick=()=>{ Loop.stop(); openBoxLook(0,s.root); }; sc.appendChild(bb); }
    inner.appendChild(sc);

    if(s.aim) inner.appendChild(el('div','theory',`<h3>🎯 Quoi viser</h3><p>${s.aim[1]}</p>`));
    inner.appendChild(el('div','theory',`<h3>Pourquoi ça marche</h3><p>${s.why}</p>${s.tune?`<div class="tip">🎚 ${s.tune}</div>`:''}`));

    const v=el('div','card'); v.style.borderColor='var(--acc2)';
    if(jbDone(s.id)){ v.innerHTML=`<b>✓ Morceau validé</b><p class="lead" style="margin:6px 0 0">Tu l’as joué. Reviens-y quand tu veux — un morceau validé reste un terrain d’échauffement.</p>`; }
    else{
      v.innerHTML=`<b>✅ Valider ce morceau</b><p class="lead" style="margin:6px 0 10px">À cocher uniquement si tu as improvisé dessus <b>et que ça sonnait</b>. Sinon, ça ne compte pas — l’app ne peut pas t’entendre, donc l’honnêteté, c’est toi.</p>`;
      const b=el('button','btn','J’ai joué dessus, ça sonnait');
      b.onclick=()=>{ if(!S.jb)S.jb={}; S.jb[s.id]=today(); S.xp+=25; save(); toast('🎧 Morceau validé · +25 XP'); Loop.stop(); openSong(s); };
      v.appendChild(b);
    }
    inner.appendChild(v);
    const back=el('button','btn ghost','← Le Juke-box'); back.onclick=()=>{ Loop.stop(); openJukebox(SC.fam); }; inner.appendChild(back);
  });
}

/* ================================================================
   L’ONGLET GAMMES — la maison des gammes : conquête, arcade, terrain
   ================================================================ */
function renderGammes(){
  const m=document.getElementById('main'); m.innerHTML=''; markDay();
  m.appendChild(el('h1','page','Gammes'));
  m.appendChild(el('p','lead','Trois étages : tu <b>conquiers</b> les formes, tu les rends <b>réflexes</b>, tu les joues sur des <b>vrais morceaux</b>.'));
  const pct=bxPct(), mm=bxMastered(), due=bxDueList().length;
  const hero=el('div','card'); hero.style.borderColor='var(--acc)';
  hero.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:17px">🗺 La Conquête</b><span style="color:var(--acc);font-weight:800">${mm}/5 · ${pct}%</span></div>
    <div class="bxbar"><i style="width:${pct}%"></i></div>
    <p class="lead" style="margin:8px 0 0">${due?('🔁 <b style="color:var(--acc)">'+due+' boîte(s) à revoir aujourd’hui.</b>'):(mm>=5?'Les 5 boîtes sont à toi. Entretien + terrain.':'Les 5 boîtes de la penta mineure, une par une, 5 paliers chacune.')}</p>`;
  const hb=el('button','btn','Ouvrir la Conquête'); hb.onclick=()=>openConquete(); hero.appendChild(hb);
  m.appendChild(hero);
  const items=[
    ['🎯','Le Duel — 60 s, combo, 3 vies','L’arcade des degrés : l’app te jette une boîte et une tonalité, tu touches la note demandée. Record : '+(S.duelBest||0)+'.',()=>openDuel()],
    ['🎧','Le Juke-box — '+jbCount()+'/'+JUKE.length+' morceaux','Des vrais morceaux rangés par gamme, la grille jouée en boucle, et la note à viser. De Lonely Day à Hotel California.',()=>openJukebox()],
    ['🎸','La penta & les notes à viser','Le cours : les 5 notes, la ♭3 → 3, la blue note.',()=>openPentaModule()],
    ['🪜','La gamme majeure en positions','Les 5 positions = ta penta + 2 notes.',()=>openMajorPositions()],
    ['🎭','Les 7 modes, par ordre','Une couleur, une note caractéristique. Comparées sur la même fondamentale.',()=>openModesModule()],
    ['🧭','La Boussole','Perdu sur un morceau ? Trouve la tonique, puis la palette.',()=>openBoussole()],
    ['🎼','De la chanson au mode','« Ma chanson est en Mi mineur » → quelle gamme majeure, quelle position.',()=>openSongMode()],
  ];
  items.forEach(it=>{ const c=el('div','catcard',`<div class="ico">${it[0]}</div><div class="t"><b>${it[1]}</b><small>${it[2]}</small></div><div class="pc">›</div>`); c.onclick=it[3]; m.appendChild(c); });
}

/* ================================================================
   AUJOURD’HUI — la séance guidée du jour
   ================================================================ */
function sessToday(){ const t=today(); if(!S.sess||S.sess.date!==t){ S.sess={date:t,done:[]}; save(); } return S.sess; }
function sessDone(id){ return sessToday().done.indexOf(id)>=0; }
function sessMark(id){ const s=sessToday(); if(s.done.indexOf(id)<0){ s.done.push(id); S.xp+=5; save(); } }
/* ================================================================
   LE JOURNAL DE JEU — l’app ne compte plus que ce que tu JOUES.
   Constat qui a déclenché ce module : SHRED n’enregistrait aucun
   historique daté (que des records), ne t’entendait jamais, et
   distribuait de l’XP dans 16 endroits dont 2 seulement exigeaient
   la guitare en main. D’où « je ne progresse pas » : l’app mesurait
   des taps.
   Trois pièces, une seule idée :
   1. LE CHRONO — un bouton, guitare en main. Les minutes sont datées.
   2. LA COURBE — 28 jours de barres. Le progrès devient visible.
   3. LE TÉMOIN — 45 s enregistrées, la MÊME chose chaque semaine.
      C’est la seule chose qui produit la sensation « je me suis
      amélioré » : t’entendre il y a un mois.
   ================================================================ */
const GOAL_DEF=30;                       /* minutes/jour visées */
const TAKE_SECS=45, TAKE_MAX=24;         /* durée d’une prise, nb gardé */

/* ---- l’historique daté (localStorage : léger, sauvegardé par LE COFFRE) ---- */
function goal(){ return S.goal||GOAL_DEF; }
function dayRec(d){ if(!S.days)S.days={}; d=d||today(); if(!S.days[d]) S.days[d]={sec:0,tk:0}; return S.days[d]; }
function dayMin(d){ const r=(S.days||{})[d||today()]; return r?Math.round(r.sec/60):0; }
function addSec(s){ const r=dayRec(); r.sec+=s;
  const keys=Object.keys(S.days); if(keys.length>420){ keys.sort(); keys.slice(0,keys.length-400).forEach(k=>delete S.days[k]); }
  save(); }
const dayShift=(n)=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
function lastDays(n){ const out=[]; for(let i=n-1;i>=0;i--){ const d=dayShift(i); out.push({d,min:dayMin(d)}); } return out; }
function weekMin(off){ off=off||0; let s=0; for(let i=0;i<7;i++) s+=dayMin(dayShift(i+off*7)); return s; }
function daysPlayed(n){ return lastDays(n).filter(x=>x.min>0).length; }
function playStreak(){ let n=0, i=(dayMin(dayShift(0))>0?0:1);
  for(;i<400;i++){ if(dayMin(dayShift(i))>0) n++; else break; } return n; }

/* ---- le chrono : rien n’est jamais perdu, on écrit toutes les 15 s ---- */
const Sess={ on:false, t0:0, acc:0, tick:null,
  start(){ if(this.on) return; markDay(); this.on=true; this.t0=performance.now();
    this.tick=setInterval(()=>this.flush(),15000); },
  flush(){ if(!this.on) return; const now=performance.now(), d=now-this.t0; this.t0=now; this.acc+=d; addSec(d/1000); },
  pause(){ if(!this.on) return; this.flush(); this.on=false; if(this.tick){ clearInterval(this.tick); this.tick=null; } },
  ms(){ return this.acc + (this.on?(performance.now()-this.t0):0); },
  end(){ this.pause(); const s=Math.round(this.acc/1000); this.acc=0; return s; }
};

/* ---- les prises : métadonnées en localStorage, audio en IndexedDB ---- */
const TDB={ db:null,
  open(){ return new Promise((res,rej)=>{ if(this.db) return res(this.db);
    if(!window.indexedDB) return rej(new Error('pas d’IndexedDB'));
    const r=indexedDB.open('shred-takes',1);
    r.onupgradeneeded=()=>{ if(!r.result.objectStoreNames.contains('takes')) r.result.createObjectStore('takes'); };
    r.onsuccess=()=>{ this.db=r.result; res(this.db); }; r.onerror=()=>rej(r.error||new Error('IndexedDB refusé')); }); },
  async put(id,blob){ const db=await this.open(); return new Promise((res,rej)=>{ const t=db.transaction('takes','readwrite');
    t.objectStore('takes').put(blob,id); t.oncomplete=()=>res(true); t.onerror=()=>rej(t.error); }); },
  async get(id){ const db=await this.open(); return new Promise((res,rej)=>{ const t=db.transaction('takes','readonly');
    const q=t.objectStore('takes').get(id); q.onsuccess=()=>res(q.result||null); q.onerror=()=>rej(q.error); }); },
  async del(id){ const db=await this.open(); return new Promise((res)=>{ const t=db.transaction('takes','readwrite');
    t.objectStore('takes').delete(id); t.oncomplete=()=>res(true); t.onerror=()=>res(false); }); }
};
function takes(){ if(!S.takes) S.takes=[]; return S.takes; }
function takesOf(kind){ return takes().filter(t=>t.kind===kind).sort((a,b)=>b.ts-a.ts); }
async function pruneTakes(){ const all=takes().sort((a,b)=>b.ts-a.ts);
  if(all.length<=TAKE_MAX) return;
  const drop=all.slice(TAKE_MAX);
  for(const t of drop){ try{ await TDB.del(t.id); }catch(e){} }
  S.takes=all.slice(0,TAKE_MAX); save(); }

/* ---- l’enregistreur ---- */
const MIMES=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg'];
function recMime(){ if(!window.MediaRecorder) return null;
  for(const m of MIMES){ try{ if(MediaRecorder.isTypeSupported(m)) return m; }catch(e){} } return ''; }
function recSupported(){ return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder); }
const Rec={ mr:null, stream:null, chunks:[], stopT:null,
  async start(secs,onTick,onDone){
    this.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    const mime=recMime(); this.chunks=[];
    this.mr=mime?new MediaRecorder(this.stream,{mimeType:mime}):new MediaRecorder(this.stream);
    this.mr.ondataavailable=e=>{ if(e.data&&e.data.size) this.chunks.push(e.data); };
    this.mr.onstop=()=>{ const type=(this.mr&&this.mr.mimeType)||mime||'audio/webm';
      const blob=new Blob(this.chunks,{type}); this.cleanup(); onDone(blob); };
    this.mr.start();
    const t0=performance.now();
    this.stopT=setInterval(()=>{ const el=(performance.now()-t0)/1000;
      if(onTick) onTick(Math.min(secs,el));
      if(el>=secs) this.stop(); },100);
  },
  stop(){ if(this.stopT){ clearInterval(this.stopT); this.stopT=null; }
    if(this.mr && this.mr.state!=='inactive'){ try{ this.mr.stop(); }catch(e){ this.cleanup(); } } },
  cleanup(){ if(this.stopT){ clearInterval(this.stopT); this.stopT=null; }
    if(this.stream){ this.stream.getTracks().forEach(t=>t.stop()); this.stream=null; } this.mr=null; }
};

/* ---- LE TÉMOIN : la même chose, toutes les semaines ---- */
const TEMOINS=[
 {id:'t1', n:'Le squelette', d:'Boîte 1 de La mineur : monte et descends au métronome (ton tempo propre), <b>deux fois</b> — puis 20 s d’impro libre dans la même position.',
  why:'Le plus lisible : la régularité, la propreté des notes et l’aisance de l’impro s’entendent tout de suite d’une semaine à l’autre.'},
 {id:'t2', n:'Le lick blues', d:'Le « lick blues n°1 » (bend + blue note), <b>quatre fois</b> d’affilée, au même tempo, propre.',
  why:'Le plus exigeant techniquement : c’est le bend et le vibrato qui progressent, et ça ne se triche pas au micro.'},
 {id:'t3', n:'Le morceau', d:'45 s du morceau que tu travailles en ce moment, du début, sans t’arrêter même si tu te plantes.',
  why:'Le plus motivant : c’est du vrai répertoire. Ne t’arrête jamais — un enregistrement qu’on recommence ne mesure rien.'}
];
function temoinDef(){ return TEMOINS.find(t=>t.id===(S.temoin||'t1'))||TEMOINS[0]; }
function temoinLast(){ const l=takesOf('temoin')[0]; return l||null; }
function temoinDue(){ const l=temoinLast(); if(!l) return true;
  return (Date.now()-l.ts)/864e5 >= 7; }
function temoinDays(){ const l=temoinLast(); return l?Math.round((Date.now()-l.ts)/864e5):null; }

/* ---- l’écran d’enregistrement ---- */
function openTake(kind,label){
  markDay();
  openOverlay(kind==='temoin'?'Le témoin':'Une prise', inner=>{
    if(!recSupported()){
      inner.appendChild(el('div','card',`<b>🎙 Le micro n’est pas disponible ici</b>
        <p class="lead" style="margin:6px 0 0">Ton navigateur ne donne pas accès au micro (ou la page n’est pas en HTTPS). Ouvre l’app depuis <b>niclaeysthomas-ctrl.github.io/shred/</b> — et sur iPhone, garde Safari.</p>`));
      return;
    }
    const T=temoinDef();
    if(kind==='temoin'){
      inner.appendChild(el('div','theory',`
        <h3>${T.n}</h3><p>${T.d}</p>
        <div class="tip">Toujours <b>la même chose</b>, toutes les semaines. C’est la seule façon de comparer : un test qui change ne mesure rien. ${T.why}</div>
        <p style="color:var(--dim);font-size:13px">Pose le téléphone, joue comme tu joues — <b>ne recommence pas</b>. Une prise ratée est une donnée, pas un échec.</p>`));
    } else {
      inner.appendChild(el('p','lead','45 secondes, telles quelles. Pas de deuxième prise : ce qu’on veut garder, c’est ton niveau réel, pas ta meilleure tentative.'));
    }
    const arena=el('div','card'); inner.appendChild(arena);
    function ready(){
      arena.innerHTML='';
      arena.appendChild(el('div','qhead',`<div class="q" style="font-size:34px">${TAKE_SECS}s</div><div class="sub">le chrono s’arrête tout seul</div>`));
      const go=el('button','btn','🔴 Enregistrer'); go.onclick=()=>run(); arena.appendChild(go);
      const prev=kind==='temoin'?temoinLast():takesOf('libre')[0];
      if(prev){ const b=el('button','btn ghost','🎧 Écouter la dernière ('+prev.d+')');
        b.onclick=()=>openTakes(kind); arena.appendChild(b); }
    }
    function run(){
      arena.innerHTML='';
      const head=el('div','qhead',`<div class="q" style="font-size:40px;color:var(--bad)">● 0.0s</div><div class="sub">joue</div>`);
      arena.appendChild(head);
      const bar=el('div','bxbar'); const fill=el('i'); bar.appendChild(fill); arena.appendChild(bar);
      const stopB=el('button','btn ghost','■ Arrêter maintenant'); arena.appendChild(stopB);
      stopB.onclick=()=>Rec.stop();
      Rec.start(TAKE_SECS, s=>{ head.querySelector('.q').textContent='● '+s.toFixed(1)+'s'; fill.style.width=(100*s/TAKE_SECS)+'%'; },
        async blob=>{
          const id='tk'+Date.now(), ts=Date.now();
          let stored=false; try{ await TDB.put(id,blob); stored=true; }catch(e){}
          takes().push({id, ts, d:today(), secs:Math.round(blob.size?TAKE_SECS:0), kind, label:label||(kind==='temoin'?temoinDef().n:'prise libre'), ok:stored});
          dayRec().tk++; S.xp+=10; save(); pruneTakes();
          arena.innerHTML='';
          arena.appendChild(el('div','qhead',`<div class="q" style="color:var(--ok)">✓ gardée</div><div class="sub">${stored?'Elle t’attendra dans le journal.':'⚠️ le son n’a pas pu être stocké (navigation privée ?) — la trace de la séance, si.'}</div>`));
          if(stored){ const a=document.createElement('audio'); a.controls=true; a.style.cssText='width:100%;margin-top:12px';
            a.src=URL.createObjectURL(blob); arena.appendChild(a); }
          const cmp=kind==='temoin'?takesOf('temoin')[1]:null;
          if(cmp){ const b=el('button','btn','⚖️ Comparer avec celui d’il y a '+Math.round((Date.now()-cmp.ts)/864e5)+' jours');
            b.onclick=()=>openTakes('temoin'); arena.appendChild(b); }
          const back=el('button','btn ghost','← Retour'); back.onclick=()=>{ closeOverlay(); }; arena.appendChild(back);
        }).catch(e=>{
          arena.innerHTML='';
          arena.appendChild(el('div','card',`<b>🎙 Micro refusé</b><p class="lead" style="margin:6px 0 0">${(e&&e.message)||'accès refusé'}. Autorise le micro pour cette page, puis réessaie.</p>`));
          const b=el('button','btn ghost','← Retour'); b.onclick=()=>closeOverlay(); arena.appendChild(b);
        });
    }
    ready();
  });
}

/* ---- le journal des prises : écouter, comparer, supprimer ---- */
function openTakes(kind){
  openOverlay(kind==='temoin'?'Tes témoins':'Tes prises', inner=>{
    const list=takesOf(kind||'temoin');
    if(!list.length){ inner.appendChild(el('p','lead','Rien encore. Le premier témoin est le plus important : c’est ton point zéro.'));
      const b=el('button','btn','🔴 Enregistrer le premier'); b.onclick=()=>openTake(kind||'temoin'); inner.appendChild(b); return; }
    inner.appendChild(el('p','lead',kind==='temoin'
      ?'Le même exercice, semaine après semaine. <b>Écoute le plus ancien, puis le plus récent.</b> C’est ça, la preuve — pas une barre d’XP.'
      :'Tes prises libres, de la plus récente à la plus ancienne.'));
    list.forEach((t,i)=>{
      const c=el('div','card');
      const days=Math.round((Date.now()-t.ts)/864e5);
      c.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:baseline">
          <b>${t.label}</b><span style="color:var(--dim);font-size:12px">${t.d}${days>0?' · il y a '+days+' j':' · aujourd’hui'}</span></div>`;
      const holder=el('div'); c.appendChild(holder);
      const load=el('button','btn ghost','▶ Écouter');
      load.onclick=async()=>{ load.textContent='…'; try{ const b=await TDB.get(t.id);
          if(!b){ holder.appendChild(el('p','lead','Le son n’est plus là (stockage vidé par le téléphone).')); load.remove(); return; }
          const a=document.createElement('audio'); a.controls=true; a.autoplay=true; a.style.cssText='width:100%;margin-top:10px';
          a.src=URL.createObjectURL(b); holder.appendChild(a); load.remove();
        }catch(e){ holder.appendChild(el('p','lead','Lecture impossible : '+e.message)); load.remove(); } };
      c.appendChild(load);
      if(i===0 && list.length>1){ const n=list[list.length-1], d2=Math.round((Date.now()-n.ts)/864e5);
        c.appendChild(el('p','lead',`<b style="color:var(--acc)">Compare celui-ci avec le plus ancien</b> (${d2} jours). Écoute deux choses : la <b>régularité</b> (les notes tombent-elles au même endroit ?) et les <b>silences</b> (est-ce que tu respires, ou est-ce que tu remplis ?).`)); }
      inner.appendChild(c);
    });
    const b=el('button','btn','🔴 Nouvelle prise'); b.onclick=()=>openTake(kind||'temoin'); inner.appendChild(b);
  });
}

/* ---- la courbe : 28 jours ---- */
function chart28(){
  const days=lastDays(28), max=Math.max(goal(), ...days.map(d=>d.min), 1);
  const wrap=el('div','chartwrap');
  const g=el('div','chart');
  days.forEach((x,i)=>{
    const col=el('div','cbar'+(x.min>=goal()?' hit':(x.min>0?' part':'')));
    const b=el('i'); b.style.height=Math.max(x.min?3:0, Math.round(100*x.min/max))+'%'; col.appendChild(b);
    col.title=x.d+' — '+x.min+' min';
    if(i===days.length-1) col.classList.add('today');
    g.appendChild(col);
  });
  wrap.appendChild(g);
  const line=el('div','chartline');
  line.innerHTML=`<span>il y a 4 semaines</span><span>aujourd’hui</span>`;
  wrap.appendChild(line);
  return wrap;
}

/* ---- l’écran « je joue » ---- */
function openPlay(){
  ac(); markDay(); Sess.start();
  openOverlay('La séance', inner=>{
    const head=el('div','card'); head.style.borderColor='var(--acc)'; inner.appendChild(head);
    const ctrl=el('div','row3'); ctrl.style.marginTop='10px';
    const pauseB=el('button','btn ghost','⏸ Pause'), takeB=el('button','btn ghost','🔴 45 s'), endB=el('button','btn','■ Fini');
    ctrl.append(pauseB,takeB,endB);
    function paint(){ const sess=Math.floor(Sess.ms()/1000), tot=Math.round(dayRec().sec/60);
      head.innerHTML=`<div class="qhead"><div class="q" style="font-size:44px;font-variant-numeric:tabular-nums">${String(Math.floor(sess/60)).padStart(2,'0')}:${String(sess%60).padStart(2,'0')}</div>
        <div class="sub">${Sess.on?'⏱ en cours':'⏸ en pause'} · <b style="color:var(--acc)">${tot} min aujourd’hui</b> / ${goal()} visées</div></div>`;
      head.appendChild(ctrl); }
    const t=setInterval(()=>{ if(!overlay.classList.contains('open')){ clearInterval(t); return; } paint(); },500);
    pauseB.onclick=()=>{ if(Sess.on){ Sess.pause(); pauseB.textContent='▶ Reprendre'; } else { Sess.start(); pauseB.textContent='⏸ Pause'; } paint(); };
    takeB.onclick=()=>{ Sess.pause(); openTake('libre'); };
    endB.onclick=()=>{ const s=Sess.end(); clearInterval(t);
      const mins=Math.round(s/60);
      inner.innerHTML='';
      const tot=Math.round(dayRec().sec/60);
      const c=el('div','card'); c.style.borderColor='var(--acc)';
      c.innerHTML=`<div class="qhead"><div class="q">${mins} min</div><div class="sub">séance terminée · <b>${tot} min aujourd’hui</b> · ${weekMin()} min cette semaine</div></div>
        <p class="lead" style="margin:10px 0 0">${tot>=goal()?'✅ Objectif du jour atteint. C’est ce chiffre-là, répété, qui te fait progresser — rien d’autre.':'Il te manque '+(goal()-tot)+' min pour ton objectif. Rien n’oblige à les faire d’un coup.'}</p>`;
      inner.appendChild(c);
      inner.appendChild(chart28());
      if(temoinDue()){ const w=el('div','card'); w.style.borderColor='var(--acc2)';
        w.innerHTML=`<b>🎙 Le témoin de la semaine</b><p class="lead" style="margin:6px 0 10px">45 s, ${temoinDef().n}. C’est la prise qui te montrera, dans un mois, que tu as changé.</p>`;
        const wb=el('button','btn','🔴 Enregistrer maintenant'); wb.onclick=()=>openTake('temoin'); w.appendChild(wb); inner.appendChild(w); }
      const b=el('button','btn ghost','← Retour'); b.onclick=()=>closeOverlay(); inner.appendChild(b);
    };
    paint();
    inner.appendChild(el('div','theory',`<div class="tip">Le chrono écrit tes minutes <b>toutes les 15 secondes</b> : même si le téléphone se verrouille ou que tu fermes l’app, rien n’est perdu.</div>`));
    inner.appendChild(el('b',null,'🥁 Le métronome, sous la main'));
    inner.appendChild(metronomeCard());
    const quick=el('div','card'); quick.innerHTML='<b>À jouer maintenant</b>';
    const q1=el('button','btn ghost','🎧 Un morceau du Juke-box'); q1.onclick=()=>{ Sess.pause(); openJukebox(); };
    const q2=el('button','btn ghost','🎸 Un lick / un riff'); q2.onclick=()=>{ Sess.pause(); openLicks(); };
    const q3=el('button','btn ghost','🕷️ Technique & déliateurs'); q3.onclick=()=>{ Sess.pause(); openTechnique(); };
    quick.append(q1,q2,q3); inner.appendChild(quick);
  });
}

/* ---- l’accueil : deux chiffres et une courbe. Rien d’autre au-dessus. ---- */
function renderJour(){
  const m=document.getElementById('main'); m.innerHTML=''; markDay(); sessToday();
  const tod=dayMin(), w=weekMin(), wp=weekMin(1), pct=Math.min(100,Math.round(100*tod/goal()));
  m.appendChild(el('h1','page','Jouer'));

  /* 1. LE CHIFFRE */
  const hero=el('div','card'); hero.style.borderColor='var(--acc)';
  const delta = wp? (w-wp) : null;
  hero.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:baseline">
      <b style="font-size:30px;font-variant-numeric:tabular-nums">${tod}<span style="font-size:15px;color:var(--dim)"> / ${goal()} min</span></b>
      <span style="color:var(--dim);font-size:12px">aujourd’hui</span></div>
    <div class="bxbar"><i style="width:${pct}%"></i></div>
    <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--dim);margin-top:8px">
      <span><b style="color:var(--txt)">${w} min</b> cette semaine${delta!=null?` <span style="color:${delta>=0?'var(--ok)':'var(--bad)'}">${delta>=0?'+':''}${delta}</span>`:''}</span>
      <span><b style="color:var(--txt)">${daysPlayed(7)}/7</b> jours joués</span></div>`;
  const pb=el('button','btn', Sess.on?'⏱ Séance en cours — reprendre':'▶ Je joue');
  pb.onclick=()=>openPlay(); hero.appendChild(pb);
  m.appendChild(hero);

  /* 2. LA COURBE */
  const cc=el('div','card');
  cc.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:baseline"><b>28 derniers jours</b>
    <span style="color:var(--dim);font-size:12px">série : <b style="color:var(--acc)">${playStreak()} j</b></span></div>`;
  cc.appendChild(chart28());
  cc.appendChild(el('p','lead','<span style="color:var(--acc)">■</span> objectif atteint · <span style="color:var(--acc2)">■</span> joué quand même. C’est cette colonne-là qui fait le niveau — pas l’XP.'));
  m.appendChild(cc);

  /* 3. LE TÉMOIN */
  const tc=el('div','card'); const tl=temoinLast(), td=temoinDays();
  if(temoinDue()){
    tc.style.borderColor='var(--acc2)';
    tc.innerHTML=`<b>🎙 Le témoin de la semaine</b><p class="lead" style="margin:6px 0 10px">45 s : <b>${temoinDef().n}</b>. ${tl?'Le dernier remonte à <b>'+td+' jours</b>.':'Tu n’en as encore aucun — c’est ton point zéro, et c’est la chose la plus utile que tu feras cette semaine.'}</p>`;
    const b=el('button','btn','🔴 Enregistrer (45 s)'); b.onclick=()=>openTake('temoin'); tc.appendChild(b);
  } else {
    tc.innerHTML=`<b>🎙 Le témoin</b><p class="lead" style="margin:6px 0 10px">Fait il y a ${td} jour(s). Prochain dans ${7-td} j. ${takesOf('temoin').length>1?'Tu as <b>'+takesOf('temoin').length+' témoins</b> — écoute le premier et le dernier à la suite.':''}</p>`;
    const b=el('button','btn ghost','🎧 Écouter mes témoins'); b.onclick=()=>openTakes('temoin'); tc.appendChild(b);
  }
  m.appendChild(tc);

  /* 4. TROIS CHOSES, PAS PLUS — et la première se joue */
  const T=miniToday(), dueCards=cDueTotal()+tDue().length, dueBox=bxDueList().length;
  const cs=soloCur();
  const bloc1 = (cs && !repDone(cs.id))
    ? {id:'solo', ic:'🎼', t:'Ton solo : '+cs.t, d:'Marche '+Math.min(5,repCount(cs.id)+1)+'/5 — '+SOL_STEPS[Math.min(4,repCount(cs.id))].n+' · '+cs.a+' · '+cs.key, open:()=>openSolo(cs)}
    : {id:'solo', ic:'🎼', t:(repJoue()?'Choisis ton prochain solo':'Choisis ton premier solo'), d:'Le répertoire — '+repJoue()+'/'+SOLOS.length+' sus. Un seul à la fois, jusqu’au bout.', open:()=>openRepertoire()};
  const blocks=[
    bloc1,
    (dueBox
      ? {id:'gammes', ic:'🗺', t:'Entretien des gammes', d:dueBox+' boîte(s) à revoir — si tu les rates, elles redescendent.', open:()=>openConquete()}
      : {id:'gammes', ic:'🗺', t:'La Conquête des gammes', d:BOXES[bxNext()].n+' · palier « '+BX_MODEN[Math.min(4,bx(bxNext()).lvl)]+' »', open:()=>openConquete()}),
    (dueCards
      ? {id:'cartes', ic:'🔁', t:'Tes cartes du jour', d:dueCards+' carte(s) à réviser.', open:()=>goTab('cartes')}
      : {id:'cours', ic:'🎓', t:'Le mini-cours du jour', d:T.n, open:()=>openMiniLesson(T)})
  ];
  const doneN=blocks.filter(b=>sessDone(b.id)).length;
  const h=el('div','card');
  h.innerHTML=`<div style="display:flex;justify-content:space-between"><b>Le travail du jour</b><span style="color:var(--acc);font-weight:800">${doneN}/3</span></div>
    <p class="lead" style="margin:6px 0 0">${doneN===3?'Bouclé. Le reste du temps : joue, simplement.':'Trois choses, dans l’ordre. Guitare en main pour la première.'}</p>`;
  m.appendChild(h);
  blocks.forEach(b=>{ const done=sessDone(b.id);
    const c=el('div','catcard'); if(done)c.style.opacity='.62';
    c.innerHTML=`<div class="ico">${b.ic}</div><div class="t"><b>${done?'✓ ':''}${b.t}</b><small>${b.d}</small></div>`;
    const wrap=el('div'); wrap.style.cssText='display:flex;gap:6px;flex-shrink:0';
    const go=el('div','tag on','ouvrir'); go.onclick=(ev)=>{ ev.stopPropagation(); b.open(); };
    const chk=el('div','tag', done?'✓':'fait ?'); chk.onclick=(ev)=>{ ev.stopPropagation(); sessMark(b.id); render(); };
    wrap.append(go,chk); c.appendChild(wrap); c.onclick=b.open; m.appendChild(c); });

  const qt=el('div','card'); qt.innerHTML='<b>Outils</b>';
  const row=el('div','row3'); row.style.marginTop='10px';
  const bm=el('button','btn ghost','🥁 Métro'); bm.onclick=()=>openMetronome();
  const bb=el('button','btn ghost','🎯 Duel'); bb.onclick=()=>openDuel();
  const bp=el('button','btn ghost','📚 Biblio'); bp.onclick=()=>goTab('biblio');
  row.append(bm,bb,bp); qt.appendChild(row); m.appendChild(qt);
}

/* ---- LA BIBLIOTHÈQUE — tout le reste, hors du chemin quotidien ----
   32 portes ouvertes en permanence, c’est le hall d’un hôtel : on
   tourne au lieu d’entrer quelque part. Tout est là, rien n’est perdu,
   mais plus rien ne réclame ton attention chaque jour. */
function renderBiblio(){
  const m=document.getElementById('main'); m.innerHTML='';
  m.appendChild(el('h1','page','Bibliothèque'));
  m.appendChild(el('p','lead','Tout ce qui n’est pas quotidien. On vient ici <b>quand on cherche quelque chose</b>, pas tous les jours.'));
  const groups=[
    ['🎸 Jouer', [
      ['🎼','Le répertoire de solos','15 solos gradués, 5 marches chacun — ce que tu sais jouer',()=>openRepertoire()],
      ['🎧','Le Juke-box','30 morceaux par gamme, la grille en boucle',()=>openJukebox()],
      ['🎸','Licks, riffs & lick du jour','Des phrases toutes faites, en tablature + au son',()=>openLicks()],
      ['🕷️','Technique & déliateurs','L’araignée, l’alternance, le legato',()=>openTechnique()],
      ['⚡','Jouer vite','La méthode des pros + exos en progression',()=>openSpeed()],
      ['🗣️','Bien phraser','Le silence, les motifs, l’appel-réponse',()=>openPhrasing()],
      ['🎤','Improviser vite comme un pro','La progression complète',()=>openFastImpro()],
      ['✍️','Écrire une chanson','Pensé rock dynamique (grunge / alt)',()=>openSongwriting()],
    ]],
    ['🧠 Savoir', [
      ['🎸','Le manche','Fretboard, entraînement « nommer les cases »',()=>goTab('manche')],
      ['📖','Théorie','Les leçons de base',()=>goTab('theorie')],
      ['🎼','De la chanson au mode','Quelle gamme majeure, quelle position',()=>openSongMode()],
      ['🧭','La Boussole','Dans quelle gamme je joue ? + quoi viser',()=>openBoussole()],
      ['🎭','Les 7 modes','Une couleur, une note caractéristique',()=>openModesModule()],
      ['🪜','La gamme majeure en positions','Les 5 positions = penta + 2 notes',()=>openMajorPositions()],
      ['🅲','Le système CAGED','5 formes d’accord, tout le manche',()=>openCAGED()],
      ['⚡','Power chords','La forme qui déménage',()=>openPowerModule()],
      ['🥁','Le blues en 12 mesures','La grille et la note qui fait pro',()=>openBlues12()],
      ['✨','La suite','La feuille de route',()=>goTab('suite')],
    ]],
    ['🎙 Tes traces', [
      ['🎙','Tes témoins','Les prises hebdomadaires, à comparer',()=>openTakes('temoin')],
      ['🔴','Tes prises libres','Ce que tu as gardé en passant',()=>openTakes('libre')],
    ]],
  ];
  groups.forEach(([title,items])=>{
    const h=el('h1','page',title); h.style.cssText='font-size:15px;color:var(--acc);margin:18px 0 8px'; m.appendChild(h);
    items.forEach(it=>{ const c=el('div','catcard',`<div class="ico">${it[0]}</div><div class="t"><b>${it[1]}</b><small>${it[2]}</small></div><div class="pc">›</div>`);
      c.onclick=it[3]; m.appendChild(c); });
  });
}


/* ================================================================
   LE RÉPERTOIRE — des solos à jouer, un à la fois, jusqu’au bout.
   « Je progresse » n’est pas un sentiment : c’est une LISTE de solos
   que tu sais jouer aujourd’hui et que tu ne savais pas hier.
   Chaque solo franchit 5 marches (écouter → décortiquer → au ralenti
   → au tempo → enregistré) et finit dans ton répertoire.
   ⚠️ Aucune tablature de solo n’est recopiée ici : on donne la CARTE
   (tonalité, position, structure phrase par phrase, gestes, pièges)
   et une ÉTUDE ORIGINALE écrite pour te faire travailler exactement
   le geste du solo. La copie ne t’apprendrait rien de plus, et ne
   m’appartient pas.
   🖐 Chaque solo est noté « aux doigts » : tu joues sans médiator,
   ça change tout — certains solos deviennent plus faciles pour toi
   que pour un joueur au médiator, d’autres deviennent des murs.
   ================================================================ */
const SOL_STEPS=[
 {k:'ecoute', n:'Écouter', d:'3 fois de suite, sans guitare, en suivant la structure ci-dessous. Tu dois pouvoir <b>chanter</b> la première phrase avant de la jouer.'},
 {k:'carte',  n:'Décortiquer', d:'Repère la tonalité et la position sur le manche, joue la gamme dans la boîte, puis l’étude très lentement.'},
 {k:'lent',   n:'Au ralenti', d:'L’étude au métronome, à un tempo où c’est PROPRE. Trois fois sans faute, puis +5 BPM.'},
 {k:'tempo',  n:'Au tempo', d:'Le tempo cible atteint, proprement, trois fois de suite.'},
 {k:'prise',  n:'Enregistré', d:'45 s au micro. C’est la marche qui compte : tant que ce n’est pas enregistré, tu ne sais pas vraiment où tu en es.'}
];
const SOL_PAL=['','① Le socle — mélodique, une position, aucune vitesse',
  '② Le blues-rock — bends, vibrato, phrasé','③ Le long cours — plusieurs positions, endurance','④ Le sommet — la vitesse, plus tard'];
const DOIGTS=['','⚠️ dur sans médiator','🖐 jouable aux doigts','🖐 idéal aux doigts'];
const SOLOS=[
 /* ---------- ① LE SOCLE ---------- */
 {id:'s_caya', ic:'🌊', t:'Come As You Are', a:'Nirvana', pal:1, root:6, key:'Fa♯ mineur', sc:'pm', doigts:3, bpm:120, dur:'~0:25',
  pourquoi:'Le premier solo à savoir jouer en entier, pour une raison précise : <b>ce n’est pas un solo, c’est la mélodie du chant</b>. Quatre notes, une position, zéro technique. Tu l’as déjà dans l’oreille depuis dix ans — donc tu entendras immédiatement quand c’est juste.',
  structure:['Le solo <b>double la voix</b> du couplet, note pour note : même rythme, mêmes hauteurs.',
    'Tout tient dans la <b>boîte 1</b> de Fa♯ mineur, sur deux ou trois cordes.',
    'Rien n’est plié, rien n’est rapide : c’est un <b>test de justesse et de son</b>, pas de doigts.'],
  gestes:['jouer lentement sans accélérer','tenir une note jusqu’au bout','pas de vibrato — la nudité assumée'],
  piege:'Tu vas vouloir « l’enjoliver ». Ne le fais pas. Ce solo ne pardonne rien parce qu’il n’y a rien derrière quoi se cacher — c’est exactement pour ça qu’il est le n°1.',
  accord:'Kurt accorde un TON plus bas (Ré Sol Do Fa La Ré) : sur le disque ça sonne en Mi mineur. En accordage standard, joue-le en Fa♯ mineur.',
  etude:{n:'Étude — la descente chantée', key:'Fa♯ mineur · boîte 1', how:'pouce sur les graves, index/majeur qui alternent sur les aiguës.',
   seq:[{s:3,f:4},{s:3,f:2},{s:2,f:4},{s:2,f:2},{s:1,f:4},{s:1,f:2},{s:0,f:5},{s:0,f:2,t:'~'}],
   why:'Une descente pure de Fa♯ mineur, une note par temps. Le seul objectif : que les huit notes aient <b>exactement la même durée et le même volume</b>. C’est le socle de tout le reste.'}},

 {id:'s_slts', ic:'💥', t:'Smells Like Teen Spirit', a:'Nirvana', pal:1, root:5, key:'Fa mineur', sc:'pm', doigts:3, bpm:117, dur:'~0:30',
  pourquoi:'Le même principe que Come As You Are, mais avec du <b>rythme</b> : le solo répète un motif court, encore et encore. C’est ta première leçon de « <b>une idée répétée bat dix idées</b> ».',
  structure:['Là encore, la ligne suit la mélodie du chant.',
    'Un <b>motif de 2-3 notes</b> qui revient, décalé, presque obstiné.',
    'Position basse de Fa mineur (fondamentale case 1 sur le Mi grave).'],
  gestes:['répéter sans se lasser','garder le tempo malgré la distorsion','attaque régulière'],
  piege:'La distorsion masque les notes sales. Travaille-le <b>en son clair</b> : si c’est propre en clair, c’est propre partout.',
  etude:{n:'Étude — le motif obstiné', key:'Fa mineur · position basse', how:'i-m-i-m, jamais deux fois le même doigt.',
   seq:[{s:2,f:3},{s:2,f:1},{s:3,f:1},{s:2,f:3},{s:2,f:1},{s:3,f:3,t:'~'}],
   why:'Deux notes qui reviennent, une troisième qui change la fin. Joue-le <b>huit fois d’affilée sans varier</b> : la difficulté n’est pas technique, elle est mentale.'}},

 {id:'s_stone', ic:'🪨', t:'Like a Stone', a:'Audioslave', pal:1, root:9, key:'La mineur', sc:'pm', doigts:3, bpm:100, dur:'~0:40',
  pourquoi:'Ton premier <b>vrai</b> solo : lent, mélodique, en La mineur (que des touches faciles), et il te force à faire la seule chose qui distingue un guitariste d’un débutant — <b>tenir une note et la faire vibrer</b>.',
  structure:['Phrases courtes, séparées par de vrais <b>silences</b>.',
    'Chaque phrase se termine sur une note <b>tenue et vibrée</b>, souvent la fondamentale ou la ♭3.',
    'Reste dans la boîte 1 de La mineur (case 5) presque tout du long.'],
  gestes:['vibrato lent et large','bend d’un ton, tenu','laisser sonner — ne pas remplir'],
  piege:'Le silence. Tu vas vouloir jouer dans les trous : c’est exactement ce qu’il ne faut pas. Compte les temps pendant les silences, ne les remplis pas.',
  etude:{n:'Étude — bend, tenue, vibrato', key:'La mineur · boîte 1', how:'le bend se pousse avec l’annulaire, majeur et index derrière pour aider.',
   seq:[{s:3,f:7,t:'b'},{s:3,f:5},{s:4,f:5,t:'~'},{s:4,f:8},{s:3,f:7,t:'~'}],
   why:'Un bend d’un ton, un retour, puis <b>deux notes tenues avec vibrato</b>. Vise 5 secondes de vibrato régulier sur la dernière : c’est plus dur que ça n’en a l’air, et c’est ce qui s’entend au premier coup d’oreille.'}},

 {id:'s_change', ic:'🪰', t:'Change (In the House of Flies)', a:'Deftones', pal:1, root:0, key:'Do mineur', sc:'pm', doigts:3, bpm:96, dur:'~0:20',
  pourquoi:'Presque pas de notes — et c’est le sujet. Ce morceau t’apprend le <b>son</b> : la note tenue, la dynamique, le contraste doux/fort. C’est ton terrain, celui que tu écoutes.',
  structure:['Des notes <b>longues</b> par-dessus le mur Dom–Fam.',
    'La ligne monte lentement, sans jamais se presser.',
    'Tout se joue à la main droite : attaque douce sur les couplets, franche sur les refrains.'],
  gestes:['sustain','dynamique (jouer doux PUIS fort)','vibrato très lent'],
  piege:'Croire qu’il n’y a « rien à jouer ». Tenir trois notes justes pendant 20 secondes avec un son qui ne s’effondre pas est plus difficile que douze notes rapides.',
  accord:'Accordage bas (drop C). En standard, joue-le en Mi mineur : mêmes rapports, mêmes formes.',
  etude:{n:'Étude — trois notes, vingt secondes', key:'Do mineur',
   seq:[{s:2,f:10,t:'~'},{s:3,f:8,t:'~'},{s:2,f:8,t:'~'}],
   why:'Trois notes. Fais-les durer <b>chacune 6 secondes</b>, avec un vibrato régulier, en jouant d’abord très doux puis très fort. Chronomètre-toi : c’est un exercice de patience, pas de doigts.'}},

 /* ---------- ② LE BLUES-ROCK ---------- */
 {id:'s_thrill', ic:'👑', t:'The Thrill Is Gone', a:'B.B. King', pal:2, root:11, key:'Si mineur', sc:'pm', doigts:3, bpm:80, dur:'~0:50',
  pourquoi:'L’école du <b>vibrato</b>. B.B. joue trois notes là où d’autres en jouent trente, et on le reconnaît en une seconde. Aux doigts, tu es avantagé : le vibrato « papillon » se contrôle mieux sans médiator.',
  structure:['Appel / réponse : une phrase courte, un silence, une phrase qui répond.',
    'Presque tout se joue dans une seule position (« la boîte de B.B. »), autour de la case 7 en Si mineur.',
    'Chaque phrase finit sur une note <b>tenue</b> avec un vibrato large et régulier.'],
  gestes:['vibrato large','bend d’un demi-ton juste','jouer DERRIÈRE le temps'],
  piege:'Jouer trop tôt. Le blues se joue en retard sur le temps — laisse le clic passer avant d’attaquer.',
  etude:{n:'Étude — la boîte de B.B.', key:'Si mineur · case 7', how:'annulaire pour le bend, poignet qui tourne (pas le doigt) pour le vibrato.',
   seq:[{s:4,f:10,t:'b'},{s:5,f:7,t:'~'},{s:4,f:12},{s:4,f:10},{s:3,f:9,t:'~'}],
   why:'Le geste complet : bend d’un ton, note haute vibrée, redescente, résolution vibrée. Cinq notes, une éternité pour les faire sonner comme lui.'}},

 {id:'s_brick', ic:'🧱', t:'Another Brick in the Wall pt.2', a:'Pink Floyd', pal:2, root:2, key:'Ré mineur', sc:'pm', doigts:3, bpm:104, dur:'~1:00',
  pourquoi:'Le solo le plus « chantant » du rock, et le meilleur professeur de <b>bend juste</b> qui existe. Gilmour plie des notes lentement, longtemps, et elles arrivent <b>exactement</b> sur la hauteur visée.',
  structure:['Des phrases longues, très peu de notes, beaucoup d’air.',
    'Des <b>bends tenus</b> qui montent lentement puis restent en haut.',
    'Le solo se promène entre deux positions de Ré mineur sans jamais courir.'],
  gestes:['bend lent et JUSTE','sustain','glissés entre positions'],
  piege:'Le bend approximatif. Vérifie chaque bend en jouant d’abord la note visée : ton oreille doit refuser un demi-ton en dessous.',
  etude:{n:'Étude — le bend qui vise', key:'Ré mineur · case 10', how:'pousse vers le haut avec trois doigts, écoute jusqu’à ce que la hauteur soit exacte.',
   seq:[{s:3,f:12,t:'b'},{s:3,f:10},{s:4,f:10,t:'~'},{s:3,f:12,t:'b'},{s:4,f:13,t:'~'}],
   why:'Deux fois le même bend, encadré de notes tenues. Joue d’abord la note d’arrivée seule (case 14 sur la corde de Sol) pour la mémoriser, puis plie jusqu’à elle. <b>Le bend n’est pas un geste, c’est une écoute.</b>'}},

 {id:'s_black', ic:'⚫', t:'Back in Black', a:'AC/DC', pal:2, root:4, key:'Mi (penta + tierce majeure)', sc:'pm', doigts:2, bpm:92, dur:'~0:50',
  pourquoi:'Le solo rock’n’roll type : penta mineure jouée sur des accords MAJEURS, avec le frottement ♭3 → 3 qui fait tout le sel. C’est le geste que tu as découvert avec ta tierce majeure — ici il est partout.',
  extra:[8,'la tierce MAJEURE (Sol♯), empruntée : elle n’est PAS dans la penta mineure, et c’est exactement ce qui fait le son AC/DC'],
  structure:['Des rafales courtes, séparées, très rythmiques.',
    'Le motif ♭3 → 3 (Sol → Sol♯) revient sans arrêt, en glissé ou en bend.',
    'Deux positions : la basse (case 0-3) et la haute (case 12).'],
  gestes:['glissé ♭3 → 3','alternance rapide','couper net les fins de phrase'],
  piege:'Aux doigts, les rafales rapides sur une même corde sont ton point faible. Travaille-les en <b>alternance stricte index-majeur</b>, sinon tu buteras à 100 BPM.',
  etude:{n:'Étude — le frottement ♭3 → 3', key:'Mi · position basse',
   seq:[{s:2,f:5},{s:3,f:0},{s:3,f:1,t:'/'},{s:3,f:2},{s:4,f:0,t:'~'}],
   why:'Sol, puis Sol glissé vers Sol♯, puis La, puis Si. Ce petit glissé d’un demi-ton, c’est <b>tout le rock</b>. Fais-le sonner sale et décidé, jamais timide.'}},

 {id:'s_stair', ic:'🪜', t:'Stairway to Heaven', a:'Led Zeppelin', pal:2, root:9, key:'La mineur', sc:'pm', doigts:2, bpm:82, dur:'~1:10',
  pourquoi:'Le solo <b>modèle</b> : il tient presque entier dans la boîte 1 de La mineur, il est construit sur des motifs répétés, et il monte en intensité du début à la fin. Si tu ne devais en apprendre qu’un pour comprendre comment un solo se CONSTRUIT, c’est celui-là.',
  structure:['Il commence <b>bas et lent</b>, presque timide.',
    'Un motif de trois notes revient, décalé à chaque fois : c’est la colonne vertébrale.',
    'L’intensité monte par paliers, les notes se resserrent, et la fin dévale en cascade.'],
  gestes:['motifs répétés','pull-offs en cascade','construire une intensité'],
  piege:'Attaquer la fin trop tôt. Ce solo n’est bon que si le début est retenu — enregistre-toi et écoute si tu as la patience de commencer doucement.',
  etude:{n:'Étude — le motif qui se décale', key:'La mineur · boîte 1',
   seq:[{s:4,f:8},{s:4,f:5},{s:3,f:7},{s:4,f:8},{s:4,f:5},{s:3,f:7},{s:3,f:5},{s:2,f:7,t:'~'}],
   why:'Trois notes, répétées, puis une résolution qui change tout. C’est <b>la</b> recette : l’oreille adore ce qui revient, et n’écoute vraiment que lorsque ça change enfin.'}},

 {id:'s_joe', ic:'🔫', t:'Hey Joe', a:'Jimi Hendrix', pal:2, root:4, key:'Mi (blues)', sc:'blu', doigts:3, bpm:80, dur:'~0:45',
  pourquoi:'Le solo pour apprendre le <b>groove</b> et la blue note. Lent, en Mi, sur une grille qui descend le cercle des quintes — une seule gamme tient sur les cinq accords. Hendrix jouait beaucoup avec le pouce : aux doigts, tu es dans sa logique.',
  structure:['Des phrases décontractées, très en arrière du temps.',
    'La <b>♭5</b> (Si♭) traverse les phrases sans jamais être tenue.',
    'Beaucoup de doubles-cordes et de notes qu’on laisse traîner.'],
  gestes:['blue note en passage','jouer en retard','doubles-cordes'],
  piege:'Jouer trop propre. Ce solo demande de la crasse : notes à moitié étouffées, attaques inégales. Le propre viendra après.',
  etude:{n:'Étude — la note sale', key:'Mi blues · position ouverte',
   seq:[{s:1,f:0},{s:1,f:1,t:'/'},{s:1,f:2},{s:2,f:0},{s:2,f:2},{s:3,f:0,t:'~'}],
   why:'La, Si♭ <b>traversé</b>, Si, Ré, Mi, Sol. Le Si♭ ne doit jamais durer : on passe dessus. Une blue note tenue sonne fausse — c’est la seule règle.'}},

 /* ---------- ③ LE LONG COURS ---------- */
 {id:'s_sultans', ic:'🎩', t:'Sultans of Swing', a:'Dire Straits', pal:3, root:2, key:'Ré mineur', sc:'pm', doigts:3, bpm:148, dur:'~1:30', star:1,
  pourquoi:'⭐ <b>Le solo à viser si tu joues aux doigts.</b> Mark Knopfler ne touche pas un médiator : tout ce son, ces arpèges qui claquent, cette précision — c’est de la main nue. Ce n’est pas un handicap contourné, c’est <b>ta technique</b> portée à son sommet.',
  structure:['Deux solos : un court au milieu, un long à la fin.',
    'Beaucoup d’<b>arpèges</b> (les notes de l’accord, pas la gamme) : c’est ce qui donne ce côté « ça parle ».',
    'Les cordes sont pincées et étouffées avec la paume — le son est sec, jamais flou.',
    'Il descend de la position haute vers la basse par glissades.'],
  gestes:['arpèges pouce-index-majeur','étouffé de paume','précision rythmique'],
  piege:'Vouloir tout jouer à la vitesse du disque. Ce solo se construit <b>arpège par arpège</b> à 60 BPM. Six semaines, pas six jours.',
  etude:{n:'Étude — l’arpège aux doigts', key:'Ré mineur · arpège', how:'p (pouce) sur la corde de La, i et m sur Ré et Sol. Le pouce donne le temps, les doigts remplissent.',
   seq:[{s:1,f:5},{s:2,f:3},{s:3,f:2},{s:4,f:3},{s:3,f:2},{s:2,f:3,t:'~'}],
   why:'Ré, Fa, La, Ré, La, Fa : l’accord de Ré mineur, joué note à note. C’est <b>la</b> brique de Knopfler. Quand cet arpège coule à 100 BPM, tu peux commencer le solo.'}},

 {id:'s_numb', ic:'💊', t:'Comfortably Numb (2ᵉ solo)', a:'Pink Floyd', pal:3, root:11, key:'Si mineur', sc:'pm', doigts:3, bpm:63, dur:'~2:00',
  pourquoi:'Le sommet du <b>phrasé</b>. Deux minutes, peu de notes, et pas une seule de trop. C’est le solo qu’on met dix ans à jouer « bien » alors qu’on peut le jouer « juste » en un mois. Enregistre-le tous les six mois : c’est ton mètre-étalon à vie.',
  structure:['Il commence sur une note tenue, très haut, qui s’installe.',
    'Chaque phrase <b>respire</b> : joue, silence, joue.',
    'Des bends longs qui montent et redescendent lentement.',
    'La fin tourne en boucle sur un motif de plus en plus intense, sans jamais devenir rapide.'],
  gestes:['bend d’un ton et demi','vibrato très lent','endurance sur 2 minutes'],
  piege:'L’endurance. Tu tiendras 40 secondes puis tu te crisperas. Travaille-le <b>par sections de 15 secondes</b>, jamais en entier au début — et arrête au premier signe de tension dans l’avant-bras.',
  etude:{n:'Étude — la phrase qui respire', key:'Si mineur · case 7',
   seq:[{s:4,f:10,t:'b'},{s:5,f:7,t:'~'},{s:4,f:12},{s:4,f:10},{s:3,f:9},{s:3,f:7,t:'~'}],
   why:'Six notes sur quatre temps entiers. Entre chaque note, <b>compte un temps de silence</b>. L’exercice n’est pas de jouer : c’est de ne pas jouer.'}},

 {id:'s_hotel', ic:'🏨', t:'Hotel California (l’outro)', a:'Eagles', pal:3, root:11, key:'Si mineur', sc:'har', doigts:2, bpm:74, dur:'~2:20',
  pourquoi:'Le solo <b>long</b> à mettre au programme quand les précédents sont solides : huit accords qui tournent, deux guitares qui se répondent puis s’harmonisent, et une fin en arpèges qu’on reconnaît entre mille.',
  structure:['Trois parties : appel-réponse entre deux guitares, puis harmonisation en tierces, puis l’arpège final en boucle.',
    'La grille de huit accords tourne sans arrêt — c’est <b>elle</b> qu’il faut avoir dans l’oreille avant de jouer une note.',
    'Sur le Fa♯ MAJEUR, une note étrangère à Si mineur apparaît (La♯) : c’est la couleur du morceau.'],
  gestes:['arpèges rapides','tenir une forme longtemps','viser la note du mineur harmonique'],
  piege:'La longueur. Découpe en trois chantiers séparés, et ne les colle qu’à la fin.',
  etude:{n:'Étude — l’arpège de Si mineur', key:'Si mineur · arpège',
   seq:[{s:1,f:2},{s:2,f:4},{s:3,f:4},{s:4,f:3},{s:3,f:4},{s:2,f:4,t:'~'}],
   why:'Si, Fa♯, Si, Ré : l’accord, en montant et en descendant. Tout l’outro est bâti là-dessus. Fais-le couler comme de l’eau avant de penser au solo.'}},

 {id:'s_nem', ic:'🖤', t:'Nothing Else Matters', a:'Metallica', pal:3, root:4, key:'Mi mineur', sc:'aeo', doigts:2, bpm:70, dur:'~1:10',
  pourquoi:'Le pont entre le mélodique et la vitesse : il commence en chantant et finit en courant. C’est ton test pour savoir si tu es prêt pour le palier 4.',
  structure:['Première moitié : mélodique, tenue, presque vocale.',
    'Puis un changement de vitesse net — des traits rapides en Mi mineur.',
    'Retour au calme pour finir.'],
  gestes:['contraste lent/rapide','legato','endurance'],
  piege:'La partie rapide, aux doigts, demande une alternance i-m irréprochable. Si elle bafouille, ce n’est pas la vitesse le problème : c’est l’alternance. Reviens aux déliateurs.',
  etude:{n:'Étude — l’arc mélodique', key:'Mi mineur · position ouverte',
   seq:[{s:4,f:0},{s:4,f:3},{s:5,f:0},{s:5,f:3},{s:5,f:0},{s:4,f:3},{s:4,f:0,t:'~'}],
   why:'Une montée, un sommet, une descente : la forme la plus simple d’une phrase qui « raconte ». Toutes les mélodies de ce solo sont des variantes de cet arc.'}},

 /* ---------- ④ LE SOMMET ---------- */
 {id:'s_scom', ic:'🌹', t:'Sweet Child o’ Mine (solo final)', a:'Guns N’ Roses', pal:4, root:4, key:'Mi mineur', sc:'pm', doigts:1, bpm:126, dur:'~1:30',
  pourquoi:'Le solo « récompense » : long, rapide, spectaculaire — et honnêtement <b>dur sans médiator</b>. À garder comme objectif de fin d’année, pas comme travail du mois.',
  structure:['Il démarre par une phrase mélodique lente, presque une deuxième mélodie de chant.',
    'Puis des séquences rapides par petits groupes de notes qui se chevauchent.',
    'Beaucoup de mouvement entre positions, sur toute la longueur du manche.'],
  gestes:['séquences par groupes','vitesse d’alternance','changements de position'],
  piege:'Aux doigts, les traits rapides sur une seule corde sont ton mur. Solution : <b>réarrange</b> les phrases pour qu’elles traversent plusieurs cordes — c’est ce que font les joueurs classiques, et ça sonne pareil.',
  etude:{n:'Étude — la séquence par paires', key:'Mi mineur · case 12', how:'une note par corde autant que possible : c’est ce qui rend la vitesse accessible aux doigts.',
   seq:[{s:4,f:15},{s:4,f:12},{s:3,f:14},{s:4,f:12},{s:3,f:14},{s:3,f:12},{s:2,f:14},{s:3,f:12}],
   why:'Le secret des traits rapides : on ne joue pas note à note, on joue de <b>petits groupes qui se chevauchent</b>. Lentement d’abord — à 60 BPM, puis +5 seulement quand c’est parfait trois fois.'}},

 {id:'s_voodoo', ic:'🌩', t:'Voodoo Child (Slight Return)', a:'Jimi Hendrix', pal:4, root:4, key:'Mi (penta)', sc:'pm', doigts:2, bpm:105, dur:'~2:00',
  pourquoi:'Moins une question de notes qu’une question d’<b>attitude</b>. Tout est en penta mineure de Mi, rien n’est techniquement hors de portée — mais il faut oser jouer sale, fort, et laisser des trous. C’est le solo qui te sortira de la sagesse.',
  structure:['Des attaques violentes, des notes qui partent en vrille.',
    'Beaucoup de doubles-cordes et de notes étouffées.',
    'Aucune phrase n’est jouée deux fois pareil : l’improvisation est le sujet.'],
  gestes:['doubles-cordes','dynamique extrême','improviser dans la forme'],
  piege:'Le vouloir « exact ». Ce solo n’a pas de version définitive — même lui ne le rejouait jamais pareil. Apprends-en <b>l’esprit</b> et improvise le reste : c’est le seul du répertoire où on te demande ça.',
  etude:{n:'Étude — attaque et laisser-aller', key:'Mi penta · case 12',
   seq:[{s:0,f:12},{s:0,f:15,t:'h'},{s:1,f:12},{s:1,f:14},{s:0,f:12,t:'~'}],
   why:'Cinq notes, mais joue-les <b>trois fois</b> : une fois très doux, une fois normal, une fois le plus fort possible sans que ça sature. La dynamique est une technique, et personne ne la travaille.'}}
];

/* ---- état du répertoire ---- */
function repAll(){ if(!S.rep) S.rep={}; return S.rep; }
function rep(id){ const a=repAll(); if(!a[id]) a[id]={steps:{}, started:today()}; return a[id]; }
function repStep(id,k){ return !!rep(id).steps[k]; }
function repCount(id){ return SOL_STEPS.filter(s=>repStep(id,s.k)).length; }
function repDone(id){ return repCount(id)===SOL_STEPS.length; }
function repJoue(){ return SOLOS.filter(s=>repDone(s.id)).length; }
function repStarted(){ return SOLOS.filter(s=>repCount(s.id)>0 && !repDone(s.id)).length; }
function soloCur(){ return S.solo? SOLOS.find(s=>s.id===S.solo)||null : null; }
function soloSuggest(){ /* le 1er non fini du palier le plus bas */
  return SOLOS.find(s=>!repDone(s.id)) || SOLOS[0]; }
function repMark(id,k){ const r=rep(id); if(r.steps[k]) return false;
  r.steps[k]=today(); S.xp+=8;
  if(repDone(id)){ r.done=today(); S.xp+=50; }
  save(); return true; }

/* ---- la liste ---- */
function openRepertoire(){
  markDay();
  openOverlay('Le répertoire', inner=>{
    const j=repJoue();
    const h=el('div','card'); h.style.borderColor='var(--acc)';
    h.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:baseline">
        <b style="font-size:17px">${j} solo${j>1?'s':''} que tu sais jouer</b><span style="color:var(--acc);font-weight:800">${j}/${SOLOS.length}</span></div>
      <div class="bxbar"><i style="width:${Math.round(100*j/SOLOS.length)}%"></i></div>
      <p class="lead" style="margin:8px 0 0">${j?'Cette liste, c’est ta progression. Pas l’XP, pas les cartes : <b>ce que tu sais jouer</b>.':'Aucun pour l’instant. <b>Un seul à la fois</b> — c’est la règle, et c’est pour ça que ça marchera.'}${repStarted()?' <span style="color:var(--dim)">('+repStarted()+' en chantier)</span>':''}</p>`;
    inner.appendChild(h);
    inner.appendChild(el('div','theory',`<div class="tip">🖐 <b>Tu joues aux doigts.</b> Chaque solo est noté pour ça : « idéal aux doigts » veut dire que ta technique est un <b>avantage</b> (arpèges, doubles-cordes, dynamique). « dur sans médiator » veut dire qu’il faudra réarranger les phrases pour qu’elles traversent les cordes au lieu de mitrailler une seule.</div>`));
    let pal=0;
    SOLOS.forEach(s=>{
      if(s.pal!==pal){ pal=s.pal; const t=el('h1','page',SOL_PAL[pal]);
        t.style.cssText='font-size:14px;color:var(--acc);margin:18px 0 8px;line-height:1.4'; inner.appendChild(t); }
      const n=repCount(s.id), done=repDone(s.id), cur=S.solo===s.id;
      const c=el('div','catcard'); if(done) c.style.opacity='.72'; if(cur) c.style.borderColor='var(--acc)';
      c.innerHTML=`<div class="ico">${done?'✅':s.ic}</div>
        <div class="t"><b>${s.t}${s.star?' ⭐':''}${cur?' <span style="color:var(--acc);font-size:11px">· EN COURS</span>':''}</b>
          <small>${s.a} · ${s.key} · ${DOIGTS[s.doigts]}</small>
          <div class="pips">${SOL_STEPS.map(st=>`<i class="${repStep(s.id,st.k)?'on':''}"></i>`).join('')}</div></div>
        <div class="pc">${n}/5</div>`;
      c.onclick=()=>openSolo(s); inner.appendChild(c);
    });
  });
}

/* ---- la fiche d’un solo ---- */
function openSolo(s){
  ac(); markDay();
  const SC=SC_DEF[s.sc], pcs=pcsFrom(s.root,SC.iv);
  openOverlay(s.t, inner=>{
    const cur=S.solo===s.id, n=repCount(s.id);
    const h=el('div','card'); h.style.borderColor='var(--acc)';
    h.innerHTML=`<b style="font-size:17px">${s.ic} ${s.t}</b><div style="color:var(--dim);font-size:13px;margin-top:2px">${s.a} · ${s.dur}</div>
      <div class="statgrid" style="margin-top:10px">
        <div class="stat"><b style="font-size:15px">${s.key}</b><small>tonalité</small></div>
        <div class="stat"><b style="font-size:15px">${SC.n}</b><small>ta gamme</small></div>
        <div class="stat"><b style="font-size:15px">${s.bpm}</b><small>BPM cible</small></div></div>
      <p class="lead" style="margin:10px 0 0">${DOIGTS[s.doigts]} · palier ${s.pal}</p>`;
    if(!cur && !repDone(s.id)){ const b=el('button','btn','🎯 En faire mon solo en cours');
      b.onclick=()=>{ S.solo=s.id; rep(s.id); save(); toast('🎯 '+s.t+' — c’est ton chantier'); openSolo(s); }; h.appendChild(b); }
    inner.appendChild(h);

    inner.appendChild(el('div','theory',`<h3>Pourquoi celui-là</h3><p>${s.pourquoi}</p>`));

    /* les 5 marches */
    const st=el('div','card'); st.innerHTML=`<div style="display:flex;justify-content:space-between"><b>Les 5 marches</b><span style="color:var(--acc);font-weight:800">${n}/5</span></div>`;
    SOL_STEPS.forEach((step,i)=>{
      const done=repStep(s.id,step.k);
      const row=el('div','step'+(!done && n===i?' now':'')); if(done) row.style.opacity='.62';
      row.innerHTML=`<div class="n">${done?'✓':i+1}</div><div><b>${step.n}</b><small>${step.d}</small></div>`;
      const t=el('div','tag'+(done?' on':''),done?'✓':'valider');
      t.style.cssText+='align-self:center;flex-shrink:0';
      t.onclick=()=>{ if(step.k==='prise' && !done){ S.solo=s.id; save(); openTake('libre','Solo · '+s.t); return; }
        if(repMark(s.id,step.k)){ toast(repDone(s.id)?'🏅 Solo au répertoire · +50 XP':'✓ marche franchie'); }
        openSolo(s); };
      row.appendChild(t); st.appendChild(row);
    });
    inner.appendChild(st);

    /* la carte du solo */
    const sc=el('div','card'); sc.innerHTML='<b>🗺 La carte du solo</b>';
    const ul=el('ul'); ul.style.cssText='margin:8px 0 0 18px;color:#d8cebf;line-height:1.6;font-size:14px';
    s.structure.forEach(x=>{ const li=document.createElement('li'); li.style.marginBottom='5px'; li.innerHTML=x; ul.appendChild(li); });
    sc.appendChild(ul);
    sc.appendChild(el('div','clogic',`<div class="deg">Les gestes à travailler</div>${s.gestes.map(g=>'• '+g).join('<br>')}`));
    sc.appendChild(el('div','theory',`<div class="tip">⚠️ <b>Le piège :</b> ${s.piege}</div>${s.accord?`<div class="tip">🎚 ${s.accord}</div>`:''}`));
    inner.appendChild(sc);

    /* la gamme sur le manche */
    const gc=el('div','card'); gc.appendChild(el('b',null,'🎸 Ta palette'));
    const fb=buildFretboard((str,f)=>pluck(midiAt(str,f))); gc.appendChild(fb);
    paintScale(fb,s.root,pcs,{labels:true, extra:s.extra?s.extra[0]:null});
    gc.appendChild(el('div','clogic',`<div class="deg">${SC.n} de ${NOTES[s.root]}</div>Notes : ${pcs.map(p=>NOTES[p]).join(' · ')}. Fondamentale en <b style="color:var(--bad)">rouge</b>.${s.extra?`<br><b style="color:var(--blue)">En bleu : ${NOTES[s.extra[0]]}</b> — ${s.extra[1]}.`:''}`));
    const pl=el('button','btn ghost','🔊 Écouter la gamme'); pl.onclick=()=>playScaleUp(s.root,SC.iv); gc.appendChild(pl);
    if(s.sc==='pm'||s.sc==='aeo'){ const bb=el('button','btn ghost','🗺 La boîte 1 dans cette tonalité');
      bb.onclick=()=>openBoxLook(0,s.root); gc.appendChild(bb); }
    inner.appendChild(gc);

    /* l’étude originale + le log de BPM */
    inner.appendChild(el('h1','page','L’étude'));
    inner.appendChild(el('p','lead','Une phrase que <b>j’ai écrite</b> pour ce solo : elle ne le copie pas, elle te fait travailler exactement son geste. Légende : b = bend, h = hammer, p = pull-off, / = slide, ~ = vibrato.'));
    inner.appendChild(lickCard(s.etude,true));

    /* écouter le morceau */
    const yt=document.createElement('a');
    yt.href='https://www.youtube.com/results?search_query='+encodeURIComponent(s.a+' '+s.t+' guitar solo');
    yt.target='_blank'; yt.rel='noopener noreferrer'; yt.className='btn ghost';
    yt.style.cssText='text-decoration:none;display:block'; yt.textContent='▶️ Écouter / voir le solo';
    inner.appendChild(yt);
    const rb=el('button','btn ghost','← Le répertoire'); rb.onclick=()=>openRepertoire(); inner.appendChild(rb);
  });
}

/* ================================================================
   PROFIL — le progrès rendu visible
   ================================================================ */
function guitarLevel(xp){
  const L=[[0,'Débutant'],[60,'Apprenti'],[160,'Rythmicien'],[350,'Soliste en herbe'],[650,'Improvisateur'],[1100,'Lead guitarist'],[1800,'Shredder'],[3000,'Maître du manche']];
  let cur=L[0], next=null;
  for(let i=0;i<L.length;i++){ if(xp>=L[i][0]){ cur=L[i]; next=L[i+1]||null; } }
  return {name:cur[1], min:cur[0], next};
}
function renderProfil(){
  const m=document.getElementById('main'); m.innerHTML='';
  m.appendChild(el('h1','page','Profil'));

  /* ce qui compte : le temps passé la guitare en main */
  const tot=Object.values(S.days||{}).reduce((a,b)=>a+(b.sec||0),0);
  const wks=[0,1,2,3].map(i=>weekMin(i)), bestW=Math.max(0,...Object.keys(S.days||{}).length?[weekMin(0),weekMin(1),weekMin(2),weekMin(3)]:[0]);
  const tc=el('div','card'); tc.style.borderColor='var(--acc)';
  tc.innerHTML=`<b>🎸 Guitare en main</b>`;
  tc.appendChild(el('div','statgrid',
    `<div class="stat"><b>${Math.round(tot/60)}</b><small>minutes au total</small></div>
     <div class="stat"><b>${weekMin()}</b><small>cette semaine</small></div>
     <div class="stat"><b>${playStreak()}</b><small>jours de suite</small></div>
     <div class="stat"><b>${daysPlayed(28)}/28</b><small>jours joués</small></div>
     <div class="stat"><b>${bestW}</b><small>meilleure semaine</small></div>
     <div class="stat"><b>${repJoue()}</b><small>solos au répertoire</small></div>`));
  tc.appendChild(chart28());
  m.appendChild(tc);

  /* l'objectif quotidien, réglable */
  const gc=el('div','card'); gc.innerHTML='<b>🎯 Ton objectif quotidien</b>';
  const gr=el('div','toolrow');
  [20,30,45,60].forEach(v=>{ const t=el('div','tag'+(goal()===v?' on':''),v+' min');
    t.onclick=()=>{ S.goal=v; save(); render(); }; gr.appendChild(t); });
  gc.appendChild(gr);
  gc.appendChild(el('p','lead','30 min/jour bat largement 3 h le dimanche. Choisis un chiffre que tu tiens <b>les mauvais jours</b>, pas les bons.'));
  m.appendChild(gc);

  /* les courbes de BPM : la progression technique, datée */
  const logs=Object.keys(S.bpmLog||{}).filter(k=>(S.bpmLog[k]||[]).length>=2);
  if(logs.length){
    const bc=el('div','card'); bc.innerHTML='<b>🥁 Tes tempos, dans le temps</b>';
    logs.slice(0,6).forEach(k=>{
      const L=S.bpmLog[k], first=L[0], last=L[L.length-1], mx=Math.max(...L.map(x=>x[1])), mn=Math.min(...L.map(x=>x[1]));
      const d=last[1]-first[1];
      const row=el('div'); row.style.cssText='margin-top:12px';
      row.innerHTML=`<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700"><span>${k}</span>
        <span style="color:${d>0?'var(--ok)':(d<0?'var(--bad)':'var(--dim)')}">${first[1]} → ${last[1]} BPM ${d>0?'(+'+d+')':(d<0?'('+d+')':'')}</span></div>`;
      const spark=el('div','chart'); spark.style.height='40px';
      L.slice(-28).forEach(pt=>{ const c=el('div','cbar hit'); const i2=el('i');
        i2.style.height=Math.max(4,Math.round(100*(pt[1]-Math.max(0,mn-10))/Math.max(1,mx-Math.max(0,mn-10))))+'%'; c.appendChild(i2); spark.appendChild(c); });
      row.appendChild(spark); bc.appendChild(row);
    });
    bc.appendChild(el('p','lead','Chaque « ✓ propre » au métronome est daté. <b>C’est ça, une preuve de progrès technique</b> — pas une impression.'));
    m.appendChild(bc);
  }

  const xp=S.xp||0, lvl=guitarLevel(xp);
  const lc=el('div','card'); lc.style.borderColor='var(--acc)';
  let prog=100, ptxt='niveau max atteint 🏆';
  if(lvl.next){ const span=lvl.next[0]-lvl.min; prog=Math.round((xp-lvl.min)/span*100); ptxt=`${lvl.next[0]-xp} XP → ${lvl.next[1]}`; }
  lc.innerHTML=`<b style="font-size:18px">${lvl.name}</b> <span style="float:right;color:var(--acc);font-weight:800">${xp} XP</span>
    <div style="background:var(--bg3);border-radius:10px;height:10px;margin:12px 0 4px;overflow:hidden"><div style="height:100%;width:${prog}%;background:var(--acc)"></div></div>
    <small style="color:var(--dim)">${ptxt}</small>
    <p class="lead" style="margin:10px 0 0;font-size:12.5px">L’XP mesure ce que tu <b>sais</b> et ce que tu <b>fais dans l’app</b>. Il ne mesure pas ton jeu. Le chiffre du haut, si.</p>`;
  m.appendChild(lc);
  const bpmVals=Object.values(S.bpm||{}), bestBpm=bpmVals.length?Math.max.apply(null,bpmVals):0;
  const cleanStrings=[0,1,2,3,4,5].filter(k=>{const b=sprintBest(k);return b&&b.clean;}).length;
  const rc=el('div','card'); rc.innerHTML='<b>Tes records</b>';
  rc.appendChild(el('div','statgrid',
    `<div class="stat"><b>${bestBpm||'—'}</b><small>meilleur BPM</small></div>
     <div class="stat"><b>${cleanStrings}/6</b><small>cordes ✓</small></div>
     <div class="stat"><b>${S.quizBest||0}/10</b><small>nommer cases</small></div>
     <div class="stat"><b>${bestFind()}</b><small>trouve tout</small></div>
     <div class="stat"><b>${S.powBest||0}/8</b><small>power chords</small></div>
     <div class="stat"><b>${S.duelBest||0}</b><small>record du Duel</small></div>`));
  m.appendChild(rc);
  const triK=tKnown(), triT=TRIADS.length; let chK=0, chT=0; CHORD_CATS.forEach(k=>{ chK+=cKnown(k.id); chT+=chordsIn(k.id).length; });
  function bar(label,val,tot){ const p=tot?Math.round(val/tot*100):0; return `<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700"><span>${label}</span><span style="color:var(--acc)">${val}/${tot}</span></div><div style="background:var(--bg3);border-radius:8px;height:8px;margin-top:5px;overflow:hidden"><div style="height:100%;width:${p}%;background:var(--acc)"></div></div></div>`; }
  const mc=el('div','card'); mc.innerHTML='<b>Ta maîtrise</b>'+bar('Solos joués en entier',repJoue(),SOLOS.length)+bar('Triades (leurs notes)',triK,triT)+bar('Formes d’accords',chK,chT)+bar('Cordes du manche',cleanStrings,6)+bar('Boîtes de gamme conquises',bxMastered(),5)+bar('Morceaux joués (Juke-box)',jbCount(),JUKE.length);
  m.appendChild(mc);
  const nb=el('div','card'); nb.style.borderColor='var(--acc2)';
  const dueC=cDueTotal(), dueT=tDue().length; let battle;
  if(dayMin()===0) battle={t:'Prendre la guitare',d:'Zéro minute aujourd’hui. Dix minutes valent mieux qu’une séance parfaite qui n’arrive pas.',go:()=>openPlay()};
  else if(soloCur() && !repDone(soloCur().id)) battle={t:'Ton solo : '+soloCur().t,d:'Marche '+Math.min(5,repCount(soloCur().id)+1)+'/5 — '+SOL_STEPS[Math.min(4,repCount(soloCur().id))].n+'.',go:()=>openSolo(soloCur())};
  else if(!soloCur()) battle={t:'Choisir un solo',d:'Un solo appris en entier vaut dix modules survolés. Commence par « Come As You Are ».',go:()=>openRepertoire()};
  else if(temoinDue()) battle={t:'Le témoin de la semaine',d:'45 s à enregistrer. C’est la seule mesure honnête de ton jeu.',go:()=>openTake('temoin')};
  else if(bxDueList().length) battle={t:'Entretien des gammes',d:bxDueList().length+' boîte(s) à revoir — si tu les rates, elles redescendent.',go:()=>openConquete()};
  else if(dueT>0) battle={t:'Réviser tes triades',d:dueT+' triade(s) dues — rafraîchis avant d’oublier.',go:()=>goTab('cartes')};
  else if(dueC>0) battle={t:'Réviser tes accords',d:dueC+' accord(s) dus.',go:()=>goTab('cartes')};
  else if(cleanStrings<6) battle={t:'Le sprint des cordes',d:'Il te reste des cordes à passer sans faute.',go:()=>openStringSprint()};
  else if((S.quizBest||0)<8) battle={t:'Nommer les cases',d:'Tu es à '+(S.quizBest||0)+'/10 — vise 8+.',go:()=>openNameQuiz()};
  else if(bpmVals.length===0) battle={t:'Un exo au métronome',d:'Chronomètre-toi : pose ton premier record de BPM.',go:()=>openSpeed()};
  else if(bxMastered()<5) battle={t:'La Conquête des gammes',d:BOXES[bxNext()].n+' t’attend — palier « '+BX_MODEN[Math.min(4,bx(bxNext()).lvl)]+' ».',go:()=>openConquete()};
  else if(jbCount()<JUKE.length) battle={t:'Le Juke-box',d:(JUKE.length-jbCount())+' morceau(x) pas encore joué(s). Les gammes, c’est pour ça.',go:()=>openJukebox()};
  else battle={t:'Improviser vite comme un pro',d:'Les fondations sont là. Va jouer.',go:()=>openFastImpro()};
  nb.innerHTML=`<b>⚔️ Ton prochain combat</b><p class="lead" style="margin:6px 0 10px">${battle.t} — ${battle.d}</p>`;
  const gb=el('button','btn','Y aller'); gb.onclick=battle.go; nb.appendChild(gb);
  m.appendChild(nb);
}

/* ---------------- overlay + nav ---------------- */
const overlay=document.getElementById('overlay'), overlayInner=document.getElementById('overlayInner');
function openOverlay(title,fill){ overlayInner.innerHTML=`<div class="topbar"><button class="back">←</button><b>${title}</b></div>`; overlayInner.querySelector('.back').onclick=closeOverlay; overlay.classList.add('open'); overlay.scrollTop=0; fill(overlayInner); }
function closeOverlay(){ overlay.classList.remove('open'); if(_progAuto){ clearInterval(_progAuto); _progAuto=null; } if(_sprintTimer){ clearInterval(_sprintTimer); _sprintTimer=null; } if(_duelT){ clearInterval(_duelT); _duelT=null; } if(typeof Loop!=='undefined') Loop.stop(); metroStop(); render(); }
let tab='jour';
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{ document.querySelectorAll('nav button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); tab=b.dataset.tab; metroStop(); render(); });
const NAVOF={manche:'biblio',theorie:'biblio',suite:'biblio'};
function goTab(t){ tab=t; const hi=NAVOF[t]||t; document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x.dataset.tab===hi)); metroStop(); render(); window.scrollTo(0,0); }
document.getElementById('badge').onclick=()=>goTab('profil');
function render(){ const b=document.getElementById('badge'); const tod=dayMin();
  b.innerHTML=`🎸 <b style="color:${tod>=goal()?'var(--ok)':'var(--acc)'}">${tod}</b>/${goal()} min`;
  document.getElementById('badge').style.cursor='pointer';
  if(tab==='jour')renderJour(); else if(tab==='manche')renderManche(); else if(tab==='cartes')renderCartes(); else if(tab==='gammes')renderGammes(); else if(tab==='biblio')renderBiblio(); else if(tab==='theorie')renderTheorie(); else if(tab==='profil')renderProfil(); else renderSuite(); }
