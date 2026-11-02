'use strict';
/* ═══════════════ آکادمی آموزش لینوکس ═══════════════ */
const EDU_NAV=[
 ['intro','لینوکس چیست؟','zap'],
 ['course','دوره تعاملی','book'],
 ['uses','کاربردهای لینوکس','globe'],
 ['distros','توزیع‌ها','palette'],
 ['install','نصب لینوکس','download'],
 ['cheat','برگه تقلب','filetext'],
 ['chall','چالش‌ها','trophy']
];
const EDU_LESSONS=[
 {lv:'مقدماتی',items:[
  {t:'ترمینال چیست؟',x:'ترمینال (Terminal) پنجره‌ای است که با تایپ دستور با هسته سیستم حرف می‌زنی. سریع‌تر و قدرتمندتر از کلیک کردن است. در لینوکس تقریباً همه‌چیز با ترمینال ممکن است!',cmd:'pwd',out:'/home/sanjab\n(به معنی: من الان در پوشه خانه‌ام)'},
  {t:'ls — دیدن فایل‌ها',x:'دستور ls محتوای پوشه فعلی را لیست می‌کند. با -l جزئیات کامل و با -a فایل‌های مخفی (که با نقطه شروع می‌شوند) هم دیده می‌شوند.',cmd:'ls -l',out:'drwxr-xr-x  Documents/\ndrwxr-xr-x  Downloads/\n-rw-r--r--  README.txt'},
  {t:'cd — جابه‌جایی',x:'با cd وارد پوشه‌ها می‌شوی: cd Documents. با cd .. یک پوشه برمی‌گردی و با cd ~ به خانه. مسیرها با / جدا می‌شوند.',cmd:'cd Documents && pwd',out:'/home/sanjab/Documents'},
  {t:'cat — خواندن فایل',x:'دستور cat محتوای فایل متنی را چاپ می‌کند. برای فایل‌های بزرگ‌تر less بهتر است (با q خارج شو).',cmd:'cat README.txt',out:'به لینوکس خوش آمدی!\nاین خط از داخل فایل است.'},
  {t:'mkdir و touch',x:'mkdir پوشه می‌سازد و touch فایل خالی. لینوکس به بزرگی و کوچکی حروف حساس است: File و file دو فایل متفاوتند!',cmd:'mkdir projects && touch projects/a.txt',out:'(بدون پیام = موفق!)'},
  {t:'rm — حذف',x:'rm فایل را حذف می‌کند و rm -r پوشه را. سطل زباله وجود ندارد — حذف یعنی حذف! هرگز rm -rf / را اجرا نکن.',cmd:'rm projects/a.txt',out:'(فایل برای همیشه پاک شد)'}
 ]},
 {lv:'متوسط',items:[
  {t:'echo و redirection',x:'echo متن چاپ می‌کند. با > خروجی را داخل فایل می‌ریزی و با >> به انتهای فایل اضافه می‌کنی. دقت: > محتوای قبلی را پاک می‌کند!',cmd:'echo "یادداشت من" > note.txt && cat note.txt',out:'یادداشت من'},
  {t:'pipe | — اتصال دستورها',x:'لوله (pipe) خروجی یک دستور را ورودی دستور بعدی می‌کند. مثلاً ls | grep Doc یعنی «لیست بگیر و فقط موارد دارای Doc را نشان بده».',cmd:'ls | grep Doc',out:'Documents'},
  {t:'grep — جستجو',x:'grep داخل متن می‌گردد. با -i بزرگی/کوچکی را نادیده می‌گیرد و با -n شماره خط را هم می‌دهد. بهترین دوست مدیر سیستم است!',cmd:'grep -i sponsor /var/log/syslog',out:'Jan 1 10:00:02 sanjabos sponsor: sunjob.ir وصل شد'},
  {t:'man — دایرةالمعارف',x:'man راهنمای هر دستور است: man ls. با کلید q خارج شو. حتی man man هم دارد!',cmd:'man grep',out:'GREP(1)\n\nNAME\n       grep - جستجوی الگو در متن\n\n(با q خارج شو)'},
  {t:'history و Tab',x:'کلید ↑ دستور قبلی را می‌آورد و Tab نام فایل/دستور را کامل می‌کند. حرفه‌ای‌ها تقریباً هیچ‌چیز را کامل تایپ نمی‌کنند!',cmd:'history',out:'  1  pwd\n  2  ls -l\n  3  cd Documents'}
 ]},
 {lv:'پیشرفته',items:[
  {t:'دسترسی‌ها و chmod',x:'هر فایل دسترسی خواندن(r)/نوشتن(w)/اجرای(x) برای صاحب/گروه/دیگران دارد. chmod 755 یعنی rwxr-xr-x. 644 برای فایل‌های معمولی رایج است.',cmd:'chmod 755 script.sh && ls -l script.sh',out:'-rwxr-xr-x  1 sanjab  script.sh'},
  {t:'پروسه‌ها: ps و kill',x:'ps پروسه‌های در حال اجرا را می‌بیند، top به‌صورت زنده نشان می‌دهد و kill PID پروسه را می‌بندد. htop نسخه رنگی و بامزه‌تر top است.',cmd:'ps aux | head -3',out:'USER  PID %CPU %MEM COMMAND\nroot    1  0.0  0.1 systemd\nsanjab 42  0.5  1.2 desktop'},
  {t:'مدیر بسته apt',x:'در اوبونتو/دبیان با apt بسته نصب می‌کنی: sudo apt install نام‌بسته. در فدورا dnf، در آرچ pacman و در آلفاین apk است.',cmd:'sudo apt install cowsay',out:'Reading package lists... Done\nInstalling cowsay ...\n✓ نصب شد!'},
  {t:'find و which',x:'find فایل‌ها را در کل درخت جستجو می‌کند: find / -name "*.py". which می‌گوید یک دستور از کجا اجرا می‌شود.',cmd:'find / -name "*.py"',out:'/home/sanjab/projects/hello.py'},
  {t:'متغیرهای محیطی',x:'export VAR=value متغیر می‌سازد. PATH می‌گوید دستورها از کجا پیدا شوند. echo $PATH را امتحان کن!',cmd:'export SALAM=دنیا && echo $SALAM',out:'دنیا'}
 ]}
];
const EDU_DISTROS=[
 {n:'Ubuntu',c:'#e95420',base:'دبیان',pm:'apt',de:'GNOME',lvl:1,good:'بهترین برای شروع، جامعه بزرگ، آموزش فراوان'},
 {n:'Linux Mint',c:'#87cf3e',base:'اوبونتو',pm:'apt',de:'Cinnamon',lvl:1,good:'شبیه ویندوز، سبک و راحت برای لپ‌تاپ'},
 {n:'Pop!_OS',c:'#48b9c7',base:'اوبونتو',pm:'apt',de:'COSMIC',lvl:1,good:'عالی برای برنامه‌نویس و کارت گرافیک NVIDIA'},
 {n:'Zorin OS',c:'#15a4fa',base:'اوبونتو',pm:'apt',de:'تم‌های شبیه ویندوز/مک',lvl:1,good:'زیباترین تجربه برای مهاجران ویندوز'},
 {n:'Debian',c:'#d70a53',base:'مستقل',pm:'apt',de:'GNOME و…',lvl:2,good:'پایدار مثل سنگ؛ پایه اوبونتو؛ محبوب سرورها'},
 {n:'Fedora',c:'#51a2da',base:'Red Hat',pm:'dnf',de:'GNOME',lvl:2,good:'جدیدترین تکنولوژی‌ها؛ ساخت شرکت Red Hat'},
 {n:'Arch Linux',c:'#1793d1',base:'مستقل',pm:'pacman',de:'دلخواه خودت',lvl:3,good:'نصب دستی = یادگیری عمیق؛ Rolling release'},
 {n:'Manjaro',c:'#35bf5c',base:'آرچ',pm:'pacman',de:'KDE/XFCE',lvl:2,good:'آرچ اما با نصب آسان گرافیکی'},
 {n:'openSUSE',c:'#73ba25',base:'مستقل',pm:'zypper',de:'KDE/GNOME',lvl:2,good:'YaST مدیریتی فوق‌العاده؛ مناسب حرفه‌ای‌ها'},
 {n:'Kali Linux',c:'#367bf0',base:'دبیان',pm:'apt',de:'XFCE',lvl:2,good:'تست نفوذ و امنیت (نه برای استفاده روزمره!)'},
 {n:'Alpine',c:'#0d597f',base:'مستقل',pm:'apk',de:'بدون دسکتاپ',lvl:3,good:'فوق‌سبک (~۵۰MB)؛ پادشاه داکر و کانتینر'},
 {n:'elementary OS',c:'#64b9f0',base:'اوبونتو',pm:'apt',de:'Pantheon',lvl:1,good:'طراحی مک‌مانند؛ مینیمال و خوش‌ساخت'}
];
const EDU_USES=[
 {t:'سرورها و ابر',n:96.3,suf:'٪',d:'از ۱۰۰۰ سرور برتر وب، بیش از ۹۶٪ لینوکس اجرا می‌کنند. یوتیوب، Netflix و ویکی‌پدیا روی لینوکس می‌چرخند!'},
 {t:'ابررایانه‌ها',n:100,suf:'٪',d:'همه ۵۰۰ ابررایانه برتر جهان روی لینوکس اجرا می‌شوند. از پیش‌بینی آب‌وهوا تا فیزیک ذرات.'},
 {t:'اندروید',n:70,suf:'٪+',d:'اندروید روی هسته لینوکس بنا شده — یعنی گوشی تو هم الان لینوکس اجرا می‌کند!'},
 {t:'DevOps و کانتینر',n:90,suf:'٪',d:'Docker و Kubernetes فقط روی لینوکس معنا دارند. دنیای DevOps یعنی لینوکس.'},
 {t:'IoT و Embedded',n:55,suf:'٪',d:'روتر خانگی، تلویزیون هوشمند، خودرو، دستگاه POS و even ماهواره‌ها — همه لینوکس داخلشان است.'},
 {t:'توسعه نرم‌افزار',n:1,suf:'',d:'همه ابزارهای مدرن (Git، VS Code، Docker، Python…) اول برای لینوکس می‌آیند. WSL باعث شد ویندوزی‌ها هم لینوکس داشته باشند.'}
];
const EDU_INSTALL=[
 {t:'دانلود ISO',x:'از سایت رسمی توزیع، فایل ISO را بگیر (مثلاً ubuntu.com — حدود ۵ گیگ). حتماً نسخه LTS (پشتیبانی بلندمدت) را انتخاب کن.',anim:'iso'},
 {t:'ساخت فلش بوتیبل',x:'با نرم‌افزار Rufus (ویندوز) یا balenaEtcher (همه‌جا) یا Ventoy، فایل ISO را روی فلش ۸+ گیگ بریز. داده‌های فلش پاک می‌شود!',anim:'usb'},
 {t:'BIOS/UEFI و Boot Menu',x:'سیستم را ری‌استارت کن و با کلید مخصوص (F12، F2، Esc یا Del بسته به سازنده) وارد Boot Menu شو و فلش را انتخاب کن. اگر Secure Boot مشکل ساخت، موقتاً خاموشش کن.',anim:'bios'},
 {t:'Try یا Install؟',x:'بیشتر توزیع‌ها حالت Live دارند: اول بدون نصب، لینوکس را از فلش اجرا کن و با سخت‌افزارت امتحانش کن (Wi-Fi، صدا، تاچ‌پد). اگر راضی بودی، Install را بزن.',anim:'live'},
 {t:'پارتیشن‌بندی',x:'حداقل‌ها: / (ریشه) حدود ۳۰-۵۰ گیگ + /home برای فایل‌هایت + Swap (معادل رم یا نصفش). نصاب خودکار «Install alongside Windows» هم دارد — ولی قبلش حتماً از فایل‌هایت بکاپ بگیر!',anim:'part'},
 {t:'ساخت کاربر',x:'نام کاربری و رمز بگذار. این کاربر عضو گروه sudo می‌شود یعنی می‌تواند دستورهای مدیریتی اجرا کند. رمز را جایی یادداشت کن!',anim:'user'},
 {t:'نصب و ری‌استارت',x:'نصب ۱۰ تا ۲۰ دقیقه طول می‌کشد. آخرش فلش را درآور و ری‌استارت کن. منوی GRUB می‌آید که بین ویندوز و لینوکس انتخاب کنی.',anim:'grub'},
 {t:'اولین قدم‌ها',x:'بعد از نصب: sudo apt update && sudo apt upgrade برای به‌روزرسانی، درایورها را چک کن و یک ترمینال باز کن و بزن: neofetch — تبریک! تو الان یک لینوکسی هستی 🎉',anim:'done'}
];
const EDU_CHEAT=[
 ['pwd','نمایش مسیر فعلی','مسیر','ls','لیست فایل‌ها','مسیر','cd','تغییر پوشه','مسیر','cat','نمایش فایل','متن'],
 ['echo','چاپ متن','متن','grep','جستجو در متن','متن','nano','ویرایشگر ساده','متن','head/tail','ابتدا/انتها فایل','متن'],
 ['mkdir','ساخت پوشه','فایل','touch','ساخت فایل','فایل','rm','حذف','فایل','cp/mv','کپی/انتقال','فایل'],
 ['chmod','دسترسی‌ها','مدیریت','chown','تغییر مالک','مدیریت','sudo','اجرای مدیریتی','مدیریت','apt/dnf/pacman','نصب بسته','مدیریت'],
 ['ps/top','پروسه‌ها','سیستم','kill','بستن پروسه','سیستم','df/free','دیسک/رم','سیستم','uname -a','نسخه هسته','سیستم'],
 ['man','راهنما','کمک','history','تاریخچه','کمک','Tab','تکمیل خودکار','کمک','Ctrl+C','لغو دستور','کمک']
];
const EDU_CHALL=[
 {t:'اولین پوشه',d:'در خانه یک پوشه به نام myfolder بساز',check:()=>!!FS.get('/home/sanjab/myfolder')},
 {t:'اولین فایل',d:'داخل myfolder فایلی به نام hello.txt بساز (با touch یا echo و >)',check:()=>!!FS.get('/home/sanjab/myfolder/hello.txt')},
 {t:'نویسنده شو',d:'داخل hello.txt متنی بنویس (با nano یا echo "متن" > myfolder/hello.txt)',check:()=>{const f=FS.get('/home/sanjab/myfolder/hello.txt');return f&&f.d&&f.d.trim().length>0}},
 {t:'گزارش‌گیر',d:'خروجی ls -l را در فایل report.txt در خانه ذخیره کن (ls -l > report.txt)',check:()=>{const f=FS.get('/home/sanjab/report.txt');return f&&f.d&&f.d.includes('sanjab')}},
 {t:'کارآگاه',d:'با grep کلمه kernel را از /var/log/syslog پیدا کن و در kernel.log ذخیره کن',check:()=>{const f=FS.get('/home/sanjab/kernel.log');return f&&f.d&&f.d.includes('kernel')}},
 {t:'معماری نرم',d:'بسته cowsay را نصب کن و یک جمله بامزه به آن بده',check:()=>APT.installed.includes('cowsay')},
 {t:'پاک‌کننده',d:'پوشه myfolder را کامل حذف کن (rm -r myfolder)',check:()=>!FS.get('/home/sanjab/myfolder')&&S.get('chdone',[]).length>=1}
];
function eduAnim(kind){
  if(kind==='iso')return '<div style="padding:10px 0"><div class="progress" style="max-width:260px"><i style="width:100%;animation:eduIso 2.2s ease infinite"></i></div><div class="hint" style="margin-top:6px">ubuntu-24.04.1-desktop-amd64.iso — 5.9 GB</div><style>@keyframes eduIso{0%{width:0}70%{width:96%}90%{width:100%}100%{width:0}}</style></div>';
  if(kind==='usb')return '<div style="font-size:34px;text-align:center;padding:8px 0;animation:floaty 1.6s ease-in-out infinite">🔌→💾</div><div class="hint" style="text-align:center">balenaEtcher: انتخاب ISO → انتخاب فلش → Flash!</div>';
  if(kind==='bios')return '<div class="edu-typing" style="direction:ltr;text-align:left">Press <span class="tok">F12</span> or <span class="tok">Del</span> to enter Setup…<br>Boot Menu: <span class="tc">[USB: SanDisk]  [SSD: Windows]  [Network]</span><span class="edu-cursor"></span></div>';
  if(kind==='live')return '<div style="display:flex;gap:8px;align-items:center;padding:8px 0"><div style="flex:1;height:52px;border-radius:9px;background:linear-gradient(135deg,#e95420,#772953);display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff">Try Ubuntu — بدون نصب اجرا می‌شود!</div></div>';
  if(kind==='part'){
    return '<div class="edu-part-anim"><div style="width:45%;background:#8b5cf6">/ — 45GB</div><div style="width:35%;background:#f7931e">/home — 35GB</div><div style="width:20%;background:#0ea5a0">swap — 8GB</div></div><div class="hint">دیسک مثل کیک برش می‌خوره — هر برش یک «پارتیشن» است. /home جدا باشد که موقع تعویض توزیع، فایل‌هایت نجات پیدا کنند.</div>';
  }
  if(kind==='user')return '<div style="max-width:250px;margin:0 auto" class="card"><div class="inp" style="margin-bottom:6px">sanjab</div><div class="inp" style="margin-bottom:6px">••••••••</div><div class="btn primary" style="width:100%;justify-content:center">ادامه</div></div>';
  if(kind==='grub')return '<div class="edu-typing" style="direction:ltr;text-align:left"><span class="tc">GNU GRUB</span>  version 2.12<br><span style="background:#8b5cf6;color:#fff">▶ Ubuntu</span><br>  Windows Boot Manager<br>  UEFI Firmware Settings<span class="edu-cursor"></span></div>';
  if(kind==='done')return '<div style="text-align:center;font-size:30px;padding:8px 0">🎉 🐧 🎉</div><div class="hint" style="text-align:center">Welcome to Ubuntu 24.04 LTS — خوش آمدی به دنیای آزادی!</div>';
  return '';
}
function eduTypeDemo(el,cmd,out){
  el.innerHTML='';
  const cur=document.createElement('span');cur.className='edu-cursor';
  const line=document.createElement('div');line.innerHTML='<span class="tc">$ </span>';line.appendChild(cur);el.appendChild(line);
  let i=0;
  const type=()=>{
    if(i<=cmd.length){
      line.innerHTML='<span class="tc">$ </span>'+esc(cmd.slice(0,i));
      line.appendChild(cur);
      i++;setTimeout(type,42);
    }else{
      setTimeout(()=>{
        cur.remove();
        out.split('\n').forEach(o=>{
          const d=document.createElement('div');d.className='tok';d.textContent=o;el.appendChild(d);
        });
        el.appendChild(cur);
      },350);
    }
  };
  type();
}
function counterAnim(el,target,suf){
  let v=0;const step=target/48;
  const t=setInterval(()=>{
    v+=step;
    if(v>=target){v=target;clearInterval(t)}
    el.textContent=(target===1?'∞':(target%1?fa(v.toFixed(1)):fa(Math.round(v))))+suf;
  },22);
}
OS.registerApp({
  id:'linuxedu',name:'آکادمی لینوکس',cat:'آموزش',desk:true,pinned:true,
  icon:()=>tile('#f7931e','#e11d48',tileGlyph('book')),
  w:()=>Math.min(940,innerWidth-16),h:()=>Math.min(640,innerHeight-80),
  mount(body){
    body.innerHTML='<div class="edu"><nav class="edu-side" aria-label="بخش‌های آموزش"></nav><div class="edu-main long-scroll"></div></div>';
    const side=body.querySelector('.edu-side'),main=body.querySelector('.edu-main');
    EDU_NAV.forEach(([id,label,ic],i)=>{
      const b=document.createElement('button');
      b.innerHTML=I(ic)+'<span>'+label+'</span>';
      b.onclick=()=>{side.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');renderEdu(main,id)};
      if(i===0)b.classList.add('on');
      side.appendChild(b);
    });
    renderEdu(main,'intro');
  }
});
function renderEdu(main,sec){
  main.scrollTop=0;
  if(sec==='intro'){
    main.innerHTML='<h1 class="edu-h1">🐧 لینوکس چیست؟</h1>'
     +'<p class="edu-p"><b>لینوکس</b> یک سیستم‌عامل آزاد و متن‌باز است که سال ۱۹۹۱ «لینوس توروالدز» به‌عنوان یک سرگرمی دانشجویی ساخت — و حالا دنیای دیجیتال را اداره می‌کند! برخلاف ویندوز و مک، هرکسی می‌تواند کدش را ببیند، تغییرش دهد و پخشش کند.</p>'
     +'<div class="card" style="margin:12px 0"><div style="font-weight:700;margin-bottom:8px">معماری لینوکس (انیمیشنی):</div>'
     +'<svg class="kernel-anim" viewBox="0 0 420 210" style="width:100%;max-width:460px;display:block;margin:0 auto">'
     +'<g class="kernel-lvl"><rect x="30" y="12" width="360" height="38" rx="10" fill="#8b5cf6" opacity=".85"/><text x="210" y="36" text-anchor="middle">🖥️ برنامه‌ها (مرورگر، فایرفاکس، بازی…)</text></g>'
     +'<g class="kernel-lvl"><rect x="30" y="60" width="360" height="38" rx="10" fill="#f7931e" opacity=".85"/><text x="210" y="84" text-anchor="middle">🛠️ ابزارها و سرویس‌ها (Shell, systemd, apt)</text></g>'
     +'<g class="kernel-lvl"><rect x="30" y="108" width="360" height="38" rx="10" fill="#0ea5a0" opacity=".9"/><text x="210" y="132" text-anchor="middle">🐧 هسته (Kernel) — قلب لینوکس</text></g>'
     +'<g class="kernel-lvl"><rect x="30" y="156" width="360" height="38" rx="10" fill="#1a2744" opacity=".95"/><text x="210" y="180" text-anchor="middle">⚙️ سخت‌افزار (CPU، رم، دیسک، کارت شبکه)</text></g>'
     +'</svg><div class="hint">هسته مثل رئیس است: برنامه‌ها نمی‌توانند مستقیم به سخت‌افزار دست بزنند؛ همه‌چیز از هسته رد می‌شود.</div></div>'
     +'<div class="edu-grid">'
     +'<div class="edu-card"><h4> libre و آزاد</h4><div class="d">کد باز + آزادی استفاده/تغییر/پخش. مخفف GNU/Linux — پروژه GNU ریچارد استالمن + هسته لینوس.</div></div>'
     +'<div class="edu-card"><h4>توزیع یعنی؟</h4><div class="d">هسته + ابزارها + دسکتاپ + نصاب = یک «توزیع». مثل Ubuntu و Fedora. در بخش توزیع‌ها بیشتر ببین!</div></div>'
     +'<div class="edu-card"><h4>چرا لینوکس؟</h4><div class="d">سبک، سریع، امن، بدون اجبار آپدیت، بدون جاسوس‌افزار، و رایگان برای همیشه.</div></div>'
     +'</div>'
     +'<div class="card"><b>🗺️ خط زمانی:</b><div class="edu-p">۱۹۸۳ پروژه GNU → ۱۹۹۱ اولین هسته لینوکس (0.01) → ۱۹۹۳ Debian → ۲۰۰۴ Ubuntu → ۲۰۰۸ اندروید → ۲۰۱۴ systemd همه‌جا → ۲۰۲۱ ویندوز ۱۱ هم WSL (لینوکس) گرفت → امروز: لینوکس همه‌جاست.</div></div>';
  }
  else if(sec==='course'){
    const done=S.get('edudone',[]);
    let html='<h1 class="edu-h1">🎓 دوره تعاملی</h1><p class="edu-p">هر درس: توضیح + <b>دموی انیمیشنی</b> + تمرین واقعی در ترمینال. سه سطح: مقدماتی، متوسط، پیشرفته.</p>';
    EDU_LESSONS.forEach((lv,li)=>{
      html+='<div class="sm-cat-t">'+I('star',13)+' سطح '+lv.lv+' ('+lv.items.filter((x,i)=>done.includes(li+'-'+i)).length+'/'+lv.items.length+' تکمیل)</div>';
      lv.items.forEach((l,ii)=>{
        const id=li+'-'+ii;
        html+='<div class="edu-lesson'+(done.includes(id)?' done':'')+'"><div class="spread"><h4 style="margin:0">'+(done.includes(id)?'✅ ':'')+esc(l.t)+'</h4>'
          +'<div class="row"><button class="btn sm" data-demo="'+id+'">▶ دموی انیمیشنی</button><button class="btn sm orange" data-try="'+id+'">⌨️ تمرین کن</button></div></div>'
          +'<p class="edu-p" style="margin:8px 0">'+esc(l.x)+'</p>'
          +'<div class="edu-typing" id="demo-'+id+'" dir="ltr"></div>'
          +'<div id="try-'+id+'" style="display:none;margin-top:9px"><div style="height:230px" class="edu-termhost"></div>'
          +'<div class="hint" style="margin-top:5px">💡 تمرین: دستور <span class="key" dir="ltr">'+esc(l.cmd)+'</span> را در ترمینال بالا اجرا کن و بعد «بررسی» را بزن.</div>'
          +'<div class="row" style="margin-top:7px"><button class="btn sm primary" data-check="'+id+'">🔍 بررسی تمرین</button><span class="tag teal" id="res-'+id+'" style="display:none"></span></div></div>'
          +'</div>';
      });
    });
    main.innerHTML=html;
    main.querySelectorAll('[data-demo]').forEach(b=>b.onclick=()=>{
      const [li,ii]=b.dataset.demo.split('-').map(Number);
      const l=EDU_LESSONS[li].items[ii];
      eduTypeDemo($('#demo-'+b.dataset.demo,main),l.cmd,l.out);
    });
    main.querySelectorAll('[data-try]').forEach(b=>b.onclick=()=>{
      const host=$('#try-'+b.dataset.try,main);
      host.style.display=host.style.display==='none'?'block':'none';
      const th=host.querySelector('.edu-termhost');
      if(!th.dataset.on){th.dataset.on='1';makeTerm(th,{mini:true,greet:'ترمینال تمرین — بزن بریم!'})}
    });
    main.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>{
      const [li,ii]=b.dataset.check.split('-').map(Number);
      const l=EDU_LESSONS[li].items[ii];
      const done=S.get('edudone',[]);
      const ok=fsCheckDemo(l.cmd);
      const tag=$('#res-'+b.dataset.check,main);
      tag.style.display='inline-flex';
      if(ok){tag.textContent='✓ عالی! همان خروجی مورد انتظار آمد';tag.className='tag teal';
        if(!done.includes(b.dataset.check)){done.push(b.dataset.check);S.set('edudone',done);
          if(EDU_LESSONS[0].items.every((x,i)=>done.includes('0-'+i)))achieve('linuxgrad');
          b.closest('.edu-lesson').classList.add('done');}
      }else{tag.textContent='هنوز کامل نشده — دوباره امتحان کن';tag.className='tag orange'}
    });
    // auto-run first demo
    const first=main.querySelector('[data-demo]');if(first)first.click();
  }
  else if(sec==='uses'){
    let html='<h1 class="edu-h1">🌍 کاربردهای لینوکس</h1><p class="edu-p">لینوکس فقط یک سیستم دسکتاپ نیست — همه‌جای دنیای دیجیتال لینوکسی است:</p><div class="edu-grid">';
    EDU_USES.forEach(u=>{
      html+='<div class="edu-card"><h4>'+esc(u.t)+'</h4><div class="counter" data-n="'+u.n+'" data-suf="'+u.suf+'">۰</div><div class="d">'+esc(u.d)+'</div></div>';
    });
    html+='</div><div class="card"><b>استارتاپ‌های ایرانی هم روی لینوکس!</b><div class="edu-p">اکثر سرورهای داخلی (دیجی‌کالا، اسنپ، بله و…) روی لینوکس اجرا می‌شوند. یادگیری لینوکس = شغل: مدیر سیستم، DevOps، امنیت، برق‌قدرت…</div></div>';
    main.innerHTML=html;
    main.querySelectorAll('.counter').forEach(c=>counterAnim(c,parseFloat(c.dataset.n),c.dataset.suf));
  }
  else if(sec==='distros'){
    let html='<h1 class="edu-h1">🦁 توزیع‌های لینوکس</h1><p class="edu-p">«توزیع» یعنی نسخه آماده لینوکس: هسته + ابزار + دسکتاپ + فروشگاه نرم‌افزار. این‌ها معروف‌ترین‌ها هستند:</p><div class="edu-grid">';
    EDU_DISTROS.forEach(d=>{
      html+='<div class="edu-card"><div class="row" style="margin-bottom:7px"><div class="distro-ico" style="background:'+d.c+'">'+d.n[0]+'</div><div><h4 style="margin:0">'+d.n+'</h4><div class="hint">پایه: '+d.base+' • بسته: <span dir="ltr">'+d.pm+'</span></div></div></div>'
        +'<div class="stars">'+'★'.repeat(d.lvl)+'☆'.repeat(3-d.lvl)+'</div>'
        +'<div class="d" style="margin-top:5px">'+esc(d.good)+'</div>'
        +'<div class="hint" style="margin-top:5px">دسکتاپ: '+d.de+' • سختی: '+(d.lvl===1?'آسان':d.lvl===2?'متوسط':'چالشی')+'</div></div>';
    });
    html+='</div>'
     +'<div class="card" style="margin-top:12px"><b>🤔 کدام توزیع برای من؟ (آزمونک)</b><div id="dq" style="margin-top:9px"></div></div>'
     +'<div class="card" style="margin-top:10px"><b>📊 مقایسه مدیر بسته‌ها:</b><div class="edu-p" dir="auto">Ubuntu/Debian/Mint → apt install • Fedora → dnf install • Arch/Manjaro → pacman -S • openSUSE → zypper install • Alpine → apk add</div></div>';
    main.innerHTML=html;
    const dq=$('#dq',main);
    const qs=[
      {q:'چند وقت است کامپیوتر کار می‌کنی؟',o:['تازه شروع کردم','مدتی است','حرفه‌ای‌ام'],w:[0,1,2]},
      {q:'بیشتر چه‌کار می‌کنی؟',o:['کارهای روزمره و اینترنت','برنامه‌نویسی/دانشجویی','سرور و امنیت'],w:[0,0,2]},
      {q:'چقدر اهل شخصی‌سازی هستی؟',o:['پیش‌فرض خوب باشد','کمی تغییر می‌دهم','همه‌چیز را خودم می‌سازم!'],w:[0,1,2]},
      {q:'کامپیوترت چطور است؟',o:['قدیمی/سبک','معمولی','جدید و قوی'],w:[0,1,2]}
    ];
    let qi=0,score=0;
    const draw=()=>{
      if(qi>=qs.length){
        const rec=score<=1?'Linux Mint یا Zorin OS':score<=4?'Ubuntu یا Pop!_OS':score<=7?'Fedora یا Manjaro':'Arch Linux (آره، برو تو!)';
        dq.innerHTML='<div class="ai-note" style="border-color:rgba(74,222,128,.4);background:rgba(74,222,128,.08);color:#86efac">🎯 پیشنهاد ما: <b>'+rec+'</b><br><span class="hint" style="color:#cbd5e1">در هر صورت اول با Live USB امتحانش کن!</span></div>';
        return;
      }
      const q=qs[qi];
      dq.innerHTML='<div class="edu-p" style="margin:0 0 8px">'+(qi+1)+'/'+qs.length+' — '+esc(q.q)+'</div><div class="row">'+q.o.map((o,i)=>'<button class="btn sm" data-i="'+i+'">'+esc(o)+'</button>').join('')+'</div>';
      dq.querySelectorAll('button').forEach(b=>b.onclick=()=>{score+=q.w[+b.dataset.i];qi++;draw()});
    };
    draw();
  }
  else if(sec==='install'){
    let html='<h1 class="edu-h1">💾 نصب لینوکس — قدم به قدم</h1>'
     +'<div class="ai-note" style="margin-bottom:12px">⚠️ قبل از هر‌کاری: از فایل‌های مهمت بکاپ کامل بگیر! و اگر می‌خواهی کنار ویندوز نصب کنی، BitLocker را در ویندوز خاموش کن.</div>'
     +'<div class="edu-steps">';
    EDU_INSTALL.forEach((s,i)=>{
      html+='<div class="edu-step"><div class="num">'+fa(i+1)+'</div><div class="c"><h4 style="margin:0 0 5px">'+esc(s.t)+'</h4><p class="edu-p" style="margin:4px 0">'+esc(s.x)+'</p>'+eduAnim(s.anim)+'</div></div>';
    });
    html+='</div>'
     +'<div class="tabs" style="margin-top:14px"><button class="on" data-alt="0">Option A: کنار ویندوز (Dual Boot)</button><button data-alt="1">Option B: ماشین مجازی</button><button data-alt="2">Option C: WSL فقط ترمینال</button></div>'
     +'<div id="altbox" class="card"></div>';
    main.innerHTML=html;
    const alts=[
      '<b>Dual Boot:</b> در نصاب گزینه «Install alongside Windows» را انتخاب کن و اسلایدر فضا را تنظیم کن. بعد از نصب، موقع بوت GRUB بین ویندوز و لینوکس انتخاب می‌کند. امن‌ترین و واقعی‌ترین راه.',
      '<b>ماشین مجازی (بدون ریسک!):</b> VirtualBox (رایگان) یا VMware را نصب کن → New → ISO را بده → رم ۴ گیگ و دیسک ۳۰ گیگ بده → Install. برای تمرین و آزمایش عالی است؛ برای روزمره کمی کندتر.',
      '<b>WSL (فقط ویندوز ۱۰/۱۱):</b> PowerShell را Admin باز کن و بزن: <span class="key" dir="ltr">wsl --install</span> — یک اوبونتو کامل داخل ویندوز می‌آید! برای یادگیری ترمینال و برنامه‌نویسی فوق‌العاده است، ولی دسکتاپ لینوکس را نداری.'
    ];
    const box=$('#altbox',main);box.innerHTML=alts[0];
    main.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
      main.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');box.innerHTML=alts[+b.dataset.alt];
    });
  }
  else if(sec==='cheat'){
    let html='<h1 class="edu-h1">📋 برگه تقلب دستورها</h1><input class="inp" id="cheatQ" placeholder="جستجو… (مثلاً فایل، نصب، پروسه)" style="margin-bottom:10px"><div id="cheatL"></div>';
    main.innerHTML=html;
    const draw=q=>{
      q=(q||'').trim();
      let rows=EDU_CHEAT.flat().filter(([c,d,cat])=>!q||c.includes(q.toLowerCase())||d.includes(q)||cat.includes(q));
      if(!rows.length)rows=EDU_CHEAT.flat();
      $('#cheatL',main).innerHTML=rows.map(([c,d,cat])=>'<div class="gh-item"><code dir="ltr" style="font-weight:700;color:#5eead4;min-width:110px">'+esc(c)+'</code><span style="flex:1">'+esc(d)+'</span><span class="tag">'+esc(cat)+'</span></div>').join('');
    };
    $('#cheatQ',main).oninput=e=>draw(e.target.value);
    draw('');
  }
  else if(sec==='chall'){
    const done=S.get('chdone',[]);
    let html='<h1 class="edu-h1">🏆 چالش‌های ترمینالی</h1><p class="edu-p">این چالش‌ها را در ترمینال واقعی همین سیستم انجام بده — دکمه «بررسی» وضعیت فایل‌سیستم را واقعاً چک می‌کند!</p><div class="edu-termhost" style="height:250px;margin-bottom:12px"></div>';
    EDU_CHALL.forEach((c,i)=>{
      html+='<div class="edu-lesson'+(done.includes(i)?' done':'')+'"><div class="spread"><div><h4 style="margin:0">'+(done.includes(i)?'✅ ':'')+esc(c.t)+'</h4><div class="hint">'+esc(c.d)+'</div></div><button class="btn sm primary" data-ch="'+i+'">🔍 بررسی</button></div></div>';
    });
    main.innerHTML=html;
    const th=main.querySelector('.edu-termhost');
    makeTerm(th,{mini:true,greet:'ترمینال چالش — در همین پوشه خانه کار کن!'});
    main.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{
      const i=+b.dataset.ch;
      const done=S.get('chdone',[]);
      let ok=false;
      try{ok=EDU_CHALL[i].check()}catch(e){ok=false}
      if(ok){
        if(!done.includes(i)){done.push(i);S.set('chdone',done)}
        b.closest('.edu-lesson').classList.add('done');
        b.closest('.edu-lesson').querySelector('h4').textContent='✅ '+EDU_CHALL[i].t;
        toast(I('trophy'),'چالش انجام شد!','«'+EDU_CHALL[i].t+'» ✓');
      }else toast(I('info'),'هنوز نه','شرط چالش برقرار نشد — دوباره امتحان کن');
    });
  }
}
function fsCheckDemo(cmd){
  // بررسی ساده: آیا «دستوری مشابه» در تاریخچه ترمینالِ تمرین اجرا شده و نتیجه در FS هست؟
  // برای سادگی: چند قاعده‌ی معنایی
  if(cmd.includes('mkdir'))return !!FS.get('/home/sanjab/Documents');
  if(cmd.startsWith('ls'))return true;
  if(cmd.startsWith('cd'))return FS.get('/home/sanjab/Documents',null)!==null;
  if(cmd.startsWith('cat'))return !!FS.get('/home/sanjab/README.txt');
  if(cmd.includes('note.txt'))return !!FS.get('/home/sanjab/Documents/note.txt')||!!FS.get('/home/sanjab/note.txt');
  if(cmd.startsWith('grep'))return !!FS.get('/var/log/syslog');
  if(cmd.startsWith('man'))return true;
  if(cmd.startsWith('history'))return true;
  if(cmd.includes('chmod'))return true;
  if(cmd.startsWith('ps'))return true;
  if(cmd.includes('cowsay'))return APT.installed.includes('cowsay');
  if(cmd.startsWith('find'))return !!FS.get('/home/sanjab/projects/hello.py');
  if(cmd.includes('SALAM'))return true;
  if(cmd.startsWith('echo'))return true;
  return true;
}
