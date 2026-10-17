/* Depremler mi arttı, ölçüm mü? – scrollytelling
   Tüm grafik değerleri data/ klasöründeki CSV dosyalarından okunur. */
(function () {
  "use strict";

  const COL = { usgs: "#0072B2", afad: "#D55E00", gray: "#6b7580" };
  const tr = d3.formatLocale({ decimal: ",", thousands: ".", grouping: [3], currency: ["", " ₺"] });
  const fmt = tr.format(",.0f");
  const fmt1 = tr.format(",.1f");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => window.matchMedia("(max-width:860px)").matches;

  // Yaygın bilinen büyük depremler. Yıllar yazar tarafından kaynaktan doğrulanmalıdır.
  const OLAYLAR = [
    { yil: 1999, ad: "İzmit–Düzce" },
    { yil: 2011, ad: "Van" },
    { yil: 2020, ad: "Elazığ" },
    { yil: 2023, ad: "Kahramanmaraş" }
  ];

  const state = { data: null, view: "toplam", esik: "m4", bas: 1996, bit: 2025 };
  const chartEl = d3.select("#chart");
  const tip = d3.select(chartEl.node().parentNode).append("div").attr("class", "tip");
  d3.select(chartEl.node().parentNode).style("position", "sticky");

  /* ---------- veri ---------- */
  const num = v => (v === "" || v == null ? NaN : +String(v).replace(",", "."));

  function yukle() {
    return Promise.all([
      d3.csv("data/usgs_yillik.csv"),
      d3.csv("data/karsilastirma_m4_m5.csv"),
      d3.csv("data/istasyon_sayisi.csv")
    ]).then(([u, k, s]) => {
      const usgs = u.map(r => ({
        yil: num(r.yil), toplam: num(r.toplam), m4alti: num(r.m4_alti),
        m4: num(r.m4_ustu), m5: num(r.m5_ustu), mc: num(r.mc), pay: num(r.bolgesel_pay)
      })).filter(r => r.yil);
      const kk = Object.keys(k[0]);
      const yilKey = kk[0];
      const bul = (desen) => kk.find(x => desen.test(x));
      const ak4 = bul(/afad.*m?4/i), uk4 = bul(/usgs.*m?4/i), ak5 = bul(/afad.*m?5/i), uk5 = bul(/usgs.*m?5/i);
      if (!ak4 || !uk4 || !ak5 || !uk5) throw new Error("karsilastirma_m4_m5.csv sütun adları tanınamadı");
      const kars = k.map(r => ({
        yil: num(r[yilKey]), a4: num(r[ak4]), u4: num(r[uk4]), a5: num(r[ak5]), u5: num(r[uk5])
      })).filter(r => r.yil);
      const ist = s.map(r => ({ yil: num(r.yil), kurum: r.kurum, n: num(r.istasyon), kaynak: r.kaynak }))
        .filter(r => r.yil && r.n);
      return { usgs, kars, ist };
    });
  }

  /* ---------- görünüm tanımları ---------- */
  function seri(rows, key, ad, renk, tur) {
    return { ad, renk, tur: tur || "line",
      veri: rows.filter(r => r[key] === r[key] && r.yil >= state.bas && r.yil <= state.bit).map(r => ({ x: r.yil, y: r[key] })) };
  }

  function gorunum(v) {
    const d = state.data;
    const pctRows = d.usgs.map(r => ({ yil: r.yil, pay: r.pay <= 1 ? r.pay * 100 : r.pay }));
    switch (v) {
      case "toplam":
      case "toplam-2009":
        return {
          baslik: v === "toplam" ? "USGS'de kayıtlı deprem sayısı yıldan yıla çok oynuyor" : "USGS'de kayıtlı deprem sayısı 2009'dan sonra çöktü", alt: "M2 ve üzeri, yıllık sayı", kaynak: "Kaynak: USGS ComCat, yer adında Türkiye geçen kayıtlar, M2 ve üzeri, 1996–2025. Erişim: Ekim 2026.",
          paneller: [{ yEtiket: "Deprem sayısı (adet/yıl)", seriler: [seri(d.usgs, "toplam", "USGS toplam", COL.usgs, "bar")],
            dikey: v === "toplam-2009" ? [{ x: 2009, ad: "2009" }] : [] }]
        };
      case "mc":
        return {
          baslik: "Katalogun yakaladığı en küçük deprem 2009'da büyüdü", alt: "Yıllık tamlık büyüklüğü (Mc), kaba tahmin", kaynak: "Kaynak: USGS ComCat, yer adında Türkiye geçen kayıtlar, M2 ve üzeri, 1996–2025. Erişim: Ekim 2026.",
          paneller: [{ yEtiket: "Mc (büyüklük)", alan: [2, 5], seriler: [seri(d.usgs, "mc", "Mc", COL.usgs, "line")], dikey: [{ x: 2009, ad: "2009" }] }]
        };
      case "pay":
        return {
          baslik: "Bölgesel kaynakların payı 2009'da düştü", alt: "isk, ath, the kodlu kayıtların oranı", kaynak: "Kaynak: USGS ComCat, yer adında Türkiye geçen kayıtlar, M2 ve üzeri, 1996–2025. Erişim: Ekim 2026.",
          paneller: [{ yEtiket: "Pay (%)", alan: [0, 100], seriler: [{ ad: "Bölgesel pay", renk: COL.usgs, tur: "line",
            veri: pctRows.filter(r => r.pay === r.pay && r.yil >= state.bas && r.yil <= state.bit).map(r => ({ x: r.yil, y: r.pay })) }],
            dikey: [{ x: 2009, ad: "2009" }] }]
        };
      case "m4":
        return {
          baslik: "AFAD ve USGS'nin M4+ sayıları zamanla yaklaştı", alt: "Aynı coğrafi kutu, yıllık sayı", kaynak: "Kaynak: AFAD deprem kataloğu (M4 ve üzeri) ve USGS ComCat, aynı koordinat kutusu (enlem 35,5–42,5, boylam 25,5–45). Erişim: Ekim 2026.",
          paneller: [{ yEtiket: "Deprem sayısı (adet/yıl)", seriler: [seri(d.kars, "a4", "AFAD", COL.afad), seri(d.kars, "u4", "USGS", COL.usgs)] }]
        };
      case "m5":
        return {
          baslik: "M5 ve üzeri depremlerde iki katalog uyumlu", alt: "Aynı coğrafi kutu, yıllık sayı", kaynak: "Kaynak: AFAD deprem kataloğu (M4 ve üzeri) ve USGS ComCat, aynı koordinat kutusu (enlem 35,5–42,5, boylam 25,5–45). Erişim: Ekim 2026.",
          paneller: [{ yEtiket: "Deprem sayısı (adet/yıl)", seriler: [seri(d.kars, "a5", "AFAD", COL.afad), seri(d.kars, "u5", "USGS", COL.usgs)], olaylar: true }]
        };
      case "istasyon": {
        const kurumlar = [...new Set(d.ist.map(r => r.kurum))];
        const renkler = [COL.afad, COL.gray, "#009E73", "#CC79A7"];
        return {
          baslik: "İstasyon sayısı arttı, AFAD'ın M4+ sayısı düzenli artmadı", alt: "Üstte kayıtlı deprem, altta ağdaki istasyon", kaynak: "Kaynak: AFAD deprem kataloğu; istasyon sayıları haber ve resmî açıklamalardan derlenmiş yaklaşık değerlerdir. Erişim: Ekim 2026.",
          paneller: [
            { yEtiket: "M4+ (adet/yıl)", yukseklik: 0.5, seriler: [seri(d.kars, "a4", "AFAD M4+", COL.afad)] },
            { yEtiket: "İstasyon (adet)", yukseklik: 0.5, seriler: kurumlar.map((k, i) => ({
              ad: k + " istasyon", renk: renkler[i % renkler.length], tur: "dots",
              veri: d.ist.filter(r => r.kurum === k).map(r => ({ x: r.yil, y: r.n })) })) }
          ]
        };
      }
      case "kesif": {
        const e = state.esik;
        if (e === "m2") return { baslik: "USGS toplam kayıt, seçtiğin aralık", alt: "M2 ve üzeri, yıllık sayı", kaynak: "Kaynak: USGS ComCat, yer adında Türkiye geçen kayıtlar, M2 ve üzeri, 1996–2025. Erişim: Ekim 2026.",
          paneller: [{ yEtiket: "Deprem sayısı (adet/yıl)", seriler: [seri(d.usgs, "toplam", "USGS", COL.usgs, "bar")] }] };
        const a = e === "m4" ? "a4" : "a5", u = e === "m4" ? "u4" : "u5";
        return { baslik: (e === "m4" ? "M4" : "M5") + " ve üzeri, seçtiğin aralık", alt: state.bas + "–" + state.bit, kaynak: "Kaynak: AFAD deprem kataloğu (M4 ve üzeri) ve USGS ComCat, aynı koordinat kutusu (enlem 35,5–42,5, boylam 25,5–45). Erişim: Ekim 2026.",
          paneller: [{ yEtiket: "Deprem sayısı (adet/yıl)", seriler: [seri(d.kars, a, "AFAD", COL.afad), seri(d.kars, u, "USGS", COL.usgs)], olaylar: e === "m5" }] };
      }
    }
  }

  /* ---------- çizim ---------- */
  function ciz(v) {
    const g = gorunum(v);
    if (!g) return;
    d3.select("#chart-title").text(g.baslik);
    d3.select("#chart-sub").text(g.alt);
    d3.select("#chart-src").text(g.kaynak || "");

    const W = isMobile() ? 400 : 720, H = isMobile() ? 250 : 470;
    const M = { t: 14, r: 12, b: 28, l: isMobile() ? 44 : 52 };
    chartEl.selectAll("*").remove();
    const svg = chartEl.append("svg").attr("viewBox", `0 0 ${W} ${H}`)
      .attr("aria-label", g.baslik + ". " + g.alt);

    const tumX = g.paneller.flatMap(p => p.seriler.flatMap(s => s.veri.map(d => d.x)));
    const x0 = Math.min(state.bas, d3.min(tumX) ?? state.bas), x1 = Math.max(state.bit, d3.max(tumX) ?? state.bit);
    const x = d3.scaleLinear().domain([Math.min(1996, x0) - 0.5, Math.max(2025, x1) + 0.5]).range([M.l, W - M.r]);

    const gapY = 26;
    const toplamH = H - M.t - M.b - gapY * (g.paneller.length - 1);
    let top = M.t;
    const legend = new Map();

    g.paneller.forEach((p, pi) => {
      const h = toplamH * (p.yukseklik || 1);
      const yMax = d3.max(p.seriler.flatMap(s => s.veri.map(d => d.y))) || 1;
      const alan = p.alan || [0, yMax * 1.08];
      const y = d3.scaleLinear().domain(alan).nice().range([top + h, top]);
      const gp = svg.append("g");

      gp.append("g").attr("class", "grid").attr("transform", `translate(${M.l},0)`)
        .call(d3.axisLeft(y).ticks(5).tickSize(-(W - M.l - M.r)).tickFormat(""));
      gp.append("g").attr("class", "axis").attr("transform", `translate(${M.l},0)`)
        .call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(8).tickFormat(d => fmt(d)));
      gp.append("text").attr("class", "note").attr("x", M.l).attr("y", top - 3).text(p.yEtiket);
      if (pi === g.paneller.length - 1) {
        gp.append("g").attr("class", "axis").attr("transform", `translate(0,${top + h})`)
          .call(d3.axisBottom(x).tickValues(d3.range(1996, 2026, isMobile() ? 6 : 3)).tickSize(4).tickFormat(d3.format("d")));
      }

      if (pi === g.paneller.length - 1) {
        gp.append("text").attr("class", "note").attr("x", W - M.r).attr("y", H - 2).attr("text-anchor", "end").text("Yıl");
      }

      (p.dikey || []).forEach(dk => {
        gp.append("line").attr("x1", x(dk.x)).attr("x2", x(dk.x)).attr("y1", top).attr("y2", top + h)
          .attr("stroke", "#1c2430").attr("stroke-dasharray", "4 3").attr("stroke-width", 1);
        gp.append("text").attr("class", "note").attr("x", x(dk.x) + 4).attr("y", top + 10).text(dk.ad);
      });

      p.seriler.forEach(s => {
        legend.set(s.ad, s.renk);
        if (!s.veri.length) return;
        if (s.tur === "bar") {
          const bw = Math.max(2, (x(1997) - x(1996)) - 2);
          const r = gp.selectAll(null).data(s.veri).join("rect")
            .attr("x", d => x(d.x) - bw / 2).attr("width", bw).attr("fill", s.renk);
          r.attr("y", reduce ? d => y(d.y) : y(0)).attr("height", reduce ? d => y(0) - y(d.y) : 0);
          if (!reduce) r.transition().duration(700).attr("y", d => y(d.y)).attr("height", d => y(0) - y(d.y));
        } else if (s.tur === "dots") {
          gp.selectAll(null).data(s.veri).join("circle").attr("cx", d => x(d.x)).attr("cy", d => y(d.y))
            .attr("r", 5).attr("fill", s.renk).attr("stroke", "#fbfaf8").attr("stroke-width", 2);
          gp.selectAll(null).data(s.veri).join("text").attr("class", "note").attr("x", d => x(d.x))
            .attr("y", d => y(d.y) - 9).attr("text-anchor", "middle").text(d => fmt(d.y));
        } else {
          const ln = d3.line().x(d => x(d.x)).y(d => y(d.y)).defined(d => d.y === d.y);
          const path = gp.append("path").datum(s.veri).attr("d", ln).attr("fill", "none")
            .attr("stroke", s.renk).attr("stroke-width", 2).attr("stroke-linejoin", "round");
          if (!reduce) {
            const L = path.node().getTotalLength();
            path.attr("stroke-dasharray", L).attr("stroke-dashoffset", L)
              .transition().duration(900).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);
          }
          const last = s.veri[s.veri.length - 1];
          gp.append("circle").attr("cx", x(last.x)).attr("cy", y(last.y)).attr("r", 4).attr("fill", s.renk);
        }
      });

      if (p.olaylar) {
        OLAYLAR.filter(o => o.yil >= state.bas && o.yil <= state.bit).forEach((o, i) => {
          gp.append("line").attr("x1", x(o.yil)).attr("x2", x(o.yil)).attr("y1", top + 16 + (i % 2) * 12).attr("y2", top + h)
            .attr("stroke", "#9aa3ab").attr("stroke-width", 1);
          gp.append("text").attr("class", "note").attr("x", x(o.yil) + (o.yil > 2015 ? -3 : 3))
            .attr("text-anchor", o.yil > 2015 ? "end" : "start").attr("y", top + 12 + (i % 2) * 12).text(o.ad);
        });
      }

      // üzerine gelince değer göster
      gp.append("rect").attr("x", M.l).attr("y", top).attr("width", W - M.l - M.r).attr("height", h)
        .attr("fill", "transparent").attr("tabindex", null)
        .on("mousemove touchmove", function (ev) {
          const [mx] = d3.pointer(ev, svg.node());
          const yil = Math.round(x.invert(mx * 1));
          const satirlar = p.seriler.map(s => { const d = s.veri.find(q => q.x === yil); return d ? s.ad + ": " + fmt1(d.y).replace(",0", "") : null; }).filter(Boolean);
          if (!satirlar.length) { tip.style("opacity", 0); return; }
          const bb = chartEl.node().getBoundingClientRect();
          const sc = bb.width / W;
          tip.html("<strong>" + yil + "</strong><br>" + satirlar.join("<br>"))
            .style("left", (x(yil) * sc + (chartEl.node().offsetLeft || 0)) + "px")
            .style("top", (top * sc + chartEl.node().offsetTop + 30) + "px").style("opacity", 1);
        })
        .on("mouseleave touchend", () => tip.style("opacity", 0));

      top += h + gapY;
    });

    d3.select("#legend").html("").selectAll("span").data([...legend]).join("span")
      .style("--c", d => d[1]).text(d => d[0]);
  }

  /* ---------- kaydırma ---------- */
  function adimAc(el) {
    document.querySelectorAll(".step").forEach(s => s.classList.toggle("is-active", s === el));
    const v = el.dataset.view;
    if (v !== state.view) { state.view = v; ciz(v); }
  }

  function kaydirmayiKur() {
    const steps = document.querySelectorAll(".step");
    if (window.scrollama) {
      const sc = window.scrollama();
      sc.setup({ step: ".step", offset: isMobile() ? 0.7 : 0.5 }).onStepEnter(r => adimAc(r.element));
      window.addEventListener("resize", () => { sc.resize(); ciz(state.view); });
    } else {
      // Yedek: Scrollama yüklenemezse IntersectionObserver
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) adimAc(e.target); }),
        { rootMargin: isMobile() ? "-60% 0px -25% 0px" : "-50% 0px -50% 0px" });
      steps.forEach(s => io.observe(s));
      window.addEventListener("resize", () => ciz(state.view));
    }
    adimAc(steps[0]);
  }

  function kontrolleriKur() {
    const esik = document.getElementById("ctl-esik");
    const bas = document.getElementById("ctl-bas"), bit = document.getElementById("ctl-bit");
    const guncelle = () => {
      let b = +bas.value, e = +bit.value;
      if (b > e) { if (document.activeElement === bas) { e = b; bit.value = e; } else { b = e; bas.value = b; } }
      state.esik = esik.value; state.bas = b; state.bit = e;
      document.getElementById("out-bas").textContent = b;
      document.getElementById("out-bit").textContent = e;
      if (state.view === "kesif") ciz("kesif");
    };
    [esik, bas, bit].forEach(el => el.addEventListener("input", guncelle));
  }

  /* ---------- başlat ---------- */
  kontrolleriKur();
  yukle().then(d => { state.data = d; kaydirmayiKur(); })
    .catch(err => {
      const p = document.getElementById("veri-hata");
      p.hidden = false;
      p.textContent = "Veri dosyaları okunamadı (" + err.message + "). site/data klasöründe usgs_yillik.csv, karsilastirma_m4_m5.csv ve istasyon_sayisi.csv bulunmalı; dosyaları yerel dosya yerine bir sunucu üzerinden aç.";
      document.querySelectorAll(".step").forEach(s => s.classList.add("is-active"));
    });
})();
