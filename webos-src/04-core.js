'use strict';
/* ═══════════════ SanjabOS Core ═══════════════ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a,b)=>a+Math.random()*(b-a);
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const uidC=(()=>{let i=0;return()=>'u'+(++i)})();

const S={
  get(k,d){try{const v=localStorage.getItem('sanjabos:'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem('sanjabos:'+k,JSON.stringify(v))}catch(e){}},
  del(k){localStorage.removeItem('sanjabos:'+k)}
};

const OS={
  ver:'1.0', codename:'سنجاب', booted:false,
  apps:{}, registerApp(a){this.apps[a.id]=a},
  openApp(id,args){WM.open(id,args)},
  notify(t,b,icon,gold){toast(icon||I('sparkles'),t,b,gold)},
  AI_NOTE:'⚠️ این بخش در نسخه نصبی روی سیستم فعال نیست و باید در هوشیار API Key بزنی.',
  aiChat:null,
  hooshyarCfg(){
    const c=S.get('ai',{key:'',base:'https://api.openai.com/v1',model:'gpt-4o-mini'});
    return c;
  },
  achieve(id){achieve(id)}
};

/* ---------- آیکون‌های خطی (glyph) ---------- */
const P={
 terminal:'M4 17l6-5-6-5M12 19h8',
 book:'M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z',
 sparkles:'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z',
 camera:'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z|M12 13m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
 github:'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22',
 filetext:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
 grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
 table:'M12 3v18M3 9h18M3 15h18M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
 ppt:'M2 3h20M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3M12 16v4M8 22l4-4 4 4',
 calc:'M4 2h16a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8',
 code:'M16 18l6-6-6-6M8 6l-6 6 6 6',
 brush:'M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z',
 pen:'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z',
 gamepad:'M6 12h4M8 10v4M15 13h.01M18 11h.01M17.32 5H6.68a4 4 0 0 0-3.978 3.59C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z',
 music:'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
 clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
 cloud:'M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.947 12.65a4 4 0 0 0-5.925-4.128M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z',
 timer:'M10 2h4M12 14l3-3M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
 sticky:'M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11l5-5V5a2 2 0 0 0-2-2ZM15 3v4a2 2 0 0 0 2 2h4',
 gear:'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z|M12 13m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
 info:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
 trophy:'M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z',
 shuffle:'M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
 check:'M20 6 9 17l-5-5', x:'M18 6 6 18M6 6l12 12', plus:'M12 5v14M5 12h14', minus:'M5 12h14',
 square:'M5 5h14v14H5z', play:'M6 4l14 8-14 8z', send:'M22 2 11 13M22 2l-7 20-4-9-9-4z',
 download:'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
 upload:'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
 refresh:'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
 search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
 save:'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
 trash:'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6',
 edit:'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z',
 image:'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
 zap:'M13 2 3 14h9l-1 8 10-12h-9l1-8z', users:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
 globe:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
 bot:'M12 8V4H8M4 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM9 13h.01M15 13h.01M9 17h6',
 key:'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4',
 folder:'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
 folderplus:'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v2M12 11v6M9 14h6',
 power:'M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10',
 copy:'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
 eye:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
 bulb:'M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14',
 heart:'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
 eraser:'M20 20H7L3 16a1 1 0 0 1 0-1.4L13.6 4a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4L11 19.4M6 12l6 6',
 undo:'M3 7v6h6M21 17a9 9 0 0 0-15-6.7L3 13',
 redo:'M21 7v6h-6M3 17a9 9 0 0 1 15-6.7L21 13',
 fill:'M19 11l-8-8-8.6 8.6a1 1 0 0 0 0 1.4l5.6 5.6a1 1 0 0 0 1.4 0zM5 2v5M2 4h6',
 type:'M4 7V4h16v3M9 20h6M12 4v16',
 bt:'M7 17 17 7M7 7h10v10',
 it:'M7 7h10v10M17 17 7 7',
 alignR:'M3 21h18M21 8H7M21 4H3M21 16H11M21 12H3',
 alignC:'M3 21h18M18 8H6M21 4H3M19 16H5M20 12H4',
 alignL:'M3 21h18M17 8H3M21 4H3M13 16H3M21 12H3',
 ul:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
 ol:'M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1',
 bold:'M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z',
 italic:'M19 4h-9M14 20H5M15 4 9 20',
 under:'M6 4v6a6 6 0 0 0 12 0V4M4 20h16',
 strike:'M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6M4 12h16',
 link:'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
 video:'M23 7l-7 5 7 5V7zM14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z',
 wifi:'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
 mic:'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4',
 home:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
 arrowr:'M5 12h14M12 5l7 7-7 7', arrowl:'M19 12H5M12 19l-7-7 7-7',
 palette:'M12 22a10 10 0 1 1 10-10c0 1.66-1.34 3-3 3h-2a2 2 0 0 0-2 2c0 .55.22 1.05.58 1.41A2 2 0 0 1 12 22zM7.5 11h.01M11 7.5h.01M15.5 9h.01',
 cpu:'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2M9 9h6v6H9z',
 rocket:'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2zM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5',
 star:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'
};
function I(n,sz){const d=(P[n]||P.info).split('|');
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'+(sz?' style="width:'+sz+'px;height:'+sz+'px"':'')+'>'+d.map(p=>'<path d="'+p+'"/>').join('')+'</svg>';
}
/* آیکون اپ (کاشی رنگی) */
function tile(g1,g2,glyph){
  const id=uidC();
  return '<svg viewBox="0 0 48 48"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+g1+'"/><stop offset="1" stop-color="'+g2+'"/></linearGradient></defs>'
  +'<rect x="2" y="2" width="44" height="44" rx="12" fill="url(#'+id+')"/>'
  +'<rect x="2" y="2" width="44" height="44" rx="12" fill="none" stroke="rgba(255,255,255,.25)"/>'
  +'<g transform="translate(12,12)" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">'+glyph+'</g></svg>';
}
function tileGlyph(name){return (P[name]||P.info).split('|').map(p=>'<path d="'+p+'"/>').join('')}
/* سنجاب کارتونی */
function squirrelSVG(sz){
  const id=uidC();
  return '<svg viewBox="0 0 100 100"'+(sz?' style="width:'+sz+'px;height:'+sz+'px"':'')+'><defs><linearGradient id="sq'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#ea8a0c"/></linearGradient></defs>'
  +'<path d="M58 76 C86 74 92 46 76 30 C66 20 52 26 57 39 C64 44 62 55 51 58" stroke="url(#sq'+id+')" stroke-width="13" fill="none" stroke-linecap="round"/>'
  +'<ellipse cx="43" cy="63" rx="21" ry="17" fill="#f59e0b"/>'
  +'<ellipse cx="43" cy="67" rx="12" ry="10" fill="#fde68a"/>'
  +'<circle cx="38" cy="37" r="15.5" fill="#f59e0b"/>'
  +'<circle cx="28" cy="26" r="6" fill="#f59e0b"/><circle cx="47" cy="25" r="6" fill="#f59e0b"/>'
  +'<circle cx="28" cy="26" r="3" fill="#fbbf24"/><circle cx="47" cy="25" r="3" fill="#fbbf24"/>'
  +'<ellipse cx="33" cy="42" rx="4.5" ry="3.4" fill="#fde68a"/><ellipse cx="43" cy="42" rx="4.5" ry="3.4" fill="#fde68a"/>'
  +'<circle cx="33" cy="36" r="2.1" fill="#1f2937"/><circle cx="43" cy="36" r="2.1" fill="#1f2937"/>'
  +'<circle cx="33.7" cy="35.3" r=".7" fill="#fff"/><circle cx="43.7" cy="35.3" r=".7" fill="#fff"/>'
  +'<ellipse cx="38" cy="40.5" rx="1.7" ry="1.2" fill="#7c2d12"/>'
  +'<path d="M35 43q3 2.4 6 0" stroke="#7c2d12" stroke-width="1.1" fill="none" stroke-linecap="round"/>'
  +'<path d="M22 39h-7M22 42l-6 2M54 39h7M54 42l6 2" stroke="rgba(0,0,0,.28)" stroke-width=".9" stroke-linecap="round"/>'
  +'<ellipse cx="36" cy="78" rx="5" ry="3.4" fill="#d97706"/><ellipse cx="50" cy="78" rx="5" ry="3.4" fill="#d97706"/>'
  +'</svg>';
}
const LOGO=(()=>{const im=$('#boot .boot-logo img');return im?im.src:''})();

