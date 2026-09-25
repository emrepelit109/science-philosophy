#!/usr/bin/env python3
import json, os, re, html as htmlmod
from datetime import datetime
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"content"/"blogger"; OUT.mkdir(parents=True,exist_ok=True)
BLOG=os.environ.get("BLOGGER_URL","https://emrepelit7337.blogspot.com").rstrip("/")
BASE=BLOG+"/feeds/posts/default"
HEADERS={"User-Agent":"science-philosophy-blog-archive/1.0"}

def get_json(start_index):
    req=Request(f"{BASE}?alt=json&max-results=100&start-index={start_index}",headers=HEADERS)
    with urlopen(req,timeout=60) as r:return json.load(r)

def clean(v):
    v=htmlmod.unescape(v or "")
    v=re.sub(r"<script[\s\S]*?</script>","",v,flags=re.I)
    v=re.sub(r"<style[\s\S]*?</style>","",v,flags=re.I)
    return v.strip()

def alt_url(e):
    for l in e.get("link",[]):
        if l.get("rel")=="alternate":return l.get("href","")
    return ""

def slug(title,eid):
    s=re.sub(r"[^\w\- ]+","",title.lower(),flags=re.UNICODE)
    s=re.sub(r"\s+","-",s).strip("-")
    return (s[:100] or "post")+"-"+eid[-8:]

posts=[];start=1
while True:
    entries=get_json(start).get("feed",{}).get("entry",[])
    if not entries:break
    posts.extend(entries)
    if len(entries)<100:break
    start+=len(entries)

seen=set();rows=["# Blogger Makale Arşivi","","Kaynak: "+BLOG,""]
for e in posts:
    eid=e.get("id",{}).get("$t","")
    if eid in seen:continue
    seen.add(eid)
    title=e.get("title",{}).get("$t","Untitled")
    published=e.get("published",{}).get("$t","")
    url=alt_url(e)
    body=clean((e.get("content") or e.get("summary") or {}).get("$t",""))
    try:date=datetime.fromisoformat(published.replace("Z","+00:00")).strftime("%Y-%m-%d")
    except Exception:date="undated"
    filename=slug(title,eid.replace(":",""))+".html"
    doc='<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+htmlmod.escape(title)+'</title><meta name="source-url" content="'+htmlmod.escape(url)+'"></head><body><article><h1>'+htmlmod.escape(title)+'</h1><p><strong>Yayın:</strong> '+htmlmod.escape(published)+'</p><p><strong>Kaynak:</strong> <a href="'+htmlmod.escape(url)+'">'+htmlmod.escape(url)+'</a></p><hr>'+body+'</article></body></html>\n'
    (OUT/filename).write_text(doc,encoding="utf-8")
    rows.append(f"- [{title}](./{filename}) — {date}")
(OUT/"INDEX.md").write_text("\n".join(rows)+"\n",encoding="utf-8")
(OUT/"manifest.json").write_text(json.dumps({"source":BLOG,"feed":BASE,"posts_synced":len(seen),"synced_at_utc":datetime.utcnow().isoformat()+"Z"},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"Synced {len(seen)} Blogger posts.")
