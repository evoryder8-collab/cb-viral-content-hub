#!/usr/bin/env python3
"""Turn raw research files into a weekly drop.

    python3 scripts/import_research.py --week 2026-11-09 --research DIR [--overlay FILE] [--list]

DIR holds one JSON file per niche in the research schema described in RESEARCH_PLAYBOOK.md
(massage.json, gym_pt.json, dexa_biohacking.json, icebath.json, photo_video.json) and,
optionally, science.json (formats, algorithm facts, production factors, carousel science,
generic hooks, pre-flight checklist).

--list     only print the generated video ids (use them as keys in the overlay)
--overlay  curation file: which videos to drop, short titles, scores, picks, weekly moves,
           headline and remixes. See RESEARCH_PLAYBOOK.md for the format.

Writes data/weeks/<week>.json, merges new hooks/carousels/notes into data/library.json
(never deletes old library items) and registers the week in data/manifest.json.
"""
import argparse
import json
import os
import re
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
NICHE_FILES = ["massage", "gym_pt", "dexa_biohacking", "icebath", "photo_video"]
SHORT = {"massage": "ms", "gym_pt": "pt", "dexa_biohacking": "dx", "icebath": "ib", "photo_video": "pv"}
HOOK_TYPES = {
    "pattern_interrupt", "curiosity_gap", "negative_warning", "contrarian", "pov", "stitch_duet",
    "green_screen_react", "asmr_sensory", "before_after_reveal", "transformation", "myth_bust", "listicle",
    "question", "storytime", "challenge_day_x", "behind_the_scenes", "satisfying_process", "shock_stat",
    "authority_credential", "relatable_pain", "humor_skit", "comment_reply", "tutorial_howto",
    "price_value_reveal", "test_experiment", "reaction_face", "social_proof_testimonial", "us_vs_them",
    "visual_spectacle", "loop",
}
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
          "October", "November", "December"]


def slug(text, n=6):
    text = unicodedata.normalize("NFKD", str(text)).encode("ascii", "ignore").decode()
    words = re.findall(r"[a-z0-9]+", text.lower())
    return "-".join(words[:n])


def load(path, default=None):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=1)
        fh.write("\n")


def platform(p):
    p = (p or "").lower()
    for k in ("tiktok", "instagram", "youtube", "facebook"):
        if k in p:
            return k
    if p in ("x", "twitter") or "x.com" in p:
        return "x"
    return "web"


def int_or_none(x):
    if isinstance(x, bool) or x is None:
        return None
    if isinstance(x, (int, float)):
        return int(x)
    return None


def clean_beats(beats):
    out, inferred = [], False
    for b in beats or []:
        if not isinstance(b, str):
            continue
        if re.match(r"^\s*inferred\s*:\s*", b, re.I):
            inferred = True
            b = re.sub(r"^\s*inferred\s*:\s*", "", b, flags=re.I)
        out.append(b.strip())
    return out, inferred


def video_id(niche, v):
    who = (v.get("creator_handle") or "").lstrip("@").split(" ")[0] or (v.get("creator_name") or "")
    base = SHORT[niche] + "-" + slug(who, 2) + "-" + slug(v.get("title", ""), 4)
    return re.sub(r"-+", "-", base).strip("-")[:80]


def convert_video(niche, v, week):
    s_views, s_likes = int_or_none(v.get("views")), int_or_none(v.get("likes"))
    s_comments, s_shares = int_or_none(v.get("comments")), int_or_none(v.get("shares_or_saves"))
    quote, src = v.get("stats_quote") or "", v.get("stats_source_url") or ""
    if not (quote and str(src).startswith("http")):
        s_views = s_likes = s_comments = s_shares = None  # never show unsourced numbers
    beats, inferred = clean_beats(v.get("beats"))
    p = v.get("production") or {}
    types = [t for t in (v.get("hook_types") or []) if t in HOOK_TYPES]
    handle = v.get("creator_handle")
    if handle and (" " in handle.strip() or not handle.strip().startswith("@")):
        handle = None
    out = {
        "id": video_id(niche, v),
        "title": v.get("title", "").strip(),
        "niche": niche,
        "adjacent": bool(v.get("adjacent")),
        "platform": platform(v.get("platform")),
        "content_type": v.get("content_type"),
        "url": v.get("url"),
        "url_is_exact_post": bool(v.get("url_is_exact_post")),
        "creator": {"handle": handle, "name": v.get("creator_name"), "followers": v.get("creator_followers")},
        "stats": {"views": s_views, "likes": s_likes, "comments": s_comments, "shares": s_shares,
                  "quote": quote or None, "source_url": src if str(src).startswith("http") else None,
                  "as_of": v.get("stats_reported_date") or week[:7]},
        "posted": v.get("posted_date"),
        "hook": {"verbatim": v.get("hook_verbatim"), "summary": v.get("hook_summary"), "types": types},
        "formula": v.get("format_formula"),
        "beats": beats,
        "beats_inferred": inferred,
        "why": v.get("why_it_worked"),
        "production": {"camera": p.get("camera"), "asmr": p.get("asmr"), "editing": p.get("editing"),
                       "vfx": p.get("transitions_or_vfx"), "captions": p.get("captions_on_screen"),
                       "audio": p.get("audio"), "length_s": p.get("approx_length_s"), "faces": p.get("faces")},
        "replicate": v.get("replication_notes"),
        "evidence": v.get("evidence_strength") if v.get("evidence_strength") in ("high", "medium", "low") else "low",
        "scores": {"relatability": 60, "relevancy": 60},
    }
    for k in ("camera", "asmr", "editing", "audio", "faces"):
        if out["production"][k] in ("unknown", None, ""):
            out["production"][k] = None
    return out


