# Skin "Apple" per il menù digitale Plateform

Una skin alternativa a quella attuale per le pagine `/menu/...` dei locali. È pensata per il telefono (la maggior parte degli ospiti arriva dal QR sul tavolo) e funziona anche su tablet e computer.

I contenuti restano quelli che il locale inserisce in Plateform: nomi, prezzi, descrizioni, etichette, allergeni, emoji nelle categorie. La skin si occupa solo del contenitore: impaginazione, colori ricavati dai colori custom del locale, caratteri e comportamenti.

## Contenuto della cartella

| File | A cosa serve |
| --- | --- |
| `menu-skin.css` | Tutti gli stili. Ogni classe ha il prefisso `pfm-` ed è racchiusa in `.pfm`, quindi non entra in conflitto con Bootstrap. |
| `menu-skin.js` | Costruisce la pagina dai dati, gestisce barra, ricerca, filtri e schede, e calcola i colori. Nessuna dipendenza, circa 30 KB non minificato. |
| `index.html` | Pagina di esempio da usare come riferimento. |
| `example/menu-pranzo.json` | Dati di esempio nel formato atteso (menù pranzo di Good Morning, Vietnam). |
| `example/logo.png` | Logo di esempio (monocromatico, sfondo trasparente). |

## Provarla in locale

```bash
cd skin
python3 -m http.server 8000
# poi apri http://localhost:8000/
```

Va servita da un server: aperta come file, il browser blocca il caricamento del JSON.

---

## 1. Integrazione

### 1.1 Cosa mettere nella pagina

```html
<link rel="stylesheet" href="/static/menu-skin/fonts.css">   <!-- font ospitati da noi, vedi §4 -->
<link rel="stylesheet" href="/static/menu-skin/menu-skin.css">

<div id="menu"></div>

<script src="/static/menu-skin/menu-skin.js"></script>
<script>
  PlateformMenuSkin.mount(document.getElementById("menu"), {
    data: {{ menu_json | safe }},                       // vedi §2
    colors: { primary: "{{ colore_primario }}", accent: "{{ colore_accento }}" },   // vedi §3
    logo: { src: "{{ logo_url }}", mode: "tint" },      // "tint" | "original", vedi §5
    bookingUrl: "{{ url_prenotazione }}",               // ometti se il locale non ha prenotazioni
    languages: [                                         // ometti per nascondere il pulsante lingua
      { code: "it", label: "Italiano", url: "?lang=it", current: true },
      { code: "en", label: "English",  url: "?lang=en" }
    ],
    theme: "auto",                                       // "auto" segue il telefono; "light" | "dark" per forzare
    titleStyle: "neutral",                               // "neutral" | "sign" | "classic", vedi §4
    locale: "it-IT", currency: "EUR",                    // formattazione dei prezzi
    strings: {}                                          // traduzioni dei testi della skin, vedi §7
  });
</script>
```

La skin costruisce tutta la pagina (testata, barra, menù, piede e schede) dentro il contenitore che le passi. Il contenitore deve essere l'unico contenuto della pagina, o comunque il contenuto principale: la barra resta fissa in cima allo scorrimento della finestra.