/* ---------- والپیپرهای تولیدی ---------- */
const IRAN_PATH='M10 20 L18 14 L26 17 L31 12 L37 15 L42 10 L49 13 L54 9 L60 12 L66 8 L72 11 L77 7 L80 14 L84 20 L89 27 L85 34 L91 42 L87 51 L91 58 L84 63 L78 70 L70 74 L61 79 L53 76 L47 70 L41 73 L35 67 L29 61 L23 55 L18 47 L13 39 L8 31 L7 25 Z';
const WPS=[
 ['شفق قطبی',c=>{grad(c,'#0b1120','#1b1240');blob(c,'#8b5cf6',.78,.28,.55,.7);blob(c,'#f7931e',.16,.85,.4,.5);blob(c,'#0ea5a0',.5,.55,.35,.35);stars(c,240);vign(c)}],
 ['کوه‌های نئون',c=>{grad(c,'#171034','#f7931e',.68);sun(c,.5,.66,90,'#fbbf24');ridge(c,.6,'#241b4d',120);ridge(c,.7,'#8b5cf6',150,true);ridge(c,.82,'#3b2a68',110);ridge(c,.92,'#120d26',90);stars(c,120);vign(c)}],
 ['برند سانجاب',c=>{grad(c,'#fffbf5','#f3e8d9');sunRays(c,.5,.34,150,'#f7931e');c.fillStyle='#f7931e';c.globalAlpha=.9;arc(c,.5,.34,86);c.globalAlpha=1;bookShape(c,.5,.62,.44);dots(c,'#1a2744');}],
 ['مدار الکترونیکی',c=>{grad(c,'#0b1120','#0f1c33');circuit(c,'#0ea5a0');circuit(c,'#8b5cf6');vign(c)}],
 ['فضا و سیاره',c=>{grad(c,'#05070f','#101a38');stars(c,420);planet(c,.72,.34,110,'#8b5cf6','#4c1d95',true);planet(c,.2,.78,36,'#0ea5a0','#134e4a');nebula(c)}],
 ['کاشی ایرانی',c=>{grad(c,'#101532','#1a2744');girih(c,['#8b5cf6','#f7931e','#0ea5a0']);vign(c)}],
 ['موج‌های رنگی',c=>{grad(c,'#0d1226','#241b4d');for(let i=0;i<6;i++)wave(c,i,['#8b5cf6','#f7931e','#0ea5a0','#e11d48','#0f5cc0','#fbbf24'][i],.55+i*.07);stars(c,90);vign(c)}],
 ['ایران نئون',c=>{grad(c,'#070b18','#0d1b2e');neonIran(c,.5,.5,.9);particles(c,'#22d3ee',60);vign(c)}],
 ['افق سینت‌ویو',c=>{grad(c,'#1a0533','#f7931e',.62);sun(c,.5,.56,120,'#ff6b9d');synthGrid(c,'#0ea5a0');ridge(c,.62,'#2b0a45',100);vign(c)}],
 ['حباب‌های نور',c=>{grad(c,'#0b1120','#1e1b4b');for(let i=0;i<26;i++)bokeh(c,['#8b5cf6','#f7931e','#0ea5a0','#e11d48','#fbbf24'][i%5]);vign(c)}],
 ['نوارهای پاستلی',c=>{grad(c,'#fffbf5','#f3f0ed');for(let i=0;i<9;i++)diagStripe(c,i,['rgba(139,92,246,.16)','rgba(247,147,30,.16)','rgba(14,165,160,.15)'][i%3]);dots(c,'#8b5cf6')}],
 ['جنگل شب',c=>{grad(c,'#0a0f1e','#0d2b22',.7);moon(c,.78,.2,46);trees(c,'#050b0a');fireflies(c,40);squirrelSil(c,.24,.66)}],
 ['اقیانوس مه',c=>{grad(c,'#041e26','#0f5cc0',.75);for(let i=0;i<7;i++)wave(c,i*.9,['#0ea5a0','#11b7be','#5eead4'][i%3],.5+i*.06);stars(c,70);vign(c)}],
 ['غروب ابدی',c=>{grad(c,'#f7931e','#e11d48',.5);grad2(c,'#7c3aed','#1a2744',.55);clouds(c,'#ffffff');sun(c,.5,.7,105,'#fff7ed');birds(c);vign(c)}]
];
function mkC(){const cv=document.createElement('canvas');cv.width=1440;cv.height=900;return cv}
function dataURL(cv){return cv.toDataURL('image/jpeg',.82)}
function grad(c,a,b,pos=.75,vertical=true){const g=vertical?c.createLinearGradient(0,0,0,900):c.createLinearGradient(0,0,1440,0);g.addColorStop(0,a);g.addColorStop(pos,b);g.addColorStop(1,a);c.fillStyle=g;c.fillRect(0,0,1440,900)}
function grad2(c,a,b,pos){const g=c.createLinearGradient(0,900*pos,0,900);g.addColorStop(0,a+'00');g.addColorStop(1,a);c.fillStyle=g;c.globalAlpha=1;c.fillRect(0,0,1440,900)}
function blob(c,col,x,y,r,a){const g=c.createRadialGradient(1440*x,900*y,0,1440*x,900*y,1440*r*.5);g.addColorStop(0,col);g.addColorStop(1,col+'00');c.globalAlpha=a;c.fillStyle=g;c.fillRect(0,0,1440,900);c.globalAlpha=1}
function stars(c,n){c.fillStyle='#fff';for(let i=0;i<n;i++){c.globalAlpha=rnd(.15,.9);const r=rnd(.4,1.6);c.beginPath();c.arc(rnd(0,1440),rnd(0,900*.75),r,0,7);c.fill()}c.globalAlpha=1}
function vign(c){const g=c.createRadialGradient(720,450,300,720,450,900);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.42)');c.fillStyle=g;c.fillRect(0,0,1440,900)}
function sun(c,x,y,r,col){c.save();c.shadowColor=col;c.shadowBlur=90;c.fillStyle=col;c.beginPath();c.arc(1440*x,900*y,r,0,7);c.fill();c.restore()}
function moon(c,x,y,r){sun(c,x,y,r,'#f8fafc');c.fillStyle='rgba(0,0,0,.14)';c.beginPath();c.arc(1440*x-14,900*y-10,r*.9,0,7);c.fill()}
function ridge(c,base,col,amp,glow){c.fillStyle=col;c.beginPath();c.moveTo(0,900);let y=900*base;for(let x=0;x<=1440;x+=60){y=clamp(y+rnd(-amp/2,amp/2),900*base-amp,900*base+amp/2);c.lineTo(x,y)}c.lineTo(1440,900);c.closePath();if(glow){c.save();c.strokeStyle='rgba(255,255,255,.5)';c.shadowColor=col;c.shadowBlur=26;c.lineWidth=2.5;c.stroke()}c.fill();if(glow)c.restore()}
function sunRays(c,x,y,R,col){c.save();c.translate(1440*x,900*y);c.strokeStyle=col;c.lineWidth=10;c.lineCap='round';for(let i=0;i<12;i++){const a=i/12*Math.PI*2;c.beginPath();c.moveTo(Math.cos(a)*(R+26),Math.sin(a)*(R+26));c.lineTo(Math.cos(a)*(R+58),Math.sin(a)*(R+58));c.stroke()}c.restore()}
function arc(c,x,y,r){c.beginPath();c.arc(1440*x,900*y,r,0,7);c.fill()}
function bookShape(c,x,y,w){c.save();c.translate(1440*x,900*y);const W=1440*w;c.lineWidth=W*.075;c.lineJoin='round';
 c.strokeStyle='#11b7be';c.beginPath();c.moveTo(0,-W*.16);c.quadraticCurveTo(-W*.34,-W*.3,-W*.42,-W*.12);c.lineTo(-W*.42,W*.14);c.quadraticCurveTo(-W*.2,-W*.02,0,W*.16);c.closePath();c.stroke();
 c.strokeStyle='#0f5cc0';c.beginPath();c.moveTo(0,-W*.16);c.quadraticCurveTo(W*.34,-W*.3,W*.42,-W*.12);c.lineTo(W*.42,W*.14);c.quadraticCurveTo(W*.2,-W*.02,0,W*.16);c.closePath();c.stroke();
 c.strokeStyle='#f7931e';c.beginPath();c.moveTo(0,-W*.16);c.lineTo(0,W*.16);c.stroke();c.restore()}
