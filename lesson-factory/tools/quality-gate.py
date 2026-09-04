#!/usr/bin/env python3
"""
lesson-factory quality gate.

Measures one or more Electric Ink player lessons against the lesson-factory
quality contract: chassis integrity, NEETS-density writing, richness floors,
style rules, and sameness across sibling lessons. The contract numbers live
in CONFIG below and in QUALITY-BAR.md. Only Nick changes them.

Usage (from anywhere, python3, no dependencies):
    python3 quality-gate.py path/to/NN-slug.html
    python3 quality-gate.py --course path/to/lessons-folder
    python3 quality-gate.py --course path/to/lessons-folder --table
    python3 quality-gate.py lesson.html --prose        # show offending sentences
    python3 quality-gate.py lesson.html --json
    python3 quality-gate.py gold.html --emit-gold gold-metrics.json

Exit code: non-zero if any FAIL. A lesson with a FAIL is not shippable.
A green run is the floor, not the finish: Nick's render-and-look audit
still decides taste.
"""
import os
import re
import sys
import json
import argparse

EMDASH = chr(0x2014)   # banned character, built via chr() so this file stays clean
ENDASH = chr(0x2013)

# ---------------------------------------------------------------------------
# CONFIG: the quality contract. Nick edits these numbers, nobody else.
# QUALITY-BAR.md explains each one. Calibrated 2026-08-30 against caet-dc:
# the gold Resistance file passes with known-dent warns; the four thinner
# clones fail on the exact axes Nick flagged (prose depth, figures, photos).
# ---------------------------------------------------------------------------
CONFIG = {
    "teach": {
        # -- writing (NEETS manual density; his standing correction) --
        "words_fail":         1800,   # visible words below this: FAIL (thin lesson)
        "words_warn":         2400,   # below this: WARN (under NEETS target band 2400-3600)
        "frag_rate_warn":     0.22,   # share of prose sentences with <= 3 words
        "frag_rate_fail":     0.30,   # magazine punch-fragment writing
                                      # (the book's short definition lines are legitimate,
                                      #  so only an egregious rate trips this)
        "sent_len_lo":        9.0,    # avg words per sentence, tight-manual band
        "sent_len_hi":        24.0,
        "numbered_steps_min": 1,      # at least one numbered procedure (his book style)
        "walked_units_warn":  6,      # numeric+unit tokens in prose (walked numbers)
        "exclaim_warn":       6,
        # -- richness (Resistance is the craft bar) --
        "svg_per_min_fail":   0.35,
        "svg_per_min_warn":   0.50,
        "img_fail":           0,      # img count must be strictly greater than this
        "img_warn":           2,      # fewer than this: WARN (physical-parts days need photos)
        "ready_fail":         3,      # distinct __inkGate.ready call sites, fewer: FAIL
        "ready_warn":         4,
        "gated_fail":         4,      # data-need gated beats
        "interaction_warn":   2,      # AeroLesson.interaction posts
        "js_kb_per_min_warn": 1.5,
        # -- checkpoint --
        "items_fail":         5,      # checkpoint items, fewer: FAIL
        "feedback_chars":     50,     # a per-item teaching line is at least this long
        # -- sameness --
        "jaccard_fail":       0.30,   # 8-gram overlap with a sibling: same lesson reskinned
        "jaccard_warn":       0.20,
    },
    "check": {                        # course-check profile: assessment, not a teach day
        "items_fail":         10,
        "feedback_chars":     50,
        "gated_fail":         1,
    },
}

# Phrases that fail a lesson outright (voice lock + house rules).
BANNED = [
    "hold onto this", "prove it.", "the stakes", "stack cooks",
    "that is this lesson", "every wire fights", "take it with you",
    "award-winning", "delve", "tapestry", "i sat down with",
    "in today's fast-paced world", "navigate the complexities",
    "it's important to note", "testament to", "in the realm of",
    "real physics, not a cartoon",
]
# Watch-list: not fatal, but they read like magazine AI, not a training manual.
WATCH = ["journey", "dive into", "unpack", "we'll explore", "elegant", "beautiful"]

# Resistance-only internals. Found in any other teach lesson: cloned content.
RESISTANCE_ONLY = ["rho", "lattice", "colorband", "color band", "band 3", "gold band", "decoder"]

