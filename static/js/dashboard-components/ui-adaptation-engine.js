/**
 * UI Adaptation Engine - STEG 9 REFAKTORERING
 * FAS 3: Graciös UI-degradering extraherat från dashboard.js
 * Hanterar Netatmo-oberoende visning och layout-anpassningar
 */

// === FAS 3: UI DEGRADERING SYSTEM ===

/**
 * Hantera visning/döljning av UI-element baserat på Netatmo-tillgänglighet
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

    // Applicera CSS-klasser för layout-anpassningar
    applyCSSAdaptations(netatmoAvailable);

    console.log(`✅ FAS 3: UI-anpassningar tillämpade`);
}

/**
 * HUMIDITY FIX: Anpassa luftfuktighet-sektionen beroende på data-tillgänglighet
 */
function adaptHumiditySection(netatmoAvailable) {
    const humidityElement = document.getElementById('smhi-humidity');

    // Kontrollera om vi har luftfuktighetsdata från någon källa
    const hasHumidityData = (netatmoAvailable && dashboardState.dataAvailability.netatmoHumidity) ||
                           dashboardState.dataAvailability.smhiHumidity;

    if (!hasHumidityData) {
        // HUMIDITY FIX: Dölj luftfuktighet helt när ingen data finns
        if (humidityElement) {
            humidityElement.classList.add('netatmo-hidden');
            console.log('🙈 HUMIDITY FIX: Luftfuktighet-element dolt - ingen data tillgänglig');
        }
    } else {
        // Visa luftfuktighet när data finns
        if (humidityElement) {
            humidityElement.classList.remove('netatmo-hidden');
            console.log('👁️ HUMIDITY FIX: Luftfuktighet-element visat - data tillgänglig');
        }
    }
}

/**
 * Anpassa temperatur-sektionen beroende på Netatmo-tillgänglighet
 * SWAPPED: Faktisk (Netatmo) visas som primär/stor, Prognos (SMHI) som sekundär/liten.
 * Vid SMHI-only/Netatmo ej tillgänglig: Prognos-kolumnen döljs, SMHI visas i den primära positionen.
 */
function adaptTemperatureSection(netatmoAvailable) {
    const prognosSection = document.querySelector('.prognos-column');
    const tempUnit = document.querySelector('.temp-unit');

    if (!netatmoAvailable) {
        // Dölj PROGNOS-kolumnen (den sekundära/lilla)
        if (prognosSection) {
            prognosSection.classList.add('netatmo-hidden');
            console.log('🙈 FAS 3: PROGNOS-kolumn dold (SMHI-only mode)');
        }

        // Justera container för centrerad layout med enbart en temperatur
        if (tempUnit) {
            tempUnit.classList.add('single-temperature-mode');
        }
    } else {
        // Visa PROGNOS-kolumnen när Netatmo är tillgängligt (båda visas)
        if (prognosSection) {
            prognosSection.classList.remove('netatmo-hidden');
        }

        if (tempUnit) {
            tempUnit.classList.remove('single-temperature-mode');
        }
    }
}

/**
 * Anpassa luftkvalitet-sektionen
 */
function adaptAirQualitySection(netatmoAvailable) {
    const airQualityContainer = document.querySelector('.air-quality-container');

    if (!netatmoAvailable) {
        // FAS 3: Dölj CO2/luftkvalitet
        if (airQualityContainer) {
            airQualityContainer.classList.add('netatmo-hidden');
            console.log('🙈 FAS 3: Luftkvalitet-sektion dold');
        }
    } else {
        // FAS 3: Visa CO2/luftkvalitet
        if (airQualityContainer) {
            airQualityContainer.classList.remove('netatmo-hidden');
        }
    }
}

/**
 * Anpassa etiketter beroende på datakällor
 * SWAPPED: Vid SMHI-only visas SMHI-temp i den primära (stora) positionen
 * med etiketten "TEMPERATUR" (under netatmo-label i faktisk-kolumnen).
 */
function adaptLabels(netatmoAvailable) {
    const netatmoLabel = document.querySelector('.netatmo-label');
    const smhiLabel = document.querySelector('.smhi-label');

    if (!netatmoAvailable) {
        // SMHI-only: Visa "TEMPERATUR" som etikett under den stora temperaturen
        if (netatmoLabel) {
            netatmoLabel.textContent = 'TEMPERATUR';
            console.log('🏷️ FAS 3: Primär etikett ändrad till "TEMPERATUR"');
        }
    } else {
        // Båda källor: Återställ etiketter
        if (netatmoLabel) {
            netatmoLabel.textContent = 'FAKTISK';
        }
        if (smhiLabel) {
            smhiLabel.textContent = 'PROGNOS';
        }
    }
}

/**
 * Applicera CSS-klasser för layout-anpassningar
 */
function applyCSSAdaptations(netatmoAvailable) {
    const weatherDetailsGrid = document.querySelector('.data-points-grid');
    const smhiMainCard = document.querySelector('.smhi-main-card');

    if (!netatmoAvailable) {
        // FAS 3: Lägg till SMHI-only klasser
        if (weatherDetailsGrid) {
            weatherDetailsGrid.classList.add('smhi-only-mode');
        }

        if (smhiMainCard) {
            smhiMainCard.classList.add('smhi-only-mode');
        }

        console.log('🎨 FAS 3: SMHI-only CSS-klasser tillämpade');
    } else {
        // FAS 3: Ta bort SMHI-only klasser
        if (weatherDetailsGrid) {
            weatherDetailsGrid.classList.remove('smhi-only-mode');
        }

        if (smhiMainCard) {
            smhiMainCard.classList.remove('smhi-only-mode');
        }
    }
}

/**
 * Dynamiskt dölja/visa element baserat på data-tillgänglighet
 */
function adaptElementVisibility() {
    // HUMIDITY FIX: Kontrollera luftfuktighet separat
    adaptHumiditySection(isNetatmoAvailable());

    // Dölj andra element som inte har data
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
