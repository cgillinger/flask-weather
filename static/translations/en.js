/**
 * @file en.js
 * @description Engelsk språkkatalog. Vindterminologi enligt Met Office
 *              Beaufort-benämningar (grupperade till appens förenklade skalor);
 *              barometerorden enligt klassiska engelska barometerurtavlor
 *              (Stormy/Rain/Change/Fair/Very dry).
 */

I18n.register('en', {
    __locale: 'en-GB',

    LABEL_ACTUAL: 'ACTUAL',
    LABEL_FORECAST: 'FORECAST',
    LABEL_TEMPERATURE: 'TEMPERATURE',
    SECTION_12H: '12-hour forecast',
    SECTION_5DAY: '5-day forecast',

    LOADING: 'Loading...',
    LOADING_WEATHER: 'Loading weather data...',
    LOADING_FORECAST: 'Loading forecast...',
    STATUS_UPDATED: 'Weather data updated',
    STALE_SINCE: '⚠️ Data not updated since {time}',
    STALE_UNAVAILABLE: '⚠️ Weather data unavailable',
    COMPASS: 'N,NNE,NE,ENE,E,ESE,SE,SSE,S,SSW,SW,WSW,W,WNW,NW,NNW',
    UNKNOWN: 'Unknown',

    FMT_HUMIDITY: '{value}% Humidity',
    FMT_AIR_QUALITY: '{value} ppm Air quality',
    FMT_NOISE: '{value} dB Noise',

    WEATHER_1: 'Clear',
    WEATHER_2: 'Nearly clear',
    WEATHER_3: 'Variable clouds',
    WEATHER_4: 'Partly cloudy',
    WEATHER_5: 'Cloudy',
    WEATHER_6: 'Overcast',
    WEATHER_7: 'Fog',
    WEATHER_8: 'Rain showers',
    WEATHER_9: 'Rain showers',
    WEATHER_10: 'Rain showers',
    WEATHER_11: 'Thunder',
    WEATHER_12: 'Sleet showers',
    WEATHER_13: 'Sleet showers',
    WEATHER_14: 'Sleet showers',
    WEATHER_15: 'Snow showers',
    WEATHER_16: 'Snow showers',
    WEATHER_17: 'Snow showers',
    WEATHER_18: 'Rain',
    WEATHER_19: 'Rain',
    WEATHER_20: 'Rain',
    WEATHER_21: 'Thunder',
    WEATHER_22: 'Sleet',
    WEATHER_23: 'Sleet',
    WEATHER_24: 'Sleet',
    WEATHER_25: 'Snowfall',
    WEATHER_26: 'Snowfall',
    WEATHER_27: 'Snowfall',

    // Land: särskiljande ord först (12h-korten visar bara första ordet)
    WIND_LAND_CALM: 'Calm',
    WIND_LAND_WEAK: 'Light wind',
    WIND_LAND_MODERATE: 'Moderate wind',
    WIND_LAND_FRESH: 'Fresh breeze',
    WIND_LAND_STRONG: 'Strong wind',
    WIND_LAND_STORM: 'Storm',
    WIND_LAND_HURRICANE: 'Hurricane',

    WIND_SEA_CALM: 'Calm',
    WIND_SEA_BREEZE: 'Breeze',
    WIND_SEA_GALE: 'Gale',
    WIND_SEA_STORM: 'Storm',
    WIND_SEA_HURRICANE: 'Hurricane',

    WIND_BEAUFORT_CALM: 'Calm',

    BARO_STORM: 'Stormy',
    BARO_RAIN: 'Rain',
    BARO_UNSTABLE: 'Change',
    BARO_FAIR: 'Fair',
    BARO_VERY_DRY: 'Very dry',

    TREND_RISING_FAST_WORD: 'rising fast',
    TREND_RISING_WORD: 'rising',
    TREND_STABLE_WORD: 'steady',
    TREND_FALLING_WORD: 'falling',
    TREND_FALLING_FAST_WORD: 'falling fast',
    TREND_RISING_FAST: 'Rising fast',
    TREND_RISING: 'Rising',
    TREND_STABLE: 'Steady',
    TREND_FALLING: 'Falling',
    TREND_FALLING_FAST: 'Falling fast',
    TREND_COLLECTING: 'Collecting data...',
    TREND_PREFIX: 'Trend: ',

    UV_RISK_low: 'Low UV risk',
    UV_RISK_moderate: 'Moderate UV risk',
    UV_RISK_high: 'High UV risk',
    UV_RISK_very_high: 'Very high UV risk',
    UV_RISK_extreme: 'Extreme UV risk'
});
