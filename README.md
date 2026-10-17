# Depremler mi arttı, yoksa ölçüm mü genişledi?

Türkiye'de kayıtlı deprem sayısının USGS ve AFAD kataloglarıyla (1996–2025) etkileşimli veri hikâyesi (scrollytelling).

- **Canlı site:** https://saidozen-deprem.netlify.app
- **Yazar:** Said Özen · Said.ozen@icloud.com · [GitHub](https://github.com/saidozen) · [LinkedIn](https://www.linkedin.com/in/said-%C3%B6zen-7867ab43a) · [Portfolyo](https://saidozen.github.io/portfolyo/)

## Proje özeti
Soru: Türkiye'de depremler gerçekten artıyor mu, yoksa deprem izleme ağı genişlediği için mi daha fazla deprem kaydediliyor? Bulgu: USGS kataloğunda küçük deprem kaydı 2009'dan sonra çöküyor. M4 ve üzeri depremlerde düzenli bir artış görülmüyor. M4'ten küçük depremlerde ağ genişlemesinin etkisi bu veriyle ölçülemedi.

## Depo yapısı
```
README.md
data/raw/            ham veri (USGS API çıktısı, AFAD katalog dosyası)
data/processed/      analizde üretilen özet tablolar
notebooks/analiz.ipynb
site/                yayınlanan site (index.html, css/, js/, data/)
docs/storyboard.pdf
docs/tasarim_kararlari.pdf
```

## Veri kaynağı ve lisans
- USGS ComCat deprem kataloğu (FDSN event API): https://earthquake.usgs.gov/fdsnws/event/1/ — kamu malı. Koordinat kutusu: enlem 35,5–42,5, boylam 25,5–45, M2 ve üzeri, 1996–2026.
- AFAD deprem kataloğu: https://deprem.afad.gov.tr/event-instrumental — yalnızca M4 ve üzeri indirilebildi. AFAD'ın kullanım koşulları geçerlidir.
- Erişim tarihi: Ekim 2026.
- İstasyon sayıları haber ve resmî açıklamalardan derlenmiş yaklaşık değerlerdir (`site/data/istasyon_sayisi.csv`).

## Yerelde çalıştırma
1. Notebook: `notebooks/analiz.ipynb` dosyasını Google Colab veya Jupyter'da açın, "Restart & Run All" yapın. AFAD dosyasını (`afad_m4_1996_2026.csv`) çalışma klasörüne koyun.
2. Site: `cd site && python3 -m http.server 8000`, ardından http://localhost:8000. (Dosyayı çift tıklayarak açarsanız CSV'ler yüklenmez.)

## Kullanılan kütüphaneler ve kod kaynakları
- Python: pandas, numpy. Grafikler: D3.js v7 (ISC lisansı, `site/js/vendor/`). Kaydırma: Scrollama (MIT lisansı), yüklenemezse IntersectionObserver ile yedek çalışır.
- Site kodu (HTML, CSS, JavaScript) bu proje için yazılmıştır.

## Yapay zekâ kullanım beyanı
Kod yazma ve hata ayıklama desteği için Claude (Anthropic) kullanıldı: analiz hücreleri, site iskeleti, grafik kodu, storyboard ve README taslağı. Hikâye metinleri ve analiz yorumları yazarın kendisine aittir.
