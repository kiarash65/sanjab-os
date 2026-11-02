'use strict';
/* ═══════════════ ترمینال آموزشی SanjabOS ═══════════════ */
function FSdef(){
  const f=d=>({t:'f',d,m:'rw-r--r--'});
  const mk=()=>({t:'d',c:{},m:'rwxr-xr-x'});
  const root=mk();
  root.c.bin=mk();
  ['ls','cat','echo','grep','apt','nano','python3','bash'].forEach(x=>{root.c.bin.c[x]=f('ELF اجرایی')});
  root.c.etc=mk();
  root.c.etc.c['os-release']=f('NAME="SanjabOS"\nVERSION="1.0 (سنجاب)"\nID=sanjabos\nPRETTY_NAME="SanjabOS 1.0 — با اسپانسری سانجاب"\nHOME_URL="https://sunjob.ir"');
  root.c.etc.c.hostname=f('sanjabos');
  root.c.etc.c.passwd=f('root:x:0:0:root:/root:/bin/bash\nsanjab:x:1000:1000:سنجاب سانجاب:/home/sanjab:/bin/sanjsh');
  root.c.home=mk();
  root.c.home.c.sanjab=mk();
  const h=root.c.home.c.sanjab;
  h.c['README.txt']=f('به SanjabOS خوش آمدی! 🐿️\n\nاین یه فایل‌سیستم شبیه‌سازی‌شده است.\nبا دستورهای ls و cd و cat گردش کن.\nبرای شروع دوره بزن: learn\nراهنما: help');
  h.c.Documents=mk();h.c.Downloads=mk();h.c.Desktop=mk();h.c.Pictures=mk();
  h.c.projects=mk();
  h.c.projects.c['hello.py']=f('# اولین برنامه پایتون!\nname = input("اسمت چیه؟ ")\nprint("سلام", name, "! به دنیای پایتون خوش اومدی")\n');
  h.c.projects.c['ideas.md']=f('# ایده‌های من\n- یادگیری لینوکس\n- ساخت وب‌سایت\n- پایتون برای هوش مصنوعی\n');
  root.c['var']=mk();
  root.c['var'].c.log=mk();
  root.c['var'].c.log.c.syslog=f('Jan 1 10:00:00 sanjabos kernel: سنجاب کرنل بوت شد\nJan 1 10:00:01 sanjabos systemd: همه سرویس‌ها OK\nJan 1 10:00:02 sanjabos sponsor: sunjob.ir وصل شد');
  root.c.tmp=mk();
  return root;
}
const FS={
  root:S.get('fs',null)||FSdef(),
  save(){S.set('fs',this.root)},
  reset(){this.root=FSdef();this.save()},
  norm(p,cwd){
    if(!p)return cwd;
    let path=p.startsWith('~')?'/home/sanjab'+p.slice(1):p;
    let abs=path.startsWith('/')?path:((cwd==='/'?'':cwd)+'/'+path);
    const parts=[];
    abs.split('/').forEach(s=>{if(!s||s==='.')return;if(s==='..')parts.pop();else parts.push(s)});
    return '/'+parts.join('/');
  },
  get(p,cwd){
    const abs=this.norm(p,cwd);
    if(abs==='/')return this.root;
    let node=this.root;
    const segs=abs.split('/').filter(Boolean);
    for(const part of segs){
      if(!node||node.t!=='d'||!node.c[part])return null;
      node=node.c[part];
    }
    return node;
  },
  parent(p,cwd){
    const abs=this.norm(p,cwd);
    const i=abs.lastIndexOf('/');
    const dir=i<=0?'/':abs.slice(0,i);
    const name=abs.slice(i+1);
    return{dir:this.get(dir),name,abs};
  },
  ls(p,cwd){
    const n=this.get(p,cwd);
    if(!n)return null;
    if(n.t==='f')return[{_name:this.norm(p,cwd).split('/').pop(),t:'f',d:n.d,m:n.m}];
    return Object.keys(n.c).map(k=>{const o=n.c[k];o._name=k;return o});
  }
};
const BOOTTIME=Date.now();
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
/* محیط و وضعیت */
const ENV={USER:'sanjab',HOME:'/home/sanjab',SHELL:'/bin/sanjsh',PATH:'/usr/local/bin:/usr/bin:/bin',LANG:'fa_IR.UTF-8',SPONSOR:'sunjob.ir'};
const ALIASES=S.get('alias',{ll:'ls -l'});
const APT={installed:S.get('apt',[])};
const TSTAT={cmds:{},ls:0};
const FORTUNES=['هر که بامش more نشست، ناهارش را خورد 🐿️','ترمینال از رابط گرافیکی سریع‌تر است — برو سراغ learn','دانش لینوکس = آزادی واقعی','ماهی بده، ماهیگیری یاد بده؛ ترمینال یاد بده، همه‌چیز یاد گرفتی','کارهای بزرگ از دستورهای کوچک شروع می‌شوند','sudo make me a sandwich 🥪'];
const MAN={
 ls:'ls [-l] [-a] [مسیر] — لیست فایل‌ها\n -l جزئیات کامل   -a نمایش مخفی‌ها',
 cd:'cd [مسیر] — تغییر پوشه فعلی\ncd .. برگشت   cd ~ خانه   cd / ریشه',
 cat:'cat فایل — نمایش محتوای فایل\ncat a.txt b.txt — چند فایل پشت هم',
 grep:'grep [-i] [-n] الگو [فایل] — جستجوی متن\nدر pipe هم کار می‌کند: ls | grep doc',
 man:'man دستور — راهنمای دستور',
 apt:'apt update — به‌روزرسانی\napt install بسته — نصب\napt remove بسته — حذف',
 chmod:'chmod 755 فایل — تغییر دسترسی‌ها\n7=rwx 6=rw- 5=r-x 4=r--',
 find:'find مسیر -name الگو — جستجوی فایل\n* یعنی هرچیزی',
 history:'history — فرمان‌های قبلی',
 ps:'ps — پروسه‌های در حال اجرا (شبیه‌سازی)',
 export:'export VAR=value — تعریف متغیر محیطی\nخواندن: echo $VAR'
};
function lev(a,b){
  const m=a.length,n=b.length;
  const d=[];
  for(let i=0;i<=m;i++)d.push([i]);
  for(let j=0;j<=n;j++)d[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return d[m][n];
}
/* دوره تعاملی */
const LESSONS=[
 {lv:'مقدماتی',ls:[
  {t:'سلام دنیای ترمینال!',intro:['ترمینال یعنی حرف زدن مستقیم با کامپیوتر!','اولین دستور: pwd یعنی «الان کجام؟»'],task:'دستور pwd را اجرا کن',hint:'pwd',check:a=>a[0]==='pwd'},
  {t:'دیدن فایل‌ها',intro:['دستور ls فایل‌های پوشه فعلی را نشان می‌دهد.'],task:'با ls فایل‌ها را ببین',hint:'ls',check:a=>a[0]==='ls'},
  {t:'جزئیات بیشتر',intro:['ls -l جزئیات کامل (دسترسی‌ها، حجم، تاریخ) را می‌دهد.'],task:'ls -l را اجرا کن',hint:'ls -l',check:a=>a[0]==='ls'&&a.includes('-l')},
  {t:'جابه‌جایی',intro:['با cd بین پوشه‌ها حرکت می‌کنی. cd Documents و cd .. را امتحان کن.'],task:'برو داخل پوشه Documents',hint:'cd Documents',check:a=>a[0]==='cd'&&/documents/i.test(a[1]||'')},
  {t:'ساختن پوشه',intro:['mkdir یک پوشه جدید می‌سازد.'],task:'پوشه‌ای بساز — مثلاً: mkdir tamrin',hint:'mkdir tamrin',check:a=>a[0]==='mkdir'&&!!a[1]},
  {t:'ساختن فایل',intro:['touch یک فایل خالی می‌سازد.'],task:'فایلی بساز: touch test.txt',hint:'touch test.txt',check:a=>a[0]==='touch'&&!!a[1]},
  {t:'پاک کردن',intro:['rm فایل و rm -r پوشه را پاک می‌کند. مراقب باش!'],task:'فایل test.txt را پاک کن',hint:'rm test.txt',check:a=>a[0]==='rm'&&!!a[1]}
 ]},
 {lv:'متوسط',ls:[
  {t:'نوشتن در فایل',intro:['echo متن را چاپ می‌کند؛ با > داخل فایل می‌ریزد!'],task:'با echo و > یک فایل بساز',hint:'echo "سلام سنجاب" > salam.txt',check:(a,l)=>a[0]==='echo'&&l.includes('>')},
  {t:'خواندن نتیجه',intro:['حالا محتوای فایل را با cat ببین.'],task:'فایلی که ساختی را cat کن',hint:'cat salam.txt',check:a=>a[0]==='cat'&&!!a[1]},
  {t:'جستجو با grep',intro:['grep دنبال متن می‌گردد. در لاگ سیستم دنبال sponsor بگرد!'],task:'grep sponsor /var/log/syslog',hint:'grep sponsor /var/log/syslog',check:a=>a[0]==='grep'&&!!a[1]},
  {t:'لوله (pipe)!',intro:['| خروجی یک دستور را ورودی دیگری می‌کند — جادوی لینوکس!'],task:'ls | grep proj را اجرا کن',hint:'ls | grep proj',check:(a,l,raw)=>raw.includes('|')},
  {t:'راهنما',intro:['man راهنمای هر دستوری است.'],task:'man یک دستور را ببین',hint:'man ls',check:a=>a[0]==='man'&&!!a[1]},
  {t:'تاریخچه',intro:['history همه دستورهای قبلی‌ات را نشان می‌دهد.'],task:'history را اجرا کن',hint:'history',check:a=>a[0]==='history'}
 ]},
 {lv:'پیشرفته',ls:[
  {t:'دسترسی‌ها',intro:['chmod دسترسی فایل را عوض می‌کند: 755 یعنی rwxr-xr-x.'],task:'chmod 755 روی فایلی بزن',hint:'chmod 755 salam.txt',check:a=>a[0]==='chmod'&&/^[0-7]{3}$/.test(a[1]||'')},
  {t:'پروسه‌ها',intro:['ps پروسه‌های در حال اجرا را نشان می‌دهد.'],task:'ps را اجرا کن',hint:'ps',check:a=>a[0]==='ps'},
  {t:'مدیر بسته',intro:['apt بسته نصب می‌کند! بسته‌های بامزه مثل cowsay را نصب کن.'],task:'یک بسته با apt نصب کن',hint:'apt install cowsay',check:a=>a[0]==='apt'&&a[1]==='install'&&!!a[2]},
  {t:'جستجوی فایل',intro:['find در کل درخت می‌گردد: find / -name "*.py"'],task:'با find یک فایل پیدا کن',hint:'find / -name "*.py"',check:a=>a[0]==='find'},
  {t:'متغیر محیطی',intro:['export VAR=value متغیر می‌سازد؛ با echo $VAR بخوانش.'],task:'export کن',hint:'export MYVAR=test',check:a=>a[0]==='export'&&!!a[1]},
  {t:'فارغ‌التحصیلی!',intro:['آخرین تمرین: neofetch را اجرا کن و افتخار کن!'],task:'neofetch',hint:'neofetch',check:a=>a[0]==='neofetch'}
 ]}
];
const TERMPROG={level:S.get('tpl',0),lesson:S.get('tlsn',0)};
const QUIZ=[
 {q:'کدام دستور فایل‌ها را لیست می‌کند؟',a:['ls','cd','rm'],c:0},
 {q:'برای رفتن به پوشه والد؟',a:['cd ..','cd .','up'],c:0},
 {q:'محتوای فایل؟',a:['cat','dog','touch'],c:0},
 {q:'«|» چه می‌کند؟',a:['خروجی را به دستور بعدی می‌دهد','فایل می‌سازد','پاک می‌کند'],c:0},
 {q:'sudo چیست؟',a:['اجرای دستور با دسترسی مدیر','نام یک بازی','یک ویرایشگر'],c:0},
 {q:'chmod 755 چه می‌کند؟',a:['تغییر دسترسی‌ها','تغییر نام','تغییر مالک'],c:0},
 {q:'هسته لینوکس را چه کسی ساخت؟',a:['لینوس توروالدز','بیل گیتس','ریچارد استالمن'],c:0},
 {q:'«sudo make me a sandwich» الگوی کدام بسته است؟',a:['cowsay','fortune','htop'],c:1}
];
const squirrelASCII='   \\      ._./\n   \\   .-\'\'\'\'-.\n    \\ /  ^ ^  \\\n      |  (o)  |\n      \\  ---  /\n     /\'-----\'\\\n    /  |   |  \\\n   (___|___|___)';
/* توکن‌سازی و زنجیره */
function tokenize(s){
  const out=[];
  const re=/(?:[^\s"']+|"[^"]*"|'[^']*')+/g;
  let m;
  while((m=re.exec(s)))out.push(m[0].replace(/^["']|["']$/g,''));
  return out;
}
function splitChain(line){
  const parts=[];let cur='';let q=null;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(q){cur+=ch;if(ch===q)q=null;continue}
    if(ch==='"'||ch==="'"){q=ch;cur+=ch;continue}
    if(ch==='&'&&line[i+1]==='&'){parts.push(cur);cur='';i++;continue}
    if(ch==='|'&&line[i+1]==='|'){parts.push(cur);cur='';i++;continue}
    if(ch===';'){parts.push(cur);cur='';continue}
    cur+=ch;
  }
  parts.push(cur);
  return parts.map(p=>p.trim()).filter(Boolean);
}
function tabComplete(T){
  const v=T.inp.value;
  const toks=v.split(/\s+/);
  const last=toks[toks.length-1]||'';
  let cands;
  if(toks.length<=1){cands=Object.keys(CMDS)}
  else{
    const par=FS.parent(last,T.cwd);
    cands=par.dir&&par.dir.c?Object.keys(par.dir.c).map(k=>par.abs==='/'?'/'+k:par.abs+'/'+k):[];
  }
  const hits=cands.filter(c=>c.startsWith(last));
  if(hits.length===1){toks[toks.length-1]=hits[0];T.inp.value=toks.join(' ')}
  else if(hits.length>1)T.sugShow(hits.slice(0,8).join('   '));
}
/* فیلترهای pipe */
const FILTERS={
 grep:(s,a)=>{
   const pat=a.filter(x=>!x.startsWith('-'))[0]||'';
   const ci=a.includes('-i');
   return s.split('\n').map((l,i)=>{
     const hit=(ci?l.toLowerCase():l).includes(ci?pat.toLowerCase():pat);
     return hit?((a.includes('-n')?(i+1)+':':'')+l):null;
   }).filter(Boolean).join('\n');
 },
 head:(s,a)=>{const n=parseInt(a[a.indexOf('-n')+1])||10;return s.split('\n').slice(0,n).join('\n')},
 tail:(s,a)=>{const n=parseInt(a[a.indexOf('-n')+1])||10;return s.split('\n').slice(-n).join('\n')},
 wc:(s,a)=>{
   const l=s.split('\n').length,w=s.split(/\s+/).filter(Boolean).length,ch=s.length;
   if(a.includes('-l'))return String(l);
   if(a.includes('-w'))return String(w);
   if(a.includes('-c'))return String(ch);
   return l+' '+w+' '+ch;
 },
 sort:(s,a)=>{
   const l=s.split('\n').filter(Boolean);
   if(a.includes('-n'))l.sort((x,y)=>parseFloat(x)-parseFloat(y));else l.sort();
   if(a.includes('-r'))l.reverse();
   return l.join('\n');
 },
 uniq:s=>s.split('\n').filter((x,i,arr)=>x!==arr[i-1]).join('\n')
};
/* دستورها */
const CMDS={
 help:{desc:'راهنما',run:()=>{
   const g={ 'فایل و پوشه':'ls cd pwd cat touch mkdir rm mv cp tree find','متن':'echo grep head tail wc sort uniq','سیستم':'date whoami hostname uname uptime neofetch df free ps top kill env export alias history man chmod','شبیه‌سازی':'apt ping curl sudo sl cowsay fortune open ai learn quiz save','کاربردی':'calc nano clear help exit shutdown reboot'};
   let o='📚 دستورهای SanjabOS:\n';
   for(const k in g){o+='\n  '+k+':\n    '+g[k].split(' ').join('   ')+'\n'}
   o+='\nنکته: | برای pipe • > و >> برای ذخیره خروجی • && برای زنجیره\nمان pages: man ls';
   return o;
 }},
 ls:{desc:'لیست فایل‌ها',man:MAN.ls,run:(a,T)=>{
   const path=a.filter(x=>!x.startsWith('-'))[0]||'.';
   const items=FS.ls(path,T.cwd);
   if(!items)throw new Error('پیدا نشد: '+path);
   TSTAT.ls++;if(TSTAT.ls>=10)achieve('lsmaster');
   if(a.includes('-l')){
     return items.map(n=>n.m+'  1 sanjab sanjab '+String((n.d||'').length||4096).padStart(6)+'  Jan 1 10:00  '+(n._name||'')).join('\n');
   }
   return items.map(n=>n._name).sort().join('   ');
 }},
 cd:{desc:'تغییر پوشه',man:MAN.cd,run:(a,T)=>{
   const t=a[0]||'~';
   const n=FS.get(t,T.cwd);
   if(!n)throw new Error('چنین پوشه‌ای نیست: '+t);
   if(n.t!=='d')throw new Error('این فایل است نه پوشه: '+t);
   T.cwd=FS.norm(t,T.cwd);
   T.updatePrompt();
   return '';
 }},
 pwd:{desc:'مسیر فعلی',run:(a,T)=>T.cwd},
 cat:{desc:'نمایش فایل',man:MAN.cat,run:(a,T)=>{
   if(!a.length)throw new Error('اسم فایل را بده');
   return a.map(f=>{
     const n=FS.get(f,T.cwd);
     if(!n)throw new Error('فایل نیست: '+f);
     if(n.t==='d')throw new Error('این پوشه است: '+f);
     return n.d;
   }).join('\n');
 }},
 echo:{desc:'چاپ متن',man:'echo متن — چاپ\nبا > یا >> داخل فایل بریز',run:a=>a.join(' ').replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g,(m,v)=>ENV[v]!==undefined?ENV[v]:(ALIASES[v]!==undefined?ALIASES[v]:''))},
 touch:{desc:'ساخت فایل',run:(a,T)=>{
   if(!a[0])throw new Error('اسم فایل؟');
   const par=FS.parent(a[0],T.cwd);
   if(!par.dir||par.dir.t!=='d')throw new Error('مسیر بد');
   if(!par.dir.c[par.name]){par.dir.c[par.name]={t:'f',d:'',m:'rw-r--r--'};FS.save();achieve('filelord')}
   return '';
 }},
 mkdir:{desc:'ساخت پوشه',run:(a,T)=>{
   if(!a[0])throw new Error('اسم پوشه؟');
   const par=FS.parent(a[0],T.cwd);
   if(!par.dir||par.dir.t!=='d')throw new Error('مسیر بد');
   if(par.dir.c[par.name])throw new Error('قبلاً وجود دارد');
   par.dir.c[par.name]={t:'d',c:{},m:'rwxr-xr-x'};
   FS.save();achieve('filelord');
   return 'پوشه ساخته شد ✓';
 }},
 rm:{desc:'حذف',run:(a,T)=>{
   const t=a.filter(x=>!x.startsWith('-'))[0];
   if(!t)throw new Error('چه چیزی را پاک کنم؟');
   if(t==='/'||t==='*')throw new Error('نه نه نه! 😱');
   const par=FS.parent(t,T.cwd);
   if(!par.dir||!par.dir.c[par.name])throw new Error('پیدا نشد');
   const node=par.dir.c[par.name];
   if(node.t==='d'&&!a.includes('-r')&&!a.includes('-rf'))throw new Error('برای پوشه از rm -r استفاده کن');
   delete par.dir.c[par.name];
   FS.save();achieve('filelord');
   return 'حذف شد ✓';
 }},
 mv:{desc:'جابه‌جایی/تغییرنام',run:(a,T)=>{
   if(a.length<2)throw new Error('mv مبدأ مقصد');
   const src=FS.parent(a[0],T.cwd);
   if(!src.dir||!src.dir.c[src.name])throw new Error('مبدأ نیست');
   const node=src.dir.c[src.name];
   delete src.dir.c[src.name];
   const dst=FS.parent(a[1],T.cwd);
   let tdir=dst.dir,tname=dst.name;
   if(tdir&&tdir.c[tname]&&tdir.c[tname].t==='d'){tdir=tdir.c[tname];tname=src.name}
   tdir.c[tname]=node;
   FS.save();
   return '';
 }},
 cp:{desc:'کپی',run:(a,T)=>{
   if(a.length<2)throw new Error('cp مبدأ مقصد');
   const s=FS.get(a[0],T.cwd);
   if(!s||s.t!=='f')throw new Error('فایل مبدأ نیست');
   const dst=FS.parent(a[1],T.cwd);
   dst.dir.c[dst.name]={t:'f',d:s.d,m:s.m};
   FS.save();
   return '';
 }},
 tree:{desc:'درخت پوشه‌ها',run:(a,T)=>{
   const start=FS.get(a[0]||'.',T.cwd);
   if(!start||start.t!=='d')throw new Error('پوشه نیست');
   let o=(a[0]||'.')+'\n';
   const walk=(n,pre)=>{
     const keys=Object.keys(n.c||{});
     keys.forEach((k,i)=>{
       const last=i===keys.length-1;
       o+=pre+(last?'└── ':'├── ')+k+(n.c[k].t==='d'?'/':'')+'\n';
       if(n.c[k].t==='d'&&pre.length<12)walk(n.c[k],pre+(last?'    ':'│   '));
     });
   };
   walk(start,'');
   return o;
 }},
 find:{desc:'جستجوی فایل',man:MAN.find,run:(a,T)=>{
   const ni=a.indexOf('-name');
   const pat=ni>-1?(a[ni+1]||'').replace(/\*/g,''):'';
   const start=FS.get(a[0]&&a[0]!=='-name'?a[0]:'.',T.cwd)||FS.get('.',T.cwd);
   const res=[];
   const walk=(n,pre)=>{
     for(const k in (n.c||{})){
       if(k.includes(pat))res.push(pre+'/'+k);
       if(n.c[k].t==='d')walk(n.c[k],pre+'/'+k);
     }
   };
   walk(start,a[0]||'.');
   return res.join('\n')||'(چیزی پیدا نشد)';
 }},
 date:{desc:'تاریخ و ساعت',run:()=>new Date().toLocaleString('fa-IR')},
 whoami:{desc:'کاربر فعلی',run:()=>'sanjab'},
 hostname:{desc:'نام سیستم',run:()=>'sanjabos'},
 uname:{desc:'اطلاعات سیستم',run:a=>a.includes('-a')?'SanjabOS sanjabos 6.6-squirrel #1 SMP WEB x86_64 GNU/Browser':'SanjabOS'},
 uptime:{desc:'آپ‌تایم',run:()=>' up '+Math.max(1,Math.floor((Date.now()-BOOTTIME)/60000))+' min,  1 user,  load: خیلی سبک 🐿️'},
 df:{desc:'فضای دیسک',run:()=>{
   const used=(JSON.stringify(localStorage).length/1024).toFixed(1);
   return 'Filesystem      Size  Used Avail Use% Mounted on\nlocalStorage    5.0M  '+used+'M  4.0M  12% /\nsanjcloud       inf   0    inf    0% /mnt/sunjob';
 }},
 free:{desc:'حافظه',run:()=>'              total        used        free\nMem:          8192M        1337M        6855M\nSwap:         2048M           0M        2048M\n(شبیه‌سازی — مرورگر حافظه را مدیریت می‌کند)'},
 ps:{desc:'پروسه‌ها',man:MAN.ps,run:()=>'  PID TTY          TIME CMD\n    1 ?        00:00:01 systemd\n   42 ?        00:00:03 sanjab-desktop\n   88 ?        00:00:00 pet-squirrel.service\n  133 pts/0    00:00:00 sanjsh\n  200 pts/0    00:00:00 ps'},
 top:{desc:'مانیتور',run:()=>'top - up 1 day, 1 user, load average: 0.10, 0.15, 0.09\nTasks:  42 total,   1 running\n%Cpu(s):  3.3 us,  96.7 id 🐿️\nMiB Mem : 8192 total,   6855 free\n\n  PID USER     %CPU %MEM COMMAND\n   88 sanjab    2.0  0.3 pet-squirrel\n   42 sanjab    0.5  1.2 desktop\n    1 root     0.1  0.2 systemd'},
 kill:{desc:'بستن پروسه',run:a=>a[0]?('پروسه '+a[0]+' بسته شد (شبیه‌سازی) ✓'):'کدام PID؟'},
 env:{desc:'متغیرهای محیط',run:()=>Object.keys(ENV).map(k=>k+'='+ENV[k]).join('\n')},
 export:{desc:'تعریف متغیر',man:MAN.export,run:a=>{
   const m=(a[0]||'').split('=');
   if(m[1]===undefined)throw new Error('فرمت: export VAR=value');
   ENV[m[0]]=m[1];
   return '';
 }},
 alias:{desc:'مستعار دستور',run:a=>{
   if(!a[0])return Object.keys(ALIASES).map(k=>k+'='+ALIASES[k]).join('\n')||'(هیچ)';
   const m=a.join(' ').split('=');
   if(m[1]===undefined)throw new Error('فرمت: alias ll="ls -l"');
   ALIASES[m[0].trim()]=m[1].trim().replace(/^["']|["']$/g,'');
   S.set('alias',ALIASES);
   return 'مستعار ثبت شد ✓';
 }},
 history:{desc:'تاریخچه',run:(a,T)=>T.hist.map((h,i)=>String(i+1).padStart(4)+'  '+h).join('\n')},
 which:{desc:'کجاست؟',run:a=>{
   if(!a[0])throw new Error('کدام دستور؟');
   if(CMDS[a[0]])return '/usr/bin/'+a[0];
   throw new Error('پیدا نشد');
 }},
 chmod:{desc:'دسترسی‌ها',man:MAN.chmod,run:(a,T)=>{
   const mode=a[0],f=a[1];
   if(!/^[0-7]{3,4}$/.test(mode||''))throw new Error('فرمت: chmod 755 فایل');
   const n=FS.get(f,T.cwd);
   if(!n)throw new Error('فایل نیست');
   const p={7:'rwx',6:'rw-',5:'r-x',4:'r--',0:'---'};
   n.m=p[mode[0]]+p[mode[1]]+p[mode[2]];
   FS.save();
   return 'دسترسی‌ها به '+n.m+' تغییر کرد ✓';
 }},
 man:{desc:'راهنمای دستور',man:MAN.man,run:a=>{
   const c=a[0];
   if(!c)return 'چه دستوری؟ مثال: man ls';
   if(MAN[c])return MAN[c];
   if(CMDS[c]&&CMDS[c].desc)return c+' — '+CMDS[c].desc+'\n(راهنمای کامل ثبت نشده؛ help را ببین)';
   throw new Error('راهنمایی برای '+c+' نیست');
 }},
 neofetch:{desc:'مشخصات سیستم',run:()=>{
   const sl=squirrelASCII.split('\n');
   const info=['sanjab@sanjabos','─────────────────','OS: SanjabOS 1.0 سنجاب','Host: مرورگر وب شما','Kernel: 6.6-squirrel','Uptime: '+Math.max(1,Math.floor((Date.now()-BOOTTIME)/1000))+'s','Packages: '+APT.installed.length+' (apt)','Shell: sanjsh 1.0','Resolution: '+window.innerWidth+'x'+window.innerHeight,'DE: سنجاب‌دکس','Theme: رنگارنگ سانجاب','CPU: موتور جاوااسکریپت','','sponsor: sunjob.ir ✦'];
   const maxL=Math.max.apply(null,sl.map(l=>l.length));
   const rows=Math.max(sl.length,info.length);
   let o='';
   for(let i=0;i<rows;i++)o+=((sl[i]||'').padEnd(maxL+3))+(info[i]||'')+'\n';
   return o;
 }},
 clear:{desc:'پاک کردن صفحه',run:(a,T)=>{T.clear();return ''}},
 apt:{desc:'مدیر بسته',man:MAN.apt,run:async(a,T)=>{
   if(a[0]==='update'){
     for(let i=0;i<=4;i++){T.print('<span class="c-dim">Get:'+i+' http://sunjob.ir/sanjabos stable InRelease ['+Math.floor(rnd(2,30))+' kB]</span>');await wait(160)}
     return 'همه بسته‌ها به‌روز است ✓';
   }
   if(a[0]==='install'){
     const pkg=a[1];
     if(!pkg)throw new Error('کدام بسته؟');
     if(APT.installed.includes(pkg))return pkg+' قبلاً نصب است.';
     T.print('<span class="c-dim">در حال خواندن لیست بسته…</span>');
     await wait(300);
     for(let p=0;p<=100;p+=20){
       T.print('<span class="c-dim">['+'█'.repeat(p/10)+'░'.repeat(10-p/10)+'] '+p+'%</span>');
       await wait(170);
     }
     APT.installed.push(pkg);
     S.set('apt',APT.installed);
     achieve('aptuser');
     let extra='';
     if(pkg==='cowsay')extra='\nحالا امتحان کن: cowsay سلام';
     if(pkg==='fortune')extra='\nحالا امتحان کن: fortune';
     if(pkg==='sl')extra='\nحالا امتحان کن: sl 🚂';
     return 'نصب شد: '+pkg+' ✓'+extra;
   }
   if(a[0]==='remove'){
     APT.installed=APT.installed.filter(x=>x!==a[1]);
     S.set('apt',APT.installed);
     return 'حذف شد ✓';
   }
   return 'استفاده: apt update | apt install بسته | apt remove بسته\nنصب‌شده‌ها: '+(APT.installed.join(', ')||'هیچ');
 }},
 ping:{desc:'پینگ (شبیه‌سازی)',run:async(a,T)=>{
   const h=a[0]||'sunjob.ir';
   for(let i=0;i<3;i++){
     T.print('64 bytes from '+h+': icmp_seq='+i+' ttl=64 time='+(rnd(8,40)).toFixed(1)+' ms');
     await wait(280);
   }
   return '--- '+h+' ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss';
 }},
 curl:{desc:'درخواست وب (شبیه‌سازی)',run:a=>{
   if(!a[0])throw new Error('استفاده: curl آدرس');
   return '<!DOCTYPE html>\n<html>\n<head><title>'+esc(a[0])+'</title></head>\n<body>… (شبیه‌سازی — اینترنت واقعی از مرورگر می‌آید)</body>\n</html>';
 }},
 sudo:{desc:'مدیر بودن 😄',run:a=>{
   if(!a.length)return 'استفاده: sudo دستور';
   if(a[0]==='apt')return 'سنجاب‌ها از قبل دسترسی ریشه دارند! 🐿️👑';
   return '[sudo] password for sanjab: … راستی سنجاب‌ها رمز نمی‌خواهند! اجرا شد (شبیه‌سازی) ✓';
 }},
 sl:{desc:'لوکوموتیو 🚂',run:()=>{
   return '      ====        ________                ___________\n  _D _|  |_______/        \\__I_I_____===__|_________|\n   |(_)---  |   H\\________/ |   |        =|___ ___|\n   /     |  |   H  |  |     |   |         ||_| |_||\n  |      |  |   H  |__--------------------| [___] |\n  | ________|___H__/__|_____/[][]~\\_______|       |\n__/_|__|_______________/____________\\__I_|=|========|\n!!! قطار سنجاب در راه است!';
 }},
 cowsay:{desc:'گاو سخنگو',run:a=>{
   if(!APT.installed.includes('cowsay'))throw new Error('اول نصبش کن: apt install cowsay');
   const msg=a.join(' ')||'سنجاب‌ها بهتر از گاوها هستند!';
   const line='-'.repeat(Math.min(msg.length,38)+2);
   return ' '+line+'\n< '+msg+' >\n '+line+'\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||';
 }},
 fortune:{desc:'فال و ضرب‌المثل',run:()=>{
   if(!APT.installed.includes('fortune'))throw new Error('اول نصبش کن: apt install fortune');
   return FORTUNES[Math.floor(Math.random()*FORTUNES.length)];
 }},
 open:{desc:'باز کردن برنامه',run:a=>{
   const id=a[0];
   if(!id)throw new Error('open نام‌برنامه — لیست: '+Object.keys(OS.apps).join(', '));
   if(OS.apps[id]){OS.openApp(id);return 'در حال باز کردن '+OS.apps[id].name+'… ✓'}
   throw new Error('برنامه نیست. لیست: '+Object.keys(OS.apps).join(', '));
 }},
 ai:{desc:'سوال از هوشیار',run:async(a,T)=>{
   const q=a.join(' ');
   if(!q)return 'بنویس: ai سوال تو';
   T.print('<span class="c-ai">🤖 دارم فکر می‌کنم…</span>');
   try{
     const r=await OS.aiChat([{role:'user',content:q}],{backend:'auto'});
     return '<span class="c-ai">🤖 هوشیار: '+esc(r.text)+'</span>';
   }catch(e){
     throw new Error(e.message==='NO_BACKEND'?OS.AI_NOTE:'اتصال هوش مصنوعی برقرار نشد');
   }
 }},
 calc:{desc:'ماشین‌حساب سریع',run:a=>{
   const ex=a.join('');
   if(!ex)return 'مثال: calc 2+3*4';
   return String(calcEval(ex));
 }},
 nano:{desc:'ویرایشگر متن',run:(a,T)=>{
   const f=a[0];
   if(!f)throw new Error('nano نام‌فایل');
   return new Promise(res=>{
     const par=FS.parent(f,T.cwd);
     const existing=(par.dir&&par.dir.c[par.name])?par.dir.c[par.name].d:'';
     const ov=document.createElement('div');
     ov.style.cssText='position:absolute;inset:0;background:#070b16;z-index:6;display:flex;flex-direction:column;direction:ltr';
     ov.innerHTML='<div style="padding:6px 12px;background:#0d1428;color:#5eead4;font-size:12px;display:flex;justify-content:space-between"><span>GNU nano — '+esc(f)+'</span><span>Ctrl+S ذخیره • Esc خروج</span></div><textarea style="flex:1;background:transparent;border:none;outline:none;color:#e2e8f0;font-family:inherit;font-size:13.5px;padding:12px;resize:none"></textarea>';
     const ta=ov.querySelector('textarea');
     ta.value=existing;
     ta.focus();
     const save=()=>{
       if(par.dir&&par.dir.t==='d'){par.dir.c[par.name]={t:'f',d:ta.value,m:'rw-r--r--'};FS.save()}
     };
     ov.addEventListener('keydown',e=>{
       if(e.ctrlKey&&e.key.toLowerCase()==='s'){e.preventDefault();save();T.print('<span class="c-ok">[ذخیره شد ✓]</span>')}
       if(e.key==='Escape'){e.preventDefault();save();ov.remove();res('')}
     });
     T.out.parentElement.appendChild(ov);
   });
 }},
 save:{desc:'ذخیره دستی',run:()=>{FS.save();return 'همه‌چیز ذخیره شد ✓ (خودکار هم ذخیره می‌شود)'}},
 shutdown:{desc:'خاموش کردن',run:()=>{setTimeout(shutdown,600);return 'سیستم در حال خاموش شدن… 🌙'}},
 reboot:{desc:'راه‌اندازی مجدد',run:()=>{setTimeout(reboot,600);return 'در حال راه‌اندازی مجدد… ⟳'}},
 learn:{desc:'دوره آموزشی',run:(a,T)=>{
   LEARN.active=true;
   LEARN.term=T;
   showLesson(T);
   return '';
 }},
 exit:{desc:'خروج از حالت درس',run:(a,T)=>{
   LEARN.active=false;
   if(T.lessonBox)T.lessonBox.classList.remove('show');
   return 'از حالت آموزش خارج شدی. دستور آزاد!';
 }},
 quiz:{desc:'آزمونک',run:async(a,T)=>{
   let score=0;
   const qs=[...QUIZ].sort(()=>Math.random()-.5).slice(0,5);
   for(const q of qs){
     T.print('<span class="c-info">'+esc(q.q)+'</span>');
     q.a.forEach((o,i)=>T.print('  '+(i+1)+') '+esc(o)));
     const ans=await T.ask();
     if(parseInt(ans)-1===q.c){T.print('<span class="c-ok">✓ درست!</span>');score++}
     else T.print('<span class="c-err">✗ غلط — جواب: '+esc(q.a[q.c])+'</span>');
   }
   return 'نتیجه: '+score+' از ۵ '+(score>=4?'🏆 عالی بود!':(score>=3?'👍 خوب بود':'📖 سراغ learn برو!'));
 }}
};
/* ترمینال UI */
function makeTerm(container,opts){
  opts=opts||{};
  const T={mini:!!opts.mini};
  container.innerHTML='';
  const box=document.createElement('div');
  box.className='term'+(T.mini?' term-mini':'');
  box.style.position='relative';
  box.innerHTML='<div class="term-out long-scroll" dir="auto"></div>'
    +(opts.lesson?'<div class="term-lesson"></div>':'')
    +'<div class="term-suggest"></div>'
    +'<div class="term-in-row"><span class="prompt" style="color:#5eead4;font-weight:700;white-space:nowrap"></span><input class="term-in" autocomplete="off" spellcheck="false" aria-label="ورودی ترمینال"></div>';
  container.appendChild(box);
  T.out=box.querySelector('.term-out');
  T.inp=box.querySelector('.term-in');
  T.sug=box.querySelector('.term-suggest');
  T.lessonBox=opts.lesson?box.querySelector('.term-lesson'):null;
  T.cwd='/home/sanjab';
  T.hist=S.get('termhist',[]);
  T.hp=T.hist.length;
  T.updatePrompt=()=>{box.querySelector('.prompt').innerHTML='<span class="c-prompt">sanjab@sanjabos</span>:<span class="c-path">'+T.cwd+'</span>$ '};
  T.print=(html,cls)=>{
    const d=document.createElement('span');
    d.className='l'+(cls?' '+cls:'');
    d.innerHTML=html;
    T.out.appendChild(d);
    T.out.scrollTop=T.out.scrollHeight;
  };
  T.pprint=(txt,cls)=>{String(txt).split('\n').forEach(l=>T.print(esc(l),cls))};
  T.clear=()=>{T.out.innerHTML=''};
  T.sugShow=(txt,fix,fixCmd)=>{
    T.sug.textContent=txt;
    T.sug.classList.add('show');
    if(fix){T.sug.style.cursor='pointer';T.sug.onclick=()=>{T.inp.value=fixCmd;T.sugHide();T.inp.focus()}}
  };
  T.sugHide=()=>T.sug.classList.remove('show');
  T.ask=()=>new Promise(res=>{
    T.inp.disabled=true;
    const inp=document.createElement('input');
    inp.className='term-in';
    inp.style.color='#fbbf24';
    box.querySelector('.term-in-row').appendChild(inp);
    inp.focus();
    inp.addEventListener('keydown',e=>{
      if(e.key==='Enter'){const v=inp.value;inp.remove();T.inp.disabled=false;T.inp.focus();res(v)}
    });
  });
  T.aiExplain=async()=>{
    const last=T.hist[T.hist.length-1];
    if(!last){T.pprint('هنوز دستوری اجرا نکردی.','c-warn');return}
    T.print('<span class="c-ai">هوشیار در حال فکر کردن…</span>');
    try{
      const r=await OS.aiChat([
        {role:'assistant',content:'تو معلم لینوکس هستی. خیلی کوتاه و ساده (حداکثر ۳ جمله) به فارسی توضیح بده.'},
        {role:'user',content:'این دستور ترمینال چی‌کار می‌کند؟ کوتاه توضیح بده: '+last}
      ],{backend:'auto'});
      T.print('<span class="c-ai">🤖 هوشیار: '+esc(r.text)+'</span>');
    }catch(e){T.print('<span class="c-err">'+esc(e.message==='NO_BACKEND'?OS.AI_NOTE:'اتصال هوش مصنوعی برقرار نشد')+'</span>')}
  };
  T.exec=async line=>{
    let parts=tokenize(line);
    if(!parts.length)return;
    if(ALIASES[parts[0]])parts=tokenize(ALIASES[parts[0]]+' '+parts.slice(1).join(' '));
    let args=parts.slice(1);
    let redirect=null;
    for(let i=0;i<args.length;i++){
      if(args[i]==='>'||args[i]==='>>'){redirect={mode:args[i],file:args[i+1]};args.splice(i,2);break}
    }
    const stages=[[]];
    args.forEach(tok=>{if(tok==='|'){stages.push([])}else stages[stages.length-1].push(tok)});
    let out='';
    for(let s=0;s<stages.length;s++){
      const a=stages[s];
      const c=a[0];
      if(s===0){
        const cmd=CMDS[c];
        if(!cmd){
          T.print('<span class="c-err">sanjsh: دستور پیدا نشد: '+esc(c)+'</span>');
          const sugg=Object.keys(CMDS).map(k=>[k,lev(c,k)]).sort((x,y)=>x[1]-y[1])[0];
          if(sugg&&sugg[1]<=2)T.sugShow('آیا منظورت این بود؟  '+sugg[0]+'  (کلیک = تصحیح)',true,sugg[0]);
          else T.sugShow('help را بزن تا همه دستورها را ببینی');
          return;
        }
        T.sugHide();
        try{out=await cmd.run(a.slice(1),T)||''}
        catch(e){T.print('<span class="c-err">خطا: '+esc(e.message)+'</span>');return}
      }else{
        if(FILTERS[c])out=FILTERS[c](out,a.slice(1));
        else if(CMDS[c]){try{out=await CMDS[c].run(a.slice(1),T)||''}catch(e){T.print('<span class="c-err">خطا در pipe: '+esc(e.message)+'</span>');return}}
        else{T.print('<span class="c-err">پیدا نشد در pipe: '+esc(c)+'</span>');return}
      }
    }
    if(redirect){
      const par=FS.parent(redirect.file,T.cwd);
      if(par.dir&&par.dir.t==='d'){
        const prev=(par.dir.c[par.name]&&par.dir.c[par.name].d)||'';
        par.dir.c[par.name]={t:'f',d:redirect.mode==='>>'?(prev+out.trim()+'\n'):out,m:'rw-r--r--'};
        FS.save();
        T.print('<span class="c-ok">✓ ذخیره شد در '+esc(par.abs)+'</span>');
      }else T.print('<span class="c-err">مسیر نامعتبر برای ذخیره</span>');
    }else if(out)T.pprint(out);
  };
  T.runLine=async raw=>{
    raw=raw.trim();
    if(!raw)return;
    T.hist.push(raw);
    if(T.hist.length>120)T.hist.shift();
    S.set('termhist',T.hist);
    T.hp=T.hist.length;
    T.print('<span class="c-prompt">sanjab@sanjabos</span>:<span class="c-path">'+T.cwd+'</span>$ <span class="c-cmd">'+esc(raw)+'</span>');
    const chain=splitChain(raw);
    for(const seg of chain)await T.exec(seg);
    const first=raw.split(/\s+/)[0];
    TSTAT.cmds[first]=(TSTAT.cmds[first]||0)+1;
    achieve('firstcmd');
    if(Object.keys(TSTAT.cmds).length>=20)achieve('cmd20');
    if(raw.includes('|'))achieve('piper');
    if(LEARN.active&&LEARN.term===T)checkLesson(raw);
  };
  T.inp.addEventListener('keydown',e=>{
    if(e.key==='Enter'){const v=T.inp.value;T.inp.value='';T.runLine(v)}
    else if(e.key==='ArrowUp'){if(T.hp>0){T.hp--;T.inp.value=T.hist[T.hp]||''}e.preventDefault()}
    else if(e.key==='ArrowDown'){if(T.hp<T.hist.length){T.hp++;T.inp.value=T.hist[T.hp]||''}e.preventDefault()}
    else if(e.key==='Tab'){e.preventDefault();tabComplete(T)}
  });
  T.updatePrompt();
  T.print('<span class="c-info">SanjabOS ترمینال — «sanjsh» نسخه ۱.۰</span>');
  T.print('<span class="c-dim">با اسپانسری سانجاب ✦ برای شروع دوره آموزشی بنویس: learn</span>');
  T.print('<span class="c-dim">help = راهنما • Tab = تکمیل خودکار • ↑↓ = تاریخچه</span>');
  if(opts.greet)T.print('<span class="c-ok">'+esc(opts.greet)+'</span>');
  return T;
}
/* موتور درس */
const LEARN={active:false,term:null};
function showLesson(T){
  if(!T.lessonBox)return;
  const lv=LESSONS[TERMPROG.level];
  if(!lv){LEARN.active=false;achieve('linuxgrad');return}
  const l=lv.ls[TERMPROG.lesson];
  if(!l){
    const doneLv=LESSONS[TERMPROG.level].lv;
    TERMPROG.level++;TERMPROG.lesson=0;
    S.set('tpl',TERMPROG.level);S.set('tlsn',0);
    if(LESSONS[TERMPROG.level]){
      T.print('<span class="c-ok">🎉 سطح «'+doneLv+'» را تمام کردی! سطح بعد: '+LESSONS[TERMPROG.level].lv+'</span>');
      showLesson(T);
    }else{
      LEARN.active=false;achieve('linuxgrad');
      T.print('<span class="c-ok">🎓 تبریک! کل دوره را تمام کردی! حالا یک لینوکسی واقعی هستی!</span>');
      if(T.lessonBox)T.lessonBox.classList.remove('show');
    }
    return;
  }
  const total=lv.ls.length;
  T.lessonBox.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">'
    +'<b>🎓 سطح '+esc(lv.lv)+' — درس '+(TERMPROG.lesson+1)+'/'+total+': '+esc(l.t)+'</b><span class="hint">exit = خروج از دوره</span></div>'
    +'<div style="margin:6px 0" class="progress"><i style="width:'+(TERMPROG.lesson/total*100)+'%"></i></div>'
    +l.intro.map(x=>'<div>• '+esc(x)+'</div>').join('')
    +'<div style="margin-top:6px;color:#fbbf24">🎯 وظیفه: '+esc(l.task)+'</div>'
    +'<div class="hint">راهنما: <span class="key" dir="ltr">'+esc(l.hint)+'</span></div>';
  T.lessonBox.classList.add('show');
  T.print('<span class="c-info">── درس: '+esc(l.t)+' ──</span>');
}
function checkLesson(raw){
  const T=LEARN.term;
  const lv=LESSONS[TERMPROG.level];
  if(!lv)return;
  const l=lv.ls[TERMPROG.lesson];
  if(!l)return;
  const a=raw.trim().split(/\s+/);
  let ok=false;
  try{ok=l.check(a,raw,raw)}catch(e){ok=false}
  if(ok){
    T.print('<span class="c-ok">✓ آفرین! درس قبول شد!</span>');
    TERMPROG.lesson++;
    S.set('tlsn',TERMPROG.lesson);
    setTimeout(()=>showLesson(T),400);
  }
}
/* ثبت اپ */
OS.registerApp({
  id:'terminal',name:'ترمینال آموزشی',cat:'آموزش',desk:true,pinned:true,
  icon:()=>tile('#0ea5a0','#0f5cc0',tileGlyph('terminal')),
  w:()=>Math.min(860,innerWidth-20),h:560,
  mount(body,win){
    body.style.position='relative';
    const T=makeTerm(body,{lesson:true});
    const btn=document.createElement('button');
    btn.className='btn sm primary';
    btn.title='توضیح آخرین دستور با هوش مصنوعی';
    btn.innerHTML='🤖 توضیح با هوشیار';
    btn.style.cssText='position:absolute;top:8px;left:10px;z-index:4;opacity:.9';
    btn.onclick=()=>T.aiExplain();
    body.appendChild(btn);
  }
});
