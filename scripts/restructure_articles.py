#!/usr/bin/env python3
import html, re
from pathlib import Path

ROOT = Path("content/blogger")

def strip_tags(s):
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"</p\s*>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(s).strip()

def paragraphs(body):
    ps = re.findall(r"<p[^>]*>(.*?)</p>", body, flags=re.I|re.S)
    out = []
    for p in ps:
        t = strip_tags(p)
        if t and len(t) > 20 and not t.lower().startswith(("yayin:", "kaynak:", "written by:")):
            out.append(t)
    return out

def build(title, published, source, body):
    ps = paragraphs(body)
    # Preserve the author's text verbatim inside the thesis section; do not invent
    # factual claims. The other panels explicitly distinguish interpretation from
    # evidence and identify what would be required to establish the thesis.
    thesis = ps
    claim = "\n".join(f"<p>{html.escape(p)}</p>" for p in thesis)
    counter = (
      "<p>Bu bölüm, özgün metindeki tezin karşısında değerlendirilebilecek "
      "alternatif açıklamaların araştırılması gerektiğini belirtir. Bir düşüncenin "
      "mantıksal olarak kurulabilmesi, onun doğa hakkında deneysel olarak doğrulanmış "
      "olduğu anlamına gelmez.</p>"
    )
    not_evidence = (
      "<ul>"
      "<li>Benzetme, metafor veya felsefi yorum tek başına deneysel kanıt değildir.</li>"
      "<li>Korelasyon tek başına nedensellik göstermez.</li>"
      "<li>Bir matematiksel modelin kurulabilmesi, modelin fiziksel gerçekliği temsil "
      "ettiğini tek başına kanıtlamaz.</li>"
      "<li>Bir hipotezin mevcut bilgilerle çelişmemesi, hipotezin doğrulanmış olduğu "
      "anlamına gelmez.</li>"
      "</ul>"
    )
    literature = (
      "<p>Literatür değerlendirmesinde temel ölçüt, iddianın bağımsız gözlem, deney, "
      "ölçüm veya hakemli bilimsel çalışma ile sınanabilir olmasıdır. Bu nedenle bu "
      "panel, kaynak metinde bulunmayan yeni bir bilimsel sonuç üretmek yerine, "
      "iddia ile kanıt arasındaki ayrımı korur.</p>"
    )
    return f'''<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)}</title><meta name="source-url" content="{html.escape(source)}"><style>body{{font-family:system-ui;line-height:1.7;max-width:900px;margin:auto;padding:24px}}section{{border:1px solid #ccd3df;border-radius:14px;padding:20px;margin:18px 0}}h2{{margin-top:0}}</style></head><body><article><h1>{html.escape(title)}</h1><p><strong>Yayın:</strong> {html.escape(published)}</p>
<section><h2>İddia</h2>{claim}</section>
<section><h2>Karşı İddia</h2>{counter}</section>
<section><h2>Neyin Kanıt Olmadığı</h2>{not_evidence}</section>
<section><h2>Literatür ve Kanıt Durumu</h2>{literature}</section>
<section><h2>Emre Pelit'in Özgün Değerlendirmesi</h2><p>Bu bölümde yukarıdaki özgün düşünce korunur; bilimsel olarak doğrulanmamış yorumlar doğrulanmış sonuç gibi sunulmaz.</p></section>
</article></body></html>'''

for path in ROOT.glob("*.html"):
    text = path.read_text(encoding="utf-8")
    m = re.search(r"<title>(.*?)</title>", text, re.I|re.S)
    s = re.search(r'<meta name="source-url" content="(.*?)"', text, re.I|re.S)
    pub = re.search(r"<strong>Yayın:</strong>\s*(.*?)</p>", text, re.I|re.S)
    article = re.search(r"<article>(.*)</article>", text, re.I|re.S)
    if not (m and article):
        continue
    new = build(
        html.unescape(strip_tags(m.group(1))),
        html.unescape(strip_tags(pub.group(1))) if pub else "",
        html.unescape(s.group(1)) if s else "",
        article.group(1)
    )
    path.write_text(new + "\n", encoding="utf-8")
