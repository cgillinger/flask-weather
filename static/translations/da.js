/**
 * @file da.js
 * @description Dansk språkkatalog. Vindterminologi enligt DMI:s
 *              Beaufort-benämningar (stille, svag vind, jævn vind,
 *              frisk vind, kuling, storm, orkan), grupperade till
 *              appens förenklade skalor.
 */

I18n.register('da', {
    __locale: 'da-DK',

    LABEL_ACTUAL: 'FAKTISK',
    LABEL_FORECAST: 'PROGNOSE',
    LABEL_TEMPERATURE: 'TEMPERATUR',
    SECTION_12H: '12-timers prognose',
    SECTION_5DAY: '5-døgns prognose',

    LOADING: 'Indlæser...',
    LOADING_WEATHER: 'Indlæser vejrdata...',
    LOADING_FORECAST: 'Indlæser prognose...',
    STATUS_UPDATED: 'Vejrdata opdateret',
    STALE_SINCE: '⚠️ Data ikke opdateret siden {time}',
    STALE_UNAVAILABLE: '⚠️ Vejrdata kan ikke hentes',
    COMPASS: 'N,NNØ,NØ,ØNØ,Ø,ØSØ,SØ,SSØ,S,SSV,SV,VSV,V,VNV,NV,NNV',
    UNKNOWN: 'Ukendt',

    FMT_HUMIDITY: '{value}% Luftfugtighed',
    FMT_AIR_QUALITY: '{value} ppm Luftkvalitet',
    FMT_NOISE: '{value} dB Støj',

    WEATHER_1: 'Klart',
    WEATHER_2: 'Næsten klart',
    WEATHER_3: 'Skiftende skydække',
    WEATHER_4: 'Delvist skyet',
    WEATHER_5: 'Skyet',
    WEATHER_6: 'Overskyet',
    WEATHER_7: 'Tåge',
    WEATHER_8: 'Regnbyger',
    WEATHER_9: 'Regnbyger',
    WEATHER_10: 'Regnbyger',
    WEATHER_11: 'Torden',
    WEATHER_12: 'Sludbyger',
    WEATHER_13: 'Sludbyger',
    WEATHER_14: 'Sludbyger',
    WEATHER_15: 'Snebyger',
    WEATHER_16: 'Snebyger',
    WEATHER_17: 'Snebyger',
    WEATHER_18: 'Regn',
    WEATHER_19: 'Regn',
    WEATHER_20: 'Regn',
    WEATHER_21: 'Torden',
    WEATHER_22: 'Slud',
    WEATHER_23: 'Slud',
    WEATHER_24: 'Slud',
    WEATHER_25: 'Sne',
    WEATHER_26: 'Sne',
    WEATHER_27: 'Sne',

    WIND_LAND_CALM: 'Stille',
    WIND_LAND_WEAK: 'Svag vind',
    WIND_LAND_MODERATE: 'Jævn vind',
    WIND_LAND_FRESH: 'Frisk vind',
    WIND_LAND_STRONG: 'Kuling',
    WIND_LAND_STORM: 'Storm',
    WIND_LAND_HURRICANE: 'Orkan',

    WIND_SEA_CALM: 'Stille',
    WIND_SEA_BREEZE: 'Brise',
    WIND_SEA_GALE: 'Kuling',
    WIND_SEA_STORM: 'Storm',
    WIND_SEA_HURRICANE: 'Orkan',

    WIND_BEAUFORT_CALM: 'Stille',

    BARO_STORM: 'Storm',
    BARO_RAIN: 'Regn',
    BARO_UNSTABLE: 'Foranderligt',
    BARO_FAIR: 'Smukt vejr',
    BARO_VERY_DRY: 'Meget tørt',

    TREND_RISING_FAST_WORD: 'stiger hurtigt',
    TREND_RISING_WORD: 'stiger',
    TREND_STABLE_WORD: 'stabilt',
    TREND_FALLING_WORD: 'falder',
    TREND_FALLING_FAST_WORD: 'falder hurtigt',
    TREND_RISING_FAST: 'Stigende hurtigt',
    TREND_RISING: 'Stigende',
    TREND_STABLE: 'Stabilt',
    TREND_FALLING: 'Faldende',
    TREND_FALLING_FAST: 'Faldende hurtigt',
    TREND_COLLECTING: 'Samler data...',
    TREND_PREFIX: 'Trend: ',

    UV_RISK_low: 'Lav UV-risiko',
    UV_RISK_moderate: 'Moderat UV-risiko',
    UV_RISK_high: 'Høj UV-risiko',
    UV_RISK_very_high: 'Meget høj UV-risiko',
    UV_RISK_extreme: 'Ekstrem UV-risiko',

    // === LUFTKVALITET ===
    AQ_LABEL: 'Luftkvalitet',
    AQ_INDOOR: 'Indendørs',
    AQ_OUTDOOR: 'Udendørs',
    AQ_INDOOR_SHORT: 'Inde',
    AQ_OUTDOOR_SHORT: 'Ude',
    AQI_BAND_good: 'God',
    AQI_BAND_fair: 'Rimelig',
    AQI_BAND_moderate: 'Moderat',
    AQI_BAND_poor: 'Ringe',
    AQI_BAND_very_poor: 'Meget ringe',
    AQI_BAND_extremely_poor: 'Ekstremt ringe'
});
