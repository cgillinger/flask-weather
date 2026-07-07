/**
 * @file icon-packs.js
 * @description Ikonpaketssystem: växla väderikonuppsättning via config (ui.icon_pack)
 * @dependencies WeatherIconRenderer (weather-icon-renderer.js) för font-rendering
 *
 * Arkitektur:
 *   SMHI-symbol (1-27) ──► semantisk nyckel ──► aktivt pakets ikon (dag/natt)
 *
 * SMHI_SEMANTIC_MAP är den ENDA platsen som tolkar SMHI-symbolnummer.
 * Varje paket mappar semantiska nycklar till sina egna ikoner och behöver
 * inte veta något om SMHI.
 *
 * Lägga till ett nytt paket:
 *   1. Lägg ikonfilerna under static/assets/icons/<paketnamn>/
 *      (inkludera paketets LICENSE-fil i mappen!)
 *   2. Lägg till en post i ICON_PACKS med type 'font' eller 'svg'
 *      och en ikon per semantisk nyckel ({day: ..., night: ...})
 *      - font: sätt baseClass (och länka paketets CSS i index.html)
 *      - svg:  sätt basePath (+ staticBasePath om paketet är animerat)
 *   3. Välj paketet med ui.icon_pack i reference/config.py
 *
 * LICENSER: varje vendrat paket har sin licensfil i sin ikonmapp och
 * attribution i readme ("Ikonpaket och licenser"). OBS särskilt att
 * amedia-meteo är CC BY-NC-SA 4.0 (ENDAST icke-kommersiell användning).
 */

// === KANONISK MAPPNING: SMHI-symbol → semantisk vädernyckel ===
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

