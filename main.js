import { asyncqueue } from "./asyncqueue.js";
import { mbAccessToken } from "./tokens.js";
import { openDB } from "https://unpkg.com/idb/with-async-ittr.js?module";

async function heatmap(map, app) {
  const locs = await app.getLocations();
  const features = locs.map(function(loc) {
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: [loc.longitude, loc.latitude]
      }
    };
  });
  map.addSource("reports", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: features
    }
  });

  map.addLayer({
    "id": "reports",
    "type": "heatmap",
    "source": "reports"
  });
}

async function loop(positions, db, map) {
  const position = await positions.poll();

  // Add location to database.
  await db.add("locations", {
    timestamp: position.timestamp,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  });

  // Encode to OLC.
  const olc = OpenLocationCode.encode(
    position.coords.latitude,
    position.coords.longitude);
  console.debug(olc);

  return loop(positions, db, map);
}

export default async function(container) {
  console.debug("Opening Locations database.");
  const db = await openDB("Locations", 1, {
    upgrade(db) {
      console.debug("Initializing Locations database.");
      const store = db.createObjectStore("locations", { keyPath: "id", autoIncrement: true });
      store.createIndex("timestamp", "timestamp", { unique: true });
    }
  });

  const locations = await db.getAllFromIndex("locations", "timestamp");

  const defaultCenter = [103.8476543, 1.2796634];

  // Init Mapbox.
  const map = new mapboxgl.Map({
    accessToken: mbAccessToken(),
    container: container.id,
    style: "mapbox://styles/mapbox/dark-v10",
    center: (
      locations.length == 0 ? defaultCenter : [
        locations[0].longitude,
        locations[1].latitude
      ]
    ),
    zoom: 15
  });

  // Disable rotation and zoom.
  map.doubleClickZoom.disable();
  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();

  const control = new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true
  });
  map.addControl(control);

  const positions = asyncqueue();
  control.on("geolocate", positions.offer);
  control.on("error", positions.fail);

  const app = {
    map: map,
    async getLocations() {
      return db.getAllFromIndex("locations", "timestamp");
    }
  };

  // Load map and center.
  map.on("load", async function() {

    heatmap(map, app);

    try {
      // Main loop.
      await loop(positions, db, map);
    } catch(err) {
      console.error(err);
    }
  });

  return app;
}
