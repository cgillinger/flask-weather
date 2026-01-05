# SMHI Open Data API — Referensdokumentation

> **Senast uppdaterad:** 2026-04-01  
> **Status:** PMP3gv2 och Mesan2gv1 avvecklade (HTTP 404 sedan 2026-03-31)  
> **Verifierad mot:** Faktiska API-anrop 2026-04-01  
> **Källa:** SMHI officiell dokumentation + live API-svar

---

## 1. Översikt

SMHI ersatte två äldre API:er den 31 mars 2026:

| Typ | Avvecklat API | Nytt API | Bas-URL |
|---|---|---|---|
| Prognoser | PMP3gv2 (HTTP 404) | **SNOW1gv1** | `opendata-download-metfcst.smhi.se` |
| Analyser | Mesan2gv1 (HTTP 404) | **Mesan2gv2** | `opendata-download-metanalys.smhi.se` |

**Opåverkade API:er:** metobs (observationer), UV-index/CAMS, hydrologiska data, oceanografiska data.

---

## 2. Borttagna endpoints

Följande endpoints som fanns i PMP3gv2/Mesan2gv1 ger HTTP 404 i de nya API:erna:

| Endpoint | Status | Ersättning |
|---|---|---|
| `.../approvedtime.json` | **Borttagen** | Använd `referenceTime` i datasvaret |
| `.../version/X.json` (version-metadata) | **Borttagen** | Ingen direkt ersättning |

Endpoints som fungerar:

| Endpoint | Beskrivning |
|---|---|
| `.../parameter.json` | Parameterlista med metadata |
| `.../geotype/point/lon/{lon}/lat/{lat}/data.json` | Punktprognos/-analys |
| `.../geotype/multipoint/time/{time}/parameter/{param}/data.json` | Fältdata hela Sverige |

---

## 3. SNOW1gv1 — Prognos-API

### 3.1 Endpoint-struktur

**Punktprognos:**
```
GET https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/{lon}/lat/{lat}/data.json
```

**Query-parametrar (NYA — fanns ej i PMP3gv2):**

| Parameter | Beskrivning | Exempel |
|---|---|---|
| `timeseries` | Begränsa antal tidssteg | `?timeseries=4` |
| `parameters` | Filtrera parametrar (kommaseparerat) | `?parameters=air_temperature,wind_speed` |

Kombinerat:
```
.../data.json?timeseries=4&parameters=air_temperature,wind_speed
```

**Multipoint (fältdata):**
```
GET .../geotype/multipoint/time/{valid_time}/parameter/{parameter}/data.json?with-geo=false
```

| Query-parameter | Beskrivning | Värden |
|---|---|---|
| `with-geo` | Inkludera koordinater | `true` / `false` |
| `downsample` | Glesare upplösning | `1`–`20` (10 = var 10:e punkt) |

> **OBS:** `time` måste vara ett korrekt valid-time från aktuell prognoskörning (ISO 8601, t.ex. `20260401T180000Z`). Downsample-data bör bara användas för visualisering, inte analys.

### 3.2 Svarsformat

```json
{
  "createdTime": "2026-04-01T08:02:40Z",
  "referenceTime": "2026-04-01T07:45:00Z",
  "geometry": {
    "type": "Point",
    "coordinates": [18.077207, 59.330360]
  },
  "timeSeries": [
    {
      "time": "2026-04-01T08:00:00Z",
      "intervalParametersStartTime": "2026-04-01T07:00:00Z",
      "data": {
        "air_temperature": 9.4,
        "wind_speed": 3.0,
        "symbol_code": 1
      }
    }
  ]
}
```

| Fält | Beskrivning |
|---|---|
| `createdTime` | När API-svaret genererades |
| `referenceTime` | Prognosens starttid (modellkörningens tid). **Ersätter `approvedtime`-endpointen.** |
| `geometry` | GeoJSON Point — närmaste gridpunkt (inte exakt begärd koordinat) |
| `time` | Valid time — tidpunkten prognosen gäller |
| `intervalParametersStartTime` | Startpunkt för nederbördsintervallet |
| `data` | Platt objekt med alla parametervärden |

### 3.3 Komplett parameterlista

Verifierad mot `parameter.json` 2026-04-01.

