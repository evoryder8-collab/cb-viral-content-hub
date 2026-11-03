#!/usr/bin/env python3
"""Turn a Manus research export (CSV, columns in MANUS_BRIEF.md) into findings.json for apply_browser_findings.py.

    python3 scripts/import_manus_csv.py manus.csv --out findings.json [--min-views 10000000] [--min-likes 1000000]

Rows below the bar, without an exact post URL, or already in the hub are dropped and listed.
Numbers keep Manus as their source ("Reported by Manus on <date>") until Claude in Chrome re-reads them on the
post page: that step (MANUS_BRIEF.md, part 2) replaces the quote with what the page showed and sets evidence to high.
Scores start at 60/60: set real relatability/relevancy values before merging.
"""
import argparse
import csv
import datetime
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import import_research as IR  # noqa: E402

NICHE_WORDS = {
    "massage": "massage", "gym_pt": "gym_pt", "pt": "gym_pt", "personal training": "gym_pt", "gym": "gym_pt",
    "dexa": "dexa_biohacking", "dexa_biohacking": "dexa_biohacking", "biohacking": "dexa_biohacking",
    "ice": "icebath", "icebath": "icebath", "ice bath": "icebath", "cold plunge": "icebath",
    "photo": "photo_video", "photo_video": "photo_video", "video": "photo_video", "photography": "photo_video",
}
EXACT = re.compile(r"tiktok\.com/@[\w.]+/video/\d+|instagram\.com/(?:[\w.]+/)?(?:reel|p|tv)/[\w-]+|"
                   r"youtube\.com/(?:shorts/|watch\?v=)[\w-]{11}|youtu\.be/[\w-]{11}")


def num(x):
    if x is None:
        return None
    s = str(x).strip().replace(",", "").replace("’", "").replace("'", "").replace(" ", "")
    m = re.match(r"^([\d.]+)([KkMmBb]?)\+?$", s)
    if not m:
        return None
    return int(round(float(m.group(1)) * {"": 1, "k": 1e3, "m": 1e6, "b": 1e9}[m.group(2).lower()]))


def niche_of(x):
    x = (x or "").strip().lower()
    for k, v in NICHE_WORDS.items():
        if k in x:
            return v
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv")
    ap.add_argument("--out", default="findings.json")
    ap.add_argument("--min-views", type=int, default=10_000_000)
    ap.add_argument("--min-likes", type=int, default=1_000_000, help="bar when the platform hides views")
    a = ap.parse_args()
    today = datetime.date.today().isoformat()
    known = set()
    for p in glob.glob(os.path.join(ROOT, "data", "weeks", "*.json")):
        for v in json.load(open(p, encoding="utf-8")).get("videos", []):
            known.add((v.get("url") or "").split("?")[0].rstrip("/"))

    new, dropped, seen = [], [], set()
    with open(a.csv, newline="", encoding="utf-8-sig") as fh:
        for i, r in enumerate(csv.DictReader(fh), start=2):
            r = {(k or "").strip().lower(): (v or "").strip() for k, v in r.items()}
            url = r.get("url", "").split("?")[0].rstrip("/") if "youtube" not in r.get("url", "") else r.get("url", "")
            views, likes, comments = num(r.get("views")), num(r.get("likes")), num(r.get("comments"))
            niche = niche_of(r.get("niche"))
            why = None
            if not EXACT.search(url):
                why = "no exact post URL"
            elif url.rstrip("/") in known or url in seen:
                why = "already in the hub"
            elif not niche:
                why = f"unknown niche {r.get('niche')!r}"
            elif not ((views or 0) >= a.min_views or (views is None and (likes or 0) >= a.min_likes)):
                why = f"below the bar (views={views}, likes={likes})"
            if why:
                dropped.append(f"row {i}: {why}: {url or r.get('caption_or_title', '')[:60]}")
                continue
            seen.add(url)
            shown = " · ".join(x for x in [
                f"{r.get('views')} views" if r.get("views") else "",
                f"{r.get('likes')} likes" if r.get("likes") else "",
                f"{r.get('comments')} comments" if r.get("comments") else ""] if x)
            new.append({
                "niche": niche,
                "title": r.get("caption_or_title") or r.get("hook_first_line") or url,
                "title_short": (r.get("short_title") or r.get("caption_or_title") or "")[:90],
                "creator_handle": r.get("creator_handle") or None,
                "creator_name": r.get("creator_name") or None,
                "platform": IR.platform(url),
                "content_type": r.get("format") or None,
                "url": url, "url_is_exact_post": True,
                "views": views, "likes": likes, "comments": comments, "shares_or_saves": None,
                "stats_quote": f"Reported by Manus on {r.get('checked_on') or today}: {shown}",
                "stats_source_url": url,
                "stats_reported_date": (r.get("checked_on") or today)[:7],
                "posted_date": r.get("posted_date") or None,
                "hook_verbatim": r.get("hook_first_line") or None,
                "hook_summary": r.get("first_3_seconds") or None,
                "hook_types": [t.strip() for t in re.split(r"[;,|]", r.get("hook_types", "")) if t.strip()],
                "format_formula": r.get("format_formula") or None,
                "beats": [],
                "why_it_worked": r.get("why_it_worked") or None,
                "production": {"camera": r.get("camera") or None, "asmr": r.get("asmr") or None,
                               "editing": r.get("editing") or None, "transitions_or_vfx": r.get("transitions") or None,
                               "captions_on_screen": None, "audio": r.get("audio") or None,
                               "approx_length_s": num(r.get("length_s")), "faces": None},
                "replication_notes": r.get("how_to_repeat") or None,
                "evidence_strength": "medium",
                "scores": {"relatability": 60, "relevancy": 60},
                "effort": None,
            })
    out = {"checked_on": today, "source": "manus", "updates": {}, "new": new}
    json.dump(out, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(new)} rows kept -> {a.out}; {len(dropped)} dropped")
    for d in dropped[:40]:
        print("  dropped", d)
    if len(dropped) > 40:
        print(f"  … and {len(dropped) - 40} more")
    print("Next: re-read every kept URL with Claude in Chrome, set real scores, then run apply_browser_findings.py.")


if __name__ == "__main__":
    main()