def convert_hook(niche, h, week, idx):
    t = (h.get("template") or "").strip()
    return {
        "id": (SHORT.get(niche, "gn") + "-" + slug(t, 7) or f"hook-{idx}")[:80].strip("-"),
        "template": t,
        "example": h.get("example_verbatim"),
        "creator": h.get("example_creator"),
        "source_url": h.get("source_url"),
        "types": [x for x in (h.get("hook_types") or []) if x in HOOK_TYPES],
        "delivery": h.get("delivery"),
        "evidence": h.get("evidence"),
        "niches": [niche],
        "added": week,
    }


FACTOR_GROUPS = {
    "Camera & look": ["iphone_vs_pro", "ugc_vs_polished", "face_human_first_frame", "eye_contact_direct_address",
                      "motion_first_frame", "vertical_safe_zones", "covers_thumbnails"],
    "Sound": ["sound_on_design", "asmr_natural_sound", "trending_vs_original_audio", "voiceover"],
    "Edit": ["hook_timing_first_3s", "on_screen_text_hook", "captions_subtitles", "jump_cuts_pacing",
             "heavy_editing_transitions", "optimal_length", "loops_rewatch", "ai_generated_content"],
    "Posting": ["posting_time_frequency", "ctas_send_save_comment", "originality_watermarks",
                "keyword_captions_hashtags", "trial_reels_testing"],
}
GROUP_OF = {k: g for g, ks in FACTOR_GROUPS.items() for k in ks}


def merge_science(lib, sci, week):
    """Fold cross-niche research (formats, algorithm facts, production verdicts...) into the library.
    Items are matched by key/text: a newer week's version replaces the older one, nothing is deleted."""
    def upsert(lst, item, key):
        for i, old in enumerate(lst):
            if old.get(key) == item.get(key):
                lst[i] = item
                return
        lst.append(item)

    for f in sci.get("formats") or []:
        if not f.get("key"):
            continue
        p = f.get("production_defaults") or {}
        upsert(lib["formats"], {
            "key": f["key"], "name": f.get("name"), "definition": f.get("definition"),
            "when": f.get("when_to_use"), "steps": f.get("how_to_execute") or [],
            "example": f.get("real_example"), "evidence": f.get("evidence"),
            "sources": f.get("source_urls") or [],
            "niches": [n for n in (f.get("best_niches") or []) if n in SHORT],
            "production": {"camera": p.get("camera"), "asmr": p.get("asmr"), "editing": p.get("editing"),
                           "transitions": p.get("transitions"), "audio": p.get("audio"), "length_s": p.get("length_s")},
            "updated": week,
        }, "key")
    for a in sci.get("algorithm_facts") or []:
        if a.get("fact"):
            conf = a.get("confidence") if a.get("confidence") in ("official", "study", "practitioner") else "practitioner"
            upsert(lib["algorithm"], dict(a, platform=platform(a.get("platform")), confidence=conf, added=week), "fact")
    for pf in sci.get("production_factors") or []:
        if pf.get("key"):
            upsert(lib["production"], {
                "key": pf["key"], "name": pf.get("name"), "verdict": pf.get("verdict"),
                "use_when": pf.get("use_when"), "avoid_when": pf.get("avoid_when"), "evidence": pf.get("evidence"),
                "stat": pf.get("stat"), "sources": pf.get("source_urls") or [],
                "group": pf.get("group") or GROUP_OF.get(pf["key"], "Posting"), "updated": week,
            }, "key")
    for c in sci.get("carousel_science") or []:
        if c.get("fact"):
            upsert(lib["carousel_science"], dict(c, added=week), "fact")
    for i, c in enumerate(sci.get("preflight_checklist") or []):
        if c.get("check"):
            w = c.get("weight")
            w = int(w) if isinstance(w, (int, float)) and 1 <= w <= 5 else 3
            upsert(lib["checklist"], {"id": slug(c["check"], 5) or f"check-{i}", "check": c["check"],
                                      "why": c.get("why"), "weight": w, "source_url": c.get("source_url")}, "id")
    have = {h["id"] for h in lib["hooks"]}
    for i, h in enumerate(sci.get("hooks") or []):
        if h.get("template"):
            hk = convert_hook("general", h, week, i)
            hk["niches"] = ["general"]
            if hk["id"] not in have:
                lib["hooks"].append(hk)
                have.add(hk["id"])