function dots(c,col){c.fillStyle=col;c.globalAlpha=.13;for(let x=0;x<1440;x+=46)for(let y=0;y<900;y+=46){c.beginPath();c.arc(x,y,1.6,0,7);c.fill()}c.globalAlpha=1}
function circuit(c,col){c.strokeStyle=col;c.globalAlpha=.5;c.lineWidth=2;for(let i=0;i<26;i++){let x=rnd(0,1440),y=rnd(0,900);c.beginPath();c.moveTo(x,y);for(let s=0;s<5;s++){if(Math.random()<.5)x+=rnd(-160,160);else y+=rnd(-120,120);c.lineTo(x,y)}c.stroke();c.fillStyle=col;c.beginPath();c.arc(x,y,4,0,7);c.fill()}c.globalAlpha=1}
function planet(c,x,y,r,c1,c2,ring){const g=c.createRadialGradient(1440*x-r*.4,900*y-r*.4,r*.1,1440*x,900*y,r);g.addColorStop(0,c1);g.addColorStop(1,c2);c.fillStyle=g;c.beginPath();c.arc(1440*x,900*y,r,0,7);c.fill();if(ring){c.save();c.translate(1440*x,900*y);c.rotate(-.5);c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=7;c.beginPath();c.ellipse(0,0,r*1.7,r*.42,0,0,7);c.stroke();c.restore()}}
function nebula(c){blob(c,'#e11d48',.35,.3,.4,.28);blob(c,'#0ea5a0',.6,.7,.4,.22)}
function girih(c,cols){c.strokeStyle=cols[0];c.globalAlpha=.4;c.lineWidth=1.6;const s=88;for(let x=0;x<1440+s;x+=s)for(let y=0;y<900+s;y+=s){c.save();c.translate(x,y);c.rotate(Math.PI/8);star8(c,s*.52,cols[(x/s+y/s)%3]);c.restore()}c.globalAlpha=1}
function star8(c,r,col){c.strokeStyle=col;c.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,rr=i%2?r*.45:r;c[i?'lineTo':'moveTo'](Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath();c.stroke()}
function wave(c,i,col,base){c.fillStyle=col;c.globalAlpha=.5;c.beginPath();c.moveTo(0,900);const off=i*130;for(let x=0;x<=1440;x+=24)c.lineTo(x,900*base+Math.sin(x*.006+off)*70+Math.sin(x*.013+off*2)*36);c.lineTo(1440,900);c.closePath();c.fill();c.globalAlpha=1}
function neonIran(c,x,y,sc){c.save();c.translate(1440*x-500*sc,900*y-430*sc);c.scale(10*sc,10*sc);c.shadowColor='#22d3ee';c.shadowBlur=2.4/c.scaleX||4;c.shadowBlur=4;c.strokeStyle='#22d3ee';c.lineWidth=.45;c.lineJoin='round';c.stroke(IRAN_PATH);c.fillStyle='rgba(34,211,238,.08)';c.fill(IRAN_PATH);c.restore()}
function particles(c,col,n){for(let i=0;i<n;i++){c.globalAlpha=rnd(.1,.6);c.fillStyle=col;c.beginPath();c.arc(rnd(0,1440),rnd(0,900),rnd(1,3.4),0,7);c.fill()}c.globalAlpha=1}
function synthGrid(c,col){c.strokeStyle=col;c.globalAlpha=.5;const hz=900*.56;for(let i=0;i<=28;i++){c.lineWidth=1;c.beginPath();c.moveTo(i*52,900);c.lineTo(720+(i*52-720)*.22,hz);c.stroke()}for(let i=1;i<12;i++){const y=hz+Math.pow(i/12,2.2)*(900-hz);c.beginPath();c.moveTo(0,y);c.lineTo(1440,y);c.stroke()}c.globalAlpha=1}
function bokeh(c,col){const g=c.createRadialGradient(0,0,0,0,0,rnd(30,110));g.addColorStop(0,col);g.addColorStop(1,col+'00');c.save();c.translate(rnd(0,1440),rnd(0,900));c.fillStyle=g;c.beginPath();c.arc(0,0,110,0,7);c.fill();c.restore()}
function diagStripe(c,i,col){c.fillStyle=col;c.save();c.translate(i*180-200,0);c.rotate(.5);c.fillRect(0,-400,90,1900);c.restore()}
function trees(c,col){c.fillStyle=col;c.beginPath();c.moveTo(0,900);for(let x=0;x<=1440;x+=rnd(46,90)){const h=rnd(120,330);c.lineTo(x+30,900-h);c.lineTo(x+60,900)}c.lineTo(1440,900);c.closePath();c.fill()}
function fireflies(c,n){for(let i=0;i<n;i++){c.globalAlpha=rnd(.3,.95);c.fillStyle='#fbbf24';c.shadowColor='#fbbf24';c.shadowBlur=9;c.beginPath();c.arc(rnd(0,1440),rnd(300,880),rnd(1.4,3),0,7);c.fill()}c.shadowBlur=0;c.globalAlpha=1}
function squirrelSil(c,x,y){c.save();c.translate(1440*x,900*y);c.scale(1.4,1.4);c.fillStyle='rgba(0,0,0,.88)';c.beginPath();c.ellipse(0,0,30,20,0,0,7);c.fill();c.beginPath();c.arc(-24,-18,14,0,7);c.fill();c.strokeStyle='rgba(0,0,0,.88)';c.lineWidth=11;c.lineCap='round';c.beginPath();c.moveTo(26,4);c.bezierCurveTo(58,0,60,-34,42,-44);c.stroke();c.restore()}
function clouds(c,col){c.fillStyle=col;for(let i=0;i<7;i++){c.globalAlpha=rnd(.12,.3);const x=rnd(0,1440),y=rnd(80,430),w=rnd(120,320);c.beginPath();c.ellipse(x,y,w,26,0,0,7);c.fill()}c.globalAlpha=1}
function birds(c){c.strokeStyle='rgba(30,20,40,.8)';c.lineWidth=2.4;c.lineCap='round';for(let i=0;i<7;i++){const x=rnd(200,1200),y=rnd(120,380),s=rnd(7,15);c.beginPath();c.moveTo(x-s,y);c.quadraticCurveTo(x-s/2,y-s,x,y);c.quadraticCurveTo(x+s/2,y-s,x+s,y);c.stroke()}}
let WALLS=[];
function buildWalls(){WALLS=WPS.map(([name,fn])=>{const cv=mkC();const c=cv.getContext('2d');try{fn(c)}catch(e){}return{name,url:dataURL(cv)}})}
function setWall(i,instant){
  const cur=$('#wallA'),nxt=$('#wallB');const a=instant?cur:nxt,b=instant?nxt:cur;
  a.style.backgroundImage='url('+WALLS[i%WALLS.length].url+')';a.style.opacity=1;b.style.opacity=0;
  S.set('wall',i%WALLS.length);
}
let wallIdx=0,wallTimer=null;
function nextWall(){wallIdx=(wallIdx+1)%WALLS.length;setWall(wallIdx)}
function startWallRot(){clearInterval(wallTimer);if(S.get('wallrot',true))wallTimer=setInterval(nextWall,30000)}

/* ---------- اعلان و دستاورد ---------- */
function toast(icon,title,body,gold){
  const t=document.createElement('div');t.className='toast'+(gold?' gold':'');
  t.innerHTML='<div class="ti">'+(typeof icon==='string'&&icon.startsWith('<')?icon:I(icon))+'</div><div><div class="tt">'+esc(title)+'</div>'+(body?'<div class="tb">'+esc(body)+'</div>':'')+'</div>';
  $('#toasts').appendChild(t);
  setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),450)},4200);
}
const ACH={
  boot:['اولین بوت','برای اولین بار SanjabOS را روشن کردی'],
  firstcmd:['اولین دستور','اولین دستورت را در ترمینال اجرا کردی'],
  lsmaster:['استاد ls','۱۰ بار ls اجرا کردی'],
  filelord:['ارباب فایل‌ها','mkdir و touch و rm را اجرا کردی'],
  piper:['لوله‌کش حرفه‌ای','اولین pipe ( | ) را ساختی'],
  cmd20:['کنجکاو','۲۰ دستور مختلف اجرا کردی'],
  aptuser:['مدیر بسته','با apt یک بسته نصب کردی'],
  pyhero:['قهرمان پایتون','اولین کد پایتون را اجرا کردی'],
  artist:['هنرمند','یک نقاشی از پینت خروجی گرفتی'],
  writer:['نویسنده','یک سند ورد ذخیره/خروجی گرفتی'],
  geeker:['گیک گیت‌هاب','حساب گیت‌هابت را وصل کردی'],
  gamer:['بازیباز','در یک بازی امتیاز گرفتی'],
  petfriend:['دوست سنجاب','۱۰ بار به سنجاب غذا دادی'],
  camerastar:['ستاره دوربین','اولین تشخیص چهره را انجام دادی'],
  linuxgrad:['فارغ‌التحصیل لینوکس','همه درس‌های مقدماتی آکادمی را تمام کردی'],
  nightowl:['شب‌زنده‌دار','بعد از نیمه‌شب هم بیدار بودی!']
};
function achieve(id){
  const got=S.get('ach',[]);
  if(got.includes(id))return;
  got.push(id);S.set('ach',got);
  const a=ACH[id];if(a)toast(I('trophy'),'🏆 دستاورد: '+a[0],a[1],true);
}
function stat(n,v){const s=S.get('stats',{});s[n]=(s[n]||0)+v;S.set('stats',s)}

