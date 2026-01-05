# Teknisk vs faktisk skärmyta – Chromium kioskläge

*Målgrupp: utvecklare/AI som ska rendera innehåll mot skärmen*

---

## 1. Fysisk och teknisk skärmupplösning

- **Panel:** N156HCA‑E5B
- **Native upplösning:** **1920 × 1080 px** (Full HD, 16:9)

Detta är den **tekniska maxytan** som panelen kan visa.

---

## 2. Chromium i kioskläge – faktisk webbyta

Verifierat i DevTools på målmaskinen:

```js
window.innerWidth  === 1920
window.innerHeight === 1080
```

Samt:

```js
document.querySelector('.dashboard-container').getBoundingClientRect()
// width: 1920, height: 1080, x:0, y:0
```

**Slutsats:**
- Chromium i kioskläge använder **hela panelens upplösning**
- Ingen adressrad, inga flikar, ingen browser‑UI
- Ingen reservyta för systempanel eller chrome

➡️ **Teknisk yta = faktisk användbar yta = 1920 × 1080 px**

---

## 3. Pixel‑ och skalningsförhållande

Verifierat:
```js
window.devicePixelRatio ≈ 1
```

- Ingen DPI‑skalning
- Ingen implicit zoom
- **1 CSS‑pixel ≈ 1 fysisk pixel**

Detta innebär att layout kan göras **pixel‑deterministiskt**.

---

## 4. Vad som *inte* påverkar ytan i denna setup

- Chromium kioskläge reducerar **inte** viewport
- OS‑panel/taskbar är **inte synlig**
- Ingen safe‑area eller inset (ej mobil, ej TV)

Om mindre yta observeras i framtiden beror det på:
- Chromium ej startad i riktig kiosk/fullscreen
- OS‑overlay ovanpå (felkonfigurerad panel)

---

## 5. Sammanfattning (kontrakt)

```text
TEKNISK SKÄRMYTA : 1920 × 1080 px
FAKTISK WEBBYTA  : 1920 × 1080 px
SKILLNAD         : 0 px
```

Alla layout‑ och innehållsproblem som uppstår är **inte hårdvaru‑ eller Chromium‑relaterade**, utan orsakas av hur innehållet disponeras inom denna fasta yta.

---

**Detta dokument är referens för alla framtida implementationer mot skärmen.**

