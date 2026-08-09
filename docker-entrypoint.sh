#!/bin/sh
# Container entrypoint for the Flask Weather Dashboard.
#
# The image ships without configuration (reference/config.py holds Netatmo
# credentials and is kept out of the build context). This script supplies one
# at startup: from the /config volume if there is one, otherwise generated
# from reference/config_example.py — which is a working forecast-only setup
# for Stockholm, so a fresh container comes up with a live dashboard and the
# user edits config.py afterwards to move it to their own location.
set -e

CONFIG_DIR="${CONFIG_DIR:-/config}"
APP_CONFIG="/app/reference/config.py"
APP_CONFIG_JSON="/app/reference/config.json"
TEMPLATE="/app/reference/config_example.py"

# --- Configuration -----------------------------------------------------------
if [ -f "$APP_CONFIG" ] || [ -f "$APP_CONFIG_JSON" ]; then
    # config.py bind-mounted straight into reference/ — nothing to do.
    echo "✅ Konfiguration monterad i /app/reference/"
elif [ -f "$CONFIG_DIR/config.py" ]; then
    cp "$CONFIG_DIR/config.py" "$APP_CONFIG"
    echo "✅ Konfiguration inläst från $CONFIG_DIR/config.py"
elif [ -f "$CONFIG_DIR/config.json" ]; then
    cp "$CONFIG_DIR/config.json" "$APP_CONFIG_JSON"
    echo "✅ Konfiguration inläst från $CONFIG_DIR/config.json"
elif [ -d "$CONFIG_DIR" ] && [ -w "$CONFIG_DIR" ]; then
    cp "$TEMPLATE" "$CONFIG_DIR/config.py"
    cp "$TEMPLATE" "$APP_CONFIG"
    echo ""
    echo "📝 Första starten: konfigurationsmall skapad i $CONFIG_DIR/config.py"
    echo "   Appen startar nu med exempelvärdena (Stockholm, prognosläge utan Netatmo)."
    echo "   Ändra latitude/longitude/location_name i filen och starta om containern"
    echo "   för din egen plats — och fyll i Netatmo-uppgifterna om du har en station."
    echo ""
else
    cp "$TEMPLATE" "$APP_CONFIG"
    echo ""
    echo "⚠️ Ingen katalog monterad på $CONFIG_DIR — kör med exempelkonfigurationen"
    echo "   (Stockholm, prognosläge). Ändringar försvinner när containern tas bort."
    echo "   Montera en katalog, t.ex. -v ./config:/config, för egen konfiguration."
    echo ""
fi

# --- UV-index (CAMS via Copernicus ADS) --------------------------------------
# cdsapi reads ~/.cdsapirc. Generating it from an env var keeps the token out
# of both the image and the config file. Optional — UV additionally requires
# cams_uv.enabled = True in the config.
if [ -n "$CDSAPI_KEY" ]; then
    CDSAPI_HOME="${HOME:-/root}"
    printf 'url: %s\nkey: %s\n' \
        "${CDSAPI_URL:-https://ads.atmosphere.copernicus.eu/api}" \
        "$CDSAPI_KEY" > "$CDSAPI_HOME/.cdsapirc"
    chmod 600 "$CDSAPI_HOME/.cdsapirc"
    echo "✅ ~/.cdsapirc skapad från CDSAPI_KEY (UV-index via CAMS)"
fi

# --- Runtime state ------------------------------------------------------------
# Netatmo tokens, pressure history and the UV cache live here. Warn if it is
# not a mount: Netatmo rotates the refresh token, so losing cache/ on a rebuild
# means the login has to be redone by hand. Comparing device ids beats
# mountpoint(1), which is not guaranteed to exist in the slim base image.
mkdir -p /app/cache
if [ "$(stat -c %d /app/cache 2>/dev/null)" = "$(stat -c %d /app 2>/dev/null)" ]; then
    echo "⚠️ /app/cache är ingen monterad volym — Netatmo-token och tryckhistorik"
    echo "   försvinner när containern byggs om. Montera t.ex. ./cache:/app/cache."
fi

exec "$@"