/* ---------- مدیریت پنجره ---------- */
const WM={
  wins:new Map(),zTop:100,
  open(id,args){
    const app=OS.apps[id];if(!app)return;
    for(const w of this.wins.values())if(w.appId===id){w.el.classList.remove('minimized');this.focus(w);return w}
    const desk=$('#desk'),dw=desk.clientWidth,dh=desk.clientHeight;
    const ww=Math.min(typeof app.w==='function'?app.w():app.w||720,dw-16), hh=Math.min(typeof app.h==='function'?app.h():app.h||520,dh-12);
    const n=this.wins.size;
    const win={appId:id,el:null,minimized:false,maxed:false,prev:null};
    const el=document.createElement('section');el.className='win active';el.setAttribute('role','dialog');el.setAttribute('aria-label',app.name);
    el.style.width=ww+'px';el.style.height=hh+'px';
    el.style.right=clamp(dw-ww-40-(n%5)*26,6,Math.max(6,dw-ww-6))+'px';
    el.style.top=clamp(20+(n%6)*24,6,Math.max(6,dh-hh-6))+'px';
    el.style.zIndex=++this.zTop;
    el.innerHTML='<header class="win-title"><span class="wt-ic">'+app.icon()+'</span><span class="t">'+esc(app.name)+'</span>'
      +'<div class="win-btns"><button class="wbtn close" title="بستن">'+I('x')+'</button><button class="wbtn max" title="حداکثر">'+I('square')+'</button><button class="wbtn min" title="کمینه">'+I('minus')+'</button></div></header>'
      +'<div class="win-body"></div><div class="win-resize"></div>';
    win.el=el;win.body=$('.win-body',el);
    desk.appendChild(el);this.wins.set(el,win);
    $('.wbtn.close',el).onclick=e=>{e.stopPropagation();this.close(win)};
    $('.wbtn.max',el).onclick=e=>{e.stopPropagation();this.toggleMax(win)};
    $('.wbtn.min',el).onclick=e=>{e.stopPropagation();this.minimize(win)};
    el.addEventListener('pointerdown',()=>this.focus(win),true);
    const tb=$('.win-title',el);
    tb.addEventListener('pointerdown',e=>{if(e.target.closest('.wbtn'))return;this.dragStart(win,e)});
    tb.addEventListener('dblclick',e=>{if(!e.target.closest('.wbtn'))this.toggleMax(win)});
    $('.win-resize',el).addEventListener('pointerdown',e=>this.resizeStart(win,e));
    try{app.mount(win.body,win,args||{})}catch(err){win.body.innerHTML='<div style="padding:20px" class="ai-note">خطا در باز کردن برنامه: '+esc(err.message)+'</div>';console.error(err)}
    stat('appOpens',1);this.syncTask();this.focus(win);
    if(this.wins.size>=10)achieve('curious10');
    return win;
  },
  close(win){try{win.app&&win.app.onClose&&win.app.onClose(win)}catch(e){}win.el.remove();this.wins.delete(win.el);this.syncTask()},
  minimize(win){win.el.classList.add('minimized');win.minimized=true;this.syncTask()},
  restore(win){win.el.classList.remove('minimized');win.minimized=false;this.focus(win);this.syncTask()},
  toggleMax(win){
    const desk=$('#desk');
    if(win.maxed){Object.assign(win.el.style,win.prev);win.maxed=false;win.el.classList.remove('max')}
    else{win.prev={right:win.el.style.right,top:win.el.style.top,width:win.el.style.width,height:win.el.style.height};
      Object.assign(win.el.style,{right:'0px',top:'0px',width:desk.clientWidth+'px',height:desk.clientHeight+'px'});
      win.maxed=true;win.el.classList.add('max')}
    win.app&&win.app.onResize&&win.app.onResize(win);
  },
  focus(win){
    for(const w of this.wins.values())w.el.classList.remove('active');
    win.el.classList.add('active');win.el.style.zIndex=++this.zTop;this.syncTask();
  },
  dragStart(win,e){
    if(win.maxed)return;
    const el=win.el,desk=$('#desk');
    const sx=e.clientX,sy=e.clientY,r0=parseFloat(el.style.right),t0=parseFloat(el.style.top);
    el.setPointerCapture&&el.setPointerCapture(e.pointerId);
    const mv=ev=>{const dx=ev.clientX-sx,dy=ev.clientY-sy;
      el.style.right=clamp(r0-dx,-el.offsetWidth+70,desk.clientWidth-70)+'px';
      el.style.top=clamp(t0+dy,0,desk.clientHeight-46)+'px'};
    const up=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up)};
    window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);
  },
  resizeStart(win,e){
    e.preventDefault();e.stopPropagation();
    const el=win.el,sx=e.clientX,sy=e.clientY,w0=el.offsetWidth,h0=el.offsetHeight;
    const mv=ev=>{el.style.width=clamp(w0+(sx-ev.clientX),300,window.innerWidth-8)+'px';el.style.height=clamp(h0+(sy-ev.clientY),200,window.innerHeight-60)+'px';win.app&&win.app.onResize&&win.app.onResize(win)};
    const up=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up)};
    window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);
  },
  syncTask(){
    const tb=$('#tbApps');tb.innerHTML='';
    for(const w of this.wins.values()){
      const app=OS.apps[w.appId];
      const b=document.createElement('button');b.className='tb-btn'+(w.el.classList.contains('active')&&!w.minimized?' on':'');
      b.title=app.name;b.innerHTML=app.icon()+'<span class="t">'+esc(app.name)+'</span>';
      b.onclick=()=>{w.minimized||!w.el.classList.contains('active')?(w.minimized?WM.restore(w):WM.focus(w)):WM.minimize(w)};
      tb.appendChild(b);
    }
  }
};

