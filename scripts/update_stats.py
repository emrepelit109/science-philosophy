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
    "website_web":"science-philosophy-grokme-web-reads-2026-09-26-7c2f9a",
    "github":"science-philosophy-github-pages-web-reads-2026-09-26-41a6d2",
    "website_views":"science-philosophy-grokme-page-views-2026-09-26-8e4d1c",
    "github_views":"science-philosophy-github-pages-page-views-2026-09-26-5b7a2e",
    "blogger_new":"science-philosophy-blogger-new-post-reads-2026-09-30-b4e71c",
    "app":"science-philosophy-grokme-app-reads-2026-09-30-a91f4e"
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
website_web_reads=counter_value(COUNTERS["website_web"])
github_reads=counter_value(COUNTERS["github"])
website_page_views=counter_value(COUNTERS["website_views"])
github_page_views=counter_value(COUNTERS["github_views"])
blogger_new_reads=counter_value(COUNTERS["blogger_new"])
app_reads=counter_value(COUNTERS["app"])

baseline={}
if (STATS/"read-baseline.json").exists():
    try:
        baseline=json.loads((STATS/"read-baseline.json").read_text(encoding="utf-8"))
    except Exception:
        baseline={}

def baseline_int(key):
    try:
        return int(baseline.get(key,0) or 0)
    except Exception:
        return 0

blogger_post_reads=baseline_int("blogger_post_reads_baseline")+blogger_new_reads
github_total=baseline_int("github_reads_baseline")+github_reads
website_total=baseline_int("website_web_reads_baseline")+website_web_reads
app_total=baseline_int("website_app_reads_baseline")+app_reads
net_reads=blogger_post_reads+github_total+website_total+app_total
web_reads=website_total+github_total
page_views=baseline_int("website_page_views_baseline")+website_page_views+baseline_int("github_pages_page_views_baseline")+github_page_views

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
        "blogger_post_reads":blogger_post_reads,
        "github_reads":github_total,
        "website_web_reads":website_total,
        "website_app_reads":app_total,
        "web_reads":web_reads,
        "page_views":page_views,
        "net_reads":net_reads,
        "net_reads_formula":"Blogger post reads + GitHub reads + website web reads + website app reads"
    }}

LATEST.write_text(json.dumps(s,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

fieldnames=["collected_at","blogger_post_reads","github_reads","website_web_reads","website_app_reads","web_reads","net_reads"]
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
    "blogger_post_reads":blogger_post_reads,
    "github_reads":github_total,
    "website_web_reads":website_total,
    "website_app_reads":app_total,
    "web_reads":web_reads,
    "page_views":page_views,
    "net_reads":net_reads,
    "sync_interval_minutes":5,
    "formula":"Blogger post reads + GitHub reads + website web reads + website app reads"
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
    "reads":{
        "blogger_post_reads":blogger_post_reads,
        "github_reads":github_total,
        "website_web_reads":website_total,
        "website_app_reads":app_total,
        "net_reads":net_reads,
        "page_views":page_views
    },
    "formula":"Blogger post reads + GitHub reads + website web reads + website app reads",
    "native_blogger_counter_write":"not_supported_by_public_blogger_feed"
}
BRIDGE.write_text(json.dumps(bridge,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
