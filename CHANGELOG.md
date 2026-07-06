# Changelog

Alla anmärkningsvärda ändringar i detta projekt dokumenteras i denna fil.
Formatet baseras på [Keep a Changelog](https://keepachangelog.com/sv/1.1.0/).

## [3.3.0] - 2026-07-06

### Tillagt
- **Ikonanimeringsläge** (`ui.icon_animations`): styr vilka väderikoner som animeras i SVG-paket som `amcharts` - `auto` (standard) ger Safari/iPad enbart animerad huvudikon medan prognosikonerna visas statiska, vilket åtgärdar animationslagg på WebKit-klienter (animerade SVG:er i `<img>` CPU-rastreras genom sitt feGaussianBlur-filter varje bildruta). Övriga lägen: `all`, `hero`, `none`. Chromium-kiosker påverkas inte av `auto`.
- Statiska (icke-animerade) varianter av amCharts-ikonerna i `static/assets/icons/amcharts-svg-static/`, genererade med nya `scripts/generate_static_icons.py`

## [3.2.4] - 2026-07-06

### Ändrat
- Större sekundprickar i klockan (max 6px → 10px) - verifierat kollisionsfritt på 1920x1080 (9.6px luft mellan prickar även när aktiv prick skalar upp)

## [3.2.3] - 2026-07-06

### Ändrat
- Röd ram och yttre glöd runt klockan borttagen - sekundprickarna står nu fritt mot bakgrunden

## [3.2.2] - 2026-07-06

### Fixat
- Ikoner med mycket viewBox-luft (framförallt solen) blev pyttesmå i femdygnsprognosen: nytt slot-skalningslager i CSS (`--slot-scale` för prognosrader/kort) plus per-fil-korrigering i paketmanifestet (`fileScale`). All skalning sker fortsatt via transform och kan aldrig påverka layouten.

## [3.2.1] - 2026-07-06

### Fixat
- SVG-ikonpaket kunde spränga layouten på 1920x1080-kioskskärmen: ikoner har nu en tvingad layoutbox på 1em (som fontglyfer) och skalas visuellt per paket via `transform: scale()` som aldrig påverkar layoutflödet. Fixar även för höga rader i femdygnsprognosen (inline-bildens baslinjeluft).

## [3.2.0] - 2026-07-06

### Tillagt
- **Ikonpaketssystem**: väderikonuppsättning växlas med `ui.icon_pack` i config (`weather-icons` = font/klassiskt, `amcharts` = animerade färg-SVG:er). Nya paket läggs till som manifest-poster i `static/js/utils/icon-packs.js`.
- Synlig staleness-indikator på skärmen när väderdata inte kan uppdateras
- Cache-busting (`?v=<VERSION>`) på alla lokala statiska filer - klienter ser ny kod direkt efter deploy
- waitress som produktionsserver (automatisk fallback till Flasks devserver)

### Fixat
- Trådsäkerhet: lås runt delad väderstate (tre uppdateringstrådar + requests kunde ge trasiga svar)
- UV-uppdateraren dog permanent vid månadsskiften (ogiltig datumberäkning) - trådlooparna är nu felskyddade
- Atomära skrivningar av tokens/tryckhistorik/cachefiler (korrupta filer vid krasch mitt i skrivning)
- `tokens.json` flyttad till `cache/` (volym-monterad) - roterade Netatmo-tokens överlever container-rebuilds, migreras automatiskt
- Netatmo-regnprioriteten för vädereffekter fungerade aldrig (saknad metod, felet svaldes tyst)
- Status rapporterade "Uppdaterad" även när SMHI-hämtningen misslyckats
- Blockerande CAMS-hämtning vid uppstart (upp till 3 min innan porten öppnades) flyttad till bakgrundstråd
- Halvårsgammal `uv_cache.json` låg incheckad i git och visades som färsk data i nya installationer

### Borttaget
- Oanvänt `core/`-paket (divergerad död kod), dubblett av `cams_uv_client.py`, bakupkopior av template/CSS

## [3.1.1] - 2026-06-17

### Fixat
- **Tryckhistoriken överlever nu container-rebuilds.** `pressure_history.json` flyttad till den volym-monterade `cache/`-katalogen (tidigare i repo-roten → bakades in i imagen och nollställdes vid varje `docker compose up --build`, vilket "tystade" de femgradiga snabbt-stegen i ~3h efter varje deploy). Automatisk engångsmigrering av befintlig historik från repo-roten till `cache/`.

## [3.1.0] - 2026-06-17

### Tillagt
- **Femgradig trycktrend**: Trenden är nu femgradig enligt `pressure-descriptions.md` (faller snabbt · faller · stabilt · stiger · stiger snabbt) istället för tregradig. Ytterstegen "faller/stiger snabbt" flaggar en snabb väderomställning.
- Snabbt-stegen får en egen visuell markör: **dubbelpil** (⇈/⇊) i trendraden samt en kraftigare ikonfärg (`rising-fast`/`falling-fast`).
- Nytt backend-fält `trend5` i trycktrend-objektet (rising_fast/rising/stable/falling/falling_fast + unknown).
- **Barometer-ordläge** (`ui.pressure_display: 'words'`): visar beskrivande nivåord som en fysisk barometer (Storm/Regn/Ostadigt/Vackert/Mycket torrt) med siffra och trendpil. Default `'numeric'`.

### Ändrat
- Trösklarna riktade om till specens skala: stabilt ±0,5 hPa/3h (tidigare ±0,8), snabbt vid |Δ| > 2 hPa/3h. Δ mäts som tidigare över 3h-fönstret (6h som fallback, proportionellt skalade trösklar).
- Tregradiga `trend` behålls för bakåtkompatibilitet; SMHI-fallbacken (utan riktig Δ) ger aldrig snabbt-steg.

## [3.0.0] - 2026-03-28

### Ändrat
- **Layout-rebalansering**: Dashboard-proportioner ändrade från 30/12/58 till 55/7/38 (φ-inspirerat)
- Klocka, temperaturer och väderikon skalade upp ~30% för bättre visuell balans
- Prognoskort komprimerade utan att ta bort datapunkter
- Forecast-card min-height borttagen för naturligare storleksanpassning
- Intern ombalansering av timkort: ikon och temp förstorade, vind komprimerad till enrad, nederbörd visas som separat rad under vind

### Tillagt
- VERSION-fil för central versionshantering
- CHANGELOG.md för ändringslogg

### Fixat
- Visuell obalans där prognoszonerna dominerade hero-innehållet
- Timprognoskortens overflow: krympt ikon, temperatur, padding och border
- Aggressivare krympning av timkort: ikon, temp, vind och tid skalade ner för att garantera plats på kioskskärm

## [2.x.x] och tidigare

Historiska versioner var inte centralt spårade. Se individuella filhuvuden för
filspecifik versionshistorik (styles.css, color-manager.js, etc.).