| Namn (`data`-nyckel) | shortName | Beskrivning | levelType | level | Enhet | missingValue |
|---|---|---|---|---|---|---|
| `air_temperature` | 2t | Lufttemperatur 2 m | hl | 2 | Cel | 9999 |
| `wind_from_direction` | wd | Vindriktning 10 m | hl | 10 | degree | 9999 |
| `wind_speed` | ws | Vindhastighet 10 m | hl | 10 | m/s | 9999 |
| `wind_speed_of_gust` | i10fg | Byvind 10 m | hl | 10 | m s**-1 | 9999 |
| `relative_humidity` | 2r | Relativ luftfuktighet 2 m | hl | 2 | percent | 9999 |
| `air_pressure_at_mean_sea_level` | pres | Lufttryck (havsnivå) | hmsl | 0 | hPa | 9999 |
| `visibility_in_air` | vis | Sikt | hl | 2 | km | 9999 |
| `thunderstorm_probability` | tstm | Åskprobabilitet | hl | 0 | percent | 9999 |
| `probability_of_frozen_precipitation` | fzpr | Sannolikhet frusen nederbörd | hl | 0 | fraction | 9999 |
| `cloud_area_fraction` | tcc | Total molnmängd | entireAtmosphere | 0 | octas | 9999 |
| `low_type_cloud_area_fraction` | lcc | Låga moln | entireAtmosphere | 0 | octas | 9999 |
| `medium_type_cloud_area_fraction` | mcc | Medelhöga moln | entireAtmosphere | 0 | octas | 9999 |
| `high_type_cloud_area_fraction` | hcc | Höga moln | entireAtmosphere | 0 | octas | 9999 |
| `cloud_base_altitude` | cdcb | Molnbashöjd | entireAtmosphere | 0 | m | 9999 |
| `cloud_top_altitude` | cdct | Molntopphöjd | entireAtmosphere | 0 | m | 9999 |
| `precipitation_amount_mean_deterministic` | avg_tprate | Deterministiskt nederbördsmedel | sfc | 0 | kg/m2 | 9999 |
| `precipitation_amount_mean` | tpratemean | Nederbördsmedel (ensemble) | hl | 0 | kg/m2 | 9999 |
| `precipitation_amount_min` | tpratemin | Nederbörd min (ensemble) | hl | 0 | kg/m2 | 9999 |
| `precipitation_amount_max` | tpratemax | Nederbörd max (ensemble) | hl | 0 | kg/m2 | 9999 |
| `precipitation_amount_median` | tpratemedian | Nederbördsmedian | hl | 0 | kg/m2 | 9999 |
| `probability_of_precipitation` | tp_gt_0p1 | Sannolikhet för ≥0.1 mm nederbörd | hl | 0 | % | 9999 |
| `precipitation_frozen_part` | spp | Andel frusen nederbörd | hl | 0 | percent | 9999 |
| `predominant_precipitation_type_at_surface` | ptype | Nederbördstyp | hl | 0 | category | 9999 |
| `symbol_code` | Wsymb2 | Vädersymbol (1–27) | hl | 0 | unknown | 9999 |

### 3.4 Namnmappning PMP3gv2 → SNOW1gv1

| PMP3gv2 `name` | PMP3gv2 `shortName` | SNOW1gv1 `name` (data-nyckel) | SNOW1gv1 `shortName` |
|---|---|---|---|
| `t` | t | `air_temperature` | 2t |
| `wd` | wd | `wind_from_direction` | wd |
| `ws` | ws | `wind_speed` | ws |
| `gust` | gust | `wind_speed_of_gust` | i10fg |
| `r` | r | `relative_humidity` | 2r |
| `msl` | msl | `air_pressure_at_mean_sea_level` | pres |
| `vis` | vis | `visibility_in_air` | vis |
| `tstm` | tstm | `thunderstorm_probability` | tstm |
| `spp` | spp | `probability_of_frozen_precipitation` | fzpr |
| `tcc_mean` | tcc_mean | `cloud_area_fraction` | tcc |
| `lcc_mean` | lcc_mean | `low_type_cloud_area_fraction` | lcc |
| `mcc_mean` | mcc_mean | `medium_type_cloud_area_fraction` | mcc |
| `hcc_mean` | hcc_mean | `high_type_cloud_area_fraction` | hcc |
| `pmean` | pmean | `precipitation_amount_mean` | tpratemean |
| `pmin` | pmin | `precipitation_amount_min` | tpratemin |
| `pmax` | pmax | `precipitation_amount_max` | tpratemax |
| `pmedian` | pmedian | `precipitation_amount_median` | tpratemedian |
| `pcat` | pcat | `predominant_precipitation_type_at_surface` | ptype |
| `Wsymb2` | Wsymb2 | `symbol_code` | Wsymb2 |
| *(fanns ej)* | — | `cloud_base_altitude` | cdcb |
| *(fanns ej)* | — | `cloud_top_altitude` | cdct |
| *(fanns ej)* | — | `precipitation_amount_mean_deterministic` | avg_tprate |
| *(fanns ej)* | — | `probability_of_precipitation` | tp_gt_0p1 |
| *(fanns ej)* | — | `precipitation_frozen_part` | spp |

