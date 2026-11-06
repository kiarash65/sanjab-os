"""آزمایشگاه لینوکس سان‌جاب — شبیه‌ساز امن پوسته با فایل‌سیستم درون‌حافظه‌ای.

مهم و صادقانه: این یک شبیه‌ساز آموزشی است. هیچ فرمان واقعی روی سیستم‌عامل
اجرا نمی‌شود؛ فایل‌سیستم فقط یک درخت dict در حافظه است و با خروج فرمان، همه‌چیز
پاک می‌شود. فرمان‌ها: pwd, ls, cd, mkdir, touch, cp, mv, rm, cat, echo (>، >>),
chmod, find, grep, mission, missions, help, exit.

هر مأموریت با state-check بررسی می‌شود و XP آن از gamification با شناسهٔ
رویداد تکرارناپذیر داده می‌شود.
"""
from __future__ import annotations

import fnmatch
import re
from typing import Any, Callable, Dict, List, Optional, Tuple

from . import ui

HOME: str = "/home/pengo"
MAX_TREE_NODES = 500
LABEL = "شبیه‌ساز امن — هیچ فرمان واقعی روی سیستم تو اجرا نمی‌شود"

FileNode = Dict[str, Any]
DirNode = Dict[str, Any]
Node = Dict[str, Any]


def _new_file(content: str = "", mode: str = "644") -> FileNode:
    return {"type": "file", "content": content, "mode": mode}


def _new_dir(children: Optional[Dict[str, Node]] = None) -> DirNode:
    return {"type": "dir", "children": dict(children or {})}


def _count_nodes(node: Node) -> int:
    if node["type"] == "file":
        return 1
    return 1 + sum(_count_nodes(child) for child in node["children"].values())


