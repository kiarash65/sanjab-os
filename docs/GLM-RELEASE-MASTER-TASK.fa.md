# مأموریت جامع GLM — ممیزی عمیق و آماده‌سازی Release Candidate سنجاب‌اواس

> **نوع مأموریت:** اجرای واقعی روی مخزن، نه صرفاً ارائهٔ پیشنهاد یا گزارش.  
> **مخزن:** kiarash65/sanjab-os  
> **شاخهٔ هدف:** main  
> **نسخهٔ مبنا:** 4.0.0 — تا زمانی که همهٔ گیت‌ها پاس نشده‌اند، نسخه را bump نکن و تگ پایدار نساز.  
> **اولویت:** AI Academy، تمام درس‌های PowerShell، تمام درس‌های Rust، تمام فصل‌های Linux، سپس تمام کپی فارسی رابط کاربری؛ بعد انیمیشن/دسترس‌پذیری، runtime و بسته‌بندی.

## دستور اجرایی

از آخرین HEAD شاخهٔ main شروع کن و قبل از ویرایش، diff و کارهای انجام‌شدهٔ اخیر را بخوان. فایل‌ها و محدودیت‌ها را از روی کد واقعی بررسی کن؛ به گزارش‌های قدیمی، README یا این سند به‌عنوان جایگزین source of truth تکیه نکن.

کار را مرحله‌ای انجام بده، اما فقط گزارش نساز: اصلاح‌ها، تست‌ها و مستندات را در مخزن اعمال کن. هیچ شناسهٔ درس، کلید localStorage/IndexedDB، قالب backup، شناسهٔ گیمیفیکیشن یا قرارداد ذخیره‌سازی را بدون migration نسخه‌بندی‌شده تغییر نده. از force-push، reset مخرب و حذف داده پرهیز کن. اگر branch protection اجازهٔ push مستقیم نمی‌دهد، PR باز کن و محدودیت را مستند کن.

هر ادعا را با منبع رسمی/اولیه بررسی کن. محتوای منبع را کپی نکن؛ آموزش فارسی اصیل و مبتدی‌فهم بنویس. کدها را واقعاً اجرا کن یا صریحاً برچسب «خروجی نمونه/شبیه‌سازی» بزن. هیچ‌وقت خروجی ساختگی را نتیجهٔ runtime واقعی معرفی نکن.

---

## P0 — چهار ممیزی آموزشی اصلی

### ۱. آکادمی هوش مصنوعی: ممیزی کامل و توسعهٔ سرفصل

**فایل‌های شروع:**  
src/components/os/apps/ai-academy.tsx  
src/components/os/academy/ai-labs.tsx  
src/components/os/apps/nn-lab.tsx  
src/lib/ai/micrograd.ts  
src/lib/learning/lessons.ts

تمام ۱۳ بخش فعلی، تمام فرمول‌ها، نمودارها، تمرین‌ها، آزمون‌ها، ادعاهای تاریخی و متن UI را از ابتدا تا انتها بررسی کن. در حال حاضر بخش‌هایی نظیر پرسپترون، نزول گرادیان، activation، شبکهٔ عصبی، bigram، overfitting، اخلاق، BPE، Attention، RAG و آزمایشگاه آموزش وجود دارند؛ وجود نام این موضوع‌ها به معنی پوشش عمیق و کامل آن‌ها نیست.

**موارد ضروری:**
- تفکیک درست AI، Machine Learning، Deep Learning، Generative AI، LLM، Multimodal Models و Agentic Systems.
- داده، train/validation/test، leakage، normalization، loss، gradient، optimizer، generalization، overfitting، regularization، calibration و evaluation را با مثال قابل آزمایش آموزش بده.
- در LLM، token/tokenizer، vocabulary، embeddings، context window، next-token prediction، temperature، top-p، sampling، attention، transformer، KV cache و محدودیت‌های factuality را دقیق توضیح بده.
- فرق Retrieval با RAG کامل را حفظ کن. آزمایش فعلی bag-of-words یا cosine toy را RAG production معرفی نکن. chunking، embedding model، vector index، retrieval/reranking، prompt assembly، citations، groundedness و failure modes را مرحله‌به‌مرحله مدل کن.
- آزمایشگاه‌های واقعی و مفید اضافه کن؛ اولویت با:
  1. Embedding و مقایسهٔ cosine similarity در چند جملهٔ فارسی/انگلیسی؛
  2. جست‌وجوی معنایی و reranking روی مجموعه‌سند کوچک؛
  3. مقایسهٔ temperature و top-p با seed قابل تکرار؛
  4. پنجرهٔ متن، token budget و اثر طول prompt؛
  5. evaluation با دادهٔ آزمون ثابت، معیار و خطایابی خروجی؛
  6. طراحی چرخهٔ Agent: plan → tool → observation → verification → finish، همراه محدودیت ابزار و approval.
