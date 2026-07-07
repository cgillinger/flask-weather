/**
 * @file sv.js
 * @description Svensk språkkatalog (originalspråk och fallback för alla andra)
 * @dependencies i18n.js måste vara laddad först
 */

I18n.register('sv', {
    __locale: 'sv-SE',

    // === ETIKETTER OCH RUBRIKER ===
    LABEL_ACTUAL: 'FAKTISK',
    LABEL_FORECAST: 'PROGNOS',
    LABEL_TEMPERATURE: 'TEMPERATUR',
    SECTION_12H: '12-timmarsprognos',
    SECTION_5DAY: '5-dagarsprognos',

    // === STATUS OCH LADDNING ===
    LOADING: 'Laddar...',
    LOADING_WEATHER: 'Laddar väderdata...',
    LOADING_FORECAST: 'Laddar prognos...',
    STATUS_UPDATED: 'Väderdata uppdaterad',
    STALE_SINCE: '⚠️ Data ej uppdaterad sedan {time}',
    STALE_UNAVAILABLE: '⚠️ Väderdata kan inte hämtas',
    COMPASS: 'N,NNO,NO,ONO,O,OSO,SO,SSO,S,SSV,SV,VSV,V,VNV,NV,NNV',
    UNKNOWN: 'Okänt',

    // === DATAPUNKTER (mid-zone) ===
    FMT_HUMIDITY: '{value}% Luftfuktighet',
    FMT_AIR_QUALITY: '{value} ppm Luftkvalitet',
    FMT_NOISE: '{value} dB Ljud',

    // === VÄDERBESKRIVNINGAR (SMHI-symbol 1-27) ===
    WEATHER_1: 'Klart',
    WEATHER_2: 'Nästan klart',
    WEATHER_3: 'Växlande',
    WEATHER_4: 'Halvklart',
    WEATHER_5: 'Molnigt',
    WEATHER_6: 'Mulet',
    WEATHER_7: 'Dimma',
    WEATHER_8: 'Regnskurar',
    WEATHER_9: 'Regnskurar',
    WEATHER_10: 'Regnskurar',
    WEATHER_11: 'Åska',
    WEATHER_12: 'Snöblandat',
    WEATHER_13: 'Snöblandat',
    WEATHER_14: 'Snöblandat',
    WEATHER_15: 'Snöbyar',
    WEATHER_16: 'Snöbyar',
    WEATHER_17: 'Snöbyar',
    WEATHER_18: 'Regn',
    WEATHER_19: 'Regn',
    WEATHER_20: 'Regn',
    WEATHER_21: 'Åska',
    WEATHER_22: 'Snöblandat',
    WEATHER_23: 'Snöblandat',
    WEATHER_24: 'Snöblandat',
    WEATHER_25: 'Snöfall',
    WEATHER_26: 'Snöfall',
    WEATHER_27: 'Snöfall',

    // === VIND: landterminologi (SMHI:s skala för land) ===
    WIND_LAND_CALM: 'Lugnt',
    WIND_LAND_WEAK: 'Svag vind',
    WIND_LAND_MODERATE: 'Måttlig vind',
    WIND_LAND_FRESH: 'Frisk vind',
    WIND_LAND_STRONG: 'Hård vind',
    WIND_LAND_STORM: 'Storm',
    WIND_LAND_HURRICANE: 'Orkan',

    // === VIND: sjöterminologi ===
    WIND_SEA_CALM: 'Stiltje',
    WIND_SEA_BREEZE: 'Bris',
    WIND_SEA_GALE: 'Kuling',
    WIND_SEA_STORM: 'Storm',
    WIND_SEA_HURRICANE: 'Orkan',

    // === VIND: Beaufort-namn (visas ihop med Beaufort-siffran) ===
    WIND_BEAUFORT_CALM: 'Lugn',

    // === BAROMETER: nivåord (Huger-barometerns skala) ===
    BARO_STORM: 'Storm',
    BARO_RAIN: 'Regn',
    BARO_UNSTABLE: 'Ostadigt',
    BARO_FAIR: 'Vackert',
    BARO_VERY_DRY: 'Mycket torrt',

    // === BAROMETER: trend (femgradig) ===
    TREND_RISING_FAST_WORD: 'stiger snabbt',
    TREND_RISING_WORD: 'stiger',
    TREND_STABLE_WORD: 'stabilt',
    TREND_FALLING_WORD: 'faller',
    TREND_FALLING_FAST_WORD: 'faller snabbt',
    TREND_RISING_FAST: 'Stigande snabbt',
    TREND_RISING: 'Stigande',
    TREND_STABLE: 'Stabilt',
    TREND_FALLING: 'Fallande',
    TREND_FALLING_FAST: 'Fallande snabbt',
    TREND_COLLECTING: 'Samlar data...',
    TREND_PREFIX: 'Trend: ',

    // === UV-INDEX: risknivåer (Strålskyddsmyndighetens skala) ===
    UV_RISK_low: 'Låg UV-risk',
    UV_RISK_moderate: 'Måttlig UV-risk',
    UV_RISK_high: 'Hög UV-risk',
    UV_RISK_very_high: 'Mycket hög UV-risk',
    UV_RISK_extreme: 'Extrem UV-risk',

    // === LUFTKVALITET: etiketter + European-AQI-band (EEA-nivåer) ===
    AQ_LABEL: 'Luftkvalitet',
    AQ_INDOOR: 'Inomhus',
    AQ_OUTDOOR: 'Utomhus',
    AQ_INDOOR_SHORT: 'Inne',
    AQ_OUTDOOR_SHORT: 'Ute',
    AQI_BAND_good: 'God',
    AQI_BAND_fair: 'Skälig',
    AQI_BAND_moderate: 'Måttlig',
    AQI_BAND_poor: 'Dålig',
    AQI_BAND_very_poor: 'Mycket dålig',
    AQI_BAND_extremely_poor: 'Extremt dålig'
});