> **OBS:** PMP3gv2:s `spp` (frozen part of total precipitation) har bytt nyckelnamn till `probability_of_frozen_precipitation` i SNOW1gv1, men den *nya* parametern `precipitation_frozen_part` har tagit över shortName `spp`. Dessa är **olika parametrar** — var noga med mappningen.

---

## 4. Mesan2gv2 — Analys-API

### 4.1 Endpoint-struktur

```
GET https://opendata-download-metanalys.smhi.se/api/category/mesan2g/version/2/geotype/point/lon/{lon}/lat/{lat}/data.json
```

### 4.2 Svarsformat

Samma platta `data`-struktur som SNOW1gv1, men **utan `intervalParametersStartTime`**:

```json
{
  "referenceTime": "2026-04-01T07:00:00Z",
  "geometry": {
    "type": "Point",
    "coordinates": [18.089437, 59.339222]
  },
  "timeSeries": [
    {
      "time": "2026-04-01T07:00:00Z",
      "data": {
        "air_temperature": 8.4,
        "wind_speed": 2.3,
        "symbol_code": 1
      }
    }
  ]
}
```

**Verifierade egenskaper:**
- Returnerar **24 tidssteg** (bakåt i tiden — det är analysdata, inte prognos)
- `timeSeries[0]` har senaste analysen, `timeSeries[1]` näst senaste osv.
- Saknar `createdTime` — bara `referenceTime`

### 4.3 Dynamiska parametrar

Mesan2gv2 returnerar **extra parametrar vid vissa tidssteg**. Verifierat 2026-04-01:

Senaste timmen (t.ex. kl 07:00) har basparametrarna. Äldre tidssteg (t.ex. kl 06:00) kan även innehålla:

| Parameter | Beskrivning | Enhet | Förekommer vid |
|---|---|---|---|
| `air_temperature_min` | Dygnets lägsta temperatur | Cel | Vissa tidssteg |
| `air_temperature_max` | Dygnets högsta temperatur | Cel | Vissa tidssteg |
| `precipitation_amount_last_12_hours` | Nederbörd senaste 12 h | mm | Tidssteg delbart med 12 |
| `precipitation_amount_last_24_hours` | Nederbörd senaste 24 h | mm | Tidssteg delbart med 24 |
| `change_over_time_in_surface_snow_amount_3_hours` | Snöändring 3 h | cm | Tidssteg delbart med 3 |
| `change_over_time_in_surface_snow_amount_12_hours` | Snöändring 12 h | cm | Tidssteg delbart med 12 |
| `change_over_time_in_surface_snow_amount_24_hours` | Snöändring 24 h | cm | Tidssteg delbart med 24 |

> **Kodimplikation:** Parsningskod måste hantera att `data`-objektet har varierande antal nycklar mellan tidssteg. Använd `.get()` (Python) eller optional chaining `?.` (JavaScript) för dessa fält.

### 4.4 Komplett parameterlista

Verifierad mot `parameter.json` 2026-04-01.

