/**
 * @file es.js
 * @description Spansk språkkatalog. Vindterminologi enligt AEMET:s
 *              Beaufort-denominationer som fristående adjektiv
 *              (flojo/moderado/fresco/fuerte, temporal, huracán) -
 *              även för att 12h-korten visar termens första ord
 *              ("Viento flojo" hade blivit "Viento").
 *              Barometerorden enligt klassiska spanska barometerurtavlor
 *              (Tempestad/Lluvia/Variable/Buen tiempo/Muy seco).
 */

I18n.register('es', {
    __locale: 'es-ES',

    LABEL_ACTUAL: 'REAL',
    LABEL_FORECAST: 'PREVISIÓN',
    LABEL_TEMPERATURE: 'TEMPERATURA',
    SECTION_12H: 'Previsión 12 h',
    SECTION_5DAY: 'Previsión 5 días',

    LOADING: 'Cargando...',
    LOADING_WEATHER: 'Cargando datos meteorológicos...',
    LOADING_FORECAST: 'Cargando previsión...',
    STATUS_UPDATED: 'Datos meteorológicos actualizados',
    STALE_SINCE: '⚠️ Datos sin actualizar desde {time}',
    STALE_UNAVAILABLE: '⚠️ Datos meteorológicos no disponibles',
    COMPASS: 'N,NNE,NE,ENE,E,ESE,SE,SSE,S,SSO,SO,OSO,O,ONO,NO,NNO',
    UNKNOWN: 'Desconocido',

    FMT_HUMIDITY: '{value}% Humedad',
    FMT_AIR_QUALITY: '{value} ppm Calidad del aire',
    FMT_NOISE: '{value} dB Ruido',

    WEATHER_1: 'Despejado',
    WEATHER_2: 'Casi despejado',
    WEATHER_3: 'Nubosidad variable',
    WEATHER_4: 'Parcialmente nuboso',
    WEATHER_5: 'Nuboso',
    WEATHER_6: 'Cubierto',
    WEATHER_7: 'Niebla',
    WEATHER_8: 'Chubascos',
    WEATHER_9: 'Chubascos',
    WEATHER_10: 'Chubascos',
    WEATHER_11: 'Tormenta',
    WEATHER_12: 'Chubascos de aguanieve',
    WEATHER_13: 'Chubascos de aguanieve',
    WEATHER_14: 'Chubascos de aguanieve',
    WEATHER_15: 'Chubascos de nieve',
    WEATHER_16: 'Chubascos de nieve',
    WEATHER_17: 'Chubascos de nieve',
    WEATHER_18: 'Lluvia',
    WEATHER_19: 'Lluvia',
    WEATHER_20: 'Lluvia',
    WEATHER_21: 'Tormenta',
    WEATHER_22: 'Aguanieve',
    WEATHER_23: 'Aguanieve',
    WEATHER_24: 'Aguanieve',
    WEATHER_25: 'Nieve',
    WEATHER_26: 'Nieve',
    WEATHER_27: 'Nieve',

    WIND_LAND_CALM: 'Calma',
    WIND_LAND_WEAK: 'Flojo',
    WIND_LAND_MODERATE: 'Moderado',
    WIND_LAND_FRESH: 'Fresco',
    WIND_LAND_STRONG: 'Fuerte',
    WIND_LAND_STORM: 'Temporal',
    WIND_LAND_HURRICANE: 'Huracán',

    WIND_SEA_CALM: 'Calma',
    WIND_SEA_BREEZE: 'Brisa',
    WIND_SEA_GALE: 'Temporal',
    WIND_SEA_STORM: 'Borrasca',
    WIND_SEA_HURRICANE: 'Huracán',

    WIND_BEAUFORT_CALM: 'Calma',

    BARO_STORM: 'Tempestad',
    BARO_RAIN: 'Lluvia',
    BARO_UNSTABLE: 'Variable',
    BARO_FAIR: 'Buen tiempo',
    BARO_VERY_DRY: 'Muy seco',

    TREND_RISING_FAST_WORD: 'sube rápido',
    TREND_RISING_WORD: 'sube',
    TREND_STABLE_WORD: 'estable',
    TREND_FALLING_WORD: 'baja',
    TREND_FALLING_FAST_WORD: 'baja rápido',
    TREND_RISING_FAST: 'Subiendo rápido',
    TREND_RISING: 'Subiendo',
    TREND_STABLE: 'Estable',
    TREND_FALLING: 'Bajando',
    TREND_FALLING_FAST: 'Bajando rápido',
    TREND_COLLECTING: 'Recopilando datos...',
    TREND_PREFIX: 'Tendencia: ',

    UV_RISK_low: 'Riesgo UV bajo',
    UV_RISK_moderate: 'Riesgo UV moderado',
    UV_RISK_high: 'Riesgo UV alto',
    UV_RISK_very_high: 'Riesgo UV muy alto',
    UV_RISK_extreme: 'Riesgo UV extremo',

    // === CALIDAD DEL AIRE ===
    AQ_LABEL: 'Calidad del aire',
    AQ_INDOOR: 'Interior',
    AQ_OUTDOOR: 'Exterior',
    AQ_INDOOR_SHORT: 'Int',
    AQ_OUTDOOR_SHORT: 'Ext',
    AQI_BAND_good: 'Buena',
    AQI_BAND_fair: 'Razonable',
    AQI_BAND_moderate: 'Regular',
    AQI_BAND_poor: 'Mala',
    AQI_BAND_very_poor: 'Muy mala',
    AQI_BAND_extremely_poor: 'Extremadamente mala'
});
