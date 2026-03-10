FROM osrm/osrm-backend:latest

WORKDIR /data

# Install curl (wget not available in base image)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Download Uzbekistan OSM data from Geofabrik (~70MB)
RUN curl -L -o uzbekistan-latest.osm.pbf https://download.geofabrik.de/asia/uzbekistan-latest.osm.pbf

# Preprocess with MLD algorithm (faster restarts, good for our scale)
RUN osrm-extract -p /opt/car.lua uzbekistan-latest.osm.pbf && \
    osrm-partition uzbekistan-latest.osrm && \
    osrm-customize uzbekistan-latest.osrm

EXPOSE 5000

CMD ["osrm-routed", "--algorithm=MLD", "--max-table-size=10000", "uzbekistan-latest.osrm", "--port", "5000"]
