/**
 * @file fr.js
 * @description Fransk språkkatalog. Vindterminologin bygger på
 *              Météo-France Beaufort-benämningar men använder fristående
 *              adjektiv (Faible/Modéré/Frais/Fort) eftersom 12h-korten
 *              visar termens första ord - "Vent modéré" hade blivit "Vent".
 *              Barometerorden enligt klassiska franska barometerurtavlor
 *              (Tempête/Pluie/Variable/Beau temps/Très sec).
 */

I18n.register('fr', {
    __locale: 'fr-FR',

    LABEL_ACTUAL: 'RÉEL',
    LABEL_FORECAST: 'PRÉVISION',
    LABEL_TEMPERATURE: 'TEMPÉRATURE',
    SECTION_12H: 'Prévisions 12 h',
    SECTION_5DAY: 'Prévisions 5 jours',

    LOADING: 'Chargement...',
    LOADING_WEATHER: 'Chargement des données météo...',
    LOADING_FORECAST: 'Chargement des prévisions...',
    STATUS_UPDATED: 'Données météo à jour',
    STALE_SINCE: '⚠️ Données non mises à jour depuis {time}',
    STALE_UNAVAILABLE: '⚠️ Données météo indisponibles',
    COMPASS: 'N,NNE,NE,ENE,E,ESE,SE,SSE,S,SSO,SO,OSO,O,ONO,NO,NNO',
    UNKNOWN: 'Inconnu',

    FMT_HUMIDITY: '{value}% Humidité',
    FMT_AIR_QUALITY: '{value} ppm Qualité de l\'air',
    FMT_NOISE: '{value} dB Bruit',

    WEATHER_1: 'Dégagé',
    WEATHER_2: 'Presque dégagé',
    WEATHER_3: 'Ciel variable',
    WEATHER_4: 'Partiellement nuageux',
    WEATHER_5: 'Nuageux',
    WEATHER_6: 'Couvert',
    WEATHER_7: 'Brouillard',
    WEATHER_8: 'Averses',
    WEATHER_9: 'Averses',
    WEATHER_10: 'Averses',
    WEATHER_11: 'Orage',
    WEATHER_12: 'Averses de grésil',
    WEATHER_13: 'Averses de grésil',
    WEATHER_14: 'Averses de grésil',
    WEATHER_15: 'Averses de neige',
    WEATHER_16: 'Averses de neige',
    WEATHER_17: 'Averses de neige',
    WEATHER_18: 'Pluie',
    WEATHER_19: 'Pluie',
    WEATHER_20: 'Pluie',
    WEATHER_21: 'Orage',
    WEATHER_22: 'Neige fondue',
    WEATHER_23: 'Neige fondue',
    WEATHER_24: 'Neige fondue',
    WEATHER_25: 'Neige',
    WEATHER_26: 'Neige',
    WEATHER_27: 'Neige',

    WIND_LAND_CALM: 'Calme',
    WIND_LAND_WEAK: 'Faible',
    WIND_LAND_MODERATE: 'Modéré',
    WIND_LAND_FRESH: 'Frais',
    WIND_LAND_STORM: 'Tempête',
    WIND_LAND_STRONG: 'Fort',
    WIND_LAND_HURRICANE: 'Ouragan',

    WIND_SEA_CALM: 'Calme',
    WIND_SEA_BREEZE: 'Brise',
    WIND_SEA_GALE: 'Coup de vent',
    WIND_SEA_STORM: 'Tempête',
    WIND_SEA_HURRICANE: 'Ouragan',

    WIND_BEAUFORT_CALM: 'Calme',

    BARO_STORM: 'Tempête',
    BARO_RAIN: 'Pluie',
    BARO_UNSTABLE: 'Variable',
    BARO_FAIR: 'Beau temps',
    BARO_VERY_DRY: 'Très sec',

    TREND_RISING_FAST_WORD: 'monte vite',
    TREND_RISING_WORD: 'monte',
    TREND_STABLE_WORD: 'stable',
    TREND_FALLING_WORD: 'descend',
    TREND_FALLING_FAST_WORD: 'descend vite',
    TREND_RISING_FAST: 'En hausse rapide',
    TREND_RISING: 'En hausse',
    TREND_STABLE: 'Stable',
    TREND_FALLING: 'En baisse',
    TREND_FALLING_FAST: 'En baisse rapide',
    TREND_COLLECTING: 'Collecte des données...',
    TREND_PREFIX: 'Tendance : ',

    UV_RISK_low: 'Risque UV faible',
    UV_RISK_moderate: 'Risque UV modéré',
    UV_RISK_high: 'Risque UV élevé',
    UV_RISK_very_high: 'Risque UV très élevé',
    UV_RISK_extreme: 'Risque UV extrême'
});