/* ---------- استارت منو ---------- */
const CATS=[['آموزش','book'],['هوش مصنوعی','sparkles'],['اداری','filetext'],['خلاقیت','brush'],['سیستم','gear'],['سرگرمی','gamepad']];
function renderStart(filter){
  const body=$('#smBody');body.innerHTML='';
  CATS.forEach(([cat,ic])=>{
    const apps=Object.values(OS.apps).filter(a=>a.cat===cat&&(!filter||a.name.includes(filter)));
    if(!apps.length)return;
    const d=document.createElement('div');d.className='sm-cat';
    d.innerHTML='<div class="sm-cat-t">'+I(ic,13)+' '+cat+'</div>';
    const g=document.createElement('div');g.className='sm-grid';
    apps.forEach(a=>{
      const b=document.createElement('button');b.className='sm-app';b.innerHTML=a.icon()+'<span class="n">'+esc(a.name)+'</span>';
      b.onclick=()=>{WM.open(a.id);toggleStart(false)};
      g.appendChild(b);
    });
    d.appendChild(g);body.appendChild(d);
  });
  if(!body.children.length)body.innerHTML='<div class="hint" style="padding:20px;text-align:center">چیزی پیدا نشد 🤷</div>';
}
function toggleStart(show){
  const m=$('#startmenu');const to=show==null?!m.classList.contains('open'):show;
  m.classList.toggle('open',to);
  if(to){renderStart('');$('#smSearch').value='';$('#smSearch').focus()}
}

