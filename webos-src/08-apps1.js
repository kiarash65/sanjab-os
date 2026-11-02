'use strict';
/* ═══════════════ گیت‌هاب + دوربین هوشمند ═══════════════ */
const GH={
  tok(){return S.get('ghtok','')},
  user(){return S.get('ghuser',null)},
  async api(path,opt){
    opt=opt||{};
    const r=await fetch('https://api.github.com'+path,{
      method:opt.method||'GET',
      headers:{'Authorization':'token '+this.tok(),'Accept':'application/vnd.github+json','Content-Type':'application/json'},
      body:opt.body?JSON.stringify(opt.body):undefined
    });
    const j=await r.json().catch(()=>null);
    if(!r.ok){
      const msg=(j&&j.message)||('HTTP '+r.status);
      throw new Error(msg+(r.status===401?' — توکن نامعتبر است':r.status===404?' — پیدا نشد (توکن دسترسی لازم را دارد؟)':''));
    }
    return j;
  }
};
const GH_LANG_COLORS={'JavaScript':'#f1e05a','TypeScript':'#3178c6','Python':'#3572A5','HTML':'#e34c26','CSS':'#563d7c','Shell':'#89e051','Go':'#00ADD8','Rust':'#dea584','Java':'#b07219','C':'#555555','C++':'#f34b7d','PHP':'#4F5D95','Dart':'#00B4AB'};
OS.registerApp({
  id:'github',name:'گیت‌هاب',cat:'سیستم',
  icon:()=>tile('#1f2937','#0f172a',tileGlyph('github')),
  w:()=>Math.min(860,innerWidth-20),h:580,
  mount(body){
    const draw=()=>{
      const tok=GH.tok(),user=GH.user();
      if(!tok){
        body.innerHTML='<div style="padding:24px;max-width:440px;margin:0 auto">'
          +'<h2 style="margin-top:0">🐙 اتصال به گیت‌هاب</h2>'
          +'<div class="ai-note" style="margin-bottom:12px">🔒 توکن Personal Access Token فقط در مرورگر خودت ذخیره می‌شود و هیچ‌جا ارسال نمی‌شود (جز خود گیت‌هاب).<br>مجوزهای لازم: <b>repo</b> و <b>gist</b></div>'
          +'<input class="inp" id="ghTok" type="password" dir="ltr" placeholder="ghp_…" style="margin-bottom:9px">'
          +'<button class="btn primary" id="ghConnect" style="width:100%;justify-content:center">اتصال</button>'
          +'<div class="hint" style="margin-top:10px">ساخت توکن: گیت‌هاب → Settings → Developer settings → Personal access tokens → Generate (با دسترسی repo + gist)</div></div>';
        $('#ghConnect',body).onclick=async()=>{
          const t=$('#ghTok',body).value.trim();
          if(!t)return;
          S.set('ghtok',t);
          try{
            const u=await GH.api('/user');
            S.set('ghuser',{login:u.login,name:u.name,avatar:u.avatar_url});
            achieve('geeker');
            toast(I('github'),'وصل شد!','خوش آمدی '+u.login);
            draw();
          }catch(e){toast(I('github'),'اتصال ناموفق',e.message);S.set('ghtok','')}
        };
        return;
      }
      body.innerHTML='<div style="display:flex;flex-direction:column;height:100%">'
        +'<div class="spread" style="padding:12px 16px;border-bottom:1px solid var(--brd)">'
        +'<div class="row">'+(user?'<img src="'+esc(user.avatar)+'" style="width:34px;height:34px;border-radius:50%" alt="آواتار">':'')
        +'<div><b>'+(user?esc(user.name||user.login):'…')+'</b><div class="hint">@'+(user?esc(user.login):'')+' متصل ✓</div></div></div>'
        +'<div class="row"><button class="btn sm" id="ghOut">خروج</button></div></div>'
        +'<div class="tabs" style="margin:10px 16px 0"><button class="on" data-t="repos">ریپوها</button><button data-t="new">ریپوی جدید</button><button data-t="gist">Gist</button><button data-t="issues">ایسیوها</button></div>'
        +'<div id="ghBody" style="flex:1;overflow-y:auto;padding:14px 16px" class="long-scroll"></div></div>';
      $('#ghOut',body).onclick=()=>{S.del('ghtok');S.del('ghuser');draw()};
      const gb=$('#ghBody',body);
      body.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
        body.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('on'));
        b.classList.add('on');
        render(+b.dataset.t?b.dataset.t:b.dataset.t);
      });
      const render=async tab=>{
        gb.innerHTML='<div class="spin"></div>';
        try{
          if(tab==='repos'){
            const repos=await GH.api('/user/repos?sort=updated&per_page=30');
            gb.innerHTML='<div class="hint" style="margin-bottom:8px">'+repos.length+' ریپو (بر اساس آخرین فعالیت):</div>'+repos.map(r=>'<div class="gh-item">'
              +'<span class="gh-lang" style="background:'+(GH_LANG_COLORS[r.language]||'#6b7280')+'"></span>'
              +'<div style="flex:1;min-width:0"><a class="repo-link" href="'+esc(r.html_url)+'" target="_blank" rel="noopener">'+esc(r.full_name)+'</a>'
              +'<div class="hint">'+esc(r.description||'—')+'</div></div>'
              +'<span class="tag">⭐ '+r.stargazers_count+'</span>'+(r.fork?'<span class="tag orange">fork</span>':'')+'</div>').join('');
          }
          if(tab==='new'){
            gb.innerHTML='<div class="card" style="max-width:430px">'
              +'<label class="hint">نام ریپو</label><input class="inp" id="nrName" dir="ltr" placeholder="my-awesome-project" style="margin-bottom:7px">'
              +'<label class="hint">توضیح</label><input class="inp" id="nrDesc" placeholder="چی‌کار می‌کند؟" style="margin-bottom:7px">'
              +'<div class="row" style="margin-bottom:9px"><label class="row" style="cursor:pointer"><input type="checkbox" id="nrPriv"><span>خصوصی (Private)</span></label>'
              +'<label class="row" style="cursor:pointer"><input type="checkbox" id="nrInit" checked><span>README خودکار</span></label></div>'
              +'<button class="btn primary" id="nrGo" style="width:100%;justify-content:center">🚀 ساخت ریپو</button>'
              +'<div class="hint" id="nrMsg" style="margin-top:8px"></div></div>';
            $('#nrGo',gb).onclick=async()=>{
              const name=$('#nrName',gb).value.trim();
              if(!name){toast(I('github'),'نام لازم است','');return}
              $('#nrMsg',gb).textContent='در حال ساخت…';
              try{
                const r=await GH.api('/user/repos',{method:'POST',body:{name:name,description:$('#nrDesc',gb).value,private:$('#nrPriv',gb).checked,auto_init:$('#nrInit',gb).checked}});
                $('#nrMsg',gb).innerHTML='✅ ساخته شد! <a class="repo-link" href="'+esc(r.html_url)+'" target="_blank" rel="noopener">'+esc(r.html_url)+'</a>';
              }catch(e){$('#nrMsg',gb).textContent='❌ '+e.message}
            };
          }
          if(tab==='gist'){
            gb.innerHTML='<div class="card"><label class="hint">نام فایل</label><input class="inp" id="gF" dir="ltr" placeholder="note.md" style="margin-bottom:7px">'
              +'<label class="hint">محتوا</label><textarea class="inp" id="gC" rows="6" style="margin-bottom:7px"></textarea>'
              +'<label class="row" style="cursor:pointer;margin-bottom:9px"><input type="checkbox" id="gP"><span>عمومی (Public)</span></label>'
              +'<button class="btn primary" id="gGo" style="width:100%;justify-content:center">ساخت Gist</button><div class="hint" id="gMsg" style="margin-top:8px"></div></div>';
            $('#gGo',gb).onclick=async()=>{
              const f=$('#gF',gb).value.trim()||'note.md';
              $('#gMsg',gb).textContent='…';
              try{
                const g=await GH.api('/gists',{method:'POST',body:{files:{[f]:{content:$('#gC',gb).value}},public:$('#gP',gb).checked,description:'از SanjabOS ✦'}});
                $('#gMsg',gb).innerHTML='✅ <a class="repo-link" href="'+esc(g.html_url)+'" target="_blank" rel="noopener">'+esc(g.html_url)+'</a>';
              }catch(e){$('#gMsg',gb).textContent='❌ '+e.message}
            };
          }
          if(tab==='issues'){
            gb.innerHTML='<div class="row" style="margin-bottom:10px"><input class="inp" id="iRepo" dir="ltr" placeholder="owner/repo مثلا: torvalds/linux" style="flex:1"><button class="btn primary" id="iGo">بگرد</button></div><div id="iList"></div>';
            $('#iGo',gb).onclick=async()=>{
              const repo=$('#iRepo',gb).value.trim().replace(/^https?:\/\/github\.com\//,'');
              const list=$('#iList',gb);list.innerHTML='<div class="spin"></div>';
              try{
                const iss=await GH.api('/repos/'+repo+'/issues?per_page=15');
                list.innerHTML=iss.length?iss.map(i=>'<div class="gh-item"><div style="flex:1"><b style="font-size:12.5px">'+esc(i.title)+'</b><div class="hint">#'+i.number+' — '+esc(i.user.login)+' • '+(i.comments)+' کامنت</div></div><span class="tag '+(i.pull_request?'orange':'teal')+'">'+(i.pull_request?'PR':'issue')+'</span></div>').join(''):'<div class="hint">ایسیویی نیست 🎉</div>';
              }catch(e){list.innerHTML='<div class="ai-note">'+esc(e.message)+'</div>'}
            };
          }
        }catch(e){gb.innerHTML='<div class="ai-note">'+esc(e.message)+'</div>'}
      };
      render('repos');
    };
    draw();
  }
});
/* — دوربین هوشمند: تشخیص چهره/سن/جنسیت — */
const FACE_MODEL='https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
const EXPR_FA={neutral:'بی‌تفاوت 🙂',happy:'خندان 😄',sad:'غمگین 😢',angry:'عصبانی 😠',fearful:'ترسیده 😨',disgusted:'زده شده 🤢',surprised:'متعجب 😲'};
OS.registerApp({
  id:'camera',name:'دوربین هوشمند',cat:'هوش مصنوعی',
  icon:()=>tile('#0ea5a0','#065f46',tileGlyph('camera')),
  w:()=>Math.min(700,innerWidth-20),h:600,
  mount(body){
    body.innerHTML='<div style="padding:14px;display:flex;flex-direction:column;gap:11px;height:100%;overflow-y:auto" class="long-scroll">'
      +'<div class="spread"><h2 style="margin:0;font-size:17px">📷 تشخیص چهره، سن و جنسیت</h2><span class="tag teal">face-api.js</span></div>'
      +'<div class="hint">مدل هوش مصنوعی از CDN بارگذاری می‌شود (اینترنت لازم است). تصاویر فقط روی دستگاه خودت پردازش می‌شوند.</div>'
      +'<div class="cam-wrap" style="max-width:520px"><video id="camV" playsinline muted></video>'
      +'<canvas id="camC" style="position:absolute;inset:0;width:100%;height:100%"></canvas>'
      +'<div class="cam-off" id="camOff"><div style="font-size:34px">📷</div><div>دوربین خاموش است</div><button class="btn primary" id="camStart">🎬 روشن کن</button><button class="btn sm" id="camFile">🖼️ آنالیز عکس</button></div>'
      +'<input type="file" id="camInp" accept="image/*" style="display:none"></div>'
      +'<div class="row"><button class="btn" id="camStop">⏹ خاموش</button><button class="btn" id="camSnap">📸 ذخیره عکس</button>'
      +'<label class="row" style="cursor:pointer"><input type="checkbox" id="camAuto" checked><span>تشخیص زنده (هر ۱.۵ ثانیه)</span></label></div>'
      +'<div id="camRes" class="card"><div class="hint">نتایج اینجا می‌آید…</div></div>'
      +'<div id="camGal" class="row"></div></div>';
    const v=$('#camV',body),c=$('#camC',body),res=$('#camRes',body);
    let stream=null,timer=null,libReady=false;
    const loadLib=async()=>{
      if(window.faceapi)return true;
      res.innerHTML='<div class="row"><span class="spin"></span> در حال دانلود کتابخانه تشخیص چهره (~۱۰۰KB)…</div>';
      await new Promise((ok,no)=>{
        const s=document.createElement('script');
        s.src='https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.min.js';
        s.onload=ok;s.onerror=()=>no(new Error('دانلود کتابخانه ناموفق — اینترنت را چک کن'));
        document.head.appendChild(s);
      });
      res.innerHTML='<div class="row"><span class="spin"></span> بارگذاری مدل‌های هوش مصنوعی (چهره + سن/جنسیت + احساسات)…</div>';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL),
        faceapi.nets.ageGenderNet.loadFromUri(FACE_MODEL),
        faceapi.nets.faceExpressionNet.loadFromUri(FACE_MODEL)
      ]);
      libReady=true;
      return true;
    };
    const detect=async source=>{
      try{
        await loadLib();
        const det=await faceapi.detectSingleFace(source,new faceapi.TinyFaceDetectorOptions({inputSize:320,scoreThreshold:.4})).withAgeAndGender().withFaceExpressions();
        const ctx=c.getContext('2d');
        c.width=source.videoWidth||source.width;c.height=source.videoHeight||source.height;
        ctx.clearRect(0,0,c.width,c.height);
        if(!det){
          res.innerHTML='<div class="hint">چهره‌ای پیدا نشد — به نور بیشتر نزدیک شو!</div>';
          return;
        }
        const box=det.detection.box;
        ctx.strokeStyle='#0ea5a0';ctx.lineWidth=3;ctx.shadowColor='#0ea5a0';ctx.shadowBlur=12;
        ctx.strokeRect(box.x,box.y,box.width,box.height);
        ctx.shadowBlur=0;
        const g=det.gender==='male'?'مرد':'زن';
        const gl=Math.round(det.genderProbability*100);
        const age=Math.round(det.age);
        const exprs=det.expressions;
        const topEx=Object.keys(exprs).sort((a,b)=>exprs[b]-exprs[a])[0];
        res.innerHTML='<div class="row" style="gap:16px">'
          +'<div><div class="hint">سن تقریبی</div><div style="font-size:26px;font-weight:800;color:#5eead4">'+fa(age)+'</div></div>'
          +'<div><div class="hint">جنسیت</div><div style="font-size:20px;font-weight:700">'+g+' <span class="hint">('+fa(gl)+'٪)</span></div></div>'
          +'<div><div class="hint">حالت چهره</div><div style="font-size:15px;font-weight:600">'+(EXPR_FA[topEx]||topEx)+'</div></div></div>';
        achieve('camerastar');
      }catch(e){res.innerHTML='<div class="ai-note">'+esc(e.message)+'</div>'}
    };
    $('#camStart',body).onclick=async()=>{
      try{
        stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480},audio:false});
        v.srcObject=stream;await v.play();
        $('#camOff',body).style.display='none';
        const loop=()=>{if($('#camAuto',body).checked&&stream)detect(v)};
        loop();timer=setInterval(loop,1500);
      }catch(e){
        res.innerHTML='<div class="ai-note">دسترسی به دوربین نشد: '+esc(e.message)+'<br>(مجوز دوربین را تأیید کن)</div>';
      }
    };
    $('#camStop',body).onclick=()=>{
      if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
      clearInterval(timer);
      $('#camOff',body).style.display='flex';
      c.getContext('2d').clearRect(0,0,c.width,c.height);
    };
    $('#camFile',body).onclick=()=>$('#camInp',body).click();
    $('#camInp',body).onchange=e=>{
      const f=e.target.files[0];if(!f)return;
      const img=new Image();
      img.onload=()=>{$('#camOff',body).style.display='none';c.getContext('2d').drawImage(img,0,0);detect(img)};
      img.src=URL.createObjectURL(f);
    };
    $('#camSnap',body).onclick=()=>{
      const out=document.createElement('canvas');
      out.width=c.width||640;out.height=c.height||480;
      const ctx=out.getContext('2d');
      try{ctx.drawImage(v,0,0,out.width,out.height)}catch(e){}
      ctx.drawImage(c,0,0);
      const url=out.toDataURL('image/png');
      const d=document.createElement('div');
      d.className='card';d.style.padding='6px';
      d.innerHTML='<img src="'+url+'" style="width:90px;border-radius:8px" alt="اسنپ‌شات"><div class="hint" style="text-align:center"><a download="sanjabos-cam.png" href="'+url+'" class="btn sm" style="margin-top:4px">دانلود</a></div>';
      $('#camGal',body).prepend(d);
      while($('#camGal',body).children.length>6)$('#camGal',body).lastChild.remove();
    };
  }
});
