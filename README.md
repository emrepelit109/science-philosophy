# Science & Philosophy

**Emre Pelit — science-philosophy**

## Bağlantılar

- Kaynak website: https://science-philosophy.grok.me
- GitHub: https://github.com/emrepelit109/science-philosophy
- GitHub Pages: https://emrepelit109.github.io/science-philosophy
- Blogger: https://emrepelit7337.blogspot.com

Bu repository, Science & Philosophy sitesinin arşivi, statik web kabuğu ve GitHub etkileşim istatistikleri için oluşturulmuştur.

## Yapı

- `index.html` — arşiv ana sayfası
- `content/ARTICLE_CATALOG.md` — içerik kataloğu
- `stats/latest.json` — son GitHub metrikleri
- `stats/history.csv` — zaman serisi
- `scripts/update_stats.py` — istatistik toplayıcı
- `.github/workflows/update-stats.yml` — 5 dakikada bir istatistik güncelleme
- `.github/workflows/sync-blogger.yml` — 5 dakikada bir Blogger arşiv senkronu

## Etkileşim istatistikleri

GitHub Actions, repository'nin GitHub API üzerinden erişilebilen trafik ve etkileşim metriklerini **5 dakikada bir** toplar ve `stats/` altında geçmişini saklar.

Blogger yönetim paneli istatistikleri (blogger.com/u/0/blog/posts/...) dışarıdan okunamaz. Senkron, herkese açık Blogger feed'i (`emrepelit7337.blogspot.com`) ile GitHub arşivi ve sitedeki sayım katmanı üzerinden yapılır.