- دربارهٔ tool calling، prompt injection، data exfiltration، sandboxing، least privilege، secrets، PII، human approval و audit trail فصل مستقل داشته باش.
- مدل toy و محاسبات دست‌ساز را با برچسب «مدل آموزشی» نگه دار. نتیجهٔ مدل زبانی واقعی، اتصال remote و اجرای محلی را با نشانگرهای مجزا نمایش بده.
- یک runtime محلی مبتنی بر WebGPU/WebLLM را فقط بعد از امکان‌سنجی واقعی اضافه کن: حجم مدل، RAM/VRAM، سازگاری GPU، پشتیبانی مرورگر، latency، دانلود، license، worker، لغو اجرا و fallback CPU را اندازه بگیر. بارگیری چندصد مگابایتی را خودکار و بی‌اجازه شروع نکن. حالت remote باید با رضایت کاربر و نمایش روشن مقصد داده باشد.
- Timeline را تا زمان فعلی به‌روز کن؛ رویداد و ادعا را با تاریخ وقوع و منبع معتبر ثبت کن. ادعاهایی مانند «مدل‌ها فقط توکن بعدی را پیش‌بینی می‌کنند» را با توضیح تفاوت معماری/هدف آموزش و سیستم ابزارمحور، ساده‌سازی گمراه‌کننده نکن.
- آزمون‌ها باید استدلال و انتقال یادگیری را بسنجند، نه صرفاً تعریف حفظی. برای پاسخ غلط توضیح اختصاصی ارائه کن.

**معیار پذیرش AI:** همهٔ بخش‌ها منبع دارند؛ فرمول‌ها و نمودارها با پیاده‌سازی برابرند؛ تمام labها دارای توضیح محدودیت، ورودی/خروجی، reset و تست هستند؛ AI واقعی، الگوریتم toy، شبیه‌سازی و سرویس remote در UI کاملاً قابل تشخیص‌اند.

### ۲. آکادمی PowerShell: تمام ۱۵ درس و شبیه‌ساز

**فایل‌های شروع:**  
src/components/os/apps/powershell-academy.tsx  
src/lib/learning/lessons.ts  
تمام فایل‌های شبیه‌ساز ترمینال و pipeline که اپ import می‌کند.

تمام ۱۵ درس، تمام مثال‌های کد، خروجی‌ها، تمرین‌ها، hintها، quiz، missionها و توضیحات رابط را بررسی کن. یک ماتریس بساز که برای هر command مشخص کند در PowerShell واقعی وجود دارد، در شبیه‌ساز پیاده‌سازی شده یا فقط متن نمایشی است.

**موضوع‌های فنی که باید پوشش داده شوند:**
- تفاوت Windows PowerShell 5.1 و PowerShell 7+، cross-platform بودن و سازگاری ماژول‌ها.
- verb-noun cmdlet naming، alias، provider، object pipeline و تفاوت pipeline شیءمحور با shellهای متنی.
- $_/$PSItem، property، Where-Object، ForEach-Object، Select-Object، Sort-Object، Measure-Object و pipeline enumeration.
- type conversion، رشته، آرایه، hashtable، ordered dictionary، scope و متغیرهای automatic.
- مسیرها و Providerها، wildcards، فیلتر سمت provider در مقابل فیلتر pipeline، فایل/پوشه و خطایابی مسیر.
- فرایندها، سرویس‌ها، CIM/WMI، تفاوت remote/local و نیازهای دسترسی.
- condition، loop، function، parameter binding، pipeline input، validation attribute و return semantics.
- error record، terminating/non-terminating errors، -ErrorAction، try/catch/finally، throw و Write-Error.
- module، profile، script، signing و Execution Policy. صریح بنویس Execution Policy مرز امنیتی نیست و برای دورزدن سیاست سازمانی راهنمایی نده.
- Invoke-RestMethod، Invoke-WebRequest، JSON serialization، status code، timeout، TLS و مدیریت امن token/API key.
- winget، نصب/حذف/upgrade و تفاوت رفتار نسخه‌ها.
- قابلیت‌های جدید PowerShell 7 را بدون مخلوط‌کردن با 5.1 علامت بزن.

