/**
 * @file icon-packs.js
 * @description Icon pack system: switch weather icon set via config (ui.icon_pack)
 * @dependencies WeatherIconRenderer (weather-icon-renderer.js) for font rendering
 *
 * Architecture:
 *   SMHI symbol (1-27) ──► semantic key ──► active pack's icon (day/night)
 *
 * SMHI_SEMANTIC_MAP is the ONLY place that interprets SMHI symbol numbers.
 * Each pack maps semantic keys to its own icons and doesn't need
 * to know anything about SMHI.
 *
 * Adding a new pack:
 *   1. Put icon files under static/assets/icons/<packname>/
 *      (include the pack's LICENSE file in the folder!)
 *   2. Add an entry in ICON_PACKS with type 'font' or 'svg'
 *      and one icon per semantic key ({day: ..., night: ...})
 *      - font: set baseClass (and link the pack's CSS in index.html)
 *      - svg:  set basePath (+ staticBasePath if the pack is animated)
 *   3. Select the pack with ui.icon_pack in reference/config.py
 *
 * LICENSES: each vendored pack has its license file in its icon folder and
 * attribution in readme ("Icon packs and licenses"). Note in particular that
 * amedia-meteo is CC BY-NC-SA 4.0 (ONLY non-commercial use).
 */

// === CANONICAL MAPPING: SMHI symbol → semantic weather key ===
const SMHI_SEMANTIC_MAP = {
    1: 'clear',
    2: 'mostly-clear',
    3: 'partly-cloudy',
    4: 'mostly-cloudy',
    5: 'cloudy',
    6: 'overcast',
    7: 'fog',
    8: 'light-showers',
    9: 'showers',
    10: 'heavy-showers',
    11: 'thunder',
    12: 'light-sleet-showers',
    13: 'sleet-showers',
    14: 'heavy-sleet-showers',
    15: 'light-snow-showers',
    16: 'snow-showers',
    17: 'heavy-snow-showers',
    18: 'light-rain',
    19: 'rain',
    20: 'heavy-rain',
    21: 'thunderstorm',
    22: 'light-sleet',
    23: 'sleet',
    24: 'heavy-sleet',
    25: 'light-snow',
    26: 'snow',
    27: 'heavy-snow'
};

