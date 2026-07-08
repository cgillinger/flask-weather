/**
 * UI Adaptation Engine - STEP 9 REFACTORING
 * PHASE 3: Graceful UI degradation extracted from dashboard.js
 * Handles Netatmo-independent display and layout adaptations
 */

// === FAS 3: UI DEGRADERING SYSTEM ===

/**
 * Handle showing/hiding of UI elements based on Netatmo availability
 */
function applyUIAdaptations() {
    const netatmoAvailable = isNetatmoAvailable();

    console.log(`🎨 FAS 3: Tillämpar UI-anpassningar (Netatmo: ${netatmoAvailable ? 'TILLGÄNGLIG' : 'DOLD'})`);

    // Hantera temperatur-sektion
    adaptTemperatureSection(netatmoAvailable);

    // Hantera CO2/luftkvalitet
    adaptAirQualitySection(netatmoAvailable);

    // HUMIDITY FIX: Hantera luftfuktighet-visning
    adaptHumiditySection(netatmoAvailable);

    // Hantera labels/etiketter
    adaptLabels(netatmoAvailable);

    // Apply CSS classes for layout adaptations
    applyCSSAdaptations(netatmoAvailable);

    console.log(`✅ FAS 3: UI-anpassningar tillämpade`);
}

/**
 * HUMIDITY FIX: Adapt humidity section based on data availability
 */
function adaptHumiditySection(netatmoAvailable) {
    const humidityElement = document.getElementById('smhi-humidity');

    // Check if we have humidity data from any source
    const hasHumidityData = (netatmoAvailable && dashboardState.dataAvailability.netatmoHumidity) ||
                           dashboardState.dataAvailability.smhiHumidity;

    if (!hasHumidityData) {
        // HUMIDITY FIX: Hide humidity completely when no data exists
        if (humidityElement) {
            humidityElement.classList.add('netatmo-hidden');
            console.log('🙈 HUMIDITY FIX: Luftfuktighet-element dolt - ingen data tillgänglig');
        }
    } else {
        // Show humidity when data exists
        if (humidityElement) {
            humidityElement.classList.remove('netatmo-hidden');
            console.log('👁️ HUMIDITY FIX: Luftfuktighet-element visat - data tillgänglig');
        }
    }
}

/**
 * Adapt temperature section based on Netatmo availability
 * SWAPPED: Actual (Netatmo) shown as primary/large, Forecast (SMHI) as secondary/small.
 * With SMHI-only/Netatmo unavailable: Forecast column is hidden, SMHI shown in primary position.
 */
function adaptTemperatureSection(netatmoAvailable) {
    const prognosSection = document.querySelector('.prognos-column');
    const tempUnit = document.querySelector('.temp-unit');

    if (!netatmoAvailable) {
        // Hide FORECAST column (the secondary/small one)
        if (prognosSection) {
            prognosSection.classList.add('netatmo-hidden');
            console.log('🙈 FAS 3: PROGNOS-kolumn dold (SMHI-only mode)');
        }

        // Adjust container for centered layout with only one temperature
        if (tempUnit) {
            tempUnit.classList.add('single-temperature-mode');
        }
    } else {
        // Show FORECAST column when Netatmo is available (both shown)
        if (prognosSection) {
            prognosSection.classList.remove('netatmo-hidden');
        }

        if (tempUnit) {
            tempUnit.classList.remove('single-temperature-mode');
        }
    }
}

/**
 * Adapt air quality section.
 * Visibility is now entirely owned by AirQualityDisplay.update() (which runs after this
 * and knows about air_quality.mode + outdoor data). This function is therefore a
 * deliberate no-op - left in place so the call in applyUIAdaptations() doesn't need to change.
 */
function adaptAirQualitySection(netatmoAvailable) {
    // Avsiktligt tom - se AirQualityDisplay (air-quality-display.js).
}

/**
 * Adapt labels based on data sources
 * SWAPPED: With SMHI-only SMHI-temp shown in primary (large) position
 * with the label "TEMPERATURE" (under netatmo-label in actual column).
 */
function adaptLabels(netatmoAvailable) {
    const netatmoLabel = document.querySelector('.netatmo-label');
    const smhiLabel = document.querySelector('.smhi-label');

    if (!netatmoAvailable) {
        // SMHI-only: Show "TEMPERATURE" as label under the large temperature
        if (netatmoLabel) {
            netatmoLabel.textContent = t('LABEL_TEMPERATURE');
            console.log('🏷️ FAS 3: Primär etikett ändrad till "TEMPERATUR"');
        }
    } else {
        // Both sources: Restore labels
        if (netatmoLabel) {
            netatmoLabel.textContent = t('LABEL_ACTUAL');
        }
        if (smhiLabel) {
            smhiLabel.textContent = t('LABEL_FORECAST');
        }
    }
}

/**
 * Apply CSS classes for layout adaptations
 */
function applyCSSAdaptations(netatmoAvailable) {
    const weatherDetailsGrid = document.querySelector('.data-points-grid');
    const smhiMainCard = document.querySelector('.smhi-main-card');

    if (!netatmoAvailable) {
        // PHASE 3: Add SMHI-only classes
        if (weatherDetailsGrid) {
            weatherDetailsGrid.classList.add('smhi-only-mode');
        }

        if (smhiMainCard) {
            smhiMainCard.classList.add('smhi-only-mode');
        }

        console.log('🎨 PHASE 3: SMHI-only CSS classes applied');
    } else {
        // PHASE 3: Remove SMHI-only classes
        if (weatherDetailsGrid) {
            weatherDetailsGrid.classList.remove('smhi-only-mode');
        }

        if (smhiMainCard) {
            smhiMainCard.classList.remove('smhi-only-mode');
        }
    }
}

/**
 * Dynamically hide/show elements based on data availability
 */
function adaptElementVisibility() {
    // HUMIDITY FIX: Check humidity separately
    adaptHumiditySection(isNetatmoAvailable());

    // Hide other elements that have no data
    const elementsToCheck = [
        {
            selector: '.air-quality-container',
            dataCheck: () => getDataSource('co2').available
        }
    ];

    elementsToCheck.forEach(({ selector, dataCheck }) => {
        const element = document.querySelector(selector);
        if (element) {
            if (dataCheck()) {
                element.classList.remove('data-unavailable');
            } else {
                element.classList.add('data-unavailable');
            }
        }
    });
}

console.log('✅ STEG 9: UI Adaptation Engine laddat - 7 funktioner extraherade!');