**شبیه‌ساز:**
- اجرای هر command را با تست، نه فقط متن درس، مقایسه کن.
- اگر command یا flag پیاده‌سازی نشده، UI نباید وانمود کند اجرا شده است؛ پشتیبانی/عدم پشتیبانی را نمایش بده.
- خطاهای syntax، command not found، invalid parameter و object/property mismatch را با پیام قابل فهم تفکیک کن.
- خروجی نمونه برای سیستم‌عامل واقعی را با دادهٔ ساختگی محیط آموزشی اشتباه نکن.
- commandهای مخرب، حذف فایل، سرویس، process و network باید در محیط آزمایشی محدود بمانند.
- اگر اجرای واقعی PowerShell از پل Tauri/Windows مدنظر است، آن را یک feature مستقل و opt-in بساز: مجوز روشن، محدودیت مسیر/فرمان، process timeout، cancellation، خروجی محدود، ثبت audit و عدم دسترسی خودکار به shell میزبان. در وب مرورگر ادعای اجرای PowerShell واقعی نکن.

**معیار پذیرش:** برای هر ۱۵ درس حداقل مثال قابل اجرا/قابل ارزیابی، خروجی درست، تمرین مرحله‌ای، سؤال مفهومی و ارجاع به مستندات رسمی وجود داشته باشد. تست parity شبیه‌ساز و مستندات capability matrix سبز باشد.

### ۳. آکادمی Rust: تمام ۲۳ درس

**فایل‌های شروع:**  
src/components/os/apps/rust-academy.tsx  
src/components/os/academy/rust-memory.tsx  
src/lib/learning/lessons.ts  
تمام کدهای شبیه‌ساز و checker مأموریت‌ها.

هر ۲۳ درس در چهار مسیر شروع، مالکیت، ساختارها و همزمانی را کامل بررسی کن. ترتیب یادگیری و پیش‌نیازها را با Rust Book و Edition فعلی کنترل کن.

**موضوع‌های ضروری:**
- نصب toolchain، rustup، rustc، Cargo، crate، package، module، edition، build/check/test/run.
- ownership، move، Copy، Clone، borrowing، mutable aliasing، slices و lifetime elision.
- stack/heap را بدون ادعای مطلق یا تشبیه گمراه‌کننده توضیح بده.
- struct/enum/match، pattern matching، Option/Result، error propagation، panic vs recoverable errors.
- generics، trait bounds، impl، iterator، closure، collection، String و UTF-8.
- thread، channel، Mutex، Arc، Send و Sync و data race.
- async/await: syntax به‌تنهایی runtime نیست؛ نقش executor و Tokio/async runtime را دقیق جدا کن.
- unsafe Rust: مسئولیت invariantها، pointer، FFI، aliasing و تفاوت Safe/Unsafe را دقیق توضیح بده. Safe Rust را «بدون هیچ باگ» معرفی نکن.
- روش debug/compiler diagnostics، unit/integration test، clippy، fmt، docs و Cargo workflow.
- مثال‌ها را با edition فعلی واقعاً اجرا کن؛ نسخهٔ compiler، edition و خروجی test/log را ثبت کن.

**صداقت runtime:**
- شبیه‌ساز کوچک داخل مرورگر جایگزین rustc نیست. هر mission checker ساختاری یا parser آموزشی را صریح معرفی کن.
- پیام E0382/E0502 و دیگر diagnosticها فقط وقتی «خروجی واقعی rustc» نامیده شوند که واقعاً از همان نسخهٔ compiler اجرا شده باشند. در غیر این صورت «نمونهٔ آموزشی شبیه پیام کامپایلر» بنویس.
- امکان Rust واقعی را در Tauri/native یا sandbox remote بررسی کن؛ از اجرای arbitrary code روی سرور عمومی خودداری کن. محدودیت زمان، حافظه، filesystem، شبکه و concurrency باید enforce شود.
- خروجی ساختگی و ثابت نباید به‌عنوان نتیجهٔ اجرای Rust واقعی ثبت شود.

