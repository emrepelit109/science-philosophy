#!/usr/bin/env python3
import json, os
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
STATS=ROOT/"stats"
STATS.mkdir(exist_ok=True)
repo=os.environ.get("GITHUB_REPOSITORY","emrepelit109/science-philosophy")
token=os.environ["GITHUB_TOKEN"]
COUNTER_KEY="science-philosophy-grokme-web-reads-2026-09-26-7c2f9a"

def api(path):
    req=Request("https://api.github.com"+path,headers={
        "Accept":"application/vnd.github+json",
        "Authorization":f"Bearer {token}",
        "X-GitHub-Api-Version":"2022-11-28",
        "User-Agent":"science-philosophy-traffic-bridge"})
    with urlopen(req,timeout=30) as r:return json.load(r)

def public_json(url):
    req=Request(url,headers={"Accept":"application/json","User-Agent":"science-philosophy-traffic-bridge"})
    with urlopen(req,timeout=30) as r:return json.load(r)

meta=api(f"/repos/{repo}")
try:
    web_reads=int(public_json(f"https://countapi.mileshilliard.com/api/v1/get/{COUNTER_KEY}").get("value",0))
except Exception:
    web_reads=0

bridge={
    "repository":repo,
    "github":{
        "stargazers":meta.get("stargazers_count",0),
        "forks":meta.get("forks_count",0),
        "open_issues":meta.get("open_issues_count",0)
    },
    "web_reads":{
        "total":web_reads,
        "counter_key":COUNTER_KEY,
        "source":"science-philosophy.grok.me"
    },
    "blogger":{
        "site":"https://emrepelit7337.blogspot.com",
        "note":"Blogger native counters are not programmatically incremented by this workflow."
    }
}

(STATS/"traffic-bridge.json").write_text(
    json.dumps(bridge,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(bridge,ensure_ascii=False))
