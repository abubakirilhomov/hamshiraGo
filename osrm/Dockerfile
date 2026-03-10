# Stage 1: Download OSM data using modern Ubuntu (has curl, working apt)
FROM ubuntu:22.04 AS downloader
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /data
RUN curl -L -o uzbekistan-latest.osm.pbf https://download.geofabrik.de/asia/uzbekistan-latest.osm.pbf

# Stage 2: Process and serve with OSRM
FROM osrm/osrm-backend:latest
WORKDIR /data
COPY --from=downloader /data/uzbekistan-latest.osm.pbf .
RUN osrm-extract -p /opt/car.lua uzbekistan-latest.osm.pbf && \
    osrm-partition uzbekistan-latest.osrm && \
    osrm-customize uzbekistan-latest.osrm && \
    rm uzbekistan-latest.osm.pbf

EXPOSE 5000
CMD ["osrm-routed", "--algorithm=MLD", "--max-table-size=10000", "uzbekistan-latest.osrm", "--port", "5000"]
