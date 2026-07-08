/**
 * Circular Clock - STEP 6 REFACTORING
 * Clock system with LED dots and digital display
 * Extracted from dashboard.js for modular structure
 */

// === CONSTANTS ===
const CLOCK_UPDATE_INTERVAL = 1000; // 1 second for the clock

// === CIRCULAR CLOCK SYSTEM ===

/**
 * Create 60 LED dots arranged in a perfect circle
 */
function createClockDots() {
    const container = document.querySelector('.clock-dots-container');
    if (!container) {
        console.warn('⚠️ Clock dots container not found');
        return;
    }

    // Clear existing dots
    container.innerHTML = '';

    // Create 60 dots (one for each second)
    for (let i = 0; i < 60; i++) {
        const dot = document.createElement('div');
        dot.className = 'clock-dot';
        dot.setAttribute('data-second', i);

        // Compute position (clockwise from the top, 12 o'clock = 0 degrees)
        const angle = (i * 6) - 90; // 6 degrees per second, -90 to start from the top
        const angleRad = (angle * Math.PI) / 180;

        // Position on the circle's edge (45% of container width from center)
        const radius = 45; // percent
        const x = 50 + radius * Math.cos(angleRad);
        const y = 50 + radius * Math.sin(angleRad);

        dot.style.left = `${x}%`;
        dot.style.top = `${y}%`;
        dot.style.transform = 'translate(-50%, -50%)';

        container.appendChild(dot);
    }

    console.log('🕐 60 klock-prickar skapade i cirkel');
}

/**
 * Update the circular clock with time, date and second dots
 */
function updateCircularClock() {
    const now = new Date();

    // Update digital time (HH:MM)
    const timeString = now.toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const clockTimeElement = document.querySelector('.clock-time');
    if (clockTimeElement) {
        clockTimeElement.textContent = timeString;
    }

    // Update date - LANGUAGE: weekday/month via Intl with the active language's locale
    const locale = I18n.locale();
    const weekday = now.toLocaleDateString(locale, { weekday: 'long' });
    const day = now.getDate();
    const month = now.toLocaleDateString(locale, { month: 'long' });

    const dateString = `${weekday}, ${day} ${month}`;

    const clockDateElement = document.querySelector('.clock-date');
    if (clockDateElement) {
        clockDateElement.textContent = dateString;
    }

    // Update second dots
    updateClockDots(now.getSeconds());
}

/**
 * Update second dots based on the current second
 */
function updateClockDots(currentSeconds) {
    const dots = document.querySelectorAll('.clock-dot');

    dots.forEach((dot, index) => {
        const secondValue = parseInt(dot.getAttribute('data-second'));

        if (secondValue <= currentSeconds) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });

    // At second 0, clear all dots first
    if (currentSeconds === 0) {
        setTimeout(() => {
            dots.forEach(dot => dot.classList.remove('active'));
            setTimeout(() => {
                const firstDot = document.querySelector('.clock-dot[data-second="0"]');
                if (firstDot) {
                    firstDot.classList.add('active');
                }
            }, 100);
        }, 50);
    }
}

/**
 * Initialize the circular clock
 * @param {object} dashboardState - Dashboard state object for storing the interval
 * @returns {number} Interval ID for the clock
 */
function initializeCircularClock(dashboardState) {
    console.log('🕐 Initialiserar cirkulär klocka...');
    createClockDots();
    updateCircularClock();
    const clockInterval = setInterval(updateCircularClock, CLOCK_UPDATE_INTERVAL);

    // Store the interval in dashboard state if available
    if (dashboardState) {
        dashboardState.clockInterval = clockInterval;
    }

    console.log('✅ Cirkulär klocka initialiserad med sekundprickar');
    return clockInterval;
}

// === EXPORT CIRCULAR CLOCK SYSTEM ===
window.CircularClock = {
    createClockDots,
    updateCircularClock,
    updateClockDots,
    initializeCircularClock,
    CLOCK_UPDATE_INTERVAL
};

console.log('✅ STEG 6: Circular Clock laddat - 4 funktioner extraherade!');
