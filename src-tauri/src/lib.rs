//! SanjabOS — لایهٔ دسکتاپ (POC معماری سایدکار)
//!
//! معماری: وب‌ویو Tauri به سرور محلی Next.js (standalone) وصل می‌شود که
//! با سایدکارِ Node (باندل‌شده) روی 127.0.0.1:<پورت آزاد> بالا می‌آید.
//! هیچ پورت عمومی باز نمی‌شود و همهٔ اتصال‌ها فقط loopback هستند.

use std::net::TcpListener;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Mutex;
use std::time::Duration;

use tauri::{AppHandle, Manager, RunEvent, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_shell::ShellExt;

struct ServerGuard(Mutex<Option<CommandChild>>);

/// انتخاب پورت آزاد تصادفی روی loopback
fn pick_free_port() -> std::io::Result<u16> {
    let l = TcpListener::bind("127.0.0.1:0")?;
    let port = l.local_addr()?.port();
    drop(l);
    Ok(port)
}

/// صبر برای آماده‌شدن سرور (اتصال TCP به 127.0.0.1:port)
fn wait_for_server(port: u16, timeout_ms: u64) -> bool {
    let deadline = std::time::Instant::now() + Duration::from_millis(timeout_ms);
    while std::time::Instant::now() < deadline {
        if std::net::TcpStream::connect(("127.0.0.1", port)).is_ok() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(300));
    }
    false
}

fn resolve_server_dir(app: &AppHandle) -> PathBuf {
    let res = app
        .path()
        .resource_dir()
        .expect("مسیر منابع پیدا نشد");
    res.join("server-dist")
}

fn spawn_server(app: &AppHandle) -> Result<(u16, CommandChild), String> {
    /* رقابت پورت: بین آزادسازی سوکت آزمایشی و بایندِ Node ممکن است پروسهٔ دیگری
       همان پورت را بگیرد — تا ۳ بار تلاش می‌کنیم؛ اگر سرور بالا نیامد فرزند
       کشته می‌شود و پورت تازه‌ای گرفته می‌شود. */
    let mut last_err = String::from("خطای نامشخص");
    for attempt in 0..3 {
        match try_spawn_once(app) {
            Ok(pair) => return Ok(pair),
            Err(e) => {
                last_err = e;
                if attempt + 1 < 3 {
                    std::thread::sleep(Duration::from_millis(250));
                }
            }
        }
    }
    Err(last_err)
}

fn try_spawn_once(app: &AppHandle) -> Result<(u16, CommandChild), String> {
    let port = pick_free_port().map_err(|e| format!("پورت آزاد پیدا نشد: {e}"))?;
    let server_dir = resolve_server_dir(app);
    let server_js = server_dir.join("server.js");
    if !server_js.exists() {
        return Err(format!(
            "server.js پیدا نشد: {} — بیلد standalone در server-dist نبود",
            server_js.display()
        ));
    }

    let sidecar = app
        .shell()
        .sidecar("node")
        .map_err(|e| format!("سایدکار node ساخته نشد: {e}"))?
        .args(["server.js"])
        .current_dir(&server_dir)
        .env("PORT", port.to_string())
        .env("HOSTNAME", "127.0.0.1")
        .env("NODE_ENV", "production");

    let (rx, child) = sidecar
        .spawn()
        .map_err(|e| format!("اجرای Node ناموفق بود: {e}"))?;

    /* اگر Node به‌خاطر EADDRINUSE مرد، تا ۸ ثانیه صبر و بعد رد می‌کنیم تا
       لایهٔ بالاتر با پورت تازه دوباره تلاش کند */
    if !wait_for_server(port, 8_000) {
        let _ = child.kill();
        return Err(format!("سرور روی پورت {port} بالا نیامد (احتمالاً EADDRINUSE)"));
    }

    // لاگ سرور را در استدآوت اپ می‌ریزیم (لاگِ محلی؛ به شبکه نمی‌رود)
    tauri::async_runtime::spawn(async move {
        use tauri_plugin_shell::process::CommandEvent;
        let mut rx = rx;
        while let Some(ev) = rx.recv().await {
            if let CommandEvent::Stdout(line) = ev {
                print!("{}", String::from_utf8_lossy(&line));
            }
        }
    });

    Ok((port, child))
}

/* شمارندهٔ برچسب یکتا برای پنجره‌های بومی مرورگر */
static NATIVE_WIN_COUNTER: AtomicU32 = AtomicU32::new(1);

/// باز کردن یک پنجرهٔ بومی واقعی مرورگر (WebView2 روی ویندوز، WebKit روی لینوکس/مک).
/// برخلاف iframe، سیاست X-Frame-Options اینجا اعمال نمی‌شود چون زمینهٔ مرور
/// سطح‌بالا (top-level) است — دقیقاً همان کاری که یک مرورگر واقعی می‌کند.
#[tauri::command]
fn open_native_browser_window(app: AppHandle, url: String) -> Result<String, String> {
    let parsed = tauri::Url::parse(&url).map_err(|_| format!("URL نامعتبر: {url}"))?;
    if parsed.scheme() != "http" && parsed.scheme() != "https" {
        return Err("فقط http و https مجاز است".into());
    }
    let host = parsed.host_str().unwrap_or("site").to_string();
    let label = format!(
        "native-browser-{}",
        NATIVE_WIN_COUNTER.fetch_add(1, Ordering::Relaxed)
    );
    WebviewWindowBuilder::new(&app, label.as_str(), WebviewUrl::External(parsed))
        .title(format!("سفربُر — {host}"))
        .inner_size(1100.0, 750.0)
        .min_inner_size(360.0, 480.0)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(label)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![open_native_browser_window])
        .manage(ServerGuard(Mutex::new(None)))
        .setup(|app| {
            let handle = app.handle().clone();
            // آماده‌سازی سرور در پس‌زمینه؛ پنجره بعد از آماده‌شدن باز می‌شود
            tauri::async_runtime::spawn(async move {
                match spawn_server(&handle) {
                    Ok((port, child)) => {
                        if !wait_for_server(port, 20_000) {
                            eprintln!("سرور محلی در ۲۰ ثانیه آماده نشد");
                            return;
                        }
                        let guard = handle.state::<ServerGuard>();
                        *guard.0.lock().unwrap() = Some(child);

                        let url = format!("http://127.0.0.1:{port}");
                        let win = WebviewWindowBuilder::new(
                            &handle,
                            "main",
                            WebviewUrl::External(url.parse().expect("URL نامعتبر")),
                        )
                        .title("SanjabOS — SunJob Edition")
                        .inner_size(1280.0, 800.0)
                        .min_inner_size(360.0, 480.0)
                        .build();
                        if let Err(e) = win {
                            eprintln!("ساخت پنجره ناموفق: {e}");
                        }
                    }
                    Err(e) => {
                        eprintln!("{e}");
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
