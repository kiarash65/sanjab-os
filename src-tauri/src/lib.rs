//! SanjabOS — لایهٔ دسکتاپ (معماری سایدکار)
//!
//! معماری: وب‌ویو Tauri به سرور محلی Next.js (standalone) وصل می‌شود که
//! با سایدکارِ Node (باندل‌شده) روی 127.0.0.1:<پورت آزاد> بالا می‌آید.
//! هیچ پورت عمومی باز نمی‌شود و همهٔ اتصال‌ها فقط loopback هستند.
//!
//! بهبودهای نسخهٔ ۴٫۱:
//! * سلامت‌سنجی واقعی با HTTP GET روی `/api/health` (نه فقط باز بودن TCP)
//! * تشخیص زودهنگام کرشِ سایدکار Node (اتمام پردازه قبل از آماده‌شدن)
//! * تایم‌اوت قابل تنظیم با `SANJAB_STARTUP_TIMEOUT_MS` (پیش‌فرض ۳۰ ثانیه)
//! * صفحهٔ خطای حرفه‌ای به‌جای ماندن کاربر روی Loading برای همیشه
//! * پاک‌سازی پردازهٔ Node در «همهٔ» مسیرهای شکست (سلامت‌سنجی، ساخت پنجره، خروج)
//! * دیتابیس SQLite کاربر در AppData — نه داخل پوشهٔ نصب؛ مقدار اولیهٔ امن
//!   از نسخهٔ تازهٔ ساخته‌شده در CI (بدون دادهٔ توسعه‌دهنده)
//! * لاگ سرور روی stderr اپ — بدون هیچ دادهٔ حساسی (کلیدها سمت WebView می‌مانند)

use std::io::{Read, Write};
use std::net::{SocketAddr, TcpListener, TcpStream};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use tauri::{AppHandle, Manager, RunEvent, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

struct ServerGuard(Mutex<Option<CommandChild>>);

/// انتخاب پورت آزاد تصادفی روی loopback — با چند تلاش برای کاهش احتمال تصادم
fn pick_free_port() -> std::io::Result<u16> {
    let mut last_err = None;
    for _ in 0..5 {
        match TcpListener::bind("127.0.0.1:0") {
            Ok(l) => {
                let port = l.local_addr()?.port();
                drop(l);
                return Ok(port);
            }
            Err(e) => last_err = Some(e),
        }
    }
    Err(last_err.unwrap_or_else(|| std::io::Error::other("no port")))
}

/// یک درخواست HTTP GET ساده به /api/health — بدون وابستگی جدید.
/// فقط پاسخ ۲۰۰ به معنی «سرور واقعاً آماده است» است؛ باز بودن TCP کافی نیست.
fn http_health_ok(port: u16, per_try: Duration) -> bool {
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let Ok(mut stream) = TcpStream::connect_timeout(&addr, per_try) else {
        return false;
    };
    let _ = stream.set_read_timeout(Some(per_try));
    let _ = stream.set_write_timeout(Some(per_try));
    let req = format!(
        "GET /api/health HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nConnection: close\r\n\r\n"
    );
    if stream.write_all(req.as_bytes()).is_err() {
        return false;
    }
    let mut buf = [0u8; 256];
    let n = stream.read(&mut buf).unwrap_or(0);
    let head = String::from_utf8_lossy(&buf[..n]);
    head.starts_with("HTTP/1.1 200") || head.starts_with("HTTP/1.0 200")
}

/// صبر برای سلامت واقعی سرور؛ اگر پردازهٔ Node بمیرد زودتر متوقف می‌شود.
/// خروجی: Ok(()) یا Err(علت دقیق برای صفحهٔ خطا)
fn wait_for_health(port: u16, timeout_ms: u64, crashed: &AtomicBool) -> Result<(), String> {
    let deadline = std::time::Instant::now() + Duration::from_millis(timeout_ms);
    loop {
        if crashed.load(Ordering::SeqCst) {
            return Err(
                "پردازهٔ سرور محلی زودتر از موعد بسته شد (کرش Node یا خرابی فایل‌های server-dist)."
                    .into(),
            );
        }
        if http_health_ok(port, Duration::from_millis(1200)) {
            return Ok(());
        }
        if std::time::Instant::now() >= deadline {
            return Err(format!(
                "سرور محلی در {} ثانیه آماده نشد (تایم‌اوت سلامت‌سنجی HTTP). فایروال یا آنتی‌ویروس پورت محلی را بررسی کن.",
                timeout_ms / 1000
            ));
        }
        std::thread::sleep(Duration::from_millis(350));
    }
}

fn resolve_server_dir(app: &AppHandle) -> PathBuf {
    app.path()
        .resource_dir()
        .expect("مسیر منابع پیدا نشد")
        .join("server-dist")
}

/// آماده‌سازی دیتابیس کاربر در AppData:
/// * اگر وجود ندارد و نسخهٔ تازهٔ CI در منابع هست → کپی امن (بدون دادهٔ توسعه)
/// * مسیر برشدهٔ ویندوز به «file:…» با اسلش رو تبدیل می‌شود
fn prepare_database(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("مسیر AppData پیدا نشد: {e}"))?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("ساخت AppData ناموفق: {e}"))?;
    let db_path = dir.join("sanjabos.db");
    if !db_path.exists() {
        let seed = resolve_server_dir(app).join("sanjabos.db");
        if seed.exists() {
            std::fs::copy(&seed, &db_path)
                .map_err(|e| format!("کپی دیتابیس اولیه ناموفق: {e}"))?;
            eprintln!("[sanjab] database seeded into AppData: {}", db_path.display());
        } else {
            eprintln!("[sanjab] no bundled database — API routes will report db=unavailable");
        }
    }
    Ok(db_path)
}