Altre cose da sapere sulla pagina:
- serve `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, così la skin rispetta notch e barre di sistema;
- la vecchia barra fissa in basso con indirizzo e "Powered by" va tolta: ora quelle informazioni sono nel piede della skin;
- la scelta della lingua resta nostra. La skin mostra le lingue che le passi e porta all'URL di ciascuna; ricaricare il menù nella nuova lingua spetta alla pagina.

### 1.2 Cosa restituisce `mount()`

```js
const menu = PlateformMenuSkin.mount(el, options);
menu.render();                                        // ridisegna (per esempio dopo aver cambiato i dati)
menu.setTheme("dark");                                // "auto" | "light" | "dark"
menu.setColors({ primary: "#…", accent: "#…" });
menu.setTitleStyle("classic");                        // "neutral" | "sign" | "classic", vedi §4
```

`PlateformMenuSkin.computeTokens(primary, accent, dark)` è esposta a parte, se si preferisce calcolare i colori lato server (§3.4).

---

## 2. Formato dei dati

```json
{
  "restaurant": { "name": "Good Morning, Vietnam", "address": "Piazza dei Tribunali, 6a, 40124 Bologna BO, Italia" },
  "menu": { "name": "Pranzo" },
  "categories": [
    {
      "name": "Pho (Brodo) 🍜",
      "notes": [
        { "title": "Il Pho:", "text": "Brodo chiaro e profumato…", "allergens": [] }
      ],
      "items": [
        {
          "name": "Pho bo",
          "price": 13.5,
          "tags": ["Specialità", "Senza glutine"],
          "description": "Brodo di carne tradizionale…\nCoriandolo disponibile su richiesta",
          "allergens": ["Soia"],
          "frozen": true,
          "photo": { "src": "/media/piatti/123.jpg", "alt": "Pho bo" }
        }
      ]
    }
  ]
}
```

### Corrispondenza con i dati di Plateform

| Campo | Da dove arriva in Plateform | Note |
| --- | --- | --- |
| `categories[].name` | nome della categoria | Testo così com'è, emoji comprese. |
| `notes[]` | **voci senza prezzo** dentro una categoria (es. "Il Pho:", "Riso:") | Oggi sono piatti senza prezzo. La skin li mostra come testo introduttivo della categoria, non come righe. |
| `items[].name` | nome del piatto | |
| `items[].price` | prezzo, **come numero** (`13.5`, non `"13,50€"`) | Il formato lo decide la skin (`locale`, `currency`). |
| `items[].tags` | etichette (Specialità, Novità, Piccante, Senza glutine…) | Tre etichette hanno uno stile proprio: **Novità** (pieno, colore d'accento), **Specialità** (tenue d'accento), **Piccante** (rosso con peperoncino). Le altre sono neutre. Il filtro "Mostra solo" si costruisce dalle etichette presenti. |
| `items[].description` | descrizione | Testo semplice; gli a capo (`\n`) vengono rispettati. Niente HTML. |
| `items[].allergens` | allergeni, con i nomi dei 14 allergeni UE in italiano | Il filtro si costruisce dagli allergeni presenti, nell'ordine del Reg. UE 1169/2011. Nomi esatti attesi: `Glutine`, `Crostacei`, `Uova`, `Pesce`, `Arachidi`, `Soia`, `Latte`, `Frutta a guscio`, `Sedano`, `Senape`, `Sesamo`, `Anidride solforosa e solfiti`, `Lupini`, `Molluschi`. |
| `items[].frozen` | flag surgelato (oggi l'icona `fa-snowflake`) | Mostra ❄ accanto al nome, la riga "Prodotto surgelato" nella scheda e la legenda nel piede. La legenda compare solo se almeno un piatto è surgelato. |
| `items[].photo` | foto del piatto, se c'è | Facoltativa. Con la foto, la riga mostra una miniatura 88×88 e la scheda una foto grande in alto (4:3). Senza foto, nessuno spazio vuoto. Servire immagini di circa 900 px di lato lungo, in WebP o JPEG. |

### Righe con prezzo dentro la descrizione

Alcuni locali scrivono varianti nella descrizione, per esempio `Involtino "Single Pride": porzione da un involtino 4,5€`. Nella scheda del piatto, ogni riga della descrizione che **finisce con un prezzo in euro** viene mostrata come formato, con il prezzo allineato a destra. Le parole restano quelle del locale. Nella lista resta il testo originale.

---

## 3. Colori

### 3.1 Il principio

Il locale sceglie **due colori**. La skin ricava da questi tutti gli altri e controlla che ogni testo resti leggibile (contrasto WCAG AA). Non si scrivono mai colori del locale nel CSS a mano.

| Colore custom | Dove si vede | Come sceglierlo |
| --- | --- | --- |
| **Primario** (`colors.primary`) | Fondo della testata; tinta leggera dei grigi della pagina; pillola della categoria corrente se è abbastanza scuro. | Il colore dominante del marchio. Funziona meglio un colore deciso o scuro. |
| **Accento** (`colors.accent`) | Logo e nome del locale sulla testata, pulsante "Prenota", etichetta Specialità, contatore dei filtri. | Il secondo colore del marchio, che risalti sul primario. |

### 3.2 Abbinamento con i colori custom che i locali hanno già

| Situazione del locale | Primario | Accento |
| --- | --- | --- |
| Ha un colore di sfondo e un colore per testi o logo (come Good Morning, Vietnam: sfondo giallo, logo rosso) | il colore **più scuro** dei due | l'altro |
| Ha un solo colore | quel colore | lo stesso colore: la skin usa il bianco o il nero dove serve |
| Ha un colore molto chiaro (avorio, crema) | quel colore va bene: la testata diventa chiara con testi scuri | un colore deciso del marchio |
| Non ha colori impostati | colore di default di Plateform | colore di default di Plateform |

Per Good Morning, Vietnam abbiamo scelto il rosso del logo come primario e il giallo come accento. La skin attuale usa il giallo come sfondo: con questa scelta il giallo resta, ma sulla testata scura, sul logo e sui pulsanti.

### 3.3 Tutti i token colore

Sono variabili CSS impostate su `.pfm`. Le colonne "chiaro" e "scuro" riportano i valori calcolati per Good Morning, Vietnam (primario `#6E1410`, accento `#F5A81C`).