class SandboxFS:
    """فایل‌سیستم مجازی درون‌حافظه‌ای با مسیرهای مطلق/نسبی."""

    def __init__(self) -> None:
        self.root: DirNode = _new_dir()
        self.cwd: str = HOME
        self._build_initial_tree()

    def _build_initial_tree(self) -> None:
        etc = _new_dir({"motd": _new_file("behtar yad begiri, sanjab!"), "hostname": _new_file("sanjab-lab")})
        tmp = _new_dir()
        home = _new_dir(
            {
                "welcome.txt": _new_file("salam pengo!\nin sanjab-lab ast.\namozesh ba amniat."),
                "notes": _new_dir(),
            }
        )
        self.root["children"] = {"etc": etc, "tmp": tmp, "home": _new_dir({"pengo": home})}

    # ---------------- مسیرها ----------------
    def normalize(self, path: str) -> str:
        """نرمال‌سازی مسیر: نسبی از cwd فعلی، مطلق از ریشه؛ .. بالای ریشه نمی‌رود."""
        base = path if path.startswith("/") else (self.cwd.rstrip("/") + "/" + path)
        parts: List[str] = []
        for piece in base.split("/"):
            if piece in ("", "."):
                continue
            if piece == "..":
                if parts:
                    parts.pop()
                continue
            parts.append(piece)
        return "/" + "/".join(parts)

    def _split_parent(self, path: str) -> Tuple[Optional[DirNode], Optional[str]]:
        """گره والد + نام نهایی؛ None یعنی مسیر نامعتبر."""
        normalized = self.normalize(path)
        if normalized == "/":
            return None, None
        pieces = normalized.strip("/").split("/")
        parent_name = "/" + "/".join(pieces[:-1])
        parent = self.resolve_node(parent_name)
        if parent is None or parent["type"] != "dir":
            return None, None
        return parent, pieces[-1]

    def resolve_node(self, path: str) -> Optional[Node]:
        normalized = self.normalize(path)
        if normalized == "/":
            return self.root
        node: Node = self.root
        for piece in normalized.strip("/").split("/"):
            if node["type"] != "dir" or piece not in node["children"]:
                return None
            node = node["children"][piece]
        return node

    def _bump_limit(self) -> bool:
        return _count_nodes(self.root) >= MAX_TREE_NODES

    # ---------------- عملیات ----------------
    def mkdir(self, path: str, parents: bool = False) -> str:
        normalized = self.normalize(path)
        if self.resolve_node(normalized) is not None:
            return "همین حالا هست: " + normalized
        if self._bump_limit():
            return "ظرفیت آزمایشگاه پر شد."
        parent, name = self._split_parent(normalized)
        if parent is None or name is None:
            return "مسیر والد پیدا نشد: " + normalized
        if parents:
            pieces = normalized.strip("/").split("/")
            node: DirNode = self.root
            for piece in pieces:
                child = node["children"].get(piece)
                if child is None:
                    child = _new_dir()
                    node["children"][piece] = child
                elif child["type"] != "dir":
                    return "مسیر روی فایل است: " + piece
                node = child
            return "پوشه ساخته شد: " + normalized
        parent["children"][name] = _new_dir()
        return "پوشه ساخته شد: " + normalized

    def touch(self, path: str) -> str:
        normalized = self.normalize(path)
        existing = self.resolve_node(normalized)
        if existing is not None and existing["type"] == "file":
            return "فایل از قبل هست: " + normalized
        if existing is not None:
            return "روی پوشه نمی‌شود فایل ساخت: " + normalized
        if self._bump_limit():
            return "ظرفیت آزمایشگاه پر شد."
        parent, name = self._split_parent(normalized)
        if parent is None or name is None:
            return "مسیر والد پیدا نشد: " + normalized
        parent["children"][name] = _new_file()
        return "فایل ساخته شد: " + normalized

    def write_file(self, path: str, content: str, append: bool = False) -> str:
        normalized = self.normalize(path)
        existing = self.resolve_node(normalized)
        if existing is not None and existing["type"] == "dir":
            return "مقصد پوشه است: " + normalized
        if existing is None:
            made = self.touch(normalized)
            if "ساخته شد" not in made:
                return made
            existing = self.resolve_node(normalized)
        if existing is None or existing["type"] != "file":
            return "نوشتن ممکن نشد: " + normalized
        existing["content"] = (existing["content"] + content) if append else content
        return "نوشته شد در " + normalized

    def cat(self, path: str) -> str:
        node = self.resolve_node(path)
        if node is None:
            return "چنین فایلی نیست: " + self.normalize(path)
        if node["type"] != "file":
            return "این پوشه است نه فایل: " + self.normalize(path)
        return node["content"] if node["content"] else "(خالی)"

    def ls(self, path: str) -> str:
        node = self.resolve_node(path)
        if node is None:
            return "چنین مسیری نیست: " + self.normalize(path)
        if node["type"] == "file":
            return self.normalize(path)
        children = node["children"]
        if not children:
            return "(پوشه خالی است)"
        lines: List[str] = []
        for name in sorted(children):
            child = children[name]
            suffix = "/" if child["type"] == "dir" else ""
            detail = ""
            if child["type"] == "file":
                detail = ui.dim("  [" + child["mode"] + "]")
            lines.append("  " + name + suffix + detail)
        return "\n".join(lines)

    def cd(self, path: str) -> str:
        normalized = self.normalize(path if path else HOME)
        node = self.resolve_node(normalized)
        if node is None or node["type"] != "dir":
            return "پوشه نیست: " + normalized
        self.cwd = normalized
        return ""

    def rm(self, path: str, recursive: bool = False) -> str:
        normalized = self.normalize(path)
        if normalized == "/":
            return "ریشه را نمی‌شود حذف کرد."
        node = self.resolve_node(normalized)
        if node is None:
            return "چیزی برای حذف نیست: " + normalized
        if node["type"] == "dir" and node["children"] and not recursive:
            return "پوشه خالی نیست — با -r حذفش کن: rm -r " + normalized
        parent, name = self._split_parent(normalized)
        if parent is None or name is None:
            return "حذف ممکن نشد."
        del parent["children"][name]
        return "حذف شد: " + normalized

    def _copy_node(self, node: Node) -> Node:
        if node["type"] == "file":
            return _new_file(node["content"], node["mode"])
        return _new_dir({name: self._copy_node(child) for name, child in node["children"].items()})

    def cp(self, source: str, dest: str) -> str:
        src_node = self.resolve_node(source)
        if src_node is None:
            return "مبدأ پیدا نشد: " + self.normalize(source)
        dest_normalized = self.normalize(dest)
        dest_node = self.resolve_node(dest_normalized)
        if dest_node is not None and dest_node["type"] == "dir":
            final_parent = dest_node
            final_name = self.normalize(source).strip("/").split("/")[-1]
        else:
            parent, name = self._split_parent(dest_normalized)
            if parent is None or name is None:
                return "مقصد نامعتبر است: " + dest_normalized
            final_parent = parent
            final_name = name
        if self._bump_limit():
            return "ظرفیت آزمایشگاه پر شد."
        final_parent["children"][final_name] = self._copy_node(src_node)
        if dest_node is not None and dest_node["type"] == "dir":
            final_path = dest_normalized.rstrip("/") + "/" + final_name
        else:
            final_path = dest_normalized
        return "کپی شد به " + self.normalize(final_path)

    def mv(self, source: str, dest: str) -> str:
        copied = self.cp(source, dest)
        if "کپی شد" not in copied:
            return copied
        removed = self.rm(source, recursive=True)
        if "حذف شد" not in removed:
            return "جابه‌جایی ناتمام شد: " + removed
        return "جابه‌جا شد: " + self.normalize(source) + " → " + dest

    def chmod(self, mode: str, path: str) -> str:
        if not re.fullmatch(r"[0-7]{3,4}", mode):
            return "قالب مجوز عددی درست نیست: " + mode + " (مثال: 600 یا 644)"
        node = self.resolve_node(path)
        if node is None:
            return "فایل پیدا نشد: " + self.normalize(path)
        if node["type"] != "file":
            return "chmod فقط برای فایل‌هاست: " + self.normalize(path)
        node["mode"] = mode
        return "مجوز " + mode + " روی " + self.normalize(path) + " ثبت شد"

    def walk(self, path: str) -> List[Tuple[str, Node]]:
        results: List[Tuple[str, Node]] = []
        base = self.resolve_node(path)
        if base is None:
            return results
        base_normalized = self.normalize(path)
        results.append((base_normalized, base))
        if base["type"] == "dir":
            for name, child in base["children"].items():
                child_path = (base_normalized.rstrip("/") + "/" + name) if base_normalized != "/" else "/" + name
                sub = self.walk(child_path)
                results.extend(sub)
        return results

    def find(self, path: str, pattern: str) -> str:
        matches: List[str] = []
        for node_path, node in self.walk(path):
            name = node_path.rstrip("/").split("/")[-1] or "/"
            if fnmatch.fnmatch(name, pattern):
                suffix = "/" if node["type"] == "dir" else ""
                matches.append(node_path + suffix)
        return "\n".join(sorted(matches)) if matches else "(چیزی پیدا نشد)"

    def grep(self, pattern: str, path: str) -> str:
        lines: List[str] = []
        for node_path, node in self.walk(path):
            if node["type"] != "file":
                continue
            for number, line in enumerate(node["content"].splitlines(), start=1):
                if re.search(pattern, line):
                    lines.append(node_path + ":" + str(number) + ": " + line)
        return "\n".join(lines) if lines else "(موردی پیدا نشد)"


