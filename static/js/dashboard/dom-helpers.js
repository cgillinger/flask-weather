/**
 * DOM Helpers - STEP 3 REFACTORING
 * DOM manipulation and helper functions
 * Extracted from dashboard.js for modular structure
 */

// === BASIC DOM UPDATE ===

/**
 * Update text content for element with ID
 * @param {string} id - Element ID
 * @param {string} content - Text content to set
 */
function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
    }
}

/**
 * Update HTML content for element with ID
 * @param {string} id - Element ID
 * @param {string} htmlContent - HTML content to set
 */
function updateElementHTML(id, htmlContent) {
    const element = document.getElementById(id);
    if (element) {
        element.innerHTML = htmlContent;
    }
}

// === OPTIMERAD SOL-TIDSUPPDATERING ===

/**
 * Optimized update of sun times with smart span handling
 * @param {string} elementId - Element ID for sun time
 * @param {string} timeOnly - Tid att visa (t.ex. "06:30")
 */
function updateSunTimeOptimized(elementId, timeOnly) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let textSpan = element.querySelector('span');
    
    if (textSpan) {
        textSpan.textContent = timeOnly;
    } else {
        const icon = element.querySelector('i');
        if (icon) {
            const children = Array.from(element.childNodes);
            children.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    child.remove();
                }
            });
            
            textSpan = document.createElement('span');
            textSpan.textContent = timeOnly;
            element.appendChild(textSpan);
        }
    }
}

// === TID/DAG-LOGIK ===

// Sunrise/sunset as minutes since midnight, fed from /api/current by
// setSunTimes(). Stored as minutes rather than Date objects on purpose: if the
// sun payload goes stale (the API keeps serving yesterday's date), the times of
// day are still right to within a couple of minutes, whereas a Date comparison
// would classify the whole day as night.
let sunriseMinutes = null;
let sunsetMinutes = null;

// Used until the first /api/current response arrives, and if it carries no sun times.
const FALLBACK_SUNRISE_MINUTES = 6 * 60;
const FALLBACK_SUNSET_MINUTES = 20 * 60;

/**
 * Convert an ISO timestamp to minutes since midnight
 * @param {string} isoString - Local ISO timestamp, e.g. "2026-08-15T05:03:00"
 * @returns {number|null} Minutes since midnight, or null if unparsable
 */
function sunTimeToMinutes(isoString) {
    if (!isoString) return null;

    const time = new Date(isoString);
    if (isNaN(time.getTime())) return null;

    return time.getHours() * 60 + time.getMinutes();
}

/**
 * Store the sun times the day/night icon logic keys off
 * @param {object} sunData - The `sun` object from /api/current (may be missing)
 */
function setSunTimes(sunData) {
    sunriseMinutes = sunTimeToMinutes(sunData && sunData.sunrise);
    sunsetMinutes = sunTimeToMinutes(sunData && sunData.sunset);
}

/**
 * Check whether a given time of day falls between sunrise and sunset
 * @param {number} minutes - Minutes since midnight
 * @returns {boolean} True if it is daytime
 */
function isDaytimeAtMinutes(minutes) {
    const sunrise = sunriseMinutes !== null ? sunriseMinutes : FALLBACK_SUNRISE_MINUTES;
    const sunset = sunsetMinutes !== null ? sunsetMinutes : FALLBACK_SUNSET_MINUTES;

    return minutes >= sunrise && minutes < sunset;
}

/**
 * Check if it is daytime right now
 * @returns {boolean} True if it is daytime
 */
function isDaytime() {
    const now = new Date();
    return isDaytimeAtMinutes(now.getHours() * 60 + now.getMinutes());
}

/**
 * Check if a whole hour falls in daytime (used by the hourly forecast cards)
 * @param {number} hour - Hour of day, 0-23
 * @returns {boolean} True if it is daytime
 */
function isDaytimeAtHour(hour) {
    return isDaytimeAtMinutes(hour * 60);
}

console.log('✅ STEP 3: DOM Helpers loaded - 4 functions extracted!');