**معیار پذیرش:** ۲۳ شناسهٔ lesson پایدار و یکتا؛ تمام exampleها با toolchain واقعی بررسی شده یا صریحاً شبیه‌سازی برچسب خورده‌اند؛ آزمون‌های مفهومی و memory lab صحت‌سنجی شده‌اند؛ Send/Sync و async با مثال درست توضیح داده شده‌اند.

### ۴. آکادمی Linux: هشت فصل پایه، شش فصل عمیق و آزمون

**فایل‌های شروع:**  
src/components/os/apps/linux-academy.tsx  
src/components/os/academy/deep.tsx  
src/lib/os/academy-data.ts  
src/lib/learning/lessons.ts

تمام فصل‌های پایه و عمیق، برگهٔ تقلب، missionها، command output، quiz و UI را بررسی کن.

**موضوع‌های ضروری:**
- Linux kernel در برابر distribution، GNU userland، package manager، init/systemd و desktop environment.
- تفاوت BIOS/UEFI، bootloader، kernel، initramfs، PID 1 و display manager با توجه به توزیع و تنظیمات؛ زنجیره را بیش از حد قطعی معرفی نکن.
- filesystem hierarchy، inode، hardlink/symlink، mount/umount، filesystem journal و permission.
- owner/group/other، rwx، octal mode، umask، ACL، capabilities، sudo و least privilege.
- process/thread، PID/PPID، signals، SIGTERM در برابر SIGKILL، job control، services، systemctl و journalctl.
- network stack، interface، IP، route، DNS، port، socket، firewall و SSH key verification.
- Bash quoting، expansion، glob، pipeline، exit code، redirection، pipefail، condition، loop، function، cron/systemd timers.
- apt/dnf/pacman را از نظر flag و command syntax از هم تفکیک کن.
- commandهای تغییردهندهٔ دیسک، partition، boot و permission را با هشدار و روش امن توضیح بده؛ دستورهای destructive را برای copy-paste مبتدی در جایگاه اولین پیشنهاد نگذار.

**v86/Alpine:**
- i686 بودن محیط فعلی و محدودیت‌های حافظه/شبکه/سخت‌افزار را در capability matrix صریح نگه دار.
- boot واقعی Guest را از شبیه‌سازی commandهای ترمینال جدا کن.
- snapshot/restore، قطع ناگهانی، state persistence، شبکه و مصرف حافظه را واقعاً تست کن.
- معماری x86_64 یا GPU acceleration را فقط بعد از benchmark و سازگاری واقعی ادعا کن.

**معیار پذیرش:** هر ۱۴ بخش/آزمون در Learning Center ثبت شده‌اند، تمام نمونهٔ خروجی‌ها با commandهای صحیح سازگارند، missionها idempotent و قابل reset هستند، و راهنمای نصب/دیسک خطرهای BitLocker/backup را روشن توضیح می‌دهد.

---

## P0 — ممیزی کامل فارسی و UI copy

از تمام کدهای کاربرمحور در src/app, src/components, src/lib, cli, README.md و docs inventory بساز؛ به آکادمی‌ها محدود نشو.

**قاعده‌ها:**
- متن فارسی زنده، طبیعی، کوتاه و مستقیم؛ نه ترجمهٔ تحت‌اللفظی و نه لحن رباتیک.
- نیم‌فاصله، ی/ک، علائم فارسی، نشانه‌گذاری، رقم و واحد یکدست.
- عبارت‌های فنی انگلیسی در جزیرهٔ LTR و کدها همیشه LTR؛ متن توضیحی RTL.
- اصطلاحات تخصصی مطابق docs/PERSIAN-TECHNICAL-GLOSSARY.md؛ در صورت نیاز glossary را با تصمیم مستدل تکمیل کن.
- خطا، empty state، tooltip، toast، dialog، alt text، aria-label، فرم و تأیید destructive action هم جزو متن رابط هستند.
- تکرار بی‌مورد عبارت‌های تبلیغاتی/اسپانسری در toast و هر درس را حذف کن؛ هویت برند در جای مناسب بماند.
- نام دکمه باید دقیقاً با کاری که اجرا می‌کند منطبق باشد. دکمهٔ inert، وعدهٔ غیرقابل انجام و CTA گمراه‌کننده نگذار.
- از اصلاح کور با regex روی تمام پروژه پرهیز کن؛ هر تغییر را در context همان کامپوننت بازبینی کن.
- ترجمهٔ محتوای فنی نباید معنا، قید، سطح قطعیت یا safety condition را تغییر دهد.