| Namn (`data`-nyckel) | shortName | Beskrivning | levelType | level | Enhet | missingValue |
|---|---|---|---|---|---|---|
| `air_temperature` | t | Lufttemperatur 2 m | hl | 2 | Cel | 9999 |
| `wind_speed_of_gust` | gust | Byvind | hl | 10 | m/s | 9999 |
| `relative_humidity` | r | Relativ luftfuktighet 2 m | hl | 2 | percent | 9999 |
| `air_pressure_at_mean_sea_level` | msl | Lufttryck (havsnivå) | hmsl | 0 | hPa | 9999 |
| `wet_bulb_temperature` | Tiw | Våttemperatur | hl | 2 | Cel | 9999 |
| `cloud_base_altitude` | cb_sig | Molnbashöjd | hmsl | 0 | m | 9999 |
| `cloud_are_fraction_significant` | c_sigfr | Signifikant molntäcke | hl | 0 | percent | 9999 |
| `cloud_area_fraction` | tcc | Total molnmängd | hl | 0 | octas | 9999 |
| `cloud_top_altitude` | ct_sig | Molntopphöjd | hl | 0 | m | 9999 |
| `low_type_cloud_area_fraction` | lcc | Låga moln | hl | 0 | octas | 9999 |
| `high_type_cloud_area_fraction` | hcc | Höga moln | hl | 0 | octas | 9999 |
| `medium_type_cloud_area_fraction` | mcc | Medelhöga moln | hl | 0 | octas | 9999 |
| `predominant_precipitation_type_at_surface` | prtype | Nederbördstyp | hl | 0 | code | 9999 |
| `precipitation_rate_max` | pmax | Max nederbördsintensitet | hl | 0 | kg/m2/h | 9999 |
| `precipitation_rate_min` | pmin | Min nederbördsintensitet | hl | 0 | kg/m2/h | 9999 |
| `precipitation_rate_median` | pmedian | Median nederbördsintensitet | hl | 0 | kg/m2/h | 9999 |
| `precipitation_rate_mean` | pmean | Medel nederbördsintensitet | hl | 0 | kg/m2/h | 9999 |
| `precipitation_amount_last_1_hours` | prec1h | Nederbörd senaste 1 h | hl | 0 | mm | 9999 |
| `precipitation_amount_last_3_hours` | prec3h | Nederbörd senaste 3 h | hl | 0 | mm | 9999 |
| `change_over_time_in_surface_snow_amount_1_hours` | frsn1h | Snöändring 1 h | hl | 0 | cm | 9999 |
| `visibility_in_air` | vis | Sikt | hl | 2 | km | 9999 |
| `precipitation_frozen_part` | spp | Andel frusen nederbörd | hl | 0 | percent | 9999 |
| `precipitation_sort` | prsort | Typ av nederbörd | hl | 0 | code | 9999 |
| `wind_from_direction` | wd | Vindriktning 10 m | hl | 10 | degree | 9999 |
| `wind_speed` | ws | Vindhastighet 10 m | hl | 10 | m/s | 9999 |
| `symbol_code` | Wsymb2 | Vädersymbol (1–27) | hl | 0 | category | 9999 |

### 4.5 Parametrar unika för Mesan2gv2 (finns ej i SNOW1gv1)

| Parameter | Beskrivning |
|---|---|
| `wet_bulb_temperature` | Våttemperatur |
| `cloud_are_fraction_significant` | Signifikant molnfraktion (OBS: stavfel i API:et — "are" istället för "area") |
| `precipitation_rate_*` | Nederbördsintensitet (mm/h) istället för mängd (mm) |
| `precipitation_amount_last_1_hours` | Ackumulerad nederbörd 1 h |
| `precipitation_amount_last_3_hours` | Ackumulerad nederbörd 3 h |
| `change_over_time_in_surface_snow_amount_1_hours` | Snöändring på markytan |
| `precipitation_sort` | Ytterligare nederbördsklassificering |

> **OBS:** Parametern heter `cloud_are_fraction_significant` (stavfel i SMHI:s API) — inte `cloud_area_fraction_significant`. Använd det faktiska namnet.

---

## 5. Strukturella skillnader: gamla vs nya API:er

### 5.1 Tidssteg-objekt