# Skills and sources that must never be loaded for an Electric Ink lesson.
# The reason for each is in SKILLS-POLICY.md. Names, not vibes: a model matches on names.
BLOCKLIST = [
    "training-architect", "project-intake", "reference-builder",
    "narrative-training-module-builder", "cardcraft-builder",
    "visual-learning-builder", "device-trainer-builder", "aero-course-stylist",
    "storybrand-framework", "copywriting-formulas",
    "ace-html-training-factory-audit", "merrill-mapping",
    "nickdesktop", "genesis", "hangar.html", "lesson-shell.html",
    "question-to-lo map", "gmetrix", "certification workbook",
]
# Loaded only when the signed spec's centerpiece calls for it.
ASK_LIST = [
    "caet-player-editor", "circuit-simulator-builder", "oscilloscope-viewer-builder",
    "hyperframes", "aero-slide-video-builder", "aero-course-inspector",
    "aero-course-player-builder", "aero-export-packager",
]
DECL_HEADING = "## Skills and files loaded"

ALLOWED_HOSTS = ("fonts.googleapis.com", "fonts.gstatic.com")

UNIT_RE = re.compile(
    r"\b\d+(?:\.\d+)?\s?(?:v|volts?|a|amps?|amperes?|ohms?|ma|mv|kv|w|watts?|hz|kohm|"
    r"kΩ|Ω|kw)\b", re.I)


# ---------------------------------------------------------------------------
# extraction helpers
# ---------------------------------------------------------------------------

def visible_text(html):
    t = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    t = re.sub(r"<style[\s\S]*?</style>", " ", t, flags=re.I)
    t = re.sub(r"</(p|li|h\d|div|section|figcaption|td|blockquote)>", "\n", t, flags=re.I)
    t = re.sub(r"<br[^>]*>", "\n", t, flags=re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"&nbsp;", " ", t)
    t = re.sub(r"&amp;", "&", t)
    return t


def prose_lines(text):
    """Lines long enough to be teaching prose, not UI labels."""
    out = []
    for line in text.split("\n"):
        line = re.sub(r"\s+", " ", line).strip()
        if len(line) >= 60:
            out.append(line)
    return out


def sentences(lines):
    sents = []
    for line in lines:
        for s in re.split(r"(?<=[.!?])\s+", line):
            s = s.strip()
            if s and re.search(r"[a-zA-Z]", s):
                sents.append(s)
    return sents


def extract_block(html, start_pat):
    """Return the bracket-matched [...] or {...} block that starts at start_pat."""
    m = re.search(start_pat, html)
    if not m:
        return None
    i = m.end() - 1
    opener = html[i]
    closer = {"[": "]", "{": "}"}[opener]
    depth, j = 0, i
    in_str, esc, quote = False, False, ""
    while j < len(html):
        c = html[j]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == quote:
                in_str = False
        else:
            if c in "'\"`":
                in_str, quote = True, c
            elif c == opener:
                depth += 1
            elif c == closer:
                depth -= 1
                if depth == 0:
                    return html[i:j + 1]
        j += 1
    return None


def count_items(block):
    """Count top-level objects in an ITEMS=[...] block."""
    if not block:
        return 0
    depth, n = 0, 0
    in_str, esc, quote = False, False, ""
    for c in block:
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == quote:
                in_str = False
            continue
        if c in "'\"`":
            in_str, quote = True, c
        elif c == "{":
            depth += 1
            if depth == 1:
                n += 1
        elif c == "}":
            depth -= 1
    return n


def teaching_strings(block, floor):
    if not block:
        return 0
    hits = 0
    for m in re.finditer(r"([\"'])((?:\\.|(?!\1).)*)\1", block):
        s = m.group(2)
        if len(s) >= floor and re.search(r"[a-zA-Z].*\s.*[a-zA-Z]", s):
            hits += 1
    return hits


def split_objects(block):
    """Split a JS array literal into its top-level {...} object strings."""
    out, depth, start = [], 0, None
    in_str, esc, quote = False, False, ""
    for i, c in enumerate(block or ""):
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == quote:
                in_str = False
            continue
        if c in "'\"`":
            in_str, quote = True, c
        elif c == "{":
            if depth == 0:
                start = i
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0 and start is not None:
                out.append(block[start:i + 1])
                start = None
    return out


def _strings_in(sub):
    return [m.group(2) for m in re.finditer(r"([\"'])((?:\\.|(?!\1).)*)\1", sub or "")]


def parse_items(block):
    """Turn an ITEMS=[...] literal into dicts. Tolerant of unquoted JS keys."""
    items = []
    for obj in split_objects(block):
        stem = re.search(r"stem\s*:\s*([\"'])((?:\\.|(?!\1).)*)\1", obj)
        lo = re.search(r"\blo\s*:\s*[\"']?([^,\"'}]+)", obj)
        ans = re.search(r"\bans\s*:\s*(\d+)", obj)
        opts_block = extract_block(obj, r"opts\s*:\s*(\[)")
        miss_block = extract_block(obj, r"miss\s*:\s*(\[)")
        items.append({
            "stem": stem.group(2) if stem else "",
            "lo": (lo.group(1).strip() if lo else ""),
            "ans": int(ans.group(1)) if ans else None,
            "opts": _strings_in(opts_block),
            "miss": _strings_in(miss_block),
        })
    return items