**خروجی لازم:** جدول فایل/تعداد متن بررسی‌شده/تعداد اصلاح/مورد باقی‌مانده؛ نمونه‌های قبل/بعد فقط برای اصلاحات مهم؛ گزارش consistency برای ZWNJ، RTL/LTR، اصطلاحات و accessibility labels.

---

## P1 — انیمیشن، تعامل و کیفیت تجربه

- تمام انیمیشن‌ها را inventory کن: entrance/exit، transitions، SVG/canvas، charts، typing, skeleton, mascot, boot, wallpaper, progress and interactive diagrams.
- از prefers-reduced-motion و useReducedMotion در انیمیشن‌های JavaScript/Framer Motion پیروی کن؛ CSS media query به‌تنهایی کافی نیست.
- انیمیشن‌های خودکار را در تب پس‌زمینه متوقف کن؛ timerها را در unmount پاک کن؛ از setInterval/RAF نشتی‌دار جلوگیری کن.
- حرکت هدفمند باشد: نمایش توالی، رابطه، علت‌ومعلول یا feedback. از حرکت پیوستهٔ تزئینی که حواس‌پرت یا CPU/GPU مصرف می‌کند دوری کن.
- در تعامل‌های step-by-step دکمهٔ مکث/ادامه، قدم قبلی/بعدی، reset و نمایش وضعیت قابل فهم فراهم کن.
- موبایل، touch target، scroll container، keyboard navigation، focus ring، aria live و رنگ/کنتراست را بررسی کن.
- انیمیشن نباید در 60fps شرط پذیرش اجباری موبایل ضعیف باشد؛ روی دستگاه ضعیف degradation قابل‌قبول داشته باشد.
- chunkهای سنگین AI، Rust memory، Linux v86 و editorها lazy-load شوند؛ layout shift و loading state را کنترل کن.

---

## P1 — کاهش محدودیت‌های محصول، بدون تضعیف امنیت

برای هر محدودیت موجود یک ماتریس بساز: مقدار فعلی، علت، اثر کاربر، امکان حذف/افزایش، هزینهٔ حافظه/شبکه، تهدید امنیتی، پیشنهاد و تست.

**بهبودهای مجاز:** UX بهتر، انتخاب runtime مناسب، lazy loading، cache معتبر، resume، مدیریت دانلود و خطا، امکان لغو، progress دقیق، تنظیمات واضح و مسیر جایگزین.

**ممنوع:** حذف rate limit، سقف body، timeout، output cap، auth، allowlist، sandbox، حفاظت SSRF، کنترل secret، CSP یا دسترسی least-privilege فقط برای اینکه محصول «بی‌محدودیت» به نظر برسد. هر افزایش سقف باید متناسب با threat model، منابع و تست abuse باشد.

برای AI محلی و اجرای native فقط opt-in، توضیح محل پردازش/ارسال داده و امکان توقف/پاک‌کردن cache ارائه کن.

---

## P1 — Release Candidate و تست‌های واقعی

1. یک نقشهٔ کامل test coverage تهیه کن: unit/regression، integration، browser E2E، visual, accessibility، performance، offline, install/update/rollback.
2. هر آکادمی را در مرورگر واقعی باز کن و flow اصلی را تست کن؛ صرف TypeScript و build کافی نیست.
3. تست موبایل در viewportهای کوچک و دستگاه/شبیه‌ساز واقعی؛ RTL، keyboard و reduced-motion.
4. Runهای runtime واقعی:
   - Pyodide load/run/timeout/crash/offline;
   - v86 Alpine boot/network/snapshot/restore;
   - rustc compile/test برای تمام نمونه‌ها؛
   - PowerShell 7+ و Windows PowerShell 5.1 command checks؛
   - desktop Tauri install/launch/exit/uninstall/update.
