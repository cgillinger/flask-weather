# Changelog

Alla anmärkningsvärda ändringar i detta projekt dokumenteras i denna fil.
Formatet baseras på [Keep a Changelog](https://keepachangelog.com/sv/1.1.0/).

## [3.8.0] - 2026-07-07

### Tillagt
- **Språkprojektet, etapp 1+2 - språkfilsstöd**: all användartext går nu via en i18n-motor (`static/js/utils/i18n.js`) med språkkataloger i `static/translations/` (MagicMirror-mönstret). UI-språket väljs med `ui.language` i config och plumbas via API:t; fallback-kedja valt språk → svenska → nyckeln. Svenska (`sv.js`) är komplett och renderar identiskt mot tidigare. Datum och veckodagar översätts via webbläsarens Intl (`__locale` per språkfil) - inga egna tabeller. Vädereffekter, ikonval, trend- och UV-färger är verifierat språkneutrala (styrs av symbolkoder, inte texter). Engelska och norska kommer i etapp 3

## [3.7.2] - 2026-07-07

### Fixat
- CO2/luftkvalitet-rutan döljs nu i prognosläge (use_netatmo=False) - den visade ett statiskt baslinjevärde (400 ppm) utan datakälla. ui-adaptation-engine satte redan klasserna `netatmo-hidden` och `smhi-only-mode` men CSS:en för dem saknades och de hade aldrig haft effekt. Rutnätet fördelar nu också kvarvarande rutor jämnt i prognosläge istället för att lämna tomma kolumner; Netatmo-lägets layout är helt oförändrad

## [3.7.1] - 2026-07-07

### Tillagt
- Aktiv väderleverantör visas diskret i grått inom parentes under PROGNOS-etiketten, t.ex. "(SMHI)" eller "(YR)" - hämtas ur data_source i API-svaret och följer weather_provider-valet automatiskt

## [3.7.0] - 2026-07-07

### Tillagt
- **Projekt Weatherprovider, milstolpe 2 - global täckning**: Open-Meteo som tredje väderleverantör (`weather_provider: 'open-meteo'`). Gratis utan API-nyckel, global täckning med bästa modell per plats (DWD/NOAA/Meteo-France/ECMWF m.fl.). WMO-vaderkoder mappas till SMHI-skalan 1-27; luftfuktighet ur prognosen. Verifierad med både Stockholm och New York - dashboarden fungerar nu var som helst i världen med `yr` eller `open-meteo`

### Fixat
- Luftfuktighetsetiketten i API-svaret var hårdkodad "YR-prognos" - nu leverantörsmedveten (visar t.ex. "Open-Meteo-prognos")

## [3.6.0] - 2026-07-07

### Tillagt
- **Projekt Weatherprovider, milstolpe 1**: valbar väderleverantör via `weather_provider` i config (`'smhi'` default, `'yr'` = YR/met.no). YRClient ärver SMHIClient och översätter locationforecast-svaret till samma timeSeries-struktur med symbolerna mappade till SMHI-skalan 1-27 - all befintlig logik (cache, prognosurval, animation triggers, femdygnsvägning) och hela API-kontraktet mot frontend är oförändrat, så ikonpaket, rotation och WeatherEffects fungerar identiskt oavsett leverantör. YR kräver ingen API-nyckel (identifierande User-Agent skickas enligt met.no:s villkor, cache förlängd till deras 10-minutersgräns); luftfuktighet tas ur YR-prognosen istället för SMHI:s observationsstationer. Okänd leverantör i config faller tillbaka på SMHI med varning

## [3.5.0] - 2026-07-07

### Tillagt
- **Automatisk ikonpaketsrotation** (`ui.icon_pack_rotation`): dashboarden kan rotera mellan ikonpaketen per dag, vecka eller månad. Rotationen utgår från ICON_PACKS-registryt (aldrig hårdkodad paketlista - nya paket kommer med automatiskt) minus paket i `exclude`-listan. Valet är deterministiskt ur datumet så alla klienter visar samma paket utan synk; `ui.icon_pack` gäller som reserv när rotationen är avstängd eller alla paket uteslutits

## [3.4.1] - 2026-07-07

### Tillagt
- Paketspecifika ikonjusteringar: `icon-packs.js` sätter nu `data-icon-pack` på dokumentroten, vilket låter CSS rikta storleksregler mot ett enskilt ikonpaket utan att påverka de andra

### Ändrat
- amedia-meteo: paketskala 1.2 plus extra slot-boost i hero (1.25) och 12-timmarskorten (1.35) - paketet ritar sitt innehåll med mer viewBox-luft än övriga SVG-paket. Okulärbesiktigat på 1920x1080
- kickstand-weather: fontglyferna transform-skalas 1.3× i hero, 12-timmars och femdygns - de tunna linjeikonerna ritade smått i alla slottar

### Fixat
- weather-icons: skur-glyferna (wi-day-showers m.fl.) målar regndroppar under sin teckenruta, vilket gav synligt ihopflutna ikoner i femdygnsprognosen när två regndagar hamnade i följd. Glyfen krymps nu visuellt (0.82) inom sin oförändrade layoutbox

## [3.4.0] - 2026-07-06

### Tillagt
- **Fyra nya ikonpaket** (väljs med `ui.icon_pack`):
  - `meteocons` - animerade färg-SVG:er av Bas Milius (MIT). Levereras med färdiga statiska varianter och samspelar med `ui.icon_animations`; animationerna är SMIL utan filter och därmed mycket lättare än amcharts.
  - `amedia-meteo` - statiska färg-SVG:er av Amedia Utvikling med komplett dag/natt och alla nederbördsintensiteter. OBS: CC BY-NC-SA 4.0 - endast icke-kommersiell användning.
  - `open-weather-icons` - fontpaket av Ivan Vilanculo (MIT), OpenWeatherMap-symboler med dag/natt, färgkodas automatiskt.
  - `kickstand-weather` - minimalistiskt fontpaket av KickstandApps (SIL OFL 1.1), 12 glyfer i Climacons-manér; klass-CSS:en är skriven för dashboarden.
- Generiskt stöd för fontpaket i ikonregistryt (`baseClass` per paket) - Weather Icons-fonten är inte längre specialfall i renderingsvägen
- Licensdokumentation: varje vendrad ikonmapp innehåller sin licensfil, readme har nytt avsnitt "Ikonpaketens licenser", och MIT-avsnittet anger undantagen

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
