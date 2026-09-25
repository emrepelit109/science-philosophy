#!/usr/bin/env python3
import json, os
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
STATS=ROOT/"stats"
STATS.mkdir(exist_ok=True)
repo=os.environ.get("GITHUB_REPOSITORY","emrepelit109/science-philosophy")
token=os.environ["GITHUB_TOKEN"]

def api(path):
    req=Request("https://api.github.com"+path,headers={
        "Accept":"application/vnd.github+json",
        "Authorization":f"Bearer {token}",
        "X-GitHub-Api-Version":"2022-11-28",
        "User-Agent":"science-philosophy-traffic-bridge"})
    with urlopen(req,timeout=30) as r:return json.load(r)

traffic=api(f"/repos/{repo}/traffic/views")
meta=api(f"/repos/{repo}")

bridge={
    "repository":repo,
    "github":{
        "views_14d":traffic.get("count",0),
        "unique_views_14d":traffic.get("uniques",0),
        "stargazers":meta.get("stargazers_count",0),
        "forks":meta.get("forks_count",0)
    },
    "blogger":{
        "site":"https://emrepelit7337.blogspot.com",
        "note":"Blogger native counters reflect genuine page visits; they are not programmatically incremented by this workflow."
    },
    "conversion_goal":"Turn genuine GitHub discovery into genuine Blogger visits through visible links and content distribution."
}

(STATS/"traffic-bridge.json").write_text(
    json.dumps(bridge,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(bridge,ensure_ascii=False))