def week_label(week):
    y, m, d = (int(x) for x in week.split("-"))
    return f"Week of {d} {MONTHS[m - 1]} {y}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--week", required=True, help="Monday of the drop, YYYY-MM-DD")
    ap.add_argument("--research", required=True)
    ap.add_argument("--overlay")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()
    week = a.week
    ov = load(a.overlay, {}) if a.overlay else {}

    videos, hooks, carousels, trends, notes = [], [], [], [], []
    for niche in NICHE_FILES:
        r = load(os.path.join(a.research, niche + ".json"))
        if not r:
            continue
        for v in r.get("videos") or []:
            videos.append(convert_video(niche, v, week))
        for i, h in enumerate(r.get("hooks") or []):
            if h.get("template"):
                hooks.append(convert_hook(niche, h, week, i))
        for c in r.get("carousels") or []:
            if c.get("slide1_hook"):
                carousels.append({"id": SHORT[niche] + "-c-" + slug(c["slide1_hook"], 6), "slide1": c["slide1_hook"],
                                  "structure": c.get("structure"), "creator": c.get("example_creator"),
                                  "source_url": c.get("source_url"), "evidence": c.get("evidence"),
                                  "niche": niche, "added": week})
        for t in r.get("trends_now") or []:
            trends.append({"niche": niche, "trend": t.get("trend"), "evidence": t.get("evidence"),
                           "source_url": t.get("source_url"), "date": t.get("date")})
        for n in r.get("production_insights") or []:
            notes.append({"niche": niche, "note": n if isinstance(n, str) else json.dumps(n), "added": week})

    # de-duplicate ids
    seen = {}
    for v in videos:
        if v["id"] in seen:
            seen[v["id"]] += 1
            v["id"] = f"{v['id']}-{seen[v['id']]}"
        else:
            seen[v["id"]] = 1

    if a.list:
        for v in videos:
            s = v["stats"]
            print(f"{v['id']:<70} V={s['views']} L={s['likes']}  {v['title'][:60]}")
        return

    drop = set(ov.get("drop") or [])
    patch = ov.get("videos") or {}
    kept = []
    for v in videos:
        if v["id"] in drop:
            continue
        p = patch.get(v["id"]) or {}
        for k, val in p.items():
            if k in ("scores", "stats", "hook", "production", "creator") and isinstance(val, dict):
                v[k].update(val)
            else:
                v[k] = val
        kept.append(v)
    trends = [t for i, t in enumerate(trends) if i not in set(ov.get("drop_trends") or [])]
    trends += ov.get("extra_trends") or []

    wk = {
        "id": week,
        "label": ov.get("label") or week_label(week),
        "headline": ov.get("headline"),
        "headline_html": ov.get("headline_html"),
        "lede": ov.get("lede"),
        "moves": ov.get("moves") or [],
        "picks": ov.get("picks") or [],
        "videos": kept,
        "trends": trends,
    }
    dump(os.path.join(DATA, "weeks", week + ".json"), wk)

    lib = load(os.path.join(DATA, "library.json"), {}) or {}
    for key in ("hooks", "formats", "carousels", "production", "algorithm", "carousel_science", "checklist", "niche_notes"):
        lib.setdefault(key, [])
    have = {h["id"] for h in lib["hooks"]}
    for h in hooks + (ov.get("extra_hooks") or []):
        if h["id"] not in have and h["id"] not in set(ov.get("drop_hooks") or []):
            lib["hooks"].append(h)
            have.add(h["id"])
    have_c = {c["id"] for c in lib["carousels"]}
    for c in carousels:
        if c["id"] not in have_c:
            lib["carousels"].append(c)
            have_c.add(c["id"])
    have_n = {n["note"] for n in lib["niche_notes"]}
    lib["niche_notes"] += [n for n in notes if n["note"] not in have_n]

    sci = load(os.path.join(a.research, "science.json"))
    if sci:
        merge_science(lib, sci, week)
    for k, val in (ov.get("library_set") or {}).items():  # e.g. big_questions
        lib[k] = val
    dump(os.path.join(DATA, "library.json"), lib)

    man = load(os.path.join(DATA, "manifest.json"), {"weeks": []})
    man["weeks"] = [w for w in man["weeks"] if w["id"] != week] + [{"id": week, "label": wk["label"], "count": len(kept)}]
    man["weeks"].sort(key=lambda w: w["id"])
    man["latest"] = man["weeks"][-1]["id"]
    dump(os.path.join(DATA, "manifest.json"), man)
    print(f"week {week}: {len(kept)} videos ({len(videos) - len(kept)} dropped), "
          f"{len(lib['hooks'])} hooks in library, {len(trends)} trends")


if __name__ == "__main__":
    main()
