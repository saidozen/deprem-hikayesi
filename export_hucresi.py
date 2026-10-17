# Colab'da EN SONA ekle ve çalıştır. `df` temizlenmiş USGS tablosu (turkiye süzgeçli) olmalı.
# Notebook'taki değişken adı farklıysa ilk satırı ona göre değiştir.
import pandas as pd, numpy as np, os
os.makedirs("site/data", exist_ok=True)
t = turkiye.copy()                      # <- Türkiye süzgeçli tablon (yoksa df kullan)
t["yil"] = pd.to_datetime(t["time"], utc=True).dt.year
t = t[t["yil"].between(1996, 2025)]
t["bolgesel"] = t["magSource"].isin(["isk", "ath", "the"])

def mc(m):                              # histogram tepe noktası (kaba)
    h = np.histogram(m.dropna(), bins=np.arange(1.0, 8.05, 0.1))
    return round(float(h[1][h[0].argmax()]), 1)

g = t.groupby("yil")
yillik = pd.DataFrame({
    "toplam": g.size(),
    "m4_alti": g["mag"].apply(lambda s: (s < 4).sum()),
    "m4_ustu": g["mag"].apply(lambda s: (s >= 4).sum()),
    "m5_ustu": g["mag"].apply(lambda s: (s >= 5).sum()),
    "mc": g["mag"].apply(mc),
    "bolgesel_pay": g["bolgesel"].mean().round(3),
}).reset_index()
yillik.to_csv("site/data/usgs_yillik.csv", index=False)
kars.to_csv("site/data/karsilastirma_m4_m5.csv")   # zaten hazır olan karşılaştırma tablosu
print(yillik.head(), yillik.shape)