**Ricavati dai colori del locale** (li calcola `computeTokens`):

| Token | Ruolo | Regola | Chiaro | Scuro |
| --- | --- | --- | --- | --- |
| `--pfm-h` | tinta del primario (0–360) | tinta HSL del primario; colora appena i grigi | `3` | `3` |
| `--pfm-band` | fondo della testata | = primario | `#6E1410` | `#6E1410` |
| `--pfm-band-text` | testi sulla testata | bianco o nero, quello con più contrasto sul primario, con l'8% di accento | `#FEF8ED` | `#FEF8ED` |
| `--pfm-band-sub` | testi secondari sulla testata (indirizzo) | testo mischiato al 25% col primario, poi corretto fino a contrasto ≥ 4,5:1 | `#DBC4C3` | `#DBC4C3` |
| `--pfm-band-ink` | logo, nome del locale, fondo di "Prenota", contatore filtri | = accento se ha contrasto ≥ 3:1 sul primario, altrimenti = testo della testata | `#F5A81C` | `#F5A81C` |
| `--pfm-accent` | categoria corrente, etichetta Novità, filtro attivo, pulsante principale, focus | tra primario e accento, quello con più contrasto sulla superficie; poi scurito (tema chiaro) o schiarito (scuro) fino a ≥ 4,5:1 | `#6E1410` | `#F5A81C` |
| `--pfm-on-accent` | testo sopra `--pfm-accent` | bianco o nero, quello con più contrasto | `#FFFFFF` | `#100C0A` |
| `--pfm-soft` | fondo tenue (Specialità, categoria corrente nell'indice) | superficie + 18% di accento (20% in scuro) | `#FDEFD6` | `#49361A` |
| `--pfm-soft-ink` | testo su `--pfm-soft` | accento, scurito o schiarito fino a ≥ 4,8:1 | `#875D13` | `#F5A81C` |

**Neutri** (fissi nel CSS, tinti con `--pfm-h`):

| Token | Ruolo | Chiaro | Scuro |
| --- | --- | --- | --- |
| `--pfm-ground` | fondo della pagina | `hsl(h 20% 96%)` | `hsl(h 10% 7%)` |
| `--pfm-surface` | schede dei piatti, fogli | `#FFFFFF` | `hsl(h 9% 11%)` |
| `--pfm-ink` | testo principale | `hsl(h 22% 10%)` | `hsl(h 18% 94%)` |
| `--pfm-ink-2` | descrizioni, testi secondari | `hsl(h 7% 32%)` | `hsl(h 8% 74%)` |
| `--pfm-ink-3` | allergeni, conteggi, note | `hsl(h 6% 40%)` | `hsl(h 6% 62%)` |
| `--pfm-line` | separatori tra le righe | `hsl(h 14% 90%)` | `hsl(h 8% 19%)` |
| `--pfm-chip` | pillole, pulsanti tondi, campo di ricerca | `hsl(h 16% 92%)` | `hsl(h 9% 17%)` |
| `--pfm-material` | barra fissa semitrasparente | `hsla(h, 20%, 96%, .86)` | `hsla(h, 10%, 7%, .84)` |
| `--pfm-scrim` | velo dietro le schede | `rgba(20,10,8,.44)` | `rgba(0,0,0,.6)` |
| `--pfm-shadow` | ombra delle schede | `0 -8px 40px rgba(40,15,10,.18)` | `0 -8px 40px rgba(0,0,0,.5)` |

**Colori di significato** (fissi, uguali per tutti i locali, da non legare al marchio):

| Token | Significato | Chiaro | Scuro |
| --- | --- | --- | --- |
| `--pfm-hot` | Piccante; allergene escluso nel filtro | `#B42318` | `#FF8A80` |
| `--pfm-frost` | surgelato | `#1F5FA8` | `#8CC4FF` |
| `--pfm-warn` | "Allergeni non indicati" | `#9A3412` | `#FDBA74` |

Tutti i testi rispettano almeno 4,5:1 sul loro fondo, 3:1 il logo sulla testata.

### 3.4 Calcolo lato server (facoltativo)

Se preferite non far calcolare i colori al browser, o volete evitare uno sfarfallio dei colori al caricamento, si può portare `computeTokens` nel backend. Sono circa 30 righe di matematica: luminanza relativa e rapporto di contrasto WCAG.

1. Calcolate i token due volte, `dark=false` e `dark=true`, e stampateli così:

   ```html
   <style>
     #menu.pfm          { --pfm-h: 3; --pfm-band: #6e1410; /* … token del tema chiaro … */ }
     #menu.pfm.pfm-dark { --pfm-accent: #f5a81c; /* … solo i token che cambiano in scuro … */ }
   </style>
   ```

2. Chiamate `mount()` **senza** l'opzione `colors`: la skin gestisce comunque il passaggio chiaro/scuro con la classe `pfm-dark`.

### 3.5 Esempi di abbinamenti calcolati

| Primario / Accento | Testata | Categoria corrente (chiaro → scuro) |
| --- | --- | --- |
| `#6E1410` / `#F5A81C` | rossa, logo giallo | `#6E1410` → `#F5A81C` |
| `#F5A81C` / `#6E1410` | gialla, logo rosso, testi quasi neri | `#6E1410` → `#F5A81C` |
| `#1E3557` / `#E9C46A` | blu, logo oro | `#1E3557` → `#E9C46A` |
| `#F3EEE6` / `#9B2226` | avorio, logo rosso, testi quasi neri | `#9B2226` → `#F3EEE6` |

---

## 4. Font

Il testo è sempre **Be Vietnam Pro**. Per i titoli (nome del locale e categorie) il locale sceglie uno di tre stili, con l'opzione `titleStyle`.

| Stile (`titleStyle`) | Font dei titoli | Aspetto | Adatto a |
| --- | --- | --- | --- |
| **Neutro** — `"neutral"` (default) | Be Vietnam Pro 700 | maiuscole e minuscole normali, spaziatura stretta | qualsiasi locale; lascia l'identità a logo e colori |
| **Insegna** — `"sign"` | Oswald 600 (condensato) | tutto maiuscolo, da insegna | street food, burger, pizzerie moderne, birrerie, cucine etniche informali |
| **Classico** — `"classic"` | Newsreader 600 (serif) | maiuscole e minuscole normali | ristoranti, enoteche, pasticcerie, trattorie |

Be Vietnam Pro è molto leggibile a misure piccole e copre tutti gli accenti europei e il vietnamita, quindi regge menù in qualsiasi lingua. Lo stile Insegna allarga visivamente i nomi lunghi: per categorie con nomi molto lunghi è meglio Neutro o Classico.

Lo stile dei titoli è un insieme di variabili su `.pfm`: `--pfm-title-font`, `--pfm-title-weight`, `--pfm-title-case`, `--pfm-title-track`, `--pfm-title-lh`. La skin applica la classe `pfm-title-neutral`, `pfm-title-sign` o `pfm-title-classic`, e lo stile si cambia al volo con `menu.setTitleStyle("classic")`.

**Font da caricare**

| Font | Pesi | Serve per |
| --- | --- | --- |
| Be Vietnam Pro | 400, 500, 600, 700 | sempre |
| Oswald | 600 | solo stile Insegna |
| Newsreader | 600 (asse ottico 6–72) | solo stile Classico |

Conviene caricare solo il font dei titoli che il locale usa.

**Scala tipografica** (rem = 16 px):

| Elemento | Misura | Peso | Note |
| --- | --- | --- | --- |
| Nome del locale | `clamp(1.9rem, 4vw + 1rem, 2.6rem)`; 3rem su desktop | stile titoli | |
| Titolo categoria | 1.5rem | stile titoli | |
| Titolo nella scheda | 1.45rem | Be Vietnam Pro 700 | |
| Nome del piatto | 1.04rem | 600 | |
| Prezzo | 1rem | 600 | cifre tabellari (allineate) |
| Descrizione | 0.93rem | 400 | interlinea 1.5, 2 righe nella lista, completa nella scheda |
| Etichette | 0.78rem | 600 | |
| Allergeni, conteggi | 0.82–0.84rem | 400/600 | |

**Caricamento.** L'esempio usa Google Fonts per comodità. In produzione conviene ospitare i file `woff2` sul nostro dominio: è più veloce, e in Italia il collegamento diretto a Google Fonts ha già sollevato contestazioni per il trasferimento dell'IP dei visitatori. Basta un `fonts.css` con i `@font-face` dei pesi indicati (si scaricano con google-webfonts-helper o dal pacchetto `@fontsource`), con `font-display: swap`. I fallback (`Arial Narrow`, `Georgia`, `system-ui`) sono già nei token `--pfm-f-display`, `--pfm-f-classic` e `--pfm-f-body`.

---

## 4bis. Pannello di personalizzazione (back office)

Cosa può scegliere il locale, e cosa no.

| Impostazione | Scelta | Note |
| --- | --- | --- |
| Skin | Attuale / Nuova | |
| Stile dei titoli | Neutro / Insegna / Classico | con anteprima dal vivo |
| Colore primario | selettore libero + 6–8 combinazioni pronte | obbligatorio per la nuova skin (in mancanza: default Plateform) |
| Colore d'accento | selettore libero, facoltativo | se vuoto, la skin usa il primario e ricava bianco/nero dove serve |
| Logo | caricamento + "Ricolora con l'accento" sì/no | sì = `mode: "tint"`, no = `"original"` |
| Tema | Automatico / Sempre chiaro / Sempre scuro | default Automatico |

**Si personalizzano solo due colori.** Tutti gli altri (testi, grigi, fondi tenui, colore della pillola attiva, versione scura) si ricavano da questi due con `computeTokens`. I colori di significato (piccante, surgelato, avvisi allergeni) restano fissi e non si possono cambiare. Lasciare liberi più colori porterebbe a combinazioni illeggibili, soprattutto in tema scuro.

**Combinazioni pronte.** Accanto ai due selettori conviene offrire alcune coppie già provate, che il locale può scegliere con un tocco e poi ritoccare. Esempi già calcolati sono in §3.5.

**Controlli nel pannello**
- Anteprima dal vivo della pagina in chiaro e in scuro, su telefono, aggiornata mentre si scelgono colori e stile.
- Se l'accento ha contrasto sotto 3:1 sul primario, avviso "Il logo sarà mostrato in bianco/nero per restare leggibile", invece di bloccare la scelta.
- Pulsante "Ripristina i colori predefiniti".

---

## 5. Logo

- `mode: "tint"` (consigliato): il logo è usato come maschera e colorato con `--pfm-band-ink`. Serve un **logo a una sola tinta su sfondo trasparente** (PNG o SVG). È il modo per avere il logo sempre leggibile sulla testata, qualunque colore scelga il locale.
- `mode: "original"`: il logo è mostrato con i suoi colori. Da usare per loghi a più colori; sta al locale scegliere un primario su cui si legga.
- Con `tint`, se il logo è servito da un dominio diverso dalla pagina (CDN), il server deve inviare `Access-Control-Allow-Origin`, altrimenti il browser non applica la maschera.
- Se manca il logo, la testata mostra solo il nome.

---

## 6. Comportamenti

**Barra fissa (telefono e tablet)**
- Contiene, nell'ordine: **Tutte** (apre l'indice completo delle categorie), le categorie a pillole scorrevoli, la ricerca e i filtri.
- La pillola della categoria visibile si evidenzia e si centra da sola mentre si scorre la pagina.
- Toccando una pillola, la pagina scorre fino alla categoria. Durante lo scorrimento la barra resta ferma sulla pillola scelta e torna a seguire la pagina quando lo scorrimento finisce: è voluto, per evitare un effetto avanti e indietro.
- L'URL prende `#cat-N` e il link apre il menù su quella categoria.

