"""درس‌های راست سان‌جاب — متن فارسی با تمرین شبیه‌سازی‌شده (بررسی با regex، بدون کامپایل واقعی).

نکتهٔ صادقانه: درس‌های راست بدون rustc بررسی می‌شوند؛ ساختار کد با الگوها چک
می‌شود. کامپایل واقعی به نصب rustc/cargo نیاز دارد — با sanjab doctor ببین.
"""
from __future__ import annotations

from typing import Any, Dict, List

LESSONS: List[Dict[str, Any]] = [
    {
        "id": "01",
        "title_fa": "سلام دنیا",
        "body_fa": [
            "نقطهٔ ورود هر برنامهٔ راست تابع fn main() است.",
            "چاپ با ماکرو println! انجام می‌شود — علامت تعجب یعنی ماکرو نه تابع.",
            "هر جمله با ; تمام می‌شود؛ بدون آن خطای کامپایل می‌گیری.",
        ],
        "example": 'fn main() {\n    println!("salam, donya!");\n}',
        "exercise": {
            "kind": "rust",
            "prompt_fa": 'یک fn main بنویس که با println! جمله‌ی "salam sanjab" را چاپ کند.',
            "starter": "fn main() {\n    # چاپ با println!\n}",
            "check": [
                {"kind": "regex", "pattern": r"fn\s+main\s*\(\s*\)"},
                {"kind": "regex", "pattern": r"println!\s*\("},
            ],
        },
        "solution": 'fn main() {\n    println!("salam sanjab");\n}',
        "hint_fa": 'داخل بدنهٔ main بنویس: println!("salam sanjab");',
        "xp": 20,
    },
    {
        "id": "02",
        "title_fa": "متغیرها و immutability",
        "body_fa": [
            "متغیر با let ساخته می‌شود و به‌صورت پیش‌فرض تغییرناپذیر (immutable) است.",
            "برای تغییرپذیری باید صریح بنویسی: let mut.",
            "shadowing مجاز است: let دوباره با همان نام، مقدار جدید می‌دهد.",
        ],
        "example": "let x = 5;\nlet mut y = 10;\ny = y + x;\nprintln!(\"{}\", y);",
        "exercise": {
            "kind": "rust",
            "prompt_fa": "متغیر تغییرپذیر count با مقدار 0 بساز، یکی بهش اضافه کن و چاپش کن.",
            "starter": "fn main() {\n    // count را با let mut بساز، +1 کن و چاپ کن\n}",
            "check": [
                {"kind": "regex", "pattern": r"let\s+mut\s+count"},
                {"kind": "regex", "pattern": r"println!"},
            ],
        },
        "solution": "fn main() {\n    let mut count = 0;\n    count = count + 1;\n    println!(\"{}\", count);\n}",
        "hint_fa": "let mut count = 0; سپس count = count + 1; سپس println!(\"{}\", count);",
        "xp": 20,
    },
    {
        "id": "03",
        "title_fa": "انواع داده",
        "body_fa": [
            "اعداد صحیح: i32 پیش‌فرض؛ اعشاری: f64؛ درست/غلط: bool؛ حرف: char.",
            "رشتهٔ برشی &str برای متن‌های ثابت و String برای مالکیت متن.",
            "تبدیل صریح لازم است: 5 as f64 یا 5.0.",
        ],
        "example": 'let a: i32 = 7;\nlet b: f64 = 2.5;\nlet c: bool = true;\nlet d: char = \'س\';\nlet e: &str = "sanjab";',
        "exercise": {
            "kind": "rust",
            "prompt_fa": "دو متغیر بنویس: یک i32 با مقدار 7 و یک f64 با مقدار 2.5 و هر دو را چاپ کن.",
            "starter": "fn main() {\n    // متغیر i32 و f64\n}",
            "check": [
                {"kind": "regex", "pattern": r":\s*i32"},
                {"kind": "regex", "pattern": r":\s*f64"},
            ],
        },
        "solution": 'fn main() {\n    let a: i32 = 7;\n    let b: f64 = 2.5;\n    println!("{} {}", a, b);\n}',
        "hint_fa": 'let a: i32 = 7; و let b: f64 = 2.5; — نوع را با دونقطه اعلام کن.',
        "xp": 20,
    },
    {
        "id": "04",
        "title_fa": "توابع",
        "body_fa": [
            "تابع با fn نام(پارامترها) -> نوع‌خروجی تعریف می‌شود.",
            "نوع هر پارامتر اجباری است: fn add(a: i32, b: i32) -> i32.",
            "آخرین عبارت بدون ; مقدار بازگشتی است یا از return استفاده کن.",
        ],
        "example": "fn add(a: i32, b: i32) -> i32 {\n    a + b\n}\n\nfn main() {\n    println!(\"{}\", add(2, 3));\n}",
        "exercise": {
            "kind": "rust",
            "prompt_fa": "تابع double بنویس که یک i32 بگیرد و دو برابرش را برگرداند؛ در main نتیجه را برای 4 چاپ کن.",
            "starter": "fn double(x: i32) -> i32 {\n    // دو برابر\n}\n\nfn main() {\n    // println با double(4)\n}",
            "check": [
                {"kind": "regex", "pattern": r"fn\s+double\s*\(\s*x\s*:\s*i32\s*\)\s*->\s*i32"},
                {"kind": "regex", "pattern": r"double\s*\(\s*4\s*\)"},
            ],
        },
        "solution": "fn double(x: i32) -> i32 {\n    x * 2\n}\n\nfn main() {\n    println!(\"{}\", double(4));\n}",
        "hint_fa": "بدنهٔ double فقط x * 2 است (بدون ;) و در main: println!(\"{}\", double(4));",
        "xp": 25,
    },
    {
        "id": "05",
        "title_fa": "شرط if",
        "body_fa": [
            "شرط در راست پرانتز نمی‌خواهد: if score >= 10 { ... }.",
            "if یک عبارت است — می‌توانی نتیجه‌اش را در let بگذاری.",
            "بلاک‌های if و else باید هم‌نوع برگردانند.",
        ],
        "example": "let score = 12;\nif score >= 10 {\n    println!(\"pass\");\n} else {\n    println!(\"fail\");\n}",
        "exercise": {
            "kind": "rust",
            "prompt_fa": "با if و else برای score برابر 12 چاپ کن pass اگر >= 10 بود وگرنه fail.",
            "starter": "fn main() {\n    let score = 12;\n    // if/else بدون پرانتز\n}",
            "check": [
                {"kind": "regex", "pattern": r"if\s+score\s*>=\s*10"},
                {"kind": "regex", "pattern": r"else"},
            ],
        },
        "solution": 'fn main() {\n    let score = 12;\n    if score >= 10 {\n        println!("pass");\n    } else {\n        println!("fail");\n    }\n}',
        "hint_fa": 'if score >= 10 { println!("pass"); } else { println!("fail"); }',
        "xp": 20,
    },
    {
        "id": "06",
        "title_fa": "حلقه‌ها",
        "body_fa": [
            "for با بازه کار می‌کند: for i in 0..5 اعداد ۰ تا ۴ می‌دهد.",
            "loop حلقهٔ بی‌نهایت است و با break مقدار هم می‌تواند برگرداند.",
            "while تا وقتی شرط درست است ادامه می‌دهد.",
        ],
        "example": "for i in 0..3 {\n    println!(\"{}\", i);\n}",
        "exercise": {
            "kind": "rust",
            "prompt_fa": "با for و بازهٔ 0..5 اعداد 0 تا 4 را چاپ کن.",
            "starter": "fn main() {\n    // حلقهٔ for با 0..5\n}",
            "check": [
                {"kind": "regex", "pattern": r"for\s+\w+\s+in\s+0\.\.5"},
                {"kind": "regex", "pattern": r"println!"},
            ],
        },
        "solution": 'fn main() {\n    for i in 0..5 {\n        println!("{}", i);\n    }\n}',
        "hint_fa": 'for i in 0..5 { println!("{}", i); } — بازه 0..5 یعنی تا قبل از 5.',
        "xp": 20,
    },
    {
        "id": "07",
        "title_fa": "مالکیت (Ownership)",
        "body_fa": [
            "هر مقدار یک مالک دارد؛ وقتی مالک از scope خارج شود، مقدار آزاد می‌شود.",
            "انتساب متغیرهای غیر-Copy مالکیت را منتقل (move) می‌کند و متغیر قبلی نامعتبر می‌شود.",
            "خطای معروف E0382 یعنی از مقدار جابه‌جاشده استفاده کردی (borrow of moved value).",
        ],
        "example": 'let s1 = String::from("sanjab");\nlet s2 = s1; // move\n// println!("{}", s1); خطا: value borrowed after move',
        "exercise": {
            "kind": "rust",
            "prompt_fa": "کدی بنویس که String بسازد، مالکیتش را به متغیر دوم move کند و فقط از متغیر دوم چاپ کند.",
            "starter": 'fn main() {\n    let s1 = String::from("sanjab");\n    // move به s2 و فقط چاپ s2\n}',
            "check": [
                {"kind": "regex", "pattern": r"String::from"},
                {"kind": "regex", "pattern": r"let\s+s2\s*=\s*s1\s*;"},
                {"kind": "regex", "pattern": r"println!\s*\(\s*\"[^\"]*\"\s*,\s*s2\s*\)"},
            ],
        },
        "solution": 'fn main() {\n    let s1 = String::from("sanjab");\n    let s2 = s1;\n    println!("{}", s2);\n}',
        "hint_fa": 'let s2 = s1; بعد از move فقط s2 را چاپ کن؛ s1 دیگر قابل استفاده نیست.',
        "xp": 25,
    },
    {
        "id": "08",
        "title_fa": "ارجاع و قرض (Borrowing)",
        "body_fa": [
            "با & بدون گرفتن مالکیت، مقدار را قرض می‌گیری: fn len(s: &String).",
            "قرض تغییرپذیر با &mut است و در هر لحظه فقط یکی مجاز است.",
            "دو قانون: هر تعداد & یا یک &mut — هرگز هر دو با هم.",
        ],
        "example": "fn len(s: &String) -> usize {\n    s.len()\n}\n\nfn main() {\n    let s = String::from(\"sanjab\");\n    println!(\"{}\", len(&s));\n}",
        "exercise": {
            "kind": "rust",
            "prompt_fa": "تابع shout بنویس که &str می‌گیرد و متن را با println! چاپ می‌کند؛ در main با & صدا بزن.",
            "starter": 'fn shout(text: &str) {\n    // چاپ متن\n}\n\nfn main() {\n    // فراخوانی با &\n}',
            "check": [
                {"kind": "regex", "pattern": r"fn\s+shout\s*\(\s*text\s*:\s*&str\s*\)"},
                {"kind": "regex", "pattern": r"shout\s*\(\s*&"},
            ],
        },
        "solution": 'fn shout(text: &str) {\n    println!("{}", text);\n}\n\nfn main() {\n    shout(&"salam");\n}',
        "hint_fa": 'در امضای تابع &str بگذار و در فراخوانی با & شروع کن: shout(&"...");',
        "xp": 25,
    },
    {
        "id": "09",
        "title_fa": "ساختارها (Struct)",
        "body_fa": [
            "struct داده‌های مرتبط را یکجا بسته‌بندی می‌کند: struct User { name: String, level: i32 }.",
            "نمونه‌سازی با User { name: ..., level: ... } و دسترسی با نقطه.",
            "println! از {} برای struct پشتیبانی نمی‌کند؛ از {:?} با derive(Debug) استفاده کن.",
        ],
        "example": 'struct User {\n    name: String,\n    level: i32,\n}\n\nfn main() {\n    let u = User { name: String::from("pengo"), level: 2 };\n    println!("{}", u.name);\n}',
        "exercise": {
            "kind": "rust",
            "prompt_fa": "struct Player با فیلدهای name و level بساز، یک نمونه بساز و نامش را چاپ کن.",
            "starter": "struct Player {\n    // فیلدها\n}\n\nfn main() {\n    // نمونه‌سازی و چاپ name\n}",
            "check": [
                {"kind": "regex", "pattern": r"struct\s+Player"},
                {"kind": "regex", "pattern": r"name\s*:\s*"},
                {"kind": "regex", "pattern": r"level\s*:\s*i32"},
            ],
        },
        "solution": 'struct Player {\n    name: String,\n    level: i32,\n}\n\nfn main() {\n    let p = Player { name: String::from("pengo"), level: 1 };\n    println!("{}", p.name);\n}',
        "hint_fa": 'struct Player { name: String, level: i32 } و بعد let p = Player { name: ..., level: ... };',
        "xp": 25,
    },
    {
        "id": "10",
        "title_fa": "enum و match",
        "body_fa": [
            "enum مجموعهٔ حالت‌های ممکن است؛ Option<T> معروف‌ترین enum استاندارد است.",
            "match هر حالت را می‌پوشاند و کامپایلر کامل بودن را اجباری می‌کند.",
            "الگوها با => و زیرهم نوشته می‌شوند؛ _ حالت پیش‌فرض است.",
        ],
        "example": 'enum State {\n    On,\n    Off,\n}\n\nfn main() {\n    let s = State::On;\n    match s {\n        State::On => println!("roshan"),\n        State::Off => println!("khamoosh"),\n    }\n}',
        "exercise": {
            "kind": "rust",
            "prompt_fa": "enum State با دو حالت On و Off بساز و با match برای هر حالت پیام چاپ کن.",
            "starter": "enum State {\n    // حالت‌ها\n}\n\nfn main() {\n    // match روی هر دو حالت\n}",
            "check": [
                {"kind": "regex", "pattern": r"enum\s+State"},
                {"kind": "regex", "pattern": r"match\s+\w+"},
                {"kind": "regex", "pattern": r"State::On\s*=>"},
            ],
        },
        "solution": 'enum State {\n    On,\n    Off,\n}\n\nfn main() {\n    let s = State::On;\n    match s {\n        State::On => println!("roshan"),\n        State::Off => println!("khamoosh"),\n    }\n}',
        "hint_fa": 'دو بازو بنویس: State::On => println!("roshan") و State::Off => println!("khamoosh").',
        "xp": 25,
    },
    {
        "id": "11",
        "title_fa": "خطاها با Result",
        "body_fa": [
            "Result<T, E> دو حالت دارد: Ok مقدار موفق و Err خطا.",
            "با match یا if let نتیجه را مدیریت کن؛ عملگر ? خطا را به بالا می‌فرستد.",
            "panic! برای خطاهای برگشت‌ناپذیر است — در کد عادی از Result استفاده کن.",
        ],
        "example": 'fn parse_num(text: &str) -> Result<i32, String> {\n    text.parse::<i32>().map_err(|_| String::from("adad nist"))\n}\n\nfn main() {\n    match parse_num("42") {\n        Ok(n) => println!("{}", n),\n        Err(e) => println!("{}", e),\n    }\n}',
        "exercise": {
            "kind": "rust",
            "prompt_fa": "تابعی بنویس که Result<i32, String> برگرداند و در main با match هر دو حالت Ok و Err را مدیریت کن.",
            "starter": "fn parse_num(text: &str) -> Result<i32, String> {\n    // تبدیل و خطای سفارشی\n}\n\nfn main() {\n    // match با Ok و Err\n}",
            "check": [
                {"kind": "regex", "pattern": r"Result\s*<\s*i32\s*,\s*String\s*>"},
                {"kind": "regex", "pattern": r"Ok\s*\(\s*\w+\s*\)\s*=>"},
                {"kind": "regex", "pattern": r"Err\s*\(\s*\w+\s*\)\s*=>"},
            ],
        },
        "solution": 'fn parse_num(text: &str) -> Result<i32, String> {\n    text.parse::<i32>().map_err(|_| String::from("khata"))\n}\n\nfn main() {\n    match parse_num("42") {\n        Ok(n) => println!("{}", n),\n        Err(e) => println!("{}", e),\n    }\n}',
        "hint_fa": 'دو بازوی match: Ok(n) => println!("{}", n) و Err(e) => println!("{}", e).',
        "xp": 30,
    },
]
