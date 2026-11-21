import json,sys,os
G=sys.argv[1]; P=json.load(open(G+"/projects.json"))
items=[]
for i,(cat,name,where,desc,url,img,flag) in enumerate(P):
    has=os.path.exists(f"{G}/img/{i:02d}.jpg")
    items.append({"n":i+1,"c":cat,"t":name,"w":where,"d":desc,"u":url,"i":f"img/{i:02d}.jpg" if has else None,"f":flag})
data=json.dumps(items,ensure_ascii=False)
tpl=open(G+"/template.html").read()
open(G+"/compass-prior-art.html","w").write(tpl.replace("/*DATA*/[]",data))
print(len(items),"items;",sum(1 for x in items if x["i"]),"with images")