**Ricerca**
- Cerca in nome, descrizione, etichette e nome della categoria, senza badare agli accenti ("pho" trova "Phở").
- Mostra quanti risultati ha trovato. Se non trova nulla, propone "Mostra tutto il menù".

**Filtri**
- **Nascondi i piatti che contengono**: esclude gli allergeni scelti. I piatti **senza allergeni indicati restano visibili** con la scritta "Allergeni non indicati: chiedi al personale". È una scelta di sicurezza: un dato mancante non deve sembrare "senza allergeni".
- **Mostra solo i piatti**: tiene i piatti che hanno tutte le etichette scelte.
- Quando ci sono filtri attivi, il pulsante dei filtri si colora e mostra il numero. Sotto la barra compare la riga "N piatti nascosti · Senza glutine ✕ · Azzera".
- I filtri si ricordano solo per la visita in corso (`sessionStorage`): chi riapre il menù, anche da un telefono passato da altri, lo trova completo.

**Schede (piatto, indice, filtri, lingua)**
- Salgono dal basso con un'animazione a molla. Si chiudono con la X, toccando fuori, trascinando verso il basso o con un colpo veloce verso il basso, che proietta lo slancio come lo scorrimento di iOS. Si chiudono anche con il tasto indietro del telefono o del browser, che non esce dal menù. Con la tastiera si chiudono con Esc.
- Mentre una scheda è aperta, la pagina sotto è inattiva (`inert`): la tastiera e i lettori di schermo restano nella scheda.
- Valori delle molle: apertura smorzamento 1 / risposta 0,38 s; chiusura 1 / 0,3 s; ritorno dopo un trascinamento 0,8 / 0,3 s.

