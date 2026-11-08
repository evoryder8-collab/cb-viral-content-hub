#!/usr/bin/env python3
"""Collect the numbers the Virality score needs, from the platforms' own public pages.

    python3 scripts/fetch_creator_stats.py [--force]

1. Follower counts: for every creator handle in the week files, read the public profile
   (Instagram/TikTok: the page's description, e.g. "1.2M Followers"; YouTube: "8.7M subscribers")
   into data/creators.json as {"platform:handle": {followers, text, url, fetched_on}}.
   Counts are refreshed when older than 30 days.
2. Missing likes: for Instagram posts with an exact link but no like count, read the post's embed page
   and fill likes/comments with a quote and the date.

Runs inside the CB Hub covers GitHub Action (cloud sessions can't reach these sites).
Everything that fails is logged and skipped, never guessed.
"""
import datetime
import glob
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import fetch_thumbs as FT  # noqa: E402

CREATORS = os.path.join(ROOT, "data", "creators.json")
TODAY = datetime.date.today()


def num(s):
    s = s.replace(",", "").replace(" ", "").strip()
    m = re.match(r"^([\d.]+)([KkMmBb]?)$", s)
    if not m:
        return None
    return int(round(float(m.group(1)) * {"": 1, "k": 1e3, "m": 1e6, "b": 1e9}[m.group(2).lower()]))


def profile_url(platform, handle):
    h = handle.lstrip("@")
    return {"instagram": f"https://www.instagram.com/{h}/", "tiktok": f"https://www.tiktok.com/@{h}",
            "youtube": f"https://www.youtube.com/@{h}"}.get(platform)


def read_followers(platform, url):
    last = None
    for ua in (FT.UA_PREVIEW, FT.UA_BROWSER):
        try:
            body, _ = FT.get(url, ua=ua)
        except Exception as exc:  # noqa: BLE001
            last = str(exc)
            continue
        text = html.unescape(body.decode("utf-8", "replace"))
        if platform == "youtube":
            m = re.search(r"([\d.,]+\s*[KMB]?)\s+subscribers", text)
        else:
            m = (re.search(r"([\d.,]+\s*[KMB]?)\s+Followers", text)
                 or re.search(r'"followerCount"\s*:\s*(\d+)', text))
        if m:
            n = num(m.group(1))
            if n:
                start = max(0, m.start() - 60)
                return n, re.sub(r"\s+", " ", text[start:m.end() + 40]).strip()
        last = f"no follower count in {len(body)} bytes"
    raise ValueError(last or "no response")


def fill_instagram_likes(v):
    m = re.search(r"instagram\.com/(?:[\w.]+/)?(reel|p|tv)/([\w-]+)", v.get("url") or "")
    if not m:
        return False
    body, _ = FT.get(f"https://www.instagram.com/{m.group(1)}/{m.group(2)}/embed/captioned/")
    likes = re.search(rb"([\d.,]+\s*[KkMm]?)\s+likes", body)
    comments = re.search(rb"View all ([\d.,]+\s*[KkMm]?) comments", body)
    if not likes:
        raise ValueError(f"no like count on the embed page ({len(body)} bytes; the creator may hide likes)")
    s = v["stats"]
    s["likes"] = num(likes.group(1).decode())
    if comments:
        s["comments"] = num(comments.group(1).decode())
    shown = likes.group(0).decode() + (f" · {comments.group(1).decode()} comments" if comments else "")
    s["quote"] = f"From Instagram's embed page, fetched {TODAY.isoformat()}: {shown} (Instagram doesn't show the view count there)"
    s["source_url"] = v["url"]
    s["as_of"] = TODAY.isoformat()[:7]
    s.pop("qualifier", None)
    return True


def main():
    force = "--force" in sys.argv
    creators = json.load(open(CREATORS, encoding="utf-8")) if os.path.exists(CREATORS) else {}
    weeks = sorted(glob.glob(os.path.join(ROOT, "data", "weeks", "*.json")))
    wanted, got, failed, likes_filled = {}, 0, 0, 0
    for p in weeks:
        wk = json.load(open(p, encoding="utf-8"))
        changed = False
        for v in wk.get("videos", []):
            h = (v.get("creator") or {}).get("handle")
            if h and v.get("platform") in ("instagram", "tiktok", "youtube"):
                wanted[f"{v['platform']}:{h.lstrip('@').lower()}"] = (v["platform"], h)
            s = v.get("stats") or {}
            if v.get("platform") == "instagram" and v.get("url_is_exact_post") and not s.get("likes") and not s.get("views"):
                try:
                    if fill_instagram_likes(v):
                        likes_filled += 1
                        changed = True
                        print("likes", v["id"], v["stats"]["likes"])
                except Exception as exc:  # noqa: BLE001
                    print("likes FAIL", v["id"], exc)
        if changed:
            with open(p, "w", encoding="utf-8") as fh:
                json.dump(wk, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
    for key, (platform, handle) in sorted(wanted.items()):
        old = creators.get(key)
        if old and not force and old.get("fetched_on") and \
                (TODAY - datetime.date.fromisoformat(old["fetched_on"])).days < 30:
            continue
        url = profile_url(platform, handle)
        try:
            n, text = read_followers(platform, url)
            creators[key] = {"followers": n, "text": text[:200], "url": url, "fetched_on": TODAY.isoformat()}
            got += 1
            print("ok  ", key, n)
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print("FAIL", key, exc)
    with open(CREATORS, "w", encoding="utf-8") as fh:
        json.dump(creators, fh, ensure_ascii=False, indent=1, sort_keys=True)
        fh.write("\n")
    print(f"\nfollowers: {got} fetched, {failed} failed, {len(creators)} known; likes filled: {likes_filled}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