| Aspekt | PMP3gv2 / Mesan2gv1 | SNOW1gv1 / Mesan2gv2 |
|---|---|---|
| Tidsnyckel | `validTime` | `time` |
| Intervallstart | *(fanns ej)* | `intervalParametersStartTime` (bara SNOW1g) |
| Datastruktur | `parameters[]` (array av objekt) | `data` (platt objekt) |
| Parameternamn | Kortkoder (`t`, `ws`, `msl`) | Läsbara namn (`air_temperature`, `wind_speed`) |
| Metadata per param | `levelType`, `level`, `unit` i varje post | Finns bara i `parameter.json`, inte i datasvaret |
| Värdeåtkomst | `.parameters.find(p => p.name === 'X').values[0]` | `.data.X` |

### 5.2 Referenstid / approved time

| Aspekt | PMP3gv2 / Mesan2gv1 | SNOW1gv1 / Mesan2gv2 |
|---|---|---|
| Approved time endpoint | `.../approvedtime.json` | **Borttagen** (HTTP 404) |
| Referenstid i svar | `referenceTime` | `referenceTime` (samma) |
| Created time | *(ej verifierat)* | `createdTime` (bara SNOW1g) |

---

## 6. Specialvärden

### 6.1 Missing values

Alla parametrar: `missingValue: 9999`

Speciella tolkningar:
- `cloud_base_altitude` = **9999**: klart väder (ingen molnbas) — i SNOW1gv1
- `cloud_top_altitude` = **9999**: klart väder — i SNOW1gv1
- `cloud_base_altitude` = **10000** och `cloud_top_altitude` = **10500**: klart väder — i Mesan2gv2 (avviker!)
- `cloud_base_altitude` / `cloud_top_altitude` = **-8**: data saknas

### 6.2 Nederbördsrelaterade sentinel-värden

- `precipitation_frozen_part` = **-9**: ingen nederbörd
- `probability_of_frozen_precipitation` = **0.00**: ingen frusen nederbörd (men nederbörd kan förekomma)
- `predominant_precipitation_type_at_surface` = **0**: ingen nederbörd (SNOW1gv1)
- `predominant_precipitation_type_at_surface` = **-9**: ingen nederbörd (Mesan2gv2)

### 6.3 Nederbördstyp (`predominant_precipitation_type_at_surface`)

| Värde | Typ | API |
|---|---|---|
| -9 | Ingen nederbörd | Mesan2gv2 |
| 0 | Ingen nederbörd | SNOW1gv1 |
| 1 | Regn | Bägge |
| 2 | Snöblandat regn | Bägge |
| 3 | Regn (äldre klassificering) | PMP3gv2 |
| 4 | Duggregn (äldre) | PMP3gv2 |
| 5 | Snö / underkylt regn | Bägge |
| 6 | Snöblandat / underkylt | Bägge |
| 11 | Duggregn / lätt regn | SNOW1gv1 |

> **OBS:** Värde 11 förekommer i SNOW1gv1-svar men dokumenteras inte i PMP3gv2-specen. Mesan2gv2 använder -9 för "ingen nederbörd" medan SNOW1gv1 använder 0.

### 6.4 Vädersymbol (`symbol_code`)

Heltal 1–27, samma i alla API:er:

| Kod | Beskrivning | | Kod | Beskrivning |
|---|---|---|---|---|
| 1 | Klart | | 15 | Lätta snöbyar |
| 2 | Nästan klart | | 16 | Snöbyar |
| 3 | Halvklart | | 17 | Kraftiga snöbyar |
| 4 | Molnigt | | 18 | Lätt regn |
| 5 | Mycket molnigt | | 19 | Regn |
| 6 | Mulet | | 20 | Kraftigt regn |
| 7 | Dimma | | 21 | Åska |
| 8 | Lättregnskurar | | 22 | Lätt snöblandat regn |
| 9 | Regnskurar | | 23 | Snöblandat regn |
| 10 | Kraftiga regnskurar | | 24 | Kraftigt snöblandat regn |
| 11 | Åskskurar | | 25 | Lätt snöfall |
| 12 | Lätta byar snöbl. regn | | 26 | Snöfall |
| 13 | Byar snöblandat regn | | 27 | Kraftigt snöfall |
| 14 | Kraftiga byar snöbl. regn | | | |

---

## 7. Modell- och gridspecifikation

