/**
 * @file de.js
 * @description Tysk språkkatalog. Vindterminologi enligt DWD:s förenklade
 *              prognostermer (schwacher/mäßiger/frischer/starker Wind,
 *              Sturm, Orkan; Beaufort-benämningarna via DWD:s glossar);
 *              barometerorden enligt klassiska tyska barometerurtavlor
 *              (Sturm/Regen/Veränderlich/Schön/Sehr trocken).
 */

I18n.register('de', {
    __locale: 'de-DE',

    LABEL_ACTUAL: 'GEMESSEN',
    LABEL_FORECAST: 'PROGNOSE',
    LABEL_TEMPERATURE: 'TEMPERATUR',
    SECTION_12H: '12-Stunden-Prognose',
    SECTION_5DAY: '5-Tage-Prognose',

    LOADING: 'Lade...',
    LOADING_WEATHER: 'Lade Wetterdaten...',
    LOADING_FORECAST: 'Lade Prognose...',
    STATUS_UPDATED: 'Wetterdaten aktualisiert',
    STALE_SINCE: '⚠️ Daten seit {time} nicht aktualisiert',
    STALE_UNAVAILABLE: '⚠️ Wetterdaten nicht verfügbar',
    COMPASS: 'N,NNO,NO,ONO,O,OSO,SO,SSO,S,SSW,SW,WSW,W,WNW,NW,NNW',
    UNKNOWN: 'Unbekannt',

    FMT_HUMIDITY: '{value}% Luftfeuchtigkeit',
    FMT_AIR_QUALITY: '{value} ppm Luftqualität',
    FMT_NOISE: '{value} dB Lärm',

    WEATHER_1: 'Klar',
    WEATHER_2: 'Fast klar',
    WEATHER_3: 'Wechselnd bewölkt',
    WEATHER_4: 'Teilweise bewölkt',
    WEATHER_5: 'Bewölkt',
    WEATHER_6: 'Bedeckt',
    WEATHER_7: 'Nebel',
    WEATHER_8: 'Regenschauer',
    WEATHER_9: 'Regenschauer',
    WEATHER_10: 'Regenschauer',
    WEATHER_11: 'Gewitter',
    WEATHER_12: 'Schneeregenschauer',
    WEATHER_13: 'Schneeregenschauer',
    WEATHER_14: 'Schneeregenschauer',
    WEATHER_15: 'Schneeschauer',
    WEATHER_16: 'Schneeschauer',
    WEATHER_17: 'Schneeschauer',
    WEATHER_18: 'Regen',
    WEATHER_19: 'Regen',
    WEATHER_20: 'Regen',
    WEATHER_21: 'Gewitter',
    WEATHER_22: 'Schneeregen',
    WEATHER_23: 'Schneeregen',
    WEATHER_24: 'Schneeregen',
    WEATHER_25: 'Schneefall',
    WEATHER_26: 'Schneefall',
    WEATHER_27: 'Schneefall',

    // Särskiljande ord först (12h-korten visar bara första ordet)
    WIND_LAND_CALM: 'Windstille',
    WIND_LAND_WEAK: 'Schwacher Wind',
    WIND_LAND_MODERATE: 'Mäßiger Wind',
    WIND_LAND_FRESH: 'Frischer Wind',
    WIND_LAND_STRONG: 'Starker Wind',
    WIND_LAND_STORM: 'Sturm',
    WIND_LAND_HURRICANE: 'Orkan',

    WIND_SEA_CALM: 'Windstille',
    WIND_SEA_BREEZE: 'Brise',
    WIND_SEA_GALE: 'Starkwind',
    WIND_SEA_STORM: 'Sturm',
    WIND_SEA_HURRICANE: 'Orkan',

    WIND_BEAUFORT_CALM: 'Windstille',

    BARO_STORM: 'Sturm',
    BARO_RAIN: 'Regen',
    BARO_UNSTABLE: 'Veränderlich',
    BARO_FAIR: 'Schön',
    BARO_VERY_DRY: 'Sehr trocken',

    TREND_RISING_FAST_WORD: 'steigt schnell',
    TREND_RISING_WORD: 'steigt',
    TREND_STABLE_WORD: 'stabil',
    TREND_FALLING_WORD: 'fällt',
    TREND_FALLING_FAST_WORD: 'fällt schnell',
    TREND_RISING_FAST: 'Schnell steigend',
    TREND_RISING: 'Steigend',
    TREND_STABLE: 'Stabil',
    TREND_FALLING: 'Fallend',
    TREND_FALLING_FAST: 'Schnell fallend',
    TREND_COLLECTING: 'Sammle Daten...',
    TREND_PREFIX: 'Trend: ',

    UV_RISK_low: 'Niedriges UV-Risiko',
    UV_RISK_moderate: 'Mäßiges UV-Risiko',
    UV_RISK_high: 'Hohes UV-Risiko',
    UV_RISK_very_high: 'Sehr hohes UV-Risiko',
    UV_RISK_extreme: 'Extremes UV-Risiko'
});