**Computer (da 960 px di larghezza)**
- L'indice diventa una colonna laterale fissa, con la categoria corrente evidenziata.
- La ricerca è sempre aperta in cima e i piatti stanno in una colonna larga al massimo 640 px.
- Le schede compaiono come pannello sospeso in basso al centro.

**Tema scuro**: con `theme: "auto"` segue l'impostazione del telefono e cambia anche a pagina aperta.

**Preferenze di sistema rispettate**
- *Riduci movimento*: niente animazioni di spostamento.
- *Riduci trasparenza*: barra opaca.
- *Aumenta contrasto*: bordi visibili su pillole, campi e liste.

---

## 7. Testi e traduzioni

Tutti i testi della skin sono in `PlateformMenuSkin.STRINGS`, in italiano. Per le altre lingue si passa `options.strings` con le sole chiavi da cambiare:

```js
strings: {
  book: "Book a table",
  search: "Search the menu",
  allCategories: "All",
  showN: n => `Show ${n} ${n === 1 ? "dish" : "dishes"}`
  // … vedi l'oggetto STRINGS in menu-skin.js per l'elenco completo
}
```

I nomi degli allergeni arrivano già tradotti dai dati. Il filtro però riconosce l'ordine UE solo per i nomi italiani: per le altre lingue estendete `EU14` e `SHORT` in `menu-skin.js`, o passate gli allergeni in un ordine fisso.