5. بررسی خروجی تولیدی: حجم bundle/chunkها، assetهای missing، console errors، hydration warnings و CSP/network failures.
6. Linux packageها را فقط در صورتی قابل انتشار معرفی کن که هر فرمت واقعاً build و install/boot smoke-test شده باشد.
7. Update/rollback: backup، restore، دادهٔ قدیمی، interruption، تکرار migration و downgrade سناریوها.
8. بررسی license و attribution تمام مدل‌ها، وزن‌ها، فونت‌ها، تصاویر، کتابخانه‌ها، نمونه‌کد و dataset.
9. تمام نسخه‌ها: VERSION، package.json، Tauri، CLI، Debian/Arch metadata و tag.
10. workflow باید version/tag check، typecheck، lint، tests، build، SBOM، notices، checksum و artifact verification را انجام بدهد. خطای Web build نباید به انتشار Release منجر شود.
11. Release Notes باید صادقانه بگویند چه چیزی واقعاً اضافه/تغییر کرده، assetها برای کدام platform هستند و چه چیزی هنوز experimental است.

## منابع مرجع اولیه

- Microsoft PowerShell: https://learn.microsoft.com/powershell/
- Execution Policy: https://learn.microsoft.com/powershell/module/microsoft.powershell.core/about/about_execution_policies
- Rust Book: https://doc.rust-lang.org/stable/book/
- Rustonomicon — Send/Sync: https://doc.rust-lang.org/stable/nomicon/send-and-sync.html
- Linux Kernel Documentation: https://docs.kernel.org/
- Linux filesystems: https://docs.kernel.org/filesystems/
- Hugging Face documentation: https://huggingface.co/docs
- Tokenizers: https://huggingface.co/docs/tokenizers/
- Sentence Transformers / embeddings: https://sbert.net/
- OpenAI platform docs: https://platform.openai.com/docs/
- WebGPU: https://developer.mozilla.org/docs/Web/API/WebGPU_API
- Pyodide: https://pyodide.org/en/stable/
- v86: https://github.com/copy/v86

برای ادعاهای متغیر، تاریخ نسخه و تاریخ بازبینی را ثبت کن. اگر منبع رسمی پاسخ نمی‌دهد، عدم‌قطعیت را گزارش کن.

## قالب گزارش نهایی اجباری

در پایان این جدول را با شواهد واقعی پر کن:

| حوزه | فایل/درس | کار انجام‌شده | تست اجراشده و نتیجه | باقی‌مانده/مانع | اثر بر Release |
|---|---|---|---|---|---|
| AI | ... | ... | ... | ... | Block / Ready |
| PowerShell | ... | ... | ... | ... | ... |
| Rust | ... | ... | ... | ... | ... |
| Linux | ... | ... | ... | ... | ... |
| Persian UI | ... | ... | ... | ... | ... |
| Animation/A11y | ... | ... | ... | ... | ... |
| Runtime | ... | ... | ... | ... | ... |
| Packaging | ... | ... | ... | ... | ... |

برای هر موردی که نتوانستی انجام بدهی، فقط «نشد» ننویس؛ دقیقاً مشخص کن:
1. چه چیزی اجرا نشد؛
2. چرا (نبود سیستم‌عامل/دستگاه/دسترسی/credential/سرویس/سخت‌افزار)؛
3. قدم بعدی قابل اجرا چیست؛
4. مالک/عامل مناسب کیست؛
5. متن prompt دقیق برای عامل/اپراتور؛
6. معیار پذیرش و لاگ/اسکرین‌شات لازم؛
7. آیا blocker انتشار پایدار است یا می‌تواند با Known Limitation منتشر شود.

**قانون پایان:** تا وقتی آزمون‌های native و smoke testهای پلتفرم هدف انجام نشده‌اند، محصول را «نامزد انتشار» بنام، نه «آمادهٔ انتشار نهایی». نسخه و تگ جدید فقط بعد از تأیید release owner ساخته شود.
