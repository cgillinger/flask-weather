# Changelog

Alla anmärkningsvärda ändringar i detta projekt dokumenteras i denna fil.
Formatet baseras på [Keep a Changelog](https://keepachangelog.com/sv/1.1.0/).

## [3.10.8] - 2026-07-08

### Fixat
- **Utomhus-AQI raderas inte längre vid API-avbrott**: senaste giltiga värdet behålls (med åldersloggning) när båda luftkvalitetskällorna fallerar, och rensas först när det är äldre än 3 timmar — gammal luftkvalitet ska inte presenteras som aktuell för evigt. Tidigare skrevs `None` över värdet så fort klientens 1h-cache gått ut, trots att loggen påstod "behåller ev. cache".

## [3.10.7] - 2026-07-08

### Fixat
- **Netatmo återhämtar sig nu efter tillfälliga fel**: tillgängligheten omprövas varje uppdateringscykel i stället för att låsas på "otillgänglig" vid första undantag (t.ex. nätverkstimeout). Tidigare krävdes omstart av containern för att få tillbaka Netatmo-data.
- **0.0°C visas korrekt**: två truthy-tester i frontend behandlade exakt noll grader som "ingen data" — prognosraden visade `--.-°` och SMHI-only-lägets stora temperatur frös på gamla värdet. Nu jämförs mot `null`.
- **Felaktig Fahrenheit-konvertering borttagen**: Netatmos API returnerar alltid °C; kontots enhetsinställning är bara en visningspreferens. Den gamla koden "konverterade" Celsiusvärden som om de vore Fahrenheit (20°C → −6,7°C) om kontot stod på imperial.
- **Luftfuktighetsstationen kan bytas ut**: om den cachade närmaste stationen slutar leverera (ingen data eller äldre än 2h) glöms den och nästa cykel söker på nytt, inkl. fallback-stationerna. Tidigare blev luftfuktigheten permanent tom tills omstart.
- **Mojibake i SMHI-klienten lagad**: 65+ rader dubbelkodade loggsträngar (`AnvÃ¤nder` → `Använder`, trasiga emojis) återställda, inkl. `temp_formatted`-värdet (`Â°C` → `°C`). Gammal skada från historik-ombyggnaden.

## [3.10.6] - 2026-07-08

### Borttaget
- **Regnmätarpanelen urkopplad igen** (inkopplades i 3.10.4 utöver själva buggfixen): regn kommuniceras redan av huvudikonen och vädereffekterna, så panelen var redundant och trängde datapunktsraden. Komponenten `RainDisplay` behålls komplett men medvetet oanropad (dokumenterat i filhuvudet). Buggfixens kärna är opåverkad: regnfälten levereras i `/api/current` och uppmätt regn triggar regneffekten.

## [3.10.5] - 2026-07-08

### Ändrat
- **Kodbas-städning för förvaltning**: samtliga kommentarer och docstrings i den levande koden översatta till engelska (loggmeddelanden och UI-texter förblir svenska). Ny `CLAUDE.md` i repo-roten med kodkarta, konventioner och varning för `backup/`-katalogen. `get_intelligent_weather_effect_type` i app.py annoterad: resultatet exponeras via API men konsumeras inte av frontenden — effektbesluten fattas klientsidigt.

### Borttaget
- **Verifierat död kod (~640 rader)**: elva oanvända hjälpfunktioner och tre ikonkonstanter från Tkinter-eran i `utils.py`, legacy-metoden `get_hourly_forecast` i SMHI-klienten, `setBarometerDetailFallback` + `BarometerManager`-aliaset, `FontAwesomeRenderer.createIcon`/`createVolumeIcon` samt `RainDisplay.logDetailedStats`. Varje borttagning referensverifierad; hela diffen maskinellt kontrollerad (AST-jämförelse för Python, kommentarstrippad jämförelse för JS) — inga oavsiktliga logikändringar.

## [3.10.4] - 2026-07-08

### Fixat
- **Netatmo-regndata nådde aldrig fram till API:t**: `rain`, `rain_sum_1` och `rain_sum_24` samlades in korrekt i smart-blendingen men utelämnades ur klientens slutdata, så `/api/current` fick alltid `None`. Fälten levereras nu, regnmätarpanelen i FAKTISK-sektionen visas (komponenten `RainDisplay` fanns färdig men anropades aldrig — nu inkopplad), och uppmätt regn kan trigga regneffekten även när prognossymbolen säger uppehåll. "Netatmo rain priority" fungerar därmed för första gången; regneffekten har hittills enbart styrts av prognossymbolen.

## [3.10.3] - 2026-07-08

### Fixat
- **Luftkvalitetsvärdena** (CO₂-ppm och AQI-siffran) visas nu i vit text (`--text-primary`) i stället för nivåfärgen — den gröna "God"-färgen var nästan oläslig på mörk bakgrund. Statusfärgen (grön/gul/röd) bärs fortfarande av löv-ikonen, och etiketterna INNE/UTE förblir dämpat grå.

### Dokumentation
- Engelska readme.md behandlar nu SMHI som **en av flera** väderleverantörer (luftfuktighet och luftkvalitet formulerade villkorat) och har en kort **ursprungsnot** om projektets Sverige-only-arv (därav SMHI som basklass, `smhi`-configblock och symbolskala 1-27). Svenska readme.sv.md förblir medvetet SMHI-centrerad.

## [3.10.2] - 2026-07-08

### Ändrat
- **Trycktrendens uppvärmnings-fallback** använder nu väderleverantörens **prognostryck-tendens** (verklig Δ tryck kommande 3h) i stället för en gissning utifrån vädersymbolen. Fallbacken triggar bara strax efter omstart/lucka innan Netatmos egen 3h-serie hunnit fyllas; den klassas på samma femgradiga trösklar som den uppmätta trenden och är **leverantörsoberoende** (SMHI/YR/Open-Meteo fyller alla prognostrycket). Saknas även prognostrycket visas ärligt *n/a* i stället för ett påhittat värde.
- `/api/pressure_trend` faller nu tillbaka på samma prognostendens när Netatmo-trenden är `n/a` (kunde tidigare visa `n/a` trots tillgänglig prognos).

### Dokumentation
- Nytt README-avsnitt **"Graceful fallback"** (engelska + svenska) som beskriver hur varje värde på skärmen degraderar ärligt när en källa saknas – inga tysta noll- eller dummy-värden.

## [3.10.1] - 2026-07-08

### Tillagt
- **Utomhus-luftkvalitet (European AQI)** som ny datakälla, valbar via `air_quality.mode` (`indoor` | `outdoor` | `both`). Utomhusvärdet hämtas från **närmaste SMHI-mätstation** (Datavärdskap luftkvalitet, OGC SOS med JSON) och beräknar European AQI från PM2.5/PM10/NO₂/O₃; **global fallback till Open-Meteo/CAMS** när ingen svensk station finns nära (fungerar var som helst i världen, ingen API-nyckel). Ny klient `reference/data/air_quality_client.py` med 1h-cache.
- **Ny frontend-komponent** `AirQualityDisplay`: inomhus-CO₂ och/eller utomhus-AQI på samma rad som barometer/UV. I `both`-läget visas `INNE`/`UTE` med "Luftkvalitet" överst, och löv-ikonen tar den *sämsta* av de två nivåerna. I `outdoor`-läget visas avståndet till mätstationen (📍, dolt vid CAMS-fallback som saknar station). Färgkodning är index-driven och därmed språkneutral.
- **i18n på alla åtta språk**: etiketter (Inomhus/Utomhus/Luftkvalitet) och de sex EEA-banden (God → Extremt dålig).

### Ändrat
- Prognosläge (utan Netatmo) visar nu **utomhus-luftkvalitet** i stället för att dölja rutan helt. `air_quality.mode` styr; utan Netatmo faller `both`/`indoor` tillbaka på utomhus automatiskt.

## [3.9.1] - 2026-07-07

### Ändrat
- **README på åtta språk**: huvud-readme.md är nu på engelska (fullständig guide, uppdaterad med leverantörsval, språk och ikonrotation i tekniska översikten). Svenska originalet ligger kvar i sin helhet som readme.sv.md. Kortversioner med snabbstart och grundkonfig på norska (readme.nb.md), danska (.da), finska (.fi), tyska (.de), franska (.fr) och spanska (.es) - alla med språkväxlarrad överst och hänvisning till den engelska/svenska för djupsektionerna. Licensnoten om amedia-meteo (CC BY-NC-SA) finns i samtliga versioner

## [3.9.0] - 2026-07-07

### Tillagt
- **Språkprojektet, etapp 3 - åtta språk**: svenska, norska (nb/no), danska, finska, tyska, franska, spanska och engelska. Vindterminologin per språk följer respektive lands väderinstitut (SMHI/YR/DMI/FMI/DWD/Météo-France/AEMET/Met Office Beaufort-benämningar), barometerorden följer klassiska barometerurtavlor per språk och kompassbokstäverna är språkanpassade (ny COMPASS-nyckel - svenskt V/O blev tidigare fel på alla andra språk). Franska/spanska använder fristående adjektiv för vind (Modéré/Moderado) eftersom 12h-korten visar termens första ord

### Fixat
- Femdygnsprognosens datum ("8 jul") använde en hårdkodad svensk månadslista - nu Intl med aktivt språks locale
- Hårdkodat "Lugnt" i vindtextformateraren

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