/* ---------- ساعت ---------- */
function tickClock(){
  const now=new Date();
  const h=new Intl.DateTimeFormat('fa-IR',{hour:'2-digit',minute:'2-digit'}).format(now);
  const d=new Intl.DateTimeFormat('fa-IR',{weekday:'short',day:'numeric',month:'long'}).format(now);
  $('#tbClock').innerHTML='<div class="h">'+h+'</div><div class="d">'+d+'</div>';
  if(now.getHours()<5&&now.getHours()>=0)achieve('nightowl');
}

/* ---------- سنجاب خانگی ---------- */
const PET={
  hunger:S.get('peth',80),fed:S.get('petfed',0),
  lines:['سلام! من سنجاب سانجابم!','یه فندق داری؟','لینوکس رو یاد بگیر، خیلی باحاله!','ترمینال ترسناک نیست، قول میدم!','با اسپانسری سانجاب!','apt install فندق — خطا: فندق پیدا نشد 😄','تو بهترین کاربر این سیستم هستی!','پایتون رو امتحان کن، عاشقش میشی!'],
  init(){
    const p=$('#pet');$('#petSvg').innerHTML=squirrelSVG();
    p.addEventListener('click',()=>this.feed());
    let drag=false;
    p.addEventListener('pointerdown',e=>{drag=false;const sx=e.clientX,sy=e.clientY,r0=p.getBoundingClientRect();
      const mv=ev=>{if(Math.abs(ev.clientX-sx)>4||Math.abs(ev.clientY-sy)>4){drag=true;p.style.right=(window.innerWidth-r0.right+(r0.right-ev.clientX))+'px';p.style.bottom=(window.innerHeight-r0.bottom+(ev.clientY-r0.bottom))+'px'}};
      const up=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);if(!drag)this.feed()};
      window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up)});
    setInterval(()=>{this.hunger=Math.max(0,this.hunger-1);S.set('peth',this.hunger);this.render()},20000);
    setInterval(()=>{if(Math.random()<.5)this.say()},50000);
    this.render();
  },
  feed(){
    this.hunger=Math.min(100,this.hunger+18);S.set('peth',this.hunger);
    this.fed++;S.set('petfed',this.fed);stat('fed',1);
    this.say(['نم‌نم! ممنون! 🌰','لذیذ بود!','بهترین دوستم هستی!','فندق = سوخت سنجاب']);
    this.render();
    if(this.fed>=10)achieve('petfriend');
  },
  say(t){const b=$('#petBubble');b.textContent=Array.isArray(t)?t[Math.floor(Math.random()*t.length)]:(t||this.lines[Math.floor(Math.random()*this.lines.length)]);
    b.classList.add('show');clearTimeout(this._bt);this._bt=setTimeout(()=>b.classList.remove('show'),3200)},
  render(){
    $('#petHunger').style.width=this.hunger+'%';
    $('#pet').style.opacity=this.hunger<15?.75:1;
  }
};

