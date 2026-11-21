import json, os, sys, shutil
from urllib.parse import urlparse
S, OUT = sys.argv[1], sys.argv[2]
items = json.load(open(f"{S}/tools/items.json"))
man = {k: v for k, v in json.load(open(f"{S}/tools/manifest.json"))}
files = sorted(os.listdir(f"{S}/img"))
FIRST = {"g01":"g01-2","g08":"g08-3","g09":"g09-2","g10":"g10-2","g12":"g12-2","g16":"g16-3","g22":"g22-2","g23":"g23-2","c16":"c16-1","c17":"c17-1","g24":"g24-1","g25":"g25-1"}
SPECIAL = {
 "g08-3": ("Rendered sample", "Rendered by us with the library's BRASS, BROWN and ANTHRACITE presets (steelseries-min.js)"),
 "g08-2": ("Library demo", "The library's own demoExtras.html, default metal frame, rendered locally"),
 "g24-1": ("Asset preview", "Poly Haven asset thumbnail"),
 "c16-1": ("Video thumbnail", "YouTube thumbnail of the maker's video"),
 "l06-1": ("Video thumbnail", "YouTube thumbnail linked from the README"),
 "g20-1": ("README image", "Image from the project's README"),
}
NOIMG = {
 "g17":"The project publishes no screenshot and has no live deployment.",
 "g18":"The live portfolio's landing page doesn't show the compass; it sits inside the 3D watch.",
 "g19":"The README's demo GIF and its site no longer load.",
 "g26":"The live sextant page returned 404.",
 "c08":"Product Hunt blocked the automated screenshot with a bot check.",
 "c09":"Product Hunt blocked the automated screenshot with a bot check.",
 "c11":"The iOS app has no public web page; only the HN thread exists.",
 "c13":"The write-up has no screenshot of the wayfinder itself.",
}
def meta(cid, f):
    stem = f.rsplit(".",1)[0]; n = int(stem.split("-")[1]); kind = stem.split("-")[2]
    key="-".join(stem.split("-")[:2])
    if key in SPECIAL: return SPECIAL[key]
    shots = man.get(cid, []); flat = []
    for s in shots:
        flat.append(s)
    if kind == "page":
        page_shots = [s for s in shots if s[0]=="page"]
        # find the shot by order index n among all entries
        idx = 0; target = None
        for s in shots:
            if s[0] in ("page","img"): idx += 1
            else: idx += 1
            if idx == n: target = s
        url = target[1] if target and target[0]=="page" else (page_shots[0][1] if page_shots else "")
        size = (target[2] if target and target[0]=="page" else "d")
        host = urlparse(url).netloc.replace("www.","")
        return ("Live page", f"Screenshot of {host}, {'phone' if size=='m' else 'desktop'} width, 21 Nov 2026, no compass sensor")
    if kind == "img":
        return ("Project image", "Screenshot published by the project (README, site or store)")
    return ("Image", "")
for it in items:
    mine = [f for f in files if f.startswith(it["id"]+"-")]
    first = FIRST.get(it["id"])
    mine.sort(key=lambda f: (0 if first and f.startswith(first+".") or (first and f.startswith(first+"-")) else 1, f))
    imgs = []
    for f in mine:
        shutil.copy(f"{S}/img/{f}", f"{OUT}/img/{f}")
        label, cap = meta(it["id"], f)
        imgs.append({"f": f"img/{f}", "label": label, "cap": cap})
    it["imgs"] = imgs
    if not imgs: it["noimg"] = NOIMG.get(it["id"], "No screenshot available.")
html = open(f"{S}/tools/template.html").read().replace("/*DATA*/[]", json.dumps(items, ensure_ascii=False))
open(f"{OUT}/index.html","w").write(html)
print(len(items), "items;", sum(1 for i in items if i["imgs"]), "with images;", sum(len(i["imgs"]) for i in items), "images")
print("no image:", [i["id"] for i in items if not i["imgs"]])