def claimed_lo_count(path):
    """How many objectives this lesson says it owns, from course.json."""
    d = os.path.dirname(os.path.abspath(path))
    for up in (os.path.join(d, ".."), d):
        cj = os.path.join(up, "course.json")
        if os.path.exists(cj):
            try:
                data = json.load(open(cj, encoding="utf-8"))
                for les in data.get("lessons", []):
                    if les.get("src") == os.path.basename(path):
                        return len(les.get("objectives", []) or [])
            except Exception:
                pass
    return None


def read_declaration(path):
    """Return (found, declared_text) from the lesson's companion notes file."""
    notes = os.path.join(os.path.dirname(path),
                         os.path.splitext(os.path.basename(path))[0] + "-notes.md")
    if not os.path.exists(notes):
        return None, ""
    txt = open(notes, encoding="utf-8", errors="replace").read()
    i = txt.lower().find(DECL_HEADING.lower())
    if i < 0:
        return False, ""
    rest = txt[i + len(DECL_HEADING):]
    nxt = re.search(r"\n##\s", rest)
    return True, (rest[:nxt.start()] if nxt else rest)


def conflict_twins(folder):
    """OneDrive sync duplicates sitting next to the files they shadow."""
    hits = []
    for n in sorted(os.listdir(folder)) if os.path.isdir(folder) else []:
        if re.search(r"-NickDesktop[_-]?\d*", n, re.I):
            hits.append(n)
    return hits


def shingles(words, n=8):
    return {" ".join(words[i:i + n]) for i in range(max(0, len(words) - n + 1))}


# ---------------------------------------------------------------------------
# measurement
# ---------------------------------------------------------------------------

def measure(path):
    html = open(path, encoding="utf-8", errors="replace").read()
    name = os.path.basename(path)
    text = visible_text(html)
    words = re.findall(r"[A-Za-z0-9'&/.-]+", text)
    plines = prose_lines(text)
    sents = sentences(plines)
    frags = [s for s in sents if len(s.split()) <= 3]
    scripts = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)</script>", html, flags=re.I)
    js = "".join(scripts)
    items_block = extract_block(html, r"ITEMS\s*=\s*(\[)")
    beats = re.findall(r'data-beat="([^"]*)"', html)
    clears = [c for c in re.findall(r'data-clear="([^"]+)"', html) if "+" not in c]
    m = {
        "file": name,
        "html": html,
        "text": text,
        "words": len(words),
        "word_list": [w.lower() for w in words],
        "prose_words": sum(len(l.split()) for l in plines),
        "sents": sents,
        "frags": frags,
        "frag_rate": (len(frags) / len(sents)) if sents else 0.0,
        "avg_sent": (sum(len(s.split()) for s in sents) / len(sents)) if sents else 0.0,
        "exclaims": text.count("!"),
        "svg": len(re.findall(r"<svg", html, flags=re.I)),
        "img": len(re.findall(r"<img", html, flags=re.I)),
        "canvas": len(re.findall(r"<canvas", html, flags=re.I)),
        "js_kb": len(js) / 1024.0,
        "beats": beats,
        "clears": sorted(set(clears)),
        "gated": len(re.findall(r"data-need", html)),
        "ready": len(re.findall(r"__inkGate\.ready", html)),
        "interaction": len(re.findall(r"AeroLesson\.interaction", html)),
        "ol": len(re.findall(r"<ol\b", html, flags=re.I)),
        "numbered": len(re.findall(r"(?:^|\n)\s*\d+[.)]\s+\S", text)),
        "walked": len(UNIT_RE.findall(" ".join(plines))),
        "items": count_items(items_block),
        "teach_strings": teaching_strings(items_block, 50),
        "pass_n": (re.search(r"PASS_N\s*=\s*(\d+)", html) or [None]) and
                  (re.search(r"PASS_N\s*=\s*(\d+)", html).group(1)
                   if re.search(r"PASS_N\s*=\s*(\d+)", html) else None),
    }
    return m


def lesson_minutes(path, minutes_flag):
    if minutes_flag:
        return minutes_flag, "from --minutes"
    d = os.path.dirname(os.path.abspath(path))
    for up in (os.path.join(d, ".."), d):
        cj = os.path.join(up, "course.json")
        if os.path.exists(cj):
            try:
                data = json.load(open(cj, encoding="utf-8"))
                for les in data.get("lessons", []):
                    if les.get("src") == os.path.basename(path):
                        return les.get("minutes", 20), "from course.json"
            except Exception:
                pass
    return 20, "default"


