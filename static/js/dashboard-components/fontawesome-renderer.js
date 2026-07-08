/**
 * @file fontawesome-renderer.js
 * @version 1.1.0
 * @lastModified 2025-01-10
 * @description Font Awesome icon handling with centralized color coding
 * @dependencies ColorManager (color-manager.js)
 * @author Flask Weather Dashboard Team
 *
 * STEP 5 REFACTORING: Extracted from weather-icon-renderer.js
 * v1.1.0: Integrated with ColorManager for centralized color handling
 */

// === FONT AWESOME SYSTEM - CENTRALIZED COLOR CODING ===

/**
 * FontAwesome renderer for air quality and other icons
 * Uses ColorManager for consistent color handling
 */
class FontAwesomeRenderer {
    /**
     * Create air quality icon with color coding from ColorManager
     * @param {string} airQualityLevel - 'good', 'moderate', 'poor'
     * @returns {HTMLElement} Font Awesome leaf icon
     */
    static createLeafIcon(airQualityLevel = 'good') {
        const icon = document.createElement('i');
        icon.className = `fas fa-leaf air-quality-fa-icon`;
        icon.setAttribute('data-air-quality', airQualityLevel);

        // CENTRALIZED COLOR CODING: use ColorManager instead of hardcoded values
        icon.style.color = ColorManager.getAirQualityColor(airQualityLevel);
        icon.style.display = 'inline-block';

        return icon;
    }
}

console.log('✅ FontAwesome Renderer v1.1.0 laddat - ColorManager integration aktiverad!');