# --------------------------------------------------------------------------
# مأموریت‌ها — هدف بر اساس وضعیت فایل‌سیستم بررسی می‌شود
# --------------------------------------------------------------------------
def _node_at(fs: SandboxFS, path: str) -> Optional[Node]:
    return fs.resolve_node(path)


def _is_file(fs: SandboxFS, path: str) -> bool:
    node = _node_at(fs, path)
    return bool(node and node["type"] == "file")


def _content_of(fs: SandboxFS, path: str) -> str:
    node = _node_at(fs, path)
    return str(node["content"]) if node and node["type"] == "file" else ""


MISSIONS: List[Dict[str, Any]] = [
    {
        "id": "m1",
        "title_fa": "اولین فایل متنی",
        "brief_fa": "پوشهٔ projects بساز و داخلش فایل readme.txt را با echo بساز (echo matn > masir).",
        "xp": 30,
        "goal": lambda fs: _is_file(fs, HOME + "/projects/readme.txt") and _content_of(fs, HOME + "/projects/readme.txt").strip() != "",
        "goal_fa": "فایل /home/pengo/projects/readme.txt با متن غیرخالی",
    },
    {
        "id": "m2",
        "title_fa": "پشتیبان‌گیری با cp",
        "brief_fa": "پوشهٔ backup بساز و welcome.txt را داخلش کپی کن.",
        "xp": 30,
        "goal": lambda fs: _is_file(fs, HOME + "/backup/welcome.txt")
        and _content_of(fs, HOME + "/backup/welcome.txt") == _content_of(fs, HOME + "/welcome.txt"),
        "goal_fa": "کپی هم‌محتوای welcome.txt در /home/pengo/backup/",
    },
    {
        "id": "m3",
        "title_fa": "تغییر نام با mv",
        "brief_fa": "فایل readme.txt داخل projects را با mv به intro.txt تغییر نام بده.",
        "xp": 30,
        "goal": lambda fs: _is_file(fs, HOME + "/projects/intro.txt") and not _is_file(fs, HOME + "/projects/readme.txt"),
        "goal_fa": "intro.txt هست و readme.txt نیست",
    },
    {
        "id": "m4",
        "title_fa": "مجوز خصوصی با chmod",
        "brief_fa": "مجوز intro.txt را با chmod به 600 تغییر بده (فقط مالک).",
        "xp": 35,
        "goal": lambda fs: ((_node_at(fs, HOME + "/projects/intro.txt") or {}).get("mode", "") == "600"),
        "goal_fa": "mode فایل intro.txt برابر 600",
    },
    {
        "id": "m5",
        "title_fa": "جستجو با grep",
        "brief_fa": "فایل log.txt در projects بساز که کلمه sanjab در آن باشد (مثلا با echo >).",
        "xp": 30,
        "goal": lambda fs: "sanjab" in _content_of(fs, HOME + "/projects/log.txt"),
        "goal_fa": "فایل /home/pengo/projects/log.txt شامل sanjab",
    },
    {
        "id": "m6",
        "title_fa": "نظم با find",
        "brief_fa": "پوشهٔ notes را پر کن: todo.txt بساز، بعد با find . -name \"*.txt\" فایل‌های متنی را پیدا کن.",
        "xp": 30,
        "goal": lambda fs: _is_file(fs, HOME + "/notes/todo.txt"),
        "goal_fa": "فایل /home/pengo/notes/todo.txt",
    },
]