---

## 8. Compatibilità

- Safari 16.2+ su iOS (iPhone dal 2018 aggiornati), Chrome/Edge 111+, Firefox 113+, Samsung Internet 22+.
- Funzioni usate: `color-mix()`, `:where()`, `inert`, `IntersectionObserver`, `backdrop-filter`, `dvh`.
- Sui browser più vecchi la pagina resta utilizzabile. Il pulsante lingua perde il fondo semitrasparente, e la pagina sotto le schede resta raggiungibile con la tastiera.

---

## 9. Verifiche prima del rilascio

- [ ] Con almeno 3 locali reali (uno con colori chiari, uno con colori scuri, uno senza logo):
  - [ ] testata leggibile;
  - [ ] logo visibile;
  - [ ] pillola corrente leggibile in chiaro e in scuro.
- [ ] Un menù con 20+ categorie e nomi lunghi: la barra scorre e la pillola corrente si vede intera.
- [ ] Un piatto con foto e uno senza.
- [ ] Un piatto surgelato: ❄ nella riga, riga nella scheda, legenda nel piede.
- [ ] Filtro "Glutine": i piatti senza allergeni indicati restano, con l'avviso.
- [ ] Tasto indietro di Android con una scheda aperta: si chiude la scheda, non si esce.
- [ ] iPhone con notch, in verticale e in orizzontale: niente sotto le barre di sistema.
- [ ] Tastiera:
  - [ ] Tab arriva a tutti i controlli;
  - [ ] Esc chiude le schede;
  - [ ] il focus torna al piatto da cui si era partiti.
- [ ] VoiceOver/TalkBack: i piatti si leggono come pulsanti con nome, prezzo e allergeni; il ❄ si legge "Prodotto surgelato".
- [ ] Rimossa la vecchia barra fissa in basso.
- [ ] Font ospitati sul nostro dominio.
