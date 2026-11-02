#!/usr/bin/env python3
"""Bundle the hub into ONE self-contained HTML file (CSS, JS and all data inlined).

Used for the private claude.ai Artifact preview and for offline sharing.
Usage:  python3 scripts/build_single_file.py [OUTPUT_PATH]
Default output: dist/cb-viral-content-hub.html (dist/ is git-ignored).

The single-file build sets window.__HUB_DATA__.mode = "single", which makes the app
link out to TikTok/Instagram/YouTube instead of embedding players (embeds are blocked there).
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(*p):
    with open(os.path.join(ROOT, *p), encoding="utf-8") as fh:
        return fh.read()


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "dist", "cb-viral-content-hub.html")
    html = read("index.html")
    head = re.search(r"<!-- HEAD:START -->(.*?)<!-- HEAD:END -->", html, re.S).group(1).strip()
    body = re.search(r"<!-- BODY:START -->(.*?)<!-- BODY:END -->", html, re.S).group(1).strip()
    css = read("assets", "hub.css")
    js = read("assets", "hub.js")

    manifest = json.loads(read("data", "manifest.json"))
    library = json.loads(read("data", "library.json"))
    weeks = {w["id"]: json.loads(read("data", "weeks", w["id"] + ".json")) for w in manifest["weeks"]}
    data = {"mode": "single", "manifest": manifest, "library": library, "weeks": weeks}
    # </script> inside JSON strings would close the tag early
    data_js = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

    page = "\n".join([
        head,
        "<style>\n" + css + "\n</style>",
        body,
        "<script>window.__HUB_DATA__=" + data_js + ";</script>",
        "<script>\n" + js + "\n</script>",
    ])
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(page)
    print(f"wrote {out} ({len(page) / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
