#!/usr/bin/env python3
import csv,json,os
from datetime import datetime,timezone
from pathlib import Path
from urllib.request import Request,urlopen

ROOT=Path(__file__).resolve().parents[1]
STATS=ROOT/"stats"
STATS.mkdir(exist_ok=True)
LATEST=STATS/"latest.json"
HISTORY=STATS/"history.csv"
SUMMARY=STATS/"history-summary.json"
BRIDGE=STATS/"traffic-bridge.json"

repo=os.environ.get("GITHUB_REPOSITORY","emrepelit109/science-philosophy")
token=os.environ["GITHUB_TOKEN"]
COUNTERS={
    "source":"science-philosophy-grokme-web-reads-2026-09-26-7c2f9a",
    "pages":"science-philosophy-github-pages-web-reads-2026-09-26-41a6d2",
    "source_views":"science-philosophy-grokme-page-views-2026-09-26-8e4d1c",
    "pages_views":"science-philosophy-github-pages-page-views-2026-09-26-5b7a2e",
}

def api(path):
    req=Request("https://api.github.com"+path,headers={
        "Accept":"application/vnd.github+json",
        "Authorization":f"Bearer {token}",
        "X-GitHub-Api-Version":"2022-11-28",
        "User-Agent":"science-philosophy-stats"})
    with urlopen(req,timeout=30) as r:
        return json.load(r)

def public_json(url):
    req=Request(url,headers={"Accept":"application/json","User-Agent":"science-philosophy-stats"})
    with urlopen(req,timeout=30) as r:
        return json.load(r)

def counter_value(key):
    try:
        return int(public_json(
            f"https://countapi.mileshilliard.com/api/v1/get/{key}"
        ).get("value",0))
    except Exception:
        return 0

meta=api(f"/repos/{repo}")
source_web_reads=counter_value(COUNTERS["source"])
pages_web_reads=counter_value(COUNTERS["pages"])
source_page_views=counter_value(COUNTERS["source_views"])
pages_page_views=counter_value(COUNTERS["pages_views"])
web_reads=source_web_reads+pages_web_reads
page_views=source_page_views+pages_page_views

baseline={}
if (STATS/"read-baseline.json").exists():
    try:
        baseline=json.loads((STATS/"read-baseline.json").read_text(encoding="utf-8"))
    except Exception:
        baseline={}
raw_authoritative=baseline.get("authoritative_net_reads")
try:
    authoritative_net_reads=int(raw_authoritative) if raw_authoritative not in (None,"") else None
except Exception:
    authoritative_net_reads=None

raw_baseline=baseline.get("blogger_net_reads")
try:
    blogger_net_reads=int(raw_baseline) if raw_baseline not in (None,"") else None
except Exception:
    blogger_net_reads=None

net_reads=authoritative_net_reads if authoritative_net_reads is not None else ((blogger_net_reads+web_reads) if blogger_net_reads is not None else None)
now=datetime.now(timezone.utc).isoformat()

traffic={
    "views_14d":None,
    "unique_views_14d":None,
    "clones_14d":None,
    "unique_clones_14d":None,
}

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
    "traffic":traffic,
    "reads":{
        "source_web_reads":source_web_reads,
        "pages_web_reads":pages_web_reads,
        "web_reads":web_reads,
        "source_page_views":source_page_views,
        "pages_page_views":pages_page_views,
        "page_views":page_views,
        "authoritative_net_reads":authoritative_net_reads,
        "blogger_net_reads":blogger_net_reads,
        "net_reads":net_reads,
        "net_reads_formula":"Authoritative website net reads" if authoritative_net_reads is not None else "Blogger native net reads + verified website reads"
    }}

LATEST.write_text(json.dumps(s,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

fieldnames=["collected_at","source_web_reads","pages_web_reads","web_reads",
            "blogger_net_reads","net_reads"]
row={k:s["reads"].get(k) for k in fieldnames if k!="collected_at"}
row["collected_at"]=now
exists=HISTORY.exists()
with HISTORY.open("a",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=fieldnames)
    if not exists:
        w.writeheader()
    w.writerow(row)

rows=[]
if HISTORY.exists():
    with HISTORY.open(newline="",encoding="utf-8") as f:
        rows=list(csv.DictReader(f))

def num(v):
    try:
        return int(v)
    except Exception:
        return 0

first_web=num(rows[0].get("web_reads")) if rows else web_reads
summary={
    "generated_at":now,
    "observations":len(rows),
    "first_recorded_web_total":first_web,
    "latest_recorded_web_total":web_reads,
    "web_total_delta":web_reads-first_web,
    "source_web_reads":source_web_reads,
    "pages_web_reads":pages_web_reads,
    "source_page_views":source_page_views,
    "pages_page_views":pages_page_views,
    "page_views":page_views,
    "authoritative_net_reads":authoritative_net_reads,
    "blogger_net_reads":blogger_net_reads,
    "net_reads":net_reads,
    "sync_interval_minutes":5,
    "note":"When authoritative_net_reads is present, the website net-read total is used directly; otherwise the legacy Blogger baseline plus verified website reads is used."
}
SUMMARY.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

bridge={
    "repository":repo,
    "collected_at":now,
    "github":{
        "stargazers":meta.get("stargazers_count",0),
        "forks":meta.get("forks_count",0),
        "open_issues":meta.get("open_issues_count",0)
    },
    "web_reads":{
        "source_site":source_web_reads,
        "github_pages":pages_web_reads,
        "total":web_reads
    },
    "blogger":{
        "site":"https://emrepelit7337.blogspot.com",
        "authoritative_net_reads":authoritative_net_reads,
        "native_net_reads":blogger_net_reads,
        "synchronized_net_reads":net_reads,
        "formula":"Authoritative website net reads" if authoritative_net_reads is not None else "Blogger native net reads + website reads",
        "native_counter_write":"not_supported"
    }
}
BRIDGE.write_text(json.dumps(bridge,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
