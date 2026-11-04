#!/usr/bin/env python3
"""Read the public link preview of every post waiting in data/inbox.json.

    python3 scripts/fetch_inbox_meta.py

For each inbox item without `meta`, this fetches the post the way a link-preview bot does and stores what the
platform itself publishes: title, description (Instagram's says e.g. "1.2M likes, 3,400 comments - user on
May 1, 2025: caption"), the preview image (saved as thumbs/inbox-<code>.jpg) and the fetch date.
A session then turns each item into a full hub entry (see BROWSER_PASS.md, "Inbox"). Runs in the
CB Hub covers GitHub Action, because Claude cloud sessions can't reach these sites.
"""
import datetime
import html
import json
import os
import re
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import fetch_thumbs as FT  # noqa: E402

INBOX = os.path.join(ROOT, "data", "inbox.json")


def meta_tag(body, prop):
    for pat in (rb'<meta[^>]+(?:property|name)="' + prop.encode() + rb'"[^>]+content="([^"]*)"',
                rb'<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="' + prop.encode() + rb'"'):
        m = re.search(pat, body)
        if m:
            return html.unescape(m.group(1).decode("utf-8", "replace")).strip()
    return None


def code_of(url):
    m = re.search(r"/(?:reel|p|tv|video|shorts)/([\w-]+)", url) or re.search(r"v=([\w-]{11})", url)
    return m.group(1) if m else re.sub(r"\W+", "-", url)[-20:]


def read_preview(url):
    if "tiktok.com" in url:
        body, _ = FT.get("https://www.tiktok.com/oembed?url=" + urllib.parse.quote(url, safe=""))
        j = json.loads(body)
        return {"title": j.get("title"), "author": j.get("author_name"), "image": j.get("thumbnail_url")}
    if "youtube.com" in url or "youtu.be" in url:
        body, _ = FT.get("https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(url, safe=""))
        j = json.loads(body)
        return {"title": j.get("title"), "author": j.get("author_name"), "image": j.get("thumbnail_url")}
    last = None
    if "instagram.com" in url:
        try:
            return instagram_embed(url)
        except Exception as exc:  # noqa: BLE001
            last = f"embed: {exc}"
    for ua in (FT.UA_PREVIEW, "Twitterbot/1.0"):
        try:
            body, _ = FT.get(url, ua=ua)
            out = {"title": meta_tag(body, "og:title"), "description": meta_tag(body, "og:description"),
                   "image": meta_tag(body, "og:image")}
            if out["title"] or out["description"]:
                return out
            t = re.search(rb"<title[^>]*>(.*?)</title>", body, re.S)
            last = (f"no preview tags in {len(body)} bytes (page title: "
                    f"{html.unescape(t.group(1).decode('utf-8', 'replace')).strip()[:80] if t else 'none'})")
        except Exception as exc:  # noqa: BLE001
            last = str(exc)
    raise ValueError(last or "no preview")


def instagram_embed(url):
    """Instagram's embed page (what other websites show) usually works without a login."""
    m = re.search(r"instagram\.com/(?:[\w.]+/)?(reel|p|tv)/([\w-]+)", url)
    body, _ = FT.get(f"https://www.instagram.com/{m.group(1)}/{m.group(2)}/embed/captioned/")
    text = lambda b: re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", b.decode("utf-8", "replace")))).strip()
    img = re.search(rb'class="EmbeddedMediaImage"[^>]*src="([^"]+)"', body) or re.search(rb'<img[^>]+src="(https://[^"]*(?:cdninstagram|fbcdn)[^"]+)"', body)
    cap = re.search(rb'class="Caption"[^>]*>(.*?)</div>', body, re.S)
    user = re.search(rb'class="UsernameText"[^>]*>([^<]+)<', body)
    likes = re.search(rb'([\d.,]+\s*[KkMm]?)\s+likes', body)
    out = {"source": "instagram embed page",
           "author": user.group(1).decode().strip() if user else None,
           "description": text(cap.group(1))[:600] if cap else None,
           "likes_text": likes.group(0).decode() if likes else None,
           "image": html.unescape(img.group(1).decode()) if img else None}
    if not (out["image"] or out["description"]):
        raise ValueError(f"nothing usable in {len(body)} bytes")
    return out


def main():
    if not os.path.exists(INBOX):
        print("no inbox")
        return 0
    items = json.load(open(INBOX, encoding="utf-8"))
    changed = 0
    for it in items:
        if it.get("status") != "pending" or it.get("meta"):
            continue
        url = it["url"].split("?")[0]
        try:
            m = read_preview(url)
            m["fetched_on"] = datetime.date.today().isoformat()
            if m.get("image"):
                rel = f"thumbs/inbox-{code_of(url)}.jpg"
                raw, _ = FT.get(m["image"])
                FT.save_jpeg(raw, os.path.join(ROOT, rel), FT_platform(url))
                m["image_file"] = rel
            it["meta"] = m
            print("ok  ", url, "|", (m.get("description") or m.get("title") or "")[:120])
        except Exception as exc:  # noqa: BLE001
            it["meta_error"] = f"{datetime.date.today().isoformat()}: {exc}"
            print("FAIL", url, exc)
        changed += 1
    if changed:
        with open(INBOX, "w", encoding="utf-8") as fh:
            json.dump(items, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
    return 0


def FT_platform(url):
    return "tiktok" if "tiktok.com" in url else "instagram" if "instagram.com" in url else "youtube"


if __name__ == "__main__":
    sys.exit(main())