| Egenskap | SNOW1gv1 | Mesan2gv2 |
|---|---|---|
| Gridupplösning | ca 2,5 km | ca 2,5 km |
| Uppdateringsfrekvens | var 15:e minut | *(ej verifierat)* |
| Prognoshorisont | 240–251 h (10+ dygn) | *(analysdata — bakåt i tiden)* |
| Antal tidssteg i svar | ~70–80 (varierar) | 24 (verifierat) |
| Tidssteg: 0–48 h | 1 timme | 1 timme |
| Tidssteg: 49–72 h | 2 timmar | — |
| Tidssteg: 73–132 h | 6 timmar | — |
| Tidssteg: 133–240+ h | 12 timmar | — |
| Geografisk täckning SV | 50.32, 0.28 | *(ej verifierat)* |
| Geografisk täckning NV | 72.76, -18.12 | |
| Geografisk täckning NÖ | 71.58, 54.24 | |
| Geografisk täckning SÖ | 49.77, 33.03 | |

---

## 8. Kodmigrering

### 8.1 URL-ersättning

**Prognoser:**
```
pmp3g       → snow1g
version/2   → version/1
PMP3g       → SNOW1g
pmp3gv2     → snow1gv1
```

**Analyser:**
```
mesan2g/version/1  → mesan2g/version/2
Mesan2gv1          → Mesan2gv2
```

### 8.2 JavaScript — före/efter

```javascript
// ===== FÖRE (PMP3gv2) =====
const BASE = 'https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2';
const url = `${BASE}/geotype/point/lon/${lon}/lat/${lat}/data.json`;
const res = await fetch(url);
const json = await res.json();

json.timeSeries.forEach(entry => {
  const time = entry.validTime;
  const temp = entry.parameters.find(p => p.name === 't').values[0];
  const wind = entry.parameters.find(p => p.name === 'ws').values[0];
  const symbol = entry.parameters.find(p => p.name === 'Wsymb2').values[0];
});


// ===== EFTER (SNOW1gv1) =====
const BASE = 'https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1';
const url = `${BASE}/geotype/point/lon/${lon}/lat/${lat}/data.json`;
const res = await fetch(url);
const json = await res.json();

json.timeSeries.forEach(entry => {
  const time = entry.time;
  const intervalStart = entry.intervalParametersStartTime;
  const temp = entry.data.air_temperature;
  const wind = entry.data.wind_speed;
  const symbol = entry.data.symbol_code;
});
```

### 8.3 Python — före/efter

```python
# ===== FÖRE (PMP3gv2) =====
CATEGORY = "pmp3g"
VERSION = "2"
url = f"https://opendata-download-metfcst.smhi.se/api/category/{CATEGORY}/version/{VERSION}/geotype/point/lon/{lon}/lat/{lat}/data.json"
data = requests.get(url).json()

for entry in data["timeSeries"]:
    time = entry["validTime"]
    params = {p["name"]: p["values"][0] for p in entry["parameters"]}
    temp = params["t"]
    wind = params["ws"]
    symbol = params["Wsymb2"]


# ===== EFTER (SNOW1gv1) =====
CATEGORY = "snow1g"
VERSION = "1"
url = f"https://opendata-download-metfcst.smhi.se/api/category/{CATEGORY}/version/{VERSION}/geotype/point/lon/{lon}/lat/{lat}/data.json"
data = requests.get(url).json()

for entry in data["timeSeries"]:
    time = entry["time"]
    interval_start = entry["intervalParametersStartTime"]
    temp = entry["data"]["air_temperature"]
    wind = entry["data"]["wind_speed"]
    symbol = entry["data"]["symbol_code"]
```

### 8.4 Hjälpfunktion: namnmappning (Python)

```python
PMP3G_TO_SNOW1G = {
    "t": "air_temperature",
    "wd": "wind_from_direction",
    "ws": "wind_speed",
    "gust": "wind_speed_of_gust",
    "r": "relative_humidity",
    "msl": "air_pressure_at_mean_sea_level",
    "vis": "visibility_in_air",
    "tstm": "thunderstorm_probability",
    "spp": "probability_of_frozen_precipitation",  # OBS: nytt namn!
    "tcc_mean": "cloud_area_fraction",
    "lcc_mean": "low_type_cloud_area_fraction",
    "mcc_mean": "medium_type_cloud_area_fraction",
    "hcc_mean": "high_type_cloud_area_fraction",
    "pmean": "precipitation_amount_mean",
    "pmin": "precipitation_amount_min",
    "pmax": "precipitation_amount_max",
    "pmedian": "precipitation_amount_median",
    "pcat": "predominant_precipitation_type_at_surface",
    "Wsymb2": "symbol_code",
}
```

