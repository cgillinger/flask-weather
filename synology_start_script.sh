#!/bin/sh
# =============================================================================
# FLASK WEATHER DASHBOARD - SYNOLOGY STARTUP SCRIPT EXAMPLE
# =============================================================================
# 📁 File: start_weather_example.sh
# 🎯 Purpose: Start the weather dashboard automatically on Synology NAS
# 📝 Setup: Copy to start_weather.sh and customize for your system
#
# INSTRUCTIONS:
# 1. Copy this file: cp start_weather_example.sh start_weather.sh
# 2. Edit the variables below for your system
# 3. Make executable: chmod +x start_weather.sh
# 4. Test: ./start_weather.sh
# 5. Add to DSM Task Scheduler
# =============================================================================

# === CUSTOMIZE THESE VARIABLES FOR YOUR SYSTEM ===

# Your username on Synology (change from "ditt-användarnamn")
USERNAME="ditt-användarnamn"

# Project directory (usually correct as is)
PROJECT_DIR="/var/services/homes/${USERNAME}/flask-weather"

# Python path (usually correct as is)
PYTHON_PATH="/bin/python3"

# Port for dashboard (8036 is default, change if desired)
PORT="8036"

# Loggfil (sparas i projektkatalogen)
LOG_FILE="${PROJECT_DIR}/weather.log"
PID_FILE="${PROJECT_DIR}/weather.pid"

# === DO NOT CHANGE ANYTHING BELOW THIS LINE ===

echo "🟢 Startar Flask Weather Dashboard..."
echo "👤 Användare: ${USERNAME}"
echo "📁 Projekt: ${PROJECT_DIR}"
echo "🚪 Port: ${PORT}"
echo "📝 Logg: ${LOG_FILE}"
echo "🕐 Tid: $(date)"

# Kontrollera att projektkatalogen existerar
if [ ! -d "${PROJECT_DIR}" ]; then
    echo "❌ FEL: Projektkatalog finns inte: ${PROJECT_DIR}"
    echo "💡 Kontrollera att USERNAME är korrekt och att flask-weather är nedladdat"
    exit 1
fi

# Go to project directory
cd "${PROJECT_DIR}" || {
    echo "❌ FEL: Kan inte navigera till ${PROJECT_DIR}"
    exit 1
}

# Kontrollera att app.py finns
if [ ! -f "app.py" ]; then
    echo "❌ FEL: app.py finns inte i ${PROJECT_DIR}"
    echo "💡 Kontrollera att flask-weather är korrekt nedladdat"
    exit 1
fi

# Logga systeminformation
echo "=== FLASK WEATHER DASHBOARD START ===" >> "${LOG_FILE}"
echo "Tid: $(date)" >> "${LOG_FILE}"
echo "Katalog: $(pwd)" >> "${LOG_FILE}"
echo "Python: $(${PYTHON_PATH} --version 2>&1)" >> "${LOG_FILE}"
echo "Användare: $(whoami)" >> "${LOG_FILE}"

# Check if dashboard is already running
if [ -f "${PID_FILE}" ]; then
    OLD_PID=$(cat "${PID_FILE}")
    if kill -0 "${OLD_PID}" 2>/dev/null; then
        echo "⚠️ Dashboard körs redan (PID: ${OLD_PID})"
        echo "🛑 Stoppar befintlig process..."
        kill "${OLD_PID}"
        sleep 2
    fi
    rm -f "${PID_FILE}"
fi

# Starta Flask i bakgrunden
echo "🚀 Startar Flask-server..."
nohup "${PYTHON_PATH}" app.py >> "${LOG_FILE}" 2>&1 &
FLASK_PID=$!

# Save PID for future stopping
echo "${FLASK_PID}" > "${PID_FILE}"

# Wait a moment and check that the process started
sleep 3
if kill -0 "${FLASK_PID}" 2>/dev/null; then
    echo "✅ Dashboard startad framgångsrikt!"
    echo "📊 URL: http://$(hostname):${PORT}"
    echo "🔢 Process ID: ${FLASK_PID}"
    echo "📝 Loggar: ${LOG_FILE}"
    echo "🛑 Stoppa med: kill ${FLASK_PID}"
else
    echo "❌ FEL: Dashboard kunde inte startas"
    echo "📝 Kontrollera loggar: ${LOG_FILE}"
    rm -f "${PID_FILE}"
    exit 1
fi

# Log successful start
echo "✅ Dashboard startad framgångsrikt (PID: ${FLASK_PID})" >> "${LOG_FILE}"
echo "=========================================" >> "${LOG_FILE}"

echo ""
echo "🎉 Flask Weather Dashboard är nu igång!"
echo "📱 Öppna i webbläsare: http://$(hostname):${PORT}"