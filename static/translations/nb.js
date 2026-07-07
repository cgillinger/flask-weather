/**
 * @file nb.js
 * @description Norsk (bokmål) språkkatalog. Vindterminologi enligt
 *              YR/Meteorologisk institutts Beaufort-benämningar (stille,
 *              svak vind, laber bris, frisk bris, kuling, storm, orkan),
 *              grupperade till appens förenklade skalor.
 *              Registreras även under 'no' som alias.
 */

const NB_CATALOG = {
    __locale: 'nb-NO',

    LABEL_ACTUAL: 'FAKTISK',
    LABEL_FORECAST: 'PROGNOSE',
    LABEL_TEMPERATURE: 'TEMPERATUR',
    SECTION_12H: '12-timersvarsel',
    SECTION_5DAY: '5-døgnsvarsel',

    LOADING: 'Laster...',
    LOADING_WEATHER: 'Laster værdata...',
    LOADING_FORECAST: 'Laster varsel...',
    STATUS_UPDATED: 'Værdata oppdatert',
    STALE_SINCE: '⚠️ Data ikke oppdatert siden {time}',
    STALE_UNAVAILABLE: '⚠️ Værdata kan ikke hentes',
    COMPASS: 'N,NNØ,NØ,ØNØ,Ø,ØSØ,SØ,SSØ,S,SSV,SV,VSV,V,VNV,NV,NNV',
    UNKNOWN: 'Ukjent',

    FMT_HUMIDITY: '{value}% Luftfuktighet',
    FMT_AIR_QUALITY: '{value} ppm Luftkvalitet',
    FMT_NOISE: '{value} dB Støy',

    WEATHER_1: 'Klarvær',
    WEATHER_2: 'Lettskyet',
    WEATHER_3: 'Skiftende skydekke',
    WEATHER_4: 'Delvis skyet',
    WEATHER_5: 'Skyet',
    WEATHER_6: 'Overskyet',
    WEATHER_7: 'Tåke',
    WEATHER_8: 'Regnbyger',
    WEATHER_9: 'Regnbyger',
    WEATHER_10: 'Regnbyger',
    WEATHER_11: 'Torden',
    WEATHER_12: 'Sluddbyger',
    WEATHER_13: 'Sluddbyger',
    WEATHER_14: 'Sluddbyger',
    WEATHER_15: 'Snøbyger',
    WEATHER_16: 'Snøbyger',
    WEATHER_17: 'Snøbyger',
    WEATHER_18: 'Regn',
    WEATHER_19: 'Regn',
    WEATHER_20: 'Regn',
    WEATHER_21: 'Torden',
    WEATHER_22: 'Sludd',
    WEATHER_23: 'Sludd',
    WEATHER_24: 'Sludd',
    WEATHER_25: 'Snø',
    WEATHER_26: 'Snø',
    WEATHER_27: 'Snø',

    WIND_LAND_CALM: 'Stille',
    WIND_LAND_WEAK: 'Svak vind',
    WIND_LAND_MODERATE: 'Laber bris',
    WIND_LAND_FRESH: 'Frisk bris',
    WIND_LAND_STRONG: 'Kuling',
    WIND_LAND_STORM: 'Storm',
    WIND_LAND_HURRICANE: 'Orkan',

    WIND_SEA_CALM: 'Stille',
    WIND_SEA_BREEZE: 'Bris',
    WIND_SEA_GALE: 'Kuling',
    WIND_SEA_STORM: 'Storm',
    WIND_SEA_HURRICANE: 'Orkan',

    WIND_BEAUFORT_CALM: 'Stille',

    BARO_STORM: 'Storm',
    BARO_RAIN: 'Regn',
    BARO_UNSTABLE: 'Ustadig',
    BARO_FAIR: 'Pent vær',
    BARO_VERY_DRY: 'Meget tørt',

    TREND_RISING_FAST_WORD: 'stiger raskt',
    TREND_RISING_WORD: 'stiger',
    TREND_STABLE_WORD: 'stabilt',
    TREND_FALLING_WORD: 'faller',
    TREND_FALLING_FAST_WORD: 'faller raskt',
    TREND_RISING_FAST: 'Stigende raskt',
    TREND_RISING: 'Stigende',
    TREND_STABLE: 'Stabilt',
    TREND_FALLING: 'Fallende',
    TREND_FALLING_FAST: 'Fallende raskt',
    TREND_COLLECTING: 'Samler data...',
    TREND_PREFIX: 'Trend: ',

    UV_RISK_low: 'Lav UV-risiko',
    UV_RISK_moderate: 'Moderat UV-risiko',
    UV_RISK_high: 'Høy UV-risiko',
    UV_RISK_very_high: 'Svært høy UV-risiko',
    UV_RISK_extreme: 'Ekstrem UV-risiko'
};

I18n.register('nb', NB_CATALOG);
I18n.register('no', NB_CATALOG); // alias - 'no' i config fungerar också