### 8.5 Ta bort eller ersätt `approvedtime`-anrop

```python
# FÖRE
approved = requests.get(f"{BASE}/approvedtime.json").json()
ref_time = approved["referenceTime"]

# EFTER — hämta från datasvaret istället
data = requests.get(f"{BASE}/geotype/point/lon/{lon}/lat/{lat}/data.json?timeseries=1").json()
ref_time = data["referenceTime"]
```

---

## 9. Testning och verifiering

### Snabbtest i webbläsare

```
https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/18.07/lat/59.33/data.json
```

### Verifieringsscript (bash)

```bash
#!/bin/bash
echo "=== SNOW1gv1 ==="
curl -s "https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/18.07/lat/59.33/data.json?timeseries=1" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
ts = d['timeSeries'][0]
assert 'time' in ts, 'Saknar time-nyckel'
assert 'data' in ts, 'Saknar data-objekt'
assert 'air_temperature' in ts['data'], 'Saknar air_temperature'
print(f'OK — ref: {d[\"referenceTime\"]}, temp: {ts[\"data\"][\"air_temperature\"]}°C')
print(f'Parametrar ({len(ts[\"data\"])}): {list(ts[\"data\"].keys())}')
"

echo ""
echo "=== Mesan2gv2 ==="
curl -s "https://opendata-download-metanalys.smhi.se/api/category/mesan2g/version/2/geotype/point/lon/18.07/lat/59.33/data.json" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
ts = d['timeSeries'][0]
assert 'time' in ts, 'Saknar time-nyckel'
assert 'data' in ts, 'Saknar data-objekt'
print(f'OK — ref: {d[\"referenceTime\"]}, tidssteg: {len(d[\"timeSeries\"])}')
print(f'Parametrar ({len(ts[\"data\"])}): {list(ts[\"data\"].keys())}')
"

echo ""
echo "=== Gamla API:er (ska ge 404) ==="
echo -n "PMP3gv2: "
curl -s -o /dev/null -w "HTTP %{http_code}" \
  "https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/18.07/lat/59.33/data.json"
echo ""
echo -n "Mesan2gv1: "
curl -s -o /dev/null -w "HTTP %{http_code}" \
  "https://opendata-download-metanalys.smhi.se/api/category/mesan2g/version/1/geotype/point/lon/18.07/lat/59.33/data.json"
echo ""
```

---

## 10. Länkar

| Resurs | URL |
|---|---|
| SMHI migreringsinfo | https://www.smhi.se/data/om-smhis-data/uppdateringar-oppna-data/uppdateringar-i-smhis-oppna-data/2025-09-12-nya-apier-for-meteorologiska-prognoser-och-analyser |
| SNOW1gv1 API-docs | https://opendata.smhi.se/metfcst/snow1gv1 |
| SNOW1gv1 parametrar | https://opendata.smhi.se/metfcst/snow1gv1/parameters |
| SNOW1gv1 point forecast | https://opendata.smhi.se/metfcst/snow1gv1/get_point_forecast |
| SNOW1gv1 metadata | https://www.smhi.se/data/sok-oppna-data-i-utforskaren/meteorologisk-prognos-api |
| Mesan2gv2 API-docs | https://opendata.smhi.se/metanalys/mesan2gv2/ |
| Mesan2gv2 metadata | https://www.smhi.se/data/sok-oppna-data-i-utforskaren/meteorologisk-analys-api |
| SMHI FAQ (tekniskt) | https://www.smhi.se/data/oppna-data/tekniska-fragor-och-svar-1.76975 |

---

## 11. Ändringslogg för detta dokument

| Datum | Ändring |
|---|---|
| 2026-04-01 | Initial version. Alla data verifierade mot live API-anrop. Parameterlista från `parameter.json`, svarsstruktur från `data.json`, HTTP 404 bekräftat för gamla API:er. `approvedtime.json` bekräftat borttagen. Mesan2gv2 dynamiska parametrar dokumenterade. |
