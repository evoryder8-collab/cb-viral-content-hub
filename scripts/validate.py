#!/usr/bin/env python3
"""Validate CB Viral Content Hub data before every commit.

Usage:  python3 scripts/validate.py          (run from cb-viral-content-hub/)
Exit code 0 = OK, 1 = errors found. Warnings never fail the run.

Rules enforced (see RESEARCH_PLAYBOOK.md):
  * every week listed in data/manifest.json exists and parses
  * video ids are unique across all weeks, picks point at real videos
  * a views/likes number is only allowed with a stats.quote AND a stats.source_url
  * scores are integers 0-100, niches and hook types come from the fixed lists
  * hook ids unique, every hook has a template, every library item has a source where required
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

NICHES = {"massage", "gym_pt", "dexa_biohacking", "icebath", "photo_video"}
NICHES_PLUS = NICHES | {"general"}
PLATFORMS = {"tiktok", "instagram", "youtube", "facebook", "x", "web"}
HOOK_TYPES = {
    "pattern_interrupt", "curiosity_gap", "negative_warning", "contrarian", "pov", "stitch_duet",
    "green_screen_react", "asmr_sensory", "before_after_reveal", "transformation", "myth_bust", "listicle",
    "question", "storytime", "challenge_day_x", "behind_the_scenes", "satisfying_process", "shock_stat",
    "authority_credential", "relatable_pain", "humor_skit", "comment_reply", "tutorial_howto",
    "price_value_reveal", "test_experiment", "reaction_face", "social_proof_testimonial", "us_vs_them",
    "visual_spectacle", "loop",
}
ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]{2,80}$")
WEEK_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

errors, warnings = [], []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def load(path):
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except Exception as exc:  # noqa: BLE001
        err(f"{os.path.relpath(path, ROOT)}: cannot parse ({exc})")
        return None


def is_url(u):
    return isinstance(u, str) and u.startswith(("https://", "http://"))


def check_score(where, val):
    if not isinstance(val, int) or not 0 <= val <= 100:
        err(f"{where}: score must be an int 0-100, got {val!r}")


def check_video(where, v):
    vid = v.get("id")
    if not isinstance(vid, str) or not ID_RE.match(vid):
        err(f"{where}: bad id {vid!r} (lowercase, digits, hyphens)")
    for k in ("title", "niche", "platform", "url"):
        if not v.get(k):
            err(f"{where} [{vid}]: missing {k}")
    if v.get("niche") not in NICHES:
        err(f"{where} [{vid}]: unknown niche {v.get('niche')!r}")
    if v.get("platform") not in PLATFORMS:
        err(f"{where} [{vid}]: unknown platform {v.get('platform')!r}")
    if v.get("url") and not is_url(v["url"]):
        err(f"{where} [{vid}]: url is not http(s)")
    s = v.get("stats") or {}
    has_num = any(s.get(k) is not None for k in ("views", "likes", "comments", "shares"))
    for k in ("views", "likes", "comments", "shares"):
        if s.get(k) is not None and (not isinstance(s[k], int) or s[k] < 0):
            err(f"{where} [{vid}]: stats.{k} must be a non-negative int")
    if has_num and not (s.get("quote") and is_url(s.get("source_url"))):
        err(f"{where} [{vid}]: numbers need stats.quote and stats.source_url (no unsourced stats)")
    if not has_num:
        warn(f"{where} [{vid}]: no public numbers; virality ring will be empty")
    sc = v.get("scores") or {}
    check_score(f"{where} [{vid}] relatability", sc.get("relatability"))
    check_score(f"{where} [{vid}] relevancy", sc.get("relevancy"))
    hook = v.get("hook") or {}
    if not (hook.get("verbatim") or hook.get("summary")):
        err(f"{where} [{vid}]: hook needs verbatim or summary")
    for t in hook.get("types") or []:
        if t not in HOOK_TYPES:
            err(f"{where} [{vid}]: unknown hook type {t!r}")
    for k in (v.get("remix") or {}):
        if k not in NICHES:
            err(f"{where} [{vid}]: remix key {k!r} is not a niche")
    if v.get("thumb") and not os.path.exists(os.path.join(ROOT, v["thumb"])):
        err(f"{where} [{vid}]: thumb file {v['thumb']} is missing")
    if v.get("evidence") not in (None, "high", "medium", "low"):
        err(f"{where} [{vid}]: evidence must be high|medium|low")


def main():
    manifest = load(os.path.join(DATA, "manifest.json"))
    library = load(os.path.join(DATA, "library.json"))
    if manifest is None or library is None:
        return finish()

    weeks = manifest.get("weeks") or []
    if not weeks:
        err("manifest.json: no weeks listed")
    ids = [w.get("id") for w in weeks]
    if manifest.get("latest") not in ids:
        err("manifest.json: 'latest' must be one of the listed week ids")
    seen_videos = {}
    for w in weeks:
        wid = w.get("id")
        if not isinstance(wid, str) or not WEEK_RE.match(wid):
            err(f"manifest.json: bad week id {wid!r} (YYYY-MM-DD, the Monday)")
            continue
        wk = load(os.path.join(DATA, "weeks", f"{wid}.json"))
        if wk is None:
            continue
        where = f"weeks/{wid}.json"
        if wk.get("id") != wid:
            err(f"{where}: id field must equal {wid}")
        vids = wk.get("videos") or []
        if len(vids) < 6:
            warn(f"{where}: only {len(vids)} videos (aim for 12+)")
        local = set()
        for v in vids:
            check_video(where, v)
            vid = v.get("id")
            if vid in local:
                err(f"{where}: duplicate video id {vid}")
            local.add(vid)
            if vid in seen_videos and seen_videos[vid] != wid:
                warn(f"{where}: video {vid} also appears in week {seen_videos[vid]} (newer copy wins)")
            seen_videos[vid] = wid
        for p in wk.get("picks") or []:
            if p not in local:
                err(f"{where}: pick {p!r} is not a video in this week")
        for m in wk.get("moves") or []:
            if m.get("ref") and m["ref"] not in local:
                err(f"{where}: move ref {m['ref']!r} is not a video in this week")
            if m.get("niche") not in NICHES_PLUS:
                err(f"{where}: move niche {m.get('niche')!r} unknown")
        for t in wk.get("trends") or []:
            if t.get("niche") not in NICHES_PLUS:
                err(f"{where}: trend niche {t.get('niche')!r} unknown")
            if not t.get("source_url"):
                warn(f"{where}: trend '{t.get('trend', '')[:40]}' has no source_url")

    hook_ids = set()
    for h in library.get("hooks") or []:
        hid = h.get("id")
        if not isinstance(hid, str) or not ID_RE.match(hid):
            err(f"library.hooks: bad id {hid!r}")
        if hid in hook_ids:
            err(f"library.hooks: duplicate id {hid}")
        hook_ids.add(hid)
        if not h.get("template"):
            err(f"library.hooks [{hid}]: missing template")
        for t in h.get("types") or []:
            if t not in HOOK_TYPES:
                err(f"library.hooks [{hid}]: unknown type {t!r}")
        for n in h.get("niches") or []:
            if n not in NICHES_PLUS:
                err(f"library.hooks [{hid}]: unknown niche {n!r}")
        if not h.get("source_url"):
            warn(f"library.hooks [{hid}]: no source_url")
        if h.get("added") not in ids:
            err(f"library.hooks [{hid}]: 'added' must be a week id from the manifest")

    fkeys = set()
    for f in library.get("formats") or []:
        if f.get("key") in fkeys:
            err(f"library.formats: duplicate key {f.get('key')}")
        fkeys.add(f.get("key"))
        for k in ("key", "name", "definition"):
            if not f.get(k):
                err(f"library.formats [{f.get('key')}]: missing {k}")
        for n in f.get("niches") or []:
            if n not in NICHES:
                err(f"library.formats [{f.get('key')}]: unknown niche {n!r}")
    for a in library.get("algorithm") or []:
        if a.get("platform") not in PLATFORMS:
            err(f"library.algorithm: bad platform {a.get('platform')!r}")
        if a.get("confidence") not in ("official", "study", "practitioner"):
            err(f"library.algorithm: bad confidence {a.get('confidence')!r} on '{a.get('fact', '')[:40]}'")
    tot = 0
    for c in library.get("checklist") or []:
        if not c.get("id") or not c.get("check"):
            err("library.checklist: item missing id/check")
        if not isinstance(c.get("weight"), int) or not 1 <= c["weight"] <= 5:
            err(f"library.checklist [{c.get('id')}]: weight must be int 1-5")
        tot += 1
    if tot and tot < 8:
        warn("library.checklist: fewer than 8 checks")
    return finish()


def finish():
    for w in warnings:
        print("warn  ", w)
    for e in errors:
        print("ERROR ", e)
    print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
