"""درس‌های لینوکس سان‌جاب — متن فارسی با تمرین تایپ فرمان (شبیه‌ساز امن).

تمرین‌ها «فرمانی» هستند: کاربر فرمان را تایپ می‌کند و ساختار فرمان با الگو
بررسی می‌شود. هیچ فرمان واقعی روی سیستم اجرا نمی‌شود — فقط تطبیق الگو.
"""
from __future__ import annotations

from typing import Any, Dict, List

LESSONS: List[Dict[str, Any]] = [
    {
        "id": "01",
        "title_fa": "ترمینال و پوسته",
        "body_fa": [
            "ترمینال پنجره‌ای است که با پوسته (shell) حرف می‌زنی؛ پوسته فرمان‌ها را می‌خواند و اجرا می‌کند.",
            "فرمان الگوی کلی دارد: نام‌برنامه -گزینه‌ها آرگومان‌ها؛ مثلا ls -l /home.",
            "در سان‌جاب همهٔ تمرین‌های ترمینال شبیه‌ساز امن است — هیچ فرمان واقعی اجرا نمی‌شود.",
        ],
        "example": "uname -a",
        "exercise": {
            "kind": "command",
            "prompt_fa": "فرمان uname را با گزینهٔ a بنویس (نمایش همهٔ اطلاعات سیستم).",
            "starter": "",
            "check": [{"kind": "regex", "pattern": r"^uname\s+-a\s*$"}],
        },
        "solution": "uname -a",
        "hint_fa": "فقط بنویس: uname -a",
        "xp": 15,
    },
    {
        "id": "02",
        "title_fa": "pwd و ls",
        "body_fa": [
            "pwd مسیر فعلی را چاپ می‌کند: print working directory.",
            "ls محتوای پوشه را می‌دهد؛ ls -l جزئیات و ls -a فایل‌های مخفی را نشان می‌دهد.",
            "فایل‌هایی که با نقطه شروع می‌شوند مخفی‌اند: .bashrc",
        ],
        "example": "ls -la",
        "exercise": {
            "kind": "command",
            "prompt_fa": "فرمانی بنویس که فهرست را با جزئیات (l) و فایل‌های مخفی (a) نشان دهد.",
            "starter": "",
            "check": [{"kind": "regex", "pattern": r"^ls\s+(-[la]{1,2}|-\w*l\w*a\w*|-\w*a\w*l\w*)\s*$"}],
        },
        "solution": "ls -la",
        "hint_fa": "ls با دو گزینه: ls -la یا ls -al",
        "xp": 15,
    },
    {
        "id": "03",
        "title_fa": "cd و مسیرها",
        "body_fa": [
            "cd پوشهٔ فعلی را عوض می‌کند؛ مسیر مطلق با / شروع می‌شود و نسبی از جای فعلی می‌رود.",
            "~ خانهٔ کاربر است: cd ~/projects. دو نقطه یعنی پوشهٔ بالاتر: cd ..",
            "cd بدون آرگومان به خانه برمی‌گرداند.",
        ],
        "example": "cd ~/projects",
        "exercise": {
            "kind": "command",
            "prompt_fa": "با یک فرمان به پوشهٔ بالاتر برو.",
            "starter": "",
            "check": [{"kind": "regex", "pattern": r"^cd\s+\.\.\s*$"}],
        },
        "solution": "cd ..",
        "hint_fa": "دو نقطه یعنی بالا: cd ..",
        "xp": 15,
    },
    {
        "id": "04",
        "title_fa": "mkdir و touch",
        "body_fa": [
            "mkdir پوشهٔ جدید می‌سازد: mkdir notes. با -p مسیر چندلایه می‌سازد.",
            "touch فایل خالی می‌سازد یا زمان فایل موجود را تازه می‌کند.",
            "نام پوشه/فایل به بزرگی حروف حساس است: Notes با notes فرق دارد.",
        ],
        "example": "mkdir -p work/2025",
        "exercise": {
            "kind": "command",
            "prompt_fa": "پوشه‌ای به نام projects بساز.",
            "starter": "",
            "check": [{"kind": "regex", "pattern": r"^mkdir\s+(\-p\s+)?projects\s*$"}],
        },
        "solution": "mkdir projects",
        "hint_fa": "mkdir projects کافی است؛ -p برای مسیرهای چندلایه است.",
        "xp": 15,
    },
    {
        "id": "05",
        "title_fa": "cp و mv",
        "body_fa": [
            "cp کپی می‌سازد: cp source dest. برای پوشه باید -r بگذاری.",
            "mv جابه‌جا می‌کند یا تغییر نام می‌دهد: mv old.txt new.txt.",
            "اگر مقصد پوشه باشد، فایل داخلش می‌رود: cp a.txt backup/",
        ],
        "example": "cp notes/todo.txt backup/",
        "exercise": {
            "kind": "command",
            "prompt_fa": "فایل a.txt را با تغییر نام به b.txt منتقل کن (یک فرمان).",
            "starter": "",
            "check": [{"kind": "regex", "pattern": r"^mv\s+a\.txt\s+b\.txt\s*$"}],
        },
        "solution": "mv a.txt b.txt",
        "hint_fa": "mv source dest: mv a.txt b.txt",
        "xp": 20,
    },
    {
        "id": "06",
        "title_fa": "rm و احتیاط",
        "body_fa": [
            "rm فایل را حذف می‌کند؛ حذف در ترمینال سطل بازیافت ندارد.",
            "حذف پوشه با محتوا: rm -r folder. -f حذف بدون پرسش است — با احتیاط.",
            "هرگز rm -rf / یا مسیر مبهم نزن؛ اول ls بزن و مطمئن شو.",
        ],
        "example": "rm old.log",
        "exercise": {
            "kind": "command",
            "prompt_fa": "پوشهٔ temp را با محتویاتش حذف کن (بازگشتی).",
            "starter": "",
            "check": [{"kind": "regex", "pattern": r"^rm\s+-(r|rf|fr)\s+temp\s*$"}],
        },
        "solution": "rm -r temp",
        "hint_fa": "برای پوشه حتماً -r: rm -r temp",
        "xp": 20,
    },
    {
        "id": "07",
        "title_fa": "cat و خواندن فایل",
        "body_fa": [
            "cat محتوای فایل را چاپ می‌کند: cat file.txt.",
            "برای فایل‌های بلند از less استفاده کن — با q بیرون می‌آیی.",
            "head و tail ابتدا/انتهای فایل را می‌دهند: tail -n 20 log.txt",
        ],
        "example": "cat /etc/motd",
        "exercise": {
            "kind": "command",
            "prompt_fa": "محتوای فایل notes.txt را چاپ کن.",
            "starter": "",
            "check": [{"kind": "regex", "pattern": r"^cat\s+notes\.txt\s*$"}],
        },
        "solution": "cat notes.txt",
        "hint_fa": "cat notes.txt",
        "xp": 15,
    },
    {
        "id": "08",
        "title_fa": "بازتاب خروجی > و >>",
        "body_fa": [
            "خروجی فرمان را می‌توانی داخل فایل بریزی: echo salam > note.txt.",
            "> فایل را از نو می‌نویسد؛ >> به انتهای آن اضافه می‌کند.",
            "اگر فایل نباشد ساخته می‌شود — دقت کن > محتوای قبلی را پاک می‌کند.",
        ],
        "example": "echo sanjab > info.txt",
        "exercise": {
            "kind": "command",
            "prompt_fa": "کلمه sanjab را داخل فایل info.txt بنویس (بازتاب >).",
            "starter": "",
            "check": [{"kind": "regex", "pattern": r"^echo\s+sanjab\s*>\s*info\.txt\s*$"}],
        },
        "solution": "echo sanjab > info.txt",
        "hint_fa": "echo sanjab > info.txt",
        "xp": 20,
    },
    {
        "id": "09",
        "title_fa": "grep و جستجو در متن",
        "body_fa": [
            "grep الگو را در فایل‌ها جستجو می‌کند: grep sanjab log.txt.",
            "-i نادیده‌گرفتن بزرگی حروف، -n شمارهٔ خط، -r جستجوی بازگشتی در پوشه.",
            "الگوها regex هستند: grep -i error *.log",
        ],
        "example": "grep -n sanjab log.txt",
        "exercise": {
            "kind": "command",
            "prompt_fa": "کلمه sanjab را در فایل log.txt جستجو کن (با شمارهٔ خط).",
            "starter": "",
            "check": [{"kind": "regex", "pattern": r"^grep\s+(-n\s+)?sanjab\s+log\.txt\s*$"}],
        },
        "solution": "grep -n sanjab log.txt",
        "hint_fa": "grep sanjab log.txt یا با -n: grep -n sanjab log.txt",
        "xp": 20,
    },
    {
        "id": "10",
        "title_fa": "find و پیدا کردن فایل",
        "body_fa": [
            "find مسیر را جستجو می‌کند: find . -name \"*.txt\" همهٔ فایل‌های txt.",
            "اولین آرگومان نقطه شروع جستجو از پوشهٔ فعلی است.",
            "با -type f فقط فایل‌ها و با -type d فقط پوشه‌ها را می‌گیری.",
        ],
        "example": "find . -name \"*.txt\"",
        "exercise": {
            "kind": "command",
            "prompt_fa": "از پوشهٔ فعلی همهٔ فایل‌های با پسوند txt را پیدا کن.",
            "starter": "",
            "check": [{"kind": "regex", "pattern": r"^find\s+\.\s+-name\s+[\"']?\*\.txt[\"']?\s*$"}],
        },
        "solution": 'find . -name "*.txt"',
        "hint_fa": 'find . -name "*.txt" — نقطه یعنی از همین‌جا.',
        "xp": 20,
    },
    {
        "id": "11",
        "title_fa": "chmod و مجوزها",
        "body_fa": [
            "مجوزها سه‌تایی‌اند: مالک/گروه/دیگران و هرکدام r=4 و w=2 و x=1.",
            "مثال: 644 یعنی مالک خواندن+نوشتن، بقیه فقط خواندن.",
            "chmod 600 secret.txt فقط مالک را صاحب حق می‌کند؛ 755 برای اسکریپت‌های اجرایی.",
        ],
        "example": "chmod 600 secret.txt",
        "exercise": {
            "kind": "command",
            "prompt_fa": "مجوز فایل secret.txt را طوری بگذار که فقط مالک خواندن/نوشتن داشته باشد (عددی).",
            "starter": "",
            "check": [{"kind": "regex", "pattern": r"^chmod\s+600\s+secret\.txt\s*$"}],
        },
        "solution": "chmod 600 secret.txt",
        "hint_fa": "600 یعنی rw برای مالک و هیچ برای بقیه: chmod 600 secret.txt",
        "xp": 25,
    },
    {
        "id": "12",
        "title_fa": "پایپ | و کمک گرفتن",
        "body_fa": [
            "پایپ خروجی یک فرمان را ورودی فرمان بعدی می‌کند: cat log.txt | grep error.",
            "man page هر فرمان را می‌دهد: man ls؛ --help نسخهٔ کوتاه است.",
            "ترکیب فرمان‌های کوچک، کاری قوی می‌سازد — فلسفهٔ یونیکس.",
        ],
        "example": "cat log.txt | grep error",
        "exercise": {
            "kind": "command",
            "prompt_fa": "محتوای log.txt را با پایپ به grep بده و کلمه error را بگیر.",
            "starter": "",
            "check": [{"kind": "regex", "pattern": r"^(cat|less)\s+log\.txt\s*\|\s*grep\s+error\s*$"}],
        },
        "solution": "cat log.txt | grep error",
        "hint_fa": "cat log.txt | grep error",
        "xp": 25,
    },
]