/// مسیر دیتابیس به DATABASE_URL معتبر (اسلش رو در ویندوز)
fn db_url(db_path: &PathBuf) -> String {
    let as_text = db_path.to_string_lossy().replace('\\', "/");
    format!("file:{as_text}")
}

type Spawned = (u16, CommandChild, Arc<AtomicBool>);

fn spawn_server(app: &AppHandle) -> Result<Spawned, String> {
    let port = pick_free_port().map_err(|e| format!("پورت آزاد پیدا نشد: {e}"))?;
    let server_dir = resolve_server_dir(app);
    let server_js = server_dir.join("server.js");
    if !server_js.exists() {
        return Err(format!(
            "server.js پیدا نشد: {p} — بیلد standalone در server-dist نبود",
            p = server_js.display()
        ));
    }
    let db_path = prepare_database(app)?;

    let sidecar = app
        .shell()
        .sidecar("node")
        .map_err(|e| format!("سایدکار node ساخته نشد: {e}"))?
        .args(["server.js"])
        .current_dir(&server_dir)
        .env("PORT", port.to_string())
        .env("HOSTNAME", "127.0.0.1")
        .env("NODE_ENV", "production")
        .env("DATABASE_URL", db_url(&db_path));

    let (rx, child) = sidecar
        .spawn()
        .map_err(|e| format!("اجرای Node ناموفق بود: {e}"))?;

    // لاگ سرور محلی روی stderr اپ می‌ریزد — هیچ‌وقت به شبکه نمی‌رود.
    // اگر پردازه بمیرد، پرچم crashed زودتر از تایم‌اوت راه را نشان می‌دهد.
    let crashed = Arc::new(AtomicBool::new(false));
    let crashed_flag = Arc::clone(&crashed);
    tauri::async_runtime::spawn(async move {
        let mut rx = rx;
        while let Some(ev) = rx.recv().await {
            match ev {
                CommandEvent::Stdout(line) => {
                    eprint!("{}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Stderr(line) => {
                    eprint!("{}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Terminated(status) => {
                    eprintln!("[sanjab] sidecar terminated: {status:?}");
                    crashed_flag.store(true, Ordering::SeqCst);
                    break;
                }
                CommandEvent::Error(err) => {
                    eprintln!("[sanjab] sidecar error: {err}");
                }
                _ => {}
            }
        }
    });

    Ok((port, child, crashed))
}

/// صفحهٔ خطای حرفه‌ای با علت دقیق — کاربر هرگز روی Loading گیر نمی‌کند
fn show_error_window(app: &AppHandle, reason: &str) {
    // درصدهندکی صحیح UTF-8 (حروف فارسی چندبایتی سالم می‌مانند)
    let encoded: String = reason
        .bytes()
        .map(|b| {
            if b.is_ascii_alphanumeric() || b"-._~".contains(&b) {
                (b as char).to_string()
            } else {
                format!("%{b:02X}")
            }
        })
        .collect();
    let win = WebviewWindowBuilder::new(
        app,
        "startup-error",
        WebviewUrl::App(PathBuf::from(format!("error.html#{}", encoded))),
    )
    .title("SanjabOS — خطای راه‌اندازی")
    .inner_size(560.0, 380.0)
    .resizable(false)
    .center()
    .build();
    if let Err(e) = win {
        eprintln!("نمایش صفحهٔ خطا ناموفق بود: {e} — علت: {reason}");
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(ServerGuard(Mutex::new(None)))
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let timeout_ms: u64 = std::env::var("SANJAB_STARTUP_TIMEOUT_MS")
                    .ok()
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(30_000);

                let spawned = spawn_server(&handle);
                let (port, child, crashed) = match spawned {
                    Ok(v) => v,
                    Err(reason) => {
                        eprintln!("[sanjab] راه‌اندازی سرور ناموفق: {reason}");
                        show_error_window(&handle, &reason);
                        return;
                    }
                };

                match wait_for_health(port, timeout_ms, &crashed) {
                    Ok(()) => {
                        let guard = handle.state::<ServerGuard>();
                        *guard.0.lock().unwrap() = Some(child);

                        let url = format!("http://127.0.0.1:{port}");
                        let win = WebviewWindowBuilder::new(
                            &handle,
                            "main",
                            WebviewUrl::External(url.parse().expect("URL نامعتبر")),
                        )
                        .title("SanjabOS 4.1 — SunJob Edition")
                        .inner_size(1280.0, 800.0)
                        .min_inner_size(360.0, 480.0)
                        .build();
                        if let Err(e) = win {
                            eprintln!("ساخت پنجرهٔ اصلی ناموفق: {e}");
                            // پاک‌سازی در مسیر شکست — پردازهٔ Node بازنمی‌ماند
                            let guard = handle.state::<ServerGuard>();
                            if let Some(child) = guard.0.lock().unwrap().take() {
                                let _ = child.kill();
                            }
                            show_error_window(&handle, "ساخت پنجرهٔ اصلی ناموفق بود. درایور گرافیک یا نسخهٔ WebView2 را بررسی کن.");
                        }
                    }
                    Err(reason) => {
                        eprintln!("[sanjab] {reason}");
                        // پاک‌سازی در مسیر شکست سلامت‌سنجی
                        let _ = child.kill();
                        show_error_window(&handle, &reason);
                    }
                }
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("خطای ساخت Tauri")
        .run(|app, event| {
            if let RunEvent::ExitRequested { .. } = event {
                // خاموشی تمیز: پردازهٔ Node حتماً بسته شود
                let guard = app.state::<ServerGuard>();
                let mut slot = guard.0.lock().unwrap();
                let child = slot.take();
                drop(slot);
                if let Some(child) = child {
                    let _ = child.kill();
                };
            }
        });
}