def profile_for(path, flag):
    if flag:
        return flag
    return "check" if "course-check" in os.path.basename(path).lower() else "teach"


# ---------------------------------------------------------------------------
# the gate
# ---------------------------------------------------------------------------

def run_gate(path, minutes_flag=None, profile_flag=None, legacy=False):
    m = measure(path)
    minutes, msrc = lesson_minutes(path, minutes_flag)
    prof = profile_for(path, profile_flag)
    C = CONFIG[prof]
    html, text, low = m["html"], m["text"], m["text"].lower()
    name = m["file"]
    fails, warns, infos = [], [], []

    # ---- chassis integrity ----
    if 'id="ldock"' not in html:
        fails.append("chassis: #ldock missing")
    if "__inkGate" not in html:
        fails.append("chassis: __inkGate missing (gate engine wiped)")
    if len(re.findall(r'class="gatebar"', html)) < 2:
        fails.append("chassis: gatebars missing")
    if prof == "teach" and 'id="check"' not in html:
        fails.append("chassis: #check section missing")
    if "Mark lesson complete" not in html:
        fails.append("chassis: field-card complete control missing")
    if "HINTS" not in html:
        fails.append("chassis: HINTS map missing (dock hints dead)")
    for need in ("AeroLesson.ready", "AeroLesson.score", "AeroLesson.complete", "AeroLesson.onInit"):
        if need not in html:
            fails.append("chassis: %s not wired (player bridge broken)" % need)
    for c in m["clears"]:
        if ("gateNote-%s" % c) not in html:
            warns.append("chassis: no gateNote for beat id '%s'" % c)
    for tok, label in ((r"SWAP_", "SWAP_ stencil token"), (r"\bTODO\b", "TODO"),
                      (r"\blorem\b", "lorem placeholder")):
        n = len(re.findall(tok, html))
        if n:
            fails.append("placeholder: %s x%d still in file" % (label, n))
    if m["gated"] < C.get("gated_fail", 1):
        fails.append("gates: only %d gated beats (floor %d)" % (m["gated"], C["gated_fail"]))
    if re.search(r"function\s+ready[\s\S]{0,400}scrollIntoView", html) or \
       re.search(r"ready\([\s\S]{0,200}scrollIntoView", html):
        warns.append("stay-put: scrollIntoView near ready() (locked rule: do not scroll on ready)")

    # ---- style floor (absorbed from tools/validate.py) ----
    MDASH_ENT = "&" + "mdash;"   # built by concatenation so validators
    NDASH_ENT = "&" + "ndash;"   # never count this file's own detector strings
    for count, label in ((html.count(EMDASH), "em-dashes"),
                         (html.count(MDASH_ENT), "banned dash entities"),
                         (html.count(NDASH_ENT), "banned dash entities")):
        if count:
            fails.append("style: %s x%d (rule #1)" % (label, count))
    if re.search(r"(?<!min-)height\s*:\s*100vh", html, flags=re.I):
        fails.append("style: height:100vh on a container (use min-height)")
    hosts = set(re.findall(r'(?:src|href)\s*=\s*["\']https?://([^/"\']+)', html, flags=re.I))
    for h in hosts:
        if not any(h.endswith(a) for a in ALLOWED_HOSTS):
            infos.append("external host: %s (photos are the only allowed exception)" % h)
    if re.search(r"-v\d+\b", name, flags=re.I):
        fails.append("style: version number in filename")
    if "@keyframes" in html and "prefers-reduced-motion" not in html:
        warns.append("style: @keyframes with no prefers-reduced-motion block")
    if ("<button" in low) and ("focus-visible" not in low and ":focus" not in low):
        warns.append("style: interactive but no :focus styles")
    notes = os.path.join(os.path.dirname(path), os.path.splitext(name)[0] + "-notes.md")
    if not os.path.exists(notes):
        warns.append("companion -notes.md missing")
    spec = os.path.join(os.path.dirname(path), os.path.splitext(name)[0] + "-spec.md")
    if not os.path.exists(spec):
        (warns if legacy else fails).append("lesson spec (%s) missing" % os.path.basename(spec))
    for phrase in BANNED:
        n = low.count(phrase)
        if n:
            fails.append('voice: banned phrase "%s" x%d' % (phrase, n))
    for phrase in WATCH:
        n = len(re.findall(r"\b%s\b" % re.escape(phrase), low))
        if n:
            warns.append('voice: watch-list phrase "%s" x%d (manual, not magazine)' % (phrase, n))
    # local asset references must exist
    base = os.path.dirname(os.path.abspath(path))
    for ref in re.findall(r'(?:src|href)\s*=\s*["\']([^"\':]+?\.(?:jpg|jpeg|png|gif|webp|mp3|mp4|js|css))["\']',
                          html, flags=re.I):
        if ref.startswith(("http", "data:", "//", "#")):
            continue
        if not os.path.exists(os.path.normpath(os.path.join(base, ref))):
            fails.append("asset missing on disk: %s" % ref)

    # ---- writing (teach profile) ----
    if prof == "teach":
        if m["words"] < C["words_fail"]:
            fails.append("writing: %d visible words (floor %d; NEETS target %d+)" %
                         (m["words"], C["words_fail"], C["words_warn"]))
        elif m["words"] < C["words_warn"]:
            warns.append("writing: %d visible words, under the NEETS target band (%d+)" %
                         (m["words"], C["words_warn"]))
        if m["frag_rate"] > C["frag_rate_fail"]:
            fails.append("writing: %.0f%% of sentences are punch fragments (<= 3 words)" %
                         (100 * m["frag_rate"]))
        elif m["frag_rate"] > C["frag_rate_warn"]:
            warns.append("writing: %.0f%% punch fragments (manual voice is complete sentences)" %
                         (100 * m["frag_rate"]))
        if m["sents"]:
            infos.append("writing: avg sentence %.1f words, %.0f%% short lines" %
                         (m["avg_sent"], 100 * m["frag_rate"]))
        if m["ol"] + (1 if m["numbered"] >= 3 else 0) < C["numbered_steps_min"]:
            fails.append("writing: no numbered procedure (the book teaches with numbered how-tos)")
        if m["walked"] < C["walked_units_warn"]:
            warns.append("writing: only %d numeric-with-unit tokens in prose (walk the numbers)" %
                         m["walked"])
        if m["exclaims"] > C["exclaim_warn"]:
            warns.append("writing: %d exclamation marks (manuals state, they do not cheer)" %
                         m["exclaims"])

    # ---- richness (teach profile) ----
    if prof == "teach":
        spm = m["svg"] / minutes
        if spm < C["svg_per_min_fail"]:
            fails.append("figures: %d SVG for %d min (%.2f/min; floor %.2f, gold 0.50)" %
                         (m["svg"], minutes, spm, C["svg_per_min_fail"]))
        elif spm < C["svg_per_min_warn"]:
            warns.append("figures: %.2f SVG/min, under the gold bar (0.50)" % spm)
        if m["img"] <= C["img_fail"]:
            fails.append("photos: zero real photographs (recognition needs the real part)")
        elif m["img"] < C["img_warn"]:
            warns.append("photos: only %d photograph(s)" % m["img"])
        if m["ready"] < C["ready_fail"]:
            fails.append("interactivity: %d __inkGate.ready sites (floor %d, gold 6)" %
                         (m["ready"], C["ready_fail"]))
        elif m["ready"] < C["ready_warn"]:
            warns.append("interactivity: %d ready sites (gold 6)" % m["ready"])
        if m["interaction"] < C["interaction_warn"]:
            warns.append("tracking: %d AeroLesson.interaction posts (gold 3)" % m["interaction"])
        jspm = m["js_kb"] / minutes
        if jspm < C["js_kb_per_min_warn"]:
            warns.append("interactivity: %.1f KB bespoke JS/min (gold 2.4)" % jspm)

    # ---- checkpoint ----
    if m["items"] < C["items_fail"]:
        fails.append("checkpoint: %d ITEMS (floor %d)" % (m["items"], C["items_fail"]))
    if m["items"] and m["teach_strings"] < m["items"]:
        warns.append("checkpoint: %d teaching strings for %d items (every option teaches)" %
                     (m["teach_strings"], m["items"]))
    if m["pass_n"]:
        infos.append("checkpoint pass bar: %s of %d" % (m["pass_n"], m["items"]))

    # ---- skills discipline (SKILLS-POLICY.md) ----
    found_decl, declared = read_declaration(path)
    if found_decl is None:
        pass                       # notes file missing is already reported above
    elif found_decl is False:
        (warns if legacy else fails).append(
            'skills: notes file has no "%s" section (required declaration)' % DECL_HEADING)
    else:
        low_decl = declared.lower()
        for bad in BLOCKLIST:
            if bad in low_decl:
                fails.append('skills: blocklisted source "%s" declared as loaded '
                             "(see SKILLS-POLICY.md)" % bad)
        for ask in ASK_LIST:
            if ask in low_decl:
                infos.append('skills: "%s" declared; the spec must name it as the centerpiece'
                             % ask)
        if not declared.strip():
            warns.append("skills: declaration section is empty")
    for bad in BLOCKLIST:
        if bad in low and bad not in ("genesis", "merrill-mapping", "nickdesktop"):
            fails.append('skills: blocklisted source "%s" referenced inside the lesson' % bad)
    twins = conflict_twins(os.path.dirname(os.path.abspath(path)))
    if twins:
        fails.append("contamination: OneDrive conflict copies beside this lesson: %s"
                     % ", ".join(twins[:4]))

    # ---- checkpoint item writing (assessment/ASSESSMENT.md) ----
    parsed = parse_items(extract_block(html, r"ITEMS\s*=\s*(\[)"))
    if parsed:
        longest_correct, positions = 0, {}
        for n, it in enumerate(parsed, 1):
            stem, opts, miss, ans = it["stem"], it["opts"], it["miss"], it["ans"]
            tag = "item %d" % n
            if opts and miss and len(miss) != len(opts):
                fails.append("checkpoint: %s has %d options but %d feedback lines "
                             "(every option teaches)" % (tag, len(opts), len(miss)))
            if re.search(r"\b(NOT|EXCEPT)\b", stem):
                fails.append("checkpoint: %s uses a negative stem (tests reading, not knowledge)"
                             % tag)
            elif re.search(r"\bnot\b", stem, re.I):
                warns.append("checkpoint: %s stem contains 'not'; check it is not a negative stem"
                             % tag)
            for o in opts:
                if re.search(r"\b(all|none) of the above\b", o, re.I):
                    fails.append('checkpoint: %s uses "%s" (tests test-taking)' % (tag, o[:28]))
            if ans is not None and 0 <= ans < len(opts):
                positions[ans] = positions.get(ans, 0) + 1
                others = [o for i, o in enumerate(opts) if i != ans]
                if others and len(opts[ans]) > max(len(o) for o in others):
                    longest_correct += 1
                for o in others:
                    if re.search(r"\b(always|never|all|none|every)\b", o, re.I):
                        warns.append("checkpoint: %s has an absolute qualifier in a distractor "
                                     "(reads as a giveaway)" % tag)
                        break
        if len(parsed) >= 4 and longest_correct >= max(3, int(0.6 * len(parsed))):
            warns.append("checkpoint: the correct answer is the longest option in %d of %d items "
                         "(answerable without knowing the content)" % (longest_correct, len(parsed)))
        if positions:
            top, cnt = max(positions.items(), key=lambda kv: kv[1])
            if cnt == len(parsed) and len(parsed) >= 3:
                fails.append("checkpoint: the answer is in position %d on every item" % (top + 1))
            elif cnt >= len(parsed) - 1 and len(parsed) >= 4:
                warns.append("checkpoint: the answer is in position %d on %d of %d items"
                             % (top + 1, cnt, len(parsed)))
        claimed = claimed_lo_count(path)
        covered = len({it["lo"] for it in parsed if it["lo"]})
        if claimed:
            if covered == 0:
                warns.append("checkpoint: items carry no lo tags, coverage cannot be checked")
            elif covered < claimed:
                fails.append("checkpoint: %d objective(s) claimed but items cover only %d "
                             "(every objective must be tested)" % (claimed, covered))

    # ---- cloned Resistance internals ----
    if prof == "teach" and "resistance" not in name.lower():
        for tok in RESISTANCE_ONLY:
            n = len(re.findall(r"\b%s" % re.escape(tok), low))
            if n:
                fails.append('cloned content: Resistance-only "%s" x%d in this lesson' % (tok, n))

    infos.append("%d beats: %s" % (len(m["beats"]), " | ".join(m["beats"])))
    infos.append("minutes %d (%s) | %d words (%.0f/min) | svg %d | img %d | canvas %d | js %.0f KB"
                 % (minutes, msrc, m["words"], m["words"] / minutes, m["svg"], m["img"],
                    m["canvas"], m["js_kb"]))
    return m, prof, minutes, fails, warns, infos


