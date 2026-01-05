# SMHI API-migrering: Vad har förändrats och vad du behöver göra

> **Datum för avveckling: 31 mars 2026** — API:erna är nu stängda.

---

## Vad har hänt?

SMHI har moderniserat sin tekniska plattform och ersatt två äldre API:er med nya versioner. De gamla API:erna slutade fungera den **31 mars 2026**.

| Typ | Gammalt API (avvecklat) | Nytt API |
|-----|------------------------|----------|
| Meteorologiska prognoser | `PMP3gv2` | `SNOW1gv1` |
| Meteorologiska analyser | `Mesan2gv1` | `Mesan2gv2` |

Observationsdata (`metobs`) berörs **inte** av förändringen.

---

## Prognos-API: PMP3gv2 → SNOW1gv1

### Gammal URL-struktur
```
https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/
geotype/point/lon/{lon}/lat/{lat}/data.json
```

### Ny URL-struktur
```
https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/
geotype/point/lon/{lon}/lat/{lat}/data.json
```

### Vad du ändrar i koden

Sök efter dessa strängar i din kodbas och byt ut dem:

| Sök efter | Ersätt med |
|-----------|-----------|
| `pmp3g` | `snow1g` |
| `version/2` (i metfcst-URL) | `version/1` |
| `PMP3g` | `SNOW1g` |
| `pmp3gv2` | `snow1gv1` |

**Python-exempel:**
```python
# Före
CATEGORY = "pmp3g"
VERSION = "2"

# Efter
CATEGORY = "snow1g"
VERSION = "1"
```

**JavaScript-exempel:**
```javascript
// Före
const url = `.../category/pmp3g/version/2/geotype/point/...`

// Efter
const url = `.../category/snow1g/version/1/geotype/point/...`
```

---

## VIKTIGT: Svarsstrukturen har ändrats

**Det nya prognos-API:et (SNOW1gv1) har en helt ny svarsstruktur.** Det räcker INTE att bara byta URL — all parsningskod måste uppdateras.

### 1. Tidpunktsnyckeln har bytt namn

```
validTime  →  time
```

**Före (PMP3gv2):**
```json
{ "validTime": "2026-03-31T15:00:00Z", "parameters": [...] }
```

**Efter (SNOW1gv1):**
```json
{ "time": "2026-03-31T15:00:00Z", "data": {...} }
```

Sök efter alla förekomster av `validTime` i koden och byt till `time`.

### 2. Parametrar: array → flat dict

Gamla API:et hade en `parameters`-array där varje parameter var ett objekt med `name` och `values`:

**Före (PMP3gv2):**
```json
{
  "validTime": "2026-03-31T15:00:00Z",
  "parameters": [
    { "name": "t", "values": [9.6] },
    { "name": "ws", "values": [3.1] },
    { "name": "Wsymb2", "values": [1] }
  ]
}
```

**Efter (SNOW1gv1):**
```json
{
  "time": "2026-03-31T15:00:00Z",
  "data": {
    "air_temperature": 9.6,
    "wind_speed": 3.1,
    "symbol_code": 1
  }
}
```

Om din kod loopar genom `parameters`-arrayen och plockar ut `name`/`values`, måste den skrivas om till att läsa direkt från `data`-dicten.

### 3. Alla parameternamn har ändrats

| Gammalt namn (PMP3gv2) | Nytt namn (SNOW1gv1) | Beskrivning |
|------------------------|----------------------|-------------|
| `t` | `air_temperature` | Temperatur (°C) |
| `Wsymb2` | `symbol_code` | Vädersymbol (1–27) |
| `ws` | `wind_speed` | Vindstyrka (m/s) |
| `wd` | `wind_from_direction` | Vindriktning (grader) |
| `tp` | `precipitation_amount_mean` | Medelskattad nederbörd (mm) |
| `pmin` | `precipitation_amount_min` | Nederbörd min (mm) |
| `pmax` | `precipitation_amount_max` | Nederbörd max (mm) |
| `msl` | `air_pressure_at_mean_sea_level` | Lufttryck (hPa) |
| `r` | `relative_humidity` | Relativ luftfuktighet (%) |
| `gust` | `wind_speed_of_gust` | Byvind (m/s) |
| `vis` | `visibility_in_air` | Sikt (km) |
| `tcc_mean` | `cloud_area_fraction` | Molnighet (%) |

### 4. Geometry-formatet kan ha ändrats

Om din kod läser `geometry.coordinates` från API-svaret, skydda den med try/except eller felkontroll. Formatet kan skilja sig från PMP3gv2.

### Parsnings-exempel

**Före (PMP3gv2) — Python:**
```python
for param in entry['parameters']:
    if param['name'] == 't':
        temperature = param['values'][0]
```

**Efter (SNOW1gv1) — Python:**
```python
temperature = entry['data']['air_temperature']
```

**Före (PMP3gv2) — JavaScript:**
```javascript
const temp = entry.parameters.find(p => p.name === 't')?.values[0];
```

**Efter (SNOW1gv1) — JavaScript:**
```javascript
const temp = entry.data.air_temperature;
```

---

## Analys-API: Mesan2gv1 → Mesan2gv2

### Gammal URL-struktur
```
https://opendata-download-metanalys.smhi.se/api/category/mesan2g/version/1/...
```

### Ny URL-struktur
```
https://opendata-download-metanalys.smhi.se/api/category/mesan2g/version/2/...
```

### Vad du ändrar i koden

| Sök efter | Ersätt med |
|-----------|-----------|
| `mesan2g/version/1` | `mesan2g/version/2` |
| `Mesan2gv1` | `Mesan2gv2` |

---

## Påverkas inte

Följande API:er är **oförändrade** och kräver inga åtgärder:

- **Meteorologiska observationer** (`metobs`) — stationsdata, luftfuktighet m.m.
- **UV-index / CAMS**
- **Hydrologiska data**
- **Oceanografiska data**

---

## Kontrollera att det fungerar

Testa det nya API:et (byt ut koordinaterna):

```
https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/18.07/lat/59.33/data.json
```

Verifiering med curl:
```bash
curl -s "https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/18.07/lat/59.33/data.json" | python3 -c "
import sys, json
d = json.load(sys.stdin)
ts = d['timeSeries'][0]
print('Tid:', ts['time'])
for key, val in ts['data'].items():
    print(f'  {key}: {val}')
"
```

Ett lyckat svar innehåller `timeSeries` med objekt som har `time` och `data`-nycklar.

---

## Checklista

- [ ] Byt `pmp3g` → `snow1g` och `version/2` → `version/1` i URL:er
- [ ] Byt `validTime` → `time` i all parsningskod
- [ ] Skriv om parameterparsning från `parameters`-array till flat `data`-dict
- [ ] Byt alla parameternamn (se tabell ovan)
- [ ] Skydda `geometry`-parsning med felhantering
- [ ] Testa att API-svaret returnerar korrekta värden

---

## Mer information

- [SMHI Open Data-dokumentation](https://opendata.smhi.se/apidocs/)
- [SMHI uppdateringar öppna data](https://www.smhi.se/data/om-smhis-data/uppdateringar-oppna-data)