/* ---------- یادداشت چسبان ---------- */
const STICKY={cols:['#fde68a','#fca5a5','#a7f3d0','#bfdbfe','#ddd6fe'],
  list:S.get('sticky',[]),
  init(){(S.get('stickyOn',[])||[]).forEach(()=>0)},
  add(){
    const colors=this.cols[this.list.length%this.cols.length];
    const n={id:Date.now(),x:30+Math.random()*220,y:40+Math.random()*160,c:colors,t:''};
    this.list.push(n);this.save();this.render(n);
    $('#desk').appendChild(n.el);
  },
  render(n){
    const el=document.createElement('div');el.className='sticky';el.style.background=n.c;el.style.color='#1f2937';
    el.style.right=n.x+'px';el.style.top=n.y+'px';
    el.innerHTML='<div class="st-head"><span>یادداشت</span><button class="st-x" title="حذف">×</button></div><textarea placeholder="بنویس…"></textarea>';
    const ta=$('textarea',el);ta.value=n.t;
    ta.oninput=()=>{n.t=ta.value;this.save()};
    $('.st-x',el).onclick=()=>{el.remove();this.list=this.list.filter(m=>m!==n);this.save()};
    const head=$('.st-head',el);
    head.addEventListener('pointerdown',e=>{
      if(e.target.closest('.st-x'))return;
      const sx=e.clientX,sy=e.clientY,x0=n.x,y0=n.y;
      const mv=ev=>{n.x=clamp(x0+(sx-ev.clientX),0,window.innerWidth-120);n.y=clamp(y0+(ev.clientY-sy),0,window.innerHeight-140);el.style.right=n.x+'px';el.style.top=n.y+'px'};
      const up=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);this.save()};
      window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);
    });
    n.el=el;
  },
  mountAll(){this.list.forEach(n=>{this.render(n);$('#desk').appendChild(n.el)})},
  save(){S.set('sticky',this.list.map(n=>({id:n.id,x:n.x,y:n.y,c:n.c,t:n.t})))}
};

