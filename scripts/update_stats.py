#!/usr/bin/env python3
import csv,json,os
from datetime import datetime,timezone
from pathlib import Path
from urllib.request import Request,urlopen

ROOT=Path(__file__).resolve().parents[1]
STATS=ROOT/"stats"; STATS.mkdir(exist_ok=True)
LATEST=STATS/"latest.json"; HISTORY=STATS/"history.csv"
repo=os.environ.get("GITHUB_REPOSITORY","emrepelit109/science-philosophy")
token=os.environ["GITHUB_TOKEN"]
COUNTER_KEY="science-philosophy-grokme-web-reads-2026-09-26-7c2f9a"
COUNTER_URL=f"https://countapi.mileshilliard.com/api/v1/get/{COUNTER_KEY}"

def api(path):
    req=Request("https://api.github.com"+path,headers={
        "Accept":"application/vnd.github+json",
        "Authorization":f"Bearer {token}",
        "X-GitHub-Api-Version":"2022-11-28",
        "User-Agent":"science-philosophy-stats"})
    with urlopen(req,timeout=30) as r: return json.load(r)

def public_json(url):
    req=Request(url,headers={"Accept":"application/json","User-Agent":"science-philosophy-stats"})
    with urlopen(req,timeout=30) as r:return json.load(r)

meta=api(f"/repos/{repo}")
views=api(f"/repos/{repo}/traffic/views")
clones=api(f"/repos/{repo}/traffic/clones")
try:
    web_reads=int(public_json(COUNTER_URL).get("value",0))
except Exception:
    web_reads=0

now=datetime.now(timezone.utc).isoformat()
s={
"collected_at":now,
"repository":{
"full_name":meta.get("full_name"),
"stargazers_count":meta.get("stargazers_count",0),
"watchers_count":meta.get("watchers_count",0),
"forks_count":meta.get("forks_count",0),
"open_issues_count":meta.get("open_issues_count",0),
"subscribers_count":meta.get("subscribers_count",0),
"size_kb":meta.get("size",0)},
"traffic":{
"views_14d":views.get("count",0),
"unique_views_14d":views.get("uniques",0),
"clones_14d":clones.get("count",0),
"unique_clones_14d":clones.get("uniques",0)},
"reads":{
"web_reads":web_reads}}

LATEST.write_text(json.dumps(s,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
row={"collected_at":now,**s["repository"],**s["traffic"],**s["reads"]}
exists=HISTORY.exists()
with HISTORY.open("a",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=row.keys())
    if not exists:w.writeheader()
    w.writerow(row)
