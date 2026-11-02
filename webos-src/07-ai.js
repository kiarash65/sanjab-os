'use strict';
/* ═══════════════ هوش مصنوعی: هوشیار + GLM + ایده‌ها ═══════════════ */
OS.aiChat=async function(messages,opts){
  opts=opts||{};
  const cfg=OS.hooshyarCfg();
  const tryGlm=async()=>{
    let r;
    try{r=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages})})}
    catch(e){throw new Error('NO_BACKEND')}
    if(!r.ok)throw new Error('NO_BACKEND');
    let j;
    try{j=await r.json()}catch(e){throw new Error('NO_BACKEND')}
    if(!j.ok)throw new Error(j.error||'NO_BACKEND');
    return {source:'glm',text:j.reply||'پاسخی نیامد'};
  };
  const tryHsh=async()=>{
    if(!cfg.key)throw new Error('NO_BACKEND');
    let res;
    try{
      res=await fetch(cfg.base.replace(/\/+$/,'')+'/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.key},
        body:JSON.stringify({model:cfg.model||'gpt-4o-mini',messages:messages,temperature:.7})
      });
    }catch(e){throw new Error('اتصال به سرویس ناموفق بود — Base URL را چک کن (مشکل CORS هم می‌تواند باشد)')}
    const j=await res.json().catch(()=>null);
    const txt=j&&j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;
    if(!txt){
      const em=(j&&j.error&&j.error.message)||('کد '+res.status);
      throw new Error('سرویس پاسخ نداد: '+em);
    }
    return {source:'hsh',text:txt};
  };
  if(opts.backend==='glm')return tryGlm();
  if(opts.backend==='hsh')return tryHsh();
  if(cfg.key){try{return await tryHsh()}catch(e){if(e.message==='NO_BACKEND')throw e;return await tryGlm()}}
  return tryGlm();
};
const SYS_HOOSHYAR='تو «هوشیار» هستی؛ دستیار هوشمند سیستم‌عامل SanjabOS (با اسپانسری سانجاب). فارسی، صمیمی، کوتاه و مفید جواب بده. اگر سوال لینوکسی بود، مثال ترمینال هم بده.';
function aiMsgHTML(m){
  return '<div class="msg '+(m.role==='user'?'user':'bot')+'">'+esc(m.content)
    +(m.src?'<span class="src">'+(m.src==='glm'?'🟢 جی‌ال‌ام (نسخه وب SanjabOS)':'🟠 مدل شخصی شما (هوشیار)')+'</span>':'')+'</div>';
}
function mountChatBox(host,opts){
  opts=opts||{};
  host.innerHTML='<div class="ai-chat long-scroll"></div><div class="ai-input"><textarea class="inp" rows="1" placeholder="سوالت را بنویس… (Enter = ارسال)"></textarea><button class="btn primary send">'+I('send')+' ارسال</button></div>';
  const list=host.querySelector('.ai-chat'),ta=host.querySelector('textarea'),btn=host.querySelector('.send');
  let msgs=opts.msgs||[];
  const draw=()=>{list.innerHTML=msgs.map(aiMsgHTML).join('')||'<div class="hint" style="text-align:center;padding:30px">سلام! من هوشیار هستم 🤖<br>هر سوالی داری بپرس — لینوکس، پایتون، درس، زندگی…</div>';list.scrollTop=list.scrollHeight};
  const send=async()=>{
    const q=ta.value.trim();
    if(!q)return;
    ta.value='';
    msgs.push({role:'user',content:q});
    draw();
    const t=document.createElement('div');
    t.className='msg bot';
    t.innerHTML='<span class="typing-dots"><i></i><i></i><i></i></span>';
    list.appendChild(t);list.scrollTop=list.scrollHeight;
    try{
      const r=await OS.aiChat([{role:'assistant',content:SYS_HOOSHYAR}].concat(msgs.slice(-12)),{backend:opts.backend||'auto'});
      msgs.push({role:'assistant',content:r.text,src:r.source});
    }catch(e){
      msgs.push({role:'assistant',content:e.message==='NO_BACKEND'?OS.AI_NOTE:('⚠️ '+e.message)});
    }
    if(opts.onDone)opts.onDone(msgs);
    draw();
  };
  btn.onclick=send;
  ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
  draw();
  return {clear(){msgs=[];draw();if(opts.onDone)opts.onDone(msgs)}};
}
/* — اپ هوشیار — */
OS.registerApp({
  id:'hooshyar',name:'هوشیار (AI)',cat:'هوش مصنوعی',desk:true,pinned:true,
  icon:()=>tile('#8b5cf6','#5b21b6',tileGlyph('sparkles')),
  w:()=>Math.min(900,innerWidth-20),h:600,
  mount(body,win,args){
    body.innerHTML='<div style="display:flex;height:100%">'
      +'<div style="flex:1;display:flex;flex-direction:column;min-width:0" id="hsh-main"></div>'
      +'<aside class="ai-side"><div class="tabs" style="margin:0"><button class="on" data-t="hsh">هوشیار</button><button data-t="glm">جی‌ال‌ام</button></div>'
      +'<div id="hsh-cfg">'
      +'<div class="tag orange" style="align-self:flex-start">🔒 کلید شما فقط در همین مرورگر ذخیره می‌شود</div>'
      +'<label class="hint">API Key (سازگار با OpenAI)</label><input class="inp" id="hshKey" type="password" placeholder="sk-…">'
      +'<label class="hint">Base URL (برای دور زدن CORS می‌توانی پراکسی بگذاری)</label><input class="inp" id="hshBase" dir="ltr" placeholder="https://api.openai.com/v1">'
      +'<label class="hint">نام مدل</label><input class="inp" id="hshModel" dir="ltr" placeholder="gpt-4o-mini">'
      +'<button class="btn primary" id="hshSave" style="width:100%;justify-content:center">ذخیره تنظیمات</button>'
      +'<div class="hint">سازگار با: OpenAI • OpenRouter • Groq • Together • سرویس‌های ایرانی</div></div>'
      +'<div class="hint" style="margin-top:auto">✦ با اسپانسری سانجاب<br>sunjob.ir</div></aside></div>';
    const main=$('#hsh-main',body);
    const keyI=$('#hshKey',body),baseI=$('#hshBase',body),modelI=$('#hshModel',body);
    const cfg=OS.hooshyarCfg();
    keyI.value=cfg.key;baseI.value=cfg.base;modelI.value=cfg.model;
    $('#hshSave',body).onclick=()=>{
      S.set('ai',{key:keyI.value.trim(),base:baseI.value.trim()||'https://api.openai.com/v1',model:modelI.value.trim()||'gpt-4o-mini'});
      toast(I('sparkles'),'هوشیار به‌روز شد','تنظیمات ذخیره شد ✓');
      if(keyI.value.trim())achieve('geeker');
    };
    let tab='hsh';
    let box=mountChatBox(main,{msgs:S.get('aimsgs',[]),onDone:m=>S.set('aimsgs',m.slice(-40))});
    body.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
      body.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');tab=b.dataset.t;
      if(tab==='glm'){
        main.innerHTML='<div class="ai-note" style="margin:10px">'+OS.AI_NOTE+'<br><span class="hint">اینجا به مدل جی‌ال‌امِ همین سایت (سرور SanjabOS) وصل می‌شود — فقط در نسخه وب/پیش‌نمایش.</span></div>';
        const wrap=document.createElement('div');wrap.style.cssText='flex:1;display:flex;flex-direction:column;min-height:0';main.appendChild(wrap);
        mountChatBox(wrap,{backend:'glm',msgs:[]});
      }else{
        main.innerHTML='';
        box=mountChatBox(main,{msgs:S.get('aimsgs',[]),onDone:m=>S.set('aimsgs',m.slice(-40))});
      }
    });
  }
});
/* اپ جی‌ال‌ام مستقل (میان‌بر) */
OS.registerApp({
  id:'glm',name:'جی‌ال‌ام (وب)',cat:'هوش مصنوعی',
  icon:()=>tile('#0ea5a0','#134e4a',tileGlyph('bot')),
  w:()=>Math.min(760,innerWidth-20),h:540,
  mount(body){
    body.innerHTML='<div class="ai-note" style="margin:10px">'+OS.AI_NOTE+'</div>';
    const wrap=document.createElement('div');wrap.style.cssText='flex:1;display:flex;flex-direction:column;min-height:0';
    body.appendChild(wrap);
    mountChatBox(wrap,{backend:'glm',msgs:[]});
  }
});
/* — اپ ایده‌ها — */
OS.registerApp({
  id:'ideas',name:'ایده‌ها',cat:'هوش مصنوعی',
  icon:()=>tile('#e11d48','#881337',tileGlyph('bulb')),
  w:()=>Math.min(760,innerWidth-20),h:580,
  mount(body){
    let ideas=S.get('ideas',null)||[
      {t:'وبلاگ شخصی',d:'یک وبلاگ فارسی درباره یادگیری لینوکس بسازم',r:''},
      {t:'ربات تلگرام',d:'رباتی که هر روز یک دستور لینوکس یاد بدهد',r:''},
      {t:'پروژه پایتون',d:'اسکریپتی که قیمت‌ها را رصد کند',r:''}
    ];
    const draw=()=>{
      body.innerHTML='<div style="padding:14px 16px;overflow-y:auto" class="long-scroll">'
        +'<div class="spread"><h2 style="margin:0;font-size:18px">💡 دیوار ایده‌ها</h2><span class="tag">تحلیل با هوش مصنوعی</span></div>'
        +'<div class="hint" style="margin:6px 0 12px">ایده‌ات را بنویس، بعد دکمه «نظر هوش مصنوعی» را بزن. (در نسخه وب به جی‌ال‌المِ سرور وگرنه به هوشیارِ خودت وصل می‌شود)</div>'
        +'<div class="card" style="margin-bottom:14px"><div class="row"><input class="inp" id="ideaT" placeholder="عنوان ایده" style="flex:1;min-width:120px"><input class="inp" id="ideaD" placeholder="توضیح کوتاه" style="flex:2;min-width:160px"><button class="btn primary" id="ideaAdd">'+I('plus')+' افزودن</button></div></div>'
        +'<div id="ideaList"></div>'
        +'<div class="hint" style="text-align:center;margin-top:10px">با اسپانسری سانجاب ✦</div></div>';
      const list=$('#ideaList',body);
      const render=()=>{
        list.innerHTML=ideas.map((x,i)=>'<div class="idea"><div class="t"><span>💡 '+esc(x.t)+'</span><span class="row"><button class="btn sm primary" data-ai="'+i+'">🤖 نظر هوش مصنوعی</button><button class="btn sm danger" data-del="'+i+'">×</button></span></div>'
          +'<div class="d">'+esc(x.d)+'</div>'+(x.r?'<div class="ai-rep">'+esc(x.r)+'</div>':'')+'</div>').join('')||'<div class="hint" style="text-align:center;padding:20px">هنوز ایده‌ای نیست — یکی اضافه کن!</div>';
        list.querySelectorAll('[data-ai]').forEach(b=>b.onclick=async()=>{
          const i=+b.dataset.ai;
          b.disabled=true;b.textContent='⏳ در حال فکر…';
          try{
            const r=await OS.aiChat([
              {role:'assistant',content:'تو مشاور ایده‌سازی و استارتاپ هستی. کوتاه، عملی و انگیزشی جواب بده (حداکثر ۶ جمله فارسی).'},
              {role:'user',content:'این ایده را تحلیل کن و ۳ قدم اول عملی بگو: «'+ideas[i].t+' — '+ideas[i].d+'»'}
            ],{backend:'auto'});
            ideas[i].r=r.text;
          }catch(e){ideas[i].r=e.message==='NO_BACKEND'?OS.AI_NOTE:('⚠️ '+e.message)}
          S.set('ideas',ideas);draw();
        });
        list.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ideas.splice(+b.dataset.del,1);S.set('ideas',ideas);draw()});
      };
      $('#ideaAdd',body).onclick=()=>{
        const t=$('#ideaT',body).value.trim(),d=$('#ideaD',body).value.trim();
        if(!t)return;
        ideas.unshift({t:t,d:d,r:''});
        S.set('ideas',ideas);
        draw();
      };
      render();
    };
    draw();
  }
});
