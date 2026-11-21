import json,sys,re,subprocess,html,os
from concurrent.futures import ThreadPoolExecutor
G=sys.argv[1]; P=json.load(open(G+"/projects.json"))
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
def curl(url,out=None):
    a=["curl","-sL","--max-time","25","-A",UA,url]
    if out: a+=["-o",out]; subprocess.run(a); return None
    return subprocess.run(a,capture_output=True).stdout.decode("utf-8","ignore")
def find_img(page,base):
    for pat in [r'<meta[^>]+(?:property|name)=["\'](?:og:image|og:image:url|twitter:image|twitter:image:src)["\'][^>]*content=["\']([^"\']+)',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name)=["\'](?:og:image|twitter:image)["\']']:
        m=re.search(pat,page,re.I)
        if m:
            u=html.unescape(m.group(1))
            if u.startswith("//"): u="https:"+u
            elif u.startswith("/"): u=re.match(r'https?://[^/]+',base).group(0)+u
            return u
    return None
def job(i):
    cat,name,where,desc,url,img,flag=P[i]
    src=img or find_img(curl(url) or "",url)
    if not src: return i,None,"no og:image"
    raw=f"{G}/dl/{i:02d}.bin"; curl(src,raw)
    out=f"{G}/img/{i:02d}.jpg"
    r=subprocess.run(["sips","-s","format","jpeg","-s","formatOptions","72","--resampleWidth","560",raw,"--out",out],capture_output=True)
    if r.returncode or not os.path.exists(out): return i,src,"convert failed"
    return i,src,"ok"
with ThreadPoolExecutor(12) as ex:
    res=sorted(ex.map(job,range(len(P))))
for i,src,st in res: print(i,st,P[i][1],"|",(src or "")[:90])
json.dump({i:src for i,src,st in res if st=="ok"},open(G+"/imgsrc.json","w"))
