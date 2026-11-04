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
    for ua in (FT.UA_PREVIEW, "Twitterbot/1.0"):
        try:
            body, _ = FT.get(url, ua=ua)
            out = {"title": meta_tag(body, "og:title"), "description": meta_tag(body, "og:description"),
                   "image": meta_tag(body, "og:image")}
            if out["title"] or out["description"]:
                return out
            last = f"no preview tags in {len(body)} bytes"
        except Exception as exc:  # noqa: BLE001
            last = str(exc)
    raise ValueError(last or "no preview")


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