MISSION_XP_EVENT = "lab:mission:"


class LabSession:
    """یک نشست آزمایشگاه: فایل‌سیستم + مأموریت‌ها."""

    def __init__(self) -> None:
        self.fs = SandboxFS()

    # ---------------- مأموریت‌ها ----------------
    def mission_status(self) -> None:
        from . import gamification

        state = gamification.load_state()
        events = state.get("events", {})
        print(ui.head("مأموریت‌های آزمایشگاه (XP با اقدام درون‌حافظه‌ای امن)"))
        print(ui.hr())
        for mission in MISSIONS:
            done = (MISSION_XP_EVENT + str(mission["id"])) in events
            marker = ui.ok("[done]") if done else ui.dim("[....]")
            print("  " + str(mission["id"]) + " " + marker + " " + str(mission["title_fa"]))
            if not done:
                print(ui.dim("      هدف: " + str(mission["goal_fa"])))
        print(ui.dim("  وضعیت مأموریت‌ها بعد از هر فرمان بررسی می‌شود."))

    def check_missions(self) -> None:
        from . import gamification

        state = gamification.load_state()
        events = state.get("events", {})
        for mission in MISSIONS:
            event_id = MISSION_XP_EVENT + str(mission["id"])
            if event_id in events:
                continue
            try:
                completed = bool(mission["goal"](self.fs))
            except Exception:
                completed = False
            if completed:
                print(ui.head("مأموریت کامل شد: " + str(mission["title_fa"])))
                result = gamification.add_xp(int(mission["xp"]), "مأموریت آزمایشگاه: " + str(mission["title_fa"]), event_id)
                ui.print_gain(result)

    # ---------------- پوسته ----------------
    def execute(self, line: str) -> str:
        text = ui.to_latin(line.strip())
        if not text:
            return ""
        if ">" in text:
            return self._exec_echo(text)
        tokens = text.split()
        command = tokens[0]
        args = tokens[1:]
        if command in ("exit", "quit", "khoroj"):
            return "__exit__"
        if command == "help":
            return self._help()
        if command == "pwd":
            return self.fs.cwd
        if command == "ls":
            return self.fs.ls(args[0] if args else self.fs.cwd)
        if command == "cd":
            return self.fs.cd(args[0] if args else HOME)
        if command == "mkdir":
            return self.fs.mkdir(args[-1] if args else "", parents="-p" in args)
        if command == "touch":
            return self.fs.touch(args[0]) if args else "نام فایل لازم است."
        if command == "cat":
            return self.fs.cat(args[0]) if args else "نام فایل لازم است."
        if command == "rm":
            if not args:
                return "نام لازم است."
            return self.fs.rm(args[-1], recursive=("-r" in args or "-rf" in args or "-fr" in args))
        if command == "cp":
            if len(args) < 2:
                return "الگو: cp source dest"
            return self.fs.cp(args[0], args[1])
        if command == "mv":
            if len(args) < 2:
                return "الگو: mv source dest"
            return self.fs.mv(args[0], args[1])
        if command == "chmod":
            if len(args) < 2:
                return "الگو: chmod 600 file"
            return self.fs.chmod(args[0], args[1])
        if command == "find":
            return self._exec_find(args)
        if command == "grep":
            if len(args) < 2:
                return "الگو: grep pattern file"
            return self.fs.grep(args[0], args[1])
        if command == "mission":
            return "__mission__"
        if command == "missions":
            return "__mission__"
        return "دستور شناخته نشده: " + command + " — help را ببین."

    def _exec_echo(self, text: str) -> str:
        append = ">>" in text
        if ">" not in text:
            return text.replace("echo", "", 1).strip().strip('"') or ""
        before, after = (text.split(">>", 1) if append else text.split(">", 1))
        body = before.split(None, 1)
        content = body[1].strip().strip('"') if len(body) > 1 else ""
        target = after.strip()
        if not target:
            return "الگو: echo matn > file"
        return self.fs.write_file(target, content + "\n", append=append)

    def _exec_find(self, args: List[str]) -> str:
        start = "."
        pattern = "*"
        index = 0
        while index < len(args):
            token = args[index]
            if token == "-name" and index + 1 < len(args):
                pattern = args[index + 1].strip("\"'")
                index += 2
                continue
            if not token.startswith("-"):
                start = token
            index += 1
        return self.fs.find(start, pattern)

    def _help(self) -> str:
        rows = [
            ("pwd", "مسیر فعلی"),
            ("ls [مسیر]", "فهرست پوشه"),
            ("cd [مسیر]", "تغییر پوشه"),
            ("mkdir [-p] مسیر", "ساخت پوشه"),
            ("touch فایل", "ساخت فایل خالی"),
            ("cp مبدأ مقصد", "کپی — پوشه هم بازگشتی کپی می‌شود"),
            ("mv مبدأ مقصد", "جابه‌جایی/تغییر نام"),
            ("rm [-r] مسیر", "حذف (پوشهٔ پر با -r)"),
            ("cat فایل", "نمایش فایل"),
            ("echo متن > فایل", "نوشتن (>> برای افزودن)"),
            ("chmod 600 فایل", "مجوز عددی"),
            ("find مسیر -name الگو", "پیدا کردن"),
            ("grep الگو فایل", "جستجو در متن"),
            ("mission / missions", "وضعیت مأموریت‌ها"),
            ("help", "همین راهنما"),
            ("exit", "خروج از آزمایشگاه"),
        ]
        return "\n".join("  " + cmd.ljust(26) + ui.dim(desc) for cmd, desc in rows)

    def prompt(self) -> str:
        return ui.dim("pengo@sanjab:" + self.fs.cwd + "$ ")

    def repl(self) -> None:
        print(ui.info(LABEL))
        print(ui.dim("help را ببین؛ مأموریت‌ها: mission"))
        while True:
            line = ui.safe_input(self.prompt())
            if line is None:
                print()
                print(ui.dim("پایان نشست آزمایشگاه (EOF)."))
                return
            result = self.execute(line)
            if result == "__exit__":
                print(ui.dim("خروج از آزمایشگاه — همه‌چیز درون‌حافظه‌ای پاک می‌شود."))
                return
            if result == "__mission__":
                self.mission_status()
                continue
            if result:
                print(result)
            self.check_missions()


def cmd_terminal(args: Any = None) -> int:
    print(ui.head("آزمایشگاه لینوکس سان‌جاب — vlab"))
    session = LabSession()
    session.repl()
    return 0


def run() -> None:
    """نقطهٔ ورود منوی تعاملی."""
    cmd_terminal(None)
