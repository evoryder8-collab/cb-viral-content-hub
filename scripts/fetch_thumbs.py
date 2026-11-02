#!/usr/bin/env python3
"""Download the real cover image of every reference that has an exact post URL.

    python3 scripts/fetch_thumbs.py [--week YYYY-MM-DD] [--force]

Saves thumbs/<video id>.jpg (max 540 px wide) and writes "thumb": "thumbs/<id>.jpg" into the week file,
so the cards show the original cover everywhere, including the private single-file preview.

Sources, in order:
  YouTube   https://i.ytimg.com/vi/<id>/hqdefault.jpg
  TikTok    oEmbed  https://www.tiktok.com/oembed?url=<post url>  -> thumbnail_url
  Instagram og:image of the post page (Instagram serves it to link-preview bots)

Needs network access to: i.ytimg.com, www.tiktok.com, *.tiktokcdn.com, *.tiktokcdn-us.com,
www.instagram.com, *.cdninstagram.com, *.fbcdn.net. In a Claude cloud session, add these under the
environment's Network access > Allowed domains. Failures are reported and skipped, never faked.
"""
import argparse
import html
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
THUMBS = os.path.join(ROOT, "thumbs")
UA_BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15"
UA_PREVIEW = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
MAX_W = 540


def get(url, ua=UA_BROWSER, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept-Language": "en"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.headers.get("Content-Type", "")


def yt_id(url):
    m = re.search(r"(?:shorts/|v=|youtu\.be/|embed/)([\w-]{11})", url or "")
    return m.group(1) if m else None


def cover_url(v):
    url, plat = v.get("url") or "", v.get("platform")
    if plat == "youtube" and yt_id(url):
        return f"https://i.ytimg.com/vi/{yt_id(url)}/hqdefault.jpg"
    if plat == "tiktok" and re.search(r"/video/\d+", url):
        body, _ = get("https://www.tiktok.com/oembed?url=" + urllib.parse.quote(url, safe=""))
        return json.loads(body).get("thumbnail_url")
    if plat == "instagram" and re.search(r"instagram\.com/(?:[\w.]+/)?(?:reel|p|tv)/[\w-]+", url):
        body, _ = get(url, ua=UA_PREVIEW)
        m = re.search(rb'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', body)
        return html.unescape(m.group(1).decode()) if m else None
    return None


def save_jpeg(raw, path):
    try:
        from PIL import Image  # optional: shrink to keep the repo light
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)))
        im.save(path, "JPEG", quality=80, optimize=True, progressive=True)
    except ImportError:
        with open(path, "wb") as fh:
            fh.write(raw)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--week", help="only this week (default: every week in the manifest)")
    ap.add_argument("--force", action="store_true", help="re-download covers that already exist")
    a = ap.parse_args()
    man = json.load(open(os.path.join(DATA, "manifest.json")))
    weeks = [a.week] if a.week else [w["id"] for w in man["weeks"]]
    os.makedirs(THUMBS, exist_ok=True)
    got = fail = skip = 0
    for wid in weeks:
        path = os.path.join(DATA, "weeks", wid + ".json")
        wk = json.load(open(path))
        for v in wk["videos"]:
            rel = f"thumbs/{v['id']}.jpg"
            dest = os.path.join(ROOT, rel)
            if not v.get("url_is_exact_post"):
                skip += 1
                continue
            if os.path.exists(dest) and not a.force:
                v["thumb"] = rel
                continue
            try:
                cu = cover_url(v)
                if not cu:
                    raise ValueError("no cover found")
                raw, ctype = get(cu)
                if "image" not in ctype and not raw[:3] == b"\xff\xd8\xff":
                    raise ValueError(f"not an image ({ctype})")
                save_jpeg(raw, dest)
                v["thumb"] = rel
                got += 1
                print(f"ok    {v['id']}")
            except Exception as exc:  # noqa: BLE001
                fail += 1
                print(f"FAIL  {v['id']}: {exc}")
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(wk, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
    print(f"\n{got} downloaded, {fail} failed, {skip} skipped (no exact post URL)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
