# Science & Philosophy

**Emre Pelit — science-philosophy**

Kaynak website: https://science-philosophy.grok.me

Bu repository, Science & Philosophy sitesinin arşivi, statik web kabuğu ve GitHub etkileşim istatistikleri için oluşturulmuştur.

## Yapı

- `index.html` — arşiv ana sayfası
- `content/ARTICLE_CATALOG.md` — içerik kataloğu
- `stats/latest.json` — son GitHub metrikleri
- `stats/history.csv` — zaman serisi
- `scripts/update_stats.py` — istatistik toplayıcı
- `.github/workflows/update-stats.yml` — otomatik güncelleme

## Etkileşim istatistikleri

GitHub Actions, repository'nin GitHub API üzerinden erişilebilen trafik ve etkileşim metriklerini **6 saatte bir** toplar ve `stats/` altında geçmişini saklar.

GitHub traffic API rolling bir pencere ve gecikmeli veri sağlayabildiğinden, panel "en güncel erişilebilir GitHub verisi" mantığıyla çalışır; sıfır gecikmeli gerçek zamanlı ölçüm değildir.

## İçerik aktarım durumu

Kaynak `science-philosophy.grok.me` bu çalışma ortamından okunabilir HTML içeriği döndürmediği için, kaynak sitedeki tam makale metinlerinin birebir kopyası şu aşamada doğrulanarak alınamamıştır. Bu nedenle repository, erişilebilen içerik kataloğunu ve yayın altyapısını içerir; tam metin arşivi olduğu iddia edilmez.

Kaynak site/export dosyaları erişilebilir olduğunda `content/` altında birebir arşiv eklenebilir.
