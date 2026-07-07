"""
Utomhus-luftkvalitet (European Air Quality Index).

Primär källa: SMHI Datavärdskap luftkvalitet (Sveriges nationella referensnät,
på uppdrag av Naturvårdsverket) via OGC SOS 2.0 med JSON-svar - närmaste
mätstation till angivna koordinater.

Global fallback: Open-Meteo Air Quality API (CAMS) - används utanför Sverige
eller när ingen svensk station finns tillräckligt nära. Ingen API-nyckel krävs
för någon av källorna.

Båda källorna normaliseras till samma numeriska European AQI (0-100+) med band
(good/fair/moderate/poor/very_poor/extremely_poor) och en tregradig färgnivå
(good/moderate/poor) som frontendens befintliga luftkvalitetsfärger använder.
"""

import json
import math
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

SMHI_SOS = "https://datavardluft.smhi.se/52North/service"
OPEN_METEO_AQ = "https://air-quality-api.open-meteo.com/v1/air-quality"
USER_AGENT = "flask-weather-dashboard/1.0 (+https://github.com/cgillinger/flask-weather)"

# EIONET-pollutant-koder (dd.eionet.europa.eu/vocabulary/aq/pollutant/<kod>)
POLLUTANTS = {"pm25": "6001", "pm10": "5", "no2": "8", "o3": "7"}

# EEA European Air Quality Index - övre koncentrationsgräns (ug/m3) per band.
# Banden: Good, Fair, Moderate, Poor, Very poor, Extremely poor.
EEA_BANDS = {
    "pm25": [10, 20, 25, 50, 75, 800],
    "pm10": [20, 40, 50, 100, 150, 1200],
    "no2": [40, 90, 120, 230, 340, 1000],
    "o3": [50, 100, 130, 240, 380, 800],
}
# Varje band mappas till ett 20-poängsintervall på en gemensam 0-120-skala.
_INDEX_STOPS = [0, 20, 40, 60, 80, 100, 120]
_BAND_NAMES = ["good", "fair", "moderate", "poor", "very_poor", "extremely_poor"]

# Cache: {(lat_r, lon_r): (timestamp, result)}
_CACHE = {}
_CACHE_TTL = 3600  # 1 h - AQ uppdateras timvis


def _sub_index(pollutant, conc):
    """Linjärt interpolerat European-AQI-delindex (0-120) för en koncentration."""
    bounds = EEA_BANDS[pollutant]
    low = 0.0
    for i, high in enumerate(bounds):
        if conc <= high:
            i_low, i_high = _INDEX_STOPS[i], _INDEX_STOPS[i + 1]
            if high <= low:
                return float(i_low)
            return i_low + (i_high - i_low) * (conc - low) / (high - low)
        low = high
    return 120.0


def _band_from_index(value):
    for name, high in zip(_BAND_NAMES, _INDEX_STOPS[1:]):
        if value < high:
            return name
    return "extremely_poor"


def _level3(band):
    """EEA:s sex band -> frontendens tregradiga färgnivå."""
    if band in ("good", "fair"):
        return "good"
    if band == "moderate":
        return "moderate"
    return "poor"


def _aqi_from_concentrations(concs):
    """concs: {pollutant: ug/m3}. Returnerar (aqi, band, level3, driver)."""
    subs = {p: _sub_index(p, v) for p, v in concs.items() if v is not None}
    if not subs:
        return None
    driver = max(subs, key=subs.get)
    value = subs[driver]
    band = _band_from_index(value)
    return {"aqi": round(value), "band": band, "level": _level3(band), "driver": driver}


