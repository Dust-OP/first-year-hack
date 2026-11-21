#!/usr/bin/env python3
"""Download the source images listed in manifest.json files.

Usage: python3 fetch_images.py <set_dir> [<set_dir> ...]

For each row whose "file" (relative to the set dir) is missing, fetch
"image_url" and save it as PNG (ffmpeg converts WebP and JPEG). Files that
already exist are skipped. Safari icons come from Wayback Machine copies of
the Logopedia fan wiki, because Logopedia's own image server blocks scripts.
"""
import json, os, shutil, subprocess, sys, tempfile, time, urllib.request

FF = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
UA = {"User-Agent": "research-client/1.0"}

for d in sys.argv[1:]:
    for row in json.load(open(os.path.join(d, "manifest.json"))):
        dst = os.path.normpath(os.path.join(d, row["file"]))
        if os.path.exists(dst):
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        for attempt in range(3):
            try:
                req = urllib.request.Request(row["image_url"], headers=UA)
                data = urllib.request.urlopen(req, timeout=60).read()
                break
            except Exception as e:
                print(f"retry {row['file']}: {e}"); time.sleep(10)
        else:
            sys.exit(f"failed: {row['image_url']}")
        with tempfile.NamedTemporaryFile(delete=False) as t:
            t.write(data)
        if dst.lower().endswith(".png"):
            subprocess.run([FF, "-loglevel", "error", "-y", "-i", t.name, "-frames:v", "1", dst], check=True)
        else:
            shutil.copyfile(t.name, dst)
        os.unlink(t.name)
        print("saved", dst)
        time.sleep(2)
