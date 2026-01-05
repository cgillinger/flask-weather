# Development history & provenance

> This file preserves the project's pull-request record — each PR's branch, merge date and testing notes — as a maintenance reference. It complements the per-version [CHANGELOG.md](CHANGELOG.md) with the detail that lives at the pull-request level, so future maintenance has the full context in one place.

## Pull requests

### #1 — Add config-driven temperature layout (plats_1/plats_2)
*branch:* `claude/check-temperature-swap-rRkcb` · *state:* MERGED · *merged:* 2026-02-14

Introduce temperature_layout config that controls which data source (smhi/netatmo) is displayed on which position. plats_1 is the large primary temperature, plats_2 is the smaller secondary. When the configured plats_1 source is unavailable, it automatically falls back to the other source. SMHI-only mode continues to work as before.

Changed files:
- config_example.py: new temperature_layout section
- app.py: pass temperature_layout to frontend via ui_config
- index.html: renamed to generic plats-1/plats-2 slots
- styles.css: renamed CSS classes to match
- current-weather-view.js: getTemperatureLayout() maps sources to slots
- ui-adaptation-engine.js: config-aware plats-2 degradation

https://claude.ai/code/session_01SR3n2UU7awJeaEeg8PRYcb


### #2 — Revert "Merge pull request #1 from cgillinger/claude/check-temperatur…
*branch:* `claude/check-temperature-swap-rRkcb` · *state:* MERGED · *merged:* 2026-02-14

…e-swap-rRkcb"

This reverts commit 2cc56369c4869696eecf861f667e3663af46f6a2, reversing changes made to d4f3ea8afedd62648c0c3bdd1c19f5ebf68852ec.


### #3 — Swap temperature display order: FAKTISK (Netatmo) primary, PROGNOS (S…
*branch:* `claude/swap-temperature-display-order-xuHsX` · *state:* MERGED · *merged:* 2026-02-14

…MHI) secondary

- HTML: Faktisk-column now comes first (left, large), Prognos-column second (right, small)
- CSS: main-temperature styles applied to faktisk-column, smhi-temp-small to prognos-column
- CSS: single-temperature-mode now hides prognos-column instead of faktisk-column
- JS: ui-adaptation-engine hides prognos-column on Netatmo unavailability
- JS: adaptLabels targets netatmo-label for "TEMPERATUR" fallback text
- JS: current-weather-view populates primary position with SMHI temp in SMHI-only mode
- Fixed double-encoded UTF-8 in ui-adaptation-engine.js

https://claude.ai/code/session_01Y6rg63LapWGaRvo5eujhPU


### #4 — fix: aggressively shrink hourly forecast card elements for 1080p kiosk
*branch:* `claude/layout-rebalance-v3-8UoMr` · *state:* MERGED · *merged:* 2026-03-28

https://claude.ai/code/session_017CCMf21gvS9Tb5D426TAyR


### #5 — fix: rebalance hourly forecast card internals - larger icon/temp, sin…
*branch:* `claude/layout-rebalance-v3-8UoMr` · *state:* MERGED · *merged:* 2026-03-28

…gle-line wind

https://claude.ai/code/session_017CCMf21gvS9Tb5D426TAyR


### #6 — Migrate SMHI forecast API from PMP3gv2 to SNOW1gv1
*branch:* `claude/migrate-smhi-api-OXTFr` · *state:* MERGED · *merged:* 2026-03-31

SMHI deprecated the PMP3g/v2 forecast API as of 2026-03-31. Update CATEGORY and VERSION constants to use the new SNOW1g/v1 endpoint in all three client files.

https://claude.ai/code/session_01439r23imU7wgyneZbokehN


### #7 — Adapt parsing to SNOW1g/v1 response format
*branch:* `claude/migrate-smhi-api-OXTFr` · *state:* MERGED · *merged:* 2026-03-31

The SNOW1g API uses a different response structure than PMP3g:
- 'validTime' → 'time'
- 'parameters' array with {name, values} → flat 'data' dict
- Parameter names changed (e.g. 't' → 'air_temperature', 'Wsymb2' → 'symbol_code', 'ws' → 'wind_speed', etc.)

Update PARAMETERS mapping and parse_parameters() to handle the new flat dict structure. Update all validTime references throughout the client.

https://claude.ai/code/session_01439r23imU7wgyneZbokehN


### #8 — Add defensive error handling for SNOW1g migration
*branch:* `claude/migrate-smhi-api-OXTFr` · *state:* MERGED · *merged:* 2026-03-31

- Wrap geometry parsing in try/except (format may differ in SNOW1g)
- Wrap SMHI calls in update_weather_data() with own try/except so that SMHI failures don't block Netatmo/UV updates

https://claude.ai/code/session_01439r23imU7wgyneZbokehN


### #9 — Add SMHI API migration guide (PMP3gv2 → SNOW1gv1)
*branch:* `claude/migrate-smhi-api-OXTFr` · *state:* MERGED · *merged:* 2026-03-31

Documentation for migrating other projects from the deprecated PMP3g/v2 API to the new SNOW1g/v1, including the changed response structure, parameter name mapping, and parsing examples.

https://claude.ai/code/session_01439r23imU7wgyneZbokehN


### #10 — style(forecast): rebalance hourly card typography for distance readab…
*branch:* `claude/fix-forecast-card-typography-qbCHW` · *state:* MERGED · *merged:* 2026-04-19

…ility