def _haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _http_json(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _smhi_fetch_pollutant(code, bbox, start, end, timeout=25):
    """Hämtar en förorenings observationer inom bbox som JSON-observationslista."""
    params = {
        "service": "SOS",
        "version": "2.0.0",
        "request": "GetObservation",
        "observedProperty": f"http://dd.eionet.europa.eu/vocabulary/aq/pollutant/{code}",
        "temporalFilter": f"om:phenomenonTime,{start}/{end}",
        "spatialFilter": (
            f"om:featureOfInterest/*/sams:shape,{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]},"
            "http://www.opengis.net/def/crs/EPSG/0/4326"
        ),
        "responseFormat": "application/json",
    }
    url = SMHI_SOS + "?" + urllib.parse.urlencode(params)
    return _http_json(url, timeout=timeout).get("observations", [])


def _smhi_nearest(lat, lon, max_km):
    """Bygger närmaste-station-AQI från SMHI. Returnerar dict eller None."""
    now = datetime.now(timezone.utc)
    start = (now - timedelta(hours=24)).strftime("%Y-%m-%dT%H:00:00Z")
    end = now.strftime("%Y-%m-%dT%H:00:00Z")
    latpad = 0.45
    lonpad = 0.45 / max(math.cos(math.radians(lat)), 0.2)
    bbox = (lat - latpad, lon - lonpad, lat + latpad, lon + lonpad)  # minLat,minLon,maxLat,maxLon

    # station-namn -> {lat, lon, dist, time:{pollutant:iso}, conc:{pollutant:val}}
    stations = {}
    for key, code in POLLUTANTS.items():
        try:
            obs = _smhi_fetch_pollutant(code, bbox, start, end)
        except Exception as exc:  # en förorening kan fela utan att sänka helheten
            print(f"⚠️ SMHI AQ {key}: {exc}")
            continue
        for o in obs:
            try:
                foi = o["featureOfInterest"]
                name = foi["name"]["value"]
                g = foi["geometry"]["coordinates"]  # [lat, lon, alt]
                t = o["phenomenonTime"][-1]
                val = o["result"]["value"]
            except (KeyError, IndexError, TypeError):
                continue
            if val is None:
                continue
            st = stations.setdefault(name, {"lat": g[0], "lon": g[1], "time": {}, "conc": {}})
            if key not in st["time"] or t > st["time"][key]:
                st["time"][key] = t
                st["conc"][key] = val

    if not stations:
        return None

    # välj närmaste station (helst med partiklar) inom max_km
    ranked = []
    for name, st in stations.items():
        dist = _haversine_km(lat, lon, st["lat"], st["lon"])
        if dist <= max_km and st["conc"]:
            ranked.append((dist, name, st))
    if not ranked:
        return None
    ranked.sort(key=lambda x: x[0])
    with_pm = [r for r in ranked if ("pm25" in r[2]["conc"] or "pm10" in r[2]["conc"])]
    dist, name, st = (with_pm or ranked)[0]

    aqi = _aqi_from_concentrations(st["conc"])
    if not aqi:
        return None
    latest_time = max(st["time"].values())
    aqi.update({
        "source": "smhi",
        "station_name": name,
        "distance_km": round(dist, 1),
        "pollutants": {p: round(v, 1) for p, v in st["conc"].items()},
        "observed_at": latest_time,
    })
    return aqi


def _open_meteo(lat, lon, timeout=20):
    """Global fallback: Open-Meteo/CAMS European AQI."""
    params = {
        "latitude": round(lat, 4),
        "longitude": round(lon, 4),
        "current": "european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone",
        "timezone": "auto",
    }
    url = OPEN_METEO_AQ + "?" + urllib.parse.urlencode(params)
    data = _http_json(url, timeout=timeout)
    cur = data.get("current", {})
    val = cur.get("european_aqi")
    if val is None:
        return None
    band = _band_from_index(val)
    return {
        "source": "open-meteo",
        "aqi": round(val),
        "band": band,
        "level": _level3(band),
        "driver": None,
        "station_name": None,
        "distance_km": None,
        "pollutants": {
            "pm25": cur.get("pm2_5"),
            "pm10": cur.get("pm10"),
            "no2": cur.get("nitrogen_dioxide"),
            "o3": cur.get("ozone"),
        },
        "observed_at": cur.get("time"),
    }


def get_outdoor_air_quality(lat, lon, max_km=25, use_cache=True):
    """
    Returnerar utomhus-AQI för koordinaterna, SMHI-station i första hand,
    Open-Meteo/CAMS som global fallback. Returnerar None om båda misslyckas.
    """
    ckey = (round(lat, 2), round(lon, 2))
    if use_cache and ckey in _CACHE:
        ts, cached = _CACHE[ckey]
        if time.time() - ts < _CACHE_TTL:
            return cached

    result = None
    try:
        result = _smhi_nearest(lat, lon, max_km)
    except Exception as exc:
        print(f"⚠️ SMHI AQ misslyckades ({exc}) - faller tillbaka på Open-Meteo")
    if result is None:
        try:
            result = _open_meteo(lat, lon)
        except Exception as exc:
            print(f"⚠️ Open-Meteo AQ misslyckades: {exc}")
            result = None

    if result is not None:
        _CACHE[ckey] = (time.time(), result)
    return result


if __name__ == "__main__":
    for label, (la, lo) in {
        "Stockholm (SMHI-station)": (59.3293, 18.0686),
        "Kiruna-fjäll (gles, ev. fallback)": (67.85, 18.5),
        "New York (global fallback)": (40.7128, -74.0060),
    }.items():
        print(f"\n=== {label} ===")
        r = get_outdoor_air_quality(la, lo, use_cache=False)
        print(json.dumps(r, indent=1, ensure_ascii=False) if r else "None")