// === ICON PACKS ===
const ICON_PACKS = {
    /**
     * Weather Icons font (Erik Flowers) - classic mode.
     * Monochrome font that is color-coded automatically by ColorManager.
     */
    'weather-icons': {
        type: 'font',
        icons: {
            'clear':               {day: 'wi-day-sunny',          night: 'wi-night-clear'},
            'mostly-clear':        {day: 'wi-day-sunny-overcast', night: 'wi-night-partly-cloudy'},
            'partly-cloudy':       {day: 'wi-day-cloudy',         night: 'wi-night-alt-cloudy'},
            'mostly-cloudy':       {day: 'wi-day-cloudy-high',    night: 'wi-night-cloudy-high'},
            'cloudy':              {day: 'wi-cloudy',             night: 'wi-cloudy'},
            'overcast':            {day: 'wi-cloud',              night: 'wi-cloud'},
            'fog':                 {day: 'wi-fog',                night: 'wi-fog'},
            'light-showers':       {day: 'wi-day-showers',        night: 'wi-night-showers'},
            'showers':             {day: 'wi-day-rain',           night: 'wi-night-rain'},
            'heavy-showers':       {day: 'wi-rain',               night: 'wi-rain'},
            'thunder':             {day: 'wi-day-thunderstorm',   night: 'wi-night-thunderstorm'},
            'light-sleet-showers': {day: 'wi-day-rain-mix',       night: 'wi-night-rain-mix'},
            'sleet-showers':       {day: 'wi-rain-mix',           night: 'wi-rain-mix'},
            'heavy-sleet-showers': {day: 'wi-rain-mix',           night: 'wi-rain-mix'},
            'light-snow-showers':  {day: 'wi-day-snow',           night: 'wi-night-snow'},
            'snow-showers':        {day: 'wi-snowflake-cold',     night: 'wi-snowflake-cold'},
            'heavy-snow-showers':  {day: 'wi-snowflake-cold',     night: 'wi-snowflake-cold'},
            'light-rain':          {day: 'wi-day-rain',           night: 'wi-night-rain'},
            'rain':                {day: 'wi-rain',               night: 'wi-rain'},
            'heavy-rain':          {day: 'wi-rain',               night: 'wi-rain'},
            'thunderstorm':        {day: 'wi-thunderstorm',       night: 'wi-thunderstorm'},
            'light-sleet':         {day: 'wi-day-sleet',          night: 'wi-night-sleet'},
            'sleet':               {day: 'wi-sleet',              night: 'wi-sleet'},
            'heavy-sleet':         {day: 'wi-sleet',              night: 'wi-sleet'},
            'light-snow':          {day: 'wi-day-snow',           night: 'wi-night-snow'},
            'snow':                {day: 'wi-snowflake-cold',     night: 'wi-snowflake-cold'},
            'heavy-snow':          {day: 'wi-snowflake-cold',     night: 'wi-snowflake-cold'}
        }
    },

    /**
     * amCharts animated weather SVGs - colorful icons with built-in animation.
     * Own colors; ColorManager color is ignored (style.color doesn't affect <img>).
     * The set lacks fog/sleet - nearest icon is used as fallback.
     */
    'amcharts': {
        type: 'svg',
        basePath: '/static/assets/icons/amcharts-svg/',
        // Non-animated copies (without <style> block), generated with
        // scripts/generate_static_icons.py - used by animation mode
        // ('hero'/'none') because the page's CSS can't pause animations
        // inside an <img>
        staticBasePath: '/static/assets/icons/amcharts-svg-static/',
        // Visual scaling via CSS transform - compensates for whitespace in
        // SVGs' viewBox WITHOUT affecting layout (layout box is
        // always exactly 1em, like a font glyph)
        scale: 1.3,
        // Per-file correction: some files draw their content in smaller
        // part of viewBox than others (sun ~55% vs. clouds ~80%)
        fileScale: {
            'day/day.svg': 1.4,
            'night/night.svg': 1.35
        },
        icons: {
            'clear':               {day: 'day/day.svg',          night: 'night/night.svg'},
            'mostly-clear':        {day: 'day/cloudy-day-1.svg', night: 'night/cloudy-night-1.svg'},
            'partly-cloudy':       {day: 'day/cloudy-day-2.svg', night: 'night/cloudy-night-2.svg'},
            'mostly-cloudy':       {day: 'day/cloudy-day-2.svg', night: 'night/cloudy-night-2.svg'},
            'cloudy':              {day: 'day/cloudy-day-3.svg', night: 'night/cloudy-night-3.svg'},
            'overcast':            {day: 'day/cloudy-day-3.svg', night: 'night/cloudy-night-3.svg'},
            'fog':                 {day: 'day/cloudy-day-3.svg', night: 'night/cloudy-night-3.svg'},
            'light-showers':       {day: 'day/rainy-1.svg',      night: 'day/rainy-4.svg'},
            'showers':             {day: 'day/rainy-2.svg',      night: 'day/rainy-5.svg'},
            'heavy-showers':       {day: 'day/rainy-3.svg',      night: 'day/rainy-6.svg'},
            'thunder':             {day: 'animated/thunder.svg', night: 'animated/thunder.svg'},
            'light-sleet-showers': {day: 'day/rainy-7.svg',      night: 'day/rainy-7.svg'},
            'sleet-showers':       {day: 'day/rainy-7.svg',      night: 'day/rainy-7.svg'},
            'heavy-sleet-showers': {day: 'day/rainy-7.svg',      night: 'day/rainy-7.svg'},
            'light-snow-showers':  {day: 'day/snowy-1.svg',      night: 'day/snowy-4.svg'},
            'snow-showers':        {day: 'day/snowy-2.svg',      night: 'day/snowy-5.svg'},
            'heavy-snow-showers':  {day: 'day/snowy-3.svg',      night: 'day/snowy-6.svg'},
            'light-rain':          {day: 'day/rainy-4.svg',      night: 'day/rainy-4.svg'},
            'rain':                {day: 'day/rainy-5.svg',      night: 'day/rainy-5.svg'},
            'heavy-rain':          {day: 'day/rainy-6.svg',      night: 'day/rainy-6.svg'},
            'thunderstorm':        {day: 'animated/thunder.svg', night: 'animated/thunder.svg'},
            'light-sleet':         {day: 'day/rainy-7.svg',      night: 'day/rainy-7.svg'},
            'sleet':               {day: 'day/rainy-7.svg',      night: 'day/rainy-7.svg'},
            'heavy-sleet':         {day: 'day/rainy-7.svg',      night: 'day/rainy-7.svg'},
            'light-snow':          {day: 'day/snowy-4.svg',      night: 'day/snowy-4.svg'},
            'snow':                {day: 'day/snowy-5.svg',      night: 'day/snowy-5.svg'},
            'heavy-snow':          {day: 'day/snowy-6.svg',      night: 'day/snowy-6.svg'}
        }
    },

    /**
     * Meteocons (Bas Milius) - animated SVGs in fill style, MIT license.
     * Animations are SMIL without filters and thus significantly cheaper than
     * amcharts - but on Safari/iPad auto mode still uses hero-only.
     * License: LICENSE in icon folder. Source: https://github.com/basmilius/meteocons
     */
    'meteocons': {
        type: 'svg',
        basePath: '/static/assets/icons/meteocons-svg/',
        staticBasePath: '/static/assets/icons/meteocons-svg-static/',
        scale: 1.25,
        icons: {
            'clear':               {day: 'clear-day.svg',                night: 'clear-night.svg'},
            'mostly-clear':        {day: 'mostly-clear-day.svg',         night: 'mostly-clear-night.svg'},
            'partly-cloudy':       {day: 'partly-cloudy-day.svg',        night: 'partly-cloudy-night.svg'},
            'mostly-cloudy':       {day: 'overcast-day.svg',             night: 'overcast-night.svg'},
            'cloudy':              {day: 'cloudy.svg',                   night: 'cloudy.svg'},
            'overcast':            {day: 'overcast.svg',                 night: 'overcast.svg'},
            'fog':                 {day: 'fog-day.svg',                  night: 'fog-night.svg'},
            'light-showers':       {day: 'partly-cloudy-day-drizzle.svg', night: 'partly-cloudy-night-drizzle.svg'},
            'showers':             {day: 'partly-cloudy-day-rain.svg',   night: 'partly-cloudy-night-rain.svg'},
            'heavy-showers':       {day: 'extreme-day-rain.svg',         night: 'extreme-night-rain.svg'},
            'thunder':             {day: 'thunderstorms-day.svg',        night: 'thunderstorms-night.svg'},
            'light-sleet-showers': {day: 'partly-cloudy-day-sleet.svg',  night: 'partly-cloudy-night-sleet.svg'},
            'sleet-showers':       {day: 'overcast-day-sleet.svg',       night: 'overcast-night-sleet.svg'},
            'heavy-sleet-showers': {day: 'extreme-day-sleet.svg',        night: 'extreme-night-sleet.svg'},
            'light-snow-showers':  {day: 'partly-cloudy-day-snow.svg',   night: 'partly-cloudy-night-snow.svg'},
            'snow-showers':        {day: 'overcast-day-snow.svg',        night: 'overcast-night-snow.svg'},
            'heavy-snow-showers':  {day: 'extreme-day-snow.svg',         night: 'extreme-night-snow.svg'},
            'light-rain':          {day: 'drizzle.svg',                  night: 'drizzle.svg'},
            'rain':                {day: 'rain.svg',                     night: 'rain.svg'},
            'heavy-rain':          {day: 'extreme-rain.svg',             night: 'extreme-rain.svg'},
            'thunderstorm':        {day: 'thunderstorms-day-rain.svg',   night: 'thunderstorms-night-rain.svg'},
            'light-sleet':         {day: 'sleet.svg',                    night: 'sleet.svg'},
            'sleet':               {day: 'overcast-sleet.svg',           night: 'overcast-sleet.svg'},
            'heavy-sleet':         {day: 'extreme-sleet.svg',            night: 'extreme-sleet.svg'},
            'light-snow':          {day: 'snow.svg',                     night: 'snow.svg'},
            'snow':                {day: 'overcast-snow.svg',            night: 'overcast-snow.svg'},
            'heavy-snow':          {day: 'extreme-snow.svg',             night: 'extreme-snow.svg'}
        }
    },

    /**
     * Amedia Weather Icons - static color SVGs with day/night variants.
     * File names are Meteorological Institute symbol IDs (weathericon 1.1).
     * LICENSE: CC BY-NC-SA 4.0 - ONLY non-commercial use!
     * Attribution: Amedia Utvikling. See LICENSE.md in icon folder.
     * Source: https://github.com/amedia/meteo-icons
     */
    'amedia-meteo': {
        type: 'svg',
        basePath: '/static/assets/icons/amedia-meteo/',
        // Icons draw their content with more viewBox whitespace than other
        // SVG packs - compensate visually (affects only this pack)
        scale: 1.2,
        icons: {
            'clear':               {day: 'day/1.svg',  night: 'night/1.svg'},
            'mostly-clear':        {day: 'day/2.svg',  night: 'night/2.svg'},
            'partly-cloudy':       {day: 'day/3.svg',  night: 'night/3.svg'},
            'mostly-cloudy':       {day: 'day/4.svg',  night: 'night/4.svg'},
            'cloudy':              {day: 'day/4.svg',  night: 'night/4.svg'},
            'overcast':            {day: 'day/4.svg',  night: 'night/4.svg'},
            'fog':                 {day: 'day/15.svg', night: 'night/15.svg'},
            'light-showers':       {day: 'day/40.svg', night: 'night/40.svg'},
            'showers':             {day: 'day/5.svg',  night: 'night/5.svg'},
            'heavy-showers':       {day: 'day/41.svg', night: 'night/41.svg'},
            'thunder':             {day: 'day/6.svg',  night: 'night/6.svg'},
            'light-sleet-showers': {day: 'day/42.svg', night: 'night/42.svg'},
            'sleet-showers':       {day: 'day/7.svg',  night: 'night/7.svg'},
            'heavy-sleet-showers': {day: 'day/43.svg', night: 'night/43.svg'},
            'light-snow-showers':  {day: 'day/44.svg', night: 'night/44.svg'},
            'snow-showers':        {day: 'day/8.svg',  night: 'night/8.svg'},
            'heavy-snow-showers':  {day: 'day/45.svg', night: 'night/45.svg'},
            'light-rain':          {day: 'day/46.svg', night: 'night/46.svg'},
            'rain':                {day: 'day/9.svg',  night: 'night/9.svg'},
            'heavy-rain':          {day: 'day/10.svg', night: 'night/10.svg'},
            'thunderstorm':        {day: 'day/11.svg', night: 'night/11.svg'},
            'light-sleet':         {day: 'day/47.svg', night: 'night/47.svg'},
            'sleet':               {day: 'day/12.svg', night: 'night/12.svg'},
            'heavy-sleet':         {day: 'day/48.svg', night: 'night/48.svg'},
            'light-snow':          {day: 'day/49.svg', night: 'night/49.svg'},
            'snow':                {day: 'day/13.svg', night: 'night/13.svg'},
            'heavy-snow':          {day: 'day/50.svg', night: 'night/50.svg'}
        }
    },

    /**
     * Open Weather Icons (Ivan Vilanculo) - font pack built for
     * OpenWeatherMaps symbol codes (01d-50n), MIT license. Monochrome and
     * color-coded by ColorManager. OWM lacks sleet - snow icon is used.
     * License: LICENSE.md in icon folder. Source: https://github.com/isneezy/open-weather-icons
     */
    'open-weather-icons': {
        type: 'font',
        baseClass: 'owi',
        icons: {
            'clear':               {day: 'owi-01d', night: 'owi-01n'},
            'mostly-clear':        {day: 'owi-02d', night: 'owi-02n'},
            'partly-cloudy':       {day: 'owi-03d', night: 'owi-03n'},
            'mostly-cloudy':       {day: 'owi-04d', night: 'owi-04n'},
            'cloudy':              {day: 'owi-04d', night: 'owi-04n'},
            'overcast':            {day: 'owi-04d', night: 'owi-04n'},
            'fog':                 {day: 'owi-50d', night: 'owi-50n'},
            'light-showers':       {day: 'owi-09d', night: 'owi-09n'},
            'showers':             {day: 'owi-09d', night: 'owi-09n'},
            'heavy-showers':       {day: 'owi-09d', night: 'owi-09n'},
            'thunder':             {day: 'owi-11d', night: 'owi-11n'},
            'light-sleet-showers': {day: 'owi-13d', night: 'owi-13n'},
            'sleet-showers':       {day: 'owi-13d', night: 'owi-13n'},
            'heavy-sleet-showers': {day: 'owi-13d', night: 'owi-13n'},
            'light-snow-showers':  {day: 'owi-13d', night: 'owi-13n'},
            'snow-showers':        {day: 'owi-13d', night: 'owi-13n'},
            'heavy-snow-showers':  {day: 'owi-13d', night: 'owi-13n'},
            'light-rain':          {day: 'owi-10d', night: 'owi-10n'},
            'rain':                {day: 'owi-10d', night: 'owi-10n'},
            'heavy-rain':          {day: 'owi-10d', night: 'owi-10n'},
            'thunderstorm':        {day: 'owi-11d', night: 'owi-11n'},
            'light-sleet':         {day: 'owi-13d', night: 'owi-13n'},
            'sleet':               {day: 'owi-13d', night: 'owi-13n'},
            'heavy-sleet':         {day: 'owi-13d', night: 'owi-13n'},
            'light-snow':          {day: 'owi-13d', night: 'owi-13n'},
            'snow':                {day: 'owi-13d', night: 'owi-13n'},
            'heavy-snow':          {day: 'owi-13d', night: 'owi-13n'}
        }
    },

    /**
     * Kickstand WeatherIcons - minimalist font pack (12 glyphs),
     * SIL OFL 1.1. Climacons-inspired line style, color-coded by
     * ColorManager. Small glyph set: sleet displays as rain and
     * intensity levels look the same. CSS with class mapping is in
     * icon folder (kickstand-weather.css, linked in index.html).
     * License: License.txt in icon folder. Source: https://github.com/kickstandapps/WeatherIcons
     */
    'kickstand-weather': {
        type: 'font',
        baseClass: 'ksi',
        icons: {
            'clear':               {day: 'ksi-sun',       night: 'ksi-moon'},
            'mostly-clear':        {day: 'ksi-cloud-sun', night: 'ksi-cloud-moon'},
            'partly-cloudy':       {day: 'ksi-cloud-sun', night: 'ksi-cloud-moon'},
            'mostly-cloudy':       {day: 'ksi-cloud',     night: 'ksi-cloud'},
            'cloudy':              {day: 'ksi-cloud',     night: 'ksi-cloud'},
            'overcast':            {day: 'ksi-cloud',     night: 'ksi-cloud'},
            'fog':                 {day: 'ksi-haze',      night: 'ksi-haze'},
            'light-showers':       {day: 'ksi-rain',      night: 'ksi-rain'},
            'showers':             {day: 'ksi-rain',      night: 'ksi-rain'},
            'heavy-showers':       {day: 'ksi-rain',      night: 'ksi-rain'},
            'thunder':             {day: 'ksi-thunder',   night: 'ksi-thunder'},
            'light-sleet-showers': {day: 'ksi-rain',      night: 'ksi-rain'},
            'sleet-showers':       {day: 'ksi-rain',      night: 'ksi-rain'},
            'heavy-sleet-showers': {day: 'ksi-rain',      night: 'ksi-rain'},
            'light-snow-showers':  {day: 'ksi-snow',      night: 'ksi-snow'},
            'snow-showers':        {day: 'ksi-snow',      night: 'ksi-snow'},
            'heavy-snow-showers':  {day: 'ksi-snow',      night: 'ksi-snow'},
            'light-rain':          {day: 'ksi-rain',      night: 'ksi-rain'},
            'rain':                {day: 'ksi-rain',      night: 'ksi-rain'},
            'heavy-rain':          {day: 'ksi-rain',      night: 'ksi-rain'},
            'thunderstorm':        {day: 'ksi-thunder',   night: 'ksi-thunder'},
            'light-sleet':         {day: 'ksi-rain',      night: 'ksi-rain'},
            'sleet':               {day: 'ksi-rain',      night: 'ksi-rain'},
            'heavy-sleet':         {day: 'ksi-rain',      night: 'ksi-rain'},
            'light-snow':          {day: 'ksi-snow',      night: 'ksi-snow'},
            'snow':                {day: 'ksi-snow',      night: 'ksi-snow'},
            'heavy-snow':          {day: 'ksi-snow',      night: 'ksi-snow'}
        }
    }
};