Time and wind labels were too small to read on the MagicMirror display from normal viewing distance. Shrunk the icon slightly and tightened vertical gap to make room. Temperature remains hero.

- forecast-time: clamp(1rem,1.3vw,1.5rem) -> clamp(1.5rem,2vw,2.4rem)
- forecast-wind-text: clamp(0.95rem,1.3vw,1.6rem) -> clamp(1.2rem,1.6vw,2rem)
- forecast-icon: clamp(3rem,4.5vw,5rem) -> clamp(2.5rem,3.8vw,4.3rem)
- forecast-icon min-height: clamp(4rem,6vw,7rem) -> clamp(3.2rem,5vw,5.8rem)
- forecast-card gap: clamp(0.3rem,0.5vw,0.7rem) -> clamp(0.2rem,0.3vw,0.5rem)

New ratios (vs temp as 100%): time ~55%, wind ~40%, icon ~85%.

https://claude.ai/code/session_014BLKNvUuhZM5BWsnoyV8VE


### #11 — Add word-based barometer display mode
*branch:* `feature/pressure-word-descriptions` · *state:* MERGED · *merged:* 2026-06-17

## Vad

Nytt valbart visningsläge för barometern som emulerar en fysisk aneroidbarometer:

- **Rad 1:** absolut tryck → beskrivande nivåord (Storm · Regn · Ostadigt · Vackert · Mycket torrt)
- **Rad 2:** "nålen på skalan" → pil + siffra + trendord (t.ex. `↗ 1013 hPa · stiger`)
- Ikonens färg bär trenden i båda lägena (grön/röd/grå)

Banden följer `pressure-descriptions.md` (digitaliserad Huger-precisionsbarometer).

## Inställning

Styrs av `ui.pressure_display` i config (`'words'` | `'numeric'`). Default är `'numeric'` så befintligt beteende bevaras om nyckeln saknas. Plumbas genom samma kedja som `wind_unit` (config → `/api/current` → `dashboardState`).

## Verifiering

Testat lokalt (port 8036) + Playwright vid 1920×1080:
- API levererar `pressure_display`
- Live: `Ostadigt` / `→ 1007 hPa · stabilt`, balanserat mot UV:s tvåradiga kort
- Värsta fall `Mycket torrt` / `↘ 1043 hPa · faller` spiller inte över kolumnen, ingen radbrytning


### #12 — Make pressure trend five-grade (faller/stiger snabbt)
*branch:* `feature/five-grade-pressure-trend` · *state:* MERGED · *merged:* 2026-06-17

Gör lufttryckstrenden femgradig enligt `pressure-descriptions.md` (tidigare tregradig via en enda tröskel).

## Varför
Poängen ligger i ytterstegen **faller/stiger snabbt** — de flaggar en snabb väderomställning (hinner läget ändras medan man cyklar tio minuter?). Bara meningsfullt om Δ mäts vettigt.

## Δ-fönster (fråga 1)
Δ mäts som tidigare över **3h-fönstret** (`pressure_change`), 6h som fallback. Netatmo samplar var 10:e min → ~18 punkter/fönster. Trösklar riktade om till specen: stabilt **±0,5** hPa/3h (tidigare ±0,8), snabbt vid **|Δ| > 2**. 6h-fallbacken skalar trösklarna proportionellt (ingen extrapolering → inget brusförstärkt "snabbt").

## Uppdateringsfrekvens (fråga 2)
Oförändrad. 10-min-sampling över 3h räcker gott för snabbt-stegen; ingen extra API-last.

## Implementation (fråga 3)
- Backend: nytt fält `trend5` (rising_fast/rising/stable/falling/falling_fast + unknown); tregradiga `trend` behålls. `format_api_response_with_pressure_trend` vidarebefordrar nu `trend5` (tappades tidigare).
- Frontend: femgradig `TREND_META`; snabbt-stegen får **dubbelpil** (⇈/⇊) + kraftigare ikonfärg (`rising-fast`/`falling-fast`). "Okänt"/SMHI-fallback ger aldrig snabbt.

## Verifiering
Lokalt + Playwright: API ger `trend5: rising_fast` (Δ3h 3,4 via seedad historik); alla fem steg renderar, inget overflow ens vid "Mycket torrt" + längsta snabbt-raden. Enhetstest av tröskellogiken matchar specen på alla gränser.

Version 3.0.1 → 3.1.0.


### #13 — Persist pressure history across container rebuilds
*branch:* `fix/persist-pressure-history` · *state:* MERGED · *merged:* 2026-06-17

## Problem
`pressure_history.json` låg i repo-roten → Dockerfile (`COPY . .`) bakar in den i imagen, så varje `docker compose up --build` **nollställde** tryckhistoriken i containern. I ~3h efter varje deploy saknade 3h-fönstret nog med punkter → trenden föll till SMHI-gissningen och de nya femgradiga **snabbt-stegen tystnade**.

## Fix
Flyttar historiken till den redan volym-monterade `cache/`-katalogen så den överlever rebuilds, med **automatisk engångsmigrering** av befintlig historik från repo-roten. `cache/pressure_history.json` täcks redan av `.gitignore` (slash-lös pattern matchar på alla djup).

Verifierat lokalt: migreringsrad loggas, `cache/pressure_history.json` skapas och fylls på, API svarar.

Version 3.1.0 → 3.1.1.


### #14 — Robusthet och förvaltbarhet: trådsäkerhet, resilient trådar, atomära skrivningar
*branch:* `fix/robustness-hardening` · *state:* MERGED · *merged:* 2026-07-06

