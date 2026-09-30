#!/usr/bin/env python3
import json, re, urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

FEED = "https://emrepelit7337.blogspot.com/feeds/posts/default?alt=json&max-results=500"
OUT = Path("content")
OUT.mkdir(parents=True, exist_ok=True)

def clean_html(value):
    value = re.sub(r"<script[\s\S]*?</script>", "", value or "", flags=re.I)
    value = re.sub(r"<style[\s\S]*?</style>", "", value or "", flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", unescape(value)).strip()

def slug_from_url(url, fallback):
    m = re.search(r"/(\d{4}/\d{2}/[^/?#]+)\.html", url or "")
    if m: return m.group(1).replace("/", "-")
    return re.sub(r"[^a-z0-9-]+", "-", fallback.lower()).strip("-") or "article"

with urllib.request.urlopen(FEED, timeout=30) as response:
    feed = json.load(response)

entries = feed.get("feed", {}).get("entry", [])
catalog = []

for entry in entries:
    title = entry.get("title", {}).get("$t", "Untitled")
    content = entry.get("content", {}).get("$t", "")
    published = entry.get("published", {}).get("$t", "")
    updated = entry.get("updated", {}).get("$t", "")
    links = entry.get("link", [])
    url = next((x.get("href") for x in links if x.get("rel") == "alternate"), "")
    slug = slug_from_url(url, title)
    body = clean_html(content)
    text = f"# {title}\n\n- Kaynak: {url}\n- Yayınlanma: {published}\n- Güncellenme: {updated}\n\n{body}\n"
    (OUT / f"{slug}.md").write_text(text, encoding="utf-8")
    catalog.append({"title": title, "url": url, "published": published, "updated": updated, "file": f"content/{slug}.md"})

catalog.sort(key=lambda x: x.get("published", ""), reverse=True)
(OUT / "ARTICLE_CATALOG.json").write_text(json.dumps({
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "source": FEED,
    "article_count": len(catalog),
    "articles": catalog
}, ensure_ascii=False, indent=2), encoding="utf-8")

lines = ["# Article Catalog", "", f"Automatically synchronized from {FEED}.", "", f"Article count: **{len(catalog)}**", ""]
for item in catalog:
    lines.append(f"- [{item['title']}]({item['file']}) — {item['url']}")
(OUT / "ARTICLE_CATALOG.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Synchronized {len(catalog)} Blogger articles.")
