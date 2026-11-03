#!/usr/bin/env python3
"""Merge what a browser pass (Claude in Chrome) read off TikTok / Instagram / YouTube into a weekly drop.

    python3 scripts/apply_browser_findings.py --week YYYY-MM-DD findings.json [--dry]

findings.json:
{
  "checked_on": "YYYY-MM-DD",
  "updates": {                       # existing references, keyed by video id
    "<id>": {"url": "exact post URL", "views": 1234567, "likes": 89000, "comments": 1200,
             "quote": "what the post page showed, e.g. '1.2M views · 89K likes'",
             "removed": false}       # true when the post is gone or private
  },
  "new": [ { ...one video in the research schema of RESEARCH_PLAYBOOK.md, plus
             "niche": "...", "title_short": "card title",
             "scores": {"relatability": 0-100, "relevancy": 0-100}, "effort": "low|medium|high" } ]
}

Numbers read on the post page replace search-snippet numbers; the old source stays in the quote.
Run scripts/validate.py afterwards (this script runs it too unless --dry).
"""
import argparse
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import import_research as IR  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--week", required=True)
    ap.add_argument("findings")
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()
    f = json.load(open(a.findings, encoding="utf-8"))
    day = f.get("checked_on") or a.week
    wp = os.path.join(ROOT, "data", "weeks", a.week + ".json")
    wk = json.load(open(wp, encoding="utf-8"))
    by = {v["id"]: v for v in wk["videos"]}
    upd = new = removed = 0

    for vid, u in (f.get("updates") or {}).items():
        v = by.get(vid)
        if not v:
            print("unknown id, skipped:", vid)
            continue
        if u.get("removed"):
            v["url_note"] = f"Post looked removed or private when checked on {day}."
            removed += 1
            continue
        if u.get("url"):
            v["url"], v["url_is_exact_post"] = u["url"].split("?")[0] if "youtube" not in u["url"] else u["url"], True
            v["platform"] = IR.platform(u["url"])
            v.pop("url_note", None)
        nums = {k: u.get(k) for k in ("views", "likes", "comments") if isinstance(u.get(k), int)}
        if nums and u.get("quote"):
            s = v["stats"]
            old = s.get("quote")
            s.update(nums)
            s["quote"] = f"Read on the post page on {day}: {u['quote']}" + (f" | Earlier source: {old}" if old else "")
            s["source_url"] = v["url"]
            s["as_of"] = day[:7]
            s.pop("qualifier", None)
        upd += 1

    for raw in f.get("new") or []:
        niche = raw.get("niche")
        if niche not in IR.SHORT:
            print("bad niche, skipped:", raw.get("title"))
            continue
        v = IR.convert_video(niche, raw, a.week)
        if v["id"] in by or any(x.get("url") == v["url"] for x in wk["videos"]):
            print("already in the week, skipped:", v["id"])
            continue
        if raw.get("title_short"):
            v["title"] = raw["title_short"]
        v["scores"].update(raw.get("scores") or {})
        if raw.get("effort"):
            v["effort"] = raw["effort"]
        wk["videos"].append(v)
        by[v["id"]] = v
        new += 1

    print(f"{upd} updated, {removed} flagged removed, {new} new references")
    if a.dry:
        return 0
    with open(wp, "w", encoding="utf-8") as fh:
        json.dump(wk, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    man_p = os.path.join(ROOT, "data", "manifest.json")
    man = json.load(open(man_p, encoding="utf-8"))
    for w in man["weeks"]:
        if w["id"] == a.week:
            w["count"] = len(wk["videos"])
    json.dump(man, open(man_p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return subprocess.call([sys.executable, os.path.join(ROOT, "scripts", "validate.py")])


if __name__ == "__main__":
    sys.exit(main())