// === IKONPAKET ===
const ICON_PACKS = {
    /**
     * Weather Icons-fonten (Erik Flowers) - klassiskt läge.
     * Monokrom font som färgkodas automatiskt av ColorManager.
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
     * amCharts animerade väder-SVG:er - färgglada ikoner med inbyggd animation.
     * Egna färger; ColorManager-färgen ignoreras (style.color påverkar inte <img>).
     * Setet saknar dimma/snöblandat - närmaste ikon används som ersättare.
     */
    'amcharts': {
        type: 'svg',
        basePath: '/static/assets/icons/amcharts-svg/',
        // Icke-animerade kopior (utan <style>-block), genererade med
        // scripts/generate_static_icons.py - används av animeringsläget
        // ('hero'/'none') eftersom sidans CSS inte kan pausa animationer
        // inuti en <img>
        staticBasePath: '/static/assets/icons/amcharts-svg-static/',
        // Visuell skalning via CSS transform - kompenserar för luften i
        // SVG:ernas viewBox UTAN att påverka layouten (layoutboxen är
        // alltid exakt 1em, som en fontglyf)
        scale: 1.3,
        // Per-fil-korrigering: vissa filer ritar sitt innehåll i mindre
        // del av viewBoxen än övriga (solen ~55% mot molnens ~80%)
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
     * Meteocons (Bas Milius) - animerade SVG:er i fill-stil, MIT-licens.
     * Animationerna är SMIL utan filter och därmed betydligt billigare än
     * amcharts - men på Safari/iPad gäller ändå auto-lägets hero-only.
     * Licens: LICENSE i ikonmappen. Källa: https://github.com/basmilius/meteocons
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
     * Amedia Weather Icons - statiska färg-SVG:er med dag/natt-varianter.
     * Filnamnen är Meteorologisk institutts symbol-ID:n (weathericon 1.1).
     * LICENS: CC BY-NC-SA 4.0 - ENDAST icke-kommersiell användning!
     * Attribution: Amedia Utvikling. Se LICENSE.md i ikonmappen.
     * Källa: https://github.com/amedia/meteo-icons
     */
    'amedia-meteo': {
        type: 'svg',
        basePath: '/static/assets/icons/amedia-meteo/',
        // Ikonerna ritar sitt innehåll med mer viewBox-luft än övriga
        // SVG-paket - kompensera visuellt (påverkar bara detta paket)
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
     * Open Weather Icons (Ivan Vilanculo) - fontpaket byggt för
     * OpenWeatherMaps symbolkoder (01d-50n), MIT-licens. Monokrom och
     * färgkodas av ColorManager. OWM saknar snöblandat - snöikonen används.
     * Licens: LICENSE.md i ikonmappen. Källa: https://github.com/isneezy/open-weather-icons
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
     * Kickstand WeatherIcons - minimalistiskt fontpaket (12 glyfer),
     * SIL OFL 1.1. Climacons-inspirerat linjemanér, färgkodas av
     * ColorManager. Liten glyfuppsättning: snöblandat visas som regn och
     * intensitetsgrader ser likadana ut. CSS:en med klassmappningen ligger
     * i ikonmappen (kickstand-weather.css, länkas i index.html).
     * Licens: License.txt i ikonmappen. Källa: https://github.com/kickstandapps/WeatherIcons
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

// === ANIMERINGSLÄGE ===

/**
 * Detektera WebKit-klienter (Safari samt ALLA webbläsare på iPad/iPhone,
 * som är WebKit under huven). WebKit CPU-rastrerar animerade SVG:er i
 * <img> genom deras feGaussianBlur-filter varje bildruta - med ~10 ikoner
 * samtidigt laggar det. Auto-läget ger därför dessa klienter hero-only.
 * OBS: iPadOS uppger sig som "Macintosh" i user agent - avslöjas av
 * multi-touch (maxTouchPoints).
 * @returns {boolean} true om klienten bör få reducerad ikonanimering
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

    // Upplöst animeringsläge: 'all' | 'hero' | 'none'
    // ('auto' från config löses upp till 'all' eller 'hero' i setAnimationMode)
    animationMode: 'all',

    /**
     * Sätt aktivt ikonpaket (anropas från fetch-api-client när config hämtats)
     * @param {string} packName - Nyckel i ICON_PACKS
     */
    setActivePack(packName) {
        if (!packName || packName === this.activePack) return;

        if (ICON_PACKS[packName]) {
            this.activePack = packName;
            // Exponera aktivt paket för CSS - möjliggör paketspecifika
            // slot-regler (t.ex. amedia-meteo som ritar nättare än övriga)
            document.documentElement.dataset.iconPack = packName;
            console.log(`🎨 Ikonpaket bytt till: ${packName}`);
        } else {
            console.warn(`⚠️ Okänt ikonpaket '${packName}' - behåller '${this.activePack}'. Tillgängliga: ${Object.keys(ICON_PACKS).join(', ')}`);
        }
    },

    /**
     * Sätt ikonanimeringsläge (anropas från fetch-api-client när config hämtats)
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
     * Lös upp ikonpaketsrotation (ui.icon_pack_rotation) till dagens paket.
     * Deterministiskt ur datumet - alla klienter (kiosk, iPad, ...) landar
     * i samma paket utan servertillstånd eller synk. Paketlistan hämtas
     * ur ICON_PACKS-registryt (i manifestordning), aldrig hårdkodad:
     * paket som läggs till i registryt kommer med i rotationen automatiskt.
     * @param {Object} rotation - {enabled, interval: 'day'|'week'|'month', exclude: []}
     * @param {Date} at - Tidpunkt att lösa upp för (default nu; injicerbar för test)
     * @returns {string|null} Paketnamn, eller null om alla paket uteslutits
     */
    resolveRotationPack(rotation, at = new Date()) {
        const exclude = Array.isArray(rotation.exclude) ? rotation.exclude : [];
        const packs = Object.keys(ICON_PACKS).filter(p => !exclude.includes(p));
        if (packs.length === 0) {
            console.warn('⚠️ Ikonpaketsrotation: alla paket uteslutna - faller tillbaka på ui.icon_pack');
            return null;
        }

        // Monotona periodräknare (lokal tid) - inga hopp vid årsskiften
        const epochDays = Math.floor((at.getTime() - at.getTimezoneOffset() * 60000) / 86400000);
        let period;
        switch (rotation.interval) {
            case 'day':   period = epochDays; break;
            case 'month': period = at.getFullYear() * 12 + at.getMonth(); break;
            case 'week':  period = Math.floor((epochDays + 3) / 7); break; // epoch var en torsdag - +3 ger måndagsgräns
            default:
                console.warn(`⚠️ Ikonpaketsrotation: okänt intervall '${rotation.interval}' - använder 'week'`);
                period = Math.floor((epochDays + 3) / 7);
        }
        return packs[period % packs.length];
    },

    /**
     * Skapa väderikon-element för en SMHI-symbol med aktivt paket
     * @param {number} symbol - SMHI vädersymbol (1-27)
     * @param {boolean} isDay - Dag- eller nattvariant
     * @param {Array} extraClasses - Extra CSS-klasser (t.ex. storleksklass)
     * @returns {HTMLElement} <i>-element (font) eller <img>-element (svg)
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
            // Paket med egen baseClass ('owi', 'ksi', ...) renderas generiskt;
            // deras @font-face/klasser laddas via CSS länkad i index.html.
            // Weather Icons-fonten går via sin dedikerade renderare (wi-prefix
            // och inline font-family).
            if (pack.baseClass) {
                const icon = document.createElement('i');
                icon.className = [pack.baseClass, iconName, ...extraClasses].join(' ');
                return icon;
            }
            return WeatherIconRenderer.createIcon(iconName, extraClasses);
        }

        // SVG-paket: <img> med TVINGAD layoutbox på 1em (som en fontglyf,
        // se styles.css) - paketets scale justerar bara det visuella via
        // transform och kan aldrig spränga layouten
        //
        // ANIMERINGSLÄGE: hero-ikonen (aktuellt väder) identifieras på sin
        // CSS-klass från current-weather-view; övriga ikoner får statiska
        // filer när läget är 'hero' eller 'none'
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