/* ---------- محافظ صفحه ---------- */
const SS={t:null,
  init(){
    $('#ss-logo').innerHTML=squirrelSVG(110);
    const reset=()=>{clearTimeout(this.t);this.t=setTimeout(()=>$('#screensaver').classList.add('on'),180000)};
    ['pointerdown','pointermove','keydown','wheel','touchstart'].forEach(ev=>window.addEventListener(ev,()=>{$('#screensaver').classList.remove('on');reset()},{passive:true}));
    reset();
  }
};

/* ---------- بوت ---------- */
const BOOT_STEPS=['booting sanjab-kernel 6.6-squirrel…','mounting /dev/cuteness…','loading persian fonts…','painting desktop wallpaper…','waking up the pet squirrel…','connecting to sunjob.ir sponsors…','starting hooSHYAR AI service…','welcome! خوش آمدی!'];
function boot(){
  const bar=$('#bootBar'),st=$('#bootSteps');let i=0;
  const step=()=>{bar.style.width=((i+1)/BOOT_STEPS.length*100)+'%';st.textContent=BOOT_STEPS[i];i++;
    if(i<BOOT_STEPS.length)setTimeout(step,240+Math.random()*260);
    else setTimeout(finish,420)};
  const finish=()=>{
    $('#boot').classList.add('off');
    $('#iranNeon').classList.add('off');
    $('#os').classList.add('on');
    OS.booted=true;
    achieve('boot');
    toast(I('sparkles'),'به SanjabOS خوش آمدی!','با اسپانسری سانجاب — استارت را بزن یا روی سنجاب کلیک کن ✨');
    if(!S.get('seen',false)){S.set('seen',true);setTimeout(()=>WM.open('about'),900)}
  };
  setTimeout(step,300);
}
function shutdown(){
  $('#poweroff').style.display='flex';
}
function reboot(){
  try{S.set('rebooting',true)}catch(e){}
  location.reload();
}

/* ---------- شروع ---------- */
window.addEventListener('DOMContentLoaded',()=>{
  LOGO_FIX();
  buildWalls();
  wallIdx=S.get('wall',0);
  setWall(wallIdx,true);startWallRot();
  PET.init();STICKY.mountAll();SS.init();
  tickClock();setInterval(tickClock,1000);
  $('#btnStart').onclick=e=>{e.stopPropagation();toggleStart()};
  document.addEventListener('click',e=>{if(!e.target.closest('#startmenu,#btnStart'))toggleStart(false)});
  $('#smSearch').addEventListener('input',e=>renderStart(e.target.value.trim()));
  $('#btnShutdown').onclick=()=>shutdown();
  $('#btnReboot').onclick=()=>reboot();
  $('#btnPowerOn').onclick=()=>location.reload();
  $('#tbShuffle').innerHTML=I('shuffle');$('#tbShuffle').onclick=()=>{nextWall();toast(I('image'),'والپیپر عوض شد',WALLS[wallIdx][0])};
  $('#tbSticky').innerHTML=I('sticky');$('#tbSticky').onclick=()=>STICKY.add();
  $('#tbClock').onclick=()=>WM.open('clock');
  renderDeskIcons();
  window.addEventListener('keydown',e=>{
    if(e.ctrlKey&&e.altKey&&e.key.toLowerCase()==='t'){e.preventDefault();WM.open('terminal')}
    if(e.key==='Escape')toggleStart(false);
  });
  if(S.get('rebooting',false)){S.set('rebooting',false);toast(I('refresh'),'سیستم دوباره بالا آمد','راه‌اندازی مجدد کامل شد ✅')}
  setTimeout(boot,150);
});
function LOGO_FIX(){}
function renderDeskIcons(){
  const wrap=$('#deskIcons');wrap.innerHTML='';
  Object.values(OS.apps).filter(a=>a.desk).forEach(a=>{
    const d=document.createElement('div');d.className='desk-icon';d.tabIndex=0;
    d.innerHTML=a.icon()+'<span class="di-name">'+esc(a.name)+'</span>';
    d.onclick=()=>{$$('.desk-icon').forEach(x=>x.classList.remove('sel'));d.classList.add('sel')};
    d.ondblclick=()=>WM.open(a.id);
    d.onkeydown=e=>{if(e.key==='Enter')WM.open(a.id)};
    wrap.appendChild(d);
  });
}