## Sammanfattning

Härdning för 24/7-drift efter en genomgång av hela kodbasen. Alla ändringar är verifierade lokalt (alla endpoints, Netatmo-auth, token-migrering) och provkörda på Pi 5:an.

### Kritiska buggfixar
- **Trådsäkerhet:** lås runt `weather_state` (3 uppdateringstrådar + Flask-requests delade dict utan skydd)
- **uv_updater dog permanent vid månadsskiften** (`.replace(day=32)` → `ValueError` utanför try) — nu `timedelta` + felskyddad loop med backoff
- **Atomära JSON-skrivningar** (tempfil + `os.replace`) för tokens, tryckhistorik, sol- och UV-cache
- **tokens.json → cache/** (volym-monterad på NAS): roterade Netatmo-tokens överlever container-rebuilds; automatisk migrering från gamla platsen
- **Saknad `updateFromNetatmoRain` implementerad** — Netatmo-regnprioriteten har aldrig fungerat (TypeError svaldes i det tysta)
- **Ärlig status:** `last_update` bumpas bara vid lyckad SMHI-hämtning; synlig staleness-badge i UI efter upprepade fel
- **Stale UV-cache borttagen ur git** (januaridata följde med nya installationer)

### Robusthet/förvaltbarhet
- Initial UV-hämtning flyttad till bakgrundstråden (Flask binder porten direkt; CAMS kan ta 60–180 s — viktigt för Dockers healthcheck)
- waitress som produktionsserver med fallback till devservern; `SECRET_KEY` från env
- Cache-busting `?v=<VERSION>` på alla lokala statiska assets (Flask cachar annars 12 h)
- Frontend: timeout på `/api/uv`, re-entransvakt i pollloopen, spårade övergångs-timeouts i weather-effects
- Död kod borttagen: `core/`-paketet (aldrig importerat, hade divergerat), dubblett-`cams_uv_client.py`, bakupfiler, no-op `removeWindDetailItems`

### Deploy-notis (NAS)
`docker compose up -d --build` krävs som vanligt. Vid första starten migreras `tokens.json` automatiskt till `cache/tokens.json`.


### #15 — Ikonpaketssystem: växla väderikonuppsättning via config
*branch:* `feature/icon-packs` · *state:* MERGED · *merged:* 2026-07-06

## Sammanfattning

Väderikonerna renderas nu via ett paketregister i stället för hårdkodade Weather Icons-klassnamn i vyerna. Paket väljs med en ny konfigväxel:

\`\`\`python
'ui': {
    'icon_pack': 'weather-icons',  # eller 'amcharts'
}
\`\`\`

- **weather-icons** (default): Weather Icons-fonten, färgkodad via ColorManager — pixelidentiskt med tidigare utseende
- **amcharts**: animerade färg-SVG:er (låg redan oanvända i repot) med dag/natt-varianter

## Arkitektur

SMHI-symbol (1–27) → semantisk nyckel (\`rain\`, \`clear\`, …) → aktivt pakets ikon. Symboltolkningen finns nu på ETT ställe; ett nytt paket är en manifest-post i \`ICON_PACKS\` plus ikonfiler under \`static/assets/icons/\` — ingen vykod behöver röras.

## Verifierat

Båda paketen provkörda lokalt i webbläsare (screenshot-jämförelse, inga konsolfel). Default-paketet är en exakt regressionsmatch mot tidigare rendering.


### #16 — README: version 3.2.4 + aktuell skärmdump
*branch:* `docs/readme-3.2.4` · *state:* MERGED · *merged:* 2026-07-06

Uppdaterar versionsreferensen till 3.2.4 och byter README-skärmdumpen till en färsk bild av dagens utseende (amcharts-ikonpaketet, större sekundprickar, ingen klockram). Föregående skärmdump arkiverad som `screenshots/screenshot2-v3.2.0-arkiv.png`.


### #17 — Ikonanimeringsläge (ui.icon_animations): fixar SVG-ikonlagg på Safari/iPad
*branch:* `claude/armcharts-ipad-animation-lag-89ynyu` · *state:* MERGED · *merged:* 2026-07-06

## Problem

amCharts-ikonpaketets animationer laggar på iPad. Orsaken är inte hårdvaran utan hur WebKit renderar ikonerna: varje SVG wrappar sitt animerade innehåll i ett `feGaussianBlur`-filter, och SVG-filter CPU-rastreras om varje bildruta när innehållet under animeras. Med ~10 ikoner samtidigt på skärmen (hero + 4 timprognoskort + 5 dagsrader) blir det för tungt för Safari/WebKit — som alla webbläsare på iPad/iPhone använder under huven.

## Lösning

Ny config-nyckel `ui.icon_animations` som styr vilka väderikoner som animeras i SVG-paket:

| Läge | Beteende |
|------|----------|
| `auto` (standard) | Animera allt — utom på Safari/iPad, som bara animerar huvudikonen |
| `all` | Animera alla ikoner på alla klienter |
| `hero` | Animera bara huvudikonen (aktuellt väder) |
| `none` | Alla ikoner statiska |

- **Statiska ikonvarianter**: eftersom ikonerna renderas som `<img>` kan sidans CSS inte pausa animationerna — statiska kopior (utan `<style>`-blocket) genereras med nya `scripts/generate_static_icons.py` till `static/assets/icons/amcharts-svg-static/` (incheckade).
- **Klientdetektering**: iPadOS uppger sig som Macintosh i user agent — detekteras via `maxTouchPoints`. Chrome på iPad (WebKit) täcks också.
- **Vyerna oförändrade**: hero-ikonen identifieras på sin befintliga CSS-klass `weather-main-icon` i `IconRegistry.createWeatherIcon()`. Config flödar via `/api/current` → `fetch-api-client.js` precis som `icon_pack`.
- Font-paketet `weather-icons` påverkas inte (inte animerat). Chromium-kiosken (Pi5) påverkas inte av `auto`.

Dokumenterat i readme (nytt avsnitt under Ikonpaket), `config_example.py` och CHANGELOG. Version 3.3.0.

## Verifiering

- `IconRegistry`-logiken testad i simulerade klientmiljöer (iPadOS Safari, Mac-Safari, Chrome-på-iPad → hero-only; desktop-Chromium → allt animerat; explicita lägen; ogiltiga värden ignoreras)
- Flask-appen körd: `/api/current` exponerar `icon_animations`, statiska SVG:er serveras
- Alla 22 statiska ikoner renderade i Chromium och visuellt kontrollerade — frysta lägen ser korrekta ut (blixten synlig och orange, droppar/flingor på basposition)



https://claude.ai/code/session_016xDEaU9mykrCL8qCt6dcBj

---
_Generated by [Claude Code](https://claude.ai/code/session_016xDEaU9mykrCL8qCt6dcBj)_


### #18 — Fyra nya ikonpaket: meteocons, amedia-meteo, open-weather-icons, kickstand-weather
*branch:* `claude/armcharts-ipad-animation-lag-89ynyu` · *state:* MERGED · *merged:* 2026-07-06

## Nya paket (väljs med `ui.icon_pack`)

| Paket | Typ | Licens |
|-------|-----|--------|
| `meteocons` | Animerade fill-SVG:er (Bas Milius) | MIT |
| `amedia-meteo` | Statiska färg-SVG:er (Amedia Utvikling) | **CC BY-NC-SA 4.0 — ej kommersiell användning** |
| `open-weather-icons` | Font, OpenWeatherMap-symboler (Ivan Vilanculo) | MIT |
| `kickstand-weather` | Font, 12 glyfer i Climacons-manér (KickstandApps) | SIL OFL 1.1 |

## Höjdpunkter

- **Meteocons** levereras med färdiga statiska varianter och samspelar därmed direkt med `ui.icon_animations` (hero-only på Safari/iPad). Animationerna är SMIL utan blur-filter — väsentligt lättare än amCharts även i `all`-läget.
- **Generiskt fontpaketsstöd**: `ICON_PACKS`-poster av typen `font` kan nu deklarera `baseClass` (`owi`, `ksi`) — Weather Icons-fonten är inte längre ett specialfall i renderingsvägen. Kickstand-fonten saknade CSS (glyfer mappade till bokstäverna a–l), så klassmappningen (`kickstand-weather.css`) är skriven för dashboarden utifrån fontens teckenkarta.
- **Licensefterlevnad**: varje vendrad ikonmapp innehåller sin licensfil (för Amedia en författad attributionsfil enligt CC-kraven). Nytt readme-avsnitt "Ikonpaketens licenser" med upphov och länkar; MIT-avsnittet anger uttryckligen undantagen. NC-begränsningen för `amedia-meteo` flaggas i readme, `config_example.py` och kodkommentarer.
- Mappningsbegränsningar dokumenterade: `open-weather-icons` saknar snöblandat/intensitetsgrader (snöikonen används), `kickstand-weather` visar snöblandat som regn och dimma som dis.

Version 3.4.0, CHANGELOG uppdaterad.

## Verifiering

- Registry-tester i node-vm: alla 6 paket × 27 SMHI-symboler × dag/natt ger giltiga element, alla refererade SVG-filer finns på disk, alla CSS-klasser finns i respektive fontpakets CSS, Meteocons statiska varianter saknar SMIL och väljs korrekt i hero-läget på simulerad iPad
- Alla paket renderade i Chromium (dag- och nattvarianter) och visuellt kontrollerade
- Anmärkning: npm-paketet `meteo-icons` är ett annat, anonymt paket — Amedias ikoner hämtades från deras GitHub-källa (`icons/standard/`)



https://claude.ai/code/session_016xDEaU9mykrCL8qCt6dcBj

---
_Generated by [Claude Code](https://claude.ai/code/session_016xDEaU9mykrCL8qCt6dcBj)_


### #19 — Paketspecifik ikonskalning + fix för dropp-överlapp i femdygns
*branch:* `fix/per-pack-icon-scaling` · *state:* MERGED · *merged:* 2026-07-07

## Sammanfattning
Efter okulärbesiktning av samtliga sex ikonpaket i Playwright (1920x1080):

- **Ny mekanism**: `icon-packs.js` sätter `data-icon-pack` på dokumentroten → CSS kan rikta storleksregler mot ett enskilt paket utan att påverka övriga
- **amedia-meteo**: paketskala 1.2 + slot-boost i hero (1.25) och 12-timmarskorten (1.35)
- **kickstand-weather**: 1.3× i alla slottar (tunna linjeglyfer ritade smått)
- **weather-icons**: femdygnsglyferna krymps till 0.82 — skurikonernas regndroppar målas under teckenrutan (ink overflow) och flöt visuellt ihop med nästa dags ikon när två regndagar låg i följd

All skalning sker med `transform` inom oförändrade layoutboxar — radhöjder och layout kan aldrig påverkas. VERSION 3.4.1 för cache-bust.

## Test
Alla sex paket körda lokalt och skärmdumps-verifierade i Playwright; överlappet i weather-icons femdygns mätt före/efter (layoutboxar 53px + 10px lufl, ingen boxöverlappning — enbart glyf-bläck).


### #20 — Automatisk ikonpaketsrotation (dag/vecka/månad)
*branch:* `feature/icon-pack-rotation` · *state:* MERGED · *merged:* 2026-07-07

## Sammanfattning
Ny config-nyckel `ui.icon_pack_rotation` låter dashboarden rotera mellan ikonpaketen automatiskt:

```python
'icon_pack_rotation': {
    'enabled': True,
    'interval': 'week',   # 'day' | 'week' | 'month'
    'exclude': [],        # paket som hoppas över
},
```

- **Ingen hårdkodad paketlista**: rotationen utgår från `ICON_PACKS`-registryt — nya paket kommer med automatiskt; `exclude` filtrerar bort oönskade
- **Deterministiskt ur datumet** (monotona periodräknare, lokal tid): alla klienter (kiosk, iPad) visar samma paket utan synk; byte vid midnatt/måndag/månadsskifte
- **Omvärderas varje pollcykel** — bytet sker utan omladdning
- `ui.icon_pack` är reserv när rotationen är av eller alla paket uteslutits
- Dokumenterat i readme + config_example; VERSION 3.5.0

## Test
Playwright-verifierat: dagrotation ger alla sex paket i följd med korrekt wrap (dag 7 = dag 1), veckobyte sön→mån, månadsbyte 31 jul→1 aug, exclude väljer annat paket, tom paketlista → fallback med konsolvarning. Livekontroll: rotationen aktiverade dagens paket inkl. `data-icon-pack`-attributet så per-paket-skalningarna följer med.


### #21 — Projekt Weatherprovider: valbar väderleverantör med YR/met.no som första alternativ
*branch:* `feature/weather-provider-yr` · *state:* MERGED · *merged:* 2026-07-07

## Sammanfattning
Milstolpe 1 av Projekt Weatherprovider: dashboarden är inte längre låst till SMHI.

```python
'weather_provider': 'yr',  # 'smhi' (default) | 'yr' (YR/met.no)
```

**Design (väg A, inspirerad av MagicMirrors provider-arkitektur):**
- `YRClient` ärver `SMHIClient` och översätter met.no:s locationforecast-svar till samma timeSeries-struktur som SMHI:s SNOW1gv1 — API:erna delar redan parameternamn — med `symbol_code` mappad till SMHI-skalan 1–27
- All befintlig logik ärvs oförändrad (cache, tidpunktsurval, 12h/femdygns, animation triggers, femdygnsvägning) och API-kontraktet mot frontend är intakt: ikonpaket, rotation och WeatherEffects fungerar identiskt oavsett leverantör
- YR kräver ingen API-nyckel; identifierande User-Agent + 10-minuterscache enligt met.no:s villkor
- Luftfuktighet ur YR-prognosen istället för SMHI:s observationsstationer
- Okänd leverantör → fallback till SMHI med varning; utan confignyckel är beteendet exakt som idag

## Test
- Fristående klienttest mot live-API: aktuellt väder, 12h, femdygns — symboler validerade inom 1–27, humidity, animation triggers
- Hela appen med `weather_provider: 'yr'`: alla tre endpoints (`/api/current`, `/api/forecast`, `/api/daily`) levererar YR-data (`data_source: YR`), Playwright-besiktigad dashboard renderar felfritt, noll konsolfel
- Default (`smhi`) oförändrat beteende


### #22 — Projekt Weatherprovider milstolpe 2: Open-Meteo — global täckning
*branch:* `feature/weather-provider-openmeteo` · *state:* MERGED · *merged:* 2026-07-07

## Sammanfattning
Tredje väderleverantören och målet uppnått: **dashboarden fungerar nu var som helst i världen** (SMHI täcker bara Norden).

```python
'weather_provider': 'open-meteo',  # 'smhi' | 'yr' | 'open-meteo'
```

- Open-Meteo: gratis, ingen API-nyckel, global täckning med bästa modell per plats (DWD/NOAA/Meteo-France/ECMWF m.fl.)
- `OpenMeteoClient` ärver `YRClient` (återbrukar prognosbaserad luftfuktighet) och översätter Open-Meteos kolumnformat till samma timeSeries-struktur; WMO-koder mappas till SMHI-skalan 1–27
- Tider i UTC med Z-suffix så det ärvda tz-medvetna tidpunktsurvalet fungerar; vind i m/s
- Fix: luftfuktighetsetiketten var hårdkodad "YR-prognos" — nu leverantörsmedveten
- Dokumenterat i readme + config_example; VERSION 3.7.0

## Test
- Fristående klienttest mot live-API för **Stockholm och New York** — global täckning verifierad för både `open-meteo` och `yr` (symboler validerade 1–27, humidity, 12h + femdygns)
- Hela appen med `weather_provider: 'open-meteo'`: alla endpoints levererar (`data_source: Open-Meteo`), Playwright-besiktigad dashboard, noll konsolfel
- Default (`smhi`) oförändrat beteende


### #23 — Visa aktiv väderleverantör under PROGNOS
*branch:* `feature/provider-label` · *state:* MERGED · *merged:* 2026-07-07

## Sammanfattning
Aktiv väderleverantör visas nu diskret i grått inom parentes under PROGNOS-etiketten — "(SMHI)", "(YR)" eller "(Open-Meteo)". Värdet läses ur `data_source` i API-svaret och följer `weather_provider`-valet automatiskt, inklusive vid framtida leverantörer.

- Ny rad `.smhi-provider` under `#smhi-label` (opacity 0.55, liten grad, samma grå som sekundärtext)
- Playwright-verifierad med både SMHI ("(SMHI)") och YR ("(YR)") aktiva; computed style kontrollerad
- VERSION 3.7.1 för cache-bust


### #24 — Dölj CO2-rutan i prognosläge
*branch:* `fix/hide-co2-prognos-only` · *state:* MERGED · *merged:* 2026-07-07

## Sammanfattning
CO2/luftkvalitet-rutan visade ett statiskt baslinjevärde (400 ppm) i prognosläge (`use_netatmo=False`) trots att den saknar datakälla utan Netatmo-station. Rotorsaken: `ui-adaptation-engine.js` satte redan klasserna `netatmo-hidden` och `smhi-only-mode`, men CSS-reglerna för dem har aldrig funnits.

- `.netatmo-hidden { display: none !important }` — rutan döljs när Netatmo saknas
- `.data-points-grid.smhi-only-mode` går över till `auto-fit` så kvarvarande rutor fördelas jämnt över bredden istället för att lämna tomma kolumner
- Netatmo-läget är helt oförändrat — verifierat med computed styles (4 kolumner, CO2-rutan synlig med riktig data, 530 ppm)

## Test
Playwright i båda lägena: prognosläge (Open-Meteo utan Netatmo) → rutan borta, jämn fördelning; Netatmo-läge → identisk layout som före ändringen.


### #25 — Språkprojektet etapp 1+2: i18n-motor + komplett stränginventering
*branch:* `feature/i18n` · *state:* MERGED · *merged:* 2026-07-07

## Sammanfattning
Grunden för flerspråksstöd, MagicMirror-mönstret: i18n-motor + språkkataloger i `static/translations/`.

- **`i18n.js`**: `I18n.register()`, `setLanguage()`, `t(nyckel, {params})`, `apply()` för statiska DOM-etiketter. Fallback-kedja: valt språk → svenska → nyckeln själv
- **`sv.js`**: komplett svensk katalog — etiketter, status/staleness, väderbeskrivningar (symbol 1–27), vindterminologi (land/sjö/beaufort), barometerord + femgradig trend, UV-risknivåer, formatsträngar med platshållare
- **`ui.language`** i config, plumbas via `/api/current` och sätts innan vyerna renderar
- **Datum/veckodagar via `Intl`** med språkets `__locale` — de hårdkodade svenska namnlistorna i klockan och femdygnsvyn är borta
- UV-risktexten översätts nu från `risk_level`-koden (backendtexten är fallback)
- Nytt språk = kopiera `sv.js`, översätt, lägg till script-tagg, sätt `language`

## Språkneutralitet verifierad
Vädereffekterna triggas av `weather_symbol` 1–27 (aldrig av text) — regn/snö/åska fungerar oavsett språk. Samma gäller barometerns färgklasser (trendkoder) och UV-färgerna (risk_level).

## Test
- Svenska renderar **identiskt** mot före refaktoreringen (Playwright, noll konsolfel, 155 meddelanden)
- Hela renderingsvägen språkbytestestad med inline-registrerad testkatalog: etiketter, väderbeskrivning, formatsträngar, barometerord, trend och Intl-veckodagar byter korrekt, och config-styrningen tar tillbaka kontrollen vid nästa poll (designat beteende)

Etapp 3 (`en.js` + `nb.js`) pausad enligt plan — vindterminologi/Beaufort-ord på engelska och norska kräver research först.


### #26 — Språkprojektet etapp 3: åtta språk med institutsverifierad terminologi
*branch:* `feature/i18n-languages` · *state:* MERGED · *merged:* 2026-07-07

## Sammanfattning
Åtta språk: **svenska, norska (nb/no), danska, finska, tyska, franska, spanska, engelska** — valbara med `ui.language`.

**Terminologi-research per språk:**
- **Vind**: YR/Meteorologisk institutt (nb), DMI (da), Ilmatieteen laitos (fi — deras m/s-gränser sammanfaller nästan exakt med appens skalsteg), DWD (de), Météo-France Beaufort (fr), AEMET Beaufort (es), Met Office (en)
- **Barometerord**: klassiska barometerurtavlor per språk (Stormy/Rain/Change/Fair/Very dry · Sturm/Regen/Veränderlich/Schön/Sehr trocken · Tempête/Pluie/Variable/Beau temps/Très sec ...)
- **Vardagstermer** stämda mot MagicMirrors translations/ (sv/nb/da/fi/de/fr/es/en)
- Franska/spanska vindtermer som fristående adjektiv (Modéré/Moderado) eftersom 12h-korten visar termens första ord

**Fixar upptäckta under testning:**
- Kompassbokstäverna var hårdkodat svenska — "Light wind **V**" på engelska. Ny `COMPASS`-nyckel per språk (sv `V/O`, en `W/E`, nb/da `Ø`, fr/es `O` för väst/Ouest/Oeste)
- Femdygnsdatumen ("8 jul") använde hårdkodad svensk månadslista — nu `Intl` med aktivt språks locale
- Hårdkodat "Lugnt" i vindtextformateraren

## Test
Playwright-verifierat live via config-byte: **engelska** (Tuesday 7 July · ACTUAL/FORECAST · Light wind W · 8 Jul · Wednesday) och **tyska** (Dienstag 7 Juli · GEMESSEN/PROGNOSE · Schwacher Wind W · Wechselnd bewölkt · fällt). Svenska renderar oförändrat. Noll konsolfel.


### #27 — README på åtta språk (engelska som huvudversion)
*branch:* `docs/readme-i18n` · *state:* MERGED · *merged:* 2026-07-07

## Sammanfattning
- **`readme.md` är nu på engelska** — fullständig guide, innehållsmässigt uppdaterad: leverantörsval (SMHI/YR/Open-Meteo), åtta UI-språk, ikonrotation, "forecast-only" istället för "SMHI-only", och provider-/i18n-arkitekturen i tekniska översikten
- **`readme.sv.md`**: svenska originalet bevarat i sin helhet
- **`readme.nb.md` / `.da` / `.fi` / `.de` / `.fr` / `.es`**: kortversioner per språk (funktioner, snabbstart, grundkonfig med lokala exempelkoordinater — Oslo/København/Helsinki/Berlin/Paris/Madrid — och rätt `language`-val), med hänvisning till en/sv-utgåvorna för djupsektionerna (UV-setup, felsökning)
- Språkväxlarrad överst i samtliga åtta filer
- Licensnoten om `amedia-meteo` (CC BY-NC-SA, endast icke-kommersiellt) medtagen i **alla** versioner
- VERSION 3.9.1


### #28 — Nya installations-defaults: engelska, YR, forecast-only
*branch:* `feature/install-defaults` · *state:* MERGED · *merged:* 2026-07-07

## Sammanfattning
`reference/config_example.py` — det en ny användare kopierar till `config.py` — levereras nu med:

| Inställning | Förut | Nu |
|---|---|---|
| `weather_provider` | `smhi` | **`yr`** (global täckning, ingen nyckel) |
| `ui.language` | `sv` | **`en`** |
| `use_netatmo` | `False` | `False` (oförändrat) |
| `ui.icon_pack` | `weather-icons` | `weather-icons` (oförändrat — originalet) |

**Viktigt:** kodens fallback-defaults (`smhi`/`sv` när nycklarna saknas) är medvetet orörda, så befintliga installationer byter inte beteende vid uppgradering — bara nyinstallationer får de nya valen.

Readme (en + sv) uppdaterade att spegla detta.

## Test
Exempelconfigen körd som nyinstallation lokalt och Playwright-besiktigad: engelskt UI genomgående, `data_source: YR`, enkolumnsläge med CO₂-rutan dold, weather-icons-paketet, noll konsolfel.


## Full commit log (original history)

```
e207a7a02  2026-07-07  Merge pull request #28 from cgillinger/feature/install-defaults
0be36ea19  2026-07-07  Jakarta-testfynd: location_name i headern + soltider i platsens tidszon
15f190e78  2026-07-07  Nya installations-defaults: engelska, YR, forecast-only
f1260723d  2026-07-07  Merge pull request #27 from cgillinger/docs/readme-i18n
90d36c55d  2026-07-07  README på åtta språk: engelska som huvud + språksuffixade versioner
b9f601339  2026-07-07  Merge pull request #26 from cgillinger/feature/i18n-languages
16e7ce379  2026-07-07  Språkprojektet etapp 3: åtta språk med institutsverifierad terminologi
370b280b1  2026-07-07  Merge pull request #25 from cgillinger/feature/i18n
0711bdec4  2026-07-07  Språkprojektet etapp 1+2: i18n-motor + komplett stränginventering
78792c08b  2026-07-07  Merge pull request #24 from cgillinger/fix/hide-co2-prognos-only
93d468d40  2026-07-07  Dölj CO2/luftkvalitet i prognosläge (saknar datakälla utan Netatmo)
4d8f78090  2026-07-07  Merge pull request #23 from cgillinger/feature/provider-label
1734bdb30  2026-07-07  Visa aktiv väderleverantör under PROGNOS-etiketten
0297cd07f  2026-07-07  Merge pull request #22 from cgillinger/feature/weather-provider-openmeteo
7e0e983a7  2026-07-07  Projekt Weatherprovider milstolpe 2: Open-Meteo - global täckning
d2ea54bfc  2026-07-07  Merge pull request #21 from cgillinger/feature/weather-provider-yr
d54f0d049  2026-07-07  Projekt Weatherprovider: valbar leverantör, YR/met.no som första alternativ
29e75a3bd  2026-07-07  Merge pull request #20 from cgillinger/feature/icon-pack-rotation
27cb0ad7e  2026-07-07  Automatisk ikonpaketsrotation (ui.icon_pack_rotation)
2db6a62b7  2026-07-07  Merge pull request #19 from cgillinger/fix/per-pack-icon-scaling
d22ad2952  2026-07-07  Paketspecifik ikonskalning via data-icon-pack + fix för dropp-överlapp
37ba4e976  2026-07-07  Merge pull request #18 from cgillinger/claude/armcharts-ipad-animation-lag-89ynyu
db219eae4  2026-07-06  Fyra nya ikonpaket: meteocons, amedia-meteo, open-weather-icons, kickstand-weather
622f33c4a  2026-07-06  Merge pull request #17 from cgillinger/claude/armcharts-ipad-animation-lag-89ynyu
2678fcbec  2026-07-06  Ikonanimeringsläge (ui.icon_animations): fixar SVG-ikonlagg på Safari/iPad
e09252a15  2026-07-06  Merge pull request #16 from cgillinger/docs/readme-3.2.4
1213eb0ab  2026-07-06  README: version 3.2.4 + ny skärmdump (amcharts, större sekundprickar)
fb21c0501  2026-07-06  Större sekundprickar i klockan
b272b1f08  2026-07-06  Ta bort röd ram och yttre glöd runt klockan
db708fbab  2026-07-06  Ikonpaket: slot-skalning + per-fil-skala (solen var pyttesmå i femdygns)
6f177c815  2026-07-06  Version 3.2.1: cache-bust för ikonlayoutfixen
f4766f703  2026-07-06  Ikonpaket: tvingad 1em-layoutbox med transform-skalning per paket
d85136d8a  2026-07-06  Version 3.2.0: uppdatera README, changelog och skärmdump
0dc05a9c8  2026-07-06  Ignorera .cdsapirc (CAMS-nyckel, låg lokalt tillagd på NAS:en)
2cf52b5f0  2026-07-06  Merge pull request #15 from cgillinger/feature/icon-packs
0981263e6  2026-07-06  Ikonpaketssystem: växla väderikonuppsättning via ui.icon_pack i config
c5be38fcd  2026-07-06  Merge pull request #14 from cgillinger/fix/robustness-hardening
34b7a6298  2026-07-06  Ta bort stale uv_cache.json ur git och ignorera cache/
36c8ede1a  2026-07-06  Robusthet och förvaltbarhet: trådsäkerhet, resilient trådar, atomära skrivningar
e123514e5  2026-06-17  Merge pull request #13 from cgillinger/fix/persist-pressure-history
55b1bf498  2026-06-17  Persist pressure history across container rebuilds
c301b3039  2026-06-17  Merge pull request #12 from cgillinger/feature/five-grade-pressure-trend
10552c821  2026-06-17  Make pressure trend five-grade (faller/stiger snabbt)
00b293707  2026-06-17  Merge pull request #11 from cgillinger/feature/pressure-word-descriptions
6acfdb287  2026-06-17  Add word-based barometer display mode
9a86e1c1a  2026-06-16  Add files via upload
1a0720750  2026-04-19  Merge pull request #10 from cgillinger/claude/fix-forecast-card-typography-qbCHW
0778d8778  2026-04-19  style(forecast): rebalance hourly card typography for distance readability
8a5c3d6a9  2026-04-01  Add files via upload
e2b2bdda6  2026-04-01  Add files via upload
d55a567fd  2026-04-01  Delete reference/data/smhi_client_backup.py
1e684b92d  2026-04-01  Delete reference/data/smhi_client.py.backup
6b6830513  2026-04-01  Delete smhi_client.py
50fc752d3  2026-04-01  Updated for new SMHI API
84d2a649e  2026-03-31  Merge pull request #9 from cgillinger/claude/migrate-smhi-api-OXTFr
d24bd6db0  2026-03-31  Add SMHI API migration guide (PMP3gv2 → SNOW1gv1)
6cf4d16ea  2026-03-31  Merge pull request #8 from cgillinger/claude/migrate-smhi-api-OXTFr
e5938293c  2026-03-31  Add defensive error handling for SNOW1g migration
570c12221  2026-03-31  Merge pull request #7 from cgillinger/claude/migrate-smhi-api-OXTFr
da6c2a573  2026-03-31  Adapt parsing to SNOW1g/v1 response format
8f1699787  2026-03-31  Merge pull request #6 from cgillinger/claude/migrate-smhi-api-OXTFr
aa78dfd0c  2026-03-31  Migrate SMHI forecast API from PMP3gv2 to SNOW1gv1
2fdc954a4  2026-03-28  Merge pull request #5 from cgillinger/claude/layout-rebalance-v3-8UoMr
e80ef0011  2026-03-28  fix: rebalance hourly forecast card internals - larger icon/temp, single-line wind
79a8d780d  2026-03-28  Merge pull request #4 from cgillinger/claude/layout-rebalance-v3-8UoMr
2bfdb3f77  2026-03-28  fix: aggressively shrink hourly forecast card elements for 1080p kiosk
a83821294  2026-03-28  Delete reference/config (kopia).py
a3ea7c9b8  2026-03-28  fix: shrink hourly forecast card inner elements to prevent overflow
b5946f523  2026-03-28  feat: layout rebalance (φ-proportions) + versioning + README update
96ed09231  2026-02-14  Merge pull request #3 from cgillinger/claude/swap-temperature-display-order-xuHsX
9672e6c82  2026-02-14  Swap temperature display order: FAKTISK (Netatmo) primary, PROGNOS (SMHI) secondary
6a8e50a50  2026-02-14  Merge pull request #2 from cgillinger/claude/check-temperature-swap-rRkcb
91de467e8  2026-02-14  Revert "Merge pull request #1 from cgillinger/claude/check-temperature-swap-rRkcb"
2cc56369c  2026-02-14  Merge pull request #1 from cgillinger/claude/check-temperature-swap-rRkcb
f6efbf9fe  2026-02-11  Add config-driven temperature layout (plats_1/plats_2)
d4f3ea8af  2026-01-11  Tweaked color settings
54db50c6d  2026-01-11  Fixed color system
527c4b29a  2026-01-10  Fixed stuff
942433755  2026-01-05  Add tokens example file
53c91c63b  2026-01-05  Initial commit
```
