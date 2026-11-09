#!/usr/bin/env python3
"""Stamp index.html's links to assets/hub.css and assets/hub.js with a hash of each file (?v=…).

    python3 scripts/stamp_assets.py

Phones and browsers keep CSS/JS for a while; a new ?v= value makes them fetch the new file right after a push.
validate.py fails when a stamp is stale, so run this after changing either file.
"""
import hashlib
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = ("assets/hub.css", "assets/hub.js")


def stamp(rel):
    return hashlib.sha1(open(os.path.join(ROOT, rel), "rb").read()).hexdigest()[:10]


def stamped(html):
    for rel in ASSETS:
        html = re.sub(re.escape(rel) + r'(\?v=[0-9a-f]+)?"', f'{rel}?v={stamp(rel)}"', html)
    return html


def main():
    p = os.path.join(ROOT, "index.html")
    old = open(p, encoding="utf-8").read()
    new = stamped(old)
    if new != old:
        open(p, "w", encoding="utf-8").write(new)
    print("index.html:", ", ".join(f"{r}?v={stamp(r)}" for r in ASSETS))
    return 0


if __name__ == "__main__":
    sys.exit(main())
