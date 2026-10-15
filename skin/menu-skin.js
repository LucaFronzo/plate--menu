/*
 * Plateform — skin "Apple" per il menù digitale
 * ------------------------------------------------------------------
 * Uso:
 *   PlateformMenuSkin.mount(document.getElementById("menu"), {
 *     data,                                   // JSON del menù (vedi README.md, "Formato dei dati")
 *     colors: { primary: "#6E1410", accent: "#F5A81C" },
 *     logo: { src: "/media/logo.png", mode: "tint" },   // "tint" | "original"
 *     bookingUrl: "https://…/prenota",
 *     languages: [{ code: "it", label: "Italiano", url: "?lang=it", current: true }],
 *     theme: "auto",                          // "auto" | "light" | "dark"
 *     strings: {}                             // per tradurre i testi dell'interfaccia
 *   });
 *
 * Nessuna dipendenza. Nessuna chiamata di rete. Funziona dai browser con
 * supporto a CSS color-mix() e :focus-visible (Safari 16.2+, Chrome 111+, Firefox 113+).
 */
(function (global) {
  "use strict";

  /* ---------- Testi dell'interfaccia (sovrascrivibili con options.strings) ---------- */
  const STRINGS = {
    menuPrefix: "Menù",
    book: "Prenota",
    language: "Lingua",
    languageOnly: "Questo locale ha pubblicato il menù solo in questa lingua.",
    allCategories: "Tutte",
    allCategoriesTitle: "Tutte le categorie",
    categories: "Categorie",
    search: "Cerca nel menù",
    closeSearch: "Chiudi la ricerca",
    filters: "Filtri e allergeni",
    filtersActive: n => `Filtri e allergeni: ${n} attivi`,
    hideWith: "Nascondi i piatti che contengono",
    showOnly: "Mostra solo i piatti",
    filterNote: "I piatti senza allergeni indicati restano visibili e sono segnalati. Per allergie gravi chiedi sempre al personale.",
    reset: "Azzera",
    showN: n => `Mostra ${n} ${n === 1 ? "piatto" : "piatti"}`,
    hiddenN: n => `${n} ${n === 1 ? "piatto nascosto" : "piatti nascosti"}`,
    removeFilter: l => `Togli filtro: ${l}`,
    without: a => `Senza ${a.toLowerCase()}`,
    results: (n, q) => `${n} ${n === 1 ? "risultato" : "risultati"} per “${q}”`,
    noResults: q => `Nessun piatto trovato per “${q}”.`,
    noMatch: "Nessun piatto corrisponde ai filtri scelti.",
    showAll: "Mostra tutto il menù",
    of: (a, b) => `${a} di ${b}`,
    allergens: "Allergeni",
    allergensNote: "Allergeni",
    allergensUnknown: "Allergeni non indicati: chiedi al personale",
    allergensNoneDeclared: "Il locale non ha indicato allergeni per questo piatto.",
    staffNote: "Per allergie o intolleranze chiedi sempre al personale prima di ordinare.",
    frozen: "Prodotto surgelato",
    close: "Chiudi",
    poweredBy: "Powered by"
  };

  /* Etichette brevi per gli allergeni con nome lungo */
  const SHORT = { "Anidride solforosa e solfiti": "Solfiti" };
  /* Ordine dei 14 allergeni del Reg. UE 1169/2011, usato per il filtro */
  const EU14 = ["Glutine", "Crostacei", "Uova", "Pesce", "Arachidi", "Soia", "Latte", "Frutta a guscio", "Sedano", "Senape", "Sesamo", "Anidride solforosa e solfiti", "Lupini", "Molluschi"];

  /* ---------- Colori: dai due colori custom ai token, con controllo del contrasto ---------- */
  const hx = h => { h = String(h).replace("#", ""); if (h.length === 3) h = h.split("").map(c => c + c).join(""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const toHex = c => "#" + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
  const lum = c => { const a = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const fit = (c, bg, target, toward) => { let t = 0, o = c; while (contrast(o, bg) < target && t < 1) { t += 0.03; o = mix(c, toward, t); } return o; };
  function hueOf(c) { const [r, g, b] = c.map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 20; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return Math.round(h * 60 + 360) % 360; }
  const WHITE = [255, 255, 255], BLACK = [16, 12, 10], DARK_SURFACE = [30, 26, 25];

  /**
   * Calcola tutti i token colore dai due colori custom del locale.
   * Restituisce un oggetto { "--pfm-…": "#rrggbb" } che si può anche
   * calcolare lato server e stampare in uno <style> (vedi README.md).
   */
  function computeTokens(primary, accent, dark) {
    const P = hx(primary), A = hx(accent);
    const text = contrast(P, WHITE) >= contrast(P, BLACK) ? WHITE : BLACK;
    const surface = dark ? DARK_SURFACE : WHITE;
    const strongest = [P, A].sort((x, y) => contrast(y, surface) - contrast(x, surface))[0];
    const acc = fit(strongest, surface, 4.5, dark ? WHITE : BLACK);
    const soft = mix(surface, A, dark ? 0.2 : 0.18);
    return {
      "--pfm-h": String(hueOf(P)),
      "--pfm-band": toHex(P),
      "--pfm-band-text": toHex(mix(text, A, 0.08)),
      "--pfm-band-sub": toHex(fit(mix(text, P, 0.25), P, 4.5, text)),
      "--pfm-band-ink": toHex(contrast(A, P) >= 3 ? A : text),
      "--pfm-accent": toHex(acc),
      "--pfm-on-accent": toHex(contrast(acc, WHITE) >= contrast(acc, BLACK) ? WHITE : BLACK),
      "--pfm-soft": toHex(soft),
      "--pfm-soft-ink": toHex(fit(A, soft, 4.8, dark ? WHITE : BLACK))
    };
  }

  /* ---------- Utilità ---------- */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
  const ico = id => `<svg class="pfm-i" aria-hidden="true"><use href="#pfm-i-${id}"/></svg>`;
  const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <symbol id="pfm-i-snow" viewBox="0 0 24 24"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 2 3-2M9 20l3-2 3 2M4.2 10.6l2.6-1.2-.3-2.9M19.8 13.4l-2.6 1.2.3 2.9M4.2 13.4l2.6 1.2-.3 2.9M19.8 10.6l-2.6-1.2.3-2.9"/></symbol>
    <symbol id="pfm-i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></symbol>
    <symbol id="pfm-i-filter" viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></symbol>
    <symbol id="pfm-i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
    <symbol id="pfm-i-grid" viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></symbol>
    <symbol id="pfm-i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></symbol>
    <symbol id="pfm-i-cal" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></symbol>
    <symbol id="pfm-i-chili" viewBox="0 0 24 24"><path d="M14 6c-1-2-3-2-3-2M13 7c4-1 7 2 6 6-1 5-8 8-14 7 5-2 6-5 6-9 0-2 1-3.5 2-4Z"/></symbol>
    <symbol id="pfm-i-check" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></symbol>
  </svg>`;

  /* "Etichetta 4,5€" su una riga della descrizione diventa un formato con prezzo (solo nella scheda) */
  function splitOptions(d) {
    const text = [], opts = [];
    String(d || "").split("\n").forEach(l => {
      const m = l.trim().match(/^(.{3,}?)\s+(\d+(?:[.,]\d{1,2})?)\s?€$/);
      if (m) opts.push([m[1], parseFloat(m[2].replace(",", "."))]); else text.push(l);
    });
    return { text: text.join("\n").replace(/\n{2,}/g, "\n").trim(), opts };
  }

  /* ---------- Mount ---------- */
  function mount(root, options) {
    const o = Object.assign({ theme: "auto", languages: [], strings: {}, logo: null, bookingUrl: null, colors: null, storageKey: "pfm-filters" }, options || {});
    const T = Object.assign({}, STRINGS, o.strings);
    const D = o.data;
    const locale = o.locale || "it-IT", currency = o.currency || "EUR";
    const money = new Intl.NumberFormat(locale, { style: "currency", currency });
    const eur = v => money.format(v);

    const cats = D.categories.map((c, i) => ({
      name: c.name, id: "cat-" + (i + 1), notes: c.notes || [],
      items: (c.items || []).map(it => ({ n: it.name, p: Number(it.price), t: it.tags || [], d: it.description || "", a: it.allergens || [], f: !!it.frozen, ph: it.photo || null }))
    }));
    const ALL_A = EU14.filter(a => cats.some(c => c.items.some(it => it.a.includes(a))))
      .concat([...new Set(cats.flatMap(c => c.items.flatMap(it => it.a)))].filter(a => !EU14.includes(a)));
    const ALL_T = [...new Set(cats.flatMap(c => c.items.flatMap(it => it.t)))];
    const anyFrozen = cats.some(c => c.items.some(it => it.f));
    const short = a => SHORT[a] || a;
    const tagCls = t => t === "Novità" ? "pfm-new" : t === "Specialità" ? "pfm-spec" : t === "Piccante" ? "pfm-hot" : "";
    const tags = l => l.map(t => `<span class="pfm-tg ${tagCls(t)}">${t === "Piccante" ? ico("chili") : ""}${esc(t)}</span>`).join("");
    const fz = it => it.f ? `<svg class="pfm-i pfm-fz" role="img" aria-label="${esc(T.frozen)}"><use href="#pfm-i-snow"/></svg>` : "";

    /* -- markup di base -- */
    root.classList.add("pfm");
    const cur = (o.languages.find(l => l.current) || o.languages[0] || { code: "it" });
    root.innerHTML = `${SPRITE}
      <header class="pfm-band"><div class="pfm-wrap">
        <div class="pfm-band-top">
          ${o.languages.length ? `<button class="pfm-pill pfm-ghost pfm-tap" data-pfm="lang" aria-label="${esc(T.language)}: ${esc(cur.label || cur.code)}">${ico("globe")}${esc(String(cur.code).toUpperCase())}</button>` : ""}
          ${o.bookingUrl ? `<a class="pfm-pill pfm-solid pfm-tap" href="${esc(o.bookingUrl)}">${ico("cal")}${esc(T.book)}</a>` : ""}
        </div>
        <div class="pfm-id">
          ${o.logo && o.logo.src ? `<div class="pfm-logo${o.logo.mode === "original" ? "" : " pfm-tint"}" aria-hidden="true">${o.logo.mode === "original" ? `<img src="${esc(o.logo.src)}" alt="">` : ""}</div>` : ""}
          <div><h1>${esc(D.restaurant.name)}</h1>
          <p class="pfm-meta"><b>${esc(T.menuPrefix + " " + String(D.menu.name).toLowerCase())}</b><span>${esc(String(D.restaurant.address || "").split(",").slice(0, 2).join(","))}</span></p></div>
        </div>
      </div></header>
      <div class="pfm-rail"><div class="pfm-wrap">
        <div class="pfm-rail-row">
          <button class="pfm-all pfm-tap" data-pfm="all" aria-haspopup="dialog">${ico("grid")}${esc(T.allCategories)}</button>
          <nav class="pfm-chips" aria-label="${esc(T.categories)}"></nav>
          <label class="pfm-search" hidden>${ico("search")}<input type="search" placeholder="${esc(T.search)}" autocomplete="off" enterkeyhint="search" aria-label="${esc(T.search)}"></label>
          <button class="pfm-ib pfm-tap pfm-search-toggle" data-pfm="search" aria-label="${esc(T.search)}" aria-expanded="false"><svg class="pfm-i" aria-hidden="true"><use href="#pfm-i-search"/></svg></button>
          <button class="pfm-ib pfm-tap" data-pfm="filters" aria-haspopup="dialog" aria-label="${esc(T.filters)}">${ico("filter")}<span class="pfm-count" hidden></span></button>
        </div>
        <div class="pfm-fstrip" hidden></div>
      </div></div>
      <div class="pfm-shell">
        <nav class="pfm-side" aria-label="${esc(T.categories)}"></nav>
        <main class="pfm-main"><div class="pfm-wrap"><p class="pfm-status" role="status" hidden></p><div class="pfm-menu"></div></div></main>
      </div>
      <footer class="pfm-foot"><div class="pfm-wrap">
        ${anyFrozen ? `<span class="pfm-legend"><svg class="pfm-i pfm-fz" aria-hidden="true"><use href="#pfm-i-snow"/></svg>${esc(T.frozen)}</span>` : ""}
        <span>${esc(T.staffNote)}</span>
        <span><b>${esc(D.restaurant.name)}</b>${D.restaurant.address ? " · " + esc(D.restaurant.address) : ""}</span>
        <span>${esc(T.poweredBy)} <a href="https://plateform.app" target="_blank" rel="noopener">Plateform</a></span>
      </div></footer>
      <div class="pfm-scrim"></div>
      <div class="pfm-sheet" role="dialog" aria-modal="true" aria-labelledby="pfm-s-title">
        <div class="pfm-grab"><img class="pfm-hero" alt="" hidden><button class="pfm-x pfm-tap" data-pfm="close" aria-label="${esc(T.close)}">${ico("x")}</button><div class="pfm-gh"><h3 id="pfm-s-title"></h3></div></div>
        <div class="pfm-sbody"></div>
      </div>`;
    const q = s => root.querySelector(s);
    const rail = q(".pfm-rail"), chipsEl = q(".pfm-chips"), side = q(".pfm-side"), menuEl = q(".pfm-menu"), statusEl = q(".pfm-status");
    const searchBox = q(".pfm-search"), input = searchBox.querySelector("input"), searchBtn = q('[data-pfm="search"]'), allBtn = q('[data-pfm="all"]');
    const filterBtn = q('[data-pfm="filters"]'), countEl = filterBtn.querySelector(".pfm-count"), fstrip = q(".pfm-fstrip");
    const sheet = q(".pfm-sheet"), scrim = q(".pfm-scrim"), sbody = q(".pfm-sbody"), grab = q(".pfm-grab"), hero = q(".pfm-hero"), xBtn = q('[data-pfm="close"]'), gh = q(".pfm-gh");
    const RM = matchMedia("(prefers-reduced-motion: reduce)"), DARKQ = matchMedia("(prefers-color-scheme: dark)");

    /* -- logo: ricolorato con l'accento (maschera) oppure originale -- */
    if (o.logo && o.logo.src) {
      const img = new Image();
      img.onload = () => root.style.setProperty("--pfm-logo-ratio", img.naturalWidth + " / " + img.naturalHeight);
      img.src = o.logo.src;
      root.style.setProperty("--pfm-logo", `url("${o.logo.src}")`);
    }

    /* -- tema e colori -- */
    const isDark = () => o.theme === "dark" || (o.theme === "auto" && DARKQ.matches);
    function applyColors() {
      const dark = isDark();
      root.classList.toggle("pfm-dark", dark);
      if (o.colors && o.colors.primary && o.colors.accent) {
        const tk = computeTokens(o.colors.primary, o.colors.accent, dark);
        Object.keys(tk).forEach(k => root.style.setProperty(k, tk[k]));
      }
    }
    applyColors();
    DARKQ.addEventListener && DARKQ.addEventListener("change", applyColors);

    /* -- stato -- */
    const st = { q: "", ex: new Set(), only: new Set(), cur: null };
    try { const s = JSON.parse(sessionStorage.getItem(o.storageKey) || "{}"); (s.ex || []).forEach(x => ALL_A.includes(x) && st.ex.add(x)); (s.only || []).forEach(x => ALL_T.includes(x) && st.only.add(x)); } catch (e) {}
    const save = () => { try { sessionStorage.setItem(o.storageKey, JSON.stringify({ ex: [...st.ex], only: [...st.only] })); } catch (e) {} };
    const passFilters = it => !it.a.some(a => st.ex.has(a)) && [...st.only].every(t => it.t.includes(t));
    const passQuery = (it, c) => !st.q || norm([it.n, it.d, it.t.join(" "), c.name].join(" ")).includes(norm(st.q));
    const shown = c => c.items.filter(it => passFilters(it) && passQuery(it, c));

    /* -- render -- */
    function render() {
      let html = "", total = 0;
      for (const c of cats) {
        const items = shown(c); if (!items.length) continue; total += items.length;
        html += `<section class="pfm-sec" id="${c.id}" aria-labelledby="${c.id}-h"><div class="pfm-sec-head"><h2 id="${c.id}-h">${esc(c.name)}</h2><span>${items.length === c.items.length ? items.length : T.of(items.length, c.items.length)}</span></div>`;
        if (!st.q) html += c.notes.map(n => `<p class="pfm-note"><b>${esc(n.title)}</b>${n.text ? " " + esc(n.text) : ""}${(n.allergens || []).length ? `<small>${esc(T.allergensNote)}: ${esc(n.allergens.join(", "))}</small>` : ""}</p>`).join("");
        html += `<ul class="pfm-list">` + items.map(it => {
          const i = c.items.indexOf(it);
          const al = it.a.length ? `<span class="pfm-al"><b>${esc(T.allergens)}</b>${esc(it.a.map(short).join(" · "))}</span>` : st.ex.size ? `<span class="pfm-al pfm-unk">${esc(T.allergensUnknown)}</span>` : "";
          return `<li><button class="pfm-item${it.ph ? " pfm-has-ph" : ""}" data-c="${c.id}" data-i="${i}" aria-haspopup="dialog"><span class="pfm-tx">
            <span class="pfm-r1"><span class="pfm-nm">${esc(it.n)}${fz(it)}</span><span class="pfm-pr">${eur(it.p)}</span></span>
            ${it.t.length ? `<span class="pfm-tags">${tags(it.t)}</span>` : ""}
            ${it.d ? `<span class="pfm-ds">${esc(it.d.replace(/\n\s*\n+/g, "\n"))}</span>` : ""}${al}</span>
            ${it.ph ? `<img class="pfm-th" src="${esc(it.ph.src)}" alt="" width="88" height="88" loading="lazy" decoding="async">` : ""}</button></li>`;
        }).join("") + `</ul></section>`;
      }
      if (!total) html = `<div class="pfm-empty"><p>${st.q ? esc(T.noResults(st.q)) : esc(T.noMatch)}</p><button class="pfm-tap" data-pfm="reset-all">${esc(T.showAll)}</button></div>`;
      menuEl.innerHTML = html;
      statusEl.hidden = !st.q || !total;
      statusEl.textContent = st.q ? T.results(total, st.q) : "";
      chipsEl.innerHTML = cats.filter(c => shown(c).length).map(c => `<button class="pfm-chip pfm-tap" data-go="${c.id}" aria-current="${st.cur === c.id}">${esc(c.name)}</button>`).join("");
      side.innerHTML = indexHtml();
      const n = st.ex.size + st.only.size;
      const hidden = cats.reduce((s, c) => s + c.items.length - c.items.filter(passFilters).length, 0);
      countEl.hidden = !n; countEl.textContent = n;
      filterBtn.classList.toggle("pfm-on", !!n);
      filterBtn.setAttribute("aria-label", n ? T.filtersActive(n) : T.filters);
      fstrip.hidden = !n;
      fstrip.innerHTML = n ? `<span>${esc(T.hiddenN(hidden))}</span>` +
        [...st.ex].map(a => `<button class="pfm-fx pfm-tap" data-rx="${esc(a)}" aria-label="${esc(T.removeFilter(T.without(short(a))))}">${esc(T.without(short(a)))}${ico("x")}</button>`).join("") +
        [...st.only].map(t => `<button class="pfm-fx pfm-tap" data-ro="${esc(t)}" aria-label="${esc(T.removeFilter(t))}">${esc(t)}${ico("x")}</button>`).join("") +
        `<button class="pfm-fx pfm-reset pfm-tap" data-pfm="reset-filters">${esc(T.reset)}</button>` : "";
      measure(); spy();
    }
    const indexHtml = () => cats.map(c => { const k = shown(c).length; return k ? `<button class="pfm-ix pfm-tap" data-go="${c.id}" aria-current="${st.cur === c.id}">${esc(c.name)}<span>${k}</span></button>` : ""; }).join("");
    const measure = () => root.style.setProperty("--pfm-rail-h", rail.offsetHeight + "px");

    /* -- categoria corrente (scroll-spy) -- */
    let io, navLock = false, lockTimer = 0;
    function spy() {
      io && io.disconnect();
      const seen = new Map();
      io = new IntersectionObserver(es => {
        es.forEach(e => seen.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null));
        const top = [...seen].filter(([, v]) => v !== null).sort((a, b) => a[1] - b[1])[0];
        if (top && !navLock) setCur(top[0]);
      }, { rootMargin: `-${rail.offsetHeight + 24}px 0px -55% 0px` });
      root.querySelectorAll(".pfm-sec").forEach(s => io.observe(s));
      if (!st.cur) { const f = root.querySelector(".pfm-sec"); if (f) setCur(f.id); }
    }
    function setCur(id) {
      if (st.cur === id) return; st.cur = id;
      root.querySelectorAll("[data-go]").forEach(b => b.setAttribute("aria-current", b.dataset.go === id));
      const ch = chipsEl.querySelector(`[data-go="${id}"]`);
      if (ch && chipsEl.offsetParent) chipsEl.scrollTo({ left: Math.max(0, ch.getBoundingClientRect().left - chipsEl.getBoundingClientRect().left + chipsEl.scrollLeft - Math.max(12, (chipsEl.clientWidth - ch.offsetWidth) / 2)), behavior: RM.matches ? "auto" : "smooth" });
    }
    // Durante lo scorrimento avviato da un tocco la barra resta sulla categoria scelta
    function lockNav() {
      navLock = true; clearTimeout(lockTimer);
      const release = () => { navLock = false; removeEventListener("scroll", onScroll); };
      const onScroll = () => { clearTimeout(lockTimer); lockTimer = setTimeout(release, 140); };
      addEventListener("scroll", onScroll, { passive: true });
      lockTimer = setTimeout(release, 900);
    }
    function goTo(id) {
      const s = root.querySelector("#" + id); if (!s) return;
      setCur(id); lockNav();
      s.scrollIntoView({ behavior: RM.matches ? "auto" : "smooth" });
      try { history.replaceState(history.state, "", "#" + id); } catch (e) {}
    }
    addEventListener("scroll", () => rail.style.setProperty("--pfm-edge", rail.getBoundingClientRect().top <= 1 ? 1 : 0), { passive: true });
    addEventListener("resize", () => { measure(); spy(); });

    /* -- scheda: molla (smorzamento + risposta), trascinamento, slancio, tasto indietro -- */
    let y = 0, v = 0, H = 1, raf = 0, open = false, back = null, mode = "", pushed = false, dr = null;
    const rubber = (x, d, c = 0.55) => (x * d * c) / (d + c * Math.abs(x));
    const paint = () => { sheet.style.transform = `translateY(${y < 0 ? -rubber(-y, H) : y}px)`; scrim.style.opacity = Math.max(0, Math.min(1, 1 - y / H)); };
    function springTo(t, damping, response, done) {
      cancelAnimationFrame(raf);
      if (RM.matches) { y = t; v = 0; paint(); done && done(); return; }
      const k = (2 * Math.PI / response) ** 2, c = 4 * Math.PI * damping / response; let last = performance.now();
      const step = now => {
        let dt = Math.min(0.064, (now - last) / 1000); last = now;
        while (dt > 0) { const h = Math.min(dt, 1 / 240); v += (-k * (y - t) - c * v) * h; y += v * h; dt -= h; }
        paint();
        if (Math.abs(v) < 4 && Math.abs(y - t) < 0.5) { y = t; v = 0; paint(); done && done(); } else raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    const setInert = on => root.querySelectorAll(".pfm-band, .pfm-rail, .pfm-shell, .pfm-foot").forEach(el => { el.inert = on; });
    function openSheet({ title, html, photo, from, m }) {
      mode = m; q("#pfm-s-title").textContent = title; sbody.innerHTML = html; sbody.scrollTop = 0;
      if (photo) { hero.src = photo.src; hero.alt = photo.alt || title; hero.hidden = false; } else { hero.hidden = true; hero.removeAttribute("src"); }
      grab.classList.toggle("pfm-on-photo", !!photo); xBtn.classList.toggle("pfm-float", !!photo);
      if (photo) grab.prepend(xBtn); else gh.append(xBtn);
      back = from || document.activeElement;
      sheet.style.visibility = "visible"; scrim.style.pointerEvents = "auto";
      H = sheet.getBoundingClientRect().height + 40;
      if (!open) { y = H; v = 0; setInert(true); try { if (!pushed) { history.pushState({ pfmSheet: 1 }, ""); pushed = true; } } catch (e) {} }
      open = true; document.documentElement.style.overflow = "hidden";
      springTo(0, 1, 0.38);
      sheet.tabIndex = -1; sheet.focus({ preventScroll: true });
    }
    function closeSheet(vel = 0, then, fromHistory) {
      if (!open) return;
      open = false; v = vel; setInert(false);
      if (pushed && !fromHistory) { pushed = false; try { history.back(); } catch (e) {} } else pushed = false;
      springTo(H, 1, 0.3, () => { sheet.style.visibility = "hidden"; scrim.style.pointerEvents = "none"; document.documentElement.style.overflow = ""; mode = ""; if (!then && back && back.focus) back.focus({ preventScroll: true }); then && then(); });
    }
    addEventListener("popstate", () => { if (open) closeSheet(0, null, true); else pushed = false; });
    scrim.addEventListener("click", () => closeSheet());
    addEventListener("keydown", e => { if (e.key === "Escape" && open) closeSheet(); });
    grab.addEventListener("pointerdown", e => { if (e.target.closest(".pfm-x")) return; cancelAnimationFrame(raf); grab.setPointerCapture(e.pointerId); dr = { y0: e.clientY, p0: y, hist: [[e.timeStamp, e.clientY]] }; });
    grab.addEventListener("pointermove", e => { if (!dr) return; y = dr.p0 + e.clientY - dr.y0; dr.hist.push([e.timeStamp, e.clientY]); if (dr.hist.length > 6) dr.hist.shift(); paint(); });
    const release = e => {
      if (!dr) return; const h = dr.hist, a = h[0], b = h[h.length - 1];
      const vel = b[0] > a[0] ? (b[1] - a[1]) / ((b[0] - a[0]) / 1000) : 0, moved = Math.abs(e.clientY - dr.y0); dr = null;
      if (moved < 4) return springTo(0, 1, 0.3);
      const end = y + (vel / 1000) * 0.998 / (1 - 0.998);   // proiezione dello slancio (come lo scroll di iOS)
      if (end > H * 0.45 && vel > -50) closeSheet(vel); else { v = vel; springTo(0, 0.8, 0.3); }
    };
    grab.addEventListener("pointerup", release); grab.addEventListener("pointercancel", release);

    function dishSheet(it, from) {
      const { text, opts } = splitOptions(it.d);
      let h = `<div class="pfm-s-price">${eur(it.p)}</div>`;
      if (it.t.length) h += `<div class="pfm-tags" style="margin-top:10px">${tags(it.t)}</div>`;
      if (text) h += `<p class="pfm-s-desc">${esc(text)}</p>`;
      if (opts.length) h += `<ul class="pfm-opts">${opts.map(x => `<li><span>${esc(x[0])}</span><span>${eur(x[1])}</span></li>`).join("")}</ul>`;
      if (it.f) h += `<div class="pfm-frozen"><svg class="pfm-i pfm-fz" aria-hidden="true"><use href="#pfm-i-snow"/></svg>${esc(T.frozen)}</div>`;
      h += `<div class="pfm-s-blk"><p class="pfm-s-lbl">${esc(T.allergens)}</p>${it.a.length ? `<div class="pfm-a-row">${it.a.map(a => `<span class="pfm-a-c">${esc(a)}</span>`).join("")}</div>` : `<p class="pfm-a-none">${esc(T.allergensNoneDeclared)}</p>`}</div>`;
      h += `<p class="pfm-s-note">${esc(T.staffNote)}</p>`;
      openSheet({ title: it.n, html: h, photo: it.ph, from, m: "dish" });
    }
    function drawFilters() {
      const n = cats.reduce((s, c) => s + c.items.filter(passFilters).length, 0);
      sbody.innerHTML = `<div class="pfm-s-blk" style="margin-top:6px"><p class="pfm-s-lbl">${esc(T.hideWith)}</p><div class="pfm-f-grid">${ALL_A.map(a => `<button class="pfm-tog pfm-ex pfm-tap" data-ex="${esc(a)}" aria-pressed="${st.ex.has(a)}">${esc(short(a))}</button>`).join("")}</div></div>
        ${ALL_T.length ? `<div class="pfm-s-blk"><p class="pfm-s-lbl">${esc(T.showOnly)}</p><div class="pfm-f-grid">${ALL_T.map(t => `<button class="pfm-tog pfm-tap" data-only="${esc(t)}" aria-pressed="${st.only.has(t)}">${t === "Piccante" ? ico("chili") : ""}${esc(t)}</button>`).join("")}</div></div>` : ""}
        <p class="pfm-f-note">${esc(T.filterNote)}</p>
        <div class="pfm-f-act"><button class="pfm-b-ghost pfm-tap" data-clear>${esc(T.reset)}</button><button class="pfm-b-main pfm-tap" data-done>${esc(T.showN(n))}</button></div>`;
    }
    function langSheet(from) {
      const html = o.languages.length > 1
        ? `<div class="pfm-lang">${o.languages.map(l => `<a href="${esc(l.url || "#")}" aria-current="${!!l.current}">${esc(l.label)}${l.current ? ico("check") : ""}</a>`).join("")}</div>`
        : `<div class="pfm-lang"><div aria-current="true">${esc(cur.label || cur.code)} ${ico("check")}</div></div><p class="pfm-f-note">${esc(T.languageOnly)}</p>`;
      openSheet({ title: T.language, html, from, m: "lang" });
    }
    function setSearch(show) {
      searchBox.hidden = !show; chipsEl.hidden = show; allBtn.hidden = show;
      searchBtn.setAttribute("aria-expanded", show); searchBtn.setAttribute("aria-label", show ? T.closeSearch : T.search);
      searchBtn.querySelector("use").setAttribute("href", "#pfm-i-" + (show ? "x" : "search"));
      if (show) input.focus(); else if (st.q) { st.q = ""; input.value = ""; render(); }
    }

    /* -- eventi -- */
    root.addEventListener("click", e => {
      const t = e.target, act = t.closest("[data-pfm]") && t.closest("[data-pfm]").dataset.pfm;
      const g = t.closest("[data-go]");
      if (g) { const id = g.dataset.go; if (open) closeSheet(0, () => goTo(id)); else goTo(id); return; }
      const it = t.closest(".pfm-item"); if (it) { const c = cats.find(x => x.id === it.dataset.c); return dishSheet(c.items[+it.dataset.i], it); }
      if (act === "close") return closeSheet();
      if (act === "all") return openSheet({ title: T.allCategoriesTitle, html: `<div class="pfm-ix-grid">${indexHtml()}</div>`, from: allBtn, m: "index" });
      if (act === "filters") { openSheet({ title: T.filters, html: "", from: filterBtn, m: "filters" }); drawFilters(); H = sheet.getBoundingClientRect().height + 40; return; }
      if (act === "lang") return langSheet(t.closest("[data-pfm]"));
      if (act === "search") return setSearch(searchBox.hidden);
      const rx = t.closest("[data-rx]"); if (rx) { st.ex.delete(rx.dataset.rx); save(); return render(); }
      const ro = t.closest("[data-ro]"); if (ro) { st.only.delete(ro.dataset.ro); save(); return render(); }
      if (act === "reset-filters") { st.ex.clear(); st.only.clear(); save(); return render(); }
      if (act === "reset-all") { st.ex.clear(); st.only.clear(); save(); setSearch(false); return render(); }
      if (mode === "filters" && sbody.contains(t)) {
        const x = t.closest("[data-ex]"), on = t.closest("[data-only]");
        if (x) st.ex.has(x.dataset.ex) ? st.ex.delete(x.dataset.ex) : st.ex.add(x.dataset.ex);
        else if (on) st.only.has(on.dataset.only) ? st.only.delete(on.dataset.only) : st.only.add(on.dataset.only);
        else if (t.closest("[data-clear]")) { st.ex.clear(); st.only.clear(); }
        else if (t.closest("[data-done]")) return closeSheet();
        else return;
        save(); render(); drawFilters();
      }
    });
    input.addEventListener("input", () => {
      st.q = input.value.trim(); render();
      const top = q(".pfm-shell").getBoundingClientRect().top + scrollY - rail.offsetHeight;
      if (scrollY > top) scrollTo({ top });
    });
    input.addEventListener("keydown", e => { if (e.key === "Escape") setSearch(false); });

    render();
    const h0 = location.hash.slice(1); if (h0 && root.querySelector("#" + CSS.escape(h0))) setTimeout(() => goTo(h0), 50);

    return { render, setTheme(t) { o.theme = t; applyColors(); }, setColors(c) { o.colors = c; applyColors(); } };
  }

  global.PlateformMenuSkin = { mount, computeTokens, STRINGS };
})(window);