def sameness(results, C):
    """Pairwise 8-gram overlap between teach lessons."""
    out = []
    keys = [r for r in results if r["profile"] == "teach"]
    for i in range(len(keys)):
        for j in range(i + 1, len(keys)):
            a, b = keys[i], keys[j]
            sa, sb = shingles(a["m"]["word_list"]), shingles(b["m"]["word_list"])
            if not sa or not sb:
                continue
            jac = len(sa & sb) / float(len(sa | sb))
            out.append((a["m"]["file"], b["m"]["file"], jac))
    return out


KIT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

REQUIRED_KIT_FILES = [
    "START.md", "PIPELINE.md", "QUALITY-BAR.md", "SPEC-TEMPLATE.md", "SKILLS-POLICY.md",
    "MANIFEST.md", "PROMPTS.md", "tools/quality-gate.py",
    "gold/GOLD-TEARDOWN.md", "gold/gold-metrics.json",
    "chassis/chassis.md", "chassis/beat-recipes.md", "chassis/lesson-chassis.html",
    "chassis/BEAT-TYPES.md",
    "identity/ELECTRIC-INK-LOCK.md", "identity/families.md",
    "voice/NICK-VOICE-STYLE-GUIDE.md", "voice/NICK-AET-CERT-BOOK.md", "voice/nick-aet-voice.md",
    "content/caet-lo-registry.md", "content/dc-course-router.md",
    "pedagogy/README.md", "pedagogy/04-research-foundations.md",
    "assessment/ASSESSMENT.md", "ship/SHIP.md",
]