// === ANIMATION MODE ===

/**
 * Detect WebKit clients (Safari and ALL browsers on iPad/iPhone,
 * which are WebKit under the hood). WebKit CPU-rasterizes animated SVGs in
 * <img> through their feGaussianBlur filter every frame - with ~10 icons
 * at once it lags. Auto mode therefore gives these clients hero-only.
 * NOTE: iPadOS reports itself as "Macintosh" in user agent - revealed by
 * multi-touch (maxTouchPoints).
 * @returns {boolean} true if client should get reduced icon animation
 */
function isWebKitClient() {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
        (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const isSafari = /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR/.test(ua);
    return isIOS || isSafari;
}

// === REGISTRY ===
const IconRegistry = {
    activePack: 'weather-icons',

    // Resolved animation mode: 'all' | 'hero' | 'none'
    // ('auto' from config is resolved to 'all' or 'hero' in setAnimationMode)
    animationMode: 'all',

    /**
     * Set active icon pack (called from fetch-api-client when config is loaded)
     * @param {string} packName - Key in ICON_PACKS
     */
    setActivePack(packName) {
        if (!packName || packName === this.activePack) return;

        if (ICON_PACKS[packName]) {
            this.activePack = packName;
            // Expose active pack for CSS - enables pack-specific
            // slot rules (e.g. amedia-meteo which renders nicer than others)
            document.documentElement.dataset.iconPack = packName;
            console.log(`🎨 Ikonpaket bytt till: ${packName}`);
        } else {
            console.warn(`⚠️ Okänt ikonpaket '${packName}' - behåller '${this.activePack}'. Tillgängliga: ${Object.keys(ICON_PACKS).join(', ')}`);
        }
    },

    /**
     * Set icon animation mode (called from fetch-api-client when config is loaded)
     * @param {string} mode - 'auto' | 'all' | 'hero' | 'none' (ui.icon_animations)
     */
    setAnimationMode(mode) {
        if (!['auto', 'all', 'hero', 'none'].includes(mode)) {
            console.warn(`⚠️ Okänt ikonanimeringsläge '${mode}' - behåller '${this.animationMode}'. Giltiga: auto, all, hero, none`);
            return;
        }

        const resolved = mode === 'auto' ? (isWebKitClient() ? 'hero' : 'all') : mode;
        if (resolved !== this.animationMode) {
            this.animationMode = resolved;
            console.log(`🎬 Ikonanimeringsläge: ${resolved}${mode === 'auto' ? ' (auto-detekterat)' : ''}`);
        }
    },

    /**
     * Resolve icon pack rotation (ui.icon_pack_rotation) to today's pack.
     * Deterministic from the date - all clients (kiosk, iPad, ...) land
     * in the same pack without server state or sync. Pack list is fetched
     * from ICON_PACKS registry (in manifest order), never hardcoded:
     * packs added to the registry come with rotation automatically.
     * @param {Object} rotation - {enabled, interval: 'day'|'week'|'month', exclude: []}
     * @param {Date} at - Time point to resolve for (default now; injectable for test)
     * @returns {string|null} Pack name, or null if all packs are excluded
     */
    resolveRotationPack(rotation, at = new Date()) {
        const exclude = Array.isArray(rotation.exclude) ? rotation.exclude : [];
        const packs = Object.keys(ICON_PACKS).filter(p => !exclude.includes(p));
        if (packs.length === 0) {
            console.warn('⚠️ Ikonpaketsrotation: alla paket uteslutna - faller tillbaka på ui.icon_pack');
            return null;
        }

        // Monotonic period counter (local time) - no jumps at year boundaries
        const epochDays = Math.floor((at.getTime() - at.getTimezoneOffset() * 60000) / 86400000);
        let period;
        switch (rotation.interval) {
            case 'day':   period = epochDays; break;
            case 'month': period = at.getFullYear() * 12 + at.getMonth(); break;
            case 'week':  period = Math.floor((epochDays + 3) / 7); break; // epoch was Thursday - +3 gives Monday boundary
            default:
                console.warn(`⚠️ Ikonpaketsrotation: okänt intervall '${rotation.interval}' - använder 'week'`);
                period = Math.floor((epochDays + 3) / 7);
        }
        return packs[period % packs.length];
    },

    /**
     * Create weather icon element for an SMHI symbol with active pack
     * @param {number} symbol - SMHI weather symbol (1-27)
     * @param {boolean} isDay - Day or night variant
     * @param {Array} extraClasses - Extra CSS classes (e.g. size class)
     * @returns {HTMLElement} <i> element (font) or <img> element (svg)
     */
    createWeatherIcon(symbol, isDay = true, extraClasses = []) {
        const semanticKey = SMHI_SEMANTIC_MAP[parseInt(symbol)];
        const pack = ICON_PACKS[this.activePack];
        const variants = semanticKey && pack ? pack.icons[semanticKey] : null;
        const iconName = variants ? (isDay ? variants.day : variants.night) : null;

        if (!iconName) {
            return WeatherIconRenderer.createIcon('wi-na', extraClasses);
        }

        if (pack.type === 'font') {
            // Packs with their own baseClass ('owi', 'ksi', ...) render generically;
            // their @font-face/classes are loaded via CSS linked in index.html.
            // Weather Icons font goes through its dedicated renderer (wi-prefix
            // and inline font-family).
            if (pack.baseClass) {
                const icon = document.createElement('i');
                icon.className = [pack.baseClass, iconName, ...extraClasses].join(' ');
                return icon;
            }
            return WeatherIconRenderer.createIcon(iconName, extraClasses);
        }

        // SVG pack: <img> with FORCED layout box of 1em (like a font glyph,
        // see styles.css) - the pack's scale only adjusts the visual via
        // transform and can never break the layout
        //
        // ANIMATION MODE: hero icon (current weather) is identified by its
        // CSS class from current-weather-view; other icons get static
        // files when mode is 'hero' or 'none'
        const isHero = extraClasses.includes('weather-main-icon');
        const animate = this.animationMode === 'all' ||
            (this.animationMode === 'hero' && isHero);
        const basePath = animate
            ? pack.basePath
            : (pack.staticBasePath || pack.basePath);

        const img = document.createElement('img');
        img.src = basePath + iconName;
        img.alt = '';
        img.draggable = false;
        img.className = ['svg-weather-icon', ...extraClasses].join(' ');
        const visualScale = (pack.scale || 1) * ((pack.fileScale && pack.fileScale[iconName]) || 1);
        if (visualScale !== 1) {
            img.style.setProperty('--icon-scale', String(visualScale));
        }
        return img;
    }
};

window.IconRegistry = IconRegistry;
document.documentElement.dataset.iconPack = IconRegistry.activePack;

console.log(`✅ Icon Packs laddat - ${Object.keys(ICON_PACKS).length} paket tillgängliga: ${Object.keys(ICON_PACKS).join(', ')}`);
