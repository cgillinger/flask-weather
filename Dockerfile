# Flask Weather Dashboard — container image.
#
# Built and published automatically by .github/workflows/docker-publish.yml to
# ghcr.io/cgillinger/flask-weather (multi-arch: amd64 + arm64), so a Synology
# NAS or a Raspberry Pi can pull a ready-made image instead of building.
#
# The image deliberately contains NO configuration: reference/config.py holds
# Netatmo credentials and is excluded via .dockerignore. Config is supplied at
# runtime through the /config volume — see docker-entrypoint.sh.

FROM python:3.12-slim

# TZ matters more than usual here: app.py uses naive datetime.now() for sun
# times, the update schedule and the nightly UV refresh. A container defaults
# to UTC, which would shift the whole dashboard by 1-2 hours.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Europe/Stockholm \
    CONFIG_DIR=/config

# tzdata: local time (see above). curl: HEALTHCHECK below.
RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies first so the layer is cached across code changes. netCDF4 and
# numpy ship manylinux wheels for both amd64 and arm64, so nothing compiles.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x /app/docker-entrypoint.sh

# Runtime state: rotated Netatmo refresh tokens, pressure history and the UV
# cache. Mount a volume here — without it the Netatmo login breaks on the next
# image update, since the stored refresh token is the only valid one.
RUN mkdir -p /app/cache

EXPOSE 8036

# /api/status answers as soon as waitress is up; the start period covers the
# first weather fetch.
HEALTHCHECK --interval=60s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fsS http://localhost:8036/api/status || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["python", "app.py"]
