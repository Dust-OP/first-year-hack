import json, subprocess, sys, os, re, tempfile, shutil
S = sys.argv[1]; RAW = os.path.join(S, "raw")
CH = os.path.expanduser("~/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell")
SIZES = {"d": "1280,800", "m": "412,860"}
UA_M = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36"
log = {}
def page(url, size, out):
    prof = tempfile.mkdtemp(prefix="chprof-")
    args = [CH, "--headless", "--hide-scrollbars", "--no-first-run", f"--user-data-dir={prof}",
            "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
            f"--window-size={SIZES[size]}", "--virtual-time-budget=9000", f"--screenshot={out}"]
    if size == "m": args.append(f"--user-agent={UA_M}")
    try:
        subprocess.run(args + [url], timeout=40, capture_output=True)
    except subprocess.TimeoutExpired:
        pass
    shutil.rmtree(prof, ignore_errors=True)
    return os.path.exists(out) and os.path.getsize(out) > 2000
def img(url, out):
    r = subprocess.run(["curl", "-sL", "--max-time", "30", "--max-filesize", "15000000", "-o", out, "-w", "%{http_code} %{content_type}", url], capture_output=True, text=True)
    ok = r.stdout.startswith("200") and os.path.exists(out) and os.path.getsize(out) > 2000
    if not ok and os.path.exists(out): os.remove(out)
    return ok, r.stdout
def readme_imgs(repo):
    r = subprocess.run(["gh", "api", f"repos/{repo}/readme", "-H", "Accept: application/vnd.github.html"], capture_output=True, text=True)
    srcs = re.findall(r'<img[^>]*src="([^"]+)"', r.stdout)
    return [s.replace("&amp;", "&") for s in srcs if not re.search(r"shields|badge|\.svg", s)][:2]
for cid, shots in json.load(open(os.path.join(S, "tools", "manifest.json"))):
    log[cid] = []
    n = 0
    for shot in shots:
        kind = shot[0]
        if kind == "page":
            n += 1; out = os.path.join(RAW, f"{cid}-{n}-page.png")
            ok = page(shot[1], shot[2], out); log[cid].append(["page", shot[1], shot[2], ok, os.path.basename(out) if ok else None])
        elif kind == "img":
            n += 1; out = os.path.join(RAW, f"{cid}-{n}-img")
            ok, info = img(shot[1], out); log[cid].append(["img", shot[1], info, ok, os.path.basename(out) if ok else None])
        elif kind == "readme":
            for u in readme_imgs(shot[1]):
                n += 1; out = os.path.join(RAW, f"{cid}-{n}-img")
                ok, info = img(u, out); log[cid].append(["readme-img", f"README of {shot[1]}", info, ok, os.path.basename(out) if ok else None])
    print(cid, [x[3] for x in log[cid]], flush=True)
json.dump(log, open(os.path.join(S, "tools", "capture-log.json"), "w"), indent=1)