def selfcheck():
    """Is the kit intact and uncontaminated? Answers 'how do I know it is still clean'."""
    fails, warns, oks = [], [], []
    print("kit root: %s\n" % KIT_ROOT)

    for rel in REQUIRED_KIT_FILES:
        if not os.path.exists(os.path.join(KIT_ROOT, rel)):
            fails.append("missing kit file: %s" % rel)
    if not fails:
        oks.append("all %d required kit files present" % len(REQUIRED_KIT_FILES))

    twins, blocked, dashes = [], [], []
    for dp, dns, fns in os.walk(KIT_ROOT):
        dns[:] = [d for d in dns if d not in (".git", "__pycache__")]
        for n in fns:
            rel = os.path.relpath(os.path.join(dp, n), KIT_ROOT)
            if re.search(r"-NickDesktop[_-]?\d*", n, re.I):
                twins.append(rel)
            base = n.lower()
            for name in BLOCKLIST:
                if name in base and name not in ("genesis", "nickdesktop"):
                    blocked.append("%s (matches %s)" % (rel, name))
                    break
            if n.lower().endswith((".md", ".py", ".html", ".css", ".json")):
                try:
                    t = open(os.path.join(dp, n), encoding="utf-8").read()
                except Exception:
                    continue
                c = t.count(EMDASH) + t.count(ENDASH)
                if c:
                    dashes.append("%s x%d" % (rel, c))
    if twins:
        fails.append("conflict copies inside the kit: %s" % ", ".join(twins))
    else:
        oks.append("no OneDrive conflict copies in the kit")
    if blocked:
        fails.append("blocklisted files inside the kit: %s" % ", ".join(blocked))
    else:
        oks.append("no blocklisted sources in the kit")
    if dashes:
        fails.append("banned dashes: %s" % ", ".join(dashes))
    else:
        oks.append("zero em-dashes and en-dashes across the kit")

    origins = os.path.join(KIT_ROOT, "kit-origins.json")
    if os.path.exists(origins):
        try:
            omap = json.load(open(origins, encoding="utf-8"))
        except Exception:
            omap, warns = {}, warns + ["kit-origins.json is unreadable"]
        bundle = omap.get("bundleRoot", os.path.dirname(KIT_ROOT))
        if not os.path.isabs(bundle):
            bundle = os.path.normpath(os.path.join(KIT_ROOT, bundle))
        same = drift = gone = 0
        for rel, src in sorted(omap.get("copies", {}).items()):
            kp, sp = os.path.join(KIT_ROOT, rel), os.path.join(bundle, src)
            if not os.path.exists(sp):
                gone += 1
                continue
            try:
                a = open(kp, "rb").read()
                b = open(sp, "rb").read()
            except Exception:
                gone += 1
                continue
            if a == b:
                same += 1
            else:
                drift += 1
                warns.append("drifted from its original: %s (original: %s)" % (rel, src))
        oks.append("origin check: %d identical, %d drifted, %d originals not reachable"
                   % (same, drift, gone))
    else:
        warns.append("kit-origins.json missing, cannot compare kit copies to their originals")

    for label, rows in (("FAIL", fails), ("warn", warns), ("ok", oks)):
        for r in rows:
            print("  %-4s %s" % (label, r))
    print("\n%s" % ("KIT CLEAN" if not fails else "KIT NEEDS ATTENTION (%d)" % len(fails)))
    return 1 if fails else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="*", help="lesson HTML file(s)")
    ap.add_argument("--course", help="lessons folder (or folder holding course.json)")
    ap.add_argument("--minutes", type=int)
    ap.add_argument("--profile", choices=["teach", "check"])
    ap.add_argument("--legacy", action="store_true",
                    help="grade an already-shipped lesson: a missing spec or skills "
                         "declaration warns instead of failing")
    ap.add_argument("--prose", action="store_true", help="print offending sentences")
    ap.add_argument("--table", action="store_true", help="summary table only")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--emit-gold", help="write measured metrics of the given file to this json")
    ap.add_argument("--selfcheck", action="store_true",
                    help="verify the kit itself is intact and uncontaminated")
    args = ap.parse_args()

    if args.selfcheck:
        sys.exit(selfcheck())

    paths = list(args.paths)
    if args.course:
        d = args.course
        if os.path.isdir(os.path.join(d, "lessons")):
            d = os.path.join(d, "lessons")
        paths += [os.path.join(d, n) for n in sorted(os.listdir(d))
                  if n.lower().endswith(".html")]
    if not paths:
        ap.error("give lesson HTML paths or --course")

    results, any_fail = [], 0
    for p in paths:
        m, prof, minutes, fails, warns, infos = run_gate(
            p, args.minutes, args.profile, args.legacy)
        results.append({"m": m, "profile": prof, "minutes": minutes,
                        "fails": fails, "warns": warns, "infos": infos})
        any_fail += len(fails)

    pairs = sameness(results, CONFIG["teach"]) if len(results) > 1 else []
    for a, b, jac in pairs:
        tgt = next(r for r in results if r["m"]["file"] == b)
        if jac > CONFIG["teach"]["jaccard_fail"]:
            tgt["fails"].append("sameness: %.0f%% shared 8-grams with %s (reskin)" % (jac * 100, a))
            any_fail += 1
        elif jac > CONFIG["teach"]["jaccard_warn"]:
            tgt["warns"].append("sameness: %.0f%% shared 8-grams with %s" % (jac * 100, a))

    if args.emit_gold:
        m = results[0]["m"]
        gold = {k: m[k] for k in ("file", "words", "prose_words", "frag_rate", "avg_sent",
                                  "svg", "img", "canvas", "js_kb", "gated", "ready",
                                  "interaction", "items", "walked")}
        gold["minutes"] = results[0]["minutes"]
        gold["beats"] = m["beats"]
        json.dump(gold, open(args.emit_gold, "w", encoding="utf-8"), indent=2)
        print("gold metrics written to %s" % args.emit_gold)

    if args.json:
        out = [{"file": r["m"]["file"], "profile": r["profile"], "minutes": r["minutes"],
                "fails": r["fails"], "warns": r["warns"],
                "verdict": "FAIL" if r["fails"] else ("WARN" if r["warns"] else "PASS")}
               for r in results]
        print(json.dumps(out, indent=2))
        sys.exit(1 if any_fail else 0)

    if not args.table:
        for r in results:
            v = "FAIL" if r["fails"] else ("WARN" if r["warns"] else "PASS")
            print("\n== %s  [%s, %d min]  %s ==" % (r["m"]["file"], r["profile"],
                                                    r["minutes"], v))
            for x in r["fails"]:
                print("  FAIL  " + x)
            for x in r["warns"]:
                print("  warn  " + x)
            for x in r["infos"]:
                print("  info  " + x)
            if args.prose:
                shown = 0
                for s in r["m"]["frags"]:
                    print("  frag  " + s[:90])
                    shown += 1
                    if shown >= 15:
                        break

    print("\n---- scorecard ----")
    hdr = "%-24s %5s %6s %4s %4s %6s %6s %6s  %s" % (
        "file", "min", "words", "svg", "img", "ready", "items", "fails", "verdict")
    print(hdr)
    print("-" * len(hdr))
    for r in results:
        m = r["m"]
        v = "FAIL" if r["fails"] else ("WARN" if r["warns"] else "PASS")
        print("%-24s %5d %6d %4d %4d %6d %6d %6d  %s" % (
            m["file"][:24], r["minutes"], m["words"], m["svg"], m["img"],
            m["ready"], m["items"], len(r["fails"]), v))
    if pairs:
        print("\nsameness (8-gram overlap between teach lessons):")
        for a, b, jac in sorted(pairs, key=lambda x: -x[2]):
            flag = "FAIL" if jac > CONFIG["teach"]["jaccard_fail"] else (
                "warn" if jac > CONFIG["teach"]["jaccard_warn"] else "ok  ")
            print("  %s  %-22s ~ %-22s %.0f%%" % (flag, a[:22], b[:22], jac * 100))
    sys.exit(1 if any_fail else 0)


if __name__ == "__main__":
    main()